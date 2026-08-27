#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TARGET="/Applications/課跡.app"

BUILT_APP=""
for candidate in "$PROJECT_ROOT"/release/課跡-darwin-*/課跡.app; do
  if [[ -d "$candidate" ]]; then
    BUILT_APP="$candidate"
    break
  fi
done

if [[ -z "$BUILT_APP" ]]; then
  print -u2 "找不到已打包的課跡.app，請先執行 npm run desktop:package。"
  exit 1
fi

if [[ -e "$TARGET" ]]; then
  BACKUP_DIR="$PROJECT_ROOT/release/backups"
  mkdir -p "$BACKUP_DIR"
  STAMP="$(date +%Y%m%d-%H%M%S)"
  mv "$TARGET" "$BACKUP_DIR/課跡-$STAMP.app"
  print "已保留舊版本：$BACKUP_DIR/課跡-$STAMP.app"
fi

ditto --rsrc --extattr --acl "$BUILT_APP" "$TARGET"
print "已安裝：$TARGET"
open "$TARGET"
