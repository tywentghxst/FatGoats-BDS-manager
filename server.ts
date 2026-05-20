/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import multer from "multer";
import AdmZip from "adm-zip";
import { createServer as createViteServer } from "vite";
import http from "http";
import https from "https";
import pkg from "express";

const { json, urlencoded } = pkg;

const app = express();
const PORT = 3000;

app.use(json({ limit: "50mb" }));
app.use(urlencoded({ extended: true, limit: "50mb" }));

// Directory structure setup
const WORK_DIR = process.cwd();
const SERVER_DIR = path.join(WORK_DIR, "bedrock-server");
const UPLOADS_DIR = path.join(WORK_DIR, "uploads");
const DB_FILE = path.join(SERVER_DIR, "manager_db.json");

if (!fs.existsSync(SERVER_DIR)) {
  fs.mkdirSync(SERVER_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer Upload Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Database Interface & Global State
interface DBStructure {
  users: Array<{
    username: string;
    passwordHash: string;
    salt: string;
    role: "admin" | "viewer";
    registeredAt: string;
  }>;
  appConfig: {
    bentoStyle: boolean;
    serverPort: number;
    maxPlayers: number;
    levelName: string;
    difficulty: string;
    gamemode: string;
    simulationMode: boolean;
    selectedVersion: string;
  };
  addons: Array<{
    uuid: string;
    version: number[];
    name: string;
    description: string;
    type: "behavior" | "resource" | "world";
    icon?: string;
    folderName: string;
    isEnabled: boolean;
    originalName?: string;
    groupId?: string;
    uploadedAt?: string;
    downloadUrl?: string;
  }>;
  pastLogs: Array<{
    id: string;
    name: string;
    description: string;
    status: "completed" | "failed";
    message: string;
    timestamp: string;
  }>;
  invites: Array<{
    token: string;
    role: "admin" | "viewer";
    createdAt: string;
    used: boolean;
    usedBy?: string;
  }>;
}

let dbCache: DBStructure = {
  users: [],
  appConfig: {
    bentoStyle: true,
    serverPort: 19132,
    maxPlayers: 20,
    levelName: "BedrockWorld",
    difficulty: "normal",
    gamemode: "survival",
    simulationMode: true, // Default to simulation mode for Cloud Run compatibility
    selectedVersion: "1.21.60"
  },
  addons: [],
  pastLogs: [],
  invites: []
};

// Load or Setup database
function loadDB() {
  if (fs.existsSync(DB_FILE)) {
    try {
      dbCache = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      // Ensure key arrays are present
      dbCache.invites = dbCache.invites || [];
      dbCache.addons = dbCache.addons || [];
    } catch (e) {
      console.error("Failed to parse database, resetting", e);
      saveDB();
    }
  } else {
    saveDB();
  }
}

function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(dbCache, null, 2), "utf-8");
}

loadDB();

// Global runtime state
let serverProcess: ChildProcessWithoutNullStreams | null = null;
let serverStatus: "stopped" | "starting" | "running" | "stopping" = "stopped";
let serverUptimeStart: number | null = null;
let serverLogs: Array<{ timestamp: string; type: "INFO" | "WARN" | "ERROR" | "PLAYER" | "SYS"; message: string }> = [];
let activeTasks: Array<{
  id: string;
  name: string;
  description: string;
  progress: number;
  status: "pending" | "running" | "completed" | "failed";
  message: string;
  timestamp: string;
}> = [];

// Session / Simple token store
const activeTokens: Record<string, { username: string; role: "admin" | "viewer" }> = {};

// Add logs with timestamp
function logServerMessage(type: "INFO" | "WARN" | "ERROR" | "PLAYER" | "SYS", message: string) {
  const line = {
    timestamp: new Date().toISOString(),
    type,
    message
  };
  serverLogs.push(line);
  if (serverLogs.length > 500) {
    serverLogs.shift();
  }
  console.log(`[BedrockServer][${type}] ${message}`);
}

logServerMessage("SYS", "Bedrock Server Manager Backend initialized.");

// Password Hashing Helper
function hashPassword(password: string, salt: string): string {
  return crypto.createHmac("sha256", salt).update(password).digest("hex");
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

// Authentication Middleware
function authenticateRequest(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized access. No session token provided." });
    return;
  }
  const token = authHeader.split(" ")[1];
  const userSession = activeTokens[token];
  if (!userSession) {
    res.status(401).json({ error: "Session expired or invalid. Please login again." });
    return;
  }
  (req as any).user = userSession;
  next();
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = (req as any).user;
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Access denied. Action requires Admin privileges." });
    return;
  }
  next();
}

// Spawning/Simulation state managers
let simulatedStatsInterval: NodeJS.Timeout | null = null;
let cpuUsageVal = 0;
let ramUsageVal = 0;
let tpsVal = 20.0;
let simulatedPlayers: Array<{ name: string; ping: number; joinedAt: string }> = [];

// Helper helper for simulation log ticks
function startSimulationTicks() {
  if (simulatedStatsInterval) clearInterval(simulatedStatsInterval);
  simulatedStatsInterval = setInterval(() => {
    if (serverStatus === "running") {
      cpuUsageVal = parseFloat((10 + Math.random() * 35).toFixed(1));
      ramUsageVal = parseFloat((1.5 + Math.random() * 1.8).toFixed(2));
      tpsVal = parseFloat((19.5 + Math.random() * 0.5).toFixed(1));

      // Occasionally add or remove players for realistic log history
      if (Math.random() < 0.15) {
        const potentialNames = ["Steve", "Alex", "CreeperHunter", "DiamondDigger", "NoobSlayer99", "BedrockPro", "GamerX"];
        if (simulatedPlayers.length < dbCache.appConfig.maxPlayers && (simulatedPlayers.length === 0 || Math.random() > 0.5)) {
          // Add a player
          const unusedNames = potentialNames.filter(n => !simulatedPlayers.some(p => p.name === n));
          if (unusedNames.length > 0) {
            const chosenName = unusedNames[Math.floor(Math.random() * unusedNames.length)];
            simulatedPlayers.push({ name: chosenName, ping: Math.floor(10 + Math.random() * 80), joinedAt: new Date().toISOString() });
            logServerMessage("PLAYER", `${chosenName} joined the game.`);
          }
        } else if (simulatedPlayers.length > 0) {
          // Remove a player
          const removeIdx = Math.floor(Math.random() * simulatedPlayers.length);
          const leavingPlayer = simulatedPlayers[removeIdx];
          simulatedPlayers.splice(removeIdx, 1);
          logServerMessage("PLAYER", `${leavingPlayer.name} left the game.`);
        }
      }

      // Add a simple server log tick sometimes
      if (Math.random() < 0.08) {
        const infoLogs = [
          "Auto-save complete. Spanning active world database.",
          "Tick lag okay (average latency is under 30ms).",
          "Synchronized active worlds and settings successfully.",
          "Garbage collector run complete (cleaned up 512 chunks)."
        ];
        logServerMessage("INFO", infoLogs[Math.floor(Math.random() * infoLogs.length)]);
      }
    }
  }, 5000);
}

