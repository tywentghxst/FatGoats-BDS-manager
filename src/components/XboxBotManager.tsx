import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Square,
  RefreshCw,
  Bot,
  Gamepad2,
  UserPlus,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ClipboardList,
  ExternalLink,
  Clock,
  Users
} from "lucide-react";

interface XboxBotManagerProps {
  token: string | null;
}

export default function XboxBotManager({ token }: XboxBotManagerProps) {
  const [botConfig, setBotConfig] = useState({
    targetIp: "",
    targetPort: 19132,
    autoAcceptFriends: true,
    enabled: false
  });

  const [botState, setBotState] = useState({
    status: "stopped",
    verification: null as null | {
      verification_uri: string;
      user_code: string;
      expires_in: number;
      message: string;
    },
    gamertag: null as string | null,
    xuid: null as string | null,
    avatarUrl: null as string | null,
    friends: [] as Array<{ xuid: string; gamertag: string; status: string }>,
    logs: [] as Array<{ timestamp: string; text: string; type: "info" | "success" | "warn" | "error" }>
  });

  const [inputIp, setInputIp] = useState("");
  const [inputPort, setInputPort] = useState("19132");
  const [friendGamertag, setFriendGamertag] = useState("");
  const [isActivelyStarting, setIsActivelyStarting] = useState(false);
  const [friendError, setFriendError] = useState("");
  const [friendSuccess, setFriendSuccess] = useState("");
  const [configSaving, setConfigSaving] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);

  const fetchBotConfig = async () => {
    try {
      const res = await fetch("/api/xbox-bot/config", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setBotConfig(data);
        if (data.targetIp) {
          setInputIp(data.targetIp);
          setInputPort(data.targetPort.toString());
        }
      }
    } catch (err) {
      console.error("Failed to fetch bot config", err);
    }
  };

  const fetchBotState = async () => {
    try {
      const res = await fetch("/api/xbox-bot/state", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setBotState(data);
      }
    } catch (err) {
      console.error("Failed to fetch bot state", err);
    }
  };

  useEffect(() => {
    fetchBotConfig();
    fetchBotState();

    const interval = setInterval(() => {
      fetchBotState();
    }, 2500);

    return () => clearInterval(interval);
  }, [token]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSaving(true);
    try {
      const res = await fetch("/api/xbox-bot/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          targetIp: inputIp,
          targetPort: parseInt(inputPort, 10),
          autoAcceptFriends: botConfig.autoAcceptFriends
        })
      });
      if (res.ok) {
        await fetchBotConfig();
      }
    } catch (err) {
      console.error("Save config error", err);
    } finally {
      setConfigSaving(false);
    }
  };

  const handleToggleAutoAccept = async () => {
    const updatedVal = !botConfig.autoAcceptFriends;
    // Optimistic update
    setBotConfig(prev => ({ ...prev, autoAcceptFriends: updatedVal }));

    try {
      await fetch("/api/xbox-bot/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          targetIp: inputIp,
          targetPort: parseInt(inputPort, 10),
          autoAcceptFriends: updatedVal
        })
      });
    } catch (err) {
      console.error("Failed to toggle auto accept", err);
    }
  };

  const handleStartBot = async () => {
    setIsActivelyStarting(true);
    try {
      await fetch("/api/xbox-bot/start", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      await fetchBotState();
    } catch (err) {
      console.error(err);
    } finally {
      setIsActivelyStarting(false);
    }
  };

  const handleStopBot = async () => {
    try {
      await fetch("/api/xbox-bot/stop", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      await fetchBotState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendGamertag.trim()) return;
    setFriendError("");
    setFriendSuccess("");

    try {
      const res = await fetch("/api/xbox-bot/add-friend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ gamertag: friendGamertag.trim() })
      });
      
      const data = await res.json();
      if (res.ok) {
        setFriendSuccess(`Successfully added friend: '${friendGamertag}'`);
        setFriendGamertag("");
        fetchBotState();
      } else {
        setFriendError(data.error || "Failed to add Xbox friend.");
      }
    } catch (err: any) {
      setFriendError("Network error when attempting to add friend.");
    }
  };

  // Get status color mappings
  const getStatusColor = () => {
    switch (botState.status) {
      case "running":
        return "bg-emerald-500/10 border-emerald-500/35 text-emerald-400";
      case "starting":
        return "bg-amber-500/10 border-amber-500/35 text-amber-400";
      case "need_verify":
        return "bg-rose-500/10 border-rose-500/35 text-rose-400 animate-pulse";
      case "error":
        return "bg-red-500/10 border-red-500/35 text-red-400";
      default:
        return "bg-zinc-800/20 border-zinc-700/30 text-zinc-400";
    }
  };

  const getStatusLabel = () => {
    switch (botState.status) {
      case "running":
        return "Bot Online";
      case "starting":
        return "Authenticating...";
      case "need_verify":
        return "Verification Required";
      case "error":
        return "Login Failure";
      default:
        return "Bot Terminated";
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto space-y-8 bg-zinc-950/40">
      
      {/* Header Block with high negative space precision */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#0d1627]/40 border border-[#152033]/50 rounded-2xl p-6 md:p-8 gap-4 shadow-[0_0_24px_rgba(0,0,0,0.2)]">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Bot className="w-6 h-6 text-indigo-400" />
            Xbox Live Redirection Bot
          </h2>
          <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
            Link a Microsoft Xbox Live account to act as a join proxy. Any console or cross-play player who friends this bot can click 'Join Game' to instantly redirect to your target Bedrock server.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border ${getStatusColor()}`}>
            ● {getStatusLabel()}
          </span>
          {botState.status !== "stopped" ? (
            <button
              id="xbox-btn-stop"
              onClick={handleStopBot}
              className="bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/30 text-rose-300 px-5 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(239,68,68,0.05)]"
            >
              <Square className="w-3.5 h-3.5" /> Stop Bot
            </button>
          ) : (
            <button
              id="xbox-btn-start"
              onClick={handleStartBot}
              disabled={isActivelyStarting}
              className={`bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 text-indigo-300 px-5 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(99,102,241,0.05)] ${
                isActivelyStarting ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <Play className="w-3.5 h-3.5" /> Start & Log In
            </button>
          )}
        </div>
      </div>

      {/* Verification prompt when needed */}
      {botState.status === "need_verify" && botState.verification && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 space-y-4 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/15 border border-amber-400/20 text-amber-400 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1 flex-1">
              <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">Microsoft Device Authentication Pending</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Xbox Live has requested dynamic verification. Please open the Microsoft code submission page and supply the code provided below.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-between bg-zinc-950/60 border border-zinc-900 rounded-xl p-4 gap-4">
            <div className="text-center sm:text-left space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">Verification Code</span>
              <div className="text-3xl font-black text-indigo-400 font-mono tracking-widest">
                {botState.verification.user_code}
              </div>
            </div>
            <a
              id="xbox-verification-url"
              href={botState.verification.verification_uri}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-[0_4px_12px_rgba(99,102,241,0.3)]"
            >
              Open Authentication Page <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* Primary Bento Grid Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        
        {/* Connection Redirect Config */}
        <div className="lg:col-span-4 bg-[#0d1321]/30 border border-[#18233a]/40 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 rounded-lg">
              <Settings className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs uppercase tracking-widest text-zinc-300">Connection Mapping</span>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Target Server IP/Host</label>
              <input
                id="xbox-input-ip"
                type="text"
                value={inputIp}
                onChange={(e) => setInputIp(e.target.value)}
                placeholder="play.example.com"
                className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-indigo-500/50 rounded-xl px-4 py-3 text-xs text-zinc-200 font-sans outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Target Server Port</label>
              <input
                id="xbox-input-port"
                type="number"
                value={inputPort}
                onChange={(e) => setInputPort(e.target.value)}
                placeholder="19132"
                className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-indigo-500/50 rounded-xl px-4 py-3 text-xs text-zinc-200 font-mono outline-none transition-all"
              />
            </div>

            <button
              id="xbox-btn-save"
              type="submit"
              disabled={configSaving}
              className="w-full bg-[#16213a] hover:bg-[#202f52] border border-[#273d6a]* text-zinc-200 px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {configSaving ? "Applying..." : "Apply Server Routing"}
            </button>
          </form>

          <div className="hr border-t border-[#18233a]/50 my-6" />

          {/* Auto Friend Accept Choice */}
          <div className="flex items-center justify-between bg-zinc-950/30 border border-zinc-900/40 rounded-xl p-4">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-zinc-300">Auto Accept Friends</div>
              <div className="text-[10px] text-zinc-500">Auto follow back followers</div>
            </div>
            <button
              id="xbox-btn-auto-accept"
              onClick={handleToggleAutoAccept}
              className={`w-12 h-6.5 rounded-full p-1 transition-all duration-300 cursor-pointer ${
                botConfig.autoAcceptFriends ? "bg-indigo-600" : "bg-zinc-800"
              }`}
            >
              <div className={`w-4.5 h-4.5 bg-white rounded-full transition-all duration-300 ${
                botConfig.autoAcceptFriends ? "translate-x-5.5" : "translate-x-0"
              }`} />
            </button>
          </div>
        </div>

        {/* Dynamic Profile Details and Friends List */}
        <div className="lg:col-span-4 bg-[#0d1321]/30 border border-[#18233a]/40 rounded-2xl p-6 flex flex-col space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs uppercase tracking-widest text-zinc-300">Identity & Friends</span>
          </div>

          {/* Xbox Live Linked Account Header */}
          {botState.gamertag ? (
            <div className="bg-zinc-950/30 border border-zinc-900/40 rounded-xl p-4 flex items-center gap-4">
              {botState.avatarUrl ? (
                <img
                  src={botState.avatarUrl}
                  alt="Avatar"
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full border border-indigo-500/20 shadow-[0_0_8px_rgba(99,102,241,0.2)]"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-indigo-950 border border-indigo-500/30 flex items-center justify-center font-black text-indigo-400">
                  {botState.gamertag[0].toUpperCase()}
                </div>
              )}
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-zinc-200">{botState.gamertag}</div>
                <div className="text-[9px] text-indigo-400 font-mono">XUID: {botState.xuid || "Unknown"}</div>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-950/15 border border-zinc-900/20 rounded-xl p-6 text-center text-zinc-500 text-xs">
              No Xbox account currently integrated.
            </div>
          )}

          {/* Add Xbox Friend utility */}
          <form onSubmit={handleAddFriend} className="space-y-2">
            <label className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Query / Add Gamertag</label>
            <div className="flex gap-2">
              <input
                id="xbox-input-friend"
                type="text"
                value={friendGamertag}
                onChange={(e) => setFriendGamertag(e.target.value)}
                placeholder="Search Gamertag..."
                className="flex-1 bg-zinc-950/60 border border-zinc-800 focus:border-indigo-500/50 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none"
              />
              <button
                id="xbox-btn-add-friend"
                type="submit"
                className="bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 px-3.5 rounded-xl text-xs transition-all flex items-center justify-center cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>
            {friendError && <div className="text-[10px] text-rose-400">{friendError}</div>}
            {friendSuccess && <div className="text-[10px] text-emerald-400">{friendSuccess}</div>}
          </form>

          {/* Friends List Status Panel */}
          <div className="flex-1 overflow-y-auto max-h-48 border border-[#18233a]/40 bg-zinc-950/20 rounded-xl p-3 space-y-2">
            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mb-1">
              Mutual Xbox Friends ({botState.friends.length})
            </div>
            {botState.friends.length > 0 ? (
              botState.friends.map((friend) => (
                <div key={friend.xuid} className="flex justify-between items-center bg-zinc-950/30 p-2 rounded-lg border border-zinc-900">
                  <span className="text-xs font-semibold text-zinc-300">{friend.gamertag}</span>
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-400">
                    <span className={`w-1.5 h-1.5 rounded-full ${friend.status === "Online" ? "bg-emerald-500 animate-pulse" : "bg-zinc-700"}`} />
                    {friend.status}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-zinc-600 text-xs">
                No active Xbox friends discovered.
              </div>
            )}
          </div>
        </div>

        {/* Logging Terminal */}
        <div className="lg:col-span-4 bg-zinc-950 border border-zinc-900 rounded-2xl p-6 flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 rounded-lg">
                <ClipboardList className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs uppercase tracking-widest text-zinc-300 font-mono">Process Terminal</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
          </div>

          <div className="flex-1 max-h-80 overflow-y-auto bg-zinc-950/80 border border-zinc-900 rounded-xl p-4 font-mono text-[10px] leading-relaxed space-y-2.5 antialiased">
            {botState.logs.length > 0 ? (
              botState.logs.map((log, index) => {
                let colorClass = "text-zinc-400";
                if (log.type === "success") colorClass = "text-emerald-400 font-semibold";
                if (log.type === "warn") colorClass = "text-amber-400";
                if (log.type === "error") colorClass = "text-red-400 font-bold";

                return (
                  <div key={index} className="flex items-start gap-2.5 leading-normal select-text">
                    <span className="text-zinc-600 shrink-0 select-none">[{log.timestamp}]</span>
                    <span className={colorClass}>{log.text}</span>
                  </div>
                );
              })
            ) : (
              <div className="text-zinc-600 py-12 text-center">
                Terminal listening. Awaiting event triggers...
              </div>
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

      </div>
    </div>
  );
}
