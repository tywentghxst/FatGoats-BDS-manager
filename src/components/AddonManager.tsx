import React, { useState, useRef } from "react";
import {
  Layers,
  Grid,
  ListOrdered,
  UploadCloud,
  AlertTriangle,
  CheckCircle,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Search,
  X,
  Trash2,
  ExternalLink,
  Edit,
  Sparkles,
  Cpu,
} from "lucide-react";
import { AddonMetadata } from "../types";

interface AddonManagerProps {
  addons: AddonMetadata[];
  isAdmin: boolean;
  token: string | null;
  addonSortBy: "name" | "date" | "enabled" | "disabled";
  setAddonSortBy: (sortBy: "name" | "date" | "enabled" | "disabled") => void;
  addonViewMode: "grid" | "order" | "diagnostic";
  setAddonViewMode: (mode: "grid" | "order" | "diagnostic") => void;
  addonSearch: string;
  setAddonSearch: (search: string) => void;
  localBehaviorOrder: AddonMetadata[];
  setLocalBehaviorOrder: React.Dispatch<React.SetStateAction<AddonMetadata[]>>;
  localResourceOrder: AddonMetadata[];
  setLocalResourceOrder: React.Dispatch<React.SetStateAction<AddonMetadata[]>>;
  isSavingLoadOrder: boolean;
  uploadError: string;
  isUploading: boolean;
  uploadProgress: number;
  uploadingFilesNames: string[];
  handleUploadFileListDirect: (files: FileList | null, isWorld?: boolean) => Promise<void>;
  handleSaveAddonLoadOrder: (loadOrderUuids: string[]) => Promise<void>;
  handleEnableAllAddons: () => Promise<void>;
  handleDisableAllAddons: () => Promise<void>;
  handleDeleteAllAddons: () => Promise<void>;
  toggleAddonEnabled: (uuid: string, currentStatus: boolean) => Promise<void>;
  openEditAddon: (addon: AddonMetadata) => void;
  deleteAddon: (uuid: string) => Promise<void>;
  setUpdatingAddonUuid: (uuid: string | null) => void;
  updateAddonFileInputRef: React.RefObject<HTMLInputElement | null>;
  addonFileInputRef: React.RefObject<HTMLInputElement | null>;
  showBanner: (msg: string, type: "success" | "error" | "info") => void;

  // reordering drag parameters
  draggedBehaviorIdx: number | null;
  setDraggedBehaviorIdx: (idx: number | null) => void;
  draggedResourceIdx: number | null;
  setDraggedResourceIdx: (idx: number | null) => void;
  handleReorderBehaviorPacks: (targetIdx: number) => void;
  handleReorderResourcePacks: (targetIdx: number) => void;
}

