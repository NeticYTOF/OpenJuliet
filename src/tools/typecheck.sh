#!/usr/bin/env bash
#
# OpenJuliet Type Checking Helper
# ================================
# Runs all TypeScript typechecks in sequence with clear, coloured output.
#
# Usage: bash src/tools/typecheck.sh [--watch] [--clean]
#
# Options:
#   --watch    Run typecheck:node in watch mode (useful during development)
#   --clean    Delete out/ before typechecking
#   --help     Show this help message
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
CLEAN=false

for arg in "$@"; do
  case "$arg" in
    --watch) WATCH=true ;;
    --clean) CLEAN=true ;;
    --help)
      echo "OpenJuliet Type Checking Helper"
      echo ""
      echo "Usage: bash src/tools/typecheck.sh [--watch] [--clean]"
      echo ""
      echo "Runs:  npm run typecheck:node  (main + preload)"
      echo "       npm run typecheck:web   (renderer)"
      echo ""
      echo "Options:"
      echo "  --watch    Run typecheck:node in watch mode"
      echo "  --clean    Delete out/ before typechecking"
      echo "  --help     Show this help"
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

# ── Clean ─────────────────────────────────────────────────────────────────
if [ "$CLEAN" = true ]; then
  info "Cleaning out/ directory..."
  rm -rf out/
  ok "Cleaned"
fi

# ── Run typechecks ────────────────────────────────────────────────────────
OVERALL_EXIT=0

printf "\n${BOLD}╔══════════════════════════════════════════════════════════════╗${NC}\n"
printf "${BOLD}║           OpenJuliet — TypeScript Type Checking              ║${NC}\n"
printf "${BOLD}╚══════════════════════════════════════════════════════════════╝${NC}\n"

# ── 1. Node typecheck (main + preload) ───────────────────────────────────
printf "\n${BOLD}[1/2] typecheck:node — main process + preload${NC}\n"
printf "${CYAN}${NC}  tsconfig: tsconfig.node.json\n\n"

if [ "$WATCH" = true ]; then
  info "Starting node typecheck in watch mode (press Ctrl+C to stop)..."
  npx tsc --noEmit -p tsconfig.node.json --watch
  # --watch never exits on its own; if we get here it failed to start
  fail "typecheck:node (watch) failed to start"
  OVERALL_EXIT=1
else
  if npx tsc --noEmit -p tsconfig.node.json; then
    ok "typecheck:node — PASSED"
  else
    fail "typecheck:node — FAILED (see errors above)"
    OVERALL_EXIT=1
  fi
fi

# ── 2. Web typecheck (renderer) ──────────────────────────────────────────
printf "\n${BOLD}[2/2] typecheck:web — renderer process${NC}\n"
printf "${CYAN}${NC}  tsconfig: tsconfig.web.json\n\n"

if npx tsc --noEmit -p tsconfig.web.json; then
  ok "typecheck:web — PASSED"
else
  fail "typecheck:web — FAILED (see errors above)"
  OVERALL_EXIT=1
fi

# ── Summary ──────────────────────────────────────────────────────────────
printf "\n"
if [ "$OVERALL_EXIT" -eq 0 ]; then
  printf "${GREEN}${BOLD}✅ All typechecks passed!${NC}\n"
else
  printf "${RED}${BOLD}❌ Some typechecks failed. Fix the errors above and re-run.${NC}\n"
fi

exit $OVERALL_EXIT