// Bedrock Dedicated Server Updater / Configurator
function writeServerProperties() {
  const levelName = dbCache.appConfig.levelName || "BedrockWorld";
  const port = dbCache.appConfig.serverPort || 19132;
  const maxPlayers = dbCache.appConfig.maxPlayers || 20;
  const difficulty = dbCache.appConfig.difficulty || "normal";
  const gamemode = dbCache.appConfig.gamemode || "survival";

  const propFile = path.join(SERVER_DIR, "server.properties");
  const defaultPropContent = `server-name=Bedrock Manager Server
gamemode=${gamemode}
difficulty=${difficulty}
allow-cheats=true
max-players=${maxPlayers}
server-port=${port}
server-portv6=${port + 1}
online-mode=false
level-name=${levelName}
view-distance=10
tick-distance=4
player-movement-score-threshold=20
player-movement-action-direction-thresholds=0.85
player-movement-duration-threshold-in-ms=500
correct-player-movement=false
`;

  try {
    fs.writeFileSync(propFile, defaultPropContent, "utf-8");
    logServerMessage("SYS", "server.properties updated successfully.");
  } catch (e) {
    logServerMessage("ERROR", "Failed to write server.properties file.");
  }
}

// Prepare resource/behavior packs json configurations
function getPacksJSONPath(type: "behavior" | "resource") {
  const levelName = dbCache.appConfig.levelName || "BedrockWorld";
  const targetWorldDir = path.join(SERVER_DIR, "worlds", levelName);
  if (!fs.existsSync(targetWorldDir)) {
    fs.mkdirSync(targetWorldDir, { recursive: true });
  }
  return path.join(targetWorldDir, `world_${type}_packs.json`);
}

function updateWorldPacksConfig() {
  const levelName = dbCache.appConfig.levelName || "BedrockWorld";
  const behaviorPacksPath = getPacksJSONPath("behavior");
  const resourcePacksPath = getPacksJSONPath("resource");

  const behaviorEntries = dbCache.addons
    .filter(a => a.type === "behavior" && a.isEnabled)
    .map(a => ({ pack_id: a.uuid, version: a.version }));

  const resourceEntries = dbCache.addons
    .filter(a => a.type === "resource" && a.isEnabled)
    .map(a => ({ pack_id: a.uuid, version: a.version }));

  try {
    fs.writeFileSync(behaviorPacksPath, JSON.stringify(behaviorEntries, null, 2), "utf-8");
    fs.writeFileSync(resourcePacksPath, JSON.stringify(resourceEntries, null, 2), "utf-8");
    logServerMessage("SYS", `Updated active world packs inside worlds/${levelName}.`);
  } catch (e: any) {
    logServerMessage("ERROR", `Failed to write worlds JSON config: ${e.message}`);
  }
}

// ZIP and MCPack Extraction Engine
function importAddonPack(filePath: string, originalName: string, taskId: string, groupId?: string, uploadedAt?: string) {
  const task = activeTasks.find(t => t.id === taskId);
  if (task) task.status = "running";

  try {
    const zip = new AdmZip(filePath);
    const zipEntries = zip.getEntries();

    // Look for manifest.json
    let manifestEntry = zipEntries.find(entry => entry.entryName.endsWith("manifest.json"));
    if (!manifestEntry) {
      throw new Error("No manifest.json found in the package.");
    }

    const manifestContent = zip.readAsText(manifestEntry);
    const manifest = JSON.parse(manifestContent);

    const header = manifest.header;
    if (!header || !header.uuid || !header.name) {
      throw new Error("Invalid manifest.json structure: missing header, name or uuid.");
    }

    const uuid = header.uuid;
    let name = header.name;
    if (!name || name === "pack.name" || name.toLowerCase().includes("pack.name") || name.toLowerCase().includes("pack.title")) {
      name = originalName.replace(/\.(mcaddon|mcpack|zip)$/i, "");
    }
    const description = header.description || "No description provided.";
    const version = header.version || [1, 0, 0];

    // Check modules to see if Behavior (data) or Resource (resources)
    const modules = manifest.modules || [];
    let type: "behavior" | "resource" = "resource";
    if (modules.some((m: any) => m.type === "data" || m.type === "client_data")) {
      type = "behavior";
    }

    // Look for pack_icon.png
    let iconBase64 = "";
    const prefixPath = manifestEntry.entryName.substring(0, manifestEntry.entryName.indexOf("manifest.json"));
    const iconEntryName = prefixPath + "pack_icon.png";
    const iconEntry = zipEntries.find(entry => entry.entryName === iconEntryName);

    if (iconEntry) {
      const iconData = zip.readFile(iconEntry);
      if (iconData) {
        iconBase64 = `data:image/png;base64,${iconData.toString("base64")}`;
      }
    }

    // Extract to Server packs folder
    const targetFolder = type === "behavior" ? "behavior_packs" : "resource_packs";
    const destDir = path.join(SERVER_DIR, targetFolder, uuid);

    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Extract files under the prefixPath to destination
    zipEntries.forEach(entry => {
      if (entry.entryName.startsWith(prefixPath) && !entry.isDirectory) {
        const relativeName = entry.entryName.substring(prefixPath.length);
        const fullDestPath = path.join(destDir, relativeName);
        const parentDir = path.dirname(fullDestPath);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }
        fs.writeFileSync(fullDestPath, entry.getData());
      }
    });

    const finalGroupId = groupId || `group-${crypto.randomUUID()}`;
    const uploadTime = uploadedAt || new Date().toISOString();

    // Check if package already exists in DB
    const existingIdx = dbCache.addons.findIndex(a => a.uuid === uuid);
    const addonData = {
      uuid,
      version,
      name,
      description,
      type,
      icon: iconBase64 || undefined,
      folderName: uuid,
      isEnabled: false,
      originalName,
      groupId: finalGroupId,
      uploadedAt: uploadTime
    };

    if (existingIdx >= 0) {
      // Retain enabled status on reinstall/reupload
      addonData.isEnabled = dbCache.addons[existingIdx].isEnabled;
      dbCache.addons[existingIdx] = addonData;
    } else {
      dbCache.addons.push(addonData);
    }
    saveDB();

    if (task) {
      task.status = "completed";
      task.progress = 100;
      task.message = `Addon "${name}" (v${version.join(".")}) installed successfully!`;
    }

    // Add to past logs
    dbCache.pastLogs.push({
      id: crypto.randomUUID(),
      name: "Addon Import",
      description: `Imported addon ${name}`,
      status: "completed",
      message: `Successfully processed Bedrock addon: ${name} (${type} pack).`,
      timestamp: new Date().toISOString()
    });
    saveDB();

  } catch (err: any) {
    if (task) {
      task.status = "failed";
      task.message = err.message;
    }
    dbCache.pastLogs.push({
      id: crypto.randomUUID(),
      name: "Addon Import Fail",
      description: `Failed importing ${originalName}`,
      status: "failed",
      message: err.message,
      timestamp: new Date().toISOString()
    });
    saveDB();
  } finally {
    // Delete temp file asynchronously
    fs.unlink(filePath, () => {});
  }
}

