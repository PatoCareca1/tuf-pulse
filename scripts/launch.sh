#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
binary="$project_dir/src-tauri/target/release/tuf-pulse"
if [[ ! -x "$binary" ]]; then
  printf 'Compile primeiro: npm run tauri build -- --no-bundle\n' >&2
  exit 1
fi
exec env GDK_BACKEND=x11 WEBKIT_DISABLE_DMABUF_RENDERER=1 "$binary"
