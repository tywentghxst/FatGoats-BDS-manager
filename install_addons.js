import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import crypto from "crypto";

const IMPORT_DIR = path.join(process.cwd(), "auto_install_addons");
const SERVER_DIR = path.join(process.cwd(), "bedrock-server");
const DB_FILE = path.join(SERVER_DIR, "manager_db.json");
const ARCHIVE_DIR = path.join(IMPORT_DIR, "imported");
const TEMP_DIR = path.join(IMPORT_DIR, "temp");

// Ensure directories exist
if (!fs.existsSync(IMPORT_DIR)) {
  fs.mkdirSync(IMPORT_DIR, { recursive: true });
}
if (!fs.existsSync(ARCHIVE_DIR)) {
  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
}

console.log("===================================================");
console.log("  Minecraft Bedrock - Auto Addons Installer/Enabler");
console.log("===================================================\n");

// Read files in importing dir
const files = fs.readdirSync(IMPORT_DIR).filter(f => {
  const ext = path.extname(f).toLowerCase();
  return ext === ".mcpack" || ext === ".mcaddon" || ext === ".zip";
});

if (files.length === 0) {
  console.log("No .mcpack, .mcaddon, or .zip files found in 'auto_install_addons'.");
  console.log("Drop your addon packages there and run this script again!\n");
  process.exit(0);
}

console.log(`Found ${files.length} addon file(s) to process.`);

// Load database cache
let dbCache = { addons: [], appConfig: { levelName: "BedrockWorld" } };
if (fs.existsSync(DB_FILE)) {
  try {
    dbCache = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  } catch (err) {
    console.error("Warning: Could not parse manager_db.json, starting with default skeleton.");
  }
}
dbCache.addons = dbCache.addons || [];
dbCache.appConfig = dbCache.appConfig || { levelName: "BedrockWorld" };

// Helper to save DB and update active pack config files
function saveDBAndConfigs() {
  fs.writeFileSync(DB_FILE, JSON.stringify(dbCache, null, 2), "utf-8");
  console.log("Saved manager_db.json successfully.");

  const levelName = dbCache.appConfig.levelName || "BedrockWorld";
  const targetWorldDir = path.join(SERVER_DIR, "worlds", levelName);
  if (!fs.existsSync(targetWorldDir)) {
    fs.mkdirSync(targetWorldDir, { recursive: true });
  }

  const behaviorPacksPath = path.join(targetWorldDir, "world_behavior_packs.json");
  const resourcePacksPath = path.join(targetWorldDir, "world_resource_packs.json");

  const behaviorEntries = dbCache.addons
    .filter(a => a.type === "behavior" && a.isEnabled)
    .map(a => ({ pack_id: a.uuid, version: a.version }));

  const resourceEntries = dbCache.addons
    .filter(a => a.type === "resource" && a.isEnabled)
    .map(a => ({ pack_id: a.uuid, version: a.version }));

  fs.writeFileSync(behaviorPacksPath, JSON.stringify(behaviorEntries, null, 2), "utf-8");
  fs.writeFileSync(resourcePacksPath, JSON.stringify(resourceEntries, null, 2), "utf-8");
  console.log(`Updated active configurations inside worlds/${levelName}.\n`);
}

// Global registry of all addon processing
function registerAddon(uuid, version, name, description, type, iconBase64, originalName, groupId, uploadTime) {
  const existingIdx = dbCache.addons.findIndex(a => a.uuid === uuid);
  const addonData = {
    uuid,
    version,
    name,
    description,
    type,
    icon: iconBase64 || undefined,
    folderName: uuid,
    isEnabled: true, // Auto-enabled as requested
    originalName,
    groupId,
    uploadedAt: uploadTime
  };

  if (existingIdx >= 0) {
    dbCache.addons[existingIdx] = addonData;
    console.log(`[BP ↔ RP] Refreshed existing addon: "${name}" (${uuid})`);
  } else {
    dbCache.addons.push(addonData);
    console.log(`[BP ↔ RP] Registered and AUTO-ENABLED new addon: "${name}" (${uuid})`);
  }
}

