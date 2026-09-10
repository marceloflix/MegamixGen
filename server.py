#!/usr/bin/env python3
"""
MegamixGen Local Server with Authoritative GetSongBPM API Proxy & Zero Guessing Mode
Serves static assets and provides:
GET /api/lookup?artist=...&title=...&api_key=...

When no api_key is provided, returns { "status": "no_api_key" } without scraping.
When api_key is provided, queries GetSongBPM official API and translates key to Camelot.
"""

import http.server
import socketserver
import urllib.parse
import urllib.request
import json
import re
import os
import sys

PORT = 8080
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

# ── Camelot Wheel Mapping ──
CAMELOT_MAP = {
    # Minor Keys (A Wheel)
    'AB MINOR': '1A', 'G# MINOR': '1A', 'ABM': '1A', 'G#M': '1A',
    'EB MINOR': '2A', 'D# MINOR': '2A', 'EBM': '2A', 'D#M': '2A',
    'BB MINOR': '3A', 'A# MINOR': '3A', 'BBM': '3A', 'A#M': '3A',
    'F MINOR': '4A', 'FM': '4A',
    'C MINOR': '5A', 'CM': '5A',
    'G MINOR': '6A', 'GM': '6A',
    'D MINOR': '7A', 'DM': '7A',
    'A MINOR': '8A', 'AM': '8A',
    'E MINOR': '9A', 'EM': '9A',
    'B MINOR': '10A', 'BM': '10A',
    'F# MINOR': '11A', 'GB MINOR': '11A', 'F#M': '11A', 'GBM': '11A',
    'C# MINOR': '12A', 'DB MINOR': '12A', 'C#M': '12A', 'DBM': '12A',

    # Major Keys (B Wheel)
    'B MAJOR': '1B', 'B': '1B', 'B MAJ': '1B',
    'F# MAJOR': '2B', 'GB MAJOR': '2B', 'F#': '2B', 'GB': '2B', 'F# MAJ': '2B', 'GB MAJ': '2B',
    'C# MAJOR': '3B', 'DB MAJOR': '3B', 'C#': '3B', 'DB': '3B', 'C# MAJ': '3B', 'DB MAJ': '3B',
    'AB MAJOR': '4B', 'G# MAJOR': '4B', 'AB': '4B', 'G#': '4B', 'AB MAJ': '4B', 'G# MAJ': '4B',
    'EB MAJOR': '5B', 'D# MAJOR': '5B', 'EB': '5B', 'D#': '5B', 'EB MAJ': '5B', 'D# MAJ': '5B',
    'BB MAJOR': '6B', 'A# MAJOR': '6B', 'BB': '6B', 'A#': '6B', 'BB MAJ': '6B', 'A# MAJ': '6B',
    'F MAJOR': '7B', 'F': '7B', 'F MAJ': '7B',
    'C MAJOR': '8B', 'C': '8B', 'C MAJ': '8B',
    'G MAJOR': '9B', 'G': '9B', 'G MAJ': '9B',
    'D MAJOR': '10B', 'D': '10B', 'D MAJ': '10B',
    'A MAJOR': '11B', 'A': '11B', 'A MAJ': '11B',
    'E MAJOR': '12B', 'E': '12B', 'E MAJ': '12B'
}

REVERSE_CAMELOT_MAP = {
    '1A': 'G# Minor', '2A': 'D# Minor', '3A': 'Bb Minor', '4A': 'F Minor',
    '5A': 'C Minor', '6A': 'G Minor', '7A': 'D Minor', '8A': 'A Minor',
    '9A': 'E Minor', '10A': 'B Minor', '11A': 'F# Minor', '12A': 'C# Minor',
    '1B': 'B Major', '2B': 'F# Major', '3B': 'C# Major', '4B': 'Ab Major',
    '5B': 'Eb Major', '6B': 'Bb Major', '7B': 'F Major', '8B': 'C Major',
    '9B': 'G Major', '10B': 'D Major', '11B': 'A Major', '12B': 'E Major'
}

def to_camelot(raw_key, open_key=None):
    # 1. Try musical key notation first (e.g. C#m, G, Eb Minor)
    if raw_key:
        clean = raw_key.strip().upper()
        cam_match = re.match(r'^([1-9]|1[0-2])([AB])$', clean)
        if cam_match:
            return clean, REVERSE_CAMELOT_MAP.get(clean, raw_key)

        norm = clean.replace('♯', '#').replace('♭', 'B')
        norm = re.sub(r'\s+', ' ', norm)

        if norm in CAMELOT_MAP:
            code = CAMELOT_MAP[norm]
            return code, REVERSE_CAMELOT_MAP.get(code, raw_key.title())

        m = re.search(r'([A-G][#B]?)\s*(MIN|MAJ|M\b)?', norm)
        if m:
            root = m.group(1)
            suffix = m.group(2) or ''
            mode = 'MINOR' if 'MIN' in suffix or suffix == 'M' else 'MAJOR'
            k = f'{root} {mode}'
            if k in CAMELOT_MAP:
                code = CAMELOT_MAP[k]
                return code, REVERSE_CAMELOT_MAP.get(code, f"{root} {mode.capitalize()}")

    # 2. Try Open Key notation (e.g. 1d-12d, 1m-12m)
    if open_key:
        m = re.match(r'^([1-9]|1[0-2])([MDmd])$', str(open_key).strip())
        if m:
            num = int(m.group(1))
            mode = m.group(2).lower()
            cam_num = ((num + 6) % 12) + 1
            cam_letter = 'A' if mode == 'm' else 'B'
            cam_code = f"{cam_num}{cam_letter}"
            musical_name = REVERSE_CAMELOT_MAP.get(cam_code, raw_key or 'Standard Scale')
            return cam_code, musical_name

    return '8A', (raw_key or 'Standard Scale').title()

