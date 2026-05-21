/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Server,
  Play,
  Square,
  RefreshCw,
  Users,
  Globe,
  Plus,
  Trash2,
  Shield,
  Activity,
  User,
  Clock,
  Lock,
  UploadCloud,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Cpu,
  Layers,
  Settings,
  FileCode,
  Terminal,
  LogOut,
  FolderOpen,
  UserPlus,
  KeyRound,
  Edit,
  ExternalLink
} from "lucide-react";

import {
  BedrockServerStatus,
  AddonMetadata,
  BedrockWorld,
  UserAccount,
  TaskLog,
  ConsoleLine,
  BedrockVersion,
  AppConfig,
  UserInvite
} from "./types";

import ConsoleConnect from "./components/ConsoleConnect";

export default function App() {
  // Authentication & Profile States
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("bedrock_token"));
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem("bedrock_user");
    return saved ? JSON.parse(saved) : null;
  });

  // Startup forms
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");

  // Menu Navigation Tab (Dashboard, Players, Settings, Console, Users, Selfhost Guides)
  const [navTab, setNavTab] = useState<"dashboard" | "addons" | "worlds" | "console" | "users" | "selfhost" | "console_connect">("dashboard");
  const [guideMode, setGuideMode] = useState<"windows" | "docker">("windows");

  // Console Panel Tabs
  const [consoleTab, setConsoleTab] = useState<"logs" | "tasks" | "history">("logs");

  // Server stats & configurations
  const [stats, setStats] = useState<any | null>(null);
  const [appConfig, setAppConfig] = useState<AppConfig>({
    bentoStyle: true,
    serverPort: 19132,
    maxPlayers: 20,
    levelName: "BedrockWorld",
    difficulty: "normal",
    gamemode: "survival",
    simulationMode: true,
    selectedVersion: "1.21.60"
  });

  // Live collections
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLine[]>([]);
  const [activeTasks, setActiveTasks] = useState<TaskLog[]>([]);
  const [pastLogs, setPastLogs] = useState<any[]>([]);
  const [addons, setAddons] = useState<AddonMetadata[]>([]);
  const [worlds, setWorlds] = useState<any[]>([]);
  const [versions, setVersions] = useState<BedrockVersion[]>([]);
  const [usersList, setUsersList] = useState<UserAccount[]>([]);
  const [invitesList, setInvitesList] = useState<UserInvite[]>([]);
  const [newInviteRole, setNewInviteRole] = useState<"admin" | "viewer">("viewer");
  const [urlInviteToken, setUrlInviteToken] = useState<string | null>(() => {
    return new URLSearchParams(window.location.search).get("invite");
  });
  const [inviteValid, setInviteValid] = useState<boolean | null>(null);
  const [inviteRole, setInviteRole] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Action states
  const [commandText, setCommandText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [actionMessage, setActionMessage] = useState({ text: "", type: "info" });
  const [addonSortBy, setAddonSortBy] = useState<"name" | "date" | "enabled" | "disabled">("name");

  // Edit Addon States
  const [editingAddon, setEditingAddon] = useState<AddonMetadata | null>(null);
  const [editAddonName, setEditAddonName] = useState("");
  const [editAddonDescription, setEditAddonDescription] = useState("");
  const [editAddonDownloadUrl, setEditAddonDownloadUrl] = useState("");
  const [isSavingAddon, setIsSavingAddon] = useState(false);
  const [updatingAddonUuid, setUpdatingAddonUuid] = useState<string | null>(null);

  // Add User states
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "viewer">("viewer");
  const [userActionMsg, setUserActionMsg] = useState("");

  // Premium Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const promptConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // References
  const logContainerRef = useRef<HTMLDivElement>(null);
  const addonFileInputRef = useRef<HTMLInputElement>(null);
  const worldFileInputRef = useRef<HTMLInputElement>(null);
  const updateAddonFileInputRef = useRef<HTMLInputElement>(null);

  // Poll timer handler
  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (urlInviteToken) {
      setInviteValid(null);
      setInviteError(null);
      fetch(`/api/invites/validate/${urlInviteToken}`)
        .then(res => res.json())
        .then(data => {
          if (data.valid) {
            setInviteValid(true);
            setInviteRole(data.role);
          } else {
            setInviteValid(false);
            setInviteError(data.error || "Invite verification failed.");
          }
        })
        .catch(err => {
          setInviteValid(false);
          setInviteError("Failed communicating with invite systems.");
        });
    }
  }, [urlInviteToken]);

  const isAdmin = currentUser?.role === "admin";

  // Polling data loops
  useEffect(() => {
    if (!token) return;

    fetchDataFeed();
    const interval = setInterval(fetchDataFeed, 2000);
    return () => clearInterval(interval);
  }, [token, navTab]);

  // Command logs autoscroll
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [consoleLogs, consoleTab]);

  const checkAuthStatus = async () => {
    try {
      const res = await fetch("/api/auth/status");
      const data = await res.json();
      setHasAdmin(data.hasAdmin);
    } catch (e) {
      console.error("Failed to read server auth state", e);
    }
  };

  const fetchDataFeed = async () => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // 1. Core Server Stats Info
      const statsRes = await fetch("/api/server/status", { headers });
      if (statsRes.status === 401) {
        handleLogout();
        return;
      }
      const statsData = await statsRes.json();
      setStats(statsData);

      // 2. Active Tasks
      const tasksRes = await fetch("/api/tasks", { headers });
      const tasksData = await tasksRes.json();
      setActiveTasks(tasksData);

      // 3. Active configuration properties
      const configRes = await fetch("/api/server/config", { headers });
      const configData = await configRes.json();
      setAppConfig(configData);

      // Fetch according to visible route
      if (navTab === "dashboard" || consoleTab === "logs") {
        const consoleRes = await fetch("/api/console", { headers });
        const consoleData = await consoleRes.json();
        setConsoleLogs(consoleData);
      }

      if (consoleTab === "history" || navTab === "dashboard") {
        const historyRes = await fetch("/api/logs/history", { headers });
        const historyData = await historyRes.json();
        setPastLogs(historyData);
      }

      if (navTab === "addons" || navTab === "dashboard") {
        const addonsRes = await fetch("/api/addons", { headers });
        const addonsData = await addonsRes.json();
        setAddons(addonsData);
      }

      if (navTab === "worlds" || navTab === "dashboard") {
        const worldsRes = await fetch("/api/worlds", { headers });
        const worldsData = await worldsRes.json();
        setWorlds(worldsData);
      }

      if (navTab === "users" && isAdmin) {
        const usersRes = await fetch("/api/users", { headers });
        const usersData = await usersRes.json();
        setUsersList(usersData);

        const inviteRes = await fetch("/api/invites", { headers });
        const inviteData = await inviteRes.json();
        setInvitesList(inviteData);
      }

      // Pre-populate Bedrock versions on first load of dashboard
      if (versions.length === 0) {
        const versionsRes = await fetch("/api/versions", { headers });
        const versionsData = await versionsRes.json();
        setVersions(versionsData);
      }

    } catch (err) {
      console.error("Poll data feed failed", err);
    }
  };

  const handleRegisterAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput || !passwordInput) {
      setAuthError("All fields are required.");
      return;
    }
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Registration failed");
        return;
      }
      setAuthError("");
      // Perform instant auto-login
      handleLogin(e);
    } catch (err) {
      setAuthError("Could not connect to back-end.");
    }
  };

  const handleRegisterInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput || !passwordInput) {
      setAuthError("All fields are required.");
      return;
    }
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: usernameInput,
          password: passwordInput,
          inviteToken: urlInviteToken
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Registration failed");
        return;
      }
      setAuthError("");
      // Perform instant auto-login
      handleLogin(e);
      setUrlInviteToken(null);
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      setAuthError("Could not connect to back-end.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (!usernameInput || !passwordInput) {
      setAuthError("Username and password are required.");
      return;
    }
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Login credentials incorrect.");
        return;
      }
      localStorage.setItem("bedrock_token", data.token);
      localStorage.setItem("bedrock_user", JSON.stringify(data.user));
      setToken(data.token);
      setCurrentUser(data.user);
      setUsernameInput("");
      setPasswordInput("");
      setAuthError("");
      checkAuthStatus();
    } catch (err) {
      setAuthError("Could not connect to authentication services.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("bedrock_token");
    localStorage.removeItem("bedrock_user");
    setToken(null);
    setCurrentUser(null);
    setStats(null);
  };

  const showBanner = (text: string, type: "info" | "success" | "error" = "info") => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage({ text: "", type: "info" }), 5000);
  };

  // Server management processes (viewer allowed)
  const executeServerControl = async (action: "start" | "stop" | "restart") => {
    if (!token) return;
    try {
      const res = await fetch("/api/server/control", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (!res.ok) {
        showBanner(data.error || `Failed to execute ${action}`, "error");
        return;
      }
      showBanner(`Server command '${action}' dispatched.`, "success");
      fetchDataFeed();
    } catch (e) {
      showBanner("Failed sending power control API signal", "error");
    }
  };

  // Submit terminal inputs
  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandText || !token) return;
    try {
      const res = await fetch("/api/console", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ command: commandText })
      });
      if (res.ok) {
        setCommandText("");
      } else {
        const err = await res.json();
        showBanner(err.error || "Failed delivering console instruction", "error");
      }
    } catch (err) {
      showBanner("Communication crash dispatching console prompt", "error");
    }
  };

  const sendPresetCommand = async (command: string) => {
    if (!token) return;
    try {
      const res = await fetch("/api/console", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ command })
      });
      if (res.ok) {
        showBanner(`Preset command "${command}" executed!`, "success");
        fetchDataFeed();
      } else {
        const err = await res.json();
        showBanner(err.error || `Failed executing preset command`, "error");
      }
    } catch (err) {
      showBanner("Communication crash dispatching preset command", "error");
    }
  };

  // Create customized viewers/administrators (Admin only)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !isAdmin) return;
    if (!newUsername || !newPassword) {
      setUserActionMsg("Please supply both user credential fields.");
      return;
    }
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ username: newUsername, password: newPassword, role: newUserRole })
      });
      const data = await res.json();
      if (!res.ok) {
        setUserActionMsg(data.error || "Failed registration");
        return;
      }
      setNewUsername("");
      setNewPassword("");
      setNewUserRole("viewer");
      setUserActionMsg("User account appended successfully!");
      // reload
      fetchDataFeed();
    } catch (e) {
      setUserActionMsg("Error contacting API registration backend");
    }
  };

  // Delete user credential rules
  const handleDeleteUser = async (userToRm: string) => {
    if (!token || !isAdmin) return;
    promptConfirm(
      "Delete User Account",
      `Are you sure you want to completely remove the user account for "${userToRm}"?`,
      async () => {
        try {
          const res = await fetch(`/api/users/${userToRm}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            showBanner(`User ${userToRm} deactivated.`, "success");
            fetchDataFeed();
          } else {
            const data = await res.json();
            showBanner(data.error || "Failed deleting account rule", "error");
          }
        } catch (e) {
          showBanner("API error removing account ruleset", "error");
        }
      }
    );
  };

  // Generate Invite tokens (Admin only)
  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !isAdmin) return;
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newInviteRole })
      });
      const data = await res.json();
      if (res.ok) {
        showBanner("Successfully created new user invite token!", "success");
        fetchDataFeed();
      } else {
        showBanner(data.error || "Failed to create invite.", "error");
      }
    } catch (e) {
      showBanner("Failed to send invite request.", "error");
    }
  };

  // Delete invite token
  const handleDeleteInvite = async (inviteToken: string) => {
    if (!token || !isAdmin) return;
    promptConfirm(
      "Revoke Invite Link",
      "Are you sure you want to revoke and delete this active user invitation link?",
      async () => {
        try {
          const res = await fetch(`/api/invites/${inviteToken}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            showBanner("Invite link revoked.", "success");
            fetchDataFeed();
          } else {
            const d = await res.json();
            showBanner(d.error || "Failed to revoke invite", "error");
          }
        } catch (e) {
          showBanner("Error revoking invite", "error");
        }
      }
    );
  };

  // Addon action togglers (Admin only)
  const toggleAddonEnabled = async (uuid: string, isCurrentlyEnabled: boolean) => {
    if (!token || !isAdmin) {
      showBanner("Requires administrator authorization.", "error");
      return;
    }
    const endpoint = `/api/addons/${uuid}/${isCurrentlyEnabled ? "disable" : "enable"}`;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showBanner(`Addon configuration state updated.`, "success");
        fetchDataFeed();
      } else {
        const d = await res.json();
        showBanner(d.error || "Update toggler failed", "error");
      }
    } catch (e) {
      showBanner("Error switching addon settings", "error");
    }
  };

  const deleteAddon = async (uuid: string) => {
    if (!token || !isAdmin) return;

    const addon = addons.find(a => a.uuid === uuid);
    const otherGrouped = addon ? addons.find(a => 
      a.uuid !== uuid && 
      ((addon.groupId && a.groupId === addon.groupId) || 
       (addon.originalName && a.originalName === addon.originalName && addon.originalName !== ""))
    ) : null;

    const title = otherGrouped ? "Delete Grouped Addon Packs" : "Delete Addon Pack";
    const message = otherGrouped 
      ? `This addon is part of a package bundle (extracted from "${addon.originalName || "the same .mcaddon"}"). Deleting it will also fully delete the associated pack: "${otherGrouped.name}". Are you sure you want to delete both?`
      : "Are you sure you want to completely delete this addon and associated files from the physical disk?";

    promptConfirm(
      title,
      message,
      async () => {
        try {
          const res = await fetch(`/api/addons/${uuid}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.deletedCount > 1) {
              showBanner(`Grouped packs deleted physically: ${data.deletedNames}`, "success");
            } else {
              showBanner("Addon package deleted physically.", "success");
            }
            fetchDataFeed();
          } else {
            const d = await res.json();
            showBanner(d.error || "Failed disk delete addon", "error");
          }
        } catch (e) {
          showBanner("Error deletion addons API", "error");
        }
      }
    );
  };

  const handleDeleteAllAddons = async () => {
    if (!token || !isAdmin) return;

    promptConfirm(
      "Delete All Addons",
      `Are you absolutely sure you want to completely delete all ${addons.length} behavior and resource packs? This action physically deletes all packs from the host disk and cannot be undone.`,
      async () => {
        try {
          const res = await fetch("/api/addons-all", {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            showBanner(`Successfully deleted all ${data.count} addon(s) from disk.`, "success");
            fetchDataFeed();
          } else {
            const d = await res.json();
            showBanner(d.error || "Failed disk delete all addons", "error");
          }
        } catch (e) {
          showBanner("Error deletion all addons API", "error");
        }
      }
    );
  };

  const openEditAddon = (addon: AddonMetadata) => {
    setEditingAddon(addon);
    // Strip trailing BP, RP, [BP], [RP], (BP), (RP) with or without brackets so we show a clean name during edit
    const cleanName = addon.name.replace(/\s+(?:\[?BP\]?|\[?RP\]?|\(?BP\)?|\(?RP\)?)$/i, "").trim();
    setEditAddonName(cleanName);
    setEditAddonDescription(addon.description || "");
    setEditAddonDownloadUrl(addon.downloadUrl || "");
  };

  const handleSaveAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAddon || !token || !isAdmin) return;

    setIsSavingAddon(true);
    try {
      const res = await fetch(`/api/addons/${editingAddon.uuid}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editAddonName,
          description: editAddonDescription,
          downloadUrl: editAddonDownloadUrl
        })
      });

      const data = await res.json();
      if (res.ok) {
        showBanner("Addon configuration updated.", "success");
        setEditingAddon(null);
        fetchDataFeed();
      } else {
        showBanner(data.error || "Failed updating addon settings.", "error");
      }
    } catch (err) {
      showBanner("Communication layout error with the API server.", "error");
    } finally {
      setIsSavingAddon(false);
    }
  };

  const handleEnableAllAddons = async () => {
    if (!token || !isAdmin) return;
    try {
      const res = await fetch("/api/addons/enable-all", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showBanner("All behavior and resource packs enabled successfully.", "success");
        fetchDataFeed();
      } else {
        showBanner("Failed to enable all addons.", "error");
      }
    } catch (e) {
      showBanner("Failed connecting to API.", "error");
    }
  };

  const handleDisableAllAddons = async () => {
    if (!token || !isAdmin) return;
    try {
      const res = await fetch("/api/addons/disable-all", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showBanner("All behavior and resource packs disabled successfully.", "success");
        fetchDataFeed();
      } else {
        showBanner("Failed to disable all addons.", "error");
      }
    } catch (e) {
      showBanner("Failed connecting to API.", "error");
    }
  };

  // Multer Addons and Worlds uploading trigger hooks
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>, isWorld: boolean = false) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !token || !isAdmin) return;

    setIsUploading(true);
    setUploadError("");

    const formData = new FormData();
    const endpoint = isWorld ? "/api/worlds/upload" : "/api/addons/upload";

    if (isWorld) {
      const file = files[0];
      showBanner(`Uploading world ${file.name}...`, "info");
      formData.append("file", file);
    } else {
      const fileNames = Array.from(files).map((f: any) => f.name).join(", ");
      showBanner(`Uploading ${files.length} packs (${fileNames})...`, "info");
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "Failed upload processing.");
        showBanner(data.error || "Uploader error", "error");
      } else {
        if (data.taskIds) {
          showBanner(`Uploaded ${files.length} packs successfully! Background tasks started executing.`, "success");
        } else {
          showBanner(`Uploaded successfully. Background task #${data.taskId} is indexing!`, "success");
        }
        fetchDataFeed();
      }
    } catch (err) {
      setUploadError("Network uploader fault.");
      showBanner("Upload transfer failure", "error");
    } finally {
      setIsUploading(false);
      // reset forms
      if (e.target) e.target.value = "";
    }
  };

  const handleUpdateAddonFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !updatingAddonUuid || !token || !isAdmin) return;

    setIsUploading(true);
    setUploadError("");
    showBanner(`Updating addon with custom file: ${file.name}...`, "info");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/addons/${updatingAddonUuid}/update-upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "Failed override update processing.");
        showBanner(data.error || "Override update error", "error");
      } else {
        showBanner(`Addon updated and overridden successfully! Background task #${data.taskId} is indexing!`, "success");
        fetchDataFeed();
      }
    } catch (err) {
      setUploadError("Network update uploader fault.");
      showBanner("Update upload transfer failure", "error");
    } finally {
      setIsUploading(false);
      setUpdatingAddonUuid(null);
      if (e.target) e.target.value = "";
    }
  };

  // Config modifier
  const updateSettingsField = async (fields: Partial<AppConfig>) => {
    if (!token || !isAdmin) return;
    try {
      const res = await fetch("/api/server/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(fields)
      });
      if (res.ok) {
        showBanner("Bedrock Server configurations modified.", "success");
        fetchDataFeed();
      } else {
        showBanner("Failed setting changes.", "error");
      }
    } catch (err) {
      showBanner("Network config save error", "error");
    }
  };

  // Switch Active Minecraft World
  const setActiveWorld = async (folderName: string) => {
    if (!token || !isAdmin) return;
    try {
      const res = await fetch(`/api/worlds/${folderName}/select`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showBanner(`Active World swapped to "${folderName}".`, "success");
        fetchDataFeed();
      } else {
        const d = await res.json();
        showBanner(d.error || "Fail setting active world.", "error");
      }
    } catch (e) {
      showBanner("Server error worlds API", "error");
    }
  };

  // Install Minecraft Update
  const installBedrockVersion = async (version: string, downloadUrl: string) => {
    if (!token || !isAdmin) return;

    if (stats?.status !== "stopped") {
      showBanner("You must completely STOP the Bedrock Server before updates/installations.", "error");
      return;
    }

    promptConfirm(
      "Install Bedrock Version",
      `Are you positive you wish to install Bedrock dedicated version: ${version}? This will overwrite existing core files.`,
      async () => {
        try {
          const res = await fetch("/api/versions/install", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ version, downloadUrl })
          });
          if (res.ok) {
            const data = await res.json();
            showBanner(`Deploy process started (Task: ${data.taskId}). Check console tasks tab!`, "success");
            fetchDataFeed();
          } else {
            const d = await res.json();
            showBanner(d.error || "Failed updating versions info", "error");
          }
        } catch (e) {
          showBanner("Server update endpoint communications loss", "error");
        }
      }
    );
  };

  // Helper clear log entries
  const handleClearFinishedTasks = async () => {
    if (!token) return;
    try {
      await fetch("/api/tasks/clear", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDataFeed();
    } catch (e) {}
  };

  const handleClearHistoryLogs = async () => {
    if (!token) return;
    try {
      await fetch("/api/logs/history/clear", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDataFeed();
    } catch (e) {}
  };

  // Format sizing bytes helper
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = 2;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // ------------------------- Rendering Engine -------------------------

  // 1. Initial State: Load Auth Gate check
  if (hasAdmin === null) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-300 font-sans p-6 text-center">
        <Server className="w-12 h-12 text-green-500 animate-pulse mb-4" />
        <p className="text-sm font-semibold tracking-wide uppercase text-zinc-500">Checking configurations...</p>
      </div>
    );
  }

  // 2. State: Setup First Admin Credential UI
  if (hasAdmin === false) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 select-none">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <Shield className="w-8 h-8 text-zinc-100" />
            </div>
            <h1 id="bento-title" className="text-2xl font-bold tracking-tight text-white mt-4">Welcome to Bedrock Host</h1>
            <p className="text-sm text-zinc-500">Create your Primary Administrator account to boot setup.</p>
          </div>

          <form onSubmit={handleRegisterAdmin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs uppercase font-bold tracking-wider text-zinc-400">Admin Username</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                <input
                  id="admin-username"
                  type="text"
                  required
                  placeholder="admin"
                  value={usernameInput}
                  onChange={e => setUsernameInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase font-bold tracking-wider text-zinc-400">Security Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                <input
                  id="admin-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              id="admin-submit"
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl tracking-wide shadow-md shadow-emerald-600/10 cursor-pointer transition-all duration-150"
            >
              Configure Master Administrator
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 3. State: User Login Verification Gate if Admin exists but current has no verified session token
  if (!token || !currentUser) {
    if (urlInviteToken) {
      return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 select-none animate-fade-in font-sans">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-900 rounded-2xl shadow-2xl p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <Shield className="w-8 h-8 text-zinc-100 animate-pulse" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white mt-4">Accept Invite Portal</h1>
              <p className="text-sm text-zinc-500">Create your credentials to join this server's control portal.</p>
            </div>

            {inviteValid === null ? (
              <div className="text-center py-6 text-zinc-500 text-xs font-mono animate-pulse">
                Verifying invite token validity...
              </div>
            ) : inviteValid === false ? (
              <div className="space-y-4">
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 text-center flex flex-col items-center gap-2">
                  <XCircle className="w-8 h-8 text-red-500" />
                  <span className="font-bold uppercase tracking-wider">Invalid Invite Link</span>
                  <p className="text-[11px] text-zinc-500 leading-normal">{inviteError || "Invite token has expired or is invalid."}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setUrlInviteToken(null)}
                  className="w-full py-2.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl transition-all cursor-pointer text-center uppercase tracking-wider"
                >
                  Go to Standard Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegisterInvite} className="space-y-4">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                  <span className="text-[10px] font-black text-emerald-400 block uppercase tracking-widest">
                    Role Assigned: {inviteRole === "admin" ? "Systems Administrator" : "Portal Viewer"}
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs uppercase font-bold tracking-wider text-zinc-400">Your Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      required
                      placeholder="Username"
                      value={usernameInput}
                      onChange={e => setUsernameInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs uppercase font-bold tracking-wider text-zinc-400">Security Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={passwordInput}
                      onChange={e => setPasswordInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                {authError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer transition-all duration-150"
                >
                  Register & Sign Up
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUrlInviteToken(null);
                      setAuthError("");
                      setUsernameInput("");
                      setPasswordInput("");
                    }}
                    className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer underline"
                  >
                    Back to Standard Login
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 select-none">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-zinc-800 border border-zinc-700 rounded-2xl flex items-center justify-center mx-auto">
              <KeyRound className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 id="login-title" className="text-2xl font-bold tracking-tight text-white mt-4">Authorized Login</h1>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold text-emerald-500">Bedrock dedicated environment</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs uppercase font-bold tracking-wider text-zinc-400">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                <input
                  id="user-username"
                  type="text"
                  required
                  placeholder="Username"
                  value={usernameInput}
                  onChange={e => setUsernameInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase font-bold tracking-wider text-zinc-400">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                <input
                  id="user-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2 animate-bounce">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl tracking-wide cursor-pointer transition-all duration-150"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 4. Primary dashboard application frame
  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden select-none">
      {/* 4.1 Side Navigation */}
      <nav id="sidebar-nav" className="w-68 border-r border-zinc-900 bg-zinc-900/30 flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-zinc-900 flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600/20 border border-emerald-500/30 rounded-lg flex items-center justify-center font-black text-xl text-emerald-400 shadow-inner">
            B
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-lg text-white">Bedrock Panel</span>
            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest leading-none mt-0.5">MCPE Dedicate</span>
          </div>
        </div>

        {/* Menu selections */}
        <div className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <button
            id="nav-dash"
            onClick={() => setNavTab("dashboard")}
            className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 text-sm font-medium transition-all ${
              navTab === "dashboard"
                ? "bg-zinc-800/80 text-white shadow-md border border-zinc-700/50"
                : "text-zinc-400 hover:bg-zinc-800/20 hover:text-zinc-300"
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-500 opacity-90" />
            Dashboard Space
          </button>

          <button
            id="nav-mods"
            onClick={() => setNavTab("addons")}
            className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 text-sm font-medium transition-all ${
              navTab === "addons"
                ? "bg-zinc-800/80 text-white shadow-md border border-zinc-700/50"
                : "text-zinc-400 hover:bg-zinc-800/20 hover:text-zinc-300"
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-500 opacity-90" />
            Addons & Packs
          </button>

          <button
            id="nav-worlds"
            onClick={() => setNavTab("worlds")}
            className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 text-sm font-medium transition-all ${
              navTab === "worlds"
                ? "bg-zinc-800/80 text-white shadow-md border border-zinc-700/50"
                : "text-zinc-400 hover:bg-zinc-800/20 hover:text-zinc-300"
            }`}
          >
            <FolderOpen className="w-4 h-4 text-emerald-500 opacity-90" />
            Worlds Vault
          </button>

          <button
            id="nav-console"
            onClick={() => setNavTab("console")}
            className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 text-sm font-medium transition-all ${
              navTab === "console"
                ? "bg-zinc-800/80 text-white shadow-md border border-zinc-700/50"
                : "text-zinc-400 hover:bg-zinc-800/20 hover:text-zinc-300"
            }`}
          >
            <Terminal className="w-4 h-4 text-emerald-500 opacity-90" />
            Live Terminals
          </button>

          {isAdmin && (
            <button
              id="nav-users"
              onClick={() => setNavTab("users")}
              className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 text-sm font-medium transition-all ${
                navTab === "users"
                  ? "bg-zinc-800/80 text-white shadow-md border border-zinc-700/50"
                  : "text-zinc-400 hover:bg-zinc-800/20 hover:text-zinc-300"
              }`}
            >
              <Users className="w-4 h-4 text-emerald-500 opacity-90" />
              Users & Admins
            </button>
          )}

          <button
            id="nav-console-connect"
            onClick={() => setNavTab("console_connect")}
            className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 text-sm font-medium transition-all ${
              navTab === "console_connect"
                ? "bg-zinc-800/80 text-white shadow-md border border-zinc-700/50"
                : "text-zinc-400 hover:bg-zinc-800/20 hover:text-zinc-300"
            }`}
          >
            <ExternalLink className="w-4 h-4 text-emerald-400 opacity-90" />
            Console Connect
          </button>

          <button
            id="nav-selfhost"
            onClick={() => setNavTab("selfhost")}
            className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 text-sm font-medium transition-all ${
              navTab === "selfhost"
                ? "bg-zinc-800/80 text-white shadow-md border border-zinc-700/50"
                : "text-zinc-400 hover:bg-zinc-800/20 hover:text-zinc-300"
            }`}
          >
            <Layers className="w-4 h-4 text-blue-400 opacity-90" />
            Hosting & Docker Setup
          </button>
        </div>

        {/* User profile footer controls */}
        <div className="p-4 border-t border-zinc-900 bg-zinc-950/20 space-y-2">
          <div className="flex items-center gap-3 p-2 bg-zinc-900/30 border border-zinc-900 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-sm text-white">
              {currentUser.username[0]?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate leading-tight">{currentUser.username}</p>
              <span className={`text-[9px] uppercase font-black tracking-widest ${currentUser.role === "admin" ? "text-emerald-400" : "text-amber-400"}`}>
                {currentUser.role}
              </span>
            </div>
            <button
              id="user-logout"
              onClick={handleLogout}
              className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <div className="text-[10px] text-zinc-600 text-center uppercase tracking-wide font-medium">v1.4.2 stable</div>
        </div>
      </nav>

      {/* 4.2 Main dashboard canvas */}
      <main className="flex-1 flex flex-col min-w-0 bg-zinc-950 overflow-hidden relative">
        {/* Floating toast notification banner if messages exist */}
        {actionMessage.text && (
          <div
            id="toast-notification-banner"
            className={`fixed bottom-6 right-6 z-[9999] px-5 py-3 rounded-xl border flex items-center gap-3 shadow-2xl transition-all duration-300 max-w-sm ${
              actionMessage.type === "success"
                ? "bg-emerald-950 border-emerald-500/20 text-emerald-200"
                : actionMessage.type === "error"
                ? "bg-red-950 border-red-500/20 text-red-250"
                : "bg-zinc-900 border-zinc-700/50 text-zinc-250"
            }`}
          >
            {actionMessage.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : actionMessage.type === "error" ? (
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            ) : (
              <Clock className="w-5 h-5 text-blue-400 flex-shrink-0 animate-spin" />
            )}
            <span className="text-xs font-medium leading-relaxed">{actionMessage.text}</span>
          </div>
        )}

        {/* Dynamic Uploader Form Progress Banner */}
        {isUploading && (
          <div className="absolute top-0 left-0 w-full bg-emerald-500 h-1 z-50 animate-pulse" />
        )}

        {/* 4.3 App Header Controls Bar */}
        <header id="app-header-view" className="h-20 border-b border-zinc-900 bg-zinc-900/10 px-8 flex items-center justify-between flex-shrink-0 select-none">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-white tracking-tight">{appConfig.levelName}</h1>
              {stats?.status === "running" ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                  Live
                </span>
              ) : stats?.status === "starting" ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-black uppercase text-amber-400 tracking-wider animate-pulse">
                  Starting
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                  Offline
                </span>
              )}
            </div>
            <p className="text-zinc-500 text-xs mt-0.5 font-mono">
              IP: localhost:{appConfig.serverPort} • MCPE Core: v{appConfig.selectedVersion}
            </p>
          </div>

          <div className="flex gap-2.5">
            <button
              id="server-control-start"
              onClick={() => executeServerControl("start")}
              disabled={stats?.status !== "stopped"}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 tracking-wide transition-all border cursor-pointer ${
                stats?.status === "stopped"
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/20 shadow-lg shadow-emerald-600/10"
                  : "bg-zinc-900/50 text-zinc-600 border-zinc-950 cursor-not-allowed"
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              Start
            </button>

            <button
              id="server-control-stop"
              onClick={() => executeServerControl("stop")}
              disabled={stats?.status === "stopped" || stats?.status === "stopping"}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 tracking-wide transition-all border cursor-pointer ${
                stats?.status !== "stopped" && stats?.status !== "stopping"
                  ? "bg-red-600/20 hover:bg-red-600/30 text-red-500 border-red-500/20 shadow-lg"
                  : "bg-zinc-900/50 text-zinc-600 border-zinc-950 cursor-not-allowed"
              }`}
            >
              <Square className="w-3.5 h-3.5" />
              Stop
            </button>

            <button
              id="server-control-restart"
              onClick={() => executeServerControl("restart")}
              disabled={stats?.status === "stopped"}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 tracking-wide bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 cursor-pointer transition-all ${
                stats?.status === "stopped" ? "opacity-40 cursor-not-allowed" : ""
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Restart
            </button>
          </div>
        </header>

        {/* 4.4 Dynamic routing container depending on visible Nav Tab */}
        <div className="flex-1 p-6 overflow-y-auto min-h-0 select-none">
          {/* ==================== A. DASHBOARD NAVIGATION VIEW ==================== */}
          {navTab === "dashboard" && (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
              {/* Stats Widgets Bento */}
              <div className="xl:col-span-1 space-y-5">
                {/* Simulated Stats Core Indicators */}
                <div id="stat-card-cpu" className="bg-zinc-900/50 border border-zinc-900 rounded-2xl p-5 flex flex-col justify-between h-32 hover:border-zinc-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">CPU Ticks</span>
                    <Cpu className="w-4 h-4 text-zinc-500" />
                  </div>
                  <div className="text-3xl font-black text-white tracking-tight mt-1">
                    {stats?.cpuUsage ?? 0}<span className="text-sm font-bold text-zinc-500 ml-0.5">%</span>
                  </div>
                  <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden mt-3">
                    <div
                      className="bg-blue-500 h-full transition-all duration-500"
                      style={{ width: `${stats?.cpuUsage ?? 0}%` }}
                    />
                  </div>
                </div>

                <div id="stat-card-ram" className="bg-zinc-900/50 border border-zinc-900 rounded-2xl p-5 flex flex-col justify-between h-32 hover:border-zinc-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Memory Stack</span>
                    <Layers className="w-4 h-4 text-zinc-500" />
                  </div>
                  <div className="text-3xl font-black text-white tracking-tight mt-1">
                    {stats?.memoryUsage ?? 0}<span className="text-sm font-bold text-zinc-500 ml-1">GB / 8GB</span>
                  </div>
                  <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden mt-3">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-500"
                      style={{ width: `${((stats?.memoryUsage ?? 0) / 8) * 100}%` }}
                    />
                  </div>
                </div>

                <div id="stat-card-general" className="bg-zinc-900/50 border border-zinc-900 rounded-2xl p-5 space-y-3.5 hover:border-zinc-800 transition-colors">
                  <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest block">System Diagnostics</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-950">
                      <span className="text-[9px] text-zinc-600 block uppercase font-bold tracking-wider mb-0.5">TPS Speed</span>
                      <p className="text-base font-black text-emerald-400">{stats?.tps ?? "0.0"}</p>
                    </div>
                    <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-950">
                      <span className="text-[9px] text-zinc-600 block uppercase font-bold tracking-wider mb-0.5">Uptime Run</span>
                      <p className="text-sm font-black text-zinc-300 truncate">{stats?.uptime ?? "Offline"}</p>
                    </div>
                    <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-950">
                      <span className="text-[9px] text-zinc-600 block uppercase font-bold tracking-wider mb-0.5">Active Addons</span>
                      <p className="text-base font-black text-white">{addons.length}</p>
                    </div>
                    <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-950">
                      <span className="text-[9px] text-zinc-600 block uppercase font-bold tracking-wider mb-0.5">Backup Worlds</span>
                      <p className="text-base font-black text-white">{worlds.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Console Logs Tabbed Card Interface Bento */}
              <div className="xl:col-span-2 bg-zinc-900/40 border border-zinc-900 rounded-2xl flex flex-col h-[520px] overflow-hidden shadow-xl">
                {/* Console tabs headers */}
                <div id="console-sub-navigation" className="px-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-950/40 h-14">
                  <div className="flex gap-1">
                    <button
                      id="console-tab-logs"
                      onClick={() => setConsoleTab("logs")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                        consoleTab === "logs" ? "bg-zinc-850 text-emerald-400" : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      Console Stream
                    </button>
                    <button
                      id="console-tab-tasks"
                      onClick={() => setConsoleTab("tasks")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors relative ${
                        consoleTab === "tasks" ? "bg-zinc-850 text-emerald-400" : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      Task Tracker
                      {activeTasks.some(t => t.status === "running" || t.status === "pending") && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
                      )}
                    </button>
                    <button
                      id="console-tab-history"
                      onClick={() => setConsoleTab("history")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                        consoleTab === "history" ? "bg-zinc-850 text-emerald-400" : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      Logs History
                    </button>
                  </div>

                  {consoleTab === "tasks" && activeTasks.length > 0 && (
                    <button
                      onClick={handleClearFinishedTasks}
                      className="text-[9px] uppercase tracking-wider bg-zinc-900 hover:bg-zinc-850 px-2 py-1 rounded text-zinc-400 border border-zinc-800"
                    >
                      Flush list
                    </button>
                  )}
                  {consoleTab === "history" && pastLogs.length > 0 && (
                    <button
                      onClick={handleClearHistoryLogs}
                      className="text-[9px] uppercase tracking-wider bg-zinc-900 hover:bg-zinc-850 px-2 py-1 rounded text-zinc-400 border border-zinc-800"
                    >
                      Clear history
                    </button>
                  )}
                </div>

                {/* Sub-tab view renderer blocks */}
                <div className="flex-1 p-5 overflow-hidden flex flex-col bg-zinc-950/20">
                  {consoleTab === "logs" && (
                    <>
                      <div
                        id="terminal-text-sandbox"
                        ref={logContainerRef}
                        className="flex-1 overflow-y-auto font-mono text-xs space-y-1.5 pr-2"
                      >
                        {consoleLogs.length === 0 ? (
                          <p className="text-zinc-600 italic">No console logs buffered.</p>
                        ) : (
                          consoleLogs.map((log, idx) => (
                            <div key={idx} className="flex gap-2.5 leading-relaxed">
                              <span className="text-zinc-600 font-bold select-none">[ {log.timestamp.slice(11, 19)} ]</span>
                              <span
                                className={`font-black select-none uppercase tracking-wider text-[9px] px-1 rounded h-4 flex items-center ${
                                  log.type === "ERROR"
                                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                    : log.type === "WARN"
                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    : log.type === "PLAYER"
                                    ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                    : log.type === "SYS"
                                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                    : "bg-zinc-800 text-zinc-400"
                                }`}
                              >
                                {log.type}
                              </span>
                              <span className="text-zinc-300 break-all">{log.message}</span>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Preset Commands Bar */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-4 p-2 bg-zinc-900/30 border border-zinc-900/50 rounded-xl">
                        <span className="text-[9px] uppercase font-black text-zinc-500 tracking-wider mr-1 select-none">Presets:</span>
                        {[
                          { label: "List Players", cmd: "list" },
                          { label: "Day", cmd: "time set day" },
                          { label: "Night", cmd: "time set night" },
                          { label: "Clear Weather", cmd: "weather clear" },
                          { label: "Hard Diff", cmd: "difficulty hard" },
                          { label: "Keep Inventory", cmd: "gamerule keepinventory true" },
                          { label: "Show Coords", cmd: "gamerule showcoordinates true" },
                          { label: "Whitelist List", cmd: "whitelist list" },
                        ].map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            disabled={stats?.status !== "running"}
                            onClick={() => sendPresetCommand(preset.cmd)}
                            className="px-2 py-1 text-[9px] font-bold bg-zinc-950 border border-zinc-905 hover:border-zinc-800 hover:bg-zinc-900 hover:text-emerald-400 text-zinc-400 rounded-lg font-mono transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 select-none"
                            title={`Execute command: /${preset.cmd}`}
                          >
                            /{preset.cmd}
                          </button>
                        ))}
                      </div>

                      {/* Command Sender Entry Input */}
                      <form onSubmit={handleSendCommand} className="mt-3 p-2 bg-zinc-950 border border-zinc-900 rounded-xl flex gap-2">
                        <span className="text-zinc-600 pl-1 py-1 font-bold font-mono">$</span>
                        <input
                          id="console-command-bar"
                          type="text"
                          placeholder={stats?.status === "running" ? "Send Bedrock server console command..." : "Server must be online to execute commands."}
                          disabled={stats?.status !== "running"}
                          value={commandText}
                          onChange={e => setCommandText(e.target.value)}
                          className="bg-transparent border-none outline-none text-xs w-full text-zinc-300 font-mono placeholder-zinc-700 disabled:cursor-not-allowed"
                        />
                        <button
                          type="submit"
                          disabled={stats?.status !== "running"}
                          className={`px-3 py-1 rounded-lg text-[10px] uppercase font-black tracking-widest shadow cursor-pointer transition-all ${
                            stats?.status === "running" ? "bg-emerald-600 text-white hover:bg-emerald-500" : "bg-zinc-900 text-zinc-700 cursor-not-allowed"
                          }`}
                        >
                          Execute
                        </button>
                      </form>
                    </>
                  )}

                  {consoleTab === "tasks" && (
                    <div className="flex-1 overflow-y-auto space-y-4">
                      {activeTasks.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-zinc-950/40 rounded-xl border border-zinc-900">
                          <CheckCircle className="w-8 h-8 text-zinc-700 mb-2" />
                          <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wide">All background jobs completed</p>
                          <p className="text-[10px] text-zinc-600 mt-0.5">Upload a pack config to trigger new indexing.</p>
                        </div>
                      ) : (
                        activeTasks.map((t, idx) => (
                          <div key={idx} className="bg-zinc-900/50 border border-zinc-900 p-4 rounded-xl space-y-2.5">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-xs font-black text-white tracking-wide">{t.name}</h4>
                                <p className="text-[10px] text-zinc-500 mt-0.5">{t.description}</p>
                              </div>
                              <span
                                className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                                  t.status === "completed"
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : t.status === "failed"
                                    ? "bg-red-500/10 text-red-400"
                                    : "bg-amber-500/10 text-amber-400 animate-pulse"
                                }`}
                              >
                                {t.status}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-300 ${t.status === "failed" ? "bg-red-500" : "bg-emerald-500"}`}
                                  style={{ width: `${t.progress}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-[10px] font-mono">
                                <span className="text-zinc-400 truncate max-w-xs">{t.message}</span>
                                <span className="text-zinc-500">{t.progress}%</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {consoleTab === "history" && (
                    <div className="flex-1 overflow-y-auto space-y-3">
                      {pastLogs.length === 0 ? (
                        <p className="text-zinc-600 italic text-center p-6 text-xs">History logs database currently empty.</p>
                      ) : (
                        pastLogs.map((h, idx) => (
                          <div key={idx} className="p-3 bg-zinc-900/30 border border-zinc-900 rounded-xl flex gap-3 text-xs leading-relaxed">
                            {h.status === "completed" ? (
                              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between">
                                <span className="font-bold text-zinc-300">{h.name}</span>
                                <span className="text-[10px] font-mono text-zinc-600">{h.timestamp.slice(11, 16)}</span>
                              </div>
                              <p className="text-[10px] text-zinc-500 mt-0.5 lowercase leading-snug">{h.message}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Server Active Players list bento */}
              <div className="xl:col-span-1 bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 flex flex-col h-[520px] overflow-hidden shadow-lg hover:border-zinc-800 transition-colors">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Active Players</h3>
                  <div className="flex items-center gap-1.5 text-xs font-black bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full select-none">
                    <Users className="w-3 h-3" />
                    <span>{stats?.activePlayers ?? 0} / {appConfig.maxPlayers}</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {!stats?.players || stats.players.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <Users className="w-8 h-8 text-zinc-800 mb-2" />
                      <p className="text-xs text-zinc-500 font-semibold uppercase">No players online</p>
                      <p className="text-[10px] text-zinc-600 mt-1 leading-snug">Minecraft survivalists join server directly on port 19132.</p>
                    </div>
                  ) : (
                    stats.players.map((p: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 bg-zinc-950/30 border border-zinc-900/60 p-3 rounded-xl hover:border-zinc-800 transition-colors">
                        <div className="w-9 h-9 bg-zinc-850 rounded-lg border border-zinc-800 flex items-center justify-center font-bold text-sm text-zinc-400 select-none">
                          {p.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate leading-tight">{p.name}</p>
                          <p className="text-[9px] text-zinc-500 font-mono mt-0.5">Ping: <span className="text-emerald-500 font-bold">{p.ping}ms</span></p>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setCommandText(`kick ${p.name}`);
                              showBanner(`Kicking prompt prefilled. Submit execute on console!`, "info");
                            }}
                            className="bg-zinc-900 text-zinc-500 hover:text-red-400 px-2 py-1 rounded text-[9px] uppercase font-bold tracking-wider hover:bg-zinc-850 border border-zinc-800 border-dashed"
                          >
                            Kick
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-4 border-t border-zinc-900 text-center select-none text-[9px] text-zinc-600 font-black tracking-widest uppercase">
                  Player Registries
                </div>
              </div>
            </div>
          )}

          {/* ==================== B. ADDONS & PACKS MANAGER VIEW ==================== */}
          {navTab === "addons" && (
            <div className="space-y-6 select-none">
              <div className="flex justify-between items-center bg-zinc-900/10 border border-zinc-900 rounded-2xl p-6">
                <div>
                  <h2 className="text-lg font-black text-white tracking-tight">Addon Pack Manager</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Configure Behaviour and Resource folders. Support for unzipped .mcpack and .mcaddon bundles.
                  </p>
                </div>

                {isAdmin ? (
                  <div className="flex gap-2">
                    {/* Hidden Inputs for upload files */}
                    <input
                      type="file"
                      ref={addonFileInputRef}
                      accept=".mcpack,.mcaddon"
                      multiple
                      onChange={e => handleUploadFile(e, false)}
                      className="hidden"
                    />
                    <input
                      type="file"
                      ref={updateAddonFileInputRef}
                      accept=".mcpack,.mcaddon"
                      onChange={handleUpdateAddonFile}
                      className="hidden"
                    />
                    <button
                      id="upload-addon-trigger"
                      onClick={() => addonFileInputRef.current?.click()}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wider uppercase px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md cursor-pointer text-center"
                    >
                      <UploadCloud className="w-4 h-4" />
                      Import Pack
                    </button>
                  </div>
                ) : (
                  <span className="px-3 py-1.5 rounded-xl bg-zinc-900 text-zinc-550 border border-zinc-850 text-xs font-bold leading-normal uppercase">
                    Viewer View-Only Modes
                  </span>
                )}
              </div>

              {uploadError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex gap-2">
                  <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Addon controls bar */}
              <div className="flex flex-wrap items-center gap-4 bg-zinc-900/15 border border-zinc-900 rounded-2xl p-4 justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Sort by:</span>
                  <select
                    value={addonSortBy}
                    onChange={(e) => setAddonSortBy(e.target.value as any)}
                    className="bg-zinc-950 text-zinc-350 text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-900 outline-none cursor-pointer focus:border-zinc-700 transition-colors"
                  >
                    <option value="name">Name</option>
                    <option value="date">Date Added</option>
                    <option value="enabled">Enabled First</option>
                    <option value="disabled">Disabled First</option>
                  </select>
                </div>

                {isAdmin && addons.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleEnableAllAddons}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer uppercase tracking-wider shadow-sm"
                    >
                      Enable All
                    </button>
                    <button
                      onClick={handleDisableAllAddons}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 font-bold text-xs rounded-xl transition-all cursor-pointer uppercase tracking-wider border border-zinc-700 shadow-sm"
                    >
                      Disable All
                    </button>
                    <button
                      onClick={handleDeleteAllAddons}
                      className="px-4 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 font-bold text-xs rounded-xl transition-all cursor-pointer uppercase tracking-wider border border-red-900/50 shadow-sm flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete All
                    </button>
                  </div>
                )}
              </div>

              {addons.length === 0 ? (
                <div className="bg-zinc-900/30 border border-zinc-900 p-12 text-center rounded-2xl flex flex-col items-center">
                  <Layers className="w-12 h-12 text-zinc-800 mb-3" />
                  <h3 className="text-sm font-black text-white tracking-wide">No minecraft addons installed</h3>
                  <p className="text-xs text-zinc-500 max-w-sm mt-1 leading-relaxed">
                    Upload .mcpack and .mcaddon bundles directly using the "Import Pack" button. Systems will unzip, extract, and index metadata records.
                  </p>
                </div>
              ) : (() => {
                // Inline sorting & rendering logic
                const sortedAddons = [...addons].sort((a, b) => {
                  if (addonSortBy === "name") {
                    return a.name.localeCompare(b.name);
                  } else if (addonSortBy === "date") {
                    const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
                    const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
                    return dateB - dateA;
                  } else if (addonSortBy === "enabled") {
                    if (a.isEnabled === b.isEnabled) return a.name.localeCompare(b.name);
                    return a.isEnabled ? -1 : 1;
                  } else if (addonSortBy === "disabled") {
                    if (a.isEnabled === b.isEnabled) return a.name.localeCompare(b.name);
                    return a.isEnabled ? 1 : -1;
                  }
                  return 0;
                });

                const activeBehaviorPacks = sortedAddons.filter(a => a.type === "behavior" && a.isEnabled);
                const activeResourcePacks = sortedAddons.filter(a => (a.type === "resource" || a.type === "world") && a.isEnabled);
                const disabledBehaviorPacks = sortedAddons.filter(a => a.type === "behavior" && !a.isEnabled);
                const disabledResourcePacks = sortedAddons.filter(a => (a.type === "resource" || a.type === "world") && !a.isEnabled);

                const renderAddonCard = (addon: AddonMetadata) => {
                  const isGrouped = addons.some(a => 
                    a.uuid !== addon.uuid && 
                    ((addon.groupId && a.groupId === addon.groupId) || 
                     (addon.originalName && a.originalName === addon.originalName && addon.originalName !== ""))
                  );

                  return (
                    <div
                      key={addon.uuid}
                      className={`bg-zinc-900/40 border rounded-2xl p-5 flex flex-col justify-between shadow transition-all hover:border-zinc-850 ${
                        addon.isEnabled ? "border-emerald-500/20 bg-emerald-950/10 animate-fade-in" : "border-zinc-900"
                      }`}
                    >
                      <div>
                        <div className="flex gap-4 items-start">
                          <div className="w-14 h-14 rounded-xl bg-zinc-850 flex-shrink-0 overflow-hidden border border-zinc-800 flex items-center justify-center">
                            {addon.icon ? (
                              <img src={addon.icon} alt={addon.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <Layers className="w-6 h-6 text-zinc-600" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-black text-white truncate tracking-wide" title={addon.name}>{addon.name}</h4>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              <span
                                className={`text-[8px] uppercase tracking-widest font-black px-1.5 py-0.5 rounded ${
                                  addon.type === "behavior" ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400"
                                }`}
                              >
                                {addon.type} Pack
                              </span>
                              {isGrouped && (
                                <span className="text-[8px] uppercase tracking-widest font-black px-1.5 py-0.5 rounded bg-pink-500/15 text-pink-400 border border-pink-500/20" title="Toggles are synchronized with matching behavior/resource dual packs">
                                  Grouped Addon
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-zinc-650 font-mono mt-1">Ver: {addon.version.join(".")}</p>
                          </div>
                        </div>

                        {addon.originalName && addon.originalName !== addon.name && (
                          <div className="mt-2.5 px-2 py-1 bg-zinc-950/40 border border-zinc-900/60 rounded font-mono text-[9px] text-zinc-500 truncate" title="Uploaded filename source">
                            Filename: {addon.originalName}
                          </div>
                        )}

                        <p className="text-[10px] text-zinc-500 mt-4 leading-relaxed line-clamp-3 h-10">{addon.description}</p>
                      </div>

                      <div className="flex justify-between items-center mt-5 pt-4 border-t border-zinc-900/60 select-none">
                        <div className="flex gap-2 items-center text-xs">
                          {addon.isEnabled ? (
                            <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest leading-none">
                              Active
                            </span>
                          ) : (
                            <span className="text-[10px] font-black text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-900 uppercase tracking-widest leading-none">
                              Disabled
                            </span>
                          )}

                          {addon.downloadUrl && (
                            <a
                              href={addon.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-500 hover:text-emerald-400 hover:scale-105 transition-all p-1 flex items-center gap-1 font-mono text-[9px] font-black tracking-wider border border-emerald-500/10 rounded bg-emerald-950/20"
                              title="Go to Pack Download Link"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>PACK LINK</span>
                            </a>
                          )}
                        </div>

                        {isAdmin && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleAddonEnabled(addon.uuid, addon.isEnabled)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-wider border cursor-pointer select-none transition-all ${
                                addon.isEnabled
                                  ? "bg-amber-600/10 text-amber-500 border-amber-500/25 hover:bg-amber-600/20"
                                  : "bg-emerald-600/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-600/20"
                              }`}
                            >
                              {addon.isEnabled ? "Disable" : "Enable"}
                            </button>

                            <button
                              onClick={() => openEditAddon(addon)}
                              className="p-1.5 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 rounded-lg cursor-pointer"
                              title="Edit addon properties"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                setUpdatingAddonUuid(addon.uuid);
                                setTimeout(() => updateAddonFileInputRef.current?.click(), 10);
                              }}
                              className="p-1.5 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 rounded-lg cursor-pointer"
                              title="Update/Override pack with updated file"
                            >
                              <UploadCloud className="w-3.5 h-3.5 text-blue-400" />
                            </button>

                            <button
                              onClick={() => deleteAddon(addon.uuid)}
                              className="p-1.5 border border-zinc-800 text-zinc-500 hover:text-red-500 hover:border-red-550 rounded-lg cursor-pointer"
                              title="Delete physical pack"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                };

                return (
                  <div className="space-y-10 mt-6">
                    {/* Active Behavior Packs */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-zinc-900">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400">
                          Active Behavior Packs ({activeBehaviorPacks.length})
                        </h3>
                      </div>
                      {activeBehaviorPacks.length === 0 ? (
                        <p className="text-xs text-zinc-600 italic pl-1">No Active Behavior packs currently loaded.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                          {activeBehaviorPacks.map(renderAddonCard)}
                        </div>
                      )}
                    </div>

                    <div className="h-[1px] bg-gradient-to-r from-purple-500/10 via-zinc-900 to-transparent opacity-80" />

                    {/* Active Resource Packs */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-zinc-900">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400">
                          Active Resource Packs ({activeResourcePacks.length})
                        </h3>
                      </div>
                      {activeResourcePacks.length === 0 ? (
                        <p className="text-xs text-zinc-650 italic pl-1">No Active Resource packs currently loaded.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                          {activeResourcePacks.map(renderAddonCard)}
                        </div>
                      )}
                    </div>

                    <div className="h-[1px] bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 my-8 opacity-60" />

                    {/* Disabled Behavior Packs */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-zinc-900">
                        <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">
                          Disabled Behavior Packs ({disabledBehaviorPacks.length})
                        </h3>
                      </div>
                      {disabledBehaviorPacks.length === 0 ? (
                        <p className="text-xs text-zinc-750 italic pl-1">No Disabled Behavior packs.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 opacity-65 hover:opacity-100 transition-opacity">
                          {disabledBehaviorPacks.map(renderAddonCard)}
                        </div>
                      )}
                    </div>

                    <div className="h-[1px] bg-gradient-to-r from-transparent via-zinc-900 to-zinc-900 opacity-80 animate-pulse" />

                    {/* Disabled Resource Packs */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-zinc-900">
                        <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">
                          Disabled Resource Packs ({disabledResourcePacks.length})
                        </h3>
                      </div>
                      {disabledResourcePacks.length === 0 ? (
                        <p className="text-xs text-zinc-750 italic pl-1">No Disabled Resource packs.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 opacity-65 hover:opacity-100 transition-opacity">
                          {disabledResourcePacks.map(renderAddonCard)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ==================== C. WORLDS ARCHIVE MANAGEMENT VIEW ==================== */}
          {navTab === "worlds" && (
            <div className="space-y-6 select-none">
              <div className="flex justify-between items-center bg-zinc-900/10 border border-zinc-900 rounded-2xl p-6">
                <div>
                  <h2 className="text-lg font-black text-white tracking-tight">Active World Vault</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Minecraft world managers. Upload `.mcworld` packages to index worlds directory registers, select which world directory drives active hosts.
                  </p>
                </div>

                {isAdmin ? (
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={worldFileInputRef}
                      accept=".mcworld"
                      onChange={e => handleUploadFile(e, true)}
                      className="hidden"
                    />
                    <button
                      id="upload-world-trigger"
                      onClick={() => worldFileInputRef.current?.click()}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wider uppercase px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4" />
                      Import .mcworld
                    </button>
                  </div>
                ) : (
                  <span className="px-3 py-1.5 rounded-xl bg-zinc-900 text-zinc-550 border border-zinc-850 text-xs font-bold uppercase select-none leading-none">
                    Viewer Read Only
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {worlds.length === 0 ? (
                  <div className="col-span-full bg-zinc-900/30 border border-zinc-900 p-12 text-center rounded-2xl flex flex-col items-center">
                    <FolderOpen className="w-12 h-12 text-zinc-800 mb-3" />
                    <h3 className="text-sm font-black text-white tracking-wide">No minecraft worlds detected</h3>
                    <p className="text-xs text-zinc-500 max-w-sm mt-1 leading-relaxed">
                      Upload `.mcworld` zipped files directly or create server folders internally to populate.
                    </p>
                  </div>
                ) : (
                  worlds.map((w, idx) => (
                    <div
                      key={idx}
                      className={`bg-zinc-900/40 border rounded-2xl p-5 flex flex-col justify-between shadow hover:border-zinc-800 transition-all ${
                        w.isActive ? "border-emerald-500/20 bg-emerald-950/10" : "border-zinc-900"
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <FolderOpen className={`w-8 h-8 ${w.isActive ? "text-emerald-400" : "text-zinc-500"}`} />
                          <div>
                            <h4 className="text-xs font-black text-white tracking-wide">{w.name}</h4>
                            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Size on Disk: {formatBytes(w.sizeBytes)}</p>
                          </div>
                        </div>

                        {w.isActive ? (
                          <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex items-center gap-2 text-[10px] text-emerald-400">
                            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>This world is currently active on server start configs.</span>
                          </div>
                        ) : (
                          <p className="text-[10px] text-zinc-600 leading-snug">Folder: worlds/{w.folderName}</p>
                        )}
                      </div>

                      <div className="flex justify-end item-center mt-5 pt-4 border-t border-zinc-900/65">
                        {isAdmin && !w.isActive && (
                          <button
                            onClick={() => setActiveWorld(w.folderName)}
                            className="bg-emerald-600/10 text-emerald-400 hover:bg-emerald-605/20 border border-emerald-500/20 font-black text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-lg select-none cursor-pointer"
                          >
                            Set Active
                          </button>
                        )}
                        {w.isActive && (
                          <span className="text-[9px] font-black uppercase text-emerald-400 tracking-wider">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ==================== D. FULL EXPANDED MOBILE/DESKTOP CONSOLE VIEW ==================== */}
          {navTab === "console" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 h-full min-h-[500px]">
              {/* Console logs card output terminal */}
              <div className="col-span-1 md:col-span-2 bg-zinc-900/40 border border-zinc-900 rounded-2xl flex flex-col h-full overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-zinc-900 bg-zinc-950/40 flex justify-between items-center h-14">
                  <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Active Server Console Output</span>
                  <span className="text-[9px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded font-bold uppercase animate-pulse">Running</span>
                </div>

                <div className="flex-1 p-5 overflow-hidden flex flex-col bg-zinc-950/20">
                  <div
                    ref={logContainerRef}
                    className="flex-1 overflow-y-auto font-mono text-xs space-y-1.5 pr-2"
                  >
                    {consoleLogs.length === 0 ? (
                      <p className="text-zinc-650 italic">No console logs buffered.</p>
                    ) : (
                      consoleLogs.map((log, idx) => (
                        <div key={idx} className="flex gap-2 leading-relaxed">
                          <span className="text-zinc-600 font-bold select-none">[ {log.timestamp.slice(11, 19)} ]</span>
                          <span
                            className={`font-black uppercase text-[9px] tracking-wide px-1.5 rounded h-4 flex items-center ${
                              log.type === "ERROR"
                                ? "bg-red-500/10 text-red-450 border border-red-500/20"
                                : log.type === "WARN"
                                ? "bg-amber-500/10 text-amber-450 border border-amber-500/20"
                                : log.type === "PLAYER"
                                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                : log.type === "SYS"
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                : "bg-zinc-800 text-zinc-400"
                            }`}
                          >
                            {log.type}
                          </span>
                          <span className="text-zinc-300 break-all">{log.message}</span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Preset Commands Bar */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-4 p-2 bg-zinc-900/30 border border-zinc-900/50 rounded-xl">
                    <span className="text-[9px] uppercase font-black text-zinc-500 tracking-wider mr-1 select-none">Presets:</span>
                    {[
                      { label: "List Players", cmd: "list" },
                      { label: "Day", cmd: "time set day" },
                      { label: "Night", cmd: "time set night" },
                      { label: "Clear Weather", cmd: "weather clear" },
                      { label: "Hard Diff", cmd: "difficulty hard" },
                      { label: "Keep Inventory", cmd: "gamerule keepinventory true" },
                      { label: "Show Coords", cmd: "gamerule showcoordinates true" },
                      { label: "Whitelist List", cmd: "whitelist list" },
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        disabled={stats?.status !== "running"}
                        onClick={() => sendPresetCommand(preset.cmd)}
                        className="px-2 py-1 text-[9px] font-bold bg-zinc-950 border border-zinc-905 hover:border-zinc-800 hover:bg-zinc-900 hover:text-emerald-400 text-zinc-400 rounded-lg font-mono transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 select-none"
                        title={`Execute command: /${preset.cmd}`}
                      >
                        /{preset.cmd}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSendCommand} className="mt-3 p-2 bg-zinc-950 border border-zinc-900 rounded-xl flex gap-2">
                    <span className="text-zinc-600 pl-1 py-1 font-bold font-mono">$</span>
                    <input
                      type="text"
                      placeholder={stats?.status === "running" ? "Send Bedrock server console command..." : "Server must be online to execute commands."}
                      disabled={stats?.status !== "running"}
                      value={commandText}
                      onChange={e => setCommandText(e.target.value)}
                      className="bg-transparent border-none outline-none text-xs w-full text-zinc-350 font-mono placeholder-zinc-700 disabled:cursor-not-allowed"
                    />
                    <button
                      type="submit"
                      disabled={stats?.status !== "running"}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow cursor-pointer transition-all ${
                        stats?.status === "running" ? "bg-emerald-600 text-white hover:bg-emerald-500" : "bg-zinc-905 text-zinc-705 cursor-not-allowed"
                      }`}
                    >
                      Execute
                    </button>
                  </form>
                </div>
              </div>

              {/* Version update panel and config widgets */}
              <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 space-y-6 overflow-y-auto shadow h-full">
                {/* Simulated Versus Real toggle */}
                <div className="space-y-3.5 border-b border-zinc-900 pb-5">
                  <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Environment Engine</h3>
                  <div className="flex items-center justify-between p-3 bg-zinc-950/40 rounded-xl border border-zinc-900">
                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight">Simulation Sandbox</h4>
                      <p className="text-[10px] text-zinc-500 mt-1 max-w-2xs leading-normal">
                        Pretend executes C++ binaries inside Cloud Run container. Extremely safe, reactive demo!
                      </p>
                    </div>
                    {isAdmin ? (
                      <input
                        type="checkbox"
                        checked={appConfig.simulationMode}
                        onChange={e => updateSettingsField({ simulationMode: e.target.checked })}
                        className="w-5 h-5 accent-emerald-500 cursor-pointer"
                      />
                    ) : (
                      <span className="text-[9px] font-black uppercase text-zinc-600 tracking-wider">
                        {appConfig.simulationMode ? "Sim" : "Real"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Configurations Property Modifiers (Admin only) */}
                <div className="space-y-4 border-b border-zinc-900 pb-5">
                  <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Server Port Properties</h3>

                  <div className="grid grid-cols-2 gap-3 pb-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Ports</label>
                      <input
                        type="number"
                        disabled={!isAdmin}
                        value={appConfig.serverPort}
                        onChange={e => updateSettingsField({ serverPort: parseInt(e.target.value) || 19132 })}
                        className="w-full bg-zinc-950 border border-zinc-850 p-2 text-xs font-semibold rounded text-white outline-none focus:border-emerald-500 disabled:opacity-40"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Max Player Limits</label>
                      <input
                        type="number"
                        disabled={!isAdmin}
                        value={appConfig.maxPlayers}
                        onChange={e => updateSettingsField({ maxPlayers: parseInt(e.target.value) || 20 })}
                        className="w-full bg-zinc-950 border border-zinc-850 p-2 text-xs font-semibold rounded text-white outline-none focus:border-emerald-500 disabled:opacity-40"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 pb-1">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Difficulties level</label>
                    <select
                      disabled={!isAdmin}
                      value={appConfig.difficulty}
                      onChange={e => updateSettingsField({ difficulty: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-850 p-2 text-xs font-semibold rounded text-white outline-none focus:border-emerald-500 disabled:opacity-40"
                    >
                      <option value="peaceful">Peaceful</option>
                      <option value="easy">Easy</option>
                      <option value="normal">Normal</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Game mode rules</label>
                    <select
                      disabled={!isAdmin}
                      value={appConfig.gamemode}
                      onChange={e => updateSettingsField({ gamemode: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-850 p-2 text-xs font-semibold rounded text-white outline-none focus:border-emerald-500 disabled:opacity-40"
                    >
                      <option value="survival">Survival</option>
                      <option value="creative">Creative</option>
                      <option value="adventure">Adventure</option>
                    </select>
                  </div>
                </div>

                {/* Updating core binaries console download section */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest animate-pulse">Minecraft Updater Console</h3>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    Choose Bedrock version releases. Triggering automated installations downloads correct binary zips from Mojang server nets, extracts, chmod executables dynamically.
                  </p>

                  <div className="space-y-3">
                    {versions.map((ver, idx) => (
                      <div key={idx} className="bg-zinc-950/40 border border-zinc-900 p-3 rounded-xl flex items-center justify-between hover:border-zinc-800 transition-colors">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-black text-white tracking-wide">{ver.version}</h4>
                            {ver.isLatest && (
                              <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black tracking-widest px-1 py-px rounded uppercase">
                                Latest
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] text-zinc-600 block mt-0.5">{ver.releaseDate}</span>
                        </div>
                        {isAdmin ? (
                          <button
                            onClick={() => installBedrockVersion(ver.version, ver.downloadUrl)}
                            className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-zinc-300 transition-colors cursor-pointer select-none"
                          >
                            Deploy Build
                          </button>
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-zinc-700" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== E. USERS AND SECURITY AUTHORIZATIONS ==================== */}
          {navTab === "users" && isAdmin && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none">
              {/* Creator user rules form banner */}
              <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 h-fit shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <UserPlus className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Append User Portal</h3>
                </div>

                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-400 font-semibold tracking-wide">Account Username</label>
                    <input
                      type="text"
                      required
                      placeholder="Gamer2024"
                      value={newUsername}
                      onChange={e => setNewUsername(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 p-2.5 text-xs text-white rounded-xl outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-zinc-400 font-semibold tracking-wide">Account Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 p-2.5 text-xs text-white rounded-xl outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-zinc-400 font-semibold tracking-wide">Authorization Level</label>
                    <div className="relative">
                      <select
                        value={newUserRole}
                        onChange={e => setNewUserRole(e.target.value as any)}
                        className="w-full bg-zinc-950 border border-zinc-855 p-2.5 text-xs text-white rounded-xl outline-none focus:border-emerald-500"
                      >
                        <option value="viewer">Viewer (Read & Restart only)</option>
                        <option value="admin">Administrator (Full permission controls)</option>
                      </select>
                    </div>
                  </div>

                  {userActionMsg && (
                    <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl text-xs text-zinc-300">
                      {userActionMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-md"
                  >
                    Create User rule
                  </button>
                </form>
              </div>

              {/* Display list grid and permissions */}
              <div className="col-span-1 md:col-span-2 bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 shadow">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Credentials Ledger</h3>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-zinc-900">
                        <th className="pb-3 text-[10px] uppercase font-black tracking-widest text-zinc-500">Username</th>
                        <th className="pb-3 text-[10px] uppercase font-black tracking-widest text-zinc-500">Authorizations role</th>
                        <th className="pb-3 text-[10px] uppercase font-black tracking-widest text-zinc-500">Registered date</th>
                        <th className="pb-3 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900/50">
                      {usersList.map((u, idx) => (
                        <tr key={idx} className="hover:bg-zinc-950/25">
                          <td className="py-4 text-xs font-semibold text-white">{u.username}</td>
                          <td className="py-4">
                            <span
                              className={`text-[9.5px] uppercase font-black tracking-widest px-2 py-0.5 rounded leading-none ${
                                u.role === "admin" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-500"
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-4 text-xs text-zinc-500 font-mono">
                            {new Date(u.registeredAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 text-right">
                            {u.username.toLowerCase() !== currentUser.username.toLowerCase() ? (
                              <button
                                onClick={() => handleDeleteUser(u.username)}
                                className="p-1 text-zinc-500 hover:text-red-500 hover:bg-zinc-850 rounded bg-zinc-900 border border-zinc-800 transition-colors"
                                title="Revoke rule account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-[10px] italic text-zinc-600 block pr-2">self</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Elegant Divider between direct additions and invite links */}
            <div className="h-[1px] bg-gradient-to-r from-emerald-500/10 via-zinc-800 to-emerald-500/10 my-6 opacity-50" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none mt-2">
              {/* Card 1: Generate Invite Link Form */}
              <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 h-fit shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <UserPlus className="w-5 h-5 text-amber-500" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Create Signup invite</h3>
                </div>

                <form onSubmit={handleGenerateInvite} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-400 font-semibold tracking-wide">Select Sign Up Role</label>
                    <select
                      value={newInviteRole}
                      onChange={e => setNewInviteRole(e.target.value as "admin" | "viewer")}
                      className="w-full bg-zinc-950 border border-zinc-850 p-2.5 text-xs text-white rounded-xl outline-none focus:border-amber-500"
                    >
                      <option value="viewer">Viewer (Read & Restart only)</option>
                      <option value="admin">Administrator (Full Access)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-md"
                  >
                    Generate Invite Link
                  </button>
                </form>
              </div>

              {/* Card 2: List of active generated invites */}
              <div className="col-span-1 md:col-span-2 bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 shadow">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 font-sans">Active Server Invite Keys</h3>

                {invitesList.length === 0 ? (
                  <div className="py-12 border-2 border-dashed border-zinc-950/20 text-center rounded-2xl flex flex-col items-center">
                    <KeyRound className="w-8 h-8 text-zinc-800 mb-2" />
                    <span className="text-xs text-zinc-650 italic">No invitation links currently active.</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-zinc-900">
                          <th className="pb-3 text-[10px] uppercase font-black tracking-widest text-zinc-500">Invite Code / URL</th>
                          <th className="pb-3 text-[10px] uppercase font-black tracking-widest text-zinc-500">Role Granted</th>
                          <th className="pb-3 text-[10px] uppercase font-black tracking-widest text-zinc-500">Status</th>
                          <th className="pb-3 text-[10px] uppercase font-black tracking-widest text-zinc-500">Created At</th>
                          <th className="pb-3 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900/30">
                        {invitesList.map((invite) => {
                          const inviteUrl = `${window.location.origin}${window.location.pathname}?invite=${invite.token}`;

                          return (
                            <tr key={invite.token} className="hover:bg-zinc-950/15">
                              <td className="py-4 text-xs font-mono select-all text-white max-w-xs truncate pr-4">
                                <span className="hover:text-emerald-400 cursor-pointer transition-colors" title="Click to copy full sign-up URL" onClick={() => {
                                  try {
                                    navigator.clipboard.writeText(inviteUrl);
                                    showBanner("Invite Link copied to Clipboard!", "success");
                                  } catch (err) {
                                    showBanner(`Code: ${invite.token}`, "info");
                                  }
                                }}>
                                  {invite.token.slice(0, 8)}... (Copy Link)
                                </span>
                              </td>
                              <td className="py-4">
                                <span className={`text-[9.5px] uppercase font-black tracking-widest px-2 py-0.5 rounded leading-none ${
                                  invite.role === "admin" ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-850 text-zinc-400"
                                }`}>
                                  {invite.role}
                                </span>
                              </td>
                              <td className="py-4 text-xs">
                                {invite.used ? (
                                  <span className="text-zinc-600 text-[10px] font-semibold italic">Used</span>
                                ) : (
                                  <span className="text-amber-500 text-[10px] font-black uppercase tracking-wider animate-pulse">Active & Open</span>
                                )}
                              </td>
                              <td className="py-4 text-xs text-zinc-450 font-mono">
                                {new Date(invite.createdAt).toLocaleDateString()}
                              </td>
                              <td className="py-4 text-right">
                                <button
                                  onClick={() => handleDeleteInvite(invite.token)}
                                  className="p-1 text-zinc-500 hover:text-red-500 hover:bg-zinc-850 rounded bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer"
                                  title="Revoke and void invite link"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

          {navTab === "selfhost" && (
            <div className="space-y-6 select-none animate-fade-in">
              {/* Header card banner */}
              <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 border border-zinc-900 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase text-blue-400 tracking-wider">
                      Deployment Desk
                    </div>
                    <h2 className="text-xl font-black text-white tracking-tight">System Self-Hosting & Production Guide</h2>
                    <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
                      Run this Minecraft Bedrock Server Manager software locally on physical hardware, configure headless background hosting, or orchestrate highly portable isolated components with container standard runtimes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Guide Selector Tabs */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-3">
                  <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-4 shadow-lg space-y-2.5">
                    <span className="text-[10px] uppercase font-black text-zinc-500 tracking-wider block">Target Host Archetype</span>
                    
                    <button
                      onClick={() => setGuideMode("windows")}
                      className={`w-full p-4 rounded-xl text-left border transition-all flex items-start gap-4 cursor-pointer ${
                        guideMode === "windows"
                          ? "bg-zinc-900 border-zinc-700/60 shadow-md ring-1 ring-blue-500/20"
                          : "bg-zinc-950/20 border-zinc-900 hover:border-zinc-800 text-zinc-400"
                      }`}
                    >
                      <div className={`p-2 rounded-lg border flex-shrink-0 ${guideMode === "windows" ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-zinc-900 border-zinc-800 text-zinc-505"}`}>
                        <Cpu className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <span className={`text-xs font-bold block ${guideMode === "windows" ? "text-white" : "text-zinc-300"}`}>Windows Server</span>
                        <span className="text-[10px] text-zinc-500 leading-normal block">Self-host natively on any Windows computer with our automated launcher scripts.</span>
                      </div>
                    </button>

                    <button
                      onClick={() => setGuideMode("docker")}
                      className={`w-full p-4 rounded-xl text-left border transition-all flex items-start gap-4 cursor-pointer ${
                        guideMode === "docker"
                          ? "bg-zinc-900 border-zinc-700/60 shadow-md ring-1 ring-blue-500/20"
                          : "bg-zinc-950/20 border-zinc-900 hover:border-zinc-800 text-zinc-400"
                      }`}
                    >
                      <div className={`p-2 rounded-lg border flex-shrink-0 ${guideMode === "docker" ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-zinc-900 border-zinc-800 text-zinc-505"}`}>
                        <Layers className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <span className={`text-xs font-bold block ${guideMode === "docker" ? "text-white" : "text-zinc-300"}`}>Docker & Compose</span>
                        <span className="text-[10px] text-zinc-500 leading-normal block">Deploy inside clean, isolated containers on Linux with full persistent data volumes.</span>
                      </div>
                    </button>
                  </div>

                  <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-4 shadow-lg space-y-3">
                    <span className="text-[10px] uppercase font-black text-zinc-500 tracking-wider block">Network Port-Mapping Guide</span>
                    <div className="space-y-2 text-[11px] leading-relaxed text-zinc-400">
                      <p>For players to join from outside your local network, you must route ports at your router panel:</p>
                      <div className="p-2.5 bg-zinc-950/85 border border-zinc-900 rounded-xl space-y-1.5 font-mono text-[10px]">
                        <div className="flex justify-between border-b border-zinc-900/60 pb-1">
                          <span className="text-zinc-500">Service UI (Web)</span>
                          <span className="font-bold text-blue-400">3000 / TCP</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Bedrock Dedicated</span>
                          <span className="font-bold text-emerald-400">19132 / UDP</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-zinc-500 italic pb-0.5">
                        💡 Bedrock dedicated server runs primarily utilizing UDP protocol. Always authorize UDP ingress packets for port 19132!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Main Instruction Body */}
                <div className="lg:col-span-2">
                  {guideMode === "windows" ? (
                    <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-6 shadow-lg space-y-5">
                      <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                        <Cpu className="w-4 h-4 text-blue-400" />
                        <h3 className="text-xs uppercase font-black tracking-wider text-white">Prerequisites & Run Steps: Windows</h3>
                      </div>

                      <div className="space-y-4">
                        <div className="flex gap-4">
                          <div className="w-6 h-6 rounded-full bg-zinc-900 text-xs font-bold flex items-center justify-center border border-zinc-800 text-zinc-300 flex-shrink-0">1</div>
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-white block">Download and Set Up Node.js</span>
                            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                              Download and install Node.js (v18 LTS or later is highly recommended) from the official website.
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <div className="w-6 h-6 rounded-full bg-zinc-900 text-xs font-bold flex items-center justify-center border border-zinc-800 text-zinc-300 flex-shrink-0">2</div>
                          <div className="space-y-2 w-full">
                            <span className="text-xs font-bold text-white block">Clone App and Launch Host Script</span>
                            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                              Extract the package bundle code to a folder on your storage, and execute the included automated launcher script by double-clicking it:
                            </p>
                            <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl text-[11px] font-mono text-emerald-400 font-bold block select-all">
                              start-windows.bat
                            </div>
                            <span className="text-[10px] text-zinc-500 italic block font-sans">
                              🔒 Note: The Windows launcher automatically loads dependencies, bundles current TS source configurations via esbuild, and initializes the local service instantly.
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <div className="w-6 h-6 rounded-full bg-zinc-900 text-xs font-bold flex items-center justify-center border border-zinc-800 text-zinc-300 flex-shrink-0">3</div>
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-white block">Unlock Web UI Control Panel</span>
                            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                              Open your browser to <strong className="text-white font-semibold">http://localhost:3000</strong>. Enter your Admin credentials to enter.
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <div className="w-6 h-6 rounded-full bg-emerald-950 text-xs font-bold flex items-center justify-center border border-emerald-500/20 text-emerald-400 flex-shrink-0">4</div>
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-emerald-400 block">One-Click Bedrock Dedicated Auto-Deployment</span>
                            <p className="text-xs text-zinc-400 leading-relaxed font-sans font-sans">
                              Navigate to the <span className="text-zinc-300 font-semibold">"Software & Versions"</span> drawer panel in the UI. Choose status "stable" version or select the newest Bedrock version, then press <span className="text-emerald-400 font-bold">Install</span>. The applet automatically fetches and extracts Minecraft's Windows executable binaries instantly!
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-6 shadow-lg space-y-5">
                      <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                        <Layers className="w-4 h-4 text-blue-400" />
                        <h3 className="text-xs uppercase font-black tracking-wider text-white">Docker & Docker-Compose Instructions</h3>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-white block">1. Build Clean Containers from Source</span>
                          <p className="text-xs text-zinc-405 leading-relaxed font-sans">
                            Generate the container package locally securely using Docker CLI:
                          </p>
                          <div className="font-mono text-[10.5px] bg-zinc-950 border border-zinc-900 rounded-xl p-3.5 text-zinc-350">
                            docker build -t bedrock-manager .
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-xs font-bold text-white block">2. Standard Docker Run Deployment</span>
                          <p className="text-xs text-zinc-405 leading-relaxed font-sans font-sans">
                            Authorize UDP networks matching ports to bypass virtualization firewalls with state volume mappings:
                          </p>
                          <div className="font-mono text-[10.5px] bg-zinc-950 border border-zinc-900 rounded-xl p-3.5 text-zinc-300 break-all select-all">
                            docker run -d \<br/>
                            &nbsp;&nbsp;-p 3000:3000 \<br/>
                            &nbsp;&nbsp;-p 19132:19132/udp \<br/>
                            &nbsp;&nbsp;-v bedrock_server_data:/app/bedrock-server \<br/>
                            &nbsp;&nbsp;--name mcb-manager \<br/>
                            &nbsp;&nbsp;bedrock-manager
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-xs font-bold text-white block">3. Multi-Component Orchestration: Docker-Compose</span>
                          <p className="text-xs text-zinc-405 leading-relaxed font-sans font-sans">
                            Create a single file <strong className="text-zinc-200">docker-compose.yml</strong> in your directory, copying this configuration block:
                          </p>
                          <pre className="font-mono text-[10px] bg-zinc-950 border border-zinc-900 rounded-xl p-4 text-zinc-300 overflow-auto whitespace-pre leading-relaxed select-all">
{`services:
  bedrock-manager:
    build: .
    container_name: mcb-manager
    ports:
      - "3000:3000"         # Web UI manager dashboard
      - "19132:19132/udp"   # MC Bedrock Connection Ingress
    volumes:
      - ./bedrock-server:/app/bedrock-server
    restart: unless-stopped`}
                          </pre>
                          <p className="text-xs text-zinc-405 leading-relaxed font-sans">
                            Start the service container fully headless in background mode:
                          </p>
                          <div className="font-mono text-[10.5px] bg-zinc-950 border border-zinc-900 rounded-xl p-3.5 text-zinc-300 select-all">
                            docker compose up -d
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {navTab === "console_connect" && (
            <ConsoleConnect
              token={token}
              serverPort={appConfig.serverPort}
              serverLevelName={appConfig.levelName}
              onShowMessage={(text, type) => showBanner(text, type)}
            />
          )}
        </div>
      </main>

      {/* Premium Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl mx-4 space-y-5 animate-scale-up">
            <div className="flex gap-3.5 items-start">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white tracking-tight">{confirmModal.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{confirmModal.message}</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 font-bold text-[11px] uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-red-650 hover:bg-red-500 text-white font-bold text-[11px] uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-red-500/10"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Addon Metadata Modal */}
      {editingAddon && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md animate-fade-in animate-duration-150">
          <form
            onSubmit={handleSaveAddon}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl mx-4 space-y-5 animate-scale-up"
          >
            <div className="flex gap-3.5 items-center pb-2 border-b border-zinc-800">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                <Edit className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white tracking-tight">Edit Addon Settings</h3>
                <p className="text-[11px] text-zinc-500">Configure active names, descriptions, and pack links.</p>
              </div>
            </div>

            {addons.some(a => 
              a.uuid !== editingAddon.uuid && 
              ((editingAddon.groupId && a.groupId === editingAddon.groupId) || 
               (editingAddon.originalName && a.originalName === editingAddon.originalName && editingAddon.originalName !== ""))
            ) && (
              <div className="bg-amber-500/5 border border-amber-500/20 text-amber-300 p-3 rounded-xl text-[11px] leading-normal space-y-0.5">
                <span className="font-bold flex items-center gap-1 text-[10px] uppercase tracking-wider text-amber-400">⚡ Grouped Pack Synced</span>
                <span>Modifying properties here will automatically sync both the resource (RP) and behavior (BP) packs. BP and RP subscripts are managed for you.</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1 col-span-2">
                <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400 block">Addon Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Modern Craft Behavior Pack"
                  value={editAddonName}
                  onChange={e => setEditAddonName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400 block">Addon Description</label>
                <textarea
                  placeholder="Insert detailed package summary notes..."
                  value={editAddonDescription}
                  onChange={e => setEditAddonDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white outline-none focus:border-amber-500 transition-colors resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400 block">Pack Source / Download URL</label>
                <input
                  type="url"
                  placeholder="e.g. https://example.com/downloads/myaddon.mcpack"
                  value={editAddonDownloadUrl}
                  onChange={e => setEditAddonDownloadUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white outline-none focus:border-amber-500 transition-colors font-mono"
                />
                <span className="text-[9px] text-zinc-500 block">Adds a direct external link for portal viewers to download this pack.</span>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setEditingAddon(null)}
                className="px-4 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 font-bold text-[11px] uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-zinc-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingAddon}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-[11px] uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-amber-500/10"
              >
                {isSavingAddon ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
