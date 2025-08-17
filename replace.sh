#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  cat <<EOF
Usage: $0 <searchString> <replaceString> [filePatterns...]
Example:
  $0 'ContinuumContinuumConstants' 'Components' '*.php' '*.ts' '*.mustache' '*.less'
EOF
  exit 1
fi

# First two args are the literal strings to search for and replace with
search=$1
replace=$2
shift 2

# If no file patterns given, default to a sensible set
if [[ $# -eq 0 ]]; then
  patterns=( '*.php' '*.js' '*.ts' '*.mustache' '*.less' '*.css' '*.json' )
else
  patterns=( "$@" )
fi

echo "🔍 Replacing ‘$search’ → ‘$replace’ in:"
for pat in "${patterns[@]}"; do
  echo "   • $pat"
done
echo

# Loop over each pattern
for pat in "${patterns[@]}"; do
  # find matching files
  find . -type f -name "$pat" -print0 \
    | while IFS= read -r -d '' file; do
      # only act if the file actually contains the search string
      if grep -q "$search" "$file"; then
        echo "✏️  $file"
        sed -i "s/$search/$replace/g" "$file"
      fi
    done
done

echo
echo "✅ Done!"