// Main logic to process individual packs
function processPackZip(zipPath, originalName, groupId, uploadTime) {
  let zip;
  try {
    zip = new AdmZip(zipPath);
  } catch (err) {
    console.error(`Failed to load ZIP archive ${zipPath}: ${err.message}`);
    return false;
  }

  const zipEntries = zip.getEntries();

  // Find all manifest.json entries
  const manifestEntries = zipEntries.filter(entry => entry.entryName.endsWith("manifest.json"));

  if (manifestEntries.length === 0) {
    console.error(`No manifest.json files found in ${originalName}. skipping.`);
    return false;
  }

  console.log(`Found ${manifestEntries.length} manifest(s) inside ${originalName}. Extracting...`);

  let success = false;
  for (const manifestEntry of manifestEntries) {
    try {
      const manifestContent = zip.readAsText(manifestEntry);
      const manifest = JSON.parse(manifestContent);
      const header = manifest.header;

      if (!header || !header.uuid || !header.name) {
        console.error(`Invalid manifest syntax inside ${originalName}. skipping pack.`);
        continue;
      }

      const uuid = header.uuid;
      let name = header.name;
      if (!name || name === "pack.name" || name.toLowerCase().includes("pack.name") || name.toLowerCase().includes("pack.title")) {
        name = originalName.replace(/\.(mcaddon|mcpack|zip)$/i, "");
      }
      const description = header.description || "No description provided.";
      const version = header.version || [1, 0, 0];

      const modules = manifest.modules || [];
      let type = "resource";
      if (modules.some(m => m.type === "data" || m.type === "client_data")) {
        type = "behavior";
      }

      // Check pack_icon.png
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

      const targetFolder = type === "behavior" ? "behavior_packs" : "resource_packs";
      const destDir = path.join(SERVER_DIR, targetFolder, uuid);

      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      // Extract only the entries related to this manifest's prefix folder
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

      registerAddon(uuid, version, name, description, type, iconBase64, originalName, groupId, uploadTime);
      success = true;
    } catch (e) {
      console.error(`Failed extracting pack from ${originalName}: ${e.message}`);
    }
  }

  return success;
}

// Process loop
for (const file of files) {
  const filePath = path.join(IMPORT_DIR, file);
  const ext = path.extname(file).toLowerCase();
  console.log(`\nProcessing file: "${file}"`);

  const groupId = `group-${crypto.randomUUID()}`;
  const uploadTime = new Date().toISOString();

  let ok = false;
  try {
    if (ext === ".mcaddon") {
      // It's a group, check if it contains sub ZIP/MCPack files inside it or directories
      const zip = new AdmZip(filePath);
      const zipEntries = zip.getEntries();
      const innerPackEntries = zipEntries.filter(e => e.entryName.toLowerCase().endsWith(".mcpack") && !e.isDirectory);

      if (innerPackEntries.length > 0) {
        console.log(`Found ${innerPackEntries.length} nested .mcpack files inside MCAddon group.`);
        if (!fs.existsSync(TEMP_DIR)) {
          fs.mkdirSync(TEMP_DIR, { recursive: true });
        }

        let innerOkCount = 0;
        innerPackEntries.forEach((entry, idx) => {
          const innerTempPath = path.join(TEMP_DIR, `inner-${Date.now()}-${idx}.mcpack`);
          fs.writeFileSync(innerTempPath, zip.readFile(entry));
          if (processPackZip(innerTempPath, entry.name || file, groupId, uploadTime)) {
            innerOkCount++;
          }
          fs.unlinkSync(innerTempPath);
        });
        ok = innerOkCount > 0;
      } else {
        // Just extract directly if it doesn't contain inner ZIPs but contains subfolders of files
        ok = processPackZip(filePath, file, groupId, uploadTime);
      }
    } else {
      ok = processPackZip(filePath, file, groupId, uploadTime);
    }

    if (ok) {
      // Archive original file to imported/
      fs.renameSync(filePath, path.join(ARCHIVE_DIR, file));
      console.log(`Successfully completed and archived: "${file}"`);
    } else {
      console.error(`Failed to process: "${file}"`);
    }
  } catch (err) {
    console.error(`Unexpected error processing ${file}: ${err.message}`);
  }
}

// Clean up temp dir if exists
if (fs.existsSync(TEMP_DIR)) {
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
}

// Save back database and regenerate active configs
saveDBAndConfigs();

console.log("===================================================");
console.log("  Successfully completed all addon installations! ");
console.log("  If the server is active, please restart it to load them!");
console.log("===================================================");
