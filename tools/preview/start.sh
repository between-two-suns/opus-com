#!/bin/sh
# Restart the local preview server (PID file based; never pattern-kills).
cd "$(dirname "$0")/.."
PIDF=${PIDF:-/tmp/bts-preview.pid}
[ -f "$PIDF" ] && kill "$(cat "$PIDF")" 2>/dev/null
sleep 0.3
nohup node preview/server.js > /tmp/bts-preview.log 2>&1 &
echo $! > "$PIDF"
sleep 1.2
echo "preview pid $(cat "$PIDF")"
