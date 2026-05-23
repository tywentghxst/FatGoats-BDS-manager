/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Square,
  RefreshCw,
  Clock,
  Settings,
  FileCode,
  Terminal,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Eye,
  EyeOff,
  Trash2
} from "lucide-react";

interface BroadcasterConfig {
  address: string;
  port: number;
  "auto-reconnect": boolean;
  email: string;
  password?: string;
  prefix: string;
  [key: string]: any;
}

interface BroadcasterStatus {
  status: "stopped" | "starting" | "running" | "downloading";
  isDownloaded: boolean;
  uptime: string;
  logs: Array<{ timestamp: string; type: string; message: string }>;
  config: BroadcasterConfig;
  rawConfig: string;
  customJavaPath?: string;
}

interface ConsoleConnectProps {
  token: string | null;
  serverPort: number;
  serverLevelName: string;
  onShowMessage: (text: string, type: "success" | "error" | "info") => void;
}

export default function ConsoleConnect({
  token,
  serverPort,
  serverLevelName,
  onShowMessage
}: ConsoleConnectProps) {
  const [data, setData] = useState<BroadcasterStatus | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"visual" | "raw" | "terminal">("visual");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Field states for the visual config form
  const [address, setAddress] = useState("127.0.0.1");
  const [port, setPort] = useState(19132);
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [prefix, setPrefix] = useState("[Console Connect] ");

  // Field states for the raw config YAML
  const [rawConfig, setRawConfig] = useState("");
  const [customJavaPath, setCustomJavaPath] = useState("");

  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  // Load Status and config from server
  const fetchStatus = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const res = await fetch("/api/broadcaster/status", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to load status");
      const result: BroadcasterStatus = await res.json();
      setData(result);
      
      // Update form fields to match current values from server
      if (result.config) {
        setAddress(result.config.address || "127.0.0.1");
        setPort(result.config.port || 19132);
        setAutoReconnect(result.config["auto-reconnect"] !== false);
        setEmail(result.config.email || "");
        setPassword(result.config.password || "");
        setPrefix(result.config.prefix || "[Console Connect] ");
      }
      if (result.rawConfig) {
        setRawConfig(result.rawConfig);
      }
      if (result.customJavaPath !== undefined) {
        setCustomJavaPath(result.customJavaPath);
      }
    } catch (err: any) {
      console.error(err);
      if (!quiet) onShowMessage(err.message, "error");
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll status every 2.5 seconds to query live log updates and active process state
    const interval = setInterval(() => {
      fetchStatus(true);
    }, 2500);
    return () => clearInterval(interval);
  }, [token]);

  // Handle scroll to bottom of log terminal
  useEffect(() => {
    if (activeSubTab === "terminal" && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [data?.logs, activeSubTab]);

  // Find microsoft link message inside live logs to display notice
  const getDeviceAuthMessage = () => {
    if (!data?.logs) return null;
    // Walk back logs to find Microsoft verification matches
    // Typical messages: "https://microsoft.com/link" and "code FGHJKMNP"
    for (let i = data.logs.length - 1; i >= 0; i--) {
      const msg = data.logs[i].message;
      if (msg.includes("microsoft.com/link")) {
        // Try parsing the code
        const codeReg = /code\s+([A-Z0-9]+-[A-Z0-9]+|[A-Z0-9]{8})/i;
        const match = msg.match(codeReg);
        const code = match ? match[1] : "Check logs below";
        return {
          url: "https://microsoft.com/link",
          code: code,
          fullMessage: msg,
          timestamp: data.logs[i].timestamp
        };
      }
    }
    return null;
  };

  const deviceAuth = getDeviceAuthMessage();

  // Execute Power Control actions (start, stop, restart)
  const handleControlAction = async (action: "start" | "stop" | "restart") => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/broadcaster/control", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || `Control action failed`);
      onShowMessage(`Console Connect successfully ${action === "stop" ? "stopped" : action === "start" ? "started" : "restarted"}!`, "success");
      await fetchStatus();
    } catch (err: any) {
      onShowMessage(err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Download companion Broadcaster jar
  const handleDownloadJar = async () => {
    setActionLoading(true);
    onShowMessage("Downloading latest Broadcaster dependency... Please wait.", "info");
    try {
      const res = await fetch("/api/broadcaster/download", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to download dependency");
      onShowMessage("Broadcaster application executable successfully downloaded!", "success");
      await fetchStatus();
    } catch (err: any) {
      onShowMessage(err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Save Visual Form Configuration fields
  const handleSaveVisualConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const updatedConfig: BroadcasterConfig = {
        address,
        port: Number(port),
        "auto-reconnect": autoReconnect,
        email,
        password,
        prefix
      };

      const res = await fetch("/api/broadcaster/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ config: updatedConfig })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to save settings");
      onShowMessage("Console Connect settings successfully saved!", "success");
      await fetchStatus();
    } catch (err: any) {
      onShowMessage(err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Save Direct YAML configuration
  const handleSaveRawConfig = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/broadcaster/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rawConfig })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to save config.yml");
      onShowMessage("config.yml file rewritten and verified successfully!", "success");
      await fetchStatus();
    } catch (err: any) {
      onShowMessage(err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveCompatibility = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch("/api/server/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ customJavaPath })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to save compatibility settings");
      onShowMessage("Java executable path updated successfully!", "success");
      await fetchStatus();
    } catch (err: any) {
      onShowMessage(err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Clear Broadcaster Logs
  const handleClearLogs = async () => {
    try {
      await fetch("/api/broadcaster/clear-logs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      await fetchStatus(true);
      onShowMessage("Console Connect logs cleared.", "success");
    } catch (e: any) {
      onShowMessage("Failed to clear console logs.", "error");
    }
  };

  if (loading && !data) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center h-full text-zinc-400 gap-3">
        <Clock className="w-8 h-8 text-emerald-500 animate-spin" />
        <span className="text-sm font-medium">Retrieving Console Connect environments...</span>
      </div>
    );
  }

  const isRunning = data?.status === "running";
  const isStarting = data?.status === "starting";
  const isDownloaded = data?.isDownloaded;

  const javaMissing = data?.logs?.some(l => 
    (l.message.toLowerCase().includes("not recognized") && l.message.toLowerCase().includes("java")) ||
    l.message.toLowerCase().includes("broadcaster process failed to start: java") ||
    l.message.toLowerCase().includes("java is not recognized")
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-4 md:p-8 space-y-4 md:space-y-6">
      
      {/* 1. Header Information Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/40 p-4 md:p-6 rounded-2xl border border-zinc-900">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-white tracking-tight">Console Connect Bridge</h2>
            {isRunning ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] uppercase font-black text-emerald-400 tracking-wider">
                Connected Bot Live
              </span>
            ) : isStarting ? (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-[10px] uppercase font-black text-amber-500 tracking-wider animate-pulse">
                Sign-In Flow / Starting
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] uppercase font-black text-zinc-400 tracking-wider">
                Bridge Stopped
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed max-w-2xl">
            Console players (Xbox, PlayStation, Nintendo Switch) cannot easily add server IPs. This bridge launches a virtual broadcaster bot on Xbox Live so your friends can instantly join your custom Minecraft dedicated server <strong>{serverLevelName}</strong> straight from their standard Minecraft <strong>"Friends"</strong> panel!
          </p>
        </div>

        {/* Action button controls */}
        <div className="flex items-center gap-2.5">
          {!isDownloaded ? (
            <button
              id="cc-download-btn"
              onClick={handleDownloadJar}
              disabled={actionLoading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Broadcaster JAR
            </button>
          ) : (
            <>
              {isRunning || isStarting ? (
                <button
                  id="cc-stop-btn"
                  onClick={() => handleControlAction("stop")}
                  disabled={actionLoading}
                  className="px-4.5 py-2.5 bg-rose-600/10 hover:bg-rose-600 border border-rose-500/20 hover:border-rose-500 text-rose-450 hover:text-white font-semibold text-xs rounded-xl shadow-inner transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" />
                  Stop Bridge
                </button>
              ) : (
                <button
                  id="cc-start-btn"
                  onClick={() => handleControlAction("start")}
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-850 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Launch Bridge
                </button>
              )}
              
              <button
                id="cc-restart-btn"
                onClick={() => handleControlAction("restart")}
                disabled={actionLoading || (!isRunning && !isStarting)}
                className="p-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 hover:text-white transition-all cursor-pointer"
                title="Restart Bridge"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Urgent Sign-In Alert (Only shown if token request is ongoing) */}
      {deviceAuth && (isRunning || isStarting) && (
        <div id="device-login-alert-banner" className="bg-emerald-950/40 border border-emerald-500/30 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg animate-pulse">
          <div className="flex items-start gap-3.5">
            <AlertTriangle className="w-6 h-6 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-white">Xbox Account Authentication Required!</h4>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                Your virtual bot needs authentication on Microsoft / Xbox Live. Open the Microsoft activation portal and write down the device credential below!
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Device Auth Code:</span>
                <span className="px-3 py-1 bg-zinc-900 rounded-lg text-emerald-400 tracking-widest font-mono text-sm border border-emerald-500/20 font-black">{deviceAuth.code}</span>
              </div>
            </div>
          </div>
          
          <a
            href={deviceAuth.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            Open Sign-In Link
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* 3. Navigation Inner Tabs */}
      <div className="flex border-b border-zinc-900 gap-1.5 flex-shrink-0">
        <button
          onClick={() => setActiveSubTab("visual")}
          className={`px-5 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeSubTab === "visual"
              ? "border-emerald-500 text-white bg-zinc-900/20 font-bold"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          Visual Settings
        </button>
        <button
          onClick={() => setActiveSubTab("raw")}
          className={`px-5 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeSubTab === "raw"
              ? "border-emerald-500 text-white bg-zinc-900/20 font-bold"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          Raw configuration (config.yml)
        </button>
        <button
          onClick={() => setActiveSubTab("terminal")}
          className={`px-5 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 hover:text-white cursor-pointer ${
            activeSubTab === "terminal"
              ? "border-emerald-500 text-white bg-zinc-900/20 font-bold"
              : "border-transparent text-zinc-400"
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          Console Log Bridge
        </button>
      </div>

      {/* 4. Tab Body Content */}
      <div className="flex-1 overflow-hidden min-h-0 bg-zinc-950 flex flex-col">
        
        {/* Sub-Tab 4.1: Visual Configuration Form */}
        {activeSubTab === "visual" && (
          <div className="flex-1 overflow-y-auto pr-2 max-w-3xl space-y-6">
            <form onSubmit={handleSaveVisualConfig} className="bg-zinc-900/10 border border-zinc-900/80 p-6 rounded-2xl space-y-5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Bridge Client Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-zinc-300">Server Target IP Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="127.0.0.1 or domain"
                    className="px-4 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-zinc-700 font-mono"
                    required
                  />
                  <span className="text-[10px] text-zinc-500 leading-normal">
                    The IP of your Bedrock standard Dedicated Server. Use <strong>127.0.0.1</strong> if running on this same machine.
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-zinc-300">Server Target Port (UDP)</label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value))}
                    placeholder="19132"
                    className="px-4 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-zinc-700 font-mono"
                    required
                  />
                  <span className="text-[10px] text-zinc-500 leading-normal">
                    Standard BDS Port. Fits yours (currently default is <strong>{serverPort}</strong>).
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-300">Log Message Prefix</label>
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder="[Console Connect] "
                  className="px-4 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-850 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Auto Reconnect Link</h4>
                  <p className="text-[10px] text-zinc-400 mt-1">If the bot disconnects or gets kicked by Xbox, automatically attempt to reconnect to Bedrock host.</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoReconnect}
                  onChange={(e) => setAutoReconnect(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </div>

              <hr className="border-zinc-900" />
              
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Microsoft Xbox Account Authentication</h3>
              <p className="text-[10px] text-zinc-450 leading-relaxed">
                <strong>💡 Tip:</strong> You can leave these completely empty! If they are empty, Console Connect automatically uses the secure **Xbox Device Auth Flow**, which generates a 8-digit verification code in the Console Log Bridge tab for you to trigger login on any mobile or desktop web browser. If you write down email/password directly, it will try to log in automatically.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-3">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-zinc-300">Microsoft Account Email (Optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="xbox-bot@outlook.com"
                    className="px-4 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <div className="flex flex-col gap-2 relative">
                  <label className="text-xs font-semibold text-zinc-300">Microsoft Account Password (Optional)</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••"
                      className="w-full px-4 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-zinc-700 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Save Bridge Settings
              </button>
            </form>

            {/* Host Compatibility settings Form */}
            <form onSubmit={handleSaveCompatibility} className="bg-zinc-900/10 border border-zinc-900/80 p-6 rounded-2xl space-y-5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Host Runtime Compatibility Settings</h3>
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                If the Console Connect bridge does not start on your physical host machine and logs <strong>"'java' is not recognized as an internal or external command"</strong>, Java is not in your system's global system PATH. Configure the absolute or relative path to your Java JVM binary below.
              </p>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-300">Custom Java Runtime (java / java.exe) Path</label>
                <input
                  type="text"
                  value={customJavaPath}
                  onChange={(e) => setCustomJavaPath(e.target.value)}
                  placeholder="e.g. C:\Program Files\Java\jdk-17\bin\java.exe (or /usr/bin/java on Linux)"
                  className="px-4 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-zinc-700 font-mono"
                />
                <span className="text-[10px] text-zinc-500">
                  Leave completely blank to use the standard fallback system <strong>"java"</strong> command.
                </span>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900/40 text-zinc-200 hover:text-white font-semibold text-xs rounded-xl shadow-md transition-all border border-zinc-700 hover:border-zinc-600 cursor-pointer"
              >
                Apply Custom Java Path
              </button>
            </form>
          </div>
        )}

        {/* Sub-Tab 4.2: Raw config.yml file editor */}
        {activeSubTab === "raw" && (
          <div className="flex-1 flex flex-col min-h-0 space-y-4">
            <div className="p-3 bg-zinc-900/30 border border-zinc-900 rounded-xl flex items-center justify-between">
              <span className="text-[10px] font-mono text-zinc-400">Editing: bedrock-server/broadcaster-config.yml</span>
              <button
                id="raw-cc-save-btn"
                onClick={handleSaveRawConfig}
                disabled={actionLoading}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white font-semibold text-[10px] uppercase rounded-lg shadow-md transition-all cursor-pointer"
              >
                Save File Changes
              </button>
            </div>
            
            <div className="flex-1 min-h-0 border border-zinc-900 rounded-2xl overflow-hidden focus-within:border-zinc-700 flex">
              <textarea
                value={rawConfig}
                onChange={(e) => setRawConfig(e.target.value)}
                placeholder="# Console Connect Configuration YML file..."
                className="flex-1 h-full bg-zinc-900/20 p-5 text-xs text-emerald-400 font-mono focus:outline-none resize-none leading-relaxed overflow-y-auto"
                spellCheck="false"
              />
            </div>
          </div>
        )}

        {/* Sub-Tab 4.3: Console Log Bridge terminal */}
        {activeSubTab === "terminal" && (
          <div className="flex-1 flex flex-col min-h-0 space-y-4 bg-zinc-950">
            {javaMissing && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Java Runtime (JRE) Not Installed or Not in PATH
                  </h4>
                  <p className="text-[10px] text-zinc-300 leading-normal">
                    The standard <strong>"java"</strong> command is not recognized on your Windows host. 
                    Please define your custom Java executable path under <strong>Visual Settings &rarr; Host Runtime Compatibility Settings</strong> to run your companion bot!
                  </p>
                </div>
                <button
                  onClick={() => setActiveSubTab("settings")}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-all shrink-0 cursor-pointer"
                >
                  Configure Java Path
                </button>
              </div>
            )}

            <div className="flex items-center justify-between flex-shrink-0 bg-zinc-900/20 p-3 rounded-xl border border-zinc-900 select-none">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Active Companion Terminal Logs</span>
              </div>
              <button
                onClick={handleClearLogs}
                className="text-zinc-500 hover:text-zinc-300 text-[10px] font-bold uppercase transition-all flex items-center gap-1 flex-shrink-0 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Logs
              </button>
            </div>

            {/* Terminal Window Grid */}
            <div className="flex-1 border border-zinc-900/80 rounded-2xl bg-zinc-950/20 p-6 font-mono text-xs overflow-y-auto leading-relaxed flex flex-col gap-2 shadow-inner">
              {data?.logs && data.logs.length > 0 ? (
                data.logs.map((log, index) => {
                  let badgeColor = "bg-zinc-800 text-zinc-400 border-zinc-750";
                  if (log.type === "ERROR" || log.type === "ERR") {
                    badgeColor = "bg-red-500/10 text-red-400 border-red-500/20";
                  } else if (log.type === "WARN") {
                    badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                  } else if (log.type === "CLIENT" || log.type === "SUCCESS") {
                    badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                  } else if (log.type === "SIGNIN") {
                    badgeColor = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                  }

                  // Auto-linking microsoft portal log entries
                  const isAuthLog = log.message.includes("https://microsoft.com/link");

                  return (
                    <div
                      key={index}
                      className={`flex flex-col md:flex-row md:items-start gap-2.5 py-1 px-2 rounded-lg border border-transparent transition-all hover:bg-zinc-900/10 ${
                        isAuthLog ? "bg-emerald-900/10 border-emerald-500/20 py-2.5 px-3" : ""
                      }`}
                    >
                      <span className="text-[10px] font-sans text-zinc-650 flex-shrink-0 mt-0.5">{log.timestamp}</span>
                      <span className={`px-1.5 py-0.5 font-sans rounded text-[8px] font-black tracking-widest uppercase border flex-shrink-0 ${badgeColor}`}>
                        {log.type}
                      </span>
                      <span className={`flex-1 whitespace-pre-wrap break-all ${isAuthLog ? "text-emerald-300 font-bold" : "text-zinc-300"}`}>
                        {log.message}
                        {isAuthLog && (
                          <div className="mt-2 flex items-center gap-2">
                            <a
                              href="https://microsoft.com/link"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[9px] uppercase tracking-wider rounded flex items-center gap-1 transition-all"
                            >
                              Open Portal <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        )}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 space-y-2 py-10">
                  <Terminal className="w-8 h-8 opacity-40" />
                  <span className="text-[10px] uppercase font-bold tracking-wider">No logs available. Start the bridge to listen.</span>
                </div>
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>
        )}

      </div>

      {/* 5. Footer Credits */}
      <div className="border-t border-zinc-900/60 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-500 font-sans flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <span>Console Connect is powered by the open-source</span>
          <a
            href="https://github.com/MCXboxBroadcast/Broadcaster"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1 hover:underline"
          >
            MCXboxBroadcast Broadcaster
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <div>
          <span>Created with passion by </span>
          <a
            href="https://github.com/rtm516"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-white font-semibold hover:underline"
          >
            rtm516
          </a>
        </div>
      </div>

    </div>
  );
}
