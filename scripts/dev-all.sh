#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Starting API, verifier app, and web app..."

if command -v cargo >/dev/null 2>&1; then
  echo "Building Rust bridge (zk-node)..."
  yarn build:zk
else
  echo "cargo not found, skipping rust bridge build and using JS fallback in API."
fi

cleanup() {
  echo "Stopping all services..."
  kill "$API_PID" "$VERIFIER_PID" "$WEB_PID" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

(
  cd "$ROOT_DIR/apps/api"
  "$ROOT_DIR/node_modules/.bin/tsx" src/index.ts
) &
API_PID=$!

(
  cd "$ROOT_DIR/apps/verifier"
  "$ROOT_DIR/node_modules/.bin/tsx" src/index.ts
) &
VERIFIER_PID=$!

(
  cd "$ROOT_DIR/apps/web"
  "$ROOT_DIR/node_modules/.bin/vite" dev --port 5173
) &
WEB_PID=$!

wait "$API_PID" "$VERIFIER_PID" "$WEB_PID"
