/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  ExternalLink,
  ClipboardList,
  Sun,
  Moon,
  Cloud,
  Compass,
  Zap,
  Heart,
  ShieldAlert,
  Wand2,
  MessageSquare,
  HelpCircle,
  Skull,
  Award,
  Flame,
  Bomb,
  Grid,
  Menu,
  X,
  Map,
  MapPin,
  ChevronUp,
  ChevronDown,
  ListOrdered,
  LayoutDashboard,
  Blocks,
  History,
  Sliders,
  Link,
  CloudDownload,
  FlaskConical,
  GripVertical,
  Search,
  Edit3
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
  UserInvite,
  QuickCommand
} from "./types";

import ConsoleConnect from "./components/ConsoleConnect";
import SoftwareUpdates from "./components/SoftwareUpdates";
import PlayitConnect from "./components/PlayitConnect";
import PlayersMap from "./components/PlayersMap";
import AddonManager from "./components/AddonManager";

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Sun,
  Moon,
  Cloud,
  Compass,
  Zap,
  Heart,
  ShieldAlert,
  Wand2,
  MessageSquare,
  HelpCircle,
  Skull,
  Award,
  Flame,
  Bomb,
  Grid,
  Users,
  Clock,
  Lock,
  Plus,
  Terminal,
  ClipboardList
};