export default function AddonManager({
  addons,
  isAdmin,
  token,
  addonSortBy,
  setAddonSortBy,
  addonViewMode,
  setAddonViewMode,
  addonSearch,
  setAddonSearch,
  localBehaviorOrder,
  setLocalBehaviorOrder,
  localResourceOrder,
  setLocalResourceOrder,
  isSavingLoadOrder,
  uploadError,
  isUploading,
  uploadProgress,
  uploadingFilesNames,
  handleUploadFileListDirect,
  handleSaveAddonLoadOrder,
  handleEnableAllAddons,
  handleDisableAllAddons,
  handleDeleteAllAddons,
  toggleAddonEnabled,
  openEditAddon,
  deleteAddon,
  setUpdatingAddonUuid,
  updateAddonFileInputRef,
  addonFileInputRef,
  showBanner,

  draggedBehaviorIdx,
  setDraggedBehaviorIdx,
  draggedResourceIdx,
  setDraggedResourceIdx,
  handleReorderBehaviorPacks,
  handleReorderResourcePacks,
}: AddonManagerProps) {
  const [isDraggingOverDropzone, setIsDraggingOverDropzone] = useState(false);
  const dragCounter = useRef(0);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Support custom Gemini API key on the fly
  const [customGeminiKey, setCustomGeminiKey] = useState(() => {
    return localStorage.getItem("custom_gemini_api_key") || "";
  });
  const [showKeyInput, setShowKeyInput] = useState(false);

  const saveCustomKey = (key: string) => {
    const trimmed = key.trim();
    setCustomGeminiKey(trimmed);
    if (trimmed) {
      localStorage.setItem("custom_gemini_api_key", trimmed);
    } else {
      localStorage.removeItem("custom_gemini_api_key");
    }
    setDiagnosticData(null); // Force re-scan with the new key
  };

  // State managers and handlers for AI addon diagnostics
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const [isLoadingDiagnostic, setIsLoadingDiagnostic] = useState(false);
  const [diagnosticError, setDiagnosticError] = useState<string | null>(null);
  const [isFixingDiagnosticId, setIsFixingDiagnosticId] = useState<string | null>(null);
  const [diagnosticMessage, setDiagnosticMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  const runDiagnosticScan = async () => {
    setIsLoadingDiagnostic(true);
    setDiagnosticError(null);
    setDiagnosticMessage(null);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : ""
      };
      if (customGeminiKey && customGeminiKey.trim() !== "") {
        headers["X-Gemini-Key"] = customGeminiKey.trim();
      }

      const response = await fetch("/api/addons/analyze", {
        method: "POST",
        headers
      });
      if (!response.ok) {
        throw new Error("Unable to analyze addon pack status. Please verify server connection.");
      }
      const data = await response.json();
      setDiagnosticData(data);
    } catch (e: any) {
      setDiagnosticError(e.message || "An unexpected error occurred during analysis.");
    } finally {
      setIsLoadingDiagnostic(false);
    }
  };

  const applyAutoFix = async (action: any, findingId: string) => {
    setIsFixingDiagnosticId(findingId);
    setDiagnosticMessage(null);
    try {
      const response = await fetch("/api/addons/apply-fix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({ action })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "An error occurred while executing the automatic fix.");
      }
      setDiagnosticMessage({ text: "Diagnostic auto-fix executed successfully!", type: "success" });
      setDiagnosticData(null); // Triggers automatically checking again
    } catch (e: any) {
      setDiagnosticMessage({ text: e.message || "Failed to execute auto-fix.", type: "error" });
    } finally {
      setIsFixingDiagnosticId(null);
    }
  };

  React.useEffect(() => {
    if (addonViewMode === "diagnostic" && !diagnosticData && !isLoadingDiagnostic) {
      runDiagnosticScan();
    }
  }, [addonViewMode, diagnosticData]);

  // Stats Counters
  const totalCount = addons.length;
  const activeCount = addons.filter((a) => a.isEnabled).length;
  const disabledCount = totalCount - activeCount;
  const behaviorCount = addons.filter((a) => a.type === "behavior").length;
  const resourceCount = addons.filter((a) => a.type === "resource" || a.type === "world").length;

  // Drag and Drop files handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAdmin) return;
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingOverDropzone(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAdmin) return;
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDraggingOverDropzone(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAdmin) return;
    setIsDraggingOverDropzone(false);
    dragCounter.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // Validate file format
      const validFiles = Array.from(files).filter(
        (f) => {
          const fileObj = f as File;
          return fileObj.name.endsWith(".mcpack") || fileObj.name.endsWith(".mcaddon");
        }
      );
      if (validFiles.length === 0) {
        showBanner("Invalid file type. Only .mcpack and .mcaddon are supported.", "error");
        return;
      }
      await handleUploadFileListDirect(files, false);
    }
  };

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

  // Search filtering
  const searchFilteredAddons = addonSearch.trim()
    ? sortedAddons.filter(
        (addon) =>
          addon.name.toLowerCase().includes(addonSearch.toLowerCase()) ||
          (addon.description && addon.description.toLowerCase().includes(addonSearch.toLowerCase())) ||
          (addon.originalName && addon.originalName.toLowerCase().includes(addonSearch.toLowerCase()))
      )
    : sortedAddons;

  // Status filtering based on active vs inactive
  const statusFilteredAddons = statusFilter === "all"
    ? searchFilteredAddons
    : statusFilter === "active"
    ? searchFilteredAddons.filter((a) => a.isEnabled)
    : searchFilteredAddons.filter((a) => !a.isEnabled);

  const activeBehaviorPacks = statusFilteredAddons.filter((a) => a.type === "behavior" && a.isEnabled);
  const activeResourcePacks = statusFilteredAddons.filter(
    (a) => (a.type === "resource" || a.type === "world") && a.isEnabled
  );
  const disabledBehaviorPacks = statusFilteredAddons.filter((a) => a.type === "behavior" && !a.isEnabled);
  const disabledResourcePacks = statusFilteredAddons.filter(
    (a) => (a.type === "resource" || a.type === "world") && !a.isEnabled
  );

  const renderAddonCard = (addon: AddonMetadata) => {
    const isGrouped = addons.some(
      (a) =>
        a.uuid !== addon.uuid &&
        ((addon.groupId && a.groupId === addon.groupId) ||
          (addon.originalName && a.originalName === addon.originalName && addon.originalName !== ""))
    );

    return (
      <div
        key={addon.uuid}
        className={`glass-panel border-y border-r border-l-4 rounded-2xl p-5 flex flex-col justify-between shadow-lg transition-all duration-300 hover:scale-[1.015] hover:shadow-xl select-none ${
          addon.isEnabled
            ? "border-emerald-500/30 border-l-emerald-500 bg-gradient-to-br from-emerald-950/15 via-[#0e1622]/90 to-[#0e1622] shadow-[0_4px_20px_rgba(16,185,129,0.06)] animate-fade-in"
            : "border-zinc-800/60 border-l-zinc-750 bg-[#0e1622]/20 hover:border-zinc-700/80 hover:border-l-zinc-600 opacity-70 hover:opacity-100"
        }`}
      >
        <div>
          <div className="flex gap-4 items-start">
            {/* Custom Multi-layered Icon Container */}
            <div className={`relative w-14 h-14 rounded-xl p-0.5 border flex-shrink-0 overflow-hidden flex items-center justify-center transition-all ${
              addon.isEnabled
                ? "bg-emerald-950/45 border-emerald-500/30 ring-2 ring-emerald-500/10"
                : "bg-zinc-950/80 border-zinc-900 grayscale opacity-65"
            }`}>
              {addon.icon ? (
                <img
                  src={addon.icon}
                  alt={addon.name}
                  className="w-full h-full object-cover rounded-lg"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Layers className={`w-6 h-6 ${addon.isEnabled ? "text-emerald-400" : "text-zinc-650"}`} />
              )}
              {/* Little Status Indicator on Top Right */}
              <span
                className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-zinc-950 ${
                  addon.isEnabled ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"
                }`}
              />
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-white truncate tracking-wide flex items-center gap-1.5" title={addon.name}>
                <span className="truncate">{addon.name}</span>
                {addon.isEnabled && (
                  <span className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-450 animate-ping inline-block" />
                )}
              </h4>
              <div className="flex flex-wrap gap-1 mt-1.5">
                <span
                  className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md ${
                    addon.type === "behavior"
                      ? "bg-purple-500/15 text-purple-400"
                      : "bg-cyan-500/15 text-cyan-400"
                  }`}
                >
                  {addon.type === "behavior" ? "Behavior BP" : "Resource RP"}
                </span>
                {isGrouped && (
                  <span
                    className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/10"
                    title="Toggles are synchronized with matching behavior/resource dual packs"
                  >
                    Grouped Dual-Pack
                  </span>
                )}
              </div>
              <p className="text-[10px] text-zinc-500 font-mono mt-1.5">Version: {addon.version.join(".")}</p>
            </div>
          </div>

          {addon.originalName && addon.originalName !== addon.name && (
            <div
              className={`mt-3 px-2.5 py-1.5 border rounded-lg font-mono text-[9px] truncate flex items-center gap-1.5 transition-colors ${
                addon.isEnabled
                  ? "bg-zinc-950/60 border-emerald-500/10 text-emerald-400"
                  : "bg-zinc-950/40 border-zinc-900/40 text-zinc-500"
              }`}
              title="Uploaded filename source"
            >
              <span className="text-zinc-600 font-bold uppercase text-[8px] flex-shrink-0">Source:</span>
              <span className="truncate font-mono">{addon.originalName}</span>
            </div>
          )}

          <p className={`text-xs mt-4 leading-relaxed line-clamp-3 h-12 font-sans overflow-hidden transition-colors ${
            addon.isEnabled ? "text-zinc-300" : "text-zinc-500"
          }`}>
            {addon.description || "No description provided for this addon bundle."}
          </p>
        </div>

        <div className="flex justify-between items-center mt-5 pt-4 border-t border-zinc-850/60 select-none gap-2">
          {/* Status Indicator Bar */}
          <div className="flex gap-2 items-center flex-wrap">
            {addon.isEnabled ? (
              <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 uppercase tracking-widest leading-none flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Active
              </span>
            ) : (
              <span className="text-[9px] font-black text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded-md border border-zinc-900 uppercase tracking-widest leading-none flex items-center gap-1 opacity-70">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                Inactive
              </span>
            )}

            {addon.downloadUrl && (
              <a
                href={addon.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-500 hover:text-emerald-400 hover:scale-105 transition-all p-1.5 flex items-center gap-1 font-mono text-[9px] font-bold tracking-wider border border-emerald-500/15 rounded-md bg-emerald-950/25"
                title="Go to Pack Download Link"
              >
                <ExternalLink className="w-3 h-3" />
                <span>DOWNLOAD LINK</span>
              </a>
            )}
          </div>

          {isAdmin && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => toggleAddonEnabled(addon.uuid, addon.isEnabled)}
                className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-wider border cursor-pointer select-none transition-all ${
                  addon.isEnabled
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                }`}
              >
                {addon.isEnabled ? "Disable" : "Enable"}
              </button>

              <button
                onClick={() => openEditAddon(addon)}
                className="p-1.5 border border-zinc-800 hover:border-zinc-700 text-zinc-404 hover:text-white rounded-lg cursor-pointer bg-zinc-950/40 hover:bg-zinc-950/80 transition-all"
                title="Edit addon properties"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  setUpdatingAddonUuid(addon.uuid);
                  setTimeout(() => updateAddonFileInputRef.current?.click(), 10);
                }}
                className="p-1.5 border border-zinc-850 hover:border-zinc-750 text-zinc-400 hover:text-blue-405 rounded-lg cursor-pointer bg-zinc-950/40 hover:bg-zinc-950/80 transition-all"
                title="Update/Override pack with updated file"
              >
                <UploadCloud className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => deleteAddon(addon.uuid)}
                className="p-1.5 border border-zinc-850 hover:border-red-950 text-zinc-500 hover:text-red-400 rounded-lg cursor-pointer bg-zinc-950/40 hover:bg-zinc-950/80 transition-all"
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
    <div className="space-y-6 select-none animate-fade-in">
      {/* 1. Header Overview Bento Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Title Content */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden border border-zinc-800/80">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-550/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-550/5 blur-3xl rounded-full -ml-16 -mb-16 pointer-events-none" />

          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Layers className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">Addons & Pack Engine</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Configure bedrock addons, behavioral modules, and resource skin libraries.</p>
              </div>
            </div>

            <p className="text-xs text-zinc-500 mt-4 leading-relaxed max-w-xl">
              {addonViewMode === "grid"
                ? "BDS Core parses behavior and resource folders asynchronously. Addons are extracted, decompressed, and dynamic properties are recorded instantly into index structures."
                : " Bedrock loads active packs matching the precedence order below. Arrange sequence dependency priorities safely."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-6 relative z-10">
            <span className="text-[10px] font-mono text-zinc-550 uppercase font-black mr-1">View Mode:</span>
            <div className="flex bg-zinc-950 p-1 border border-zinc-805 rounded-xl shadow-inner shadow-black/80 flex-wrap">
              <button
                onClick={() => setAddonViewMode("grid")}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  addonViewMode === "grid"
                    ? "bg-emerald-600 text-white shadow-xl shadow-emerald-950/20"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                Manage Packs
              </button>
              <button
                onClick={() => setAddonViewMode("order")}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  addonViewMode === "order"
                    ? "bg-emerald-600 text-white shadow-xl shadow-emerald-950/20"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5" />
                Load Priorities
              </button>
              <button
                onClick={() => setAddonViewMode("diagnostic")}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  addonViewMode === "diagnostic"
                    ? "bg-purple-650 text-white shadow-xl shadow-purple-950/20"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                AI Diagnostics
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Metric Grid Indicators */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          <div className="glass-panel rounded-2xl p-5 border border-zinc-800/80 flex flex-col justify-between">
            <div className="text-zinc-500 text-[10px] uppercase font-black tracking-widest font-mono">Installed Addons</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">{totalCount}</span>
              <span className="text-xs text-zinc-500 font-mono">packs</span>
            </div>
            <div className="mt-3 flex gap-4 text-[10px] text-zinc-400 border-t border-zinc-800/40 pt-2.5">
              <span className="flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                {behaviorCount} BP
              </span>
              <span className="flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                {resourceCount} RP
              </span>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-zinc-800/80 flex flex-col justify-between bg-gradient-to-b from-[#0e1622]/50 to-transparent">
            <div>
              <div className="text-zinc-500 text-[10px] uppercase font-black tracking-widest font-mono">Pack Status Engine</div>
              <div className="mt-2 flex items-baseline justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-emerald-400">{activeCount}</span>
                  <span className="text-[10px] uppercase text-emerald-500 font-mono font-bold">Active</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-zinc-400">{disabledCount}</span>
                  <span className="text-[10px] uppercase text-zinc-500 font-mono font-bold ml-1">Disabled</span>
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-2 w-full bg-zinc-950/80 rounded-full overflow-hidden border border-zinc-900 flex">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                  style={{ width: `${totalCount > 0 ? (activeCount / totalCount) * 100 : 0}%` }}
                />
                <div
                  className="h-full bg-zinc-805 transition-all duration-500"
                  style={{ width: `${totalCount > 0 ? (disabledCount / totalCount) * 100 : 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-zinc-500 font-mono font-bold">
                <span className="flex items-center gap-1 text-emerald-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0}% active
                </span>
                <span className="flex items-center gap-1 text-zinc-550">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                  {totalCount > 0 ? Math.round((disabledCount / totalCount) * 100) : 0}% inactive
                </span>
              </div>
            </div>
          </div>

          {/* Import / System Information Box */}
          <div className="col-span-2 glass-panel rounded-2xl p-4 border border-zinc-800/80 flex items-center justify-between text-xs text-zinc-450 gap-4">
            <div className="flex gap-2.5 items-center">
              <span className="text-[10px] uppercase font-bold text-emerald-400 leading-none bg-emerald-500/15 border border-emerald-500/10 px-2 py-1 rounded select-none">
                VDS BDS
              </span>
              <span className="leading-relaxed font-sans text-zinc-400">
                Supports Bedrock <strong className="text-zinc-300">.mcpack</strong> & <strong className="text-zinc-300">.mcaddon</strong> folders.
              </span>
            </div>
            {!isAdmin ? (
              <span className="text-[10px] uppercase font-black tracking-wider text-rose-400 px-2 py-1 bg-rose-500/5 rounded border border-rose-500/10 flex-shrink-0">
                Viewer View-Only
              </span>
            ) : (
              <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400 px-2 py-1 bg-emerald-500/5 rounded border border-emerald-500/10 flex-shrink-0">
                Admin Privilege
              </span>
            )}
          </div>
        </div>
      </div>

      {uploadError && addonViewMode === "grid" && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs flex gap-2.5 animate-fade-in items-center">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* 2. Drag & Drop File Upload Dropzone */}
      {isAdmin && addonViewMode === "grid" && (
        <div
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 select-none overflow-hidden ${
            isDraggingOverDropzone
              ? "border-emerald-500 bg-emerald-950/15 ring-4 ring-emerald-500/10 scale-[1.005]"
              : isUploading
              ? "border-zinc-800 bg-zinc-950/20 cursor-wait"
              : "border-zinc-800 bg-[#0e1622]/20 hover:border-zinc-700 hover:bg-[#0e1622]/40"
          }`}
        >
          {isDraggingOverDropzone && (
            <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-fade-in pointer-events-none">
              <UploadCloud className="w-12 h-12 text-emerald-400 animate-bounce mb-2" />
              <p className="text-sm font-extrabold text-[#f1f1f1] uppercase tracking-wider">Drop Mod Pack Here</p>
              <p className="text-[11px] text-zinc-400 mt-1">BDS System will begin decompiling bundle immediately.</p>
            </div>
          )}

          <div className="flex flex-col items-center justify-center space-y-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isUploading ? "bg-emerald-500/10 text-emerald-400 animate-pulse" : "bg-zinc-950/80 text-zinc-500"
            }`}>
              {isUploading ? (
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <UploadCloud className="w-6 h-6 text-zinc-400" />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-zinc-200">
                {isUploading ? "Transmitting Binary Files..." : "Importer Gateway Interface"}
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm">
                {isUploading
                  ? `Uploaded ${uploadProgress}% (${uploadingFilesNames.slice(0, 3).join(", ")}${uploadingFilesNames.length > 3 ? "..." : ""})`
                  : "Drag and drop behavior (.mcpack) or resource packages directly or check server disk."}
              </p>
            </div>

            {!isUploading && (
              <div className="flex justify-center items-center gap-3">
                <button
                  onClick={() => addonFileInputRef.current?.click()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-950/20"
                >
                  Import Files
                </button>
              </div>
            )}

            {isUploading && (
              <div className="w-full max-w-xs mt-2">
                <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {addonViewMode === "diagnostic" ? (
        // ------------------ AI DIAGNOSTICS VIEW ------------------
        <div className="space-y-6 animate-fade-in relative z-10 text-left">
          {/* Header Dashboard section */}
          <div className="glass-panel border border-zinc-800/60 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="text-left">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                <h3 className="text-sm font-black uppercase tracking-wider text-purple-400">Addon Intelligence Diagnostic Engine</h3>
              </div>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed text-left">
                Our AI-driven diagnostics automatically check your active and inactive behavior and resource packs for version mismatch, performance overhead, and overlapping file override conflicts.
              </p>
            </div>
            <button
              disabled={isLoadingDiagnostic}
              onClick={runDiagnosticScan}
              className="px-4 py-2 bg-purple-650 hover:bg-purple-600 disabled:bg-zinc-900 disabled:text-zinc-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-purple-950/20 flex items-center gap-2"
            >
              <Cpu className={`w-3.5 h-3.5 ${isLoadingDiagnostic ? "animate-spin text-purple-400" : ""}`} />
              {isLoadingDiagnostic ? "Analyzing..." : "Re-run Diagnostic Scan"}
            </button>
          </div>

          {/* Custom Gemini Key configuration section */}
          <div className="glass-panel border border-zinc-900/40 bg-zinc-950/30 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-2 text-left">
                <div className={`w-2.5 h-2.5 rounded-full ${customGeminiKey ? 'bg-emerald-500' : 'bg-zinc-650'}`} />
                <div>
                  <h4 className="text-xs font-black text-zinc-350 uppercase tracking-wider font-mono">
                    YOUR GEMINI API KEY: {customGeminiKey ? <span className="text-emerald-400">ACTIVE (CUSTOM OVERRIDE)</span> : <span className="text-zinc-500">SYSTEM DEFAULT ACTIVE</span>}
                  </h4>
                  <p className="text-[10px] text-zinc-500">
                    {customGeminiKey ? "Using your browser's private saved API key for addon diagnostics." : "Currently querying diagnostics via default server backend settings."}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setShowKeyInput(!showKeyInput)}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-[11px] font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Cpu className="w-3 h-3 text-purple-400" />
                {customGeminiKey ? "Edit / Remove Custom Key" : "Add Your Own Key"}
              </button>
            </div>

            {showKeyInput && (
              <div className="pt-3 border-t border-zinc-900 grid grid-cols-1 md:grid-cols-12 gap-3 items-end animate-fade-in">
                <div className="col-span-1 md:col-span-9 space-y-1.5 text-left">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider font-mono">Gemini AI API Key Input</label>
                  <input
                    type="password"
                    value={customGeminiKey}
                    onChange={(e) => saveCustomKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-purple-650 transition-colors"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Your key is saved <span className="font-bold">strictly in your local browser</span> and passed securely as a header during scans. To remove, clear this field.
                  </p>
                </div>
                <div className="col-span-1 md:col-span-3 flex gap-2">
                  <button
                    onClick={() => saveCustomKey("")}
                    disabled={!customGeminiKey}
                    className="w-full px-3 py-2 bg-rose-950/30 hover:bg-rose-950/50 disabled:bg-zinc-950/20 disabled:text-zinc-700 border border-rose-900/30 disabled:border-transparent text-rose-450 text-[11px] font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Clear Key
                  </button>
                  <button
                    onClick={() => setShowKeyInput(false)}
                    className="w-full px-3 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 text-[11px] font-bold border border-zinc-800 rounded-xl transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Inline Feedback Alerts */}
          {diagnosticMessage && (
            <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-bold leading-relaxed text-left ${
              diagnosticMessage.type === "success" 
                ? "bg-emerald-950/40 border-emerald-900/50 text-emerald-400" 
                : "bg-rose-950/40 border-rose-900/50 text-rose-400"
            }`}>
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{diagnosticMessage.text}</span>
            </div>
          )}

          {isLoadingDiagnostic ? (
            <div className="glass-panel border border-zinc-900 rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-t-2 border-purple-500 animate-spin" />
                <Sparkles className="w-5 h-5 text-purple-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-widest text-zinc-350">Scanning Minecraft Addon Filesystem</p>
                <p className="text-[11px] text-zinc-500">Querying manifest entries, checking cross-pack dependencies, and indexing override files...</p>
              </div>
            </div>
          ) : diagnosticError ? (
            <div className="glass-panel border border-rose-950/40 bg-zinc-950/20 rounded-2xl p-10 flex flex-col items-center justify-center text-center space-y-4">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-rose-400">Diagnostic Analysis Failed</p>
                <p className="text-[11px] text-zinc-500 max-w-md">{diagnosticError}</p>
              </div>
              <button
                onClick={runDiagnosticScan}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 text-xs font-bold rounded-xl border border-zinc-800 transition-all cursor-pointer"
              >
                Retry Scan
              </button>
            </div>
          ) : diagnosticData ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
              
              {/* Left Bento-Grid: Health Summary, Lag meter */}
              <div className="col-span-1 lg:col-span-5 space-y-6 text-left">
                
                {/* Health Rating Bento */}
                <div className="glass-panel border border-zinc-850 bg-[#070b12]/60 rounded-2xl p-5 space-y-4 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-black tracking-wider text-zinc-500 font-mono">System Rigidity:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      diagnosticData.overallRating === "Healthy"
                        ? "bg-emerald-900/35 text-emerald-400 border-emerald-900/40"
                        : diagnosticData.overallRating === "Warning"
                        ? "bg-amber-900/35 text-amber-400 border-amber-900/40"
                        : "bg-rose-900/35 text-rose-450 border-rose-900/40"
                    }`}>
                      {diagnosticData.overallRating}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <h4 className="text-xs font-black text-zinc-350 uppercase tracking-widest font-mono">Core Summary</h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-sans mt-1 text-left">
                      {diagnosticData.summary}
                    </p>
                  </div>

                  {diagnosticData.aiMissing && (
                    <div className="p-3 bg-purple-950/30 border border-purple-900/30 rounded-xl space-y-1 text-left">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider font-mono">Configure Gemini Intelligence</span>
                      </div>
                      <p className="text-[9.5px] text-zinc-500 leading-normal text-left">
                        To activate deep generative AI diagnostics on the fly, paste your personal Gemini API Key in the "Add Your Own Key" section above or configure a <code className="text-purple-300 font-mono text-[9px]">GEMINI_API_KEY</code> in project settings. Currently running in offline checks mode.
                      </p>
                    </div>
                  )}
                </div>

                {/* Lag Suspect & Performance Meter */}
                <div className="glass-panel border border-zinc-850 bg-[#070b12]/60 rounded-2xl p-5 space-y-4 text-left">
                  <div className="flex justify-between items-start">
                    <div className="text-left">
                      <span className="text-[10px] uppercase font-black tracking-wider text-zinc-500 font-mono">Performance Impact:</span>
                      <h4 className="text-xs font-black text-zinc-350 uppercase tracking-widest font-mono mt-1">Lag Suspect Meter</h4>
                    </div>
                    <div className="text-right">
                      <span className={`text-2xl font-black font-mono tracking-tight ${
                        diagnosticData.lagPotentialScore < 35 
                          ? "text-emerald-400" 
                          : diagnosticData.lagPotentialScore < 70 
                          ? "text-amber-405" 
                          : "text-rose-450"
                      }`}>
                        {diagnosticData.lagPotentialScore}%
                      </span>
                    </div>
                  </div>

                  {/* Meter Bar */}
                  <div className="h-2 w-full bg-zinc-950 rounded-full border border-zinc-900 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-550 ${
                        diagnosticData.lagPotentialScore < 35 
                          ? "bg-emerald-500 shadow-lg shadow-emerald-500/20" 
                          : diagnosticData.lagPotentialScore < 70 
                          ? "bg-amber-500 shadow-lg shadow-amber-500/20" 
                          : "bg-rose-550 shadow-lg shadow-rose-500/20"
                      }`}
                      style={{ width: `${diagnosticData.lagPotentialScore}%` }}
                    />
                  </div>

                  {/* Why contributors */}
                  {diagnosticData.lagContributors && diagnosticData.lagContributors.length > 0 && (
                    <div className="space-y-2 mt-4 pt-4 border-t border-zinc-900/60 text-left">
                      <span className="text-[9px] uppercase font-black tracking-wider text-zinc-500 font-mono block">Contributing Indicators:</span>
                      <ul className="space-y-1.5 text-left">
                        {diagnosticData.lagContributors.map((contrib: string, index: number) => (
                          <li key={index} className="flex items-start gap-1.5 text-[10.5px] text-zinc-400 leading-normal text-left">
                            <span className="text-purple-400 font-mono shrink-0">•</span>
                            <span className="text-left">{contrib}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

              </div>

              {/* Right List: Findings & Auto-Fixes */}
              <div className="col-span-1 lg:col-span-7 space-y-4 text-left">
                <span className="text-[10px] uppercase font-black tracking-wider text-zinc-500 font-mono block mb-2">Detailed Findings ({diagnosticData.findings.length})</span>
                
                {diagnosticData.findings.length === 0 ? (
                  <div className="glass-panel border border-zinc-850 rounded-2xl p-10 flex flex-col items-center justify-center text-center space-y-3">
                    <CheckCircle className="w-10 h-10 text-emerald-500/80" />
                    <p className="text-xs font-black uppercase text-zinc-300 tracking-wider">All Clear! No Addon Anomalies Found</p>
                    <p className="text-[11px] text-zinc-500 max-w-sm">
                      Your installed packs conform perfectly. All companions are active and there are zero index conflicts detected.
                    </p>
                  </div>
                ) : (
                  diagnosticData.findings.map((finding: any) => {
                    const isHigh = finding.severity === "high";
                    const isMedium = finding.severity === "medium" || finding.severity === "warning" || finding.severity === "medium";
                    
                    return (
                      <div 
                        key={finding.id} 
                        className={`p-4 rounded-2xl bg-zinc-950/45 border transition-all hover:bg-zinc-950/60 text-left ${
                          isHigh 
                            ? "border-rose-900/40 hover:border-rose-900/60" 
                            : isMedium 
                            ? "border-amber-900/40 hover:border-amber-900/60" 
                            : "border-zinc-800/45 hover:border-zinc-800/70"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-1 text-left">
                            <div className="flex flex-wrap items-center gap-2">
                              {finding.type === "conflict" && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
                              {finding.type === "dependencies" && <Layers className="w-4 h-4 text-purple-400 shrink-0" />}
                              {finding.type === "outdated" && <Cpu className="w-4 h-4 text-blue-400 shrink-0" />}
                              
                              <h4 className="text-xs font-bold text-zinc-200">{finding.title}</h4>
                            </div>
                            <p className="text-[9px] font-mono text-zinc-500">Addon focus: <span className="text-zinc-450 font-bold">{finding.addonName}</span></p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider shrink-0 ${
                            isHigh 
                              ? "bg-rose-950/60 text-rose-450 border border-rose-900/50" 
                              : isMedium 
                              ? "bg-amber-950/60 text-amber-450 border border-amber-900/50" 
                              : "bg-blue-950/60 text-blue-405 border border-blue-900/50"
                          }`}>
                            {finding.severity}
                          </span>
                        </div>

                        <p className="text-[11px] text-zinc-400 mt-2.5 leading-relaxed font-sans text-left">
                          {finding.description}
                        </p>

                        <div className="mt-3.5 pt-3.5 border-t border-zinc-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="space-y-0.5 text-left">
                            <span className="text-[9px] uppercase font-black tracking-wider text-purple-400 font-mono block">Recommended Fix:</span>
                            <p className="text-[10.5px] text-zinc-400 font-sans text-left">{finding.recommendedFix}</p>
                          </div>

                          {finding.autoFixable && finding.autoFixAction && isAdmin && (
                            <button
                              disabled={isFixingDiagnosticId !== null}
                              onClick={() => applyAutoFix(finding.autoFixAction, finding.id)}
                              className="px-3.5 py-2 shrink-0 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-900 disabled:text-zinc-650 text-white text-[10.5px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-emerald-950/10 border border-emerald-9d0/20"
                            >
                              {isFixingDiagnosticId === finding.id ? (
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
                              )}
                              Auto-Fix It
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          ) : (
            <div className="glass-panel border border-zinc-900 rounded-2xl p-10 flex flex-col items-center justify-center text-center space-y-4">
              <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
              <div className="space-y-1">
                <p className="text-xs font-black uppercase text-zinc-300 tracking-wider">Addon Intelligence Diagnostic</p>
                <p className="text-[11px] text-zinc-500 max-w-sm">Ready to execute a diagnostic scan on your folders. We'll analyze pack integrity instantly.</p>
              </div>
              <button
                onClick={runDiagnosticScan}
                className="px-4 py-2 bg-purple-650 hover:bg-purple-600 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-purple-950/20"
              >
                Start Diagnostic Scan
              </button>
            </div>
          )}
        </div>
      ) : addonViewMode === "order" ? (
        // ------------------ 3. LOAD SEQUENCE REORDERPRIORITIES VIEW ------------------
        <div className="space-y-6 animate-fade-in">
          <div className="glass-panel border border-zinc-800/60 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-emerald-400">Load Sequence Priorities Engine</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Minecraft Bedrock processes active plugins sequentially. Drag & drop items to settle dependencies priority, then save.
              </p>
            </div>
            {isAdmin && (
              <div className="flex gap-2 flex-shrink-0 w-full md:w-auto justify-end">
                <button
                  onClick={() => {
                    setLocalBehaviorOrder(addons.filter((a) => a.type === "behavior" && a.isEnabled));
                    setLocalResourceOrder(
                      addons.filter((a) => (a.type === "resource" || a.type === "world") && a.isEnabled)
                    );
                    showBanner("Reverted sequence settings to active database records.", "info");
                  }}
                  className="px-4 py-2 bg-[#0a101b] hover:bg-zinc-950 text-zinc-300 font-bold text-xs rounded-xl border border-zinc-800 transition-all cursor-pointer select-none uppercase tracking-wider font-mono"
                >
                  Reset Order
                </button>
                <button
                  onClick={() => {
                    const behaviorUuids = localBehaviorOrder.map((a) => a.uuid);
                    const resourceUuids = localResourceOrder.map((a) => a.uuid);
                    handleSaveAddonLoadOrder([...behaviorUuids, ...resourceUuids]);
                  }}
                  disabled={isSavingLoadOrder}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-550 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/20 transition-all cursor-pointer select-none uppercase tracking-wider flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {isSavingLoadOrder ? "Saving..." : "Save Priorities"}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Behavior Column Orderer */}
            <div className="glass-panel border border-zinc-850/70 rounded-2xl p-5 space-y-4 bg-gradient-to-b from-[#101724]/40 to-[#0e141f]/10">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-900/60">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
                  <h4 className="text-xs font-black uppercase text-purple-400 tracking-wider">
                    Active Behavior Packs ({localBehaviorOrder.length})
                  </h4>
                </div>
                <span className="text-[9px] text-[#aa55ff]/90 font-mono font-bold leading-none bg-purple-500/10 px-2.5 py-1 rounded select-none uppercase">
                  Top is Loaded First
                </span>
              </div>

              {localBehaviorOrder.length === 0 ? (
                <div className="p-12 text-center text-zinc-500 italic text-xs font-medium">
                  No active behavior packs found. Activate packs in the "Manage Packs" tab first.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {localBehaviorOrder.map((addon, index) => {
                    const isFirst = index === 0;
                    const isLast = index === localBehaviorOrder.length - 1;

                    const moveUp = () => {
                      if (isFirst) return;
                      const updated = [...localBehaviorOrder];
                      const temp = updated[index];
                      updated[index] = updated[index - 1];
                      updated[index - 1] = temp;
                      setLocalBehaviorOrder(updated);
                    };

                    const moveDown = () => {
                      if (isLast) return;
                      const updated = [...localBehaviorOrder];
                      const temp = updated[index];
                      updated[index] = updated[index + 1];
                      updated[index + 1] = temp;
                      setLocalBehaviorOrder(updated);
                    };

                    return (
                      <div
                        key={addon.uuid}
                        draggable={isAdmin}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", addon.uuid);
                          e.dataTransfer.effectAllowed = "move";
                          setDraggedBehaviorIdx(index);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                        }}
                        onDragEnter={() => {
                          handleReorderBehaviorPacks(index);
                        }}
                        onDragEnd={() => setDraggedBehaviorIdx(null)}
                        className={`flex items-center justify-between bg-zinc-950/30 hover:bg-zinc-950/60 border p-3 rounded-xl transition-all shadow-sm select-none ${
                          draggedBehaviorIdx === index
                            ? "border-purple-500 bg-purple-955/20 opacity-60 scale-[0.98]"
                            : "border-zinc-900 hover:border-zinc-805"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {isAdmin && (
                            <div className="text-zinc-550 hover:text-zinc-350 cursor-grab active:cursor-grabbing p-1 transition-colors flex-shrink-0">
                              <GripVertical className="w-4 h-4" />
                            </div>
                          )}
                          <div className="text-xs font-black font-mono text-purple-400 bg-purple-500/10 w-6 h-6 rounded flex items-center justify-center border border-purple-500/15 flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex-shrink-0 overflow-hidden flex items-center justify-center">
                            {addon.icon ? (
                              <img
                                src={addon.icon}
                                alt={addon.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <Layers className="w-4 h-4 text-zinc-650" />
                            )}
                          </div>
                          <div className="truncate pr-2">
                            <h5 className="text-xs font-bold text-white truncate" title={addon.name}>
                              {addon.name}
                            </h5>
                            <p className="text-[9px] text-zinc-500 truncate font-mono mt-0.5 animate-fade-in">
                              UUID: {addon.uuid.slice(0, 8)}... | Ver: {addon.version.join(".")}
                            </p>
                          </div>
                        </div>

                        {isAdmin && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              disabled={isFirst}
                              onClick={moveUp}
                              className="p-1.5 rounded-lg border border-zinc-850 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-900 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                              title="Move Up (Load Earlier)"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={isLast}
                              onClick={moveDown}
                              className="p-1.5 rounded-lg border border-zinc-850 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-900 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                              title="Move Down (Load Later)"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Resource Column Orderer */}
            <div className="glass-panel border border-zinc-850/70 rounded-2xl p-5 space-y-4 bg-gradient-to-b from-[#101724]/40 to-[#0e141f]/10">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-900/60">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                  <h4 className="text-xs font-black uppercase text-blue-400 tracking-wider">
                    Active Resource Packs ({localResourceOrder.length})
                  </h4>
                </div>
                <span className="text-[9px] text-[#55aaff]/90 font-mono font-bold leading-none bg-blue-500/10 px-2.5 py-1 rounded select-none uppercase">
                  Top is Loaded First
                </span>
              </div>

              {localResourceOrder.length === 0 ? (
                <div className="p-12 text-center text-zinc-500 italic text-xs font-medium">
                  No active resource packs found. Activate packs in the "Manage Packs" tab first.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {localResourceOrder.map((addon, index) => {
                    const isFirst = index === 0;
                    const isLast = index === localResourceOrder.length - 1;

                    const moveUp = () => {
                      if (isFirst) return;
                      const updated = [...localResourceOrder];
                      const temp = updated[index];
                      updated[index] = updated[index - 1];
                      updated[index - 1] = temp;
                      setLocalResourceOrder(updated);
                    };

                    const moveDown = () => {
                      if (isLast) return;
                      const updated = [...localResourceOrder];
                      const temp = updated[index];
                      updated[index] = updated[index + 1];
                      updated[index + 1] = temp;
                      setLocalResourceOrder(updated);
                    };

                    return (
                      <div
                        key={addon.uuid}
                        draggable={isAdmin}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", addon.uuid);
                          e.dataTransfer.effectAllowed = "move";
                          setDraggedResourceIdx(index);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                        }}
                        onDragEnter={() => {
                          handleReorderResourcePacks(index);
                        }}
                        onDragEnd={() => setDraggedResourceIdx(null)}
                        className={`flex items-center justify-between bg-zinc-950/30 hover:bg-zinc-950/60 border p-3 rounded-xl transition-all shadow-sm select-none ${
                          draggedResourceIdx === index
                            ? "border-blue-500 bg-blue-955/20 opacity-60 scale-[0.98]"
                            : "border-zinc-900 hover:border-zinc-805"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {isAdmin && (
                            <div className="text-zinc-550 hover:text-zinc-350 cursor-grab active:cursor-grabbing p-1 transition-colors flex-shrink-0">
                              <GripVertical className="w-4 h-4" />
                            </div>
                          )}
                          <div className="text-xs font-black font-mono text-cyan-400 bg-cyan-500/10 w-6 h-6 rounded flex items-center justify-center border border-cyan-500/15 flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex-shrink-0 overflow-hidden flex items-center justify-center">
                            {addon.icon ? (
                              <img
                                src={addon.icon}
                                alt={addon.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <Layers className="w-4 h-4 text-zinc-650" />
                            )}
                          </div>
                          <div className="truncate pr-2">
                            <h5 className="text-xs font-bold text-white truncate" title={addon.name}>
                              {addon.name}
                            </h5>
                            <p className="text-[9px] text-zinc-500 truncate font-mono mt-0.5 animate-fade-in">
                              UUID: {addon.uuid.slice(0, 8)}... | Ver: {addon.version.join(".")}
                            </p>
                          </div>
                        </div>

                        {isAdmin && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              disabled={isFirst}
                              onClick={moveUp}
                              className="p-1.5 rounded-lg border border-zinc-850 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-900 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                              title="Move Up (Load Earlier)"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={isLast}
                              onClick={moveDown}
                              className="p-1.5 rounded-lg border border-zinc-850 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-900 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                              title="Move Down (Load Later)"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // ------------------ 4. STANDALONE GRID LIST MANAGER VIEW ------------------
        <>
          {/* Quick Filters Toolkit */}
          <div className="flex flex-wrap items-center gap-4 bg-[#0a101b]/60 border border-zinc-805 rounded-2xl p-4 justify-between animate-fade-in">
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-wider text-zinc-500 font-mono">Sort packs:</span>
                <select
                  value={addonSortBy}
                  onChange={(e) => setAddonSortBy(e.target.value as any)}
                  className="bg-zinc-950 text-zinc-300 text-xs font-bold px-3 py-2 rounded-xl border border-zinc-800 outline-none cursor-pointer focus:border-emerald-500 transition-colors"
                >
                  <option value="name">ABC alphabetical</option>
                  <option value="date">Decompilation date</option>
                  <option value="enabled">Active status first</option>
                  <option value="disabled">Inactive status first</option>
                </select>
              </div>

              {/* Status Filters Segmented Control */}
              <div className="flex bg-zinc-950 p-1 border border-zinc-805 rounded-xl">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                    statusFilter === "all"
                      ? "bg-zinc-800 text-white shadow"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  All ({totalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("active")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                    statusFilter === "active"
                      ? "bg-emerald-950/45 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                      : "text-zinc-500 hover:text-emerald-400"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Active ({activeCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("inactive")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                    statusFilter === "inactive"
                      ? "bg-zinc-900 text-zinc-300 border border-zinc-800 shadow"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                  Inactive ({disabledCount})
                </button>
              </div>

              {/* Addon Quick Filter Search Bar */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-3 w-3.5 h-3.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Quick index searches..."
                  value={addonSearch}
                  onChange={(e) => setAddonSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-550 outline-none focus:border-zinc-700 focus:bg-zinc-950 transition-all font-sans"
                />
                {addonSearch && (
                  <button
                    onClick={() => setAddonSearch("")}
                    className="absolute right-2 top-2 p-1 text-zinc-550 hover:text-white transition-colors"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {isAdmin && addons.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap md:flex-nowrap justify-end w-full md:w-auto">
                <button
                  onClick={handleEnableAllAddons}
                  className="px-4 py-2 bg-[#12231b] hover:bg-emerald-950/45 text-emerald-400 font-bold text-xs rounded-xl border border-emerald-950 transition-all cursor-pointer uppercase tracking-wider shadow-sm"
                >
                  Enable All
                </button>
                <button
                  onClick={handleDisableAllAddons}
                  className="px-4 py-2 bg-[#10131d] hover:bg-zinc-900 border border-zinc-800 text-zinc-350 font-bold text-xs rounded-xl transition-all cursor-pointer uppercase tracking-wider shadow-sm"
                >
                  Disable All
                </button>
                <button
                  onClick={handleDeleteAllAddons}
                  className="px-4 py-2 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 font-bold text-xs rounded-xl transition-all cursor-pointer uppercase tracking-wider border border-rose-950/50 shadow-sm flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete All
                </button>
              </div>
            )}
          </div>

          {addons.length === 0 ? (
            <div className="glass-panel border border-zinc-800/80 p-12 text-center rounded-2xl flex flex-col items-center justify-center bg-gradient-to-b from-[#0e1622]/40 to-transparent">
              <Layers className="w-12 h-12 text-zinc-750 mb-3" />
              <h3 className="text-base font-extrabold text-white tracking-wide">No minecraft addons uploaded</h3>
              <p className="text-xs text-zinc-500 max-w-sm mt-1.5 leading-relaxed">
                Import minecraft behavior and physical graphics libraries. BDS systems automatically indices, resolves, and sequences dependencies files.
              </p>
            </div>
          ) : searchFilteredAddons.length === 0 ? (
            <div className="glass-panel border border-zinc-800/60 p-12 text-center rounded-2xl flex flex-col items-center justify-center bg-[#090f19]/30">
              <Search className="w-10 h-10 text-zinc-650 mb-3" />
              <h3 className="text-sm font-semibold text-white">No search criteria match</h3>
              <p className="text-xs text-zinc-500 max-w-sm mt-1">
                No active addon titles, description keys, or local folder paths match <span className="text-zinc-400">"{addonSearch}"</span>.
              </p>
              <button
                onClick={() => setAddonSearch("")}
                className="mt-4 px-4 py-2 bg-[#10141f] hover:bg-black text-white text-xs font-semibold rounded-xl border border-zinc-800"
              >
                Clear Search Filter
              </button>
            </div>
          ) : (
            <div className="space-y-10 mt-6 animate-fade-in">
              {/* 1. Active Behavior Packs */}
              {statusFilter !== "inactive" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-zinc-850">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse animate-duration-[2000ms]" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#aa77ff]">
                      Active Behavior Packs ({activeBehaviorPacks.length})
                    </h3>
                  </div>
                  {activeBehaviorPacks.length === 0 ? (
                    <p className="text-xs text-zinc-650 italic pl-1">No Active Behavior packets are loaded.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {activeBehaviorPacks.map(renderAddonCard)}
                    </div>
                  )}
                </div>
              )}

              {/* 2. Active Resource Packs */}
              {statusFilter !== "inactive" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-zinc-850">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse animate-duration-[2000ms]" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-cyan-400">
                      Active Resource Packs ({activeResourcePacks.length})
                    </h3>
                  </div>
                  {activeResourcePacks.length === 0 ? (
                    <p className="text-xs text-zinc-650 italic pl-1">No Active Resource skin packs are loaded.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {activeResourcePacks.map(renderAddonCard)}
                    </div>
                  )}
                </div>
              )}

              {/* 3. Inactive Packs section spacer */}
              {statusFilter === "all" && (disabledBehaviorPacks.length > 0 || disabledResourcePacks.length > 0) && (
                <div className="h-[1px] bg-gradient-to-r from-zinc-900 via-zinc-805/40 to-zinc-900 my-8" />
              )}

              {/* Inactive Behavior */}
              {statusFilter !== "active" && (disabledBehaviorPacks.length > 0 || statusFilter === "inactive") && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-zinc-850/80">
                    <span className="w-2 h-2 rounded-full bg-zinc-600" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">
                      Disabled Behavior Packs ({disabledBehaviorPacks.length})
                    </h3>
                  </div>
                  {disabledBehaviorPacks.length === 0 ? (
                    <p className="text-xs text-zinc-650 italic pl-1">No Disabled Behavior packets found.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 opacity-75 hover:opacity-100 transition-opacity duration-300">
                      {disabledBehaviorPacks.map(renderAddonCard)}
                    </div>
                  )}
                </div>
              )}

              {/* Inactive Resource */}
              {statusFilter !== "active" && (disabledResourcePacks.length > 0 || statusFilter === "inactive") && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-zinc-850/80">
                    <span className="w-2 h-2 rounded-full bg-zinc-600" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">
                      Disabled Resource Packs ({disabledResourcePacks.length})
                    </h3>
                  </div>
                  {disabledResourcePacks.length === 0 ? (
                    <p className="text-xs text-zinc-650 italic pl-1">No Disabled Resource skin packs found.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 opacity-75 hover:opacity-100 transition-opacity duration-300">
                      {disabledResourcePacks.map(renderAddonCard)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
