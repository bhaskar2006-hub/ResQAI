#!/usr/bin/env bash
set -e
echo "Starting ResQ AI — Backend (port 5000) + Frontend (port 3000)"
echo "---"

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Backend
cd "$ROOT"
node backend/server.js &
BACKEND_PID=$!
echo "Backend started (PID: $BACKEND_PID)"

# Frontend
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!
echo "Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "=== ResQ AI running ==="
echo "  Frontend : http://localhost:3000"
echo "  Backend  : http://localhost:5000"
echo "  Press Ctrl+C to stop both."
echo ""

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM
wait
