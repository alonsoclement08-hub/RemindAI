#!/bin/bash

# SETUP REMINDAI WORKSPACE
# This script copies all your RemindAI docs to your local workspace

echo "🚀 Setting up RemindAI workspace..."

# Create directories
mkdir -p ~/remindai-workspace/docs
cd ~/remindai-workspace

# Copy all .md files from this location
COWORK_OUTPUTS="/Users/fabrice/Library/Application Support/Claude/local-agent-mode-sessions/3b8ec5e3-4f3a-4657-97dc-946f03b400f0/68e69f7a-feab-455b-a465-e1909130dea0/local_be86ba4b-1ad0-4050-bc8b-5827ac0d7baa/outputs"

echo "📋 Copying docs from Cowork..."
cp "$COWORK_OUTPUTS"/*.md ./docs/

echo "✅ Files copied:"
ls -1 ./docs/*.md | wc -l
echo "files"

echo ""
echo "📁 Your workspace structure:"
tree -L 2 ~/remindai-workspace 2>/dev/null || find ~/remindai-workspace -type f -o -type d | head -20

echo ""
echo "🔌 Next step: Launch Claude Terminal"
echo "cd ~/remindai-workspace"
echo "claude --context ./docs/"
echo ""
echo "Then copy-paste the first prompt from START_HERE.md"
