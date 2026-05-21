/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Square,
  RefreshCw,
  Terminal,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Trash2,
  Copy,
  Check,
  Globe,
  Wifi,
  ShieldAlert,
  Server
} from "lucide-react";

interface PlayitStatus {
  status: "stopped" | "starting" | "running" | "downloading";
  isDownloaded: boolean;
  logs: Array<{ timestamp: string; type: string; message: string }>;
  claimCode: string;
  claimUrl: string;
  tunnelUrl: string;
}

interface PlayitConnectProps {
  token: string | null;
  serverPort: number;
  serverLevelName: string;
  onShowMessage: (text: string, type: "success" | "error" | "info") => void;
}

export default function PlayitConnect({
  token,
  serverPort,
  serverLevelName,
  onShowMessage
}: PlayitConnectProps) {
  const [data, setData] = useState<PlayitStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedType, setCopiedType] = useState<"code" | "ip" | null>(null);

  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  // Load Status from server
  const fetchStatus = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const res = await fetch("/api/playit/status", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to load playit.gg status");
      const result: PlayitStatus = await res.json();
      setData(result);
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
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [data?.logs]);

  // Copy helper
  const handleCopy = (text: string, type: "code" | "ip") => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    onShowMessage(`Copied ${type === "code" ? "Claim Code" : "Tunnel Address"} to clipboard!`, "success");
    setTimeout(() => setCopiedType(null), 2000);
  };

  // Execute Power Control actions (start, stop, restart, confirm_claim)
  const handleControlAction = async (action: "start" | "stop" | "restart" | "confirm_claim") => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/playit/control", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `Failed to execute action ${action}`);
      }
      onShowMessage(`Tunnel client request sent: ${action}`, "info");
      await fetchStatus(true);
    } catch (err: any) {
      onShowMessage(err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Download companion binary
  const handleDownloadBinary = async () => {
    setActionLoading(true);
    onShowMessage("Downloading playit.gg companion binary. Please wait...", "info");
    try {
      const res = await fetch("/api/playit/download", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Download failed");
      }
      onShowMessage("playit.gg companion binary installed successfully!", "success");
      await fetchStatus();
    } catch (err: any) {
      onShowMessage(err.message, "error");
      await fetchStatus();
    } finally {
      setActionLoading(false);
    }
  };

  // Clear live logs console
  const handleClearLogs = async () => {
    try {
      const res = await fetch("/api/playit/clear-logs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        onShowMessage("Playit logs cleared", "success");
        if (data) {
          setData({ ...data, logs: [] });
        }
      }
    } catch (err: any) {
      onShowMessage(err.message, "error");
    }
  };

  // Get status color & description text
  const getStatusTextColor = (status: string) => {
    switch (status) {
      case "running":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      case "starting":
        return "text-blue-400 bg-blue-500/10 border-blue-500/30 animate-pulse";
      case "downloading":
        return "text-purple-400 bg-purple-500/10 border-purple-500/30 animate-pulse";
      case "stopped":
      default:
        return "text-zinc-400 bg-zinc-800/40 border-zinc-700/30";
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto space-y-5 md:space-y-8 bg-zinc-950/40">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center pb-4 border-b border-zinc-900 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Open to Internet</h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Put your server online and make it public secure proxy routing using playit.gg local tunnel agent. No port forwarding needed!
          </p>
        </div>

        {/* Current State indicator */}
        <div className="flex items-center gap-3">
          {data && (
            <div className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider border flex items-center gap-2 ${getStatusTextColor(data.status)}`}>
              <span className={`w-2 h-2 rounded-full ${data.status === "running" ? "bg-emerald-400 animate-ping" : data.status === "starting" ? "bg-blue-400 animate-pulse" : "bg-zinc-500"}`} />
              Agent Agent: {data.status}
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Control panel */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left column: Quick Settings and Controls */}
        <div className="xl:col-span-1 space-y-6">
          
          {/* General Information Card */}
          <div className="p-6 bg-zinc-900/40 border border-zinc-900 rounded-2xl space-y-4 shadow-xl">
            <h2 className="text-base font-semibold text-white flex items-center gap-2 border-b border-zinc-800/60 pb-3">
              <Server className="w-4 h-4 text-emerald-400" />
              What is playit.gg?
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Playit.gg is a global network tunnel proxy that routes UDP traffic safely. Running the playit.gg connector lets you bypass firewall constraints. 
            </p>
            <div className="p-3.5 bg-zinc-950/60 border border-zinc-900 rounded-xl space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">Local BDS Port:</span>
                <span className="text-zinc-300 font-mono font-bold">{serverPort} (UDP)</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">Tunnel Protocol:</span>
                <span className="text-zinc-300 font-bold">Minecraft Bedrock</span>
              </div>
            </div>
          </div>

          {/* Connection Status Details Card */}
          <div className="p-6 bg-zinc-900/40 border border-zinc-900 rounded-2xl space-y-5 shadow-xl">
            <h2 className="text-base font-semibold text-white flex items-center gap-2 border-b border-zinc-800/60 pb-3">
              <Wifi className="w-4 h-4 text-blue-400" />
              Network Connection
            </h2>

            {data && !data.isDownloaded ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-xl flex gap-3 text-amber-400">
                  <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold font-sans">Binary Client Missing</p>
                    <p className="text-[11px] text-amber-500/80 leading-snug">
                      The playit companion client binary is not present in your server directories. Please download it using the action below.
                    </p>
                  </div>
                </div>

                <button
                  id="btn-download-playit"
                  onClick={handleDownloadBinary}
                  disabled={actionLoading || data.status === "downloading"}
                  className="w-full py-3 px-4 rounded-xl font-semibold text-xs border border-purple-500 bg-purple-600/10 hover:bg-purple-600 text-purple-200 hover:text-white transition-all flex items-center justify-center gap-2.5 shadow-md shadow-purple-900/25 active:scale-[0.98] cursor-pointer"
                >
                  <Download className="w-4 h-4 animate-bounce" />
                  Install playit.gg Binary
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Control Action Buttons */}
                <div className="grid grid-cols-2 gap-3.5">
                  {data?.status !== "running" && data?.status !== "starting" ? (
                    <button
                      id="play-agent"
                      onClick={() => handleControlAction("start")}
                      disabled={actionLoading}
                      className="col-span-2 py-3 px-4 rounded-xl font-bold text-xs bg-emerald-600 text-white hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 active:scale-[0.98] cursor-pointer"
                    >
                      <Play className="w-4 h-4" /> Start Tunnel Agent
                    </button>
                  ) : (
                    <>
                      <button
                        id="stop-agent"
                        onClick={() => handleControlAction("stop")}
                        disabled={actionLoading}
                        className="py-3 px-4 rounded-xl font-bold text-xs bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:text-white transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
                      >
                        <Square className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> Stop Agent
                      </button>

                      <button
                        id="restart-agent"
                        onClick={() => handleControlAction("restart")}
                        disabled={actionLoading}
                        className="py-3 px-4 rounded-xl font-bold text-xs bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:text-white transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-blue-400" /> Restart
                      </button>
                    </>
                  )}
                </div>

                {/* Tunnel Details Output / Active connection */}
                {data?.status === "running" && data.tunnelUrl && (
                  <div className="p-4 bg-emerald-950/20 border border-emerald-900/40 rounded-2xl space-y-3.5 shadow-inner">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Live Tunnel Address:
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-zinc-950 border border-zinc-800 px-3 py-2.5 rounded-xl font-mono text-[11px] text-zinc-200 font-bold select-all overflow-hidden truncate">
                        {data.tunnelUrl}
                      </div>
                      <button
                        id="btn-copy-ip"
                        onClick={() => handleCopy(data.tunnelUrl, "ip")}
                        className="p-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xl transition-all active:scale-95 cursor-pointer"
                        title="Copy Address"
                      >
                        {copiedType === "ip" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-snug">
                      Share this customized playit address with friends so they can enter it in their Bedrock Server lists to connect instantly.
                    </p>
                  </div>
                )}

                {/* Claim agent prompt if claimCode found */}
                {data?.claimCode && (
                  <div className="p-4 bg-sky-950/20 border border-sky-900/40 rounded-2xl space-y-4 shadow-xl">
                    <div className="flex items-center gap-2 text-sky-400 text-xs font-bold leading-relaxed">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      Action Required: Claim Agent
                    </div>
                    
                    <p className="text-[11px] text-zinc-300 leading-normal">
                      This agent is not registered yet. Open the link below and complete the setup to link playit to your server:
                    </p>

                    <div className="flex items-center gap-2 bg-zinc-950 border border-sky-900/30 px-3 py-2 rounded-xl">
                      <span className="text-[10px] text-zinc-500 font-bold">CODE:</span>
                      <span className="flex-1 font-mono font-bold text-xs text-sky-300 select-all tracking-wider">{data.claimCode}</span>
                      <button
                        id="btn-copy-code"
                        onClick={() => handleCopy(data.claimCode, "code")}
                        className="text-zinc-500 hover:text-zinc-300 p-1"
                      >
                        {copiedType === "code" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex flex-col gap-2">
                      <a
                        href={data.claimUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full leading-none text-center py-2.5 px-3 rounded-xl font-bold text-xs bg-sky-600 hover:bg-sky-500 text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-950/20 cursor-pointer text-center"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Claim Agent On Website
                      </a>

                      <button
                        id="btn-confirm-link"
                        onClick={() => handleControlAction("confirm_claim")}
                        disabled={actionLoading}
                        className="w-full py-2.5 px-3 rounded-xl font-bold text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Confirm Agent Association
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Terminal log Console */}
        <div className="xl:col-span-2 flex flex-col space-y-4">
          <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded-3xl flex flex-col overflow-hidden h-[600px] shadow-2xl relative">
            
            {/* Console Header bar */}
            <div className="px-6 py-4 border-b border-zinc-900 bg-zinc-900/20 flex justify-between items-center">
              <div className="flex items-center gap-2.5 text-xs text-zinc-400 font-semibold font-mono tracking-wider">
                <Terminal className="w-4 h-4 text-emerald-400" />
                PLAYIT.GG COMPANION CONSOLE LOGS
              </div>
              <button
                id="clear-playit-logs"
                onClick={handleClearLogs}
                disabled={!data?.logs || data.logs.length === 0}
                className="px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wide font-bold bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-rose-400 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3 h-3" />
                Clear Console
              </button>
            </div>

            {/* Console output viewport */}
            <div className="flex-1 overflow-y-auto p-6 font-mono text-[11px] leading-relaxed space-y-1.5 select-text bg-zinc-950 text-zinc-300">
              {data?.logs && data.logs.length > 0 ? (
                data.logs.map((log, index) => {
                  let colorClass = "text-zinc-500";
                  if (log.type === "ERROR") colorClass = "text-rose-400";
                  else if (log.type === "WARN") colorClass = "text-amber-400";
                  else if (log.type === "SUCCESS" || log.type === "CLAIM") colorClass = "text-emerald-400 font-bold";
                  else if (log.type === "SYS") colorClass = "text-sky-400";

                  return (
                    <div key={index} className="hover:bg-zinc-900/40 p-1 rounded transition-colors flex items-start gap-3 border-b border-zinc-900/10">
                      <span className="text-[10px] text-zinc-600 select-none font-mono shrink-0 pt-0.5">
                        [{log.timestamp}]
                      </span>
                      <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-extrabold select-none shrink-0 border ${
                        log.type === "ERROR" ? "bg-rose-500/10 border-rose-500/20 text-rose-400" :
                        log.type === "WARN" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                        log.type === "SUCCESS" || log.type === "CLAIM" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                        log.type === "SYS" ? "bg-sky-500/10 border-sky-500/20 text-sky-400" :
                        "bg-zinc-800/40 border-zinc-800/60 text-zinc-400"
                      }`}>
                        {log.type}
                      </span>
                      <span className={`flex-1 select-text font-mono font-medium ${colorClass} break-all white-space-pre-wrap`}>
                        {log.message}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col justify-center items-center text-zinc-600 space-y-2">
                  <Terminal className="w-8 h-8 opacity-40 animate-pulse text-zinc-500" />
                  <p className="text-[11px] font-semibold text-center uppercase tracking-wider">Console inactive. Tunnel agent stopped.</p>
                </div>
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
