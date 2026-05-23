/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Users,
  Map,
  MapPin,
  Search,
  Activity,
  Shield,
  ShieldAlert,
  AlertTriangle,
  Award,
  Terminal,
  Clock,
  Skull,
  Eye,
  Plus,
  Compass,
  X,
  Compass as CompassIcon,
  Sparkles,
  UserCheck,
  UserX,
  Lock,
  Unlock,
  Key
} from "lucide-react";

interface Item {
  slot: number;
  id: string;
  name: string;
  count: number;
}

interface PlayerItem {
  name: string;
  online: boolean;
  ping: number;
  joinedAt: string;
  lastPlayed: string;
  isOp: boolean;
  isBanned: boolean;
  x: number;
  y: number;
  z: number;
  dimension: "Overworld" | "Nether" | "The End";
  health: number;
  xp: number;
  hunger: number;
  inventory: Item[];
  armor: {
    helmet: { id: string; name: string } | null;
    chestplate: { id: string; name: string } | null;
    leggings: { id: string; name: string } | null;
    boots: { id: string; name: string } | null;
  };
  enderChest: Item[];
}

interface PlayersMapProps {
  token: string | null;
  onShowMessage: (text: string, type: "success" | "error" | "info") => void;
}

const LANDMARKS: Record<string, Array<{ name: string; x: number; z: number; type: string; color: string; desc: string }>> = {
  "Overworld": [
    { name: "Spawn Point", x: 0, z: 0, type: "spawn", color: "text-emerald-400 border-emerald-500 bg-emerald-950/60", desc: "World default spawn coordinates" },
    { name: "Nether Portal Hub", x: -50, z: 120, type: "portal", color: "text-purple-400 border-purple-500 bg-purple-950/60", desc: "Main gateway to nether dimension" },
    { name: "Desert Temple", x: -350, z: -200, type: "temple", color: "text-amber-400 border-amber-500 bg-amber-950/60", desc: "Ancient desert treasure chest vaults" },
    { name: "Plains Village", x: 240, z: 180, type: "village", color: "text-orange-400 border-orange-500 bg-orange-950/60", desc: "Active trading community of villagers" },
    { name: "Stronghold", x: 800, z: -600, type: "stronghold", color: "text-red-400 border-red-500 bg-red-950/60", desc: "End Portal chamber (underground structure)" }
  ],
  "Nether": [
    { name: "Nether Hub Gate", x: -6, z: 15, type: "portal", color: "text-purple-400 border-purple-500 bg-purple-950/60", desc: "Connects with the Overworld portal" },
    { name: "Blaze Spawner Tower", x: 110, z: -72, type: "fortress", color: "text-amber-500 border-amber-600 bg-amber-950/60", desc: "Nether Fortress mob grinding coordinate" },
    { name: "Bastion Remnant", x: -230, z: -150, type: "bastion", color: "text-red-500 border-red-600 bg-red-950/60", desc: "Piglin gold vaults and housing stables" }
  ],
  "The End": [
    { name: "Spawn Platform", x: 100, z: 0, type: "spawn", color: "text-sky-400 border-sky-500 bg-sky-950/60", desc: "Default teleportation slab" },
    { name: "Central Portal Nest", x: 0, z: 0, type: "portal", color: "text-purple-400 border-purple-500 bg-purple-950/60 animate-pulse", desc: "Ender dragon nest and bedrock return fountain" },
    { name: "Outer End City", x: 1050, z: -150, type: "city", color: "text-pink-400 border-pink-500 bg-pink-950/60", desc: "Far end islands exploration and elytra tower" }
  ]
};

// Voxel helper pattern to determine display badge
const getItemIcon = (id: string) => {
  const normId = id.toLowerCase();
  
  if (normId.includes("sword")) return { icon: "⚔️", bg: "bg-sky-950/80 border-sky-500/50 text-sky-200" };
  if (normId.includes("axe") || normId.includes("pickaxe") || normId.includes("shovel") || normId.includes("shears")) {
    return { icon: "⛏️", bg: "bg-teal-950/80 border-teal-500/50 text-teal-200" };
  }
  if (normId.includes("bow") || normId.includes("arrow")) return { icon: "🏹", bg: "bg-amber-950/80 border-amber-500/50 text-amber-200" };
  if (normId.includes("helmet") || normId.includes("cap")) return { icon: "🪖", bg: "bg-zinc-900/90 border-zinc-650/80 text-zinc-200" };
  if (normId.includes("chestplate") || normId.includes("tunic") || normId.includes("elytra")) {
    return { icon: "👕", bg: "bg-indigo-950/80 border-indigo-500/50 text-indigo-200" };
  }
  if (normId.includes("leggings") || normId.includes("pants")) return { icon: "👖", bg: "bg-indigo-950/55 border-indigo-500/30 text-indigo-300" };
  if (normId.includes("boots")) return { icon: "👢", bg: "bg-zinc-900/70 border-zinc-700/60 text-zinc-300" };
  if (normId.includes("apple") || normId.includes("beef") || normId.includes("pie") || normId.includes("chicken") || normId.includes("carrot") || normId.includes("fruit")) {
    return { icon: "🍎", bg: "bg-red-950/80 border-red-500/50 text-red-200" };
  }
  if (normId.includes("diamond")) return { icon: "💎", bg: "bg-cyan-950/80 border-cyan-500/60 text-cyan-200" };
  if (normId.includes("gold") || normId.includes("totem") || normId.includes("spawn_egg") || normId.includes("beacon") || normId.includes("star") || normId.includes("wool")) {
    return { icon: "⭐", bg: "bg-yellow-950/80 border-yellow-500/50 text-yellow-300" };
  }
  if (normId.includes("torch")) return { icon: "🕯️", bg: "bg-orange-950/70 border-orange-500/50 text-orange-200" };
  if (normId.includes("bucket")) return { icon: "🪣", bg: "bg-blue-950/80 border-blue-500/50 text-blue-200" };
  if (normId.includes("ender_pearl") || normId.includes("shulker") || normId.includes("portal") || normId.includes("obsidian")) {
    return { icon: "🔮", bg: "bg-purple-950/80 border-purple-500/50 text-purple-200" };
  }
  if (normId.includes("book")) return { icon: "📖", bg: "bg-violet-950/80 border-violet-500/50 text-violet-200" };
  if (normId.includes("log") || normId.includes("plank") || normId.includes("wood")) {
    return { icon: "🪵", bg: "bg-amber-950/40 border-amber-800/40 text-amber-200" };
  }
  if (normId.includes("stone") || normId.includes("cobble") || normId.includes("netherrack") || normId.includes("coal") || normId.includes("ore") || normId.includes("debris")) {
    return { icon: "🪨", bg: "bg-zinc-850 border-zinc-700 text-zinc-300" };
  }
  
  return { icon: "📦", bg: "bg-zinc-900 border-zinc-800 text-zinc-400" };
};