// MCADDON Extractor (contains multiple inner MCPacks)
function importAddonGroup(filePath: string, originalName: string, taskId: string) {
  const task = activeTasks.find(t => t.id === taskId);
  if (task) task.status = "running";

  try {
    const zip = new AdmZip(filePath);
    const tempDir = path.join(UPLOADS_DIR, `addon-temp-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    zip.extractAllTo(tempDir, true);

    const uploadGroupId = `group-${crypto.randomUUID()}`;
    const uploadTime = new Date().toISOString();

    // Recursively find and process all mcpacks or folders containing manifest.json
    let packsFound = 0;
    function scanDir(dir: string) {
      const files = fs.readdirSync(dir);
      if (files.includes("manifest.json")) {
        // Zip this dir temporary to ingest it
        const innerZip = new AdmZip();
        innerZip.addLocalFolder(dir);
        const tempPackPath = path.join(UPLOADS_DIR, `inner-${Date.now()}-${packsFound}.mcpack`);
        innerZip.writeZip(tempPackPath);

        // Synchronously run importAddonPack rules but on fake task
        packsFound++;
        const dummyTaskId = crypto.randomUUID();
        activeTasks.push({
          id: dummyTaskId,
          name: "Inner Pack Import",
          description: `Processing internal packet #${packsFound}`,
          progress: 50,
          status: "pending",
          message: "Starting",
          timestamp: new Date().toISOString()
        });

        importAddonPack(tempPackPath, originalName, dummyTaskId, uploadGroupId, uploadTime);
      } else {
        files.forEach(file => {
          const fullPath = path.join(dir, file);
          if (fs.statSync(fullPath).isDirectory()) {
            scanDir(fullPath);
          }
        });
      }
    }

    scanDir(tempDir);

    // Clean up temporary extracted folder
    fs.rmSync(tempDir, { recursive: true, force: true });

    if (task) {
      task.status = "completed";
      task.progress = 100;
      task.message = `Successfully processed MCAddon pack! Found and configured ${packsFound} inner pack(s).`;
    }
  } catch (err: any) {
    if (task) {
      task.status = "failed";
      task.message = err.message;
    }
  } finally {
    fs.unlink(filePath, () => {});
  }
}

// MCWORLD Extractor
function importWorldPack(filePath: string, originalName: string, taskId: string) {
  const task = activeTasks.find(t => t.id === taskId);
  if (task) task.status = "running";

  try {
    const zip = new AdmZip(filePath);
    // Find name from levelName in import world, or originalName trimmed
    let worldDirName = originalName.replace(/\.mcworld$/i, "").replace(/[^a-zA-Z0-9_-]/g, "_");
    if (!worldDirName) worldDirName = `World_${Date.now()}`;

    const destWorldDir = path.join(SERVER_DIR, "worlds", worldDirName);
    if (!fs.existsSync(destWorldDir)) {
      fs.mkdirSync(destWorldDir, { recursive: true });
    }

    zip.extractAllTo(destWorldDir, true);

    // Set levelName to this newly imported world
    dbCache.appConfig.levelName = worldDirName;
    saveDB();

    if (task) {
      task.status = "completed";
      task.progress = 100;
      task.message = `World "${worldDirName}" imported and set as active world!`;
    }

    dbCache.pastLogs.push({
      id: crypto.randomUUID(),
      name: "World Import",
      description: `Loaded world ${worldDirName}`,
      status: "completed",
      message: `Active world changed. Imported and packed folders into worlds/${worldDirName}.`,
      timestamp: new Date().toISOString()
    });
    saveDB();

  } catch (e: any) {
    if (task) {
      task.status = "failed";
      task.message = e.message;
    }
  } finally {
    fs.unlink(filePath, () => {});
  }
}

// Bedrock Version Web downloader helper
function downloadBedrockVersion(version: string, downloadUrl: string, taskId: string) {
  const task = activeTasks.find(t => t.id === taskId);
  if (task) {
    task.status = "running";
    task.progress = 5;
  }

  const zipPath = path.join(SERVER_DIR, `bedrock-server-${version}.zip`);
  const file = fs.createWriteStream(zipPath);

  // User-Agent simulates dynamic downloads to evade official blocks
  const options = {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
  };

  const request = https.get(downloadUrl, options, (response) => {
    if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
      // Handle redirect
      downloadBedrockVersion(version, response.headers.location, taskId);
      return;
    }

    if (response.statusCode !== 200) {
      if (task) {
        task.status = "failed";
        task.message = `HTTP status code is ${response.statusCode}`;
      }
      return;
    }

    const totalBytes = parseInt(response.headers["content-length"] || "0", 10);
    let downloadedBytes = 0;

    response.on("data", (chunk) => {
      downloadedBytes += chunk.length;
      if (task && totalBytes > 0) {
        task.progress = Math.floor((downloadedBytes / totalBytes) * 100);
      }
    });

    response.pipe(file);

    file.on("finish", () => {
      file.close();
      if (task) {
        task.message = "Extracting server archive...";
        task.progress = 90;
      }

      // Unpack Server Zip
      setTimeout(() => {
        try {
          const zip = new AdmZip(zipPath);
          zip.extractAllTo(SERVER_DIR, true);

          // Standard executable permissions (for Linux servers)
          if (process.platform === "linux") {
            const exePath = path.join(SERVER_DIR, "bedrock_server");
            if (fs.existsSync(exePath)) {
              fs.chmodSync(exePath, 0o755);
            }
          }

          if (task) {
            task.status = "completed";
            task.progress = 100;
            task.message = `Bedrock Server version ${version} downloaded and extracted!`;
          }

          dbCache.appConfig.selectedVersion = version;
          saveDB();

          logServerMessage("SYS", `Installed Minecraft Bedrock software v${version}`);
        } catch (unzipErr: any) {
          if (task) {
            task.status = "failed";
            task.message = `Unzip error: ${unzipErr.message}`;
          }
        } finally {
          fs.unlinkSync(zipPath);
        }
      }, 1000);
    });
  });

  request.on("error", (err) => {
    fs.unlink(zipPath, () => {});
    if (task) {
      task.status = "failed";
      task.message = `Network download failed: ${err.message}`;
    }
  });
}

