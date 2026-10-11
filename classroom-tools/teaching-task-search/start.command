#!/bin/zsh
set -eu
TASK_DIR="${0:A:h}"
cd "$TASK_DIR"
exec python3 "$TASK_DIR/server.py" --port 8767
