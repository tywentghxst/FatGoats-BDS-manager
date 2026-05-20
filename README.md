# 🎮 Minecraft Bedrock Dedicated Server Manager

An elegant, full-stack, responsive web application for managing, configuring, installing, and maintaining Minecraft Bedrock Dedicated Servers natively. Built with React (Vite) on the frontend and an Express Node.js backend. This manager automates software installations, handles behavior/resource pack integration, manages world structures, and provides direct console interactivity.

---

## ✨ Features and Capabilities

*   **⚡ Automated Version Management**: One-click installer that automatically downloads, extracts, and permissions the required official Minecraft Bedrock Dedicated Server binary releases directly from Mojang's servers (supports Windows `.exe` and Linux native binaries).
*   **📦 Multi-Addon Batch Uploader**: Select and upload multiple `.mcpack` or `.mcaddon` packages at once. The control panel automatically manages dependency links, splits groups, and registers them.
*   **🗑️ Bulk Deletion**: Clean your server completely using the "Delete All" button, physically purging all managed behavior and resource packs from the host disk.
*   **🌍 World Structure Handler**: Upload custom `.mcworld` saves, inspect level structures, modify active properties, and back up worlds.
*   **💻 Direct Interactive Console**: View live Bedrock terminal logs, start/stop processes, run commands directly into the active server thread, and browse session task histories.
*   **🔒 Built-In Security**: Secure administrator authentication token checks, session-bound tokens, and invite-key registration guards.

---

## 🏗️ Architecture & Requirements

The server manager operates on standard Node.js and automatically detects the operating system runtime environment:
1.  **Windows Environments**: Resolves binary calls to `bedrock_server.exe` and pulls Windows Dedicate binaries.
2.  **Linux Environments**: Resolves shell loops to native `./bedrock_server` binaries with system dependency libraries.

---

## 🏁 Self-Hosting Setup: Windows Natively

Run the manager natively on your local Windows PC or dedicated virtual machine:

### 1. Prerequisites
Ensure you have **Node.js** (v18 LTS or later) installed on your system. You can download it from [Node.js Official Website](https://nodejs.org/).

### 2. Auto-Build and Install
We provide a simple Windows batch utility to bundle configurations:
*   Double-click `/build.bat` inside the folder, or invoke:
    ```cmd
    npm install
    npm run build
    ```

### 3. Launch the Server
To spin up both the Express server backend and service worker thread on port `3000`:
*   Simply execute the launcher script:
    ```cmd
    start-windows.bat
    ```
*   Now, navigate to: **`http://localhost:3000`** in any browser.

---

## 🐳 Self-Hosting Setup: Docker & Container Orchestration

Run standard Docker containers on Linux/NAS hosting rigs with full persistence volumes and isolated sandboxing.

### 1. Build Container from Source
Build the container package locally securely using:
```bash
docker build -t bedrock-manager .
```

### 2. Run Container (Docker CLI)
Launch the container and make sure to expose **both** the HTTP Web Control Panel port (`3000`) and the Bedrock dedicated server UDP game-traffic port (`19132`):
```bash
docker run -d \
  -p 3000:3000 \
  -p 19132:19132/udp \
  -v bedrock_server_data:/app/bedrock-server \
  --name mcb-manager \
  --restart unless-stopped \
  bedrock-manager
```

### 3. Compose Orchestration (Docker-Compose)
Create a file named `docker-compose.yml` in your parent setup directory:

```yaml
version: "3"
services:
  bedrock-manager:
    build: .
    container_name: mcb-manager
    ports:
      - "3000:3000"         # Web Control Dashboard UI
      - "19132:19132/udp"   # Minecraft Dedicated Game Port (UDP)
    volumes:
      - ./bedrock-server:/app/bedrock-server
    restart: unless-stopped
```

Deploy headless in background mode with single system prompt:
```bash
docker compose up -d
```

---

## 🌐 Network Port-Forwarding (Outside Network Connections)

To allow players to join your server from outside your local home network (LAN), you **must** configure port-forwarding on your internet router panel:

| Service Destination | Port | Connection Protocol | Description |
| :--- | :--- | :--- | :--- |
| **Control Panel UI** | `3000` | **TCP** | Secure Web-UI Administration panel |
| **Minecraft Game Server** | `19132` | **UDP** | Primary Bedrock Dedicated Game Port |

> ⚠️ **Important Node**: Minecraft Bedrock dedicated servers communicate almost entirely utilizing the **UDP** protocol. Make sure your router settings permit incoming UDP packets on port `19132`!

---

## 🛠️ Developer Compilation Instructions

*   **Local Development**: Run `npm run dev` to start hot-reloading components.
*   **Linter Checks**: Keep source code type-safeguarded with `npm run lint`.
*   **Production Bundling**: `npm run build` uses Vite for client chunks and `esbuild` to compile a single unified production bundle `dist/server.cjs`.
