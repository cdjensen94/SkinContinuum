#!/bin/bash

# Extensions to process
exts="css ts"

for ext in $exts; do
  echo "Scanning for .$ext files..."
  find . -type f -name "*.$ext" | while read -r file; do
    if grep -q "vector" "$file"; then
      echo "Updating text in: $file"
      sed -i 's/vector/continuum/g' "$file"
    fi
  done
done

# Now rename files
for ext in $exts; do
  find . -type f -name "*vector*.$ext" | while read -r file; do
    newfile="${file//vector/continuum}"
    if [[ "$file" != "$newfile" ]]; then
      echo "Renaming $file to $newfile"
      mv "$file" "$newfile"
    fi
  done
done

echo "All done, my dear! The vector monkeys have nowhere left to hide. 🐒🚫"