// ---------------------- Express Router Endpoints ----------------------

// Auth Status Check
app.get("/api/auth/status", (req, res) => {
  const hasAdmin = dbCache.users.some(u => u.role === "admin");
  res.json({
    hasAdmin,
    isAuthenticated: false // Initially false. Front-end will authenticate with headers
  });
});

// Admin Account Registration
app.post("/api/auth/register", (req, res) => {
  const { username, password, inviteToken } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required." });
    return;
  }

  const hasAdmin = dbCache.users.some(u => u.role === "admin");
  let role: "admin" | "viewer" = "viewer";
  let matchedInvite: any = null;

  if (!hasAdmin) {
    // If no admin exists in the system, automatically make the first user an admin
    role = "admin";
  } else if (inviteToken) {
    // Validate invite token
    matchedInvite = dbCache.invites.find(i => i.token === inviteToken && !i.used);
    if (!matchedInvite) {
      res.status(400).json({ error: "Invite link is invalid, expired, or has already been used." });
      return;
    }
    role = matchedInvite.role;
  } else {
    // Standard default role fallback
    role = "viewer";
  }

  if (dbCache.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    res.status(400).json({ error: "Username already exists." });
    return;
  }

  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);

  const newUser = {
    username,
    passwordHash,
    salt,
    role,
    registeredAt: new Date().toISOString()
  };

  dbCache.users.push(newUser);

  if (matchedInvite) {
    matchedInvite.used = true;
    matchedInvite.usedBy = username;
  }

  saveDB();

  logServerMessage("SYS", `User accounts registered: ${username} (${role})`);
  res.json({ success: true, message: `Registered successfully as ${role}.` });
});

// User session login
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required." });
    return;
  }

  const user = dbCache.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user) {
    res.status(401).json({ error: "Incorrect username or password." });
    return;
  }

  const hash = hashPassword(password, user.salt);
  if (hash !== user.passwordHash) {
    res.status(401).json({ error: "Incorrect username or password." });
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  activeTokens[token] = { username: user.username, role: user.role };

  res.json({
    success: true,
    token,
    user: {
      username: user.username,
      role: user.role,
      registeredAt: user.registeredAt
    }
  });
});

// Users list (Admin only)
app.get("/api/users", authenticateRequest, requireAdmin, (req, res) => {
  const usersList = dbCache.users.map(u => ({
    username: u.username,
    role: u.role,
    registeredAt: u.registeredAt
  }));
  res.json(usersList);
});

// Add viewers / admins (Admin only)
app.post("/api/users", authenticateRequest, requireAdmin, (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    res.status(400).json({ error: "Username, password and role are required." });
    return;
  }

  if (dbCache.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    res.status(400).json({ error: "Username already exists." });
    return;
  }

  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);

  const newUser = {
    username,
    passwordHash,
    salt,
    role: role as "admin" | "viewer",
    registeredAt: new Date().toISOString()
  };

  dbCache.users.push(newUser);
  saveDB();

  res.json({ success: true, message: `Created user ${username} with role ${role}.` });
});

// Delete user account (Admin only)
app.delete("/api/users/:username", authenticateRequest, requireAdmin, (req, res) => {
  const targetUser = req.params.username;
  const currentAdmin = (req as any).user.username;

  if (targetUser.toLowerCase() === currentAdmin.toLowerCase()) {
    res.status(400).json({ error: "You cannot delete your own admin account." });
    return;
  }

  const initialCount = dbCache.users.length;
  dbCache.users = dbCache.users.filter(u => u.username.toLowerCase() !== targetUser.toLowerCase());

  if (dbCache.users.length === initialCount) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  saveDB();
  res.json({ success: true, message: `User ${targetUser} deleted.` });
});

// ---------------------- Invitations Manager ----------------------

// List invites (Admin only)
app.get("/api/invites", authenticateRequest, requireAdmin, (req, res) => {
  res.json(dbCache.invites || []);
});

// Create invite token (Admin only)
app.post("/api/invites", authenticateRequest, requireAdmin, (req, res) => {
  const { role } = req.body;
  if (!role || (role !== "admin" && role !== "viewer")) {
    res.status(400).json({ error: "Valid role ('admin' | 'viewer') is required." });
    return;
  }

  const token = crypto.randomUUID();
  const newInvite = {
    token,
    role: role as "admin" | "viewer",
    createdAt: new Date().toISOString(),
    used: false
  };

  dbCache.invites.push(newInvite);
  saveDB();

  res.json({ success: true, invite: newInvite });
});

// Delete invite token (Admin only)
app.delete("/api/invites/:token", authenticateRequest, requireAdmin, (req, res) => {
  const token = req.params.token;
  const initialLength = dbCache.invites.length;
  dbCache.invites = dbCache.invites.filter(i => i.token !== token);

  if (dbCache.invites.length === initialLength) {
    res.status(404).json({ error: "Invite details not found." });
    return;
  }

  saveDB();
  res.json({ success: true, message: "Invite successfully revoked." });
});

// Validate invite token (Public)
app.get("/api/invites/validate/:token", (req, res) => {
  const invite = dbCache.invites.find(i => i.token === req.params.token);
  if (!invite) {
    res.json({ valid: false, error: "Invite link is invalid or expired." });
    return;
  }
  if (invite.used) {
    res.json({ valid: false, error: "This invite has already been used to register an account." });
    return;
  }
  res.json({ valid: true, role: invite.role });
});

