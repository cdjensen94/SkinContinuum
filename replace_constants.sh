#!/bin/bash
SKIN_DIR="./skins/Continuum"

find "$SKIN_DIR" -type f \( -name "*.php" -o -name "*.js" -o -name "*.json" -o -name "*.less" -o -name "*.mustache" \) | while read -r file; do
    count=$(grep -o 'Constants' "$file" | wc -l)
    if [[ $count -gt 0 ]]; then
        echo "Reverting $file ($count replacements)"
        sed -i 's/Constants/Constants/g' "$file"
    fi
done

