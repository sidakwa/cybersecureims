#!/bin/bash

echo "🎨 Applying SEACOM theme to all pages..."

# Update all page components to use white backgrounds and navy text
find src/pages -name "*.tsx" -type f -exec sed -i '' \
  -e 's/bg-gray-900/bg-white/g' \
  -e 's/bg-gray-800/bg-gray-50/g' \
  -e 's/bg-gray-700/bg-gray-100/g' \
  -e 's/text-white/text-[#0D2240]/g' \
  -e 's/text-gray-300/text-gray-600/g' \
  -e 's/text-gray-400/text-gray-500/g' \
  -e 's/border-gray-800/border-gray-200/g' \
  -e 's/border-gray-700/border-gray-200/g' \
  {} \;

echo "✅ Theme applied to all pages"