// Server Configuration Settings
app.get("/api/server/config", authenticateRequest, (req, res) => {
  res.json(dbCache.appConfig);
});

app.post("/api/server/config", authenticateRequest, requireAdmin, (req, res) => {
  const newConfig = req.body;
  dbCache.appConfig = { ...dbCache.appConfig, ...newConfig };
  saveDB();

  // Rewrite props instantly
  writeServerProperties();
  updateWorldPacksConfig();

  res.json({ success: true, config: dbCache.appConfig });
});

// Status & real-time analytics
app.get("/api/server/status", authenticateRequest, (req, res) => {
  const levelName = dbCache.appConfig.levelName || "BedrockWorld";
  const stats = {
    status: serverStatus,
    version: dbCache.appConfig.selectedVersion,
    uptime: serverUptimeStart ? `${Math.floor((Date.now() - serverUptimeStart) / 1000)}s` : "0s",
    cpuUsage: serverStatus === "running" ? (dbCache.appConfig.simulationMode ? cpuUsageVal : 12) : 0,
    memoryUsage: serverStatus === "running" ? (dbCache.appConfig.simulationMode ? ramUsageVal : 0.8) : 0,
    memoryTotal: 8.0,
    tps: serverStatus === "running" ? (dbCache.appConfig.simulationMode ? tpsVal : 20.0) : 0,
    activePlayers: serverStatus === "running" ? (dbCache.appConfig.simulationMode ? simulatedPlayers.length : 0) : 0,
    maxPlayers: dbCache.appConfig.maxPlayers,
    ipAddress: "localhost",
    port: dbCache.appConfig.serverPort,
    worldName: levelName,
    players: serverStatus === "running" ? (dbCache.appConfig.simulationMode ? simulatedPlayers : []) : []
  };
  res.json(stats);
});

// Process Start/Stop Controls
app.post("/api/server/control", authenticateRequest, (req, res) => {
  const { action } = req.body;

  if (action === "start") {
    if (serverStatus !== "stopped") {
      res.status(400).json({ error: "Server is already starting or running." });
      return;
    }

    serverStatus = "starting";
    logServerMessage("SYS", "Starting Bedrock Host...");
    serverUptimeStart = Date.now();

    // Trigger configurations setup
    writeServerProperties();
    updateWorldPacksConfig();

    if (dbCache.appConfig.simulationMode) {
      setTimeout(() => {
        serverStatus = "running";
        logServerMessage("INFO", "Server starting up... loaded Minecraft Bedrock protocol.");
        logServerMessage("INFO", `Server hosted successfully at port ${dbCache.appConfig.serverPort}`);
        logServerMessage("SYS", "Bedrock Dedicated Server simulated online.");
        startSimulationTicks();
      }, 2000);
    } else {
      // Real process launcher
      try {
        const exeName = process.platform === "win32" ? "bedrock_server.exe" : "bedrock_server";
        const exePath = path.join(SERVER_DIR, exeName);

        if (!fs.existsSync(exePath)) {
          serverStatus = "stopped";
          serverUptimeStart = null;
          res.status(400).json({ error: `Bedrock executable not found inside '${SERVER_DIR}'. Please download a version first.` });
          return;
        }

        // Run process
        serverProcess = spawn(process.platform === "win32" ? exePath : `./${exeName}`, [], {
          cwd: SERVER_DIR,
          env: { ...process.env }
        });

        serverStatus = "running";

        // Listen to console
        serverProcess.stdout.on("data", (data) => {
          const str = data.toString().trim();
          if (str) {
            logServerMessage("INFO", str);
          }
        });

        serverProcess.stderr.on("data", (data) => {
          const str = data.toString().trim();
          if (str) {
            logServerMessage("ERROR", str);
          }
        });

        serverProcess.on("close", (code) => {
          logServerMessage("SYS", `Bedrock server process excited with code ${code}`);
          serverStatus = "stopped";
          serverProcess = null;
          serverUptimeStart = null;
        });

      } catch (err: any) {
        logServerMessage("ERROR", `Failed executable spawn: ${err.message}`);
        serverStatus = "stopped";
        serverUptimeStart = null;
      }
    }

    res.json({ success: true, status: "starting" });

  } else if (action === "stop") {
    if (serverStatus === "stopped") {
      res.status(400).json({ error: "Server is already offline." });
      return;
    }

    serverStatus = "stopping";
    logServerMessage("SYS", "Initiating shutdown sequences...");

    if (simulatedStatsInterval) {
      clearInterval(simulatedStatsInterval);
      simulatedStatsInterval = null;
    }
    simulatedPlayers = [];

    if (dbCache.appConfig.simulationMode) {
      setTimeout(() => {
        serverStatus = "stopped";
        serverUptimeStart = null;
        logServerMessage("SYS", "Bedrock Server simulated offline.");
      }, 1500);
    } else {
      if (serverProcess) {
        // Send stop command on console
        serverProcess.stdin.write("stop\n");
        setTimeout(() => {
          if (serverProcess) {
            serverProcess.kill();
            serverProcess = null;
          }
          serverStatus = "stopped";
          serverUptimeStart = null;
          logServerMessage("SYS", "Bedrock Process killed successfully.");
        }, 3000);
      } else {
        serverStatus = "stopped";
        serverUptimeStart = null;
      }
    }

    res.json({ success: true, status: "stopping" });

  } else if (action === "restart") {
    logServerMessage("SYS", "Server restarting triggered by host...");
    // Stop server
    if (serverStatus !== "stopped") {
      if (simulatedStatsInterval) clearInterval(simulatedStatsInterval);
      simulatedPlayers = [];
      if (serverProcess) {
        serverProcess.kill();
        serverProcess = null;
      }
      serverStatus = "stopped";
      serverUptimeStart = null;
    }

    // Delay start
    setTimeout(() => {
      serverStatus = "starting";
      serverUptimeStart = Date.now();
      writeServerProperties();
      updateWorldPacksConfig();

      if (dbCache.appConfig.simulationMode) {
        setTimeout(() => {
          serverStatus = "running";
          logServerMessage("SYS", "Bedrock Server simulated restarted.");
          startSimulationTicks();
        }, 1500);
      } else {
        // Run Real Spawn
        try {
          const exeName = process.platform === "win32" ? "bedrock_server.exe" : "bedrock_server";
          const exePath = path.join(SERVER_DIR, exeName);
          if (fs.existsSync(exePath)) {
            serverProcess = spawn(process.platform === "win32" ? exePath : `./${exeName}`, [], {
              cwd: SERVER_DIR
            });
            serverStatus = "running";
            serverProcess.stdout.on("data", (data) => logServerMessage("INFO", data.toString().trim()));
            serverProcess.stderr.on("data", (data) => logServerMessage("ERROR", data.toString().trim()));
            serverProcess.on("close", () => {
              serverStatus = "stopped";
              serverProcess = null;
              serverUptimeStart = null;
            });
          } else {
            serverStatus = "stopped";
          }
        } catch (e) {
          serverStatus = "stopped";
        }
      }
    }, 1000);

    res.json({ success: true, status: "restarting" });
  } else {
    res.status(400).json({ error: "Invalid action." });
  }
});

