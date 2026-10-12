#!/usr/bin/env bash
# Read-only baseline. No sudo, environment dump, serial numbers or mutations.
set -uo pipefail

printf 'TUF Pulse — diagnóstico local\n'
printf 'Kernel: '
uname -r
for field in product_name board_name; do
  if [[ -r "/sys/class/dmi/id/$field" ]]; then
    printf '%s: ' "$field"
    cat "/sys/class/dmi/id/$field"
  fi
done

if ! command -v asusctl >/dev/null 2>&1; then
  printf 'asusctl não encontrado. Nenhuma alteração executada.\n'
  exit 1
fi

if command -v systemctl >/dev/null 2>&1; then
  printf 'asusd: '
  systemctl is-active asusd.service || true
fi

printf '\nCapacidades anunciadas pelo asusctl:\n'
if command -v timeout >/dev/null 2>&1; then
  timeout 15s asusctl info --show-supported
else
  asusctl info --show-supported
fi