export default function PlayersMap({ token, onShowMessage }: PlayersMapProps) {
  const [players, setPlayers] = useState<PlayerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerItem | null>(null);
  const [selectedDimension, setSelectedDimension] = useState<"Overworld" | "Nether" | "The End">("Overworld");
  
  // Tactical live map navigation controls
  const [mapScale, setMapScale] = useState(0.8); // Zoom scale
  const [mapCenter, setMapCenter] = useState({ x: 0, z: 0 }); // Navigation center
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [pannedSinceClick, setPannedSinceClick] = useState(false);

  // Active sub tab in the player character profile sheet
  const [playerSubTab, setPlayerSubTab] = useState<"status" | "inventory" | "enderchest">("status");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Fetch players on interval
  const fetchPlayers = async () => {
    try {
      const res = await fetch("/api/players", {
        headers: {
          Authorization: token ? `Bearer ${token}` : ""
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPlayers(data);
        
        // Sync selected player's live metrics in real-time
        if (selectedPlayer) {
          const current = data.find((p: PlayerItem) => p.name.toLowerCase() === selectedPlayer.name.toLowerCase());
          if (current) {
            setSelectedPlayer(current);
          }
        }
      }
    } catch (e) {
      console.error("Error loading players data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
    const interval = setInterval(fetchPlayers, 2000);
    return () => clearInterval(interval);
  }, [token, selectedPlayer ? selectedPlayer.name : null]);

  // Execute server-side player controls (Op, De-op, Kick, Ban)
  const handlePlayerAction = async (playerName: string, action: "op" | "deop" | "kick" | "ban" | "unban") => {
    const confirmationMsg = {
      kick: `Are you sure you want to KICK ${playerName}? They will be forced offline instantly.`,
      ban: `Are you sure you want to BAN ${playerName}? They will be kicked and barred from rejoining.`,
      unban: `Are you sure you want to PARDON ${playerName} and permit them to play again?`,
      op: `Op ${playerName}? They will gain full game operator privileges.`,
      deop: `Revoke operator privileges from ${playerName}?`
    }[action];

    if (!window.confirm(confirmationMsg)) return;

    setActionInProgress(playerName + "_" + action);
    try {
      const res = await fetch("/api/players/control", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({ name: playerName, action })
      });
      const data = await res.json();
      if (res.ok) {
        onShowMessage(`Player status updated to ${action.toUpperCase()}`, "success");
        await fetchPlayers();
      } else {
        onShowMessage(data.error || `Failed to perform ${action} on player`, "error");
      }
    } catch (err: any) {
      onShowMessage(err.message || "Failed request", "error");
    } finally {
      setActionInProgress(null);
    }
  };

  // Center live map view on coordinates
  const triggerFocusCoordinate = (x: number, z: number, dimension?: "Overworld" | "Nether" | "The End") => {
    if (dimension) {
      setSelectedDimension(dimension);
    }
    setMapCenter({ x, z });
    setMapScale(1.4); // Zoom in on coordinates focus
  };

  // SVG dimensions for tactical render canvas
  const svgWidth = 500;
  const svgHeight = 400;

  // Translate minecraft space (x, z) to tactical canvas coordinates
  const projectCoords = (mX: number, mZ: number) => {
    const cx = svgWidth / 2 + (mX - mapCenter.x) * mapScale;
    const cy = svgHeight / 2 + (mZ - mapCenter.z) * mapScale;
    return { cx, cy };
  };

  // Interactive Drag & Pan handlers for the SVG tactical map
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setPannedSinceClick(false);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
      setPannedSinceClick(true);
    }
    
    // Scale panning speed based on zoom scale
    const spacePanX = -deltaX / mapScale;
    const spacePanZ = -deltaY / mapScale;

    setMapCenter(prev => ({
      x: Math.round(prev.x + spacePanX),
      z: Math.round(prev.z + spacePanZ)
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Build grid coordinate horizontal & vertical incremental lines
  const gridSpacing = 200; // block units
  const horizontalGridLines = [];
  const verticalGridLines = [];

  // Determine span of coordinates visible in viewport
  const minVisibleX = mapCenter.x - (svgWidth / (2 * mapScale));
  const maxVisibleX = mapCenter.x + (svgWidth / (2 * mapScale));
  const minVisibleZ = mapCenter.z - (svgHeight / (2 * mapScale));
  const maxVisibleZ = mapCenter.z + (svgHeight / (2 * mapScale));

  // Round visible anchors to nearest spacing multiple
  const startGridX = Math.floor(minVisibleX / gridSpacing) * gridSpacing;
  const endGridX = Math.ceil(maxVisibleX / gridSpacing) * gridSpacing;
  const startGridZ = Math.floor(minVisibleZ / gridSpacing) * gridSpacing;
  const endGridZ = Math.ceil(maxVisibleZ / gridSpacing) * gridSpacing;

  for (let x = startGridX; x <= endGridX; x += gridSpacing) {
    verticalGridLines.push(x);
  }
  for (let z = startGridZ; z <= endGridZ; z += gridSpacing) {
    horizontalGridLines.push(z);
  }

  // Filter players based on search query
  const filteredPlayers = players.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onlinePlayers = players.filter(p => p.online);
  const offlinePlayers = players.filter(p => !p.online && !p.isBanned);
  const bannedPlayers = players.filter(p => p.isBanned);

  return (
    <div id="players-map-tab" className="space-y-6">
      
      {/* Title & Stats Summary Grid */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/20 border border-zinc-900 rounded-2xl p-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Users className="w-5 h-5 text-emerald-400" />
            Players & Tactical Live Map
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Real-time coordinates telemetry, player item visualizers, remote operator keys, and live voxel rendering.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800/30 text-emerald-400 font-bold">
            🟢 {onlinePlayers.length} ONLINE
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold">
            ⚪ {offlinePlayers.length} OFFLINE
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-red-950/40 border border-red-800/30 text-red-400 font-bold">
            ⛔ {bannedPlayers.length} BANNED
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ================= COLUMN 1: LIVE TACTICAL WORLD NAVIGATION MAP (Lg: col-span-8) ================= */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl overflow-hidden flex flex-col shadow-lg shadow-black/30">
            
            {/* Dimension Selection and Control Menu */}
            <div className="px-5 py-4 bg-zinc-900/60 border-b border-zinc-900/80 flex flex-wrap gap-4 items-center justify-between">
              
              {/* Dimension Buttons */}
              <div className="flex items-center gap-1.5 bg-zinc-950/60 p-1 rounded-xl border border-zinc-850">
                {(["Overworld", "Nether", "The End"] as const).map(dim => (
                  <button
                    key={dim}
                    onClick={() => {
                      setSelectedDimension(dim);
                      // Reset center coordinates when switching dimension maps
                      const centers = { "Overworld": { x: 0, z: 0 }, "Nether": { x: 0, z: 0 }, "The End": { x: 0, z: 0 } };
                      setMapCenter(centers[dim]);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedDimension === dim
                        ? dim === "Overworld"
                          ? "bg-emerald-600 border border-emerald-500 text-white shadow-xl"
                          : dim === "Nether"
                            ? "bg-red-700 border border-red-600 text-white shadow-xl"
                            : "bg-purple-700 border border-purple-600 text-white shadow-xl"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {dim === "Overworld" ? "🌳 Overworld" : dim === "Nether" ? "🌋 Nether" : "🌌 The End"}
                  </button>
                ))}
              </div>

              {/* Map Zoom Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMapScale(prev => Math.min(3, prev + 0.2))}
                  className="px-2.5 py-1.5 bg-zinc-850 hover:bg-zinc-800 text-white text-xs font-bold rounded-lg border border-zinc-800 transition-all cursor-pointer"
                  title="Zoom In"
                >
                  ➕
                </button>
                <button
                  type="button"
                  onClick={() => setMapScale(prev => Math.max(0.15, prev - 0.2))}
                  className="px-2.5 py-1.5 bg-zinc-850 hover:bg-zinc-800 text-white text-xs font-bold rounded-lg border border-zinc-800 transition-all cursor-pointer"
                  title="Zoom Out"
                >
                  ➖
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMapCenter({ x: 0, z: 0 });
                    setMapScale(0.8);
                  }}
                  className="px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-750 text-white text-[11px] font-bold rounded-lg border border-zinc-750 transition-all flex items-center gap-1 cursor-pointer"
                  title="Recenter World Spawn"
                >
                  <Compass className="w-3 h-3 text-emerald-400" />
                  Spawn Area
                </button>
              </div>

            </div>

            {/* Simulated Live View Map Frame */}
            <div className="relative select-none">
              
              {/* Map Overlay Canvas */}
              <svg
                width="100%"
                height={svgHeight}
                className={`bg-zinc-950 cursor-grab ${isDragging ? "cursor-grabbing" : ""}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                id="tactical-svg-canvas"
              >
                {/* 1. Procedural Dimension Terrains / Gradients Background */}
                <defs>
                  <pattern id="forest-tree" width="40" height="40" patternUnits="userSpaceOnUse">
                    <circle cx="20" cy="20" r="1.5" className="fill-emerald-800/30" />
                  </pattern>
                  <pattern id="crimson-nether" width="50" height="50" patternUnits="userSpaceOnUse">
                    <circle cx="25" cy="25" r="2" className="fill-red-800/20" />
                    <line x1="0" y1="0" x2="50" y2="50" className="stroke-red-950/20 stroke-[1]" />
                  </pattern>
                  <pattern id="end-void" width="60" height="60" patternUnits="userSpaceOnUse">
                    <circle cx="15" cy="45" r="0.8" className="fill-purple-300/20" />
                    <circle cx="45" cy="15" r="1.2" className="fill-purple-500/10 animate-pulse" />
                  </pattern>
                </defs>

                {/* Draw textured overlay according to dimension */}
                {selectedDimension === "Overworld" && (
                  <>
                    <rect width="100%" height="100%" fill="rgb(9, 21, 14)" /> {/* Oak dark green grass */}
                    <rect width="100%" height="100%" fill="url(#forest-tree)" />
                    {/* Simulated biome circles */}
                    <circle cx={projectCoords(-300, -200).cx} cy={projectCoords(-300, -200).cy} r={150 * mapScale} className="fill-yellow-600/10 stroke-yellow-500/10 stroke-[2] pointer-events-none" /> {/* Desert Biome */}
                    <circle cx={projectCoords(600, 400).cx} cy={projectCoords(600, 400).cy} r={280 * mapScale} className="fill-blue-900/15 stroke-blue-700/10 stroke-[2] pointer-events-none" /> {/* Ocean Biome */}
                    <circle cx={projectCoords(100, 200).cx} cy={projectCoords(100, 200).cy} r={180 * mapScale} className="fill-emerald-950/45 stroke-emerald-900/10 stroke-[1] pointer-events-none" /> {/* Extreme Hills */}
                  </>
                )}

                {selectedDimension === "Nether" && (
                  <>
                    <rect width="100%" height="100%" fill="rgb(24, 6, 6)" /> {/* Crimson netherrack background */}
                    <rect width="100%" height="100%" fill="url(#crimson-nether)" />
                    {/* Lava Lakes */}
                    <circle cx={projectCoords(-100, 200).cx} cy={projectCoords(-100, 200).cy} r={120 * mapScale} className="fill-amber-600/20 stroke-amber-500/10 pointer-events-none" />
                    <circle cx={projectCoords(250, -100).cx} cy={projectCoords(250, -100).cy} r={90 * mapScale} className="fill-orange-600/15 stroke-orange-500/10 pointer-events-none" />
                  </>
                )}

                {selectedDimension === "The End" && (
                  <>
                    <rect width="100%" height="100%" fill="rgb(4, 2, 8)" /> {/* Void background */}
                    <rect width="100%" height="100%" fill="url(#end-void)" />
                    {/* Floating main island geometry circle representation */}
                    <ellipse cx={projectCoords(0, 0).cx} cy={projectCoords(0, 0).cy} rx={220 * mapScale} ry={220 * mapScale} className="fill-amber-950/20 stroke-purple-900/30 stroke-[3] pointer-events-none" />
                    <circle cx={projectCoords(1000, -200).cx} cy={projectCoords(1000, -200).cy} r={140 * mapScale} className="fill-zinc-900/40 border border-purple-950/35 pointer-events-none" /> {/* Far Island */}
                  </>
                )}

                {/* 2. Grid lines & Coordinate Marks */}
                <g className="opacity-40">
                  {/* Vertical lines */}
                  {verticalGridLines.map(x => {
                    const projected = projectCoords(x, 0);
                    return (
                      <g key={`v-${x}`}>
                        <line
                          x1={projected.cx}
                          y1={0}
                          x2={projected.cx}
                          y2={svgHeight}
                          className="stroke-zinc-800/60"
                          strokeDasharray="4,4"
                        />
                        {projected.cx > 10 && projected.cx < svgWidth - 10 && (
                          <text
                            x={projected.cx + 4}
                            y={16}
                            className="fill-zinc-600 font-mono text-[9px] font-black"
                          >
                            X:{x}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Horizontal lines */}
                  {horizontalGridLines.map(z => {
                    const projected = projectCoords(0, z);
                    return (
                      <g key={`h-${z}`}>
                        <line
                          x1={0}
                          y1={projected.cy}
                          x2={svgWidth}
                          y2={projected.cy}
                          className="stroke-zinc-800/60"
                          strokeDasharray="4,4"
                        />
                        {projected.cy > 10 && projected.cy < svgHeight - 10 && (
                          <text
                            x={8}
                            y={projected.cy - 4}
                            className="fill-zinc-600 font-mono text-[9px] font-black"
                          >
                            Z:{z}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>

                {/* 3. Server Landmark Icons Overlay */}
                <g>
                  {(LANDMARKS[selectedDimension] || []).map((landmark, idx) => {
                    const { cx, cy } = projectCoords(landmark.x, landmark.z);
                    if (cx < -50 || cx > svgWidth + 50 || cy < -50 || cy > svgHeight + 50) return null;
                    return (
                      <g key={idx} className="group cursor-pointer" onClick={() => triggerFocusCoordinate(landmark.x, landmark.z)}>
                        {/* Anchor circle overlay */}
                        <circle cx={cx} cy={cy} r="6" className="fill-zinc-950 stroke-zinc-500/80 stroke-2" />
                        <circle cx={cx} cy={cy} r="3" className="fill-zinc-400" />
                        
                        {/* Map pin vector glow */}
                        <line x1={cx} y1={cy} x2={cx} y2={cy - 12} className="stroke-zinc-400 stroke-1" />
                        
                        {/* Styled Landmark Flag Box */}
                        <foreignObject x={cx - 60} y={cy - 34} width="120" height="22">
                          <div className="flex items-center justify-center">
                            <span className="px-2 py-0.5 rounded border border-zinc-800 bg-zinc-950/90 text-zinc-400 text-[8px] tracking-wider uppercase font-extrabold truncate">
                              📍 {landmark.name}
                            </span>
                          </div>
                        </foreignObject>

                        {/* Hover Description Panel popups */}
                        <title>{`${landmark.name} (X: ${landmark.x}, Z: ${landmark.z})\n---\n${landmark.desc}`}</title>
                      </g>
                    );
                  })}
                </g>

                {/* 4. Active Online Players Pins Overlay */}
                <g>
                  {players
                    .filter(p => p.online && p.dimension === selectedDimension)
                    .map((player, idx) => {
                      const { cx, cy } = projectCoords(player.x, player.z);
                      const isTargeted = selectedPlayer?.name === player.name;

                      if (cx < -50 || cx > svgWidth + 50 || cy < -50 || cy > svgHeight + 50) return null;

                      return (
                        <g
                          key={player.name || idx}
                          onClick={() => {
                            setSelectedPlayer(player);
                            setPlayerSubTab("status");
                          }}
                          className="cursor-pointer group"
                        >
                          {/* Pulse glowing circle range */}
                          <circle
                            cx={cx}
                            cy={cy}
                            r={isTargeted ? "28" : "18"}
                            className={`${isTargeted ? "fill-emerald-500/15 stroke-emerald-400/20" : "fill-emerald-500/5 stroke-emerald-500/10 group-hover:fill-emerald-500/10 group-hover:stroke-emerald-400/20"} stroke-1 transition-all duration-300`}
                          />

                          {/* Inner anchor pinpoint */}
                          <circle
                            cx={cx}
                            cy={cy}
                            r="6"
                            className="fill-emerald-400 stroke-zinc-950 stroke-[2] shadow-xl group-hover:scale-125 transition-transform"
                          />

                          {/* Arrow pointing to direction/name */}
                          <path
                            d={`M ${cx} ${cy - 5} L ${cx - 4} ${cy} L ${cx + 4} ${cy} Z`}
                            className="fill-emerald-500"
                          />

                          {/* Floating name bar tags */}
                          <foreignObject x={cx - 60} y={cy + 12} width="120" height="26">
                            <div className="flex flex-col items-center">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-black tracking-wide leading-none select-none text-white flex items-center gap-1 shadow-lg shadow-black/80 border ${
                                isTargeted
                                  ? "bg-emerald-600 border-emerald-400"
                                  : "bg-zinc-950/90 border-zinc-800 group-hover:border-emerald-500"
                              }`}>
                                {player.isOp && <span className="text-[9px]" title="Operator">👑</span>}
                                {player.name}
                              </span>
                            </div>
                          </foreignObject>

                          <title>{`${player.name} (Online)\nCoordinates: X: ${Math.round(player.x)}, Y: ${Math.round(player.y)}, Z: ${Math.round(player.z)}\nHealth: ${player.health}/20\nDimension: ${player.dimension}\nPing: ${player.ping}ms`}</title>
                        </g>
                      );
                    })}
                </g>

              </svg>

              {/* Coordinates Compass HUD indicator */}
              <div className="absolute top-4 left-4 p-3 bg-zinc-950/80 border border-zinc-850 rounded-2xl backdrop-blur-md pointer-events-none text-white select-none shadow-xl flex items-center gap-2.5 font-mono">
                <CompassIcon className="w-4 h-4 text-emerald-400 animate-spin-slow" />
                <div className="flex flex-col">
                  <span className="text-[8px] text-zinc-500 uppercase font-bold leading-none">Map Center Focal</span>
                  <span className="text-[10px] text-zinc-200 mt-0.5 font-extrabold tracking-wide">
                    X: {Math.round(mapCenter.x)} / Z: {Math.round(mapCenter.z)}
                  </span>
                </div>
              </div>

              {/* Grid instructions overlay helper */}
              <div className="absolute bottom-4 right-4 px-3 py-1 bg-zinc-950/70 border border-zinc-850/60 rounded-xl text-[9px] text-zinc-500 backdrop-blur-md select-none pointer-events-none">
                🖱️ Drag/pan tactical grid • Scroll wheel or map controls zoom
              </div>

            </div>

            {/* Quick Player Coordinate Toggles under the map */}
            <div className="p-4 bg-zinc-900/20 border-t border-zinc-900 flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Fast-Focus Coordinates:</span>
              <div className="flex flex-wrap gap-2 justify-end">
                {players.filter(p => p.online).length === 0 ? (
                  <span className="text-[10px] text-zinc-600 italic">No online players to track</span>
                ) : (
                  players.filter(p => p.online).map(p => (
                    <button
                      key={p.name}
                      onClick={() => triggerFocusCoordinate(p.x, p.z, p.dimension)}
                      className={`px-2 py-1 rounded text-[10px] font-bold border cursor-pointer transition-all ${
                        selectedPlayer?.name === p.name
                          ? "bg-emerald-950 border-emerald-700/50 text-emerald-400"
                          : "bg-zinc-850 border-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      🗣️ {p.name} ({Math.round(p.x)},{Math.round(p.z)})
                    </button>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Map details info card */}
          <div className="p-5 bg-zinc-900/20 border border-zinc-900 rounded-2xl flex items-start gap-4">
            <div className="p-2.5 bg-emerald-950/60 rounded-xl border border-emerald-800/40 text-emerald-400 shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Tactical Live Mapper Description</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Render mappings project directly from the server coordinates matrix. Landmark points indicate custom world structures configured on server startup. Drag with mouse to pan coordinates or zoom in to pinpoint player homes, base vaults, mining shafts, portals or bedrock forts.
              </p>
            </div>
          </div>

        </div>

        {/* ================= COLUMN 2: SEARCH & PLAYERS list (Lg: col-span-4) ================= */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Player Search and Directory list */}
          <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 flex flex-col space-y-4 shadow-lg">
            
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Player Directory</h3>
              <span className="text-[10px] font-mono text-zinc-650 bg-zinc-950/60 px-2 py-0.5 rounded border border-zinc-850">
                Record Count: {players.length}
              </span>
            </div>

            {/* Selector Field */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search players..."
                className="w-full pl-10 pr-4 py-2 bg-zinc-950/80 border border-zinc-850 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* List entries */}
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {filteredPlayers.length === 0 ? (
                <div className="text-center py-8 bg-zinc-950/20 border border-zinc-950 rounded-2xl text-zinc-500 italic text-xs">
                  No players match query
                </div>
              ) : (
                filteredPlayers.map((player) => {
                  const isSelected = selectedPlayer?.name === player.name;
                  return (
                    <div
                      key={player.name}
                      onClick={() => {
                        setSelectedPlayer(player);
                        setPlayerSubTab("status");
                      }}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-zinc-800/70 border-emerald-500/50 shadow-md"
                          : "bg-zinc-950/40 border-zinc-900/80 hover:bg-zinc-900/30 hover:border-zinc-800"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Player online state circle overlay */}
                        <div className="relative shrink-0">
                          <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs shadow-inner select-none ${
                            player.isBanned
                              ? "bg-red-950/50 border-red-800/40 text-red-400"
                              : player.online
                                ? "bg-emerald-950/60 border-emerald-700/50 text-emerald-400"
                                : "bg-zinc-900 border-zinc-800 text-zinc-400"
                          }`}>
                            {player.name[0]?.toUpperCase() || "P"}
                          </div>
                          {/* Small absolute indicator badge in the corner */}
                          <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-zinc-950 ${
                            player.isBanned
                              ? "bg-red-500 shadow-md"
                              : player.online
                                ? "bg-emerald-400 shadow-md animate-pulse"
                                : "bg-zinc-500 shadow-inner"
                          }`} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-black truncate leading-tight ${isSelected ? "text-white" : "text-zinc-200"}`}>
                              {player.name}
                            </span>
                            {player.isOp && (
                              <span className="text-[10px] text-amber-400" title="Operator Op Rank">👑</span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-500 block truncate mt-0.5 font-mono">
                            {player.isBanned ? (
                              <span className="text-red-500 font-semibold uppercase tracking-wider">⛔ Banned</span>
                            ) : player.online ? (
                              <span className="text-emerald-400">🟢 {player.dimension} • Ping: {player.ping}ms</span>
                            ) : (
                              <span className="text-zinc-500">⚪ Offline</span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Coordinates trigger tag */}
                      <div className="text-right shrink-0">
                        <span className="text-[9px] font-mono text-zinc-400 bg-zinc-900/60 px-1.5 py-1 rounded border border-zinc-850 block">
                          X:{Math.round(player.x)} Z:{Math.round(player.z)}
                        </span>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* ================= ACTIVE PROFILE DETAIL SHEET CARD (Only if player selected) ================= */}
          {selectedPlayer ? (
            <div className="bg-zinc-900/50 border border-zinc-805 rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-fade-in relative">
              
              {/* Header profile label */}
              <div className="px-5 py-4 bg-zinc-900 border-b border-zinc-850 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-black text-white">
                    {selectedPlayer.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      {selectedPlayer.name}
                      {selectedPlayer.isOp && <span className="text-amber-400 text-[9px]" title="Server Operator rank">👑</span>}
                    </h3>
                    <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Selected Player Profile</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPlayer(null)}
                  className="p-1 rounded bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* Sub tabs in the profile: Status & Commands vs Inventory vs Ender Chest */}
              <div className="grid grid-cols-3 border-b border-zinc-850 bg-zinc-950/20 text-center text-xs font-bold font-mono">
                <button
                  onClick={() => setPlayerSubTab("status")}
                  className={`py-2 px-1 text-[10px] tracking-wider uppercase border-r border-zinc-850/60 transition-all cursor-pointer ${
                    playerSubTab === "status"
                      ? "bg-zinc-800/40 text-emerald-400 border-b-2 border-b-emerald-400 font-extrabold"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  ⚖️ Control
                </button>
                <button
                  onClick={() => setPlayerSubTab("inventory")}
                  className={`py-2 px-1 text-[10px] tracking-wider uppercase border-r border-zinc-850/60 transition-all cursor-pointer ${
                    playerSubTab === "inventory"
                      ? "bg-zinc-800/40 text-emerald-400 border-b-2 border-b-emerald-400 font-extrabold"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  🎒 Inventory
                </button>
                <button
                  onClick={() => setPlayerSubTab("enderchest")}
                  className={`py-2 px-1 text-[10px] tracking-wider uppercase transition-all cursor-pointer ${
                    playerSubTab === "enderchest"
                      ? "bg-zinc-800/40 text-emerald-400 border-b-2 border-b-emerald-400 font-extrabold"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  🔮 Ender Chest
                </button>
              </div>

              {/* SHEET CORE CONTENTS CONTAINER */}
              <div className="p-5 max-h-[32rem] overflow-y-auto">

                {/* TAB 1: MODERATION CONTROLS AND DETAILS */}
                {playerSubTab === "status" && (
                  <div className="space-y-4">
                    
                    {/* Live Stats Telemetry Bars */}
                    <div className="grid grid-cols-3 gap-2 bg-zinc-950/40 p-3 rounded-xl border border-zinc-900 text-center">
                      
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] text-zinc-550 font-black uppercase tracking-wider">Health</span>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-red-500 text-xs">❤️</span>
                          <span className="text-xs font-mono font-bold text-zinc-200">{selectedPlayer.health}/20</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center border-x border-zinc-900">
                        <span className="text-[9px] text-zinc-550 font-black uppercase tracking-wider">EXP Rank</span>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-emerald-400 text-xs">⭐</span>
                          <span className="text-xs font-mono font-bold text-emerald-400">{selectedPlayer.xp} Lvl</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center">
                        <span className="text-[9px] text-zinc-550 font-black uppercase tracking-wider">Hunger</span>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-amber-600 text-xs">🍗</span>
                          <span className="text-xs font-mono font-bold text-zinc-200">{selectedPlayer.hunger}/20</span>
                        </div>
                      </div>

                    </div>

                    {/* Coordinates Grid */}
                    <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-900 space-y-2.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-zinc-500 font-bold uppercase tracking-wide">Live Location</span>
                        <button
                          onClick={() => triggerFocusCoordinate(selectedPlayer.x, selectedPlayer.z, selectedPlayer.dimension)}
                          className="text-emerald-400 font-black hover:text-emerald-300 text-[10px] flex items-center gap-1 cursor-pointer"
                        >
                          <MapPin className="w-3 h-3" /> Focus on Map
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-xs">
                        <div className="p-2 bg-zinc-900 border border-zinc-850 rounded">
                          <span className="text-[9px] text-zinc-500 block leading-none">X Anchor</span>
                          <span className="text-white font-extrabold block mt-1">{Math.round(selectedPlayer.x)}</span>
                        </div>
                        <div className="p-2 bg-zinc-900 border border-zinc-850 rounded">
                          <span className="text-[9px] text-zinc-500 block leading-none">Y Depth</span>
                          <span className="text-white font-extrabold block mt-1">{Math.round(selectedPlayer.y)}</span>
                        </div>
                        <div className="p-2 bg-zinc-900 border border-zinc-850 rounded">
                          <span className="text-[9px] text-zinc-500 block leading-none">Z Anchor</span>
                          <span className="text-white font-extrabold block mt-1">{Math.round(selectedPlayer.z)}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-zinc-400 pt-1">
                        <span>Universe Dimension:</span>
                        <span className="font-extrabold text-white">
                          {selectedPlayer.dimension === "Overworld" ? "🌳 Overworld" : selectedPlayer.dimension === "Nether" ? "🌋 Nether" : "🌌 The End"}
                        </span>
                      </div>
                    </div>

                    {/* Player timestamps */}
                    <div className="p-3 bg-zinc-900/30 border border-zinc-900 rounded-xl space-y-1.5 text-[10px] text-zinc-500">
                      <div className="flex justify-between">
                        <span>First Login joinedAt:</span>
                        <span className="text-zinc-300 font-mono">{new Date(selectedPlayer.joinedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Telemetry Active:</span>
                        <span className="text-zinc-300 font-mono">{selectedPlayer.online ? "Now online" : new Date(selectedPlayer.lastPlayed).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    {/* INTERACTIVE MODERATION CONTROL ACTIONS SECTION */}
                    <div className="space-y-2 border-t border-zinc-900 pt-4">
                      <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-2 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                        Administration Commands Panel
                      </h4>

                      {/* Toggle OP Rank */}
                      {selectedPlayer.isOp ? (
                        <button
                          type="button"
                          disabled={actionInProgress !== null}
                          onClick={() => handlePlayerAction(selectedPlayer.name, "deop")}
                          className="w-full px-4 py-2.5 bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          Revoke Server Operator (Deop)
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={actionInProgress !== null || selectedPlayer.isBanned}
                          onClick={() => handlePlayerAction(selectedPlayer.name, "op")}
                          className="w-full px-4 py-2.5 bg-amber-950/40 hover:bg-amber-900/40 text-amber-300 border border-amber-800/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <Award className="w-3.5 h-3.5 text-amber-400" />
                          Promote to Server Operator (Op)
                        </button>
                      )}

                      {/* Toggle Ban/Unban and Kick */}
                      {!selectedPlayer.isBanned ? (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            disabled={actionInProgress !== null || !selectedPlayer.online}
                            onClick={() => handlePlayerAction(selectedPlayer.name, "kick")}
                            className="px-4 py-2.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title={selectedPlayer.online ? "Force player to log off" : "Player is already offline"}
                          >
                            🚪 Kick Player
                          </button>

                          <button
                            type="button"
                            disabled={actionInProgress !== null}
                            onClick={() => handlePlayerAction(selectedPlayer.name, "ban")}
                            className="px-4 py-2.5 bg-red-650 hover:bg-red-600 text-white border border-red-500 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Ban Player
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={actionInProgress !== null}
                          onClick={() => handlePlayerAction(selectedPlayer.name, "unban")}
                          className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          Pardon Player (Remove Ban)
                        </button>
                      )}

                    </div>

                  </div>
                )}

                {/* TAB 2: RICH INVENTORY VIEW */}
                {playerSubTab === "inventory" && (
                  <div className="space-y-5">
                    
                    {/* Header showing armor and general count */}
                    <div className="flex gap-4 items-center bg-zinc-950/60 p-3 rounded-xl border border-zinc-900">
                      
                      {/* Armor racks layout */}
                      <div className="w-1/3 flex flex-col gap-1 text-[11px] font-mono shrink-0">
                        <span className="text-[8px] text-zinc-550 uppercase font-black tracking-widest text-center mb-1">Equipped Armor</span>
                        
                        {/* Helmet */}
                        <div className={`p-1.5 rounded-lg border text-center relative ${
                          selectedPlayer.armor.helmet ? "bg-zinc-900 border-zinc-700 text-white" : "bg-zinc-950 border-zinc-900 text-zinc-650"
                        }`} title={selectedPlayer.armor.helmet?.name || "Helmet slot Empty"}>
                          <span className="text-xs">{selectedPlayer.armor.helmet ? "🪖" : "🌑"}</span>
                          <span className="text-[8px] truncate block leading-none mt-0.5 max-w-full">
                            {selectedPlayer.armor.helmet ? selectedPlayer.armor.helmet.name.slice(0,8) : "None"}
                          </span>
                        </div>

                        {/* Chestplate */}
                        <div className={`p-1.5 rounded-lg border text-center relative ${
                          selectedPlayer.armor.chestplate ? "bg-zinc-900 border-zinc-700 text-white" : "bg-zinc-950 border-zinc-900 text-zinc-650"
                        }`} title={selectedPlayer.armor.chestplate?.name || "Chestplate slot Empty"}>
                          <span className="text-xs">{selectedPlayer.armor.chestplate ? "👕" : "🌑"}</span>
                          <span className="text-[8px] truncate block leading-none mt-0.5 max-w-full">
                            {selectedPlayer.armor.chestplate ? selectedPlayer.armor.chestplate.name.slice(0,8) : "None"}
                          </span>
                        </div>

                        {/* Leggings */}
                        <div className={`p-1.5 rounded-lg border text-center relative ${
                          selectedPlayer.armor.leggings ? "bg-zinc-900 border-zinc-700 text-white" : "bg-zinc-950 border-zinc-900 text-zinc-650"
                        }`} title={selectedPlayer.armor.leggings?.name || "Leggings slot Empty"}>
                          <span className="text-xs">{selectedPlayer.armor.leggings ? "👖" : "🌑"}</span>
                          <span className="text-[8px] truncate block leading-none mt-0.5 max-w-full">
                            {selectedPlayer.armor.leggings ? selectedPlayer.armor.leggings.name.slice(0,8) : "None"}
                          </span>
                        </div>

                        {/* Boots */}
                        <div className={`p-1.5 rounded-lg border text-center relative ${
                          selectedPlayer.armor.boots ? "bg-zinc-900 border-zinc-700 text-white" : "bg-zinc-950 border-zinc-900 text-zinc-650"
                        }`} title={selectedPlayer.armor.boots?.name || "Boots slot Empty"}>
                          <span className="text-xs">{selectedPlayer.armor.boots ? "👢" : "🌑"}</span>
                          <span className="text-[8px] truncate block leading-none mt-0.5 max-w-full">
                            {selectedPlayer.armor.boots ? selectedPlayer.armor.boots.name.slice(0,8) : "None"}
                          </span>
                        </div>

                      </div>

                      {/* Extra metadata */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <span className="text-[9px] text-zinc-500 font-bold uppercase block tracking-wider">Live Inventory Feed</span>
                        <p className="text-[10px] text-zinc-400 leading-relaxed">
                          Reflecting active player backpack items. Hotbar slots (0-8) display inside the bottom bounding border highlight.
                        </p>
                        <div className="p-2 bg-zinc-900 border border-zinc-850 rounded-lg text-emerald-400 font-mono font-bold text-[10px] text-center">
                          Total slots occupied: {selectedPlayer.inventory.length} / 36
                        </div>
                      </div>

                    </div>

                    {/* Minecraft-style inventory grids layout */}
                    <div className="space-y-4">
                      
                      {/* Main Backpack Storage grid (slots 9 to 35) (Renders 3 rows of 9 items) */}
                      <div className="space-y-1 bg-zinc-950/40 p-3 rounded-xl border border-zinc-900">
                        <span className="text-[8px] text-zinc-550 font-black uppercase tracking-widest block mb-2 text-center">Backpack Storage (Slots 9-35)</span>
                        <div className="grid grid-cols-9 gap-1 max-w-sm mx-auto">
                          {Array.from({ length: 27 }).map((_, idx) => {
                            const slotId = idx + 9;
                            const item = selectedPlayer.inventory.find(item => item.slot === slotId);
                            const iconStyle = item ? getItemIcon(item.id) : null;

                            return (
                              <div
                                key={idx}
                                className={`aspect-square rounded border flex items-center justify-center relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] transition-colors group ${
                                  item ? `${iconStyle?.bg} hover:bg-opacity-90` : "bg-zinc-900/60 border-zinc-800/50"
                                }`}
                              >
                                {item ? (
                                  <>
                                    <span className="text-sm select-none" title={item.name}>{iconStyle?.icon}</span>
                                    {item.count > 1 && (
                                      <span className="absolute -bottom-0.5 -right-0.5 bg-zinc-950/90 text-white font-mono text-[8px] font-black px-1 rounded-sm select-none border border-zinc-800 pointer-events-none line-clamp-1">
                                        {item.count}
                                      </span>
                                    )}
                                    {/* Item Hover descriptions tooltip */}
                                    <span className="absolute hidden group-hover:block transition-all duration-300 z-50 bg-zinc-950 text-white text-[8px] p-1.5 rounded border border-zinc-800 font-mono tracking-wide -top-8 whitespace-nowrap">
                                      {item.name}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-[7px] text-zinc-700 select-none font-black font-mono">{slotId}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Hotbar Slots storage grid (slots 0 to 8) (Renders 1 row of 9 items) */}
                      <div className="space-y-1 bg-emerald-950/10 p-3 rounded-xl border border-emerald-950/40">
                        <span className="text-[8px] text-emerald-500 font-black uppercase tracking-widest block mb-2 text-center">Active Hotbar (Slots 0-8)</span>
                        <div className="grid grid-cols-9 gap-1 max-w-sm mx-auto">
                          {Array.from({ length: 9 }).map((_, idx) => {
                            const slotId = idx;
                            const item = selectedPlayer.inventory.find(item => item.slot === slotId);
                            const iconStyle = item ? getItemIcon(item.id) : null;

                            return (
                              <div
                                key={idx}
                                className={`aspect-square rounded border-2 flex items-center justify-center relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] transition-colors group ${
                                  item ? `${iconStyle?.bg} hover:bg-opacity-95` : "bg-zinc-900 border-zinc-800/80"
                                }`}
                              >
                                {item ? (
                                  <>
                                    <span className="text-base select-none" title={item.name}>{iconStyle?.icon}</span>
                                    {item.count > 1 && (
                                      <span className="absolute -bottom-1 -right-1 bg-zinc-950/90 text-emerald-400 font-mono text-[8.5px] font-black px-1 rounded-sm select-none border border-emerald-900 pointer-events-none line-clamp-1">
                                        {item.count}
                                      </span>
                                    )}
                                    <span className="absolute hidden group-hover:block transition-all duration-300 z-50 bg-zinc-950 text-white text-[8px] p-1.5 rounded border border-zinc-800 font-mono tracking-wide -top-8 whitespace-nowrap">
                                      {item.name}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-[7px] text-zinc-600 select-none font-bold font-mono">{slotId}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>

                  </div>
                )}

                {/* TAB 3: ENDER CHEST GRID VIEW */}
                {playerSubTab === "enderchest" && (
                  <div className="space-y-4">
                    <div className="flex gap-4 items-center bg-purple-950/15 p-4 rounded-xl border border-purple-900/30">
                      <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-800/50 flex items-center justify-center text-purple-400 shrink-0 text-lg">
                        🔮
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-purple-400 font-black uppercase block tracking-wider">Ender Vault Storage (Slots 0-26)</span>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          Secure ender chests offer personal inter-dimensional item vaults. Vault items persist securely across the server worlds.
                        </p>
                      </div>
                    </div>

                    {/* Ender chest inventory grids 3x9 */}
                    <div className="space-y-2 bg-zinc-950/50 p-4 rounded-xl border border-purple-900/20 max-w-sm mx-auto">
                      <div className="grid grid-cols-9 gap-1.5">
                        {Array.from({ length: 27 }).map((_, idx) => {
                          const slotId = idx;
                          const item = selectedPlayer.enderChest.find(item => item.slot === slotId);
                          const iconStyle = item ? getItemIcon(item.id) : null;

                          return (
                            <div
                              key={idx}
                              className={`aspect-square rounded-lg border-2 flex items-center justify-center relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] group transition-all ${
                                item ? `${iconStyle?.bg} border-purple-500/50 hover:scale-105 shadow-purple-950/30` : "bg-zinc-900/80 border-zinc-850/80 hover:border-purple-900/30"
                              }`}
                            >
                              {item ? (
                                <>
                                  <span className="text-base select-none" title={item.name}>{iconStyle?.icon}</span>
                                  {item.count > 1 && (
                                    <span className="absolute -bottom-1 -right-1 bg-purple-950 text-purple-200 font-mono text-[8px] font-black px-1 rounded-sm border border-purple-800 pointer-events-none line-clamp-1">
                                      {item.count}
                                    </span>
                                  )}
                                  <span className="absolute hidden group-hover:block transition-all duration-300 z-50 bg-purple-950 text-white text-[8px] p-1.5 rounded border border-purple-800 font-mono tracking-wide -top-8 whitespace-nowrap">
                                    {item.name}
                                  </span>
                                </>
                              ) : (
                                <span className="text-[7px] text-purple-900/50 select-none font-bold font-mono">{slotId}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-3 bg-purple-950/5 border border-purple-900/25 rounded-xl text-[10px] text-purple-500/80 leading-relaxed italic text-center">
                      🔒 Secured via server cryptographic ender-vault schemas.
                    </div>

                  </div>
                )}

              </div>

            </div>
          ) : (
            <div className="p-10 border border-zinc-900 bg-zinc-900/10 rounded-2xl text-center text-zinc-500 italic text-xs">
              Select or hover a player from the map/directory to view inventory slots and perform commands
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
