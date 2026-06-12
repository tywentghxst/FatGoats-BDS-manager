#!/bin/bash

echo "==================================================="
echo "  Minecraft Bedrock Server - Auto Addons Installer"
echo "==================================================="
echo

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMPORT_DIR="$SCRIPT_DIR/auto_install_addons"

# Ensure directory exists
if [ ! -d "$IMPORT_DIR" ]; then
    mkdir -p "$IMPORT_DIR"
    echo "Created folder: auto_install_addons"
    echo "Please drop your .mcpack, .mcaddon or .zip files in 'auto_install_addons' and run this script again."
    exit 0
fi

# Execute node automation
node "$SCRIPT_DIR/install_addons.js"

echo
