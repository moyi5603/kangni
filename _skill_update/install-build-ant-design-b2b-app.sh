#!/usr/bin/env bash
# Install / update build-ant-design-b2b-app
# MUST run in macOS Terminal.app / iTerm (outside Cursor Agent).
#
#   bash "/Users/edy/Documents/需求/康尼2/_skill_update/install-build-ant-design-b2b-app.sh"
set -euo pipefail

REPO="yuanyblf/build-ant-design-b2b-app"
BRANCH="${BRANCH:-main}"
TARGET="${TARGET:-$HOME/.cursor/skills/build-ant-design-b2b-app}"
BACKUP="$HOME/.cursor/skills/build-ant-design-b2b-app.bak.$(date +%Y%m%d%H%M%S)"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/b2b-skill-XXXXXX")"

cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

echo "==> Download $REPO@$BRANCH (tarball, no git hooks)"
curl -fsSL "https://codeload.github.com/${REPO}/tar.gz/refs/heads/${BRANCH}" -o "$TMP/skill.tgz"
mkdir -p "$TMP/extract"
tar -xzf "$TMP/skill.tgz" -C "$TMP/extract"
SRC="$(find "$TMP/extract" -mindepth 1 -maxdepth 1 -type d | head -1)"
test -f "$SRC/SKILL.md"

echo "==> Backup existing install (if any)"
mkdir -p "$(dirname "$TARGET")"
if [ -e "$TARGET" ]; then
  mv "$TARGET" "$BACKUP"
  echo "    saved: $BACKUP"
else
  echo "    (no previous install)"
fi

echo "==> Install -> $TARGET"
mv "$SRC" "$TARGET"

echo "==> Attach git remote (for future pull)"
cd "$TARGET"
git init -q
git remote add origin "https://github.com/${REPO}.git"
git fetch --depth 1 origin "$BRANCH"
git checkout -f -B "$BRANCH" "FETCH_HEAD" >/dev/null 2>&1 || git reset --hard "FETCH_HEAD"

echo "==> Softlinks"
for link in \
  "$HOME/.claude/skills/build-ant-design-b2b-app" \
  "$HOME/.codex/skills/build-ant-design-b2b-app" \
  "$HOME/.agents/skills/build-ant-design-b2b-app"
do
  mkdir -p "$(dirname "$link")"
  ln -sfn "$TARGET" "$link"
  echo "    $link"
done

echo "==> Done"
echo "    commit: $(git -C "$TARGET" log -1 --format='%h %ci %s' 2>/dev/null || echo '(no commit yet)')"
echo "    SKILL.md bytes: $(wc -c < "$TARGET/SKILL.md")"
echo
echo "Later:"
echo "  git -C \"$TARGET\" pull --ff-only"
