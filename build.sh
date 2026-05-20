#!/bin/bash
# Exit on error
set -e

echo "======================================================="
echo "    Minecraft Bedrock Server Manager Build Script"
echo "======================================================="
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed or not in your PATH. Please download and install Node.js."
    exit 1
fi

echo "[1/2] Installing application npm dependencies..."
npm install

echo "[2/2] Building frontend assets and server bundle..."
npm run build

echo ""
echo "======================================================="
echo " Build successful!"
echo " Run 'npm start' or 'npm run dev' to launch the web client."
echo "======================================================="
