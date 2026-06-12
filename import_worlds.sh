#!/bin/bash

echo "==================================================="
echo "  Minecraft Bedrock Server - Auto World Importer"
echo "==================================================="
echo

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMPORT_DIR="$SCRIPT_DIR/auto_import_worlds"
WORLDS_DIR="$SCRIPT_DIR/bedrock-server/worlds"
PROPERTIES_FILE="$SCRIPT_DIR/bedrock-server/server.properties"
DB_FILE="$SCRIPT_DIR/bedrock-server/manager_db.json"

# Ensure directories exist
if [ ! -d "$IMPORT_DIR" ]; then
    mkdir -p "$IMPORT_DIR"
    echo "Created folder: auto_import_worlds"
    echo "Please drop your .mcworld files in 'auto_import_worlds' and run this script again."
    exit 0
fi

mkdir -p "$IMPORT_DIR/imported"

# Find any .mcworld files
shopt -s nullglob
files=("$IMPORT_DIR"/*.mcworld)

if [ ${#files[@]} -eq 0 ]; then
    echo "No .mcworld files found in 'auto_import_worlds'."
    echo "Drop your files there and run this script!"
    echo
    exit 0
fi

echo "Found ${#files[@]} world(s) to import."
echo

for file in "${files[@]}"; do
    filename=$(basename "$file")
    world_name="${filename%.*}"
    
    # Clean world name
    clean_name=$(echo "$world_name" | sed 's/[^a-zA-Z0-9_-]/_/g')
    
    echo "Processing file: $filename -> Target World: $clean_name"
    
    dest_dir="$WORLDS_DIR/$clean_name"
    mkdir -p "$dest_dir"
    
    # Extract
    if command -v unzip >/dev/null 2>&1; then
        unzip -o "$file" -d "$dest_dir" >/dev/null
    else
        # fallback using python if unzip is not installed
        python3 -c "import zipfile; zip_ref = zipfile.ZipFile('$file', 'r'); zip_ref.extractall('$dest_dir')"
    fi
    
    if [ $? -eq 0 ]; then
        echo "World extracted to: $dest_dir"
        
        # Update server.properties
        if [ -f "$PROPERTIES_FILE" ]; then
            echo "Updating server.properties level-name..."
            sed -i "s/^level-name=.*/level-name=$clean_name/" "$PROPERTIES_FILE"
        fi
        
        # Update manager_db.json configuration
        if [ -f "$DB_FILE" ]; then
            echo "Updating manager_db.json configuration..."
            if command -v node >/dev/null 2>&1; then
                node -e "
                    const fs = require('fs');
                    const db = JSON.parse(fs.readFileSync('$DB_FILE', 'utf8'));
                    db.appConfig.levelName = '$clean_name';
                    fs.writeFileSync('$DB_FILE', JSON.stringify(db, null, 2));
                "
            elif command -v python3 >/dev/null 2>&1; then
                python3 -c "
import json
with open('$DB_FILE', 'r') as f:
    db = json.load(f)
db['appConfig']['levelName'] = '$clean_name'
with open('$DB_FILE', 'w') as f:
    json.dump(db, f, indent=2)
"
            fi
        fi
        
        # Archive the processed file
        mv "$file" "$IMPORT_DIR/imported/$filename"
        echo "Success: $clean_name is now active!"
        echo "---------------------------------------------------"
    else
        echo "Error: Failed to extract $filename. Skipping..."
        echo "---------------------------------------------------"
    fi
done

echo
echo "All imports completed!"
echo "If your server is running, please restart it to load the newly imported world."
echo
