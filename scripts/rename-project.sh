#!/usr/bin/env bash
# =============================================================
# CyberSecureIMS - Fork & Rename Script (Phase 1)
# Run this ONCE after forking the repo on GitHub
# Usage: bash scripts/rename-project.sh
# =============================================================

set -e

echo "🔐 CyberSecureIMS - Project Rename Script"
echo "==========================================="

# Files to update
TARGET_FILES=(
  "package.json"
  "package-lock.json"
  "index.html"
  "README.md"
  "vite.config.ts"
)

# Rename strings
OLD_NAME="ComplyIMS"
NEW_NAME="CyberSecureIMS"
OLD_DESC="Food Safety Compliance Management System"
NEW_DESC="Cybersecurity Risk and Compliance Management System"
OLD_URL="food-compliance-ims.vercel.app"
NEW_URL="cybersecure-ims.vercel.app"

echo "Renaming project files..."
for file in "${TARGET_FILES[@]}"; do
  if [ -f "$file" ]; then
    sed -i "s/$OLD_NAME/$NEW_NAME/g" "$file"
    sed -i "s/$OLD_DESC/$NEW_DESC/g" "$file"
    sed -i "s/$OLD_URL/$NEW_URL/g" "$file"
    echo "  ✓ Updated $file"
  fi
done

# Update package.json name field
if [ -f "package.json" ]; then
  sed -i 's/"name": "complyims"/"name": "cybersecureims"/' package.json
  echo "  ✓ Updated package.json name"
fi

echo ""
echo "✅ Rename complete!"
echo ""
echo "Next steps:"
echo "  1. Review and commit changes: git add . && git commit -m 'chore: rename to CyberSecureIMS'"
echo "  2. Update Vercel project name in dashboard"
echo "  3. Set new environment variables in Vercel"
echo "  4. Run Supabase migrations: see supabase/migrations/"
