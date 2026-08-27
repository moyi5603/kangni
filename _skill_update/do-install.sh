#!/bin/bash
set -euo pipefail
SRC="/Users/edy/Documents/需求/康尼2/_skill_update/build-ant-design-b2b-app-fresh"
TARGET="$HOME/.cursor/skills/build-ant-design-b2b-app"
BACKUP="$HOME/.cursor/skills/build-ant-design-b2b-app.bak.$(date +%Y%m%d%H%M%S)"
test -f "$SRC/SKILL.md"
mkdir -p "$HOME/.cursor/skills"
if [ -e "$TARGET" ]; then mv "$TARGET" "$BACKUP"; fi
mkdir -p "$TARGET"
# copy all
ditto "$SRC" "$TARGET"
# restore .cursor folder name
if [ -d "$TARGET/_cursor_dot" ]; then
  rm -rf "$TARGET/.cursor"
  mv "$TARGET/_cursor_dot" "$TARGET/.cursor"
fi
cd "$TARGET"
rm -rf .git
git init -q
git remote add origin https://github.com/yuanyblf/build-ant-design-b2b-app.git
git fetch --depth 1 origin main
git checkout -f -B main FETCH_HEAD
for link in "$HOME/.claude/skills/build-ant-design-b2b-app" "$HOME/.codex/skills/build-ant-design-b2b-app" "$HOME/.agents/skills/build-ant-design-b2b-app"; do
  mkdir -p "$(dirname "$link")"
  ln -sfn "$TARGET" "$link"
done
echo INSTALL_OK
wc -c "$TARGET/SKILL.md"
git -C "$TARGET" log -1 --oneline