// Console commands
app.get("/api/console", authenticateRequest, (req, res) => {
  res.json(serverLogs);
});

app.post("/api/console", authenticateRequest, (req, res) => {
  const { command } = req.body;
  if (!command) {
    res.status(400).json({ error: "No command text provided." });
    return;
  }

  logServerMessage("SYS", `Command executed: ${command}`);

  if (serverStatus !== "running") {
    res.status(400).json({ error: "Cannot send commands while server is offline." });
    return;
  }

  if (dbCache.appConfig.simulationMode) {
    // Process core simulated command parser
    setTimeout(() => {
      const parts = command.trim().split(" ");
      const cmd = parts[0].toLowerCase();

      if (cmd === "op" && parts.length > 1) {
        logServerMessage("INFO", `Opping ${parts[1]}`);
      } else if (cmd === "list") {
        const names = simulatedPlayers.map(p => p.name).join(", ");
        logServerMessage("INFO", `There are ${simulatedPlayers.length} of max ${dbCache.appConfig.maxPlayers} players online: ${names || "None"}`);
      } else if (cmd === "say" && parts.length > 1) {
        const sayMsg = parts.slice(1).join(" ");
        logServerMessage("INFO", `[Server] ${sayMsg}`);
      } else {
        logServerMessage("INFO", `Command successfully accepted. Executed ${cmd}.`);
      }
    }, 500);
  } else {
    if (serverProcess) {
      serverProcess.stdin.write(`${command}\n`);
    } else {
      res.status(400).json({ error: "Dedicated process stream disconnected." });
      return;
    }
  }

  res.json({ success: true });
});

// Active Tasks
app.get("/api/tasks", authenticateRequest, (req, res) => {
  res.json(activeTasks);
});

// Clear tasks
app.post("/api/tasks/clear", authenticateRequest, (req, res) => {
  activeTasks = [];
  res.json({ success: true });
});

// Versions list
app.get("/api/versions", authenticateRequest, (req, res) => {
  const isWin = process.platform === "win32";
  const folder = isWin ? "bin-win" : "bin-linux";
  
  const versions: Array<{ version: string; releaseDate: string; isLatest: boolean; downloadUrl: string }> = [
    {
      version: "1.21.60",
      releaseDate: "2025-02 stable",
      isLatest: true,
      downloadUrl: `https://www.minecraft.net/bedrockdedicatedserver/${folder}/bedrock-server-1.21.60.03.zip`
    },
    {
      version: "1.21.50",
      releaseDate: "2024-12",
      isLatest: false,
      downloadUrl: `https://www.minecraft.net/bedrockdedicatedserver/${folder}/bedrock-server-1.21.50.07.zip`
    },
    {
      version: "1.21.30",
      releaseDate: "2024-10",
      isLatest: false,
      downloadUrl: `https://www.minecraft.net/bedrockdedicatedserver/${folder}/bedrock-server-1.21.30.03.zip`
    },
    {
      version: "1.20.80",
      releaseDate: "2024-05",
      isLatest: false,
      downloadUrl: `https://www.minecraft.net/bedrockdedicatedserver/${folder}/bedrock-server-1.20.80.05.zip`
    }
  ];
  res.json(versions);
});

// One-click upgrade/version installer
app.post("/api/versions/install", authenticateRequest, requireAdmin, (req, res) => {
  const { version, downloadUrl } = req.body;
  if (!version || !downloadUrl) {
    res.status(400).json({ error: "Version and downloadUrl are required." });
    return;
  }

  if (serverStatus !== "stopped") {
    res.status(400).json({ error: "Please stop the server before installing new versions." });
    return;
  }

  const taskId = crypto.randomUUID();
  const newTask = {
    id: taskId,
    name: "Install Version",
    description: `Downloading Bedrock server v${version}`,
    progress: 0,
    status: "pending" as const,
    message: "Initializing",
    timestamp: new Date().toISOString()
  };

  activeTasks.push(newTask);
  downloadBedrockVersion(version, downloadUrl, taskId);

  res.json({ success: true, taskId });
});

// Fetch past logs
app.get("/api/logs/history", authenticateRequest, (req, res) => {
  res.json(dbCache.pastLogs);
});

// Clear log history
app.post("/api/logs/history/clear", authenticateRequest, requireAdmin, (req, res) => {
  dbCache.pastLogs = [];
  saveDB();
  res.json({ success: true });
});

// Addon module triggers (enable, disable, upload, delete)
app.get("/api/addons", authenticateRequest, (req, res) => {
  res.json(dbCache.addons);
});

// Handle Uploads
app.post("/api/addons/upload", authenticateRequest, requireAdmin, upload.any(), (req, res) => {
  const files = (req.files as Express.Multer.File[]) || [];
  if (files.length === 0) {
    res.status(400).json({ error: "No pack files uploaded." });
    return;
  }

  const taskIds: string[] = [];

  for (const file of files) {
    const lowername = file.originalname.toLowerCase();
    const taskId = crypto.randomUUID();
    taskIds.push(taskId);

    const task = {
      id: taskId,
      name: "Addon Import",
      description: `Importing pack: ${file.originalname}`,
      progress: 10,
      status: "pending" as const,
      message: "Analyzing package structures",
      timestamp: new Date().toISOString()
    };
    activeTasks.push(task);

    if (lowername.endsWith(".mcaddon")) {
      // Process MCADDON
      importAddonGroup(file.path, file.originalname, taskId);
    } else if (lowername.endsWith(".mcpack")) {
      // Process MCPACK
      importAddonPack(file.path, file.originalname, taskId);
    } else if (lowername.endsWith(".mcworld")) {
      // Process MCWORLD
      importWorldPack(file.path, file.originalname, taskId);
    } else {
      // Treat as custom zip
      importAddonPack(file.path, file.originalname, taskId);
    }
  }

  res.json({ success: true, taskIds, taskId: taskIds[0] });
});

