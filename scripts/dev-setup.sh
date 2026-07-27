#!/usr/bin/env bash
#
# OpenJuliet Development Setup Script
# ====================================
# Checks prerequisites, installs dependencies, and initializes the database.
#
# Usage: bash scripts/dev-setup.sh [--db-path=<path>]
#
set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Colour

# ── Helpers ──────────────────────────────────────────────────────────────
info()  { printf "${CYAN}ℹ %s${NC}\n" "$*"; }
ok()    { printf "${GREEN}✔ %s${NC}\n" "$*"; }
warn()  { printf "${YELLOW}⚠ %s${NC}\n" "$*"; }
fail()  { printf "${RED}✘ %s${NC}\n" "$*"; exit 1; }

# ── Step tracking ────────────────────────────────────────────────────────
TOTAL_STEPS=4
CURRENT_STEP=0
step() {
  CURRENT_STEP=$((CURRENT_STEP + 1))
  printf "\n${BOLD}[%d/%d] %s${NC}\n" "$CURRENT_STEP" "$TOTAL_STEPS" "$*"
}

# ── Script directory ─────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# ── Parse arguments ──────────────────────────────────────────────────────
DB_PATH=""
for arg in "$@"; do
  case "$arg" in
    --db-path=*) DB_PATH="${arg#*=}" ;;
    --help)
      echo "OpenJuliet Development Setup"
      echo ""
      echo "Usage: bash scripts/dev-setup.sh [options]"
      echo ""
      echo "Options:"
      echo "  --db-path=<path>  Custom path for the SQLite database file"
      echo "  --help            Show this help message"
      exit 0
      ;;
  esac
done

# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  Step 1: Check prerequisites                                           ║
# ╚══════════════════════════════════════════════════════════════════════════╝
step "Checking prerequisites"

# ── Node.js ───────────────────────────────────────────────────────────────
info "Checking Node.js version..."
if ! command -v node &>/dev/null; then
  fail "Node.js is not installed. Install Node.js >= 18 from https://nodejs.org"
fi

NODE_VERSION=$(node -v | sed 's/^v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  fail "Node.js >= 18 is required (found v$(node -v | sed 's/^v//')). Upgrade from https://nodejs.org"
fi
ok "Node.js $(node -v) detected"

# ── npm ───────────────────────────────────────────────────────────────────
info "Checking npm version..."
if ! command -v npm &>/dev/null; then
  fail "npm is not installed. It should come bundled with Node.js."
fi
ok "npm $(npm -v) detected"

# ── Git ───────────────────────────────────────────────────────────────────
info "Checking Git..."
if ! command -v git &>/dev/null; then
  fail "Git is not installed. Install from https://git-scm.com"
fi
ok "Git $(git --version | sed 's/git version //') detected"

# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  Step 2: Install dependencies                                          ║
# ╚══════════════════════════════════════════════════════════════════════════╝
step "Installing npm dependencies"

info "Running npm install..."
npm install
ok "Dependencies installed"

# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  Step 3: Initialize database                                           ║
# ╚══════════════════════════════════════════════════════════════════════════╝
step "Initialising the database"

if [ -n "$DB_PATH" ]; then
  info "Using custom database path: $DB_PATH"
  SEED_ARGS="--db-path=$DB_PATH"
else
  SEED_ARGS=""
fi

info "Running database migrations and seeding demo data..."
npx ts-node --project tsconfig.node.json -e "
const { init, query } = require('./src/main/database/index');
(async () => {
  try {
    await init('${DB_PATH:-}');
    console.log('Database initialized successfully');
    process.exit(0);
  } catch (err) {
    console.error('Database initialization failed:', err);
    process.exit(1);
  }
})();
" 2>/dev/null || {
  warn "Could not run seed inline; trying via compiled output..."
  if [ -f "out/main/database/index.js" ]; then
    node -e "
    const { init } = require('./out/main/database/index');
    (async () => {
      try {
        await init('${DB_PATH:-}');
        console.log('Database initialized successfully');
        process.exit(0);
      } catch (err) {
        console.error('Database initialization failed:', err);
        process.exit(1);
      }
    })();
    "
  else
    warn "Database not yet compiled. Build first with: npm run build"
    warn "Then run: node out/main/database/seed.js"
  fi
}
ok "Database ready"

# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  Step 4: Summary                                                       ║
# ╚══════════════════════════════════════════════════════════════════════════╝
step "Setup complete"

printf "\n${GREEN}${BOLD}╔══════════════════════════════════════════════════════════════╗${NC}\n"
printf "${GREEN}${BOLD}║  OpenJuliet development environment is ready!                ║${NC}\n"
printf "${GREEN}${BOLD}╚══════════════════════════════════════════════════════════════╝${NC}\n"
echo ""
echo "  Quick start:"
echo "    npm run dev          Start the Electron dev server"
echo "    npm run typecheck    Run TypeScript checks"
echo "    npm run lint         Run ESLint"
echo "    npm run test         Run tests"
echo ""
echo "  Database:"
echo "    npm run build        Compile TypeScript → JavaScript"
echo "    npm run seed         Seed demo data (after adding seed script)"
echo ""
