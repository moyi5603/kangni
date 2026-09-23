#!/usr/bin/env bash
# Install SpaceZephyr/pm-skills into ~/.cursor/skills (flatten advisory suite).
set -euo pipefail

DEST="${1:-$HOME/.cursor/skills}"
TMP="$(mktemp -d /tmp/pm-skills.XXXXXX)"
trap 'rm -rf "$TMP"' EXIT

echo "clone SpaceZephyr/pm-skills → $TMP"
git clone --depth 1 https://github.com/SpaceZephyr/pm-skills.git "$TMP/repo"

mkdir -p "$DEST"

copy_skill() {
  local src="$1"
  local name
  name="$(basename "$src")"
  rm -rf "$DEST/$name"
  cp -R "$src" "$DEST/$name"
  echo "installed $name"
}

for d in \
  pm-master pm-prd-writer pm-review-board pm-prioritization-engine \
  pm-roadmap-planner pm-analytics pm-experiment-designer \
  pm-tracking-spec-writer pm-survey-designer pm-competitor-deconstructor \
  pm-postmortem-writer pm-image2proto pm-image2pencil pm-url2proto
do
  copy_skill "$TMP/repo/$d"
done

for d in \
  pm-advisory-board pm-advisor-cagan pm-advisor-torres pm-advisor-yujun \
  pm-method-mom-test pm-method-story-mapping pm-method-build-trap
do
  copy_skill "$TMP/repo/pm-advisory-suite/$d"
done

echo "done → $DEST"
find "$DEST" -maxdepth 2 -name SKILL.md | grep '/pm-' | sort
