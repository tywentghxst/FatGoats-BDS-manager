/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BedrockServerStatus {
  status: 'stopped' | 'starting' | 'running' | 'stopping';
  version: string;
  uptime: string;
  cpuUsage: number;
  memoryUsage: number;
  memoryTotal: number;
  tps: number;
  activePlayers: number;
  maxPlayers: number;
  ipAddress: string;
  port: number;
  worldName: string;
}

export type PackType = 'behavior' | 'resource' | 'world';

export interface AddonMetadata {
  uuid: string;
  version: number[];
  name: string;
  description: string;
  type: PackType;
  icon?: string; // Base64 png data
  folderName: string;
  isEnabled: boolean;
  originalName?: string;
  groupId?: string;
  uploadedAt?: string;
  downloadUrl?: string;
}

export interface BedrockWorld {
  name: string;
  folderName: string;
  sizeBytes: number;
  activeBehaviorPacks: { pack_id: string; version: number[] }[];
  activeResourcePacks: { pack_id: string; version: number[] }[];
}

export interface UserAccount {
  username: string;
  role: 'admin' | 'viewer';
  registeredAt: string;
}

export interface TaskLog {
  id: string;
  name: string;
  description: string;
  progress: number; // 0 to 100
  status: 'pending' | 'running' | 'completed' | 'failed';
  message: string;
  timestamp: string;
}

export interface ConsoleLine {
  timestamp: string;
  type: 'INFO' | 'WARN' | 'ERROR' | 'PLAYER' | 'SYS';
  message: string;
}

export interface BedrockVersion {
  version: string;
  releaseDate: string;
  isLatest: boolean;
  downloadUrl: string;
}

export interface AppConfig {
  bentoStyle: boolean;
  serverPort: number;
  maxPlayers: number;
  levelName: string;
  difficulty: string;
  gamemode: string;
  simulationMode?: boolean;
  selectedVersion: string;
  serverName?: string;
  emitServerTelemetry?: boolean;
  onlineMode?: boolean;
  allowCheats?: boolean;
  viewDistance?: number;
  tickDistance?: number;
}

export interface UserInvite {
  token: string;
  role: 'admin' | 'viewer';
  createdAt: string;
  used: boolean;
  usedBy?: string;
}

export interface QuickCommand {
  id: string;
  name: string;
  command: string;
  color: string;
  icon: string;
}