// Enable All Addons
app.post("/api/addons/enable-all", authenticateRequest, requireAdmin, (req, res) => {
  dbCache.addons.forEach(a => {
    if (a.type === "behavior" || a.type === "resource") {
      a.isEnabled = true;
    }
  });

  saveDB();
  updateWorldPacksConfig();

  logServerMessage("SYS", `All behavior and resource packs enabled.`);
  res.json({ success: true, count: dbCache.addons.length });
});

// Disable All Addons
app.post("/api/addons/disable-all", authenticateRequest, requireAdmin, (req, res) => {
  dbCache.addons.forEach(a => {
    if (a.type === "behavior" || a.type === "resource") {
      a.isEnabled = false;
    }
  });

  saveDB();
  updateWorldPacksConfig();

  logServerMessage("SYS", `All behavior and resource packs disabled.`);
  res.json({ success: true, count: dbCache.addons.length });
});

// Enable Addons
app.post("/api/addons/:uuid/enable", authenticateRequest, requireAdmin, (req, res) => {
  const addon = dbCache.addons.find(a => a.uuid === req.params.uuid);
  if (!addon) {
    res.status(404).json({ error: "Addon not found in records." });
    return;
  }

  // Grouped enable
  const toEnable = dbCache.addons.filter(a => 
    a.uuid === addon.uuid || 
    (addon.groupId && a.groupId === addon.groupId) || 
    (addon.originalName && a.originalName === addon.originalName && addon.originalName !== "")
  );

  toEnable.forEach(a => {
    a.isEnabled = true;
  });

  saveDB();
  updateWorldPacksConfig();

  logServerMessage("SYS", `Addon packs enabled: ${toEnable.map(a => a.name).join(", ")}`);
  res.json({ success: true, addon, affectedCount: toEnable.length });
});

// Disable Addons
app.post("/api/addons/:uuid/disable", authenticateRequest, requireAdmin, (req, res) => {
  const addon = dbCache.addons.find(a => a.uuid === req.params.uuid);
  if (!addon) {
    res.status(404).json({ error: "Addon not found in records." });
    return;
  }

  // Grouped disable
  const toDisable = dbCache.addons.filter(a => 
    a.uuid === addon.uuid || 
    (addon.groupId && a.groupId === addon.groupId) || 
    (addon.originalName && a.originalName === addon.originalName && addon.originalName !== "")
  );

  toDisable.forEach(a => {
    a.isEnabled = false;
  });

  saveDB();
  updateWorldPacksConfig();

  logServerMessage("SYS", `Addon packs disabled: ${toDisable.map(a => a.name).join(", ")}`);
  res.json({ success: true, addon, affectedCount: toDisable.length });
});

// Remove Addon and delete its resources (and delete all grouped packs in same .mcaddon group)
app.delete("/api/addons/:uuid", authenticateRequest, requireAdmin, (req, res) => {
  const uuid = req.params.uuid;
  const targetAddon = dbCache.addons.find(a => a.uuid === uuid);
  if (!targetAddon) {
    res.status(404).json({ error: "Addon not found." });
    return;
  }

  // Find all addons in the same group
  const toDelete = dbCache.addons.filter(a => {
    if (a.uuid === uuid) return true;
    
    const isSameGroup = targetAddon.groupId && a.groupId === targetAddon.groupId;
    const isSameOriginalName = targetAddon.originalName && a.originalName === targetAddon.originalName && targetAddon.originalName !== "";
    
    return isSameGroup || isSameOriginalName;
  });

  // Try physical deletion for each pack in group
  for (const addon of toDelete) {
    try {
      const targetFolder = addon.type === "behavior" ? "behavior_packs" : "resource_packs";
      const destDir = path.join(SERVER_DIR, targetFolder, addon.uuid);
      if (fs.existsSync(destDir)) {
        fs.rmSync(destDir, { recursive: true, force: true });
      }
    } catch (err) {
      console.error(`Physical addon delete failed for ${addon.uuid}`, err);
    }
  }

  // Remove all matched addons from DB cache
  dbCache.addons = dbCache.addons.filter(a => !toDelete.some(d => d.uuid === a.uuid));
  
  saveDB();
  updateWorldPacksConfig();

  const deletedNames = toDelete.map(a => a.name).join(", ");
  logServerMessage("SYS", `Addon(s) removed: ${deletedNames}`);
  
  res.json({ 
    success: true, 
    deletedCount: toDelete.length,
    deletedNames: deletedNames
  });
});

// Remove all addons and physical assets (Admin only)
app.delete("/api/addons-all", authenticateRequest, requireAdmin, (req, res) => {
  const toDelete = [...dbCache.addons];

  for (const addon of toDelete) {
    try {
      const targetFolder = addon.type === "behavior" ? "behavior_packs" : "resource_packs";
      const destDir = path.join(SERVER_DIR, targetFolder, addon.uuid);
      if (fs.existsSync(destDir)) {
        fs.rmSync(destDir, { recursive: true, force: true });
      }
    } catch (err) {
      console.error(`Physical addon delete all failed for ${addon.uuid}`, err);
    }
  }

  dbCache.addons = [];
  
  saveDB();
  updateWorldPacksConfig();

  logServerMessage("SYS", `All behavior and resource packs deleted (${toDelete.length} packs total).`);
  res.json({ success: true, count: toDelete.length });
});

