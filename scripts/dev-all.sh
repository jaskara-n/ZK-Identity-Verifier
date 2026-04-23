#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

API_PORT="${API_PORT:-5001}"
VERIFIER_PORT="${VERIFIER_PORT:-5050}"
WEB_PORT="${WEB_PORT:-5173}"
BACKEND_URL="${BACKEND_URL:-http://localhost:${API_PORT}}"
ZK_APP_URL="${ZK_APP_URL:-http://localhost:${WEB_PORT}}"

cyan()  { printf "\033[1;36m%s\033[0m\n" "$1"; }
green() { printf "\033[1;32m%s\033[0m\n" "$1"; }
dim()   { printf "\033[2m%s\033[0m\n"  "$1"; }

cyan "▶ ZK-ID sandbox — starting all services"

if command -v cargo >/dev/null 2>&1; then
  dim "  • Building Rust zk-node bridge…"
  yarn build:zk >/dev/null 2>&1 || dim "  (zk-node build failed — API will use JS fallback)"
else
  dim "  • cargo not found — using JS fallback proof engine"
fi

cleanup() {
  echo
  cyan "■ Stopping all services…"
  kill "${API_PID:-0}" "${VERIFIER_PID:-0}" "${WEB_PID:-0}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

(
  cd "$ROOT_DIR/apps/api"
  PORT="$API_PORT" "$ROOT_DIR/node_modules/.bin/tsx" src/index.ts
) &
API_PID=$!

(
  cd "$ROOT_DIR/apps/verifier"
  PORT="$VERIFIER_PORT" BACKEND_URL="$BACKEND_URL" ZK_APP_URL="$ZK_APP_URL" \
    "$ROOT_DIR/node_modules/.bin/tsx" src/index.ts
) &
VERIFIER_PID=$!

(
  cd "$ROOT_DIR/apps/web"
  VITE_API_URL="${BACKEND_URL}/api" VITE_VERIFIER_URL="http://localhost:${VERIFIER_PORT}" \
    "$ROOT_DIR/node_modules/.bin/vite" dev --port "$WEB_PORT"
) &
WEB_PID=$!

sleep 2
echo
green "✓ ZK-ID is live"
echo
printf "  %-18s \033[1;36m%s\033[0m\n" "End-user app:"    "http://localhost:${WEB_PORT}"
printf "  %-18s \033[1;36m%s\033[0m\n" "Partner demo:"    "http://localhost:${VERIFIER_PORT}"
printf "  %-18s \033[1;36m%s\033[0m\n" "API health:"      "http://localhost:${API_PORT}/api/health"
echo
dim "  Demo flow: open the partner demo → click \"Verify age with ZK-ID\" → approve on user app → watch the partner update."
echo

wait "$API_PID" "$VERIFIER_PID" "$WEB_PID"
