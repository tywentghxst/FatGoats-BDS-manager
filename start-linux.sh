#!/bin/bash
# Dedicated Server Manager Linux Launcher

echo "======================================================="
echo "    Minecraft Bedrock Server Manager Linux Launcher"
echo "======================================================="
echo ""

# Check for node
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed or not in your PATH."
    echo "Please download and install Node.js (v18+) before continuing."
    exit 1
fi

# Check and install node_modules
if [ ! -d "node_modules" ]; then
    echo "[INFO] First-time setup detected. Installing dependencies..."
    npm install
fi

# Check and build production distribution files
if [ ! -d "dist" ]; then
    echo "[INFO] Compiling production client assets and server bundle..."
    npm run build
fi

echo ""
echo "======================================================="
echo " 🎉 Server Web Panel is starting!"
echo " - Open your browser to: http://localhost:3000"
echo " - Log in with your administration credentials."
echo " - Complete Bedrock installation via the Software tab!"
echo "======================================================="
echo ""

npm start
