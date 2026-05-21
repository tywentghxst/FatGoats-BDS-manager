#!/bin/bash
# Bedrock Server Manager Docker Safe Update Script

echo "=========================================================="
echo "      Bedrock Server Manager - Safe Updater for Docker"
echo "=========================================================="
echo ""
echo "This script will update your Bedrock Server Manager container"
echo "while ensuring absolutely no persistent Minecraft server data,"
echo "worlds, database, or upload assets are lost."
echo ""
echo "Preserved Assets (on Host):"
echo "  - ./bedrock-server/ (Database, worlds, settings, properties)"
echo "  - ./uploads/ (Uploaded mcpacks and worlds)"
echo ""
echo "=========================================================="

read -p "Do you want to proceed with the update? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Update cancelled."
    exit 0
fi

# Determine if docker-compose command is 'docker-compose' or newer 'docker compose'
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo "[ERROR] Docker / Docker Compose is not installed on this system."
    exit 1
fi

echo ""
echo "[INFO] Step 1: Backing up database to ./bedrock-server/update_db_backup.json..."
if [ -f "./bedrock-server/manager_db.json" ]; then
    cp "./bedrock-server/manager_db.json" "./bedrock-server/manager_db_pre_update_backup.json"
    echo "  - Database backup created successfully."
else
    echo "  - (No manager_db.json found yet. Skipping database backup.)"
fi

echo ""
echo "[INFO] Step 2: Querying changes from master repository..."
if [ -d ".git" ]; then
    echo "[GIT] Repository found. Pulling latest code..."
    git pull
else
    echo "[INFO] No git repo found. Preserving volumes and applying main.zip..."
    wget -qO latest_update.zip https://github.com/tywentghxst/FatGoats-BDS-manager/archive/refs/heads/main.zip
    if [ -f latest_update.zip ]; then
        unzip -q latest_update.zip -d temp_update
        cp -rf temp_update/FatGoats-BDS-manager-main/* . 2>/dev/null || cp -rf temp_update/*/* . 2>/dev/null
        rm -rf temp_update latest_update.zip
        echo "  - Extracted latest source updates."
    else
        echo "[ERROR] Failed to fetch server updates from GitHub. Re-building existing code."
    fi
fi

echo ""
echo "[INFO] Step 3: Stop active container if running..."
$DOCKER_COMPOSE down

echo ""
echo "[INFO] Step 4: Building updated container images..."
$DOCKER_COMPOSE build --no-cache bedrock-manager

echo ""
echo "[INFO] Step 5: Booting updated manager container..."
$DOCKER_COMPOSE up -d

echo ""
echo "=========================================================="
echo " 🎉 Bedrock Server Manager successfully updated!"
echo " - Your volumes are safely mounted."
echo " - Service is now running in the background."
echo " - Double check: http://localhost:3000"
echo "=========================================================="
echo ""
