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
  Info
} from "lucide-react";

interface SoftwareUpdatesProps {
  token: string | null;
  onShowMessage: (text: string, type: "info" | "success" | "error" | "warn") => void;
}

interface UpdateStatus {
  latestVersion: string;
  releaseName: string;
  publishedAt: string;
  changelog: string;
  url: string;
  isNew: boolean;
  isFallback?: boolean;
}

export default function SoftwareUpdates({ token, onShowMessage }: SoftwareUpdatesProps) {
  const [currentVersion, setCurrentVersion] = useState("v1.3.0");
  const [checking, setChecking] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"windows" | "docker">("windows");
  const [backingUp, setBackingUp] = useState(false);

  // Auto-check on load
  useEffect(() => {
    handleCheckUpdates();
  }, []);

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
      
      // Handle file download
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

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Version Info and Release Details */}
        <div className="lg:col-span-7 space-y-6">
          
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

                <div className="space-y-2">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Release Notes & Changelog</div>
                  <div className="bg-zinc-950/60 border border-zinc-950 text-zinc-300 rounded-lg p-3 text-xs max-h-40 overflow-y-auto leading-relaxed whitespace-pre-wrap font-sans">
                    {updateInfo.changelog || "No update details provided."}
                  </div>
                </div>

                {hasNewerVersion && (
                  <div className="flex items-center gap-2 p-2 bg-yellow-500/5 border border-yellow-500/15 rounded-lg text-[11px] text-yellow-400">
                    <Info className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Download and run the update scripts shown in the right dashboard to apply these changes securely.</span>
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