def fetch_getsongbpm(artist, title, api_key):
    """
    Queries official GetSongBPM search API.
    Zero guessing: parses authoritative tempo, key_of, and open_key.
    """
    if not api_key:
        return None
    api_key = api_key.strip()
    clean_title = re.sub(r'[\(\[\{].*?[\)\]\}]', '', title).strip()
    clean_artist = re.sub(r'[\(\[\{].*?[\)\]\}]', '', artist).strip()

    artist_first = re.split(r'[,&]|\s+feat\b|\s+ft\b|\s+vs\b', clean_artist, flags=re.IGNORECASE)[0].strip()

    # Search query candidates:
    # 1. Official syntax: song:TITLE artist:ARTIST
    # 2. Secondary: song:TITLE artist:FIRST_ARTIST
    # 3. Simple combined fallback
    queries = [
        f"song:{clean_title} artist:{clean_artist}",
        f"song:{clean_title} artist:{artist_first}" if artist_first != clean_artist else None,
        f"{artist_first} {clean_title}"
    ]

    for q_str in queries:
        if not q_str:
            continue
        for endpoint in ['https://api.getsong.co/search/', 'https://api.getsongbpm.com/search/']:
            try:
                url = f"{endpoint}?api_key={api_key}&type=both&lookup={urllib.parse.quote(q_str)}"
                req = urllib.request.Request(url, headers=HEADERS)
                with urllib.request.urlopen(req, timeout=5) as r:
                    if r.status == 200:
                        data = json.loads(r.read().decode('utf-8'))
                        search_results = data.get('search', [])
                        if isinstance(search_results, list) and len(search_results) > 0:
                            top = search_results[0]
                            tempo = top.get('tempo')
                            key_of = top.get('key_of')
                            open_key = top.get('open_key')
                            if tempo:
                                try:
                                    bpm = int(round(float(tempo)))
                                except (ValueError, TypeError):
                                    bpm = None
                                if bpm:
                                    if bpm < 85:
                                        bpm *= 2
                                    camelot, musical_key = to_camelot(key_of, open_key)
                                    song_id = top.get('id') or top.get('song_id')
                                    song_title = top.get('song_title') or top.get('title') or clean_title
                                    slug = re.sub(r'[^a-z0-9]+', '-', str(song_title).lower()).strip('-')
                                    getsong_url = f"https://getsongbpm.com/song/{slug}/{song_id}" if song_id else None
                                    return {
                                        'bpm': bpm,
                                        'key': camelot,
                                        'musicalKey': musical_key,
                                        'source': 'api',
                                        'databaseName': 'GetSongBPM API',
                                        'verified': True,
                                        'getsongUrl': getsong_url
                                    }
            except Exception:
                pass

    return None

def validate_getsongbpm_key(api_key):
    """
    Validates a GetSongBPM API key by making a test search query.
    Returns (True, 'Key valid') or (False, error_message).
    """
    if not api_key:
        return False, 'API key cannot be empty'
    api_key = api_key.strip()
    url = f"https://api.getsong.co/search/?api_key={api_key}&type=both&lookup=song:test+artist:test"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            if r.status == 200:
                return True, 'Key valid'
    except urllib.error.HTTPError as e:
        if e.code in (401, 403):
            return False, 'Invalid API Key, or inactive.'
        return False, f"Server responded with error {e.code}"
    except Exception:
        return False, 'Network error while validating key'
    return False, 'Invalid API Key'

class MegamixHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)

        if parsed.path == '/api/validate_music_key':
            params = urllib.parse.parse_qs(parsed.query)
            api_key = params.get('api_key', [''])[0].strip()
            if not api_key:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'valid': False, 'message': 'API key is required'}).encode('utf-8'))
                return

            valid, msg = validate_getsongbpm_key(api_key)
            self.send_response(200 if valid else 400)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'valid': valid, 'message': msg}).encode('utf-8'))
            return

        if parsed.path == '/api/lookup':
            params = urllib.parse.parse_qs(parsed.query)
            artist = params.get('artist', [''])[0].strip()
            title = params.get('title', [''])[0].strip()
            api_key = params.get('api_key', [''])[0].strip()

            # Zero Guessing Mode: If no key is provided, refuse to guess or scrape
            if not api_key:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'status': 'no_api_key',
                    'message': 'GetSongBPM API key is required. Free key at getsongbpm.com/api'
                }).encode('utf-8'))
                return

            if not artist or not title:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Missing artist or title'}).encode('utf-8'))
                return

            result = fetch_getsongbpm(artist, title, api_key=api_key)
            if result:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(result).encode('utf-8'))
            else:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Not found in GetSongBPM database'}).encode('utf-8'))
            return

        return super().do_GET()

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), MegamixHandler) as httpd:
        print(f"MegamixGen Server running on http://127.0.0.1:{PORT}")
        httpd.serve_forever()