// Update/Override an Addon with a newly uploaded file (Admin only)
app.post("/api/addons/:uuid/update-upload", authenticateRequest, requireAdmin, upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No pack file uploaded." });
    return;
  }

  const uuid = req.params.uuid;
  const targetAddon = dbCache.addons.find(a => a.uuid === uuid);
  if (!targetAddon) {
    res.status(404).json({ error: "Addon to update not found." });
    return;
  }

  // Find all addons in the same group
  const toDelete = dbCache.addons.filter(a => {
    if (a.uuid === uuid) return true;
    
    const isSameGroup = targetAddon.groupId && a.groupId === targetAddon.groupId;
    const isSameOriginalName = targetAddon.originalName && a.originalName === targetAddon.originalName && targetAddon.originalName !== "";
    
    return isSameGroup || isSameOriginalName;
  });

  // Track state to preserve
  const wasEnabled = toDelete.some(a => a.isEnabled);
  const oldDownloadUrl = toDelete.find(a => a.downloadUrl)?.downloadUrl;

  // Try physical deletion for each pack in group
  for (const addon of toDelete) {
    try {
      const targetFolder = addon.type === "behavior" ? "behavior_packs" : "resource_packs";
      const destDir = path.join(SERVER_DIR, targetFolder, addon.uuid);
      if (fs.existsSync(destDir)) {
        fs.rmSync(destDir, { recursive: true, force: true });
      }
    } catch (err) {
      console.error(`Physical addon delete failed for ${addon.uuid}`, err);
    }
  }

  // Remove all matched addons from DB cache before import
  dbCache.addons = dbCache.addons.filter(a => !toDelete.some(d => d.uuid === a.uuid));
  const remainingUUIDs = new Set(dbCache.addons.map(a => a.uuid));

  const file = req.file;
  const lowername = file.originalname.toLowerCase();

  // Create active task
  const taskId = crypto.randomUUID();
  const task = {
    id: taskId,
    name: "Addon Override",
    description: `Updating pack "${targetAddon.name}" with file: ${file.originalname}`,
    progress: 10,
    status: "pending" as const,
    message: "Analyzing package structures",
    timestamp: new Date().toISOString()
  };
  activeTasks.push(task);

  if (lowername.endsWith(".mcaddon")) {
    importAddonGroup(file.path, file.originalname, taskId);
  } else if (lowername.endsWith(".mcpack")) {
    importAddonPack(file.path, file.originalname, taskId);
  } else if (lowername.endsWith(".mcworld")) {
    importWorldPack(file.path, file.originalname, taskId);
  } else {
    importAddonPack(file.path, file.originalname, taskId);
  }

  // Restore states of newly added addons
  const newlyAdded = dbCache.addons.filter(a => !remainingUUIDs.has(a.uuid));
  for (const addon of newlyAdded) {
    addon.isEnabled = wasEnabled;
    if (oldDownloadUrl && !addon.downloadUrl) {
      addon.downloadUrl = oldDownloadUrl;
    }
  }

  saveDB();
  updateWorldPacksConfig();

  logServerMessage("SYS", `Addon "${targetAddon.name}" updated/overridden with file "${file.originalname}"`);
  res.json({ success: true, taskId });
});

// Update/Edit Addon parameters (Admin only - applies to all grouped addons)
app.put("/api/addons/:uuid", authenticateRequest, requireAdmin, (req, res) => {
  const { name, description, downloadUrl } = req.body;
  const targetAddon = dbCache.addons.find(a => a.uuid === req.params.uuid);
  if (!targetAddon) {
    res.status(404).json({ error: "Addon not found in records." });
    return;
  }

  // Find all addons in the same group or with the same original name (extracted from same .mcaddon bundle)
  const toUpdate = dbCache.addons.filter(a => {
    if (a.uuid === req.params.uuid) return true;
    
    const isSameGroup = targetAddon.groupId && a.groupId === targetAddon.groupId;
    const isSameOriginalName = targetAddon.originalName && a.originalName === targetAddon.originalName && targetAddon.originalName !== "";
    
    return isSameGroup || isSameOriginalName;
  });

  let baseName = typeof name === "string" ? name.trim() : "";
  if (baseName) {
    // Strip trailing BP, RP, [BP], [RP], (BP), (RP) with or without brackets
    baseName = baseName.replace(/\s+(?:\[?BP\]?|\[?RP\]?|\(?BP\)?|\(?RP\)?)$/i, "").trim();
  }

  for (const addon of toUpdate) {
    if (baseName) {
      const suffix = addon.type === "behavior" ? " BP" : " RP";
      addon.name = baseName + suffix;
    }
    if (typeof description === "string") {
      addon.description = description.trim();
    }
    if (typeof downloadUrl === "string") {
      addon.downloadUrl = downloadUrl.trim();
    }
  }

  saveDB();
  updateWorldPacksConfig();

  const updatedNames = toUpdate.map(a => a.name).join(", ");
  logServerMessage("SYS", `Addon(s) updated: ${updatedNames}`);
  res.json({ success: true, updatedCount: toUpdate.length, updatedNames });
});

// Worlds database manager
app.get("/api/worlds", authenticateRequest, (req, res) => {
  const worldsDir = path.join(SERVER_DIR, "worlds");
  if (!fs.existsSync(worldsDir)) {
    res.json([]);
    return;
  }

  try {
    const folders = fs.readdirSync(worldsDir);
    const worlds = folders.map(folder => {
      const fullPath = path.join(worldsDir, folder);
      const isDir = fs.statSync(fullPath).isDirectory();
      if (!isDir) return null;

      // Calculate size
      let size = 0;
      function calcSize(dir: string) {
        const files = fs.readdirSync(dir);
        files.forEach(f => {
          const fp = path.join(dir, f);
          const stat = fs.statSync(fp);
          if (stat.isDirectory()) {
            calcSize(fp);
          } else {
            size += stat.size;
          }
        });
      }
      try { calcSize(fullPath); } catch (e) {}

      return {
        name: folder,
        folderName: folder,
        sizeBytes: size,
        isActive: dbCache.appConfig.levelName === folder
      };
    }).filter(Boolean);

    res.json(worlds);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Active World switcher
app.post("/api/worlds/:folderName/select", authenticateRequest, requireAdmin, (req, res) => {
  const folderName = req.params.folderName;
  const worldsDir = path.join(SERVER_DIR, "worlds", folderName);

  if (!fs.existsSync(worldsDir)) {
    res.status(404).json({ error: "World directory does not exist." });
    return;
  }

  dbCache.appConfig.levelName = folderName;
  saveDB();

  // Re-write config properties and packs JSONs for world
  writeServerProperties();
  updateWorldPacksConfig();

  logServerMessage("SYS", `Active world switched to: ${folderName}`);
  res.json({ success: true, levelName: folderName });
});

// Direct world upload
app.post("/api/worlds/upload", authenticateRequest, requireAdmin, upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No .mcworld file uploaded." });
    return;
  }

  const file = req.file;
  const taskId = crypto.randomUUID();
  const task = {
    id: taskId,
    name: "World Import",
    description: `Importing Bedrock World from ${file.originalname}`,
    progress: 20,
    status: "pending" as const,
    message: "Extracting environment folders",
    timestamp: new Date().toISOString()
  };
  activeTasks.push(task);

  importWorldPack(file.path, file.originalname, taskId);
  res.json({ success: true, taskId });
});

// ---------------------- Dev Vs Production Framework Integration ----------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(WORK_DIR, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer();