const COLOR_CLASSES: Record<string, {
  bg: string;
  hoverBg: string;
  border: string;
  text: string;
  badge: string;
  accent: string;
}> = {
  emerald: {
    bg: "bg-emerald-500/10 hover:bg-emerald-500/20",
    hoverBg: "hover:bg-emerald-500/20",
    border: "border-emerald-500/30 hover:border-emerald-500/50",
    text: "text-emerald-400",
    badge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    accent: "bg-emerald-500"
  },
  rose: {
    bg: "bg-rose-500/10 hover:bg-rose-500/20",
    hoverBg: "hover:bg-rose-500/20",
    border: "border-rose-500/30 hover:border-rose-500/50",
    text: "text-rose-400",
    badge: "bg-rose-500/10 border-rose-500/20 text-rose-400",
    accent: "bg-rose-500"
  },
  red: {
    bg: "bg-red-500/10 hover:bg-red-500/20",
    hoverBg: "hover:bg-red-500/20",
    border: "border-red-500/30 hover:border-red-500/50",
    text: "text-red-400",
    badge: "bg-red-500/10 border-red-500/20 text-red-400",
    accent: "bg-red-500"
  },
  amber: {
    bg: "bg-amber-500/10 hover:bg-amber-500/20",
    hoverBg: "hover:bg-amber-500/20",
    border: "border-amber-500/30 hover:border-amber-500/50",
    text: "text-amber-400",
    badge: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    accent: "bg-amber-500"
  },
  blue: {
    bg: "bg-blue-500/10 hover:bg-blue-500/20",
    hoverBg: "hover:bg-blue-500/20",
    border: "border-blue-500/30 hover:border-blue-500/50",
    text: "text-blue-400",
    badge: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    accent: "bg-blue-500"
  },
  sky: {
    bg: "bg-sky-500/10 hover:bg-sky-500/20",
    hoverBg: "hover:bg-sky-500/20",
    border: "border-sky-500/30 hover:border-sky-500/50",
    text: "text-sky-400",
    badge: "bg-sky-500/10 border-sky-500/20 text-sky-400",
    accent: "bg-sky-500"
  },
  indigo: {
    bg: "bg-indigo-500/10 hover:bg-indigo-500/20",
    hoverBg: "hover:bg-indigo-500/20",
    border: "border-indigo-500/30 hover:border-indigo-500/50",
    text: "text-indigo-400",
    badge: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
    accent: "bg-indigo-505"
  },
  purple: {
    bg: "bg-purple-500/10 hover:bg-purple-500/20",
    hoverBg: "hover:bg-purple-500/20",
    border: "border-purple-500/30 hover:border-purple-500/50",
    text: "text-purple-400",
    badge: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    accent: "bg-purple-500"
  },
  pink: {
    bg: "bg-pink-500/10 hover:bg-pink-500/20",
    hoverBg: "hover:bg-pink-500/20",
    border: "border-pink-500/30 hover:border-pink-500/50",
    text: "text-pink-400",
    badge: "bg-pink-500/10 border-pink-500/20 text-pink-400",
    accent: "bg-pink-500"
  },
  orange: {
    bg: "bg-orange-500/10 hover:bg-orange-500/20",
    hoverBg: "hover:bg-orange-500/20",
    border: "border-orange-500/30 hover:border-orange-500/50",
    text: "text-orange-400",
    badge: "bg-orange-500/10 border-orange-500/20 text-orange-400",
    accent: "bg-orange-500"
  },
  teal: {
    bg: "bg-teal-500/10 hover:bg-teal-500/20",
    hoverBg: "hover:bg-teal-500/20",
    border: "border-teal-500/30 hover:border-teal-500/50",
    text: "text-teal-400",
    badge: "bg-teal-500/10 border-teal-500/20 text-teal-400",
    accent: "bg-teal-500"
  },
  zinc: {
    bg: "bg-zinc-500/10 hover:bg-zinc-500/20",
    hoverBg: "hover:bg-zinc-500/20",
    border: "border-zinc-500/30 hover:border-zinc-500/50",
    text: "text-zinc-400",
    badge: "bg-zinc-500/10 border-zinc-500/20 text-zinc-400",
    accent: "bg-zinc-400"
  }
};

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
  const [navTab, setNavTab] = useState<"dashboard" | "addons" | "worlds" | "console" | "users" | "selfhost" | "console_connect" | "updates" | "tasks_history" | "quick_commands" | "properties" | "players_map" | "settings" | "experimental">("dashboard");
  const [settingsSubTab, setSettingsSubTab] = useState<"properties" | "users" | "tasks_history" | "selfhost" | "updates">("properties");
  const [experimentalSubTab, setExperimentalSubTab] = useState<"players_map" | "console_connect" | "playit">("players_map");
  const [guideMode, setGuideMode] = useState<"windows" | "docker">("windows");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Quick Commands State & Management
  const [quickCommands, setQuickCommands] = useState<QuickCommand[]>(() => {
    const saved = localStorage.getItem("bedrock_quick_commands");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed parsing custom bedrock quick commands", e);
      }
    }
    return [
      { id: "1", name: "Set Time: Day", command: "time set day", color: "amber", icon: "Sun" },
      { id: "2", name: "Set Time: Night", command: "time set night", color: "indigo", icon: "Moon" },
      { id: "3", name: "Clear Weather", command: "weather clear", color: "sky", icon: "Cloud" },
      { id: "4", name: "Rainy Weather", command: "weather rain", color: "blue", icon: "Cloud" },
      { id: "5", name: "List Players", command: "list", color: "emerald", icon: "Users" },
      { id: "6", name: "Difficulty: Hard", command: "difficulty hard", color: "red", icon: "ShieldAlert" },
      { id: "7", name: "Keep Inventory On", command: "gamerule keepinventory true", color: "teal", icon: "Lock" },
      { id: "8", name: "Show Coordinates", command: "gamerule showcoordinates true", color: "purple", icon: "Compass" },
      { id: "9", name: "Whitelist List", command: "whitelist list", color: "zinc", icon: "ClipboardList" },
      { id: "10", name: "Creative Mode", command: "gamemode creative", color: "pink", icon: "Wand2" },
      { id: "11", name: "Survival Mode", command: "gamemode survival", color: "orange", icon: "Heart" },
      { id: "12", name: "Kill All Entities", command: "kill @e", color: "rose", icon: "Skull" },
    ];
  });

  useEffect(() => {
    localStorage.setItem("bedrock_quick_commands", JSON.stringify(quickCommands));
  }, [quickCommands]);

  const [newCmdName, setNewCmdName] = useState("");
  const [newCmdStr, setNewCmdStr] = useState("");
  const [newCmdColor, setNewCmdColor] = useState("emerald");
  const [newCmdIcon, setNewCmdIcon] = useState("Terminal");
  const [isAddingCmd, setIsAddingCmd] = useState(false);

  const handleAddQuickCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCmdName.trim() || !newCmdStr.trim()) {
      showBanner("Please fill in both the name and command fields.", "error");
      return;
    }

    const newCommand: QuickCommand = {
      id: Date.now().toString(),
      name: newCmdName.trim(),
      command: newCmdStr.trim(),
      color: newCmdColor,
      icon: newCmdIcon
    };

    setQuickCommands(prev => [...prev, newCommand]);
    setNewCmdName("");
    setNewCmdStr("");
    setNewCmdColor("emerald");
    setNewCmdIcon("Terminal");
    setIsAddingCmd(false);
    showBanner("Quick command saved!", "success");
  };

  const handleDeleteQuickCommand = (id: string, name: string) => {
    promptConfirm(
      "Delete Command Button",
      `Are you sure you want to delete the "${name}" command button?`,
      () => {
        setQuickCommands(prev => prev.filter(c => c.id !== id));
        showBanner("Command button deleted.", "info");
      }
    );
  };

  const handleResetDefaultCommands = () => {
    promptConfirm(
      "Reset to Default Commands",
      "Are you sure you want to revert to the default set of Minecraft server commands? This will replace your current custom list.",
      () => {
        const defaults = [
          { id: "1", name: "Set Time: Day", command: "time set day", color: "amber", icon: "Sun" },
          { id: "2", name: "Set Time: Night", command: "time set night", color: "indigo", icon: "Moon" },
          { id: "3", name: "Clear Weather", command: "weather clear", color: "sky", icon: "Cloud" },
          { id: "4", name: "Rainy Weather", command: "weather rain", color: "blue", icon: "Cloud" },
          { id: "5", name: "List Players", command: "list", color: "emerald", icon: "Users" },
          { id: "6", name: "Difficulty: Hard", command: "difficulty hard", color: "red", icon: "ShieldAlert" },
          { id: "7", name: "Keep Inventory On", command: "gamerule keepinventory true", color: "teal", icon: "Lock" },
          { id: "8", name: "Show Coordinates", command: "gamerule showcoordinates true", color: "purple", icon: "Compass" },
          { id: "9", name: "Whitelist List", command: "whitelist list", color: "zinc", icon: "ClipboardList" },
          { id: "10", name: "Creative Mode", command: "gamemode creative", color: "pink", icon: "Wand2" },
          { id: "11", name: "Survival Mode", command: "gamemode survival", color: "orange", icon: "Heart" },
          { id: "12", name: "Kill All Entities", command: "kill @e", color: "rose", icon: "Skull" },
        ];
        setQuickCommands(defaults);
        showBanner("Preset commands list reset to defaults.", "success");
      }
    );
  };

  // Console Panel Tabs
  const [consoleTab, setConsoleTab] = useState<"logs" | "tasks" | "history">("logs");
  const [taskTimeFilter, setTaskTimeFilter] = useState<"recent" | "oldest">("recent");

  // Server stats & configurations
  const [stats, setStats] = useState<any | null>(null);
  const [appConfig, setAppConfig] = useState<AppConfig>({
    bentoStyle: true,
    serverPort: 19132,
    maxPlayers: 20,
    levelName: "BedrockWorld",
    difficulty: "normal",
    gamemode: "survival",
    selectedVersion: "1.26.21.1",
    serverName: "Bedrock Dedicated Server",
    emitServerTelemetry: false,
    onlineMode: false,
    allowCheats: true,
    viewDistance: 10,
    tickDistance: 4,
    backupCountToKeep: 5,
    backupFrequencyHours: 24,
    backupOnStart: false,
    backupOnStop: false,
    lastBackupTimestamp: 0,
    appPort: 3000,
    bindAddress: "0.0.0.0",
    enableHttps: false,
    sslCertPath: "",
    sslKeyPath: "",
    upnpEnabled: false
  });

  // Live collections
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLine[]>([]);
  const [activeTasks, setActiveTasks] = useState<TaskLog[]>([]);
  const [pastLogs, setPastLogs] = useState<any[]>([]);
  const [addons, setAddons] = useState<AddonMetadata[]>([]);

  // Count unique addons by grouping resource + behavior packs together if they share groupId or originalName
  const groupedAddonsCount = useMemo(() => {
    const visited = new Set<string>();
    let count = 0;
    for (const addon of addons) {
      if (visited.has(addon.uuid)) continue;
      
      const group = [addon];
      visited.add(addon.uuid);
      
      let foundNew = true;
      while (foundNew) {
        foundNew = false;
        for (const other of addons) {
          if (visited.has(other.uuid)) continue;
          
          const isConnected = group.some(item => 
            (item.groupId && other.groupId && item.groupId === other.groupId) ||
            (item.originalName && other.originalName && item.originalName === other.originalName && item.originalName !== "")
          );
          
          if (isConnected) {
            group.push(other);
            visited.add(other.uuid);
            foundNew = true;
          }
        }
      }
      count++;
    }
    return count;
  }, [addons]);
  const [worlds, setWorlds] = useState<any[]>([]);
  const [editingWorld, setEditingWorld] = useState<string | null>(null);
  const [editDisplayName, setEditDisplayName] = useState<string>("");
  const [editFolderName, setEditFolderName] = useState<string>("");
  const [backups, setBackups] = useState<any[]>([]);
  const [loadingBackups, setLoadingBackups] = useState<boolean>(false);
  const [versions, setVersions] = useState<BedrockVersion[]>([]);
  const [customDeployUrl, setCustomDeployUrl] = useState("");
  const [customDeployVersion, setCustomDeployVersion] = useState("");
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFilesNames, setUploadingFilesNames] = useState<string[]>([]);
  const [uploadBytesTransmitted, setUploadBytesTransmitted] = useState(0);
  const [uploadBytesTotal, setUploadBytesTotal] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [actionMessage, setActionMessage] = useState({ text: "", type: "info" });
  const [addonSortBy, setAddonSortBy] = useState<"name" | "date" | "enabled" | "disabled">("name");
  const [addonViewMode, setAddonViewMode] = useState<"grid" | "order">("grid");
  const [addonSearch, setAddonSearch] = useState("");
  const [localBehaviorOrder, setLocalBehaviorOrder] = useState<AddonMetadata[]>([]);
  const [localResourceOrder, setLocalResourceOrder] = useState<AddonMetadata[]>([]);
  const [isSavingLoadOrder, setIsSavingLoadOrder] = useState(false);
  const [isDraggingAddon, setIsDraggingAddon] = useState(false);

  // Drag and Drop reordering states & handlers
  const [draggedCmdIdx, setDraggedCmdIdx] = useState<number | null>(null);
  const [draggedBehaviorIdx, setDraggedBehaviorIdx] = useState<number | null>(null);
  const [draggedResourceIdx, setDraggedResourceIdx] = useState<number | null>(null);

  const handleReorderQuickCommands = (targetIdx: number) => {
    if (draggedCmdIdx === null || draggedCmdIdx === targetIdx) return;
    const reordered = [...quickCommands];
    const draggedItem = reordered[draggedCmdIdx];
    reordered.splice(draggedCmdIdx, 1);
    reordered.splice(targetIdx, 0, draggedItem);
    setDraggedCmdIdx(targetIdx);
    setQuickCommands(reordered);
  };

  const handleReorderBehaviorPacks = (targetIdx: number) => {
    if (draggedBehaviorIdx === null || draggedBehaviorIdx === targetIdx) return;
    const reordered = [...localBehaviorOrder];
    const draggedItem = reordered[draggedBehaviorIdx];
    reordered.splice(draggedBehaviorIdx, 1);
    reordered.splice(targetIdx, 0, draggedItem);
    setDraggedBehaviorIdx(targetIdx);
    setLocalBehaviorOrder(reordered);
  };

  const handleReorderResourcePacks = (targetIdx: number) => {
    if (draggedResourceIdx === null || draggedResourceIdx === targetIdx) return;
    const reordered = [...localResourceOrder];
    const draggedItem = reordered[draggedResourceIdx];
    reordered.splice(draggedResourceIdx, 1);
    reordered.splice(targetIdx, 0, draggedItem);
    setDraggedResourceIdx(targetIdx);
    setLocalResourceOrder(reordered);
  };

  // Edit Addon States
  const [editingAddon, setEditingAddon] = useState<AddonMetadata | null>(null);
  const [editAddonName, setEditAddonName] = useState("");
  const [editAddonDescription, setEditAddonDescription] = useState("");
  const [editAddonDownloadUrl, setEditAddonDownloadUrl] = useState("");
  const [isSavingAddon, setIsSavingAddon] = useState(false);
  const [updatingAddonUuid, setUpdatingAddonUuid] = useState<string | null>(null);
  const [tasksWidgetExpanded, setTasksWidgetExpanded] = useState(true);

  // File editor states
  const [propertiesTab, setPropertiesTab] = useState<"gui" | "files" | "updater">("gui");
  const [selectedFileId, setSelectedFileId] = useState<string>("permissions");
  const [fileEditorContent, setFileEditorContent] = useState<string>("");
  const [fileEditorLoading, setFileEditorLoading] = useState<boolean>(false);

  const loadConfigFile = async (fileId: string) => {
    setFileEditorLoading(true);
    try {
      const res = await fetch(`/api/config-files/read?file=${fileId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setFileEditorContent(data.content);
      } else {
        const err = await res.json();
        showBanner(err.error || "Failed to load config file contents.", "error");
      }
    } catch (err) {
      showBanner("Failed to communicate with the configs API.", "error");
    } finally {
      setFileEditorLoading(false);
    }
  };

  const saveConfigFile = async () => {
    if (!isAdmin) {
      showBanner("Admin authorization is required to edit configs.", "error");
      return;
    }
    setFileEditorLoading(true);
    try {
      const res = await fetch("/api/config-files/write", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fileId: selectedFileId,
          content: fileEditorContent
        })
      });
      if (res.ok) {
        const data = await res.json();
        showBanner(data.message || "File saved successfully!", "success");
        // Reload settings if properties edited
        if (selectedFileId === "properties") {
          const resConfig = await fetch("/api/server/config", {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (resConfig.ok) {
            const freshConfig = await resConfig.json();
            setAppConfig(freshConfig);
          }
        }
      } else {
        const err = await res.json();
        showBanner(err.error || "Failed to save config file.", "error");
      }
    } catch (err) {
      showBanner("Failed to write updated configs.", "error");
    } finally {
      setFileEditorLoading(false);
    }
  };

  useEffect(() => {
    if (propertiesTab === "files" && token) {
      loadConfigFile(selectedFileId);
    }
  }, [propertiesTab, selectedFileId, token]);

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

  useEffect(() => {
    if (addonViewMode === "grid") {
      setLocalBehaviorOrder(addons.filter(a => a.type === "behavior" && a.isEnabled));
      setLocalResourceOrder(addons.filter(a => (a.type === "resource" || a.type === "world") && a.isEnabled));
    }
  }, [addons, addonViewMode]);

  const isAdmin = currentUser?.role === "admin";

  // Centralized navigation bar configuration with beautifully polished, easy-to-identify icons and colors
  const navItems = useMemo(() => [
    { id: "dashboard", label: "Dashboard Space", icon: LayoutDashboard, color: "text-emerald-400" },
    { id: "addons", label: "Addons & Packs", icon: Blocks, color: "text-indigo-400" },
    { id: "worlds", label: "Worlds Vault", icon: FolderOpen, color: "text-amber-400" },
    { id: "quick_commands", label: "Quick Commands", icon: Zap, color: "text-yellow-400", pulse: true },
    { id: "settings", label: "Settings & System", icon: Settings, color: "text-zinc-400" },
    { id: "experimental", label: "EXPERIMENTAL", icon: FlaskConical, color: "text-rose-500", pulse: true },
  ], []);

  // Polling data loops
  useEffect(() => {
    if (!token) return;

    fetchDataFeed();
    const interval = setInterval(fetchDataFeed, 2000);
    return () => clearInterval(interval);
  }, [token, navTab, settingsSubTab, experimentalSubTab]);

  // Command logs autoscroll
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [consoleLogs, consoleTab]);

  const checkAuthStatus = async () => {
    try {
      const res = await fetch("/api/auth/status");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setHasAdmin(data.hasAdmin);
      }
    } catch (e: any) {
      // Quiet when server is offline or loading
    }
  };

  const fetchDataFeed = async () => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    const fetchJson = async (url: string) => {
      const res = await fetch(url, { headers });
      if (res.status === 401) {
        handleLogout();
        throw new Error("Unauthorized");
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Non-JSON");
      }
      return await res.json();
    };

    try {
      // 1. Core Server Stats Info
      const statsData = await fetchJson("/api/server/status");
      setStats(statsData);

      // 2. Active Tasks
      const tasksData = await fetchJson("/api/tasks");
      setActiveTasks(tasksData);

      // 3. Active configuration properties
      const configData = await fetchJson("/api/server/config");
      setAppConfig(configData);

      // Fetch according to visible route
      if (navTab === "dashboard" || consoleTab === "logs") {
        const consoleData = await fetchJson("/api/console");
        setConsoleLogs(consoleData);
      }

      if (consoleTab === "history" || navTab === "dashboard" || (navTab === "settings" && settingsSubTab === "tasks_history")) {
        const historyData = await fetchJson("/api/logs/history");
        setPastLogs(historyData);
      }

      if (navTab === "addons" || navTab === "dashboard") {
        const addonsData = await fetchJson("/api/addons");
        setAddons(addonsData);
      }

      if (navTab === "worlds" || navTab === "dashboard") {
        const worldsData = await fetchJson("/api/worlds");
        setWorlds(worldsData);
        try {
          const backupsData = await fetchJson("/api/worlds/backups");
          setBackups(backupsData);
        } catch (backErr) {
          console.error("Backups feed load error", backErr);
        }
      }

      if ((navTab === "users" || (navTab === "settings" && settingsSubTab === "users")) && isAdmin) {
        const usersData = await fetchJson("/api/users");
        setUsersList(usersData);

        const inviteData = await fetchJson("/api/invites");
        setInvitesList(inviteData);
      }

      // Pre-populate Bedrock versions on first load of dashboard
      if (versions.length === 0) {
        const versionsData = await fetchJson("/api/versions");
        setVersions(versionsData);
      }

    } catch (err: any) {
      if (err?.message === "Unauthorized") {
        return;
      }
      const errMsg = err?.message || String(err);
      const isExpectedOffline = errMsg.includes("Failed to fetch") || 
                                 errMsg.includes("NetworkError") || 
                                 errMsg.includes("HTTP ") || 
                                 errMsg.includes("Non-JSON");
      if (!isExpectedOffline) {
        console.warn("Poll data feed unexpected sync issue:", errMsg);
      }
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

  const handleSaveAddonLoadOrder = async (reorderedUuids: string[]) => {
    if (!token || !isAdmin) return;
    setIsSavingLoadOrder(true);
    try {
      const res = await fetch("/api/addons/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ uuids: reorderedUuids })
      });
      const data = await res.json();
      if (!res.ok) {
        showBanner(data.error || "Failed to update addon load order.", "error");
      } else {
        showBanner("Addon load order saved successfully!", "success");
        fetchDataFeed();
      }
    } catch (err) {
      showBanner("Network error while updating addon load order.", "error");
    } finally {
      setIsSavingLoadOrder(false);
    }
  };

  const uploadWithXHR = (
    endpoint: string,
    formData: FormData,
    onProgress: (percent: number, loaded: number, total: number) => void
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", endpoint);
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent, event.loaded, event.total);
        } else {
          onProgress(50, 0, 0); // simulated/indeterminate
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            resolve({ success: true });
          }
        } else {
          try {
            reject(JSON.parse(xhr.responseText));
          } catch (e) {
            reject(new Error(`Server returned status code ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network connection lost during upload."));
      });

      xhr.addEventListener("abort", () => {
        reject(new Error("Upload aborted by user or system."));
      });

      xhr.send(formData);
    });
  };

  // Multer Addons and Worlds uploading trigger hooks
  const handleUploadFileListDirect = async (files: FileList | null, isWorld: boolean = false) => {
    if (!files || files.length === 0 || !token || !isAdmin) return;

    setIsUploading(true);
    setUploadError("");
    setUploadProgress(0);
    setUploadBytesTransmitted(0);
    setUploadBytesTotal(0);

    const names = Array.from(files).map((f: any) => f.name);
    setUploadingFilesNames(names);

    const formData = new FormData();
    const endpoint = isWorld ? "/api/worlds/upload" : "/api/addons/upload";

    if (isWorld) {
      const file = files[0];
      showBanner(`Uploading world ${file.name}...`, "info");
      formData.append("file", file);
    } else {
      const fileNames = names.join(", ");
      showBanner(`Uploading ${files.length} packs (${fileNames})...`, "info");
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }
    }

    try {
      const data = await uploadWithXHR(endpoint, formData, (percent, loaded, total) => {
        setUploadProgress(percent);
        setUploadBytesTransmitted(loaded);
        setUploadBytesTotal(total);
      });

      if (data.taskIds) {
        showBanner(`Uploaded ${files.length} packs successfully! Background tasks started executing.`, "success");
      } else {
        showBanner(`Uploaded successfully. Background task #${data.taskId} is indexing!`, "success");
      }
      fetchDataFeed();
    } catch (err: any) {
      const errMsg = err.error || err.message || "Upload transfer failure";
      setUploadError(errMsg);
      showBanner(errMsg, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>, isWorld: boolean = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await handleUploadFileListDirect(files, isWorld);
    if (e.target) e.target.value = "";
  };

  const handleUpdateAddonFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !updatingAddonUuid || !token || !isAdmin) return;

    setIsUploading(true);
    setUploadError("");
    setUploadProgress(0);
    setUploadBytesTransmitted(0);
    setUploadBytesTotal(0);
    setUploadingFilesNames([file.name]);
    showBanner(`Updating addon with custom file: ${file.name}...`, "info");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const data = await uploadWithXHR(`/api/addons/${updatingAddonUuid}/update-upload`, formData, (percent, loaded, total) => {
        setUploadProgress(percent);
        setUploadBytesTransmitted(loaded);
        setUploadBytesTotal(total);
      });

      showBanner(`Addon updated and overridden successfully! Background task #${data.taskId} is indexing!`, "success");
      fetchDataFeed();
    } catch (err: any) {
      const errMsg = err.error || err.message || "Update upload transfer failure";
      setUploadError(errMsg);
      showBanner(errMsg, "error");
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

  // Create Manual World Backup
  const handleCreateBackup = async (worldFolderName: string) => {
    if (!token || !isAdmin) return;
    setLoadingBackups(true);
    try {
      const res = await fetch("/api/worlds/backups/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ worldFolderName })
      });
      if (res.ok) {
        const d = await res.json();
        showBanner(`Successfully compiled custom backup file: ${d.fileName}`, "success");
        fetchDataFeed();
      } else {
        const data = await res.json();
        showBanner(data.error || "Failed building backup archive.", "error");
      }
    } catch (err) {
      showBanner("Communication failure saving backup.", "error");
    } finally {
      setLoadingBackups(false);
    }
  };

  // Delete World directory
  const handleDeleteWorld = async (folderName: string) => {
    if (!token || !isAdmin) return;
    try {
      const res = await fetch(`/api/worlds/${folderName}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showBanner(`Successfully deleted world folder "${folderName}" from disk repository.`, "success");
        fetchDataFeed();
      } else {
        const d = await res.json();
        showBanner(d.error || "Failed to delete world.", "error");
      }
    } catch (e) {
      showBanner("Communication failure deleting world folder.", "error");
    }
  };

  // Configure world settings (folder name & display name)
  const handleConfigureWorld = async (folderName: string) => {
    if (!token || !isAdmin) return;
    try {
      const res = await fetch(`/api/worlds/${folderName}/configure`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          newFolderName: editFolderName,
          newDisplayName: editDisplayName
        })
      });
      if (res.ok) {
        showBanner("World configuration updated successfully.", "success");
        setEditingWorld(null);
        fetchDataFeed();
      } else {
        const d = await res.json();
        showBanner(d.error || "Failed to configure world parameters.", "error");
      }
    } catch (e) {
      showBanner("Communication failure configuring world.", "error");
    }
  };

  // Restore World Backup
  const handleRestoreBackup = async (fileName: string, worldName: string) => {
    if (!token || !isAdmin) return;
    
    if (stats?.status && stats.status !== "stopped") {
      showBanner("Cannot restore world backup while the server is running. Please stop the Bedrock server first!", "error");
      return;
    }
    
    promptConfirm(
      "Restore World Backup",
      `Are you ABSOLUTELY sure you want to restore the backup "${fileName}"? This will physically overwrite and replace files inside worlds/${worldName}! (We will save a pre-restore copy of your current active world folder on the server as safety backup first).`,
      async () => {
        setLoadingBackups(true);
        try {
          const res = await fetch(`/api/worlds/backups/${fileName}/restore`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          if (res.ok) {
            showBanner(`Successfully restored "${worldName}" to database!`, "success");
            fetchDataFeed();
          } else {
            const data = await res.json();
            showBanner(data.error || "Restore execution error client-side", "error");
          }
        } catch (err) {
          showBanner("Communication connection failure executing restore.", "error");
        } finally {
          setLoadingBackups(false);
        }
      }
    );
  };

  // Delete specific backup file
  const handleDeleteBackup = async (fileName: string) => {
    if (!token || !isAdmin) return;
    
    promptConfirm(
      "Delete Backup File",
      `Are you positive you wish to completely delete the backup file "${fileName}"? This cannot be undone.`,
      async () => {
        setLoadingBackups(true);
        try {
          const res = await fetch(`/api/worlds/backups/${fileName}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          if (res.ok) {
            showBanner("Successfully deleted backup file from storage.", "success");
            fetchDataFeed();
          } else {
            const data = await res.json();
            showBanner(data.error || "Delete action failed", "error");
          }
        } catch (err) {
          showBanner("Communication error deleting backup file.", "error");
        } finally {
          setLoadingBackups(false);
        }
      }
    );
  };

  // Export world folder to browser download as .mcworld
  const handleExportWorld = async (folderName: string) => {
    if (!token) return;
    try {
      showBanner(`Packaging and compressing "${folderName}.mcworld"... Please wait.`, "info");
      const res = await fetch(`/api/worlds/${folderName}/export`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${folderName}.mcworld`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showBanner(`Successfully exported and downloaded "${folderName}.mcworld"!`, "success");
    } catch (err: any) {
      showBanner(`Failed to export world folder: ${err.message}`, "error");
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
            <h1 id="bento-title" className="text-2xl font-bold tracking-tight text-white mt-4">Welcome to FatGoats BDS Manager</h1>
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
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold text-emerald-500">FatGoats bds dedicated environment</p>
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
    <div className="flex h-screen bg-[#060a12] text-zinc-100 font-sans overflow-hidden select-none bg-grid-pattern relative">
      {/* Background ambient glowing orbs */}
      <div className="ambient-glow-indigo top-0 right-0" />
      <div className="ambient-glow-emerald bottom-1/4 left-1/4" />

      {/* 4.1 Side Navigation */}
      <nav id="sidebar-nav" className="hidden md:flex w-68 border-r border-[#152033]/50 bg-[#0a0f18]/65 backdrop-blur-xl flex-col flex-shrink-0 z-10">
        <div className="p-6 border-b border-[#152033]/50 flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600/15 border border-indigo-500/30 rounded-lg flex items-center justify-center font-black text-xl text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.25)]">
            F
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold tracking-tight text-base text-white">FatGoats BDS</span>
            <span className="text-[10px] text-indigo-400 uppercase font-bold tracking-widest leading-none mt-0.5">MCPE Dedicate</span>
          </div>
        </div>

        {/* Menu selections */}
        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isSelected = navTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setNavTab(item.id as any)}
                className={`group relative w-full px-3 py-2.5 rounded-xl flex items-center gap-3.5 text-xs tracking-wider transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600/15 border border-indigo-500/30 text-indigo-200 shadow-[0_0_20px_rgba(99,102,241,0.08)] font-bold"
                    : "border border-transparent text-zinc-400 hover:bg-[#111927]/40 hover:text-zinc-200 hover:border-[#1c2a41]/20"
                }`}
              >
                {isSelected && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-500 rounded-r-md" />
                )}
                <div className={`p-1.5 rounded-lg flex items-center justify-center transition-all ${
                  isSelected 
                    ? "bg-indigo-500/20 border border-indigo-400/30 shadow-[0_0_12px_rgba(99,102,241,0.25)]"
                    : "bg-[#070a0f] border border-zinc-900 group-hover:bg-[#0c111c] group-hover:border-zinc-800"
                }`}>
                  <IconComponent className={`w-3.5 h-3.5 ${item.color} ${item.pulse ? "animate-pulse" : ""}`} />
                </div>
                <span className="text-[11px] font-bold tracking-widest uppercase">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* User profile footer controls */}
        <div className="p-4 border-t border-[#152033]/50 bg-[#070b12]/60 space-y-2">
          <div className="flex items-center gap-3 p-2.5 bg-[#0a0f18]/80 border border-[#162238]/60 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-sm text-white shadow-md">
              {currentUser.username[0]?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate leading-tight">{currentUser.username}</p>
              <span className={`text-[8px] uppercase tracking-widest font-extrabold ${currentUser.role === "admin" ? "text-indigo-400" : "text-amber-400"}`}>
                {currentUser.role}
              </span>
            </div>
            <button
              id="user-logout"
              onClick={handleLogout}
              className="p-1.5 hover:bg-[#1a253a]/60 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer border border-transparent hover:border-[#223352]/40"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-[9px] text-zinc-500 text-center uppercase tracking-widest font-black">v1.4.2 stable</div>
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

        {/* Dynamic Uploader Form Progress Banner / Modal Overlay */}
        {isUploading && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[99999] p-4 select-none">
            <div className="bg-zinc-950 border border-zinc-800/80 max-w-md w-full rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col items-center">
              {/* Spinning loading halo background */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="p-4 bg-emerald-500/10 rounded-full text-emerald-400 mb-4 border border-emerald-500/20 shadow-inner animate-pulse">
                <UploadCloud className="w-8 h-8" />
              </div>

              <h3 className="text-sm font-black text-white uppercase tracking-wider text-center">
                Uploading Minecraft Addons
              </h3>
              <p className="text-[11px] text-zinc-400 text-center mt-1">
                Please wait while we transfer and unpack your files securely.
              </p>

              {/* Progress Container */}
              <div className="w-full mt-6 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-zinc-300">Overall Progress</span>
                  <span className="font-bold text-emerald-400 font-mono text-xs">{uploadProgress}%</span>
                </div>
                
                {/* Track bar */}
                <div className="w-full h-3.5 bg-zinc-900 border border-zinc-800/50 rounded-full overflow-hidden p-[2px]">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-350 ease-out shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                  <span>
                    {uploadBytesTotal > 0
                      ? `${(uploadBytesTransmitted / (1024 * 1024)).toFixed(1)} MB`
                      : "0 MB"}
                  </span>
                  <span>
                    {uploadBytesTotal > 0
                      ? `${(uploadBytesTotal / (1024 * 1024)).toFixed(1)} MB`
                      : "Calculating size..."}
                  </span>
                </div>
              </div>

              {/* Active Files list */}
              {uploadingFilesNames.length > 0 && (
                <div className="w-full mt-5 bg-zinc-900/55 border border-zinc-850/60 rounded-xl p-3.5 flex flex-col gap-1.5 max-h-32 overflow-y-auto">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-zinc-400">
                    FILES ({uploadingFilesNames.length}):
                  </span>
                  <ul className="space-y-1">
                    {uploadingFilesNames.map((name, idx) => (
                      <li key={idx} className="text-xs text-zinc-350 truncate font-mono flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Keep open message */}
              <div className="w-full mt-5 px-3 py-2 bg-zinc-900/40 border border-zinc-850 rounded-lg text-center">
                <p className="text-[10px] text-zinc-500 font-medium font-sans">
                  Do not close or refresh this page. The server will register and install other packs once transmission completes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Header (Aesthetic premium frosted header with glowing accents) */}
        <header className="md:hidden flex h-16 border-b border-[#141d2e]/80 bg-[#090e18]/85 backdrop-blur-xl px-4 items-center justify-between flex-shrink-0 select-none z-[80] shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-indigo-600/15 border border-indigo-500/35 rounded-lg font-black text-sm text-indigo-400 select-none shadow-[0_0_10px_rgba(99,102,241,0.2)]">
              F
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-xs text-white leading-tight">FatGoats BDS</span>
              <span className="text-[8px] text-indigo-400 uppercase font-black tracking-widest leading-none mt-0.5">Mobile Control</span>
            </div>
          </div>

          {/* Quick status dot or icon based on server status */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-950/60 border border-zinc-900 rounded-lg">
              <span className={`w-2 h-2 rounded-full ${
                stats?.status === "running" ? "bg-emerald-400 animate-ping" :
                stats?.status === "starting" ? "bg-amber-400 animate-pulse" :
                "bg-zinc-500"
              }`} />
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest font-mono">
                {stats?.status || "offline"}
              </span>
            </div>

            {/* Tap-tactile modern quick control buttons */}
            <div className="flex gap-1.5 bg-zinc-900/60 border border-zinc-800/40 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => executeServerControl("start")}
                disabled={stats?.status !== "stopped"}
                className={`p-2 rounded-lg transition-all duration-200 active:scale-95 flex items-center justify-center ${
                  stats?.status === "stopped"
                    ? "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/20 cursor-pointer"
                    : "text-zinc-700 cursor-not-allowed"
                }`}
                title="Start Server"
              >
                <Play className="w-3 h-3 fill-emerald-500/20" />
              </button>
              <button
                type="button"
                onClick={() => executeServerControl("stop")}
                disabled={stats?.status === "stopped" || stats?.status === "stopping"}
                className={`p-2 rounded-lg transition-all duration-200 active:scale-95 flex items-center justify-center ${
                  stats?.status !== "stopped" && stats?.status !== "stopping"
                    ? "bg-rose-500/10 text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/20 cursor-pointer"
                    : "text-zinc-700 cursor-not-allowed"
                }`}
                title="Stop Server"
              >
                <Square className="w-3 h-3 fill-red-500/20" />
              </button>
              <button
                type="button"
                onClick={() => executeServerControl("restart")}
                disabled={stats?.status === "stopped"}
                className={`p-2 rounded-lg transition-all duration-200 active:scale-95 flex items-center justify-center ${
                  stats?.status !== "stopped"
                    ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700/35 cursor-pointer"
                    : "text-zinc-700 cursor-not-allowed"
                }`}
                title="Restart Server"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>
        </header>

        {/* Premium, Glassmorphic Floating Bottom Navigation (Only visible on mobile) */}
        <nav id="mobile-bottom-nav" className="md:hidden fixed bottom-4 left-4 right-4 h-16 bg-[#080d16]/85 backdrop-blur-xl border border-zinc-800/45 rounded-2xl flex items-center justify-around px-3 z-[900] shadow-[0_12px_40px_rgba(0,0,0,0.65)] select-none animate-fade-in">
          <button
            type="button"
            onClick={() => setNavTab("dashboard")}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 active:scale-95 cursor-pointer ${
              navTab === "dashboard"
                ? "text-emerald-400 bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.15)] font-bold"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-[8px] font-black tracking-widest mt-0.5 uppercase">Home</span>
          </button>

          <button
            type="button"
            onClick={() => setNavTab("addons")}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 active:scale-95 cursor-pointer ${
              navTab === "addons"
                ? "text-indigo-400 bg-indigo-500/10 shadow-[0_0_12px_rgba(99,102,241,0.15)] font-bold"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Blocks className="w-4 h-4" />
            <span className="text-[8px] font-black tracking-widest mt-0.5 uppercase">Packs</span>
          </button>

          <button
            type="button"
            onClick={() => setNavTab("worlds")}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 active:scale-95 cursor-pointer ${
              navTab === "worlds"
                ? "text-amber-400 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.15)] font-bold"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span className="text-[8px] font-black tracking-widest mt-0.5 uppercase">Worlds</span>
          </button>

          <button
            type="button"
            onClick={() => setNavTab("quick_commands")}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 active:scale-95 cursor-pointer ${
              navTab === "quick_commands"
                ? "text-yellow-400 bg-yellow-400/10 shadow-[0_0_12px_rgba(250,204,21,0.15)] font-bold"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span className="text-[8px] font-black tracking-widest mt-0.5 uppercase">Cmds</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 active:scale-95 cursor-pointer ${
              mobileMenuOpen
                ? "text-white bg-zinc-800"
                : "text-zinc-500 hover:text-zinc-350"
            }`}
          >
            <Menu className="w-4 h-4 text-indigo-400" />
            <span className="text-[8px] font-black tracking-widest mt-0.5 uppercase">More</span>
          </button>
        </nav>

        {/* Mobile Navigation Drawer backdrop & slider */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-[999] flex animate-fade-in">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-300"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Slide-out Panel */}
            <div className="relative flex flex-col w-72 max-w-[80vw] h-full bg-[#070b13]/95 backdrop-blur-2xl border-l border-zinc-900 shadow-2xl p-6 transition-transform duration-300 transform-none select-none ml-auto">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-900/60 mb-6 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-600/20 border border-indigo-500/30 rounded-lg flex items-center justify-center font-black text-lg text-indigo-400 shadow-sm">
                    F
                  </div>
                  <div className="flex flex-col">
                    <span className="font-extrabold tracking-tight text-sm text-white">FatGoats BDS</span>
                    <span className="text-[9px] text-indigo-400 uppercase font-bold tracking-widest leading-none mt-1">Control Center</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Menu selections */}
              <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
                <p className="text-[9px] font-black uppercase text-zinc-500 tracking-wider mb-2 select-none">Quick Navigation</p>
                {navItems.map((item) => {
                  const IconComponent = item.icon;
                  const isSelected = navTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setNavTab(item.id as any);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full px-4 py-3 rounded-xl flex items-center gap-3.5 text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-indigo-650/15 text-indigo-200 border border-indigo-500/30 shadow-md font-extrabold"
                          : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200 border border-transparent"
                      }`}
                    >
                      <IconComponent className={`w-3.5 h-3.5 ${item.color} opacity-95 ${item.pulse ? "animate-pulse" : ""}`} />
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* User profile footer controls */}
              <div className="pt-4 border-t border-zinc-900 mt-6 space-y-3 flex-shrink-0">
                <div className="flex items-center gap-3 p-2.5 bg-[#0a0f18]/65 border border-zinc-900 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-xs text-white select-none">
                    {currentUser.username[0]?.toUpperCase() || "A"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate leading-tight">{currentUser.username}</p>
                    <span className={`text-[8px] uppercase tracking-widest font-extrabold leading-none ${currentUser.role === "admin" ? "text-indigo-400" : "text-amber-400"}`}>
                      {currentUser.role}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer border border-transparent hover:border-zinc-700/50"
                    title="Logout"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-[9px] text-zinc-500 text-center uppercase tracking-widest font-black leading-none pb-1">v1.4.2 stable</div>
              </div>
            </div>
          </div>
        )}

        {/* 4.3 App Header Controls Bar */}
        <header id="app-header-view" className="hidden md:flex h-20 border-b border-[#152033]/50 bg-[#0a0f18]/30 px-8 items-center justify-between flex-shrink-0 select-none backdrop-blur-md z-10">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-extrabold text-[#f3f4f6] tracking-tight">{appConfig.levelName}</h1>
              {stats?.status === "running" ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-black uppercase text-emerald-400 tracking-wider shadow-[0_0_12px_rgba(16,185,129,0.15)] flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Live
                </span>
              ) : stats?.status === "starting" ? (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[9px] font-black uppercase text-amber-400 tracking-wider shadow-[0_0_12px_rgba(245,158,11,0.15)] flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Starting
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-[#1b2536] border border-zinc-800 text-[9px] font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                  Offline
                </span>
              )}
            </div>
            <p className="text-zinc-400 text-[11px] mt-1 font-mono">
              IP: <span className="text-[#f3f4f6]">localhost:{appConfig.serverPort}</span> • CORE: <span className="text-[#6366f1]">v{appConfig.selectedVersion}</span>
            </p>
          </div>

          <div className="flex gap-3 bg-[#0a0f18]/90 border border-[#152033]/60 p-1.5 rounded-xl shadow-lg">
            <button
              id="server-control-start"
              onClick={() => executeServerControl("start")}
              disabled={stats?.status !== "stopped"}
              className={`px-4 py-2 rounded-lg text-xs font-bold leading-none flex items-center gap-2 tracking-wide transition-all border cursor-pointer ${
                stats?.status === "stopped"
                  ? "bg-emerald-600/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-600 hover:text-white hover:border-emerald-500 shadow-md hover:shadow-emerald-600/10"
                  : "bg-transparent text-zinc-650 border-transparent cursor-not-allowed"
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start</span>
            </button>

            <button
              id="server-control-stop"
              onClick={() => executeServerControl("stop")}
              disabled={stats?.status === "stopped" || stats?.status === "stopping"}
              className={`px-4 py-2 rounded-lg text-xs font-bold leading-none flex items-center gap-2 tracking-wide transition-all border cursor-pointer ${
                stats?.status !== "stopped" && stats?.status !== "stopping"
                  ? "bg-[#ef4444]/15 border-[#ef4444]/30 text-rose-350 hover:bg-[#ef4444] hover:text-white hover:border-[#ef4444] shadow-md"
                  : "bg-transparent text-zinc-650 border-transparent cursor-not-allowed"
              }`}
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>

            <button
              id="server-control-restart"
              onClick={() => executeServerControl("restart")}
              disabled={stats?.status === "stopped"}
              className={`px-4 py-2 rounded-lg text-xs font-bold leading-none flex items-center gap-2 tracking-wide transition-all border cursor-pointer ${
                stats?.status !== "stopped"
                  ? "bg-[#182335]/70 border border-[#233552]/40 text-zinc-300 hover:bg-[#1f2e46] hover:text-white"
                  : "bg-transparent text-zinc-650 border-transparent cursor-not-allowed"
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restart</span>
            </button>
          </div>
        </header>

        {/* 4.4 Dynamic routing container depending on visible Nav Tab */}
        <div className="flex-1 p-4 md:p-6 pb-28 md:pb-6 overflow-y-auto min-h-0 select-none">
          {navTab === "dashboard" && (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 z-10 relative animate-fade-in">
              {/* Stats Widgets Bento */}
              <div className="xl:col-span-1 space-y-6">
                {/* Simulated Stats Core Indicators */}
                <div id="stat-card-cpu" className="glass-panel rounded-2xl p-5 flex flex-col justify-between h-34">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">CPU Threads</span>
                    <Cpu className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-white tracking-tight mt-1 font-mono">
                    {stats?.cpuUsage ?? 0}<span className="text-sm font-semibold text-zinc-500 ml-0.5">%</span>
                  </div>
                  <div className="w-full bg-[#070a0f] h-2 rounded-full overflow-hidden mt-3 p-[1px] border border-[#152033]/30">
                    <div
                      className="bg-gradient-to-r from-indigo-550 via-indigo-550 to-indigo-400 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]"
                      style={{ width: `${stats?.cpuUsage ?? 0}%` }}
                    />
                  </div>
                </div>

                <div id="stat-card-ram" className="glass-panel rounded-2xl p-5 flex flex-col justify-between h-34">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Memory Allocation</span>
                    <Layers className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-white tracking-tight mt-1 font-mono">
                    {stats?.memoryUsage ?? 0}<span className="text-sm font-semibold text-zinc-550 ml-1">GB / 8GB</span>
                  </div>
                  <div className="w-full bg-[#070a0f] h-2 rounded-full overflow-hidden mt-3 p-[1px] border border-[#152033]/30">
                    <div
                      className="bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                      style={{ width: `${((stats?.memoryUsage ?? 0) / 8) * 100}%` }}
                    />
                  </div>
                </div>

                <div id="stat-card-general" className="glass-panel rounded-2xl p-5 space-y-4">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">Diagnostics Engine</span>
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="bg-[#080d15]/65 p-3 rounded-xl border border-[#141e2f]/50">
                      <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wider mb-1">Server TPS</span>
                      <p className="text-base font-extrabold text-emerald-400 font-mono">{stats?.tps ?? "0.0"}</p>
                    </div>
                    <div className="bg-[#080d15]/65 p-3 rounded-xl border border-[#141e2f]/50">
                      <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wider mb-1">Total Uptime</span>
                      <p className="text-xs font-extrabold text-indigo-300 truncate font-mono mt-0.5">{stats?.uptime ?? "Offline"}</p>
                    </div>
                    <div className="bg-[#080d15]/65 p-3 rounded-xl border border-[#141e2f]/50">
                      <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wider mb-1">Packs loaded</span>
                      <p className="text-base font-extrabold text-white font-mono">{groupedAddonsCount}</p>
                    </div>
                    <div className="bg-[#080d15]/65 p-3 rounded-xl border border-[#141e2f]/50">
                      <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wider mb-1">Backup Vault</span>
                      <p className="text-base font-extrabold text-white font-mono">{worlds.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Console Logs Card Interface Bento */}
              <div className="xl:col-span-2 glass-panel rounded-2xl flex flex-col h-[530px] overflow-hidden">
                {/* Console card header */}
                <div id="console-sub-navigation" className="px-5 border-b border-[#152033]/45 flex justify-between items-center bg-[#070b13]/40 h-14">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Live Server Output Stream</h3>
                  <div className="flex items-center gap-1.5 text-[9px] uppercase font-black tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full select-none shadow-[0_0_8px_rgba(16,185,129,0.1)]">
                    <Terminal className="w-3 h-3" />
                    <span>Active Feed</span>
                  </div>
                </div>

                {/* Sub-tab view renderer blocks */}
                <div className="flex-1 p-5 overflow-hidden flex flex-col bg-[#070b13]/10">
                  <div
                    id="terminal-text-sandbox"
                    ref={logContainerRef}
                    className="flex-1 overflow-y-auto font-mono text-xs space-y-2 pr-2"
                  >
                    {consoleLogs.length === 0 ? (
                      <p className="text-zinc-600 italic">No logs currently buffered on server context.</p>
                    ) : (
                      consoleLogs.map((log, idx) => (
                        <div key={idx} className="flex gap-2.5 leading-relaxed bg-[#070c14]/30 hover:bg-[#070c14]/60 p-1.5 rounded-lg border border-transparent hover:border-[#132034]/20 transition-all">
                          <span className="text-zinc-500 font-bold select-none text-[11px] font-mono">[ {log.timestamp.slice(11, 19)} ]</span>
                          <span
                            className={`font-black select-none uppercase tracking-wider text-[8px] px-1.5 rounded h-4.5 flex items-center ${
                              log.type === "ERROR"
                                ? "bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.06)]"
                                : log.type === "WARN"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.06)]"
                                : log.type === "PLAYER"
                                ? "bg-indigo-500/10 text-indigo-450 border border-indigo-500/20 shadow-[0_0_8px_rgba(99,102,241,0.06)]"
                                : log.type === "SYS"
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.06)]"
                                : "bg-zinc-805 text-zinc-400 border border-zinc-800"
                            }`}
                          >
                            {log.type}
                          </span>
                          <span className="text-zinc-250 break-all font-mono font-medium">{log.message}</span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Redirect to Quick Commands tab */}
                  <div className="flex items-center justify-between mt-4 p-3 bg-[#080d14]/80 border border-[#141e2e]/60 rounded-xl shadow-inner">
                    <div className="flex items-center gap-2">
                      <Grid className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-[10px] font-bold text-zinc-400">
                        Trigger custom console macro commands inside the deck space
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNavTab("quick_commands")}
                      className="px-3 py-1 text-[9px] uppercase font-black tracking-wider bg-[#060a11] hover:bg-[#0c121e] border border-[#1a2b44] text-indigo-300 hover:text-indigo-200 rounded-lg transition-all cursor-pointer select-none"
                    >
                      Open deck
                    </button>
                  </div>

                  {/* Command Sender Entry Input */}
                  <form onSubmit={handleSendCommand} className="mt-3 p-1 bg-[#05080e]/95 border border-[#141f32]/80 rounded-xl flex gap-2 shadow-inner">
                    <span className="text-zinc-600 pl-2.5 py-1.5 font-bold font-mono text-xs select-none">$</span>
                    <input
                      id="console-command-bar"
                      type="text"
                      placeholder={stats?.status === "running" ? "Type server console instruction (e.g. op steve)..." : "Launch BDS Core instance to invoke command stream."}
                      disabled={stats?.status !== "running"}
                      value={commandText}
                      onChange={e => setCommandText(e.target.value)}
                      className="bg-transparent border-none outline-none text-xs w-full text-zinc-200 font-mono placeholder-[#19263a] disabled:cursor-not-allowed py-1.5"
                    />
                    <button
                      type="submit"
                      disabled={stats?.status !== "running"}
                      className={`px-4.5 py-1.5 rounded-lg text-[9px] uppercase font-black tracking-widest cursor-pointer transition-all ${
                        stats?.status === "running" 
                          ? "bg-indigo-600 text-white hover:bg-indigo-505 shadow-lg shadow-indigo-600/10" 
                          : "bg-[#0b1019] text-[#1c2c44] border border-dashed border-[#18263a] cursor-not-allowed"
                      }`}
                    >
                      Execute
                    </button>
                  </form>
                </div>
              </div>

              {/* Server Active Players list bento */}
              <div className="xl:col-span-1 glass-panel rounded-2xl p-5 flex flex-col h-[530px] overflow-hidden shadow-lg border border-[#152033]/50 transition-colors">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Active Players</h3>
                  <div className="flex items-center gap-1.5 text-xs font-black bg-[#10b981]/10 border border-[#10b981]/35 text-emerald-400 px-2 py-0.5 rounded-full select-none">
                    <Users className="w-3 h-3" />
                    <span>{stats?.activePlayers ?? 0} / {appConfig.maxPlayers}</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {!stats?.players || stats.players.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <div className="p-3 bg-zinc-900/40 border border-[#1d2a41]/50 rounded-2xl text-zinc-650 mb-3 animate-pulse">
                        <Users className="w-7 h-7" />
                      </div>
                      <p className="text-xs text-zinc-400 font-extrabold uppercase tracking-wider">No players online</p>
                      <p className="text-[10px] text-zinc-500 mt-1 leading-snug max-w-[180px] mx-auto">
                        MCPE survivalists join directly on default port 19132.
                      </p>
                    </div>
                  ) : (
                    stats.players.map((p: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 bg-[#0a1019]/60 border border-[#141e2e]/60 p-3 rounded-xl hover:border-indigo-505/30 transition-all">
                        <div className="w-9 h-9 bg-gradient-to-tr from-[#162238] to-[#1a2b47] rounded-lg border border-[#233552]/40 flex items-center justify-center font-bold text-sm text-[#8f9bb3] select-none shadow-sm">
                          {p.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#f3f4f6] truncate leading-tight">{p.name}</p>
                          <p className="text-[10px] text-zinc-505 font-mono mt-0.5 flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                            <span>Ping: <span className="text-emerald-400 font-bold">{p.ping}ms</span></span>
                          </p>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setCommandText(`kick ${p.name}`);
                              showBanner(`Kicking prompt prefilled. Submit execute on console!`, "info");
                            }}
                            className="bg-[#1a253a]/60 text-zinc-400 hover:text-rose-400 px-2 py-1 rounded-lg text-[9px] uppercase font-bold tracking-wider hover:bg-rose-500/10 border border-[#233552]/40 hover:border-rose-500/30 transition-all"
                          >
                            Kick
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-4 border-t border-[#152033]/45 text-center select-none text-[9px] text-zinc-500 font-bold tracking-widest uppercase">
                  Player Registries
                </div>
              </div>
            </div>
          )}

          {/* ==================== TASKS & HISTORY ROUTE PANEL ==================== */}
          {navTab === "settings" && settingsSubTab === "tasks_history" && (() => {
            const sortedTasks = [...activeTasks].sort((a, b) => {
              const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
              const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
              return taskTimeFilter === "recent" ? timeB - timeA : timeA - timeB;
            });

            const sortedLogs = [...pastLogs].sort((a, b) => {
              const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
              const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
              return taskTimeFilter === "recent" ? timeB - timeA : timeA - timeB;
            });

            return (
              <div className="space-y-6 select-none flex-1 p-4 md:p-8 bg-zinc-950/40 font-sans animate-fade-in">
                
                {/* Central Settings Navigation */}
                <div className="mb-6 space-y-5 select-none animate-fadeIn">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-zinc-900/10 border border-zinc-900 rounded-2xl p-6 gap-4">
                    <div>
                      <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                        <Settings className="w-5 h-5 text-zinc-400" />
                        Settings & System Administration
                      </h2>
                      <p className="text-xs text-zinc-500 mt-1">
                        Configure server properties, orchestrate admin user accounts, inspect logging history, and deployment platforms.
                      </p>
                    </div>
                    {!isAdmin && (
                      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5" />
                        Read-Only (Requires Admin Profile)
                      </div>
                    )}
                  </div>

                  <div className="flex overflow-x-auto whitespace-nowrap scrollbar-none gap-2 p-1 bg-zinc-950/80 border border-zinc-900 rounded-xl w-full max-w-full">
                    <button
                      type="button"
                      onClick={() => setSettingsSubTab("properties")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        settingsSubTab === "properties"
                          ? "bg-zinc-900 border border-zinc-805 text-white shadow-md font-extrabold"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      <Sliders className={`w-3.5 h-3.5 ${settingsSubTab === "properties" ? "text-cyan-400" : "text-zinc-500"}`} />
                      Server Properties
                    </button>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setSettingsSubTab("users")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          settingsSubTab === "users"
                            ? "bg-zinc-900 border border-zinc-805 text-white shadow-md font-extrabold"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        <Users className={`w-3.5 h-3.5 ${settingsSubTab === "users" ? "text-blue-400" : "text-zinc-500"}`} />
                        Users & Admins
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSettingsSubTab("tasks_history")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        settingsSubTab === "tasks_history"
                          ? "bg-zinc-900 border border-zinc-805 text-white shadow-md font-extrabold"
                          : "text-white"
                      }`}
                    >
                      <History className={`w-3.5 h-3.5 ${settingsSubTab === "tasks_history" ? "text-pink-400" : "text-zinc-500"}`} />
                      Tasks & History
                    </button>

                    <button
                      type="button"
                      onClick={() => setSettingsSubTab("selfhost")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        settingsSubTab === "selfhost"
                          ? "bg-zinc-900 border border-zinc-805 text-white shadow-md font-extrabold"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      <Server className={`w-3.5 h-3.5 ${settingsSubTab === "selfhost" ? "text-teal-400" : "text-zinc-500"}`} />
                      Hosting & Docker Setup
                    </button>

                    <button
                      type="button"
                      onClick={() => setSettingsSubTab("updates")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        settingsSubTab === "updates"
                          ? "bg-zinc-900 border border-zinc-805 text-white shadow-md font-extrabold"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      <CloudDownload className={`w-3.5 h-3.5 ${settingsSubTab === "updates" ? "text-purple-400" : "text-zinc-500"}`} />
                      Software Updates
                    </button>
                  </div>
                </div>

                {/* Sub-header Banner */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-zinc-900/10 border border-zinc-900 rounded-2xl p-6 mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                      <History className="w-4 h-4 text-pink-400" />
                      Tasks Coordinator & Actions History
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                      Monitor your active task processes, resource updates, and full event-action journals from the administration panel.
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
                    {/* Time Sorting Filters */}
                    <div className="flex items-center gap-1.5 bg-zinc-950/40 border border-zinc-900 p-1 rounded-xl">
                      <button
                        onClick={() => setTaskTimeFilter("recent")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                          taskTimeFilter === "recent"
                            ? "bg-zinc-800 text-emerald-400 shadow-md border border-zinc-700/30"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        Recent
                      </button>
                      <button
                        onClick={() => setTaskTimeFilter("oldest")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                          taskTimeFilter === "oldest"
                            ? "bg-zinc-800 text-emerald-400 shadow-md border border-zinc-700/30"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        Oldest
                      </button>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        {activeTasks.length > 0 && (
                          <button
                            onClick={handleClearFinishedTasks}
                            className="px-3.5 py-2 hover:bg-zinc-800 text-zinc-350 font-black text-[10px] rounded-xl transition-all cursor-pointer uppercase tracking-wider border border-zinc-800 shadow-sm"
                          >
                            Flush Tracker
                          </button>
                        )}
                        {pastLogs.length > 0 && (
                          <button
                            onClick={handleClearHistoryLogs}
                            className="px-3.5 py-2 bg-red-950/45 hover:bg-red-900/80 text-red-400 font-black text-[10px] rounded-xl transition-all cursor-pointer uppercase tracking-wider border border-red-900/40 shadow-sm"
                          >
                            Clear Logs
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Grid Lists layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none">
                  {/* Left Column: Active Tasks */}
                  <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 flex flex-col h-[580px] overflow-hidden shadow-xl">
                    <div className="flex justify-between items-center mb-5">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-emerald-500" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-300">Active Task Tracker</h3>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-zinc-950 border border-zinc-900 text-zinc-500 font-mono">
                        {activeTasks.length} jobs
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                      {sortedTasks.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-zinc-950/20 rounded-2xl border border-zinc-900 border-dashed">
                          <CheckCircle className="w-10 h-10 text-zinc-800 mb-2.5" />
                          <p className="text-xs text-zinc-400 font-black uppercase tracking-wide">All background jobs completed</p>
                          <p className="text-[10px] text-zinc-600 max-w-xs mt-1">No active addon processing, world compilation, or update migrations currently executing.</p>
                        </div>
                      ) : (
                        sortedTasks.map((t, idx) => (
                          <div key={idx} className="bg-zinc-900/50 border border-zinc-900 p-5 rounded-2xl space-y-3 shadow-sm hover:border-zinc-850 transition-all">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-xs font-black text-white tracking-wide">{t.name}</h4>
                                <p className="text-[10px] text-zinc-500 mt-1">{t.description}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span
                                  className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded leading-normal ${
                                    t.status === "completed"
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : t.status === "failed"
                                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                                  }`}
                                >
                                  {t.status}
                                </span>
                                {t.timestamp && (
                                  <span className="text-[8px] font-mono text-zinc-600">
                                    {t.timestamp.slice(11, 19)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="space-y-1.5 opacity-90">
                              <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden">
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
                  </div>

                  {/* Right Column: Past Logs Action History */}
                  <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 flex flex-col h-[580px] overflow-hidden shadow-xl">
                    <div className="flex justify-between items-center mb-5">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-300">Action History Log</h3>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-zinc-950 border border-zinc-900 text-zinc-500 font-mono">
                        {pastLogs.length} audits
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
                      {sortedLogs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-zinc-950/20 rounded-2xl border border-zinc-900 border-dashed">
                          <ClipboardList className="w-10 h-10 text-zinc-800 mb-2.5" />
                          <p className="text-xs text-zinc-400 font-black uppercase tracking-wide">Empty audit database</p>
                          <p className="text-[10px] text-zinc-600 max-w-xs mt-1">Actions such as server start/stop and installer triggers will create audit logs.</p>
                        </div>
                      ) : (
                        sortedLogs.map((h, idx) => (
                          <div key={idx} className="p-4 bg-zinc-900/30 border border-zinc-900 rounded-2xl flex gap-3.5 text-xs leading-relaxed shadow-sm hover:border-zinc-850 hover:bg-zinc-900/40 transition-all">
                            {h.status === "completed" ? (
                              <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-baseline gap-2">
                                <span className="font-extrabold text-zinc-200 tracking-wide">{h.name}</span>
                                <span className="text-[9px] font-mono text-zinc-600 whitespace-nowrap">
                                  {h.timestamp.slice(11, 19)}
                                </span>
                              </div>
                              <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">{h.message}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

             {/* ==================== B. ADDONS & PACKS MANAGER VIEW ==================== */}
          {navTab === "addons" && (
            <AddonManager
              addons={addons}
              isAdmin={isAdmin}
              token={token}
              addonSortBy={addonSortBy}
              setAddonSortBy={setAddonSortBy}
              addonViewMode={addonViewMode}
              setAddonViewMode={setAddonViewMode}
              addonSearch={addonSearch}
              setAddonSearch={setAddonSearch}
              localBehaviorOrder={localBehaviorOrder}
              setLocalBehaviorOrder={setLocalBehaviorOrder}
              localResourceOrder={localResourceOrder}
              setLocalResourceOrder={setLocalResourceOrder}
              isSavingLoadOrder={isSavingLoadOrder}
              uploadError={uploadError}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              uploadingFilesNames={uploadingFilesNames}
              handleUploadFileListDirect={handleUploadFileListDirect}
              handleSaveAddonLoadOrder={handleSaveAddonLoadOrder}
              handleEnableAllAddons={handleEnableAllAddons}
              handleDisableAllAddons={handleDisableAllAddons}
              handleDeleteAllAddons={handleDeleteAllAddons}
              toggleAddonEnabled={toggleAddonEnabled}
              openEditAddon={openEditAddon}
              deleteAddon={deleteAddon}
              setUpdatingAddonUuid={setUpdatingAddonUuid}
              updateAddonFileInputRef={updateAddonFileInputRef}
              addonFileInputRef={addonFileInputRef}
              showBanner={showBanner}
              draggedBehaviorIdx={draggedBehaviorIdx}
              setDraggedBehaviorIdx={setDraggedBehaviorIdx}
              draggedResourceIdx={draggedResourceIdx}
              setDraggedResourceIdx={setDraggedResourceIdx}
              handleReorderBehaviorPacks={handleReorderBehaviorPacks}
              handleReorderResourcePacks={handleReorderResourcePacks}
            />
          )}

          {/* ==================== C. WORLDS ARCHIVE MANAGEMENT VIEW ==================== */}
          {navTab === "worlds" && (
            <div className="space-y-6 select-none animate-fadeIn">
              {/* Header Card */}
              <div className="flex justify-between items-center bg-zinc-900/10 border border-zinc-900 rounded-2xl p-6">
                <div>
                  <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-amber-400" />
                    Minecraft World Vault
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Manage Bedrock server directories, export worlds to `.mcworld` packages, and administer disaster-recovery database backups.
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
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wider uppercase px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md cursor-pointer transition-colors"
                    >
                      <UploadCloud className="w-4 h-4" />
                      Import .mcworld
                    </button>
                  </div>
                ) : (
                  <span className="px-3 py-1.5 rounded-xl bg-zinc-900 text-zinc-500 border border-zinc-850 text-xs font-bold uppercase select-none leading-none">
                    Viewer Read Only
                  </span>
                )}
              </div>

              {/* Worlds Listing Grid */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest px-1">Indexed Server Worlds</h3>
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
                        className={`bg-zinc-900/40 border rounded-2xl p-5 flex flex-col justify-between shadow hover:border-zinc-850 transition-all ${
                          w.isActive ? "border-emerald-500/20 bg-emerald-950/10" : "border-zinc-900"
                        }`}
                      >
                        <div className="space-y-4">
                          {editingWorld === w.folderName ? (
                            <div className="space-y-3 p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                              <span className="text-[10px] font-black text-zinc-400 block uppercase tracking-widest">Configure World</span>
                              <div className="space-y-2">
                                <div>
                                  <label className="text-[10px] text-zinc-500 block mb-1">World Display Name</label>
                                  <input
                                    type="text"
                                    value={editDisplayName}
                                    onChange={(e) => setEditDisplayName(e.target.value)}
                                    className="w-full text-xs bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white focus:border-indigo-500 focus:outline-none"
                                    placeholder="e.g. My Survival Realm"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-zinc-500 block mb-1">Folder Name (on disk)</label>
                                  <input
                                    type="text"
                                    value={editFolderName}
                                    onChange={(e) => setEditFolderName(e.target.value)}
                                    className="w-full text-xs bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white focus:border-indigo-500 focus:outline-none"
                                    placeholder="e.g. BedrockWorld"
                                  />
                                  {w.isActive && (
                                    <span className="text-[9px] text-amber-500/80 leading-normal block mt-1">
                                      * Renaming folder name of the active world requires bedrock server to be fully stopped first.
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1.5 justify-end mt-2 pt-1">
                                <button
                                  onClick={() => setEditingWorld(null)}
                                  className="text-[10px] uppercase font-black text-zinc-400 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-800 cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleConfigureWorld(w.folderName)}
                                  className="text-[10px] uppercase font-black text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg cursor-pointer"
                                >
                                  Save Change
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-3">
                                <FolderOpen className={`w-8 h-8 ${w.isActive ? "text-emerald-400" : "text-zinc-500"}`} />
                                <div className="min-w-0 flex-1">
                                  <h4 className="text-xs font-black text-white tracking-wide truncate" title={w.name}>{w.name}</h4>
                                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Size on Disk: {formatBytes(w.sizeBytes)}</p>
                                </div>
                              </div>

                              {w.isActive ? (
                                <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex items-center gap-2 text-[10px] text-emerald-400">
                                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span>This world is currently active on server start configs.</span>
                                </div>
                              ) : (
                                <p className="text-[10px] text-zinc-600 leading-snug truncate">Folder: worlds/{w.folderName}</p>
                              )}
                            </>
                          )}
                        </div>

                        <div className="flex justify-between items-center mt-5 pt-4 border-t border-zinc-900/65">
                          <div className="flex items-center gap-2">
                            {isAdmin && !w.isActive && !editingWorld && (
                              <button
                                onClick={() => setActiveWorld(w.folderName)}
                                className="bg-emerald-600/10 text-emerald-400 hover:bg-emerald-605/20 border border-emerald-500/20 font-black text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-lg select-none cursor-pointer animate-fadeIn"
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

                          <div className="flex items-center gap-1.5">
                            {/* Configure World Button */}
                            {isAdmin && !editingWorld && (
                              <button
                                onClick={() => {
                                  setEditingWorld(w.folderName);
                                  setEditDisplayName(w.name);
                                  setEditFolderName(w.folderName);
                                }}
                                title="Configure Display Name & Folder directory"
                                className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Create Backup */}
                            {isAdmin && !editingWorld && (
                              <button
                                onClick={() => handleCreateBackup(w.folderName)}
                                disabled={loadingBackups}
                                title="Compile snapshot backup zip of this world"
                                className="p-1.5 rounded-lg border border-zinc-805 bg-indigo-550/5 hover:bg-indigo-500/20 text-indigo-400 transition-colors cursor-pointer"
                              >
                                <History className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Export Download */}
                            {!editingWorld && (
                              <button
                                onClick={() => handleExportWorld(w.folderName)}
                                title="Download world directory package as .mcworld"
                                className="p-1.5 rounded-lg border border-zinc-805 bg-amber-550/5 hover:bg-amber-500/19 text-amber-400 transition-colors cursor-pointer"
                              >
                                <CloudDownload className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete World */}
                            {isAdmin && !w.isActive && !editingWorld && (
                              <button
                                onClick={() => {
                                  promptConfirm(
                                    "Delete World Directory",
                                    `Are you sure you want to permanently delete the world directory "${w.folderName}"? ALL structures, players inventory, and blocks in it will be lost forever.`,
                                    () => handleDeleteWorld(w.folderName)
                                  );
                                }}
                                title="Permanently delete world folder"
                                className="p-1.5 rounded-lg border border-red-900/30 bg-red-950/10 hover:bg-red-950/30 text-red-400 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Multi-Column Bento Details Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 1. World Backups List (Left 7-columns) */}
                <div className="lg:col-span-7 bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 md:p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-zinc-900/60 pb-3">
                    <div>
                      <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <History className="w-4 h-4 text-indigo-400" />
                        World Backup Snaps List
                      </h3>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        Recover server errors by restoring historical zip files.
                      </p>
                    </div>

                    {isAdmin && worlds.length > 0 && (
                      <button
                        onClick={() => {
                          const activeWorld = appConfig.levelName || "BedrockWorld";
                          handleCreateBackup(activeWorld);
                        }}
                        disabled={loadingBackups}
                        className="bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/20 hover:border-indigo-500 font-bold text-[10px] uppercase tracking-wider py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Quick Backup
                      </button>
                    )}
                  </div>

                  {loadingBackups ? (
                    <div className="py-12 text-center space-y-2">
                      <RefreshCw className="w-6 h-6 text-indigo-450 animate-spin mx-auto" />
                      <p className="text-xs text-zinc-500">Processing file archive stream...</p>
                    </div>
                  ) : backups.length === 0 ? (
                    <div className="py-12 border border-dashed border-zinc-900 rounded-xl text-center space-y-2 bg-zinc-950/20">
                      <History className="w-10 h-10 text-zinc-800 mx-auto" />
                      <h4 className="text-xs font-bold text-zinc-400">No world backups created yet</h4>
                      <p className="text-[10px] text-zinc-500 max-w-xs mx-auto leading-relaxed">
                        Trigger backups manually on worlds, or toggle the automatic start/stop triggers to save backups.
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-[500px] overflow-y-auto space-y-3 pr-1">
                      {backups.map((b, idx) => {
                        const dateStr = b.createdAt ? new Date(b.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        }) : "Date Unknown";
                        
                        return (
                          <div
                            key={idx}
                            className="bg-zinc-900/20 border border-zinc-900 px-3.5 py-3 rounded-xl flex items-center justify-between gap-4 hover:border-zinc-800 transition-colors"
                          >
                            <div className="min-w-0 flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center border border-zinc-900 shrink-0">
                                <History className="w-4 h-4 text-zinc-600" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-black text-white hover:text-indigo-400 truncate tracking-wide block max-w-[150px] md:max-w-[220px]">
                                    {b.worldName}
                                  </span>
                                  <span className="text-[9px] text-indigo-400 font-mono bg-indigo-500/5 border border-indigo-500/10 px-1 rounded block">
                                    {formatBytes(b.sizeBytes)}
                                  </span>
                                </div>
                                <p className="text-[9.5px] text-zinc-500 truncate mt-0.5">{b.fileName}</p>
                                <p className="text-[9px] text-zinc-600 block mt-0.5">{dateStr}</p>
                              </div>
                            </div>

                            <div className="flex gap-2 shrink-0">
                              {/* Restore Button */}
                              {isAdmin && (
                                <button
                                  onClick={() => handleRestoreBackup(b.fileName, b.worldName)}
                                  disabled={loadingBackups}
                                  title="Restore and replace database directory files"
                                  className="py-1 px-2.5 rounded-lg font-bold text-[9px] uppercase tracking-wider bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-amber-500 hover:text-amber-400 transition-all cursor-pointer"
                                >
                                  Restore
                                </button>
                              )}

                              {/* Delete Button */}
                              {isAdmin && (
                                <button
                                  onClick={() => handleDeleteBackup(b.fileName)}
                                  disabled={loadingBackups}
                                  title="Delete this backup archive file from server storage."
                                  className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/5 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. World Backup Settings (Right 5-columns) */}
                <div className="lg:col-span-5 bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 md:p-6 space-y-5">
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Settings className="w-4 h-4 text-emerald-400" />
                      Backup Settings Panel
                    </h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      Change retention limits and automated cron schedules to your heart's desire.
                    </p>
                  </div>

                  <div className="space-y-4 pt-1">
                    {/* Keep Limit selector */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                          Max Backups per World
                        </label>
                        <span className="text-emerald-400 font-mono text-[10px] font-bold select-none bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                          {appConfig.backupCountToKeep ?? 5} files
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={20}
                        value={appConfig.backupCountToKeep ?? 5}
                        disabled={!isAdmin}
                        onChange={e => updateSettingsField({ backupCountToKeep: Number(e.target.value) })}
                        className="w-full h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <p className="text-[9px] text-zinc-500 leading-normal">
                        When this count is reached for a world directory, old zip snap logs are deleted cleanly.
                      </p>
                    </div>

                    {/* Frequency Hourly selector */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block">
                        Scheduled Backup Interval
                      </label>
                      <select
                        value={appConfig.backupFrequencyHours ?? 24}
                        disabled={!isAdmin}
                        onChange={e => updateSettingsField({ backupFrequencyHours: Number(e.target.value) })}
                        className="w-full bg-zinc-950 border border-zinc-900 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-350 focus:outline-none focus:border-emerald-500/40"
                      >
                        <option value={0}>Disabled (Manual Only)</option>
                        <option value={1}>Every 1 hour (Ultra secure)</option>
                        <option value={6}>Every 6 hours</option>
                        <option value={12}>Every 12 hours</option>
                        <option value={24}>Every 24 hours (Daily default)</option>
                        <option value={72}>Every 3 days</option>
                        <option value={168}>Every 7 days (Weekly)</option>
                      </select>
                      <p className="text-[9px] text-zinc-500 leading-normal">
                        Scheduled background checks run periodically on the host and back up the current active world folder.
                      </p>
                    </div>

                    {/* Toggles for Start/Stop */}
                    <div className="border-t border-zinc-900 pt-4 space-y-3.5">
                      <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block">Start & Stop Hooks</span>
                      
                      {/* Hook 1: Start */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="space-y-0.5 max-w-[200px] md:max-w-xs">
                          <p className="text-[11px] font-extrabold text-zinc-200">Backup on Server Bootup</p>
                          <p className="text-[9.5px] text-zinc-500 leading-relaxed">Saves a complete snapshot right before Bedrock spawns.</p>
                        </div>
                        <button
                          onClick={() => {
                            if (!isAdmin) return;
                            updateSettingsField({ backupOnStart: !appConfig.backupOnStart });
                          }}
                          disabled={!isAdmin}
                          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                            appConfig.backupOnStart ? "bg-emerald-500" : "bg-zinc-850 border border-zinc-800"
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              appConfig.backupOnStart ? "translate-x-4.5" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Hook 2: Stop */}
                      <div className="flex items-center justify-between gap-3 pt-1">
                        <div className="space-y-0.5 max-w-[200px] md:max-w-xs">
                          <p className="text-[11px] font-extrabold text-zinc-200">Backup on Server Shutdown</p>
                          <p className="text-[9.5px] text-zinc-500 leading-relaxed">Compiles snapshots immediately as files are unlocked on exit.</p>
                        </div>
                        <button
                          onClick={() => {
                            if (!isAdmin) return;
                            updateSettingsField({ backupOnStop: !appConfig.backupOnStop });
                          }}
                          disabled={!isAdmin}
                          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                            appConfig.backupOnStop ? "bg-emerald-500" : "bg-zinc-850 border border-zinc-800"
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              appConfig.backupOnStop ? "translate-x-4.5" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Last backup timestamp display */}
                    {appConfig.lastBackupTimestamp ? (
                      <div className="bg-zinc-950/45 border border-zinc-900 px-4 py-3 rounded-xl flex items-center gap-3">
                        <Clock className="w-4 h-4 text-zinc-500" />
                        <div>
                          <p className="text-[9px] text-zinc-600 uppercase font-black tracking-wider leading-none">Last Auto Backup Compiled</p>
                          <p className="text-[10px] text-amber-500 font-mono mt-1 font-bold">
                            {new Date(appConfig.lastBackupTimestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ) : null}

                  </div>
                </div>

              </div>

            </div>
          )}
          {/* ==================== D. FULL EXPANDED MOBILE/DESKTOP CONSOLE VIEW ==================== */}
          {navTab === "console" && (
            <div className="w-full h-full min-h-[500px] flex flex-col gap-5">
              {/* Console logs card output terminal */}
              <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl flex flex-col h-full overflow-hidden shadow-2xl flex-1">
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

                  {/* Redirect to Quick Commands tab */}
                  <div className="flex items-center justify-between mt-4 p-2.5 bg-zinc-900/35 border border-zinc-900/40 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Grid className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-zinc-400">
                        Trigger custom macro presets inside the dedicated command space
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNavTab("quick_commands")}
                      className="px-2.5 py-1 text-[9px] uppercase font-black tracking-wider bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-amber-400 rounded-lg transition-all cursor-pointer select-none"
                    >
                      Open Commands Deck
                    </button>
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
            </div>
          )}

          {/* ==================== E. USERS AND SECURITY AUTHORIZATIONS ==================== */}
          {navTab === "settings" && settingsSubTab === "users" && isAdmin && (
            <div className="space-y-6 flex-1 p-4 md:p-8 bg-zinc-950/40 font-sans">
              
              {/* Central Settings Navigation */}
              <div className="mb-6 space-y-5 select-none animate-fadeIn">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-zinc-900/10 border border-zinc-900 rounded-2xl p-6 gap-4">
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                      <Settings className="w-5 h-5 text-zinc-400" />
                      Settings & System Administration
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1">
                      Configure server properties, orchestrate admin user accounts, inspect logging history, and deployment platforms.
                    </p>
                  </div>
                  {!isAdmin && (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5" />
                      Read-Only (Requires Admin Profile)
                    </div>
                  )}
                </div>

                <div className="flex overflow-x-auto whitespace-nowrap scrollbar-none gap-2 p-1 bg-zinc-950/80 border border-zinc-900 rounded-xl w-full max-w-full">
                  <button
                    type="button"
                    onClick={() => setSettingsSubTab("properties")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      settingsSubTab === "properties"
                        ? "bg-zinc-900 border border-zinc-805 text-white shadow-md font-extrabold"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <Sliders className={`w-3.5 h-3.5 ${settingsSubTab === "properties" ? "text-cyan-400" : "text-zinc-500"}`} />
                    Server Properties
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setSettingsSubTab("users")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        settingsSubTab === "users"
                          ? "bg-zinc-900 border border-zinc-805 text-white shadow-md font-extrabold"
                          : "text-zinc-350 hover:text-white"
                      }`}
                    >
                      <Users className={`w-3.5 h-3.5 ${settingsSubTab === "users" ? "text-blue-400" : "text-zinc-500"}`} />
                      Users & Admins
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSettingsSubTab("tasks_history")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      settingsSubTab === "tasks_history"
                        ? "bg-zinc-900 border border-zinc-805 text-white shadow-md font-extrabold"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <History className={`w-3.5 h-3.5 ${settingsSubTab === "tasks_history" ? "text-pink-400" : "text-zinc-500"}`} />
                    Tasks & History
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettingsSubTab("selfhost")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      settingsSubTab === "selfhost"
                        ? "bg-zinc-900 border border-zinc-805 text-white shadow-md font-extrabold"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <Server className={`w-3.5 h-3.5 ${settingsSubTab === "selfhost" ? "text-teal-400" : "text-zinc-500"}`} />
                    Hosting & Docker Setup
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettingsSubTab("updates")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      settingsSubTab === "updates"
                        ? "bg-zinc-900 border border-zinc-805 text-white shadow-md font-extrabold"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <CloudDownload className={`w-3.5 h-3.5 ${settingsSubTab === "updates" ? "text-purple-400" : "text-zinc-500"}`} />
                    Software Updates
                  </button>
                </div>
              </div>

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

          {/* ==================== QUICK COMMANDS TAB PANEL ==================== */}
          {navTab === "quick_commands" && (
            <div className="space-y-6 select-none animate-fade-in flex flex-col h-full overflow-hidden">
              {/* Header block with statistics / actions */}
              <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 border border-zinc-900 rounded-2xl p-6 shadow-xl relative overflow-hidden flex-shrink-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-black uppercase text-amber-400 tracking-wider">
                      Command Deck
                    </div>
                    <h2 className="text-xl font-black text-white tracking-tight">Quick Command Presets</h2>
                    <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
                      Dispatch custom or built-in Minecraft server console macros with one-click trigger buttons. Configure name, command lines, decorative color-coding, and icon badges.
                    </p>
                  </div>

                  {/* Top-level Toolbar */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingCmd(!isAddingCmd)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Add Custom Button
                    </button>
                    <button
                      type="button"
                      onClick={handleResetDefaultCommands}
                      className="px-4 py-2 bg-zinc-850 hover:bg-zinc-805 hover:text-white text-zinc-300 text-xs font-bold rounded-xl flex items-center gap-2 transition-all border border-zinc-700/55 cursor-pointer"
                      title="Reset presets list to standard game defaults"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Restore Defaults
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid content / Forms split */}
              <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  
                  {/* Custom Command Adding Form (Left Column if open) */}
                  {isAddingCmd && (
                    <div className="col-span-1 bg-zinc-900/60 border border-zinc-900 rounded-2xl p-5 shadow-inner space-y-4 animate-slide-in">
                      <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                        <span className="text-[10px] uppercase font-black text-zinc-400 tracking-wider">Configure Custom Command</span>
                        <button 
                          onClick={() => setIsAddingCmd(false)} 
                          className="text-xs text-zinc-500 hover:text-white font-bold transition-all"
                        >
                          Cancel
                        </button>
                      </div>

                      <form onSubmit={handleAddQuickCommand} className="space-y-4">
                        {/* Name Input */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Button Label</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Dawn Time"
                            value={newCmdName}
                            onChange={e => setNewCmdName(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white outline-none focus:border-amber-500 transition-colors"
                          />
                        </div>

                        {/* Command Line Input */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Server Command</label>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-zinc-500 font-mono text-xs select-none">/</span>
                            <input
                              type="text"
                              required
                              placeholder="e.g. time set dawn"
                              value={newCmdStr}
                              onChange={e => setNewCmdStr(e.target.value)}
                              className="w-full pl-6 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white font-mono outline-none focus:border-amber-500 transition-colors"
                            />
                          </div>
                          <span className="text-[9px] text-zinc-500 block leading-tight">Do not include the leading slash (/) character.</span>
                        </div>

                        {/* Select Icon */}
                        <div className="space-y-2 font-sans">
                          <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block">Visual Icon Bedding</label>
                          <div className="grid grid-cols-5 gap-1.5 p-2 bg-zinc-950/50 rounded-xl border border-zinc-900 max-h-40 overflow-y-auto">
                            {Object.keys(ICON_MAP).map(iconName => {
                              const IconComponent = ICON_MAP[iconName];
                              return (
                                <button
                                  key={iconName}
                                  type="button"
                                  onClick={() => setNewCmdIcon(iconName)}
                                  className={`p-2 flex items-center justify-center rounded-lg border text-xs transition-all cursor-pointer ${
                                    newCmdIcon === iconName
                                      ? "bg-amber-500/10 border-amber-500 text-amber-400 shadow-sm"
                                      : "border-transparent bg-zinc-900/40 text-zinc-500 hover:text-zinc-350 hover:bg-zinc-850"
                                  }`}
                                  title={iconName}
                                >
                                  {IconComponent ? <IconComponent className="w-4 h-4" /> : iconName}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Select Color */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block">Color Coding Accent</label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {Object.keys(COLOR_CLASSES).map(colorName => {
                              const config = COLOR_CLASSES[colorName];
                              return (
                                <button
                                  key={colorName}
                                  type="button"
                                  onClick={() => setNewCmdColor(colorName)}
                                  className={`py-1.5 px-2 text-[10px] font-black tracking-wide border rounded-lg transition-all capitalize select-none cursor-pointer flex items-center justify-center gap-1.5 ${
                                    newCmdColor === colorName
                                      ? `${config.bg} ${config.border} ${config.text} ring-1 ring-amber-500/25 shadow-inner`
                                      : "border-zinc-850 bg-zinc-900/20 text-zinc-500 hover:text-zinc-400 hover:bg-zinc-850"
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${config.accent}`} />
                                  {colorName}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2.5 bg-amber-650 hover:bg-amber-550 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer"
                        >
                          Save Command Button
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Grid layout of commands */}
                  <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAddingCmd ? "lg:col-span-2" : "lg:col-span-3"} gap-4`}>
                    {quickCommands.length === 0 ? (
                      <div className="col-span-full py-12 px-6 border border-dashed border-zinc-800 rounded-2xl text-center space-y-2">
                        <Terminal className="w-8 h-8 text-zinc-650 mx-auto" />
                        <h4 className="text-sm font-bold text-zinc-400">No command buttons defined yet</h4>
                        <p className="text-xs text-zinc-500 max-w-sm mx-auto">Click "Add Custom Button" above or click "Restore Defaults" to populate standard administrative console macros.</p>
                      </div>
                    ) : (
                      quickCommands.map((item, idx) => {
                        const IconComponent = ICON_MAP[item.icon] || Terminal;
                        const colors = COLOR_CLASSES[item.color] || COLOR_CLASSES.zinc;
                        const isOnline = stats?.status === "running";

                        return (
                          <div
                            key={item.id}
                            draggable={true}
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/plain", item.id);
                              e.dataTransfer.effectAllowed = "move";
                              setDraggedCmdIdx(idx);
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                            }}
                            onDragEnter={() => {
                              handleReorderQuickCommands(idx);
                            }}
                            onDragEnd={() => setDraggedCmdIdx(null)}
                            onClick={() => {
                              if (isOnline) {
                                sendPresetCommand(item.command);
                              } else {
                                showBanner("The Minecraft server must be ONLINE to execute quick commands.", "error");
                              }
                            }}
                            className={`group relative border rounded-2xl p-5 pl-11 flex items-start gap-4 transition-all shadow-sm ${
                              draggedCmdIdx === idx
                                ? "border-amber-500 bg-amber-950/20 opacity-55 scale-[0.98] cursor-grabbing"
                                : isOnline 
                                  ? `${colors.bg} ${colors.border} cursor-pointer active:scale-[0.98]` 
                                  : "border-zinc-900 bg-zinc-950/40 opacity-50 cursor-not-allowed"
                            }`}
                          >
                            {/* Graceful drag handle indicator */}
                            <div className="absolute left-3 top-0 bottom-0 flex items-center text-zinc-650 group-hover:text-zinc-400 cursor-grab active:cursor-grabbing transition-colors">
                              <GripVertical className="w-4 h-4" />
                            </div>

                            {/* Accent Icon Badge */}
                            <div className={`p-3 rounded-xl flex items-center justify-center border font-semibold ${
                              isOnline ? `${colors.badge}` : "bg-zinc-950 border-zinc-900 text-zinc-600"
                            }`}>
                              <IconComponent className="w-5 h-5" />
                            </div>

                            {/* Details text context */}
                            <div className="flex-1 min-w-0 pr-6 space-y-1">
                              <h3 className={`text-sm font-bold tracking-tight leading-tight ${
                                isOnline ? "text-white" : "text-zinc-500"
                              }`}>
                                {item.name}
                              </h3>
                              <div className="font-mono text-[10px] text-zinc-400 bg-zinc-950/45 px-2 py-0.5 rounded border border-zinc-900 break-all w-fit">
                                /{item.command}
                              </div>
                            </div>

                            {/* Delete custom button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteQuickCommand(item.id, item.name);
                              }}
                              className="absolute top-4 right-4 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 text-zinc-500 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                              title="Delete command button"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                </div>
              </div>
            </div>
          )}

          {navTab === "settings" && settingsSubTab === "selfhost" && (
            <div className="space-y-6 select-none animate-fade-in flex-1 p-4 md:p-8 bg-zinc-950/40 font-sans">
              
              {/* Central Settings Navigation */}
              <div className="mb-6 space-y-5 select-none animate-fadeIn">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-zinc-900/10 border border-zinc-900 rounded-2xl p-6 gap-4">
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                      <Settings className="w-5 h-5 text-zinc-400" />
                      Settings & System Administration
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1">
                      Configure server properties, orchestrate admin user accounts, inspect logging history, and deployment platforms.
                    </p>
                  </div>
                  {!isAdmin && (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5" />
                      Read-Only (Requires Admin Profile)
                    </div>
                  )}
                </div>

                <div className="flex overflow-x-auto whitespace-nowrap scrollbar-none gap-2 p-1 bg-zinc-950/80 border border-zinc-900 rounded-xl w-full max-w-full">
                  <button
                    type="button"
                    onClick={() => setSettingsSubTab("properties")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      settingsSubTab === "properties"
                        ? "bg-zinc-900 border border-zinc-805 text-white shadow-md font-extrabold"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <Sliders className={`w-3.5 h-3.5 ${settingsSubTab === "properties" ? "text-cyan-400" : "text-zinc-500"}`} />
                    Server Properties
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setSettingsSubTab("users")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        settingsSubTab === "users"
                          ? "bg-zinc-900 border border-zinc-805 text-white shadow-md font-extrabold"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      <Users className={`w-3.5 h-3.5 ${settingsSubTab === "users" ? "text-blue-400" : "text-zinc-500"}`} />
                      Users & Admins
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSettingsSubTab("tasks_history")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      settingsSubTab === "tasks_history"
                        ? "bg-zinc-900 border border-zinc-805 text-white shadow-md font-extrabold"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <History className={`w-3.5 h-3.5 ${settingsSubTab === "tasks_history" ? "text-pink-400" : "text-zinc-500"}`} />
                    Tasks & History
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettingsSubTab("selfhost")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      settingsSubTab === "selfhost"
                        ? "bg-zinc-900 border border-zinc-805 text-white shadow-md font-extrabold"
                        : "text-zinc-550 hover:text-zinc-300"
                    }`}
                  >
                    <Server className={`w-3.5 h-3.5 ${settingsSubTab === "selfhost" ? "text-teal-400" : "text-zinc-500"}`} />
                    Hosting & Docker Setup
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettingsSubTab("updates")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      settingsSubTab === "updates"
                        ? "bg-zinc-900 border border-zinc-805 text-white shadow-md font-extrabold"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <CloudDownload className={`w-3.5 h-3.5 ${settingsSubTab === "updates" ? "text-purple-400" : "text-zinc-500"}`} />
                    Software Updates
                  </button>
                </div>
              </div>

              {/* Smaller selfhost contextual sub-banner */}
              <div className="bg-gradient-to-r from-teal-950/25 to-zinc-900/10 border border-teal-900/35 rounded-2xl p-5 shadow-xl select-none">
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2 animate-pulse">
                  <Server className="w-4 h-4 text-teal-400" />
                  Self-Hosting Guides & Portability Specifications
                </h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-3xl leading-relaxed">
                  Learn how to build, run and orchestrate this server manager on local physical machines, configure headless automation backgrounds, or utilize container standardization with Docker.
                </p>
              </div>

              {/* Dynamic Network Settings Panel (Requested by User) */}
              <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-6 shadow-xl space-y-6 select-none animate-fade-in font-sans">
                <div>
                  <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
                    <Globe className="w-4 h-4 text-teal-400" />
                    Network & Port Configuration
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Manage the IP binding hosts, router discovery mechanisms, and port routing mapping parameters for the administration system and Bedrock server.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Web App Panel Port */}
                  <div className="bg-zinc-950/40 border border-zinc-900 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-zinc-300 block">Web Panel Port</label>
                      <span className="text-[10px] bg-zinc-900 px-2 py-0.5 rounded text-zinc-500 font-mono">APP_PORT</span>
                    </div>
                    <input
                      type="number"
                      disabled={!isAdmin}
                      min="1"
                      max="65535"
                      value={appConfig.appPort ?? 3000}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 3000;
                        updateSettingsField({ appPort: val });
                      }}
                      className="w-full bg-zinc-950 border border-zinc-900 focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none cursor-text disabled:opacity-50"
                    />
                    <p className="text-[10px] text-zinc-500 leading-normal">
                      The network port that this web administration manager runs on.
                    </p>
                    <div className="text-[10px] text-amber-500/80 bg-amber-950/10 border border-amber-900/20 p-2 rounded-lg leading-relaxed flex items-start gap-1.5 mt-2">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>
                        Port is locked to <strong>3000</strong> on this hosted sandbox to preserve live preview, but your custom port will be active when running self-hosted!
                      </span>
                    </div>
                  </div>

                  {/* Bedrock Minecraft Port */}
                  <div className="bg-zinc-950/40 border border-zinc-900 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-zinc-300 block">Bedrock Server Port</label>
                      <span className="text-[10px] bg-zinc-900 px-2 py-0.5 rounded text-teal-400 font-mono">PORTS_UDP</span>
                    </div>
                    <input
                      type="number"
                      disabled={!isAdmin}
                      min="1"
                      max="65535"
                      value={appConfig.serverPort ?? 19132}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 19132;
                        updateSettingsField({ serverPort: val });
                      }}
                      className="w-full bg-zinc-950 border border-zinc-900 focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none cursor-text disabled:opacity-50"
                    />
                    <p className="text-[10px] text-zinc-500 leading-normal">
                      The game port that Minecraft players use to connect.
                    </p>
                    <div className="text-[10px] text-zinc-530 bg-zinc-900/40 border border-zinc-900 p-2 rounded-lg leading-relaxed flex items-start gap-1.5 mt-2">
                      <Activity className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 mt-0.5" />
                      <span>
                        Bedrock Dedicated uses UDP protocol. Be sure to select <strong>UDP</strong> in your router settings.
                      </span>
                    </div>
                  </div>

                  {/* IPv4 Bind Host Address */}
                  <div className="bg-zinc-950/40 border border-zinc-900 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-zinc-300 block">IP Interface Binding</label>
                      <span className="text-[10px] bg-zinc-900 px-2 py-0.5 rounded text-zinc-500 font-mono">BIND_ADDR</span>
                    </div>
                    <select
                      disabled={!isAdmin}
                      value={appConfig.bindAddress ?? "0.0.0.0"}
                      onChange={(e) => updateSettingsField({ bindAddress: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-900 focus:border-zinc-808 focus:ring-1 focus:ring-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none cursor-pointer disabled:opacity-50"
                    >
                      <option value="0.0.0.0">0.0.0.0 (All interfaces - default)</option>
                      <option value="127.0.0.1">127.0.0.1 (Local loopback only - secure)</option>
                    </select>
                    <p className="text-[10px] text-zinc-500 leading-normal">
                      Restricts access to loopback connection card or allows all incoming network clients.
                    </p>
                    <div className="text-[10px] text-teal-400 bg-teal-950/10 border border-teal-900/20 p-2 rounded-lg leading-relaxed flex items-start gap-1.5 mt-2">
                      <Shield className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>
                        Using 127.0.0.1 secures the dashboard so only callers directly on the host computer can connect.
                      </span>
                    </div>
                  </div>

                  {/* UPnP Routing Switch */}
                  <div className="bg-zinc-950/40 border border-zinc-900 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <label className="text-xs font-bold text-zinc-300 block">Router UPnP Port-Mapping</label>
                        <p className="text-[10px] text-zinc-500 mt-1">
                          Automatically negotiate port-mappings via UPnP. Easy multiplayer without manual router modification.
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={!isAdmin}
                        onClick={() => updateSettingsField({ upnpEnabled: !appConfig.upnpEnabled })}
                        className={`w-10 h-6 shrink-0 rounded-full p-1 transition-all duration-300 cursor-pointer outline-none ${
                          appConfig.upnpEnabled ? "bg-teal-500" : "bg-zinc-800"
                        } disabled:opacity-50`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-all duration-300 ${
                            appConfig.upnpEnabled ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* SSL HTTPS toggle (Self Hosted only) */}
                  <div className="bg-zinc-950/40 border border-zinc-900 p-4 rounded-xl space-y-3 md:col-span-1 lg:col-span-2">
                    <div className="flex justify-between items-start border-b border-zinc-900/60 pb-2 mb-2">
                      <div>
                        <label className="text-xs font-bold text-zinc-300 block">SSL HTTPS Encryption</label>
                        <p className="text-[10px] text-zinc-500 mt-1">
                          Encrypt control panel transport payloads with TLS context. Requires local paths to certificates.
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={!isAdmin}
                        onClick={() => updateSettingsField({ enableHttps: !appConfig.enableHttps })}
                        className={`w-10 h-6 shrink-0 rounded-full p-1 transition-all duration-300 cursor-pointer outline-none ${
                          appConfig.enableHttps ? "bg-teal-500" : "bg-zinc-800"
                        } disabled:opacity-50`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-all duration-300 ${
                            appConfig.enableHttps ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {appConfig.enableHttps && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 animate-fade-in">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-400 block">Certificate Path (.crt / .pem)</label>
                          <input
                            type="text"
                            disabled={!isAdmin}
                            placeholder="e.g., C:/certs/server.crt"
                            value={appConfig.sslCertPath ?? ""}
                            onChange={(e) => updateSettingsField({ sslCertPath: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-900 focus:border-zinc-800 text-[11px] font-mono rounded-lg px-2.5 py-1.5 text-white outline-none cursor-text disabled:opacity-50"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-400 block">Private Key Path (.key)</label>
                          <input
                            type="text"
                            disabled={!isAdmin}
                            placeholder="e.g., C:/certs/server.key"
                            value={appConfig.sslKeyPath ?? ""}
                            onChange={(e) => updateSettingsField({ sslKeyPath: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-905 focus:border-zinc-800 text-[11px] font-mono rounded-lg px-2.5 py-1.5 text-white outline-none cursor-text disabled:opacity-50"
                          />
                        </div>
                      </div>
                    )}
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

          {/* ==================== EXPERIMENTAL LAB TABS ==================== */}
          {navTab === "experimental" && (
            <div className="flex-1 p-4 md:p-8 overflow-y-auto space-y-8 bg-zinc-950/40 font-sans">
              
              {/* Central Experimental Navigation */}
              <div className="mb-6 space-y-5 select-none animate-fadeIn">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-rose-950/10 border border-rose-900/20 rounded-2xl p-6 gap-4">
                  <div>
                    <h2 className="text-xl font-black text-rose-400 tracking-tight flex items-center gap-2">
                      <FlaskConical className="w-5 h-5 text-rose-500 animate-pulse" />
                      Experimental Lab
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Access live player telemetry inside tactical maps, tunnel server ports to the public internet, or execute console bindings programmatically.
                    </p>
                  </div>
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2">
                    <FlaskConical className="w-3.5 h-3.5 animate-pulse" />
                    Beta & Tactical Features
                  </div>
                </div>

                <div className="flex overflow-x-auto whitespace-nowrap scrollbar-none gap-2 p-1 bg-zinc-950/80 border border-zinc-900 rounded-xl w-full max-w-full">
                  <button
                    type="button"
                    onClick={() => setExperimentalSubTab("players_map")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      experimentalSubTab === "players_map"
                        ? "bg-zinc-900 border border-zinc-805 text-white shadow-md font-extrabold"
                        : "text-zinc-550 hover:text-zinc-300"
                    }`}
                  >
                    <Map className={`w-3.5 h-3.5 ${experimentalSubTab === "players_map" ? "text-rose-400" : "text-zinc-500"}`} />
                    Players & Live Map
                  </button>

                  <button
                    type="button"
                    onClick={() => setExperimentalSubTab("console_connect")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      experimentalSubTab === "console_connect"
                        ? "bg-zinc-900 border border-zinc-805 text-white shadow-md font-extrabold"
                        : "text-zinc-550 hover:text-zinc-300"
                    }`}
                  >
                    <Link className={`w-3.5 h-3.5 ${experimentalSubTab === "console_connect" ? "text-violet-400" : "text-zinc-500"}`} />
                    Console Connect
                  </button>

                  <button
                    type="button"
                    onClick={() => setExperimentalSubTab("playit")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      experimentalSubTab === "playit"
                        ? "bg-zinc-900 border border-zinc-805 text-white shadow-md font-extrabold"
                        : "text-zinc-550 hover:text-zinc-300"
                    }`}
                  >
                    <Globe className={`w-3.5 h-3.5 ${experimentalSubTab === "playit" ? "text-sky-400" : "text-zinc-500"}`} />
                    Open to Internet
                  </button>
                </div>
              </div>

              {/* Render Selected Experimental Tool */}
              <div className="animate-fadeIn">
                {experimentalSubTab === "players_map" && (
                  <PlayersMap token={token} onShowMessage={showBanner} />
                )}

                {experimentalSubTab === "console_connect" && (
                  <ConsoleConnect
                    token={token}
                    serverPort={appConfig.serverPort}
                    serverLevelName={appConfig.levelName}
                    onShowMessage={(text, type) => showBanner(text, type)}
                  />
                )}

                {experimentalSubTab === "playit" && (
                  <PlayitConnect
                    token={token}
                    serverPort={appConfig.serverPort}
                    serverLevelName={appConfig.levelName}
                    onShowMessage={(text, type) => showBanner(text, type)}
                  />
                )}
              </div>

            </div>
          )}

          {navTab === "settings" && settingsSubTab === "updates" && (
            <div className="flex-1 p-4 md:p-8 overflow-y-auto space-y-8 bg-zinc-950/40 font-sans">
              
              {/* Central Settings Navigation */}
              <div className="mb-6 space-y-5 select-none animate-fadeIn">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-zinc-900/10 border border-zinc-900 rounded-2xl p-6 gap-4">
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                      <Settings className="w-5 h-5 text-zinc-400" />
                      Settings & System Administration
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1">
                      Configure server properties, orchestrate admin user accounts, inspect logging history, and deployment platforms.
                    </p>
                  </div>
                  {!isAdmin && (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5" />
                      Read-Only (Requires Admin Profile)
                    </div>
                  )}
                </div>

                <div className="flex overflow-x-auto whitespace-nowrap scrollbar-none gap-2 p-1 bg-zinc-950/80 border border-zinc-900 rounded-xl w-full max-w-full">
                  <button
                    type="button"
                    onClick={() => setSettingsSubTab("properties")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      settingsSubTab === "properties"
                        ? "bg-zinc-900 border border-zinc-805 text-white shadow-md font-extrabold"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <Sliders className={`w-3.5 h-3.5 ${settingsSubTab === "properties" ? "text-cyan-400" : "text-zinc-500"}`} />
                    Server Properties
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setSettingsSubTab("users")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        settingsSubTab === "users"
                          ? "bg-zinc-900 border border-zinc-805 text-white shadow-md font-extrabold"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      <Users className={`w-3.5 h-3.5 ${settingsSubTab === "users" ? "text-blue-400" : "text-zinc-500"}`} />
                      Users & Admins
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSettingsSubTab("tasks_history")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      settingsSubTab === "tasks_history"
                        ? "bg-zinc-900 border border-zinc-805 text-white shadow-md font-extrabold"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <History className={`w-3.5 h-3.5 ${settingsSubTab === "tasks_history" ? "text-pink-400" : "text-zinc-500"}`} />
                    Tasks & History
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettingsSubTab("selfhost")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      settingsSubTab === "selfhost"
                        ? "bg-zinc-900 border border-zinc-805 text-white shadow-md font-extrabold"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <Server className={`w-3.5 h-3.5 ${settingsSubTab === "selfhost" ? "text-teal-400" : "text-zinc-500"}`} />
                    Hosting & Docker Setup
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettingsSubTab("updates")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      settingsSubTab === "updates"
                        ? "bg-zinc-900 border border-zinc-805 text-white shadow-md font-extrabold"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <CloudDownload className={`w-3.5 h-3.5 ${settingsSubTab === "updates" ? "text-purple-400" : "text-zinc-500"}`} />
                    Software Updates
                  </button>
                </div>
              </div>

              <SoftwareUpdates
                token={token}
                onShowMessage={(text, type) => showBanner(text, type === "warn" ? "info" : type)}
              />
            </div>
          )}

          {navTab === "settings" && settingsSubTab === "properties" && (
            <div className="flex-1 p-4 md:p-8 overflow-y-auto space-y-8 bg-zinc-950/40 font-sans">
              
              {/* Central Settings Navigation */}
              <div className="mb-6 space-y-5 select-none animate-fadeIn">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-zinc-900/10 border border-zinc-900 rounded-2xl p-6 gap-4">
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                      <Settings className="w-5 h-5 text-zinc-400" />
                      Settings & System Administration
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1">
                      Configure server properties, orchestrate admin user accounts, inspect logging history, and deployment platforms.
                    </p>
                  </div>
                  {!isAdmin && (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5" />
                      Read-Only (Requires Admin Profile)
                    </div>
                  )}
                </div>

                <div className="flex overflow-x-auto whitespace-nowrap scrollbar-none gap-2 p-1 bg-zinc-950/80 border border-zinc-900 rounded-xl w-full max-w-full">
                  <button
                    type="button"
                    onClick={() => setSettingsSubTab("properties")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      settingsSubTab === "properties"
                        ? "bg-zinc-900 border border-zinc-805 text-white shadow-md font-extrabold"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <Sliders className={`w-3.5 h-3.5 ${settingsSubTab === "properties" ? "text-cyan-400" : "text-zinc-500"}`} />
                    Server Properties
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setSettingsSubTab("users")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        settingsSubTab === "users"
                          ? "bg-zinc-900 border border-zinc-805 text-white shadow-md font-extrabold"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      <Users className={`w-3.5 h-3.5 ${settingsSubTab === "users" ? "text-blue-400" : "text-zinc-500"}`} />
                      Users & Admins
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSettingsSubTab("tasks_history")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      settingsSubTab === "tasks_history"
                        ? "bg-zinc-900 border border-zinc-805 text-white shadow-md font-extrabold"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <History className={`w-3.5 h-3.5 ${settingsSubTab === "tasks_history" ? "text-pink-400" : "text-zinc-500"}`} />
                    Tasks & History
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettingsSubTab("selfhost")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      settingsSubTab === "selfhost"
                        ? "bg-zinc-900 border border-zinc-805 text-white shadow-md font-extrabold"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <Server className={`w-3.5 h-3.5 ${settingsSubTab === "selfhost" ? "text-teal-400" : "text-zinc-500"}`} />
                    Hosting & Docker Setup
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettingsSubTab("updates")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      settingsSubTab === "updates"
                        ? "bg-zinc-900 border border-zinc-805 text-white shadow-md font-extrabold"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <CloudDownload className={`w-3.5 h-3.5 ${settingsSubTab === "updates" ? "text-purple-400" : "text-zinc-500"}`} />
                    Software Updates
                  </button>
                </div>
              </div>

              {/* Sub-tab Switcher */}
              <div className="flex gap-2 bg-zinc-900/50 p-1 rounded-xl max-w-md border border-zinc-900/60">
                <button
                  type="button"
                  onClick={() => setPropertiesTab("gui")}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer select-none ${
                    propertiesTab === "gui"
                      ? "bg-zinc-850 text-white shadow"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Graphical Settings
                </button>
                <button
                  type="button"
                  onClick={() => setPropertiesTab("updater")}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer select-none ${
                    propertiesTab === "updater"
                      ? "bg-zinc-850 text-white shadow"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Core & Updater
                </button>
                <button
                  type="button"
                  onClick={() => setPropertiesTab("files")}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer select-none ${
                    propertiesTab === "files"
                      ? "bg-zinc-850 text-white shadow"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Config Files Editor
                </button>
              </div>

              {propertiesTab === "gui" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Visual Identity & Game Rules Card */}
                <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-6 space-y-6">
                  <div className="flex items-center gap-2 pb-3 border-b border-zinc-900/60">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <FolderOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white">Metadata & Game Settings</h2>
                      <p className="text-[10px] text-zinc-500">Core game session and file rules</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Server Display Name</label>
                      <input
                        type="text"
                        disabled={!isAdmin}
                        value={appConfig.serverName || ""}
                        onChange={e => updateSettingsField({ serverName: e.target.value })}
                        className="w-full bg-zinc-950/60 border border-zinc-850 p-2.5 text-xs font-semibold rounded-xl text-white outline-none focus:border-emerald-500 focus:bg-zinc-950 disabled:opacity-45"
                        placeholder="e.g. My Bedrock Dedicated Server"
                      />
                      <span className="text-[9px] text-zinc-500 block">Sets the MOTD/display name shown to players in game client servers tab.</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Active World Name</label>
                      <input
                        type="text"
                        disabled={!isAdmin}
                        value={appConfig.levelName || ""}
                        onChange={e => updateSettingsField({ levelName: e.target.value || "BedrockWorld" })}
                        className="w-full bg-zinc-950/60 border border-zinc-850 p-2.5 text-xs font-semibold rounded-xl text-white outline-none focus:border-emerald-500 focus:bg-zinc-950 disabled:opacity-45"
                        placeholder="BedrockWorld"
                      />
                      <span className="text-[9px] text-zinc-500 block">Sets the level-name directory folder containing active level.dat. Requires server reboot if changed.</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Game Rule Mod</label>
                        <select
                          disabled={!isAdmin}
                          value={appConfig.gamemode}
                          onChange={e => updateSettingsField({ gamemode: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-850 p-2 text-xs font-semibold rounded-xl text-white outline-none focus:border-emerald-500 disabled:opacity-45 h-10"
                        >
                          <option value="survival">Survival</option>
                          <option value="creative">Creative</option>
                          <option value="adventure">Adventure</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Difficulty Rating</label>
                        <select
                          disabled={!isAdmin}
                          value={appConfig.difficulty}
                          onChange={e => updateSettingsField({ difficulty: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-850 p-2 text-xs font-semibold rounded-xl text-white outline-none focus:border-emerald-500 disabled:opacity-45 h-10"
                        >
                          <option value="peaceful">Peaceful</option>
                          <option value="easy">Easy</option>
                          <option value="normal">Normal</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connection & Network Routing Configurations */}
                <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-6 space-y-6">
                  <div className="flex items-center gap-2 pb-3 border-b border-zinc-900/60">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white">Connection & Networks</h2>
                      <p className="text-[10px] text-zinc-500">Port binds and network connectivity thresholds</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Host Port (IPv4)</label>
                        <input
                          type="number"
                          disabled={!isAdmin}
                          value={appConfig.serverPort}
                          onChange={e => updateSettingsField({ serverPort: parseInt(e.target.value) || 19132 })}
                          className="w-full bg-zinc-950/60 border border-zinc-850 p-2.5 text-xs font-semibold rounded-xl text-white outline-none focus:border-emerald-500 focus:bg-zinc-950 disabled:opacity-45"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Max Connections</label>
                        <input
                          type="number"
                          disabled={!isAdmin}
                          value={appConfig.maxPlayers}
                          onChange={e => updateSettingsField({ maxPlayers: parseInt(e.target.value) || 20 })}
                          className="w-full bg-zinc-950/60 border border-zinc-850 p-2.5 text-xs font-semibold rounded-xl text-white outline-none focus:border-emerald-500 focus:bg-zinc-950 disabled:opacity-45"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">View Distance</label>
                        <input
                          type="number"
                          disabled={!isAdmin}
                          value={appConfig.viewDistance ?? 10}
                          onChange={e => updateSettingsField({ viewDistance: parseInt(e.target.value) || 10 })}
                          className="w-full bg-zinc-950/60 border border-zinc-850 p-2.5 text-xs font-semibold rounded-xl text-white outline-none focus:border-emerald-500 focus:bg-zinc-950 disabled:opacity-45"
                          min={4}
                          max={32}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Tick Distance</label>
                        <input
                          type="number"
                          disabled={!isAdmin}
                          value={appConfig.tickDistance ?? 4}
                          onChange={e => updateSettingsField({ tickDistance: parseInt(e.target.value) || 4 })}
                          className="w-full bg-zinc-950/60 border border-zinc-850 p-2.5 text-xs font-semibold rounded-xl text-white outline-none focus:border-emerald-500 focus:bg-zinc-950 disabled:opacity-45"
                          min={4}
                          max={16}
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="flex items-center justify-between p-3.5 bg-zinc-950/40 rounded-xl border border-zinc-900">
                        <div>
                          <h4 className="text-xs font-bold text-white">Xbox Active Authentication</h4>
                          <p className="text-[9px] text-zinc-500 mt-1 max-w-xs">
                            Forces connection credentials authentication through Xbox Live platform account networks. Disable to permit cracked/offline LAN logins.
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          disabled={!isAdmin}
                          checked={appConfig.onlineMode ?? false}
                          onChange={e => updateSettingsField({ onlineMode: e.target.checked })}
                          className="w-4.5 h-4.5 accent-emerald-500 cursor-pointer disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Server Telemetry & Advanced Flags Card */}
                <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-6 md:col-span-2 space-y-6">
                  <div className="flex items-center gap-2 pb-3 border-b border-zinc-900/60">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white">Advanced Options & Telemetry Reporting</h2>
                      <p className="text-[10px] text-zinc-500">Configure diagnostics and cheat modes for Mojang developer tools</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* HERE IS THE REQUISITE emit-server-telemetry PROPERTY SELECTOR */}
                    <div className="space-y-4 p-4.5 bg-zinc-950/30 rounded-xl border border-zinc-900">
                      <div>
                        <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wider block">Property Identifier</span>
                        <code className="text-xs text-indigo-400 font-bold font-mono">emit-server-telemetry</code>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Control backend telemetry tracking sent to Mojang network diagnostic analytics servers. Keep disabled to completely isolate local server footprint.
                      </p>

                      <div className="space-y-2 pt-3 border-t border-zinc-900">
                        <span className="text-[10px] text-zinc-300 font-bold uppercase tracking-wider block">Telemetry Track Status</span>
                        <div className="flex gap-4 mt-2">
                          <label className="flex items-center gap-2 cursor-pointer text-xs">
                            <input
                              type="radio"
                              disabled={!isAdmin}
                              name="emit-server-telemetry"
                              checked={appConfig.emitServerTelemetry === true}
                              onChange={() => updateSettingsField({ emitServerTelemetry: true })}
                              className="w-4 h-4 accent-emerald-500 cursor-pointer disabled:opacity-50"
                            />
                            <span className={appConfig.emitServerTelemetry === true ? "text-emerald-400 font-bold" : "text-zinc-400"}>True (Enabled)</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer text-xs">
                            <input
                              type="radio"
                              disabled={!isAdmin}
                              name="emit-server-telemetry"
                              checked={appConfig.emitServerTelemetry === false}
                              onChange={() => updateSettingsField({ emitServerTelemetry: false })}
                              className="w-4 h-4 accent-red-500 cursor-pointer disabled:opacity-50"
                            />
                            <span className={appConfig.emitServerTelemetry === false ? "text-red-400 font-bold" : "text-zinc-400"}>False (Disabled)</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 flex flex-col justify-between">
                      <div className="p-4 bg-zinc-950/40 rounded-xl border border-zinc-900 flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-white">Allow Administrative Cheats</h4>
                          <p className="text-[9px] text-zinc-550 leading-normal max-w-2xs">
                            Enables cheat commands like coordinates teleporting, changing gamemodes on active runs, or spawning custom block elements.
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          disabled={!isAdmin}
                          checked={appConfig.allowCheats ?? true}
                          onChange={e => updateSettingsField({ allowCheats: e.target.checked })}
                          className="w-4.5 h-4.5 accent-emerald-500 cursor-pointer disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

              {propertiesTab === "updater" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in text-zinc-350">
                  {/* Left: Port & Core Server configurations */}
                  <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-6 space-y-6">
                    <div className="flex items-center gap-2 pb-3 border-b border-zinc-900/60">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Sliders className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-white">Server Port Properties</h2>
                        <p className="text-[10px] text-zinc-500">Configure core ports, limits, difficulty and gamemode</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pb-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Ports</label>
                        <input
                          type="number"
                          disabled={!isAdmin}
                          value={appConfig.serverPort}
                          onChange={e => updateSettingsField({ serverPort: parseInt(e.target.value) || 19132 })}
                          className="w-full bg-zinc-950 border border-zinc-850 p-2.5 text-xs font-semibold rounded-xl text-white outline-none focus:border-emerald-500 disabled:opacity-40"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Max Player Limits</label>
                        <input
                          type="number"
                          disabled={!isAdmin}
                          value={appConfig.maxPlayers}
                          onChange={e => updateSettingsField({ maxPlayers: parseInt(e.target.value) || 20 })}
                          className="w-full bg-zinc-950 border border-zinc-850 p-2.5 text-xs font-semibold rounded-xl text-white outline-none focus:border-emerald-500 disabled:opacity-40"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 pb-1">
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Difficulties level</label>
                      <select
                        disabled={!isAdmin}
                        value={appConfig.difficulty}
                        onChange={e => updateSettingsField({ difficulty: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-850 p-2.5 text-xs font-semibold rounded-xl text-white outline-none focus:border-emerald-500 disabled:opacity-40 h-10"
                      >
                        <option value="peaceful">Peaceful</option>
                        <option value="easy">Easy</option>
                        <option value="normal">Normal</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Game mode rules</label>
                      <select
                        disabled={!isAdmin}
                        value={appConfig.gamemode}
                        onChange={e => updateSettingsField({ gamemode: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-850 p-2.5 text-xs font-semibold rounded-xl text-white outline-none focus:border-emerald-500 disabled:opacity-40 h-10"
                      >
                        <option value="survival">Survival</option>
                        <option value="creative">Creative</option>
                        <option value="adventure">Adventure</option>
                      </select>
                    </div>
                  </div>

                  {/* Right: Version update panel and config widgets */}
                  <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-6 space-y-6">
                    <div className="flex items-center gap-2 pb-3 border-b border-zinc-900/60">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <CloudDownload className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-white">Minecraft Updater Console</h2>
                        <p className="text-[10px] text-zinc-500">Target server binaries, auto-installations and custom ZIPs</p>
                      </div>
                    </div>

                    <p className="text-[10px] text-zinc-500 leading-relaxed">
                      Choose Bedrock version releases. Triggering automated installations downloads correct binary zips from Mojang server nets, extracts, chmod executables dynamically.
                    </p>

                    {/* Deploy Custom Dedicated Server ZIP */}
                    {isAdmin && (
                      <div className="bg-zinc-950/40 border border-zinc-900 border-dashed rounded-2xl p-4.5 space-y-3">
                        <div className="flex items-center gap-2">
                          <UploadCloud className="w-4 h-4 text-emerald-450" />
                          <h4 className="text-xs font-black text-white uppercase tracking-wider">Upload Dedicated Server File</h4>
                        </div>
                        <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">
                          Alternatively, upload a custom or pre-downloaded Bedrock Dedicated Server <code className="text-zinc-300 font-mono">.zip</code> package to extract and deploy automatically on this host.
                        </p>
                        
                        <div className="flex items-center gap-2">
                          <label className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-805 px-3.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-305 transition-all cursor-pointer select-none inline-flex items-center gap-2">
                            <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Select Server ZIP</span>
                            <input
                              type="file"
                              accept=".zip"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                
                                if (stats?.status !== "stopped") {
                                  showBanner("Please STOP the Bedrock Server completely before uploading custom files.", "error");
                                  return;
                                }
                                
                                const formData = new FormData();
                                formData.append("file", file);
                                
                                try {
                                  showBanner("Starting custom dedicated server ZIP upload...", "info");
                                  const res = await fetch("/api/versions/upload", {
                                    method: "POST",
                                    headers: {
                                      Authorization: `Bearer ${token}`
                                    },
                                    body: formData
                                  });
                                  
                                  if (res.ok) {
                                    const data = await res.json();
                                    showBanner(`Custom upload deploy started (Task: ${data.taskId})!`, "success");
                                    fetchDataFeed();
                                  } else {
                                    const d = await res.json();
                                    showBanner(d.error || "Custom server ZIP upload failed.", "error");
                                  }
                                } catch (err) {
                                  showBanner("Connection loss during custom server ZIP upload.", "error");
                                }
                              }}
                            />
                          </label>
                          <span className="text-[9px] text-zinc-650 font-mono italic">Accepts Bedrock Dedicated Server ZIP package</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Available Real-Time Releases</h3>
                        <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                          Auto-Fetched Live
                        </span>
                      </div>

                      {versions.length === 0 ? (
                        <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-5 text-center text-[10px] text-zinc-500 font-sans">
                          Loading latest direct download packages from Minecraft...
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {versions.map((ver, idx) => {
                            const isStable = ver.releaseDate.toLowerCase().includes("stable");
                            return (
                              <div key={idx} className="bg-zinc-950/40 border border-zinc-900 p-3.5 rounded-xl flex items-center justify-between hover:border-zinc-805 transition-colors">
                                <div className="min-w-0 pr-4">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-xs font-black text-white tracking-wide font-mono">{ver.version}</h4>
                                    <span className={`text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded uppercase ${
                                      isStable 
                                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                                        : "bg-purple-500/10 border border-purple-500/20 text-purple-400"
                                    }`}>
                                      {isStable ? "Stable Live" : "Preview Beta"}
                                    </span>
                                  </div>
                                  <span className="text-[9px] text-zinc-500 block mt-1 truncate max-w-[200px] sm:max-w-xs font-mono" title={ver.downloadUrl}>
                                    {ver.releaseDate}
                                  </span>
                                </div>
                                {isAdmin ? (
                                  <button
                                    onClick={() => installBedrockVersion(ver.version, ver.downloadUrl)}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer select-none border whitespace-nowrap active:scale-[0.98] ${
                                      isStable
                                        ? "bg-emerald-600 hover:bg-emerald-500 border-emerald-550 text-white"
                                        : "bg-purple-600 hover:bg-purple-500 border-purple-550 text-white"
                                    }`}
                                  >
                                    Deploy {isStable ? "Stable" : "Beta"}
                                  </button>
                                ) : (
                                  <Lock className="w-3.5 h-3.5 text-zinc-700 flex-shrink-0" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Dynamic Link Downloader */}
                      {isAdmin && (
                        <div className="pt-4 border-t border-zinc-900/60 space-y-3">
                          <div className="flex items-center gap-1.5">
                            <Link className="w-3.5 h-3.5 text-indigo-400" />
                            <h4 className="text-[10px] font-black text-white uppercase tracking-wider">Direct Minecraft URL Installer</h4>
                          </div>
                          <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">
                            Paste any direct zip download link from <a href="https://www.minecraft.net/en-us/download/server/bedrock" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">Mojang's official site</a> to download and deploy any build instantly.
                          </p>

                          <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-1">
                              <label className="text-[8px] text-zinc-500 font-black uppercase tracking-wider block mb-1">Target Version</label>
                              <input
                                type="text"
                                placeholder="e.g. 1.21.72.01"
                                value={customDeployVersion}
                                onChange={(e) => setCustomDeployVersion(e.target.value)}
                                className="w-full px-2.5 py-2 bg-zinc-950 border border-zinc-900 rounded-lg text-xs text-white placeholder-zinc-750 font-mono outline-none focus:border-indigo-500 transition-colors"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-[8px] text-zinc-500 font-black uppercase tracking-wider block mb-1">Direct ZIP URL</label>
                              <input
                                type="text"
                                placeholder="https://minecraft.azureedge.net/bin/..."
                                value={customDeployUrl}
                                onChange={(e) => setCustomDeployUrl(e.target.value)}
                                className="w-full px-2.5 py-2 bg-zinc-950 border border-zinc-900 rounded-lg text-xs text-white placeholder-zinc-750 font-mono outline-none focus:border-indigo-500 transition-colors"
                              />
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              if (!customDeployUrl.trim()) {
                                showBanner("Please enter a valid direct ZIP download URL.", "error");
                                return;
                              }
                              let urlToUse = customDeployUrl.trim();
                              let detectedVersion = customDeployVersion.trim();
                              
                              if (!detectedVersion) {
                                // Try parsing version from url
                                const match = urlToUse.match(/bedrock-server-([0-9.]+)\.zip/i);
                                detectedVersion = match ? match[1] : "Custom";
                              }

                              installBedrockVersion(detectedVersion, urlToUse);
                            }}
                            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 border border-indigo-550 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-white transition-colors cursor-pointer select-none flex items-center justify-center gap-2"
                          >
                            <CloudDownload className="w-3.5 h-3.5" />
                            <span>Deploy Custom Direct Link</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {propertiesTab === "files" && (
                /* RAW INTEGRATED DIRECT CONFIGS FILE EDITOR */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left panel: File navigation */}
                  <div className="lg:col-span-1 bg-zinc-900/30 border border-zinc-900 rounded-2xl p-5 space-y-4 h-[520px] overflow-y-auto">
                    <div className="flex items-center gap-2 pb-3 border-b border-zinc-900/55">
                      <FolderOpen className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-black uppercase text-white tracking-widest">Main Server Folder</h4>
                    </div>

                    {/* Navigation tree selector */}
                    <div className="space-y-3 font-mono text-[11px] text-zinc-400">
                      <div className="pl-2 border-l border-zinc-850 space-y-1">
                        <button
                          type="button"
                          onClick={() => setSelectedFileId("properties")}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left cursor-pointer ${
                            selectedFileId === "properties"
                              ? "bg-zinc-850 border border-zinc-750 text-white font-bold"
                              : "hover:bg-zinc-950/40 border border-transparent hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                            <span>server.properties</span>
                          </div>
                          <span className="text-[8px] bg-zinc-950/50 px-1.5 py-0.5 rounded text-zinc-500 font-sans tracking-tight">properties</span>
                        </button>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-zinc-500 pl-1">
                          <FolderOpen className="w-3 h-3 text-emerald-500/70" />
                          <span className="font-bold">config</span>
                        </div>
                        
                        <div className="pl-4 border-l border-zinc-850 space-y-1">
                          <div className="flex items-center gap-2 text-zinc-500">
                            <FolderOpen className="w-3 h-3 text-emerald-600/70" />
                            <span className="font-semibold">default</span>
                          </div>

                          <div className="pl-4 border-l border-zinc-850">
                            <button
                              type="button"
                              onClick={() => setSelectedFileId("permissions")}
                              className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left cursor-pointer ${
                                selectedFileId === "permissions"
                                  ? "bg-zinc-850 border border-zinc-750 text-white font-bold"
                                  : "hover:bg-zinc-950/40 border border-transparent hover:text-white"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <FileCode className="w-3.5 h-3.5 text-amber-500" />
                                <span>permissions.json</span>
                              </div>
                              <span className="text-[8px] bg-zinc-950/50 px-1.5 py-0.5 rounded text-zinc-500 font-sans tracking-tight">json</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Meta info boxes */}
                    <div className="p-3.5 bg-zinc-950/50 rounded-xl border border-zinc-900 space-y-2 text-[10px] text-zinc-500 leading-relaxed font-sans font-normal">
                      <div className="flex items-center gap-1 text-zinc-300 font-bold">
                        <Activity className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Interactive File Mounting</span>
                      </div>
                      {selectedFileId === "permissions" ? (
                        <p>
                          The <code className="text-zinc-300">permissions.json</code> dictates backend execution rights. You can map console commands cleanly to different permission rings (<code className="text-zinc-400">"operator"</code>, <code className="text-zinc-400 font-bold">"member"</code>, and <code className="text-zinc-400">"visitor"</code>).
                        </p>
                      ) : (
                        <p>
                          Customize or add ANY config settings in <code className="text-zinc-300">server.properties</code> directly! The applet safely merges custom properties so your definitions are never overridden.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right panel: Active Editor screen */}
                  <div className="lg:col-span-2 bg-zinc-900/30 border border-zinc-900 rounded-2xl p-5 flex flex-col h-[520px]">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
                      <div>
                        <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2">
                          <FileCode className="w-4 h-4 text-emerald-400" />
                          <span>Editing: {selectedFileId === "permissions" ? "config/default/permissions.json" : "server.properties"}</span>
                        </h3>
                        <p className="text-[10px] text-zinc-500 mt-1">
                          Direct physical path: <code className="text-zinc-400 font-mono text-[9px]">bedrock-server/{selectedFileId === "permissions" ? "config/default/permissions.json" : "server.properties"}</code>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => loadConfigFile(selectedFileId)}
                          disabled={fileEditorLoading}
                          className="p-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                          title="Reload from Server"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${fileEditorLoading ? "animate-spin" : ""}`} />
                        </button>
                        <button
                          type="button"
                          onClick={saveConfigFile}
                          disabled={fileEditorLoading || !isAdmin}
                          className="px-4 py-2 bg-emerald-650 hover:bg-emerald-500 text-white font-heavy text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10 active:scale-95 disabled:opacity-40"
                        >
                          <Settings className="w-3.5 h-3.5 animate-pulse" />
                          <span>Save Changes</span>
                        </button>
                      </div>
                    </div>

                    {/* Text Area Element */}
                    <div className="flex-1 mt-4 relative bg-zinc-950 rounded-xl overflow-hidden border border-zinc-900 shadow-inner flex flex-col">
                      {fileEditorLoading && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
                          <span className="text-[10px] text-zinc-500 tracking-wider uppercase font-black">Reading raw file contents...</span>
                        </div>
                      )}
                      <textarea
                        disabled={!isAdmin || fileEditorLoading}
                        value={fileEditorContent}
                        onChange={(e) => setFileEditorContent(e.target.value)}
                        className="flex-1 resize-none p-4 font-mono text-[11px] leading-relaxed text-emerald-300 bg-transparent outline-none border-none select-text focus:ring-0 disabled:opacity-60 disabled:cursor-not-allowed selection:bg-emerald-500/20 selection:text-emerald-200 h-full w-full"
                        spellCheck={false}
                        placeholder={selectedFileId === "permissions" ? "Loading permissions.json schema contents..." : "Loading server.properties config settings..."}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
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

      {/* Real-time Floating Active tasks progress overlay panel */}
      {(() => {
        const runningTasks = activeTasks.filter(t => t.status === "running" || t.status === "pending" || t.status === "starting" || t.status === "downloading");
        if (runningTasks.length === 0) return null;

        if (!tasksWidgetExpanded) {
          return (
            <div 
              onClick={() => setTasksWidgetExpanded(true)}
              className="fixed bottom-6 right-6 z-[9999] px-5 py-3 rounded-2xl bg-emerald-600 border border-emerald-500 text-white font-bold text-xs flex items-center gap-3 shadow-2xl shadow-emerald-950/50 cursor-pointer hover:bg-emerald-500 transition-all hover:scale-105 active:scale-95 animate-fade-in"
            >
              <div className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>{runningTasks.length} Active Task{runningTasks.length > 1 ? "s" : ""} in Progress... ({runningTasks[0]?.progress || 0}%)</span>
            </div>
          );
        }

        return (
          <div className="fixed bottom-6 right-6 z-[9999] w-96 max-w-[calc(100vw-3rem)] rounded-2xl bg-zinc-950/95 border border-emerald-500/30 shadow-2xl shadow-emerald-950/20 backdrop-blur-md text-white select-none animate-fade-in flex flex-col overflow-hidden">
            <div className="px-5 py-4 bg-zinc-900 border-b border-zinc-850 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-200">Server Tasks Progress</h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTasksWidgetExpanded(false)}
                  className="p-1 text-zinc-500 hover:text-zinc-300 rounded hover:bg-zinc-850 transition-all text-[10px] uppercase font-bold cursor-pointer"
                  title="Minimize"
                >
                  Minimize
                </button>
              </div>
            </div>

            <div className="p-5 max-h-80 overflow-y-auto space-y-4">
              {runningTasks.map((t, idx) => (
                <div key={t.id || idx} className="space-y-2.5">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-bold text-white truncate">{t.name}</h5>
                      <span className="text-[10px] text-zinc-500 truncate block mt-0.5">{t.description}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">{t.progress || 0}%</span>
                  </div>

                  <div className="w-full bg-zinc-900 border border-zinc-850/50 h-2 rounded-full overflow-hidden relative">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${t.progress || 0}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-zinc-400 italic font-medium truncate max-w-[80%]">{t.message || "Working..."}</span>
                    <span className="text-[9px] uppercase tracking-wider text-amber-400 font-extrabold animate-pulse">{t.status}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 bg-zinc-900/40 border-t border-zinc-900/60 text-[10px] text-zinc-500 flex justify-between items-center">
              <span>Auto-updates in real-time</span>
              <button 
                type="button"
                onClick={() => {
                  setNavTab("settings");
                  setSettingsSubTab("tasks_history");
                }}
                className="text-emerald-500 hover:text-emerald-400 font-bold cursor-pointer"
              >
                View History
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
