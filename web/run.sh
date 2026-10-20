#!/usr/bin/env bash
# Runs the web app locally.
#
#   ./run.sh           development server with hot reload
#   ./run.sh --prod    production build, then the production server
#
# Set PORT to change the port (default 3000).

set -euo pipefail

cd "$(dirname "$0")"

port="${PORT:-3000}"
mode="dev"

case "${1:-}" in
  "") ;;
  --prod) mode="prod" ;;
  -h | --help)
    sed -n '2,8p' "$0" | sed 's/^# \{0,1\}//'
    exit 0
    ;;
  *)
    echo "Unknown option: $1 (use --prod or --help)" >&2
    exit 1
    ;;
esac

if ! command -v node > /dev/null; then
  echo "Node.js is not installed. Install Node.js 20.9 or newer (see .nvmrc)." >&2
  exit 1
fi

if ! node -e 'const [major, minor] = process.versions.node.split(".").map(Number); process.exit(major > 20 || (major === 20 && minor >= 9) ? 0 : 1)'; then
  echo "Node.js $(node --version) is too old. Install Node.js 20.9 or newer (see .nvmrc)." >&2
  exit 1
fi

if [ ! -d node_modules ] || [ package-lock.json -nt node_modules/.package-lock.json ]; then
  echo "Installing dependencies..."
  npm install
fi

if [ -z "${OPENROUTER_API_KEY:-}" ] && ! grep -qs '^OPENROUTER_API_KEY=.\+' .env.local; then
  echo "Note: OPENROUTER_API_KEY is not set, so the app will ask for a key in the browser."
  echo "      To set one, copy .env.example to .env.local and add your key."
fi

if [ "$mode" = "prod" ]; then
  npm run build
  exec npx next start --port "$port"
else
  exec npm run dev -- --port "$port"
fi
