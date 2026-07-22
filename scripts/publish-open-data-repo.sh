#!/usr/bin/env bash
# Publish open-data/ as its own public GitHub repo for others to clone/curl.
#
# Prerequisites:
#   gh auth login
#   git remote for the parent app already set (optional)
#
# Usage:
#   ./scripts/publish-open-data-repo.sh [owner/repo-name]
#   ./scripts/publish-open-data-repo.sh jscarpelli97/sneakerpulse-index
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OPEN="$ROOT/open-data"
NAME="${1:-sneakerpulse-index}"

if ! command -v gh >/dev/null; then
  echo "Install GitHub CLI: https://cli.github.com/"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Run: gh auth login"
  exit 1
fi

if [[ ! -f "$OPEN/spi/daily.csv" ]]; then
  echo "No open-data yet — run: npm run snapshot"
  exit 1
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

cp -R "$OPEN/." "$TMP/"
cd "$TMP"
git init -b main
git add .
git -c user.name="sneakerpulse" -c user.email="sneakerpulse@users.noreply.github.com" \
  commit -m "Initial SneakerPulse Index open data"

# Create public repo and push
if [[ "$NAME" == */* ]]; then
  gh repo create "$NAME" --public --source=. --remote=origin --push
else
  gh repo create "$NAME" --public --source=. --remote=origin --push
fi

echo ""
echo "Published. Raw CSV:"
echo "  https://raw.githubusercontent.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/main/spi/daily.csv"
