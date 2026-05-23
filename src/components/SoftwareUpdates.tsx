import { useState, useEffect } from "react";
import { 
  RefreshCw, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Github, 
  Terminal, 
  Lock, 
  Database, 
  FileCode, 
  ExternalLink,
  Info,
  GitCommit,
  GitBranch,
  Calendar,
  User
} from "lucide-react";

interface SoftwareUpdatesProps {
  token: string | null;
  onShowMessage: (text: string, type: "info" | "success" | "error" | "warn") => void;
}

interface GithubCommit {
  sha: string;
  shortSha: string;
  author: string;
  authorLogin: string;
  avatarUrl: string;
  date: string;
  message: string;
  details: string;
  htmlUrl: string;
}

interface UpdateStatus {
  latestVersion: string;
  releaseName: string;
  publishedAt: string;
  changelog: string;
  commits?: GithubCommit[];
  url: string;
  isNew: boolean;
  isFallback?: boolean;
  latestSha?: string;
}

export default function SoftwareUpdates({ token, onShowMessage }: SoftwareUpdatesProps) {
  const [currentVersion, setCurrentVersion] = useState("Scanning...");
  const [checking, setChecking] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"windows" | "docker">("windows");
  const [backingUp, setBackingUp] = useState(false);

  // Automated Interactive Updates states
  const [updateStatus, setUpdateStatus] = useState<"idle" | "backing_up" | "downloading" | "installing" | "rebuilding" | "completed" | "error">("idle");
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateLogs, setUpdateLogs] = useState<Array<{ timestamp: string; message: string; type: "info" | "success" | "error" }>>([]);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [reconstructing, setReconstructing] = useState(false);

  // Auto-check on load
  useEffect(() => {
    handleCheckUpdates();
    
    // Check if there's any active update currently running on load
    const verifyActiveUpdate = async () => {
      try {
        const res = await fetch("/api/updates/status", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const s = await res.json();
          if (s.currentVersion) {
            setCurrentVersion(s.currentVersion);
          }
          if (s.status !== "idle") {
            setUpdateStatus(s.status);
            setUpdateProgress(s.progress);
            setUpdateLogs(s.logs || []);
            setUpdateError(s.error);
          }
        }
      } catch (e) {}
    };
    verifyActiveUpdate();
  }, [token]);

  // Poll update status while active
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/updates/status", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.ok) {
          const s = await res.json();
          setUpdateStatus(s.status);
          setUpdateProgress(s.progress);
          setUpdateLogs(s.logs || []);
          setUpdateError(s.error);
        }
      } catch (e) {
        console.error("Error fetching live update status:", e);
      }
    };

    if (updateStatus !== "idle") {
      checkStatus();
      timer = setInterval(checkStatus, 1500);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [updateStatus, token]);

  const handleCheckUpdates = async () => {
    setChecking(true);
    setError(null);
    try {
      const response = await fetch("/api/updates/check", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error("Failed to contact the update server.");
      }
      const data = await response.json();
      if (data.success) {
        setUpdateInfo(data);
        if (data.currentVersion) {
          setCurrentVersion(data.currentVersion);
        }
      } else {
        throw new Error("Update checks returned negative response status.");
      }
    } catch (err: any) {
      setError(err.message || "Unable to check for updates right now.");
    } finally {
      setChecking(false);
    }
  };

  const handleDownloadBackup = async () => {
    setBackingUp(true);
    try {
      const response = await fetch("/api/updates/backup", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error("Failed to compile backup zip.");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bds_manager_config_backup_${new Date().toISOString().slice(0,10)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      onShowMessage("Configuration and database backup downloaded successfully!", "success");
    } catch (err: any) {
      onShowMessage(err.message || "Failed to download backup.", "error");
    } finally {
      setBackingUp(false);
    }
  };

  const handleApplyUpdate = async () => {
    if (!updateInfo) return;
    setApplying(true);
    try {
      const res = await fetch("/api/updates/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          latestVersion: updateInfo.latestVersion,
          latestSha: updateInfo.latestSha
        })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to trigger update.");
      onShowMessage("Software update routine started! Watch the progress panel below.", "success");
      setUpdateStatus("backing_up");
    } catch (err: any) {
      onShowMessage(err.message, "error");
    } finally {
      setApplying(false);
    }
  };

  const handleRestartServer = async () => {
    setReconstructing(true);
    onShowMessage("Clean reboot command dispatched. Reconnecting system shortly...", "info");
    try {
      const res = await fetch("/api/updates/restart", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to dispatch restart signal.");
      
      setTimeout(() => {
        window.location.reload();
      }, 4000);
    } catch (err: any) {
      onShowMessage(err.message, "error");
      setReconstructing(false);
    }
  };

  const hasNewerVersion = updateInfo && updateInfo.latestVersion !== currentVersion;

  return (
    <div className="space-y-4 md:space-y-6 select-none animate-fade-in">
      {/* Banner Card */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 border border-zinc-900 rounded-2xl p-4 md:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase text-emerald-400 tracking-wider">
              Software Maintenance
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">Software Update Center</h2>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
              Keep your BDS Manager up to date. Updating is extremely safe because all worlds, settings, skins, databases, and configuration scripts are stored separately from the dashboard source folder.
            </p>
          </div>
          
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCheckUpdates}
              disabled={checking}
              className="p-3 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all font-bold text-xs inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-zinc-400 ${checking ? "animate-spin" : ""}`} />
              Check GitHub
            </button>
            
            <a
              href="https://github.com/tywentghxst/FatGoats-BDS-manager"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-zinc-950 hover:bg-zinc-900 text-white rounded-xl border border-zinc-900 hover:border-zinc-800 transition-all font-bold text-xs inline-flex items-center gap-2 cursor-pointer"
            >
              <Github className="w-4 h-4 text-emerald-400" />
              Source code
            </a>
          </div>
        </div>
      </div>

      {/* ULTRA PROMINENT UPDATE CARD FOR NEW RELEASES */}
      {hasNewerVersion && updateInfo && updateStatus === "idle" && (
        <div className="bg-gradient-to-r from-emerald-950/45 via-emerald-900/10 to-zinc-950 border-2 border-emerald-500/50 rounded-2xl p-6 shadow-xl space-y-4 md:space-y-0 md:flex md:items-center md:justify-between md:gap-6 hover:border-emerald-400 transition-all duration-300">
          <div className="space-y-2 max-w-2xl select-text">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-black uppercase text-emerald-400 tracking-wider">
              ⚠️ PENDING SYSTEM UPGRADE AVAILABLE
            </div>
            <h3 className="text-xl font-black text-white tracking-tight">
              Upgrade to <span className="text-emerald-400 font-mono font-black">{updateInfo.latestVersion}</span> is ready
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Your active installation (<span className="text-zinc-100 font-mono font-bold">{currentVersion}</span>) is outdated. Our intelligent automated compiler will run an instant local backup, update the manifests, patch system endpoints, and hot-restart BDS Manager instantly!
            </p>
            <div className="flex flex-wrap gap-2 text-[10px] text-zinc-400 font-bold font-mono uppercase bg-zinc-950/60 p-2 rounded-xl border border-zinc-900 leading-none">
              <span className="text-zinc-455">Release Name:</span>
              <span className="text-emerald-400 font-black">{updateInfo.releaseName}</span>
            </div>
          </div>

          <button
            onClick={handleApplyUpdate}
            disabled={applying}
            className="w-full md:w-auto px-10 py-5.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 disabled:from-zinc-800 disabled:to-zinc-850 text-zinc-950 font-black text-sm rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:shadow-[0_0_40px_rgba(16,185,129,0.73)] border border-emerald-300/40 hover:scale-[1.04] active:scale-[0.97] transition-all inline-flex items-center justify-center gap-3.5 cursor-pointer shrink-0 duration-300"
          >
            {applying ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-zinc-950 stroke-[2.5px]" />
                INITIATING SYSTEM UPGRADE...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 text-zinc-950 fill-zinc-950 stroke-[2.5px]" />
                ⚡ UPDATE SYSTEM NOW
              </>
            )}
          </button>
        </div>
      )}

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Version Info and Release Details */}
        <div className="lg:col-span-7 space-y-6">

          {/* Active Update Progress Panel */}
          {updateStatus !== "idle" && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div className="flex items-center gap-2">
                  <RefreshCw className={`w-4 h-4 text-emerald-400 ${updateStatus !== "completed" && updateStatus !== "error" ? "animate-spin" : ""}`} />
                  <h3 className="text-sm font-bold text-white tracking-tight">System Upgrade Engine</h3>
                </div>
                <span className="text-[10px] tracking-wider uppercase font-black px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  {updateStatus.replace("_", " ")}
                </span>
              </div>

              {/* Progress Indicator */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold font-mono">
                  <span className="text-zinc-400 capitalize">
                    {updateStatus === "backing_up" && "Backing up configurations..."}
                    {updateStatus === "downloading" && "Retrieving new software pack..."}
                    {updateStatus === "installing" && "Installing system modules..."}
                    {updateStatus === "rebuilding" && "Rebuilding distribution configurations..."}
                    {updateStatus === "completed" && "Safe upgrade fully complete!"}
                    {updateStatus === "error" && "An error occurred during install."}
                  </span>
                  <span className="text-emerald-400">{updateProgress}%</span>
                </div>
                <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-850">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500 rounded-full" 
                    style={{ width: `${updateProgress}%` }}
                  />
                </div>
              </div>

              {/* Console Logs */}
              <div className="space-y-2">
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-black flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Interactive Update Terminal</span>
                </div>
                <div className="bg-zinc-950 border border-zinc-950 rounded-xl p-3.5 h-44 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1.5 select-text">
                  {updateLogs.length === 0 ? (
                    <div className="text-zinc-600 italic">Spawning install subprocess...</div>
                  ) : (
                    updateLogs.map((log, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-zinc-650 select-none">[{log.timestamp}]</span>
                        <span className={log.type === "success" ? "text-emerald-400 font-bold" : log.type === "error" ? "text-rose-400 font-bold" : "text-zinc-300"}>
                          {log.message}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Reboot trigger buttons */}
              {updateStatus === "completed" && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 p-4.5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
                  <div className="space-y-1 select-text">
                    <h4 className="text-xs font-bold text-white">Upgrade Successfully Applied!</h4>
                    <p className="text-[10px] text-zinc-450 leading-relaxed">The server files have been upgraded successfully. Click reboot to boot the new version.</p>
                  </div>
                  <button
                    onClick={handleRestartServer}
                    disabled={reconstructing}
                    className="w-full md:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {reconstructing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Rebuilding Container...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        Restart to Apply Update
                      </>
                    )}
                  </button>
                </div>
              )}

              {updateStatus === "error" && (
                <div className="bg-rose-500/5 border border-rose-500/20 p-4.5 rounded-xl space-y-3">
                  <div className="flex items-center gap-1.5 text-xs text-rose-450 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span>Upgrade process encountered an issue</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 select-text">{updateError}</p>
                  <button
                    onClick={() => {
                      setUpdateStatus("idle");
                      setUpdateProgress(0);
                      setUpdateLogs([]);
                      setUpdateError(null);
                    }}
                    className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Clear State & Retry
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Version Status Bento Card */}
          <div className="bg-zinc-900/40 border border-zinc-900/80 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-black text-zinc-500 tracking-wider block">Current Status</span>
              {checking ? (
                <span className="text-[10px] text-zinc-400 inline-flex items-center gap-1">Checking for updates...</span>
              ) : error ? (
                <span className="text-[10px] text-red-400 inline-flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Failed to check Github
                </span>
              ) : updateInfo ? (
                hasNewerVersion ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] text-red-400 font-bold uppercase tracking-wider">
                    New Update Available
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                    Up-to-Date
                  </span>
                )
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-950/45 border border-zinc-900/50 p-4 rounded-xl space-y-1">
                <span className="text-[10px] text-zinc-500 font-medium block">Installed Version</span>
                <span className="text-xl font-mono font-black text-white">{currentVersion}</span>
              </div>
              
              <div className="bg-zinc-950/45 border border-zinc-900/50 p-4 rounded-xl space-y-1">
                <span className="text-[10px] text-zinc-500 font-medium block">Latest on Github</span>
                <span className="text-xl font-mono font-black text-emerald-400">
                  {checking ? "Checking..." : updateInfo ? updateInfo.latestVersion : "---"}
                </span>
              </div>
            </div>

            {updateInfo && (
              <div className="bg-zinc-950/20 border border-zinc-900/60 p-4.5 rounded-xl space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-zinc-950/40 pb-2">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-zinc-300 block">{updateInfo.releaseName}</span>
                    <span className="text-[10px] text-zinc-500 block">
                      Published {new Date(updateInfo.publishedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </span>
                  </div>
                  <a
                    href={updateInfo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 font-medium"
                  >
                    Release page <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="space-y-3">
                  <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-black flex items-center justify-between px-1">
                    <span className="flex items-center gap-1.5">
                      <GitBranch className="w-3 h-3 text-emerald-400" />
                      Repository Commit History & Feed
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold capitalize">
                      Real-time API Feed
                    </span>
                  </div>

                  {updateInfo.commits && updateInfo.commits.length > 0 ? (
                    <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1 select-text scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                      {updateInfo.commits.map((commit) => {
                        // Dynamically analyze commit tag type (e.g. feat: optimize restart)
                        const msgLower = commit.message.toLowerCase();
                        let badgeColor = "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
                        let badgeLabel = "patch";

                        if (msgLower.startsWith("feat")) {
                          badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                          badgeLabel = "feature";
                        } else if (msgLower.startsWith("fix")) {
                          badgeColor = "bg-rose-500/10 text-rose-400 border-rose-500/20";
                          badgeLabel = "bugfix";
                        } else if (msgLower.startsWith("refactor")) {
                          badgeColor = "bg-purple-500/10 text-purple-400 border-purple-500/20";
                          badgeLabel = "refactor";
                        } else if (msgLower.startsWith("build") || msgLower.startsWith("chore")) {
                          badgeColor = "bg-sky-500/10 text-sky-450 border-sky-500/20";
                          badgeLabel = "build";
                        } else if (msgLower.startsWith("docs")) {
                          badgeColor = "bg-amber-500/10 text-yellow-450 border-amber-500/20";
                          badgeLabel = "docs";
                        }

                        // Parse out prefix from main message line
                        let displayMessage = commit.message;
                        const prefixMatch = commit.message.match(/^([a-z0-9_-]+)(?:\(([^)]+)\))?:\s*(.*)$/i);
                        if (prefixMatch) {
                          displayMessage = prefixMatch[3];
                        }

                        return (
                          <div 
                            key={commit.sha} 
                            className="group relative bg-[#09090b]/90 hover:bg-[#0c0c0e] border border-zinc-900/85 hover:border-zinc-800 rounded-xl p-4 transition-all duration-200 space-y-3"
                          >
                            {/* Accent Vertical Color Indicator */}
                            <div className={`absolute top-0 bottom-0 left-0 w-[3px] rounded-l-xl ${
                              badgeLabel === "feature" ? "bg-emerald-500/60" :
                              badgeLabel === "refactor" ? "bg-purple-500/60" :
                              badgeLabel === "bugfix" ? "bg-rose-500/60" :
                              "bg-zinc-700"
                            }`} />

                            {/* Header Section: Author, Date, Revision SHA */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-900/40">
                              <div className="flex items-center gap-2.5">
                                <img 
                                  src={commit.avatarUrl} 
                                  alt={commit.author}
                                  referrerPolicy="no-referrer"
                                  className="w-7 h-7 rounded-lg border border-zinc-800 object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-zinc-250 leading-none">{commit.author}</span>
                                  <span className="text-[10px] text-zinc-500 font-mono mt-0.5">@{commit.authorLogin}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2.5 font-mono text-[10px]">
                                <span className="text-zinc-450 bg-zinc-900/60 px-2 py-0.5 rounded border border-zinc-900/85">
                                  {new Date(commit.date).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                                <a 
                                  href={commit.htmlUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-0.5 rounded bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white transition-colors flex items-center gap-1 font-bold select-all"
                                  title="View code diff on GitHub"
                                >
                                  {commit.shortSha}
                                  <ExternalLink className="w-2.5 h-2.5 text-zinc-500 group-hover:text-zinc-300" />
                                </a>
                              </div>
                            </div>

                            {/* Message & Core Changes */}
                            <div className="space-y-2 pl-1 select-text">
                              <div className="flex items-start gap-2 flex-wrap sm:flex-nowrap">
                                <span className={`px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider rounded border shrink-0 ${badgeColor}`}>
                                  {badgeLabel}
                                </span>
                                <span className="text-xs font-bold text-zinc-100 font-sans leading-snug">
                                  {displayMessage}
                                </span>
                              </div>

                              {/* Multi-line Details Parsing */}
                              {commit.details ? (
                                <div className="mt-2 pt-2 border-t border-zinc-950/20 space-y-1.5 text-[11px] font-sans text-zinc-450">
                                  {commit.details.split("\n").map((line, lineIdx) => {
                                    const cleanedLine = line.replace(/^[•*\-\s\d]+\.?\s*/, "").trim();
                                    if (!cleanedLine) return null;
                                    return (
                                      <div key={lineIdx} className="flex items-start gap-2 leading-relaxed text-zinc-300">
                                        <span className="text-emerald-500 mt-1 select-none text-[8px]">•</span>
                                        <span className="flex-1">{cleanedLine}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Fallback standard terminal style scroll */
                    <div className="bg-zinc-950 border border-zinc-900 text-zinc-200 rounded-xl p-4 text-[11px] max-h-60 overflow-y-auto leading-relaxed whitespace-pre-wrap font-mono select-text">
                      {updateInfo.changelog || "No update details provided."}
                    </div>
                  )}
                </div>

                {updateStatus === "idle" && (
                  <div className="pt-3 border-t border-zinc-900/10">
                    {hasNewerVersion ? (
                      <button
                        onClick={handleApplyUpdate}
                        disabled={applying}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-805 text-white rounded-xl font-bold text-xs inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                      >
                        {applying ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Initiating Secure Update...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            Download & Apply Update Now ({updateInfo.latestVersion})
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={handleApplyUpdate}
                        disabled={applying}
                        className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-855 text-zinc-300 rounded-xl border border-zinc-800 hover:border-zinc-700 font-bold text-xs inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        {applying ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Preparing reinstall...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4" />
                            Reinstall / Force Update Version
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Backup Bento Block */}
          <div className="bg-zinc-900/40 border border-zinc-900/80 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Ultra-Safe Local Database Backup</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Before applying updates, you can download a complete ZIP package of your bedrock-server config schema, player authorization records, invitations, and environment configurations instantly.
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadBackup}
              disabled={backingUp}
              className="w-full py-3 bg-purple-650 hover:bg-purple-550 text-white rounded-xl border border-purple-600/30 font-bold text-xs inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              {backingUp ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Compiling Backup Zip...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download Config Backup ZIP
                </>
              )}
            </button>
          </div>

        </div>

        {/* Right Column: Interactive Safe-Updating Guides */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Safe update Guide Cards */}
          <div className="bg-zinc-900/40 border border-zinc-900/80 rounded-2xl p-5 shadow-lg space-y-4">
            <span className="text-[10px] uppercase font-black text-zinc-500 tracking-wider block">Application Guide: updating without losing data</span>
            
            {/* Guide Tabs */}
            <div className="flex bg-zinc-950/60 border border-zinc-900 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("windows")}
                className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === "windows"
                    ? "bg-zinc-900 text-white border border-zinc-800 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Windows (Host)
              </button>
              <button
                onClick={() => setActiveTab("docker")}
                className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === "docker"
                    ? "bg-zinc-900 text-white border border-zinc-800 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Docker (Containers)
              </button>
            </div>

            {/* How Data Isolation Works */}
            <div className="bg-zinc-950/40 border border-zinc-900/60 rounded-xl p-3.5 space-y-2 text-[11px] leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero-Data-Loss Architecture</span>
              </div>
              <p className="text-zinc-400 font-sans">
                BDS Manager stores your active database files (<code className="text-zinc-200 text-[10px] font-mono bg-zinc-950 p-0.5 rounded">manager_db.json</code>), server properties, whitelist arrays, behavior/resource packs, and Minecraft Worlds under the <code className="text-zinc-200 text-[10px] font-mono bg-zinc-950 p-0.5 rounded px-1">bedrock-server/</code> directory. 
              </p>
              <p className="text-zinc-400 font-sans">
                Because this folder serves as an isolated storage partition or Docker host volume, you are free to overwrite any frontend resources or server compilation files safely without risking any server progress!
              </p>
            </div>

            {activeTab === "windows" ? (
              <div className="space-y-3.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-white uppercase tracking-wider pt-1.5">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Windows Automated script step</span>
                </div>
                
                <div className="space-y-3 text-[11.5px] leading-relaxed text-zinc-400">
                  <div className="flex gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-zinc-950 text-[10px] font-bold flex items-center justify-center border border-zinc-900 text-zinc-400 flex-shrink-0">1</div>
                    <p className="font-sans">Ensure node is installed, first-run download your backup archive to be fully protected.</p>
                  </div>

                  <div className="flex gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-zinc-950 text-[10px] font-bold flex items-center justify-center border border-zinc-900 text-zinc-400 flex-shrink-0">2</div>
                    <div className="space-y-1.5 w-full">
                      <p className="font-sans">Execute our automated safe Windows updater located in the project's root folder:</p>
                      <div className="p-2.5 bg-zinc-950 border border-zinc-900 rounded-xl text-[10.5px] font-mono text-emerald-400 font-bold block select-all">
                        update-windows.bat
                      </div>
                      <span className="text-[9.5px] text-zinc-500 italic block leading-snug font-sans">
                        💡 Wait! The script automatically creates pre-update JSON backups, pulls the latest sources from GitHub safely, retains user-specific databases and starts dependencies dynamically!
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-zinc-950 text-[10px] font-bold flex items-center justify-center border border-zinc-900 text-zinc-400 flex-shrink-0">3</div>
                    <p className="font-sans">Start the Bedrock Server Manager with the standard <code className="text-zinc-300 font-semibold bg-zinc-950 px-1 rounded">start-windows.bat</code>. Your panel, logins, worlds, and settings are fully restored instantly!</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-white uppercase tracking-wider pt-1.5">
                  <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Docker Swappable volumes step</span>
                </div>

                <div className="space-y-3 text-[11.5px] leading-relaxed text-zinc-400">
                  <div className="flex gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-zinc-950 text-[10px] font-bold flex items-center justify-center border border-zinc-900 text-zinc-400 flex-shrink-0">1</div>
                    <p className="font-sans">Ensure persistent volumes are declared in <code className="text-zinc-200 bg-zinc-950 px-1 rounded text-[10px]">docker-compose.yml</code> mapping <code className="text-zinc-300">./bedrock-server</code> as of standard setup.</p>
                  </div>

                  <div className="flex gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-zinc-950 text-[10px] font-bold flex items-center justify-center border border-zinc-900 text-zinc-400 flex-shrink-0">2</div>
                    <div className="space-y-1.5 w-full">
                      <p className="font-sans">Execute our helper updater shell script inside the workspace directory:</p>
                      <div className="p-2.5 bg-zinc-950 border border-zinc-900 rounded-xl text-[10.5px] font-mono text-emerald-400 font-bold block select-all">
                        ./update-docker.sh
                      </div>
                      <span className="text-[9.5px] text-zinc-500 italic block leading-snug font-sans">
                        💡 Note: This script pulls Github updates, stops the container, compiles sources with `--no-cache` using newer code, and executes compose safely.
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-zinc-950 text-[10px] font-bold flex items-center justify-center border border-zinc-900 text-zinc-400 flex-shrink-0">3</div>
                    <p className="font-sans">Alternatively, run manually: stop containers, perform a checkout, execute <code className="text-zinc-100 font-mono text-[10px] bg-zinc-950 px-1 py-0.5 rounded">docker compose build --no-cache && docker compose up -d</code>. Your persistent folders remain unharmed!</p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    
    </div>
  );
}
