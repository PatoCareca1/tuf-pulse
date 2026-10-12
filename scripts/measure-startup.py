#!/usr/bin/env python3
"""Local Hyprland benchmark: launch, read diagnosis, idle, close our own window.
Never applies lighting or saves profiles. Does not evict OS/WebKit caches.
Requires builds with startup_marker and host /proc + Hyprland access.
"""
import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import time

ROOT = Path(__file__).resolve().parents[1]
TICKS = os.sysconf('SC_CLK_TCK')

def processes():
    found = {}
    for path in Path('/proc').glob('[0-9]*/stat'):
        try:
            raw = path.read_text()
            fields = raw[raw.rindex(')') + 2:].split()
            found[int(path.parent.name)] = {
                'ppid': int(fields[1]), 'ticks': int(fields[11]) + int(fields[12]),
                'start': fields[19], 'name': raw[raw.index('(') + 1:raw.rindex(')')],
            }
        except (OSError, ValueError, IndexError):
            continue
    return found

def tree(table, root):
    ids = {root} if root in table else set()
    while True:
        more = {pid for pid, data in table.items() if data['ppid'] in ids}
        if more <= ids:
            return ids
        ids |= more

def memory(ids):
    rows = []
    for pid in ids:
        try:
            values = {}
            for line in Path(f'/proc/{pid}/smaps_rollup').read_text().splitlines():
                if ':' in line:
                    key, value = line.split(':', 1)
                    if key in ('Rss', 'Pss'):
                        values[key] = int(value.split()[0])
            rows.append({'pid': pid, 'name': Path(f'/proc/{pid}/comm').read_text().strip(), **values})
        except OSError:
            continue
    return rows

def clients():
    result = subprocess.run(['hyprctl', '-j', 'clients'], capture_output=True, text=True, check=True)
    return json.loads(result.stdout)

def run(binary, number, idle_seconds):
    existing = [p for p, data in processes().items() if data['name'] == 'tuf-pulse']
    if existing:
        raise RuntimeError(f'Close existing TUF Pulse before measuring: {existing}')
    env = {**os.environ, 'GDK_BACKEND': 'x11', 'WEBKIT_DISABLE_DMABUF_RENDERER': '1', 'TUF_PULSE_MEASURE': '1'}
    with tempfile.TemporaryFile(mode='w+') as log:
        started = time.monotonic()
        app = subprocess.Popen([str(binary)], env=env, stdout=log, stderr=log)
        try:
            seen = {}
            mapped_ms = None
            window = None
            metrics = {}
            while time.monotonic() - started < 15:
                table = processes()
                seen.update({pid: table[pid]['start'] for pid in tree(table, app.pid)})
                if window is None:
                    window = next((c for c in clients() if c['pid'] == app.pid), None)
                    if window:
                        mapped_ms = (time.monotonic() - started) * 1000
                log.seek(0)
                output = log.read()
                metrics = dict((phase, float(ms)) for phase, ms in re.findall(r'TUF_PULSE_METRIC (rendered|ready) ([\d.]+)', output))
                if 'ready' in metrics and window:
                    break
                if app.poll() is not None:
                    raise RuntimeError(f'App exited early ({app.returncode}): {output}')
                time.sleep(.05)
            if 'ready' not in metrics or not window:
                raise RuntimeError(f'Startup timeout: {output}')
            ready_table = processes()
            ready_ids = tree(ready_table, app.pid)
            ready_rows = memory(ready_ids)
            ready_cpu = sum(ready_table[pid]['ticks'] for pid in ready_ids) / TICKS
            # Let startup activity settle, then measure a fixed idle interval.
            time.sleep(2)
            before = processes()
            ids = tree(before, app.pid)
            seen.update({pid: before[pid]['start'] for pid in ids})
            rows = memory(ids)
            tick_before = sum(before[pid]['ticks'] for pid in ids)
            idle_start = time.monotonic()
            time.sleep(idle_seconds)
            after = processes()
            ids_after = tree(after, app.pid)
            seen.update({pid: after[pid]['start'] for pid in ids_after})
            tick_after = sum(after[pid]['ticks'] for pid in ids_after)
            idle_elapsed = time.monotonic() - idle_start
            close_start = time.monotonic()
            code = 'hl.dispatch(hl.dsp.window.close({ window = ' + json.dumps('address:' + window['address']) + ' }))'
            dispatched = subprocess.run(['hyprctl', 'eval', code], check=True, capture_output=True, text=True)
            print(json.dumps({'phase':'closing','pid':app.pid,'metrics':metrics,'pss_mib':sum(row.get('Pss',0) for row in rows)/1024,'dispatch':dispatched.stdout}),flush=True)
            try:
                app.wait(timeout=30)
            except subprocess.TimeoutExpired:
                log.seek(0)
                output=log.read()
                state=clients()
                app.terminate()
                app.wait(timeout=5)
                raise RuntimeError(f'Close timeout; clients={state}; logs={output}')
            close_ms = (time.monotonic() - close_start) * 1000
            time.sleep(2)
            remaining = processes()
            survivors = [pid for pid, start in seen.items() if pid in remaining and remaining[pid]['start'] == start]
            return {
                'build': binary.parent.name, 'run': number, 'pid': app.pid,
                'mapped_observed_ms': mapped_ms, 'from_rust_main_ms': metrics,
                'ready_pss_mib': sum(row.get('Pss', 0) for row in ready_rows) / 1024,
                'cpu_seconds_at_ready': ready_cpu,
                'idle_pss_mib': sum(row.get('Pss', 0) for row in rows) / 1024,
                'idle_rss_sum_mib': sum(row.get('Rss', 0) for row in rows) / 1024,
                'idle_cpu_percent_one_core': (tick_after - tick_before) / TICKS / idle_elapsed * 100,
                'startup_cpu_seconds_at_idle': tick_before / TICKS,
                'memory_processes': rows, 'close_parent_ms': close_ms,
                'survivor_pids_after_2s': survivors,
            }
        finally:
            # On an invalid measurement, clean up only the instance we launched.
            if app.poll() is None:
                app.terminate()
                app.wait(timeout=5)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--build', choices=('debug', 'release'), required=True)
    parser.add_argument('--runs', type=int, default=3)
    parser.add_argument('--idle-seconds', type=float, default=5)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    binary = ROOT / 'src-tauri' / 'target' / args.build / 'tuf-pulse'
    results = []
    reads = {}
    for command in (['info', '--show-supported'], ['leds', 'get']):
        samples = []
        for _ in range(5):
            start = time.monotonic()
            subprocess.run(['/usr/bin/asusctl', *command], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, timeout=8)
            samples.append((time.monotonic() - start) * 1000)
        reads[' '.join(command)] = samples
    for number in range(1, args.runs + 1):
        result = run(binary, number, args.idle_seconds)
        results.append(result)
        args.output.write_text(json.dumps({'binary_bytes': binary.stat().st_size, 'asusctl_read_ms': reads, 'results': results}, indent=2) + '\n')
        print(json.dumps(result), flush=True)

if __name__ == '__main__':
    main()
