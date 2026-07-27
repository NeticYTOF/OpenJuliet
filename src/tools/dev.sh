#!/usr/bin/env bash
#
# OpenJuliet Development Helper
# =============================
# Starts the Electron + Vite dev server and optionally watches for
# file changes (linting/typechecking on save).
#
# Usage: bash src/tools/dev.sh [options]
#
# Options:
#   --watch       Enable file watcher (runs typecheck on save)
#   --no-electron Start only the Vite dev server (no Electron window)
#   --help        Show this help message
#

set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ── Helpers ──────────────────────────────────────────────────────────────
info()  { printf "${CYAN}ℹ %s${NC}\n" "$*"; }
ok()    { printf "${GREEN}✔ %s${NC}\n" "$*"; }
warn()  { printf "${YELLOW}⚠ %s${NC}\n" "$*"; }
fail()  { printf "${RED}✘ %s${NC}\n" "$*"; }

# ── Parse flags ──────────────────────────────────────────────────────────
WATCH=false
NO_ELECTRON=false

for arg in "$@"; do
  case "$arg" in
    --watch)     WATCH=true ;;
    --no-electron) NO_ELECTRON=true ;;
    --help)
      echo "OpenJuliet Development Helper"
      echo ""
      echo "Usage: bash src/tools/dev.sh [options]"
      echo ""
      echo "Options:"
      echo "  --watch        Watch for file changes (runs typecheck on save)"
      echo "  --no-electron  Start only Vite, no Electron window"
      echo "  --help         Show this help"
      exit 0
      ;;
  esac
done

# ── Script directory ─────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

if [ ! -f "package.json" ]; then
  fail "package.json not found — are you in the project root?"
  exit 1
fi

# ── Pre-flight check ─────────────────────────────────────────────────────
if ! command -v npx &>/dev/null; then
  fail "npx is not available. Make sure Node.js and npm are installed."
  exit 1
fi

printf "\n${BOLD}╔══════════════════════════════════════════════════════════════╗${NC}\n"
printf "${BOLD}║            OpenJuliet — Development Environment              ║${NC}\n"
printf "${BOLD}╚══════════════════════════════════════════════════════════════╝${NC}\n\n"

# ── 1. Start Vite dev server ──────────────────────────────────────────────
info "Starting electron-vite dev server..."
info "  Electron: $([ "$NO_ELECTRON" = false ] && echo 'yes' || echo 'no (Vite only)')"
info "  Watcher:  $([ "$WATCH" = true ] && echo 'enabled' || echo 'disabled')"
echo ""

ELECTRON_VITE_ARGS=""
if [ "$NO_ELECTRON" = true ]; then
  ELECTRON_VITE_ARGS="--no-electron"
fi

# Start electron-vite dev in background
npx electron-vite dev $ELECTRON_VITE_ARGS &
VITE_PID=$!
ok "electron-vite started (PID: $VITE_PID)"

# ── 2. Optional: Watch for file changes ───────────────────────────────────
if [ "$WATCH" = true ]; then
  info "Starting file watcher (tsc typecheck on changes)..."
  echo ""

  # Use tsc --watch for node typecheck in the background
  npx tsc --noEmit -p tsconfig.node.json --watch &
  TSC_NODE_PID=$!

  npx tsc --noEmit -p tsconfig.web.json --watch &
  TSC_WEB_PID=$!

  ok "TypeScript watchers started"
  info "  node watcher (PID: $TSC_NODE_PID)"
  info "  web watcher  (PID: $TSC_WEB_PID)"
fi

# ── 3. Trap cleanup ───────────────────────────────────────────────────────
cleanup() {
  echo ""
  warn "Shutting down development environment..."

  kill "$VITE_PID" 2>/dev/null || true

  if [ "$WATCH" = true ]; then
    kill "$TSC_NODE_PID" 2>/dev/null || true
    kill "$TSC_WEB_PID" 2>/dev/null || true
  fi

  ok "All processes stopped."
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# ── 4. Wait for processes ─────────────────────────────────────────────────
printf "\n${GREEN}${BOLD}✅ Development environment is running!${NC}\n"
printf "${CYAN}   Press Ctrl+C to stop all processes.${NC}\n"
echo ""

# Wait for Vite dev server — if it exits, we stop everything
wait "$VITE_PID" 2>/dev/null || true
fail "electron-vite exited unexpectedly."
exit 1
