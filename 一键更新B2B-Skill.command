#!/bin/bash
set -euo pipefail
clear
echo "========================================"
echo " 更新 build-ant-design-b2b-app Skill"
echo "========================================"
echo
REPO="yuanyblf/build-ant-design-b2b-app"
TARGET="$HOME/.cursor/skills/build-ant-design-b2b-app"
BACKUP="$HOME/.cursor/skills/build-ant-design-b2b-app.bak.$(date +%Y%m%d%H%M%S)"
TMP="$(mktemp -d /tmp/b2b-skill-XXXXXX)"

echo "[1/4] 下载最新版本…"
curl -fsSL "https://codeload.github.com/${REPO}/tar.gz/refs/heads/main" -o "$TMP/s.tgz"

echo "[2/4] 解压…"
mkdir -p "$TMP/x"
tar -xzf "$TMP/s.tgz" -C "$TMP/x"
SRC="$(find "$TMP/x" -mindepth 1 -maxdepth 1 -type d | head -1)"

echo "[3/4] 安装到 $TARGET …"
mkdir -p "$HOME/.cursor/skills"
if [ -e "$TARGET" ]; then
  mv "$TARGET" "$BACKUP"
  echo "      旧版已备份: $BACKUP"
fi
mv "$SRC" "$TARGET"

echo "[4/4] 配置 git 与软链接…"
cd "$TARGET"
rm -rf .git
git init -q
git remote add origin "https://github.com/${REPO}.git"
git fetch --depth 1 origin main
git checkout -f -B main FETCH_HEAD >/dev/null

for link in \
  "$HOME/.claude/skills/build-ant-design-b2b-app" \
  "$HOME/.codex/skills/build-ant-design-b2b-app" \
  "$HOME/.agents/skills/build-ant-design-b2b-app"
do
  mkdir -p "$(dirname "$link")"
  ln -sfn "$TARGET" "$link"
done

rm -rf "$TMP"
echo
echo "✅ 更新成功！"
echo "   版本: $(git -C "$TARGET" log -1 --format='%h %ci %s')"
echo "   大小: $(wc -c < "$TARGET/SKILL.md") 字节"
echo
read -n 1 -s -r -p "按任意键退出…"
echo
