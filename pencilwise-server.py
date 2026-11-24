"""Pencilwise server: serves the app and links iPads for live family competitions.

Run it from the pencilwise folder (or double-click "Start Pencilwise.bat"):
    python pencilwise-server.py

It serves the app on http://localhost:8000, starts a Cloudflare quick tunnel if cloudflared
is installed, and prints the address to open on the iPads. Keep the window open while you play.
Uses only the Python standard library.
"""
import json
import os
import random
import re
import shutil
import subprocess
import sys
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

PORT = int(os.environ.get('PENCILWISE_PORT', '8000'))
ROOT = os.path.dirname(os.path.abspath(__file__))
ROOM_HOURS = 12
MAX_LOG = 5000

rooms = {}
lock = threading.Lock()


def tidy():
    now = time.time()
    for code in [c for c, r in rooms.items() if now - r['touched'] > ROOM_HOURS * 3600]:
        del rooms[code]


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, fmt, *args):
        pass

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        if self.path.startswith('/live/'):
            self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def send_json(self, code, data):
        body = json.dumps(data).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json(self):
        try:
            n = int(self.headers.get('Content-Length') or 0)
            if n > 200000:
                return None
            return json.loads(self.rfile.read(n) or b'{}')
        except Exception:
            return None

    def do_GET(self):
        u = urlparse(self.path)
        if u.path.startswith('/live/'):
            return self.live_get(u)
        if u.path.endswith(('.py', '.bat')):
            return self.send_error(404)
        return super().do_GET()

    def do_POST(self):
        u = urlparse(self.path)
        if not u.path.startswith('/live/'):
            return self.send_error(404)
        body = self.read_json()
        if body is None:
            return self.send_json(400, {'ok': False, 'error': 'bad request'})
        parts = u.path.strip('/').split('/')
        with lock:
            tidy()
            if parts == ['live', 'new']:
                code = None
                for _ in range(200):
                    c = str(random.randint(1000, 9999))
                    if c not in rooms:
                        code = c
                        break
                if not code:
                    return self.send_json(503, {'ok': False, 'error': 'busy'})
                rooms[code] = {'log': [], 'touched': time.time()}
                return self.send_json(200, {'ok': True, 'code': code})
            if len(parts) == 3 and parts[0] == 'live' and parts[2] == 'act':
                room = rooms.get(parts[1])
                if not room:
                    return self.send_json(404, {'ok': False, 'error': 'no such game'})
                log = room['log']
                after = body.get('after')
                act = body.get('act')
                if not isinstance(act, dict) or not isinstance(after, int):
                    return self.send_json(400, {'ok': False, 'error': 'bad action'})
                if after != len(log):
                    return self.send_json(409, {'ok': False, 'n': len(log), 'actions': log[after:] if 0 <= after <= len(log) else log})
                if len(log) >= MAX_LOG:
                    return self.send_json(413, {'ok': False, 'error': 'game too long'})
                act['ts'] = int(time.time() * 1000)
                log.append(act)
                room['touched'] = time.time()
                return self.send_json(200, {'ok': True, 'n': len(log)})
        return self.send_json(404, {'ok': False, 'error': 'not found'})

    def live_get(self, u):
        parts = u.path.strip('/').split('/')
        if parts == ['live', 'ping']:
            return self.send_json(200, {'ok': True, 'pencilwise': True})
        if len(parts) == 2:
            with lock:
                room = rooms.get(parts[1])
                if not room:
                    return self.send_json(404, {'ok': False, 'error': 'no such game'})
                try:
                    since = int(parse_qs(u.query).get('since', ['0'])[0])
                except ValueError:
                    since = 0
                since = max(0, min(since, len(room['log'])))
                room['touched'] = time.time()
                return self.send_json(200, {'ok': True, 'n': len(room['log']), 'actions': room['log'][since:]})
        return self.send_json(404, {'ok': False, 'error': 'not found'})


def find_cloudflared():
    found = shutil.which('cloudflared')
    if found:
        return found
    home = os.path.expanduser('~')
    for p in [os.path.join(ROOT, 'cloudflared.exe'), os.path.join(home, 'Desktop', 'cloudflared.exe'), os.path.join(home, 'Downloads', 'cloudflared.exe'),
              r'C:\Program Files (x86)\cloudflared\cloudflared.exe', r'C:\Program Files\cloudflared\cloudflared.exe']:
        if os.path.exists(p):
            return p
    return None


def start_tunnel():
    exe = find_cloudflared()
    if not exe:
        print('cloudflared was not found, so there is no internet address.')
        print('The app still works on this computer at http://localhost:%d' % PORT)
        return None
    proc = subprocess.Popen([exe, 'tunnel', '--url', 'http://localhost:%d' % PORT], stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                            text=True, bufsize=1, encoding='utf-8', errors='replace')

    def watch():
        shown = False
        for line in proc.stdout:
            m = re.search(r'https://([a-z0-9-]+)\.trycloudflare\.com', line)
            if m and not shown:
                shown = True
                print('')
                print('=' * 64)
                print('  Pencilwise is ready.')
                print('')
                print('  Address for the iPads:')
                print('     ' + m.group(0))
                print('')
                print('  For a live game, type these words in the app:')
                print('     ' + m.group(1))
                print('')
                print('  Keep this window open while you play.')
                print('  Close it, or press Ctrl+C, to stop.')
                print('=' * 64)
                print('')
    threading.Thread(target=watch, daemon=True).start()
    return proc


def main():
    server = ThreadingHTTPServer(('0.0.0.0', PORT), Handler)
    print('Pencilwise server started on http://localhost:%d' % PORT)
    print('Starting the internet address. This takes about 10 seconds...')
    tunnel = None if '--no-tunnel' in sys.argv else start_tunnel()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        if tunnel:
            tunnel.terminate()
        server.server_close()
        print('Stopped.')


if __name__ == '__main__':
    main()
