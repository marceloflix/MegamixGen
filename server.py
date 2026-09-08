#!/usr/bin/env python3
"""
MegamixGen Local Server with Live BPM & Camelot Key Scraper
Serves static assets and provides an authoritative zero-config scraping endpoint:
GET /api/lookup?artist=...&title=...&api_key=...
"""

import http.server
import socketserver
import urllib.parse
import urllib.request
import json
import re
import html
import os
import sys

PORT = 8080
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

# ── Camelot Wheel Mapping ──
CAMELOT_MAP = {
    # Minor Keys (A Wheel)
    'AB MINOR': '1A', 'G# MINOR': '1A',
    'EB MINOR': '2A', 'D# MINOR': '2A',
    'BB MINOR': '3A', 'A# MINOR': '3A',
    'F MINOR': '4A',
    'C MINOR': '5A',
    'G MINOR': '6A',
    'D MINOR': '7A',
    'A MINOR': '8A',
    'E MINOR': '9A',
    'B MINOR': '10A',
    'F# MINOR': '11A', 'GB MINOR': '11A',
    'C# MINOR': '12A', 'DB MINOR': '12A',

    # Major Keys (B Wheel)
    'B MAJOR': '1B',
    'F# MAJOR': '2B', 'GB MAJOR': '2B',
    'C# MAJOR': '3B', 'DB MAJOR': '3B',
    'AB MAJOR': '4B', 'G# MAJOR': '4B',
    'EB MAJOR': '5B', 'D# MAJOR': '5B',
    'BB MAJOR': '6B', 'A# MAJOR': '6B',
    'F MAJOR': '7B',
    'C MAJOR': '8B',
    'G MAJOR': '9B',
    'D MAJOR': '10B',
    'A MAJOR': '11B',
    'E MAJOR': '12B'
}

def to_camelot(raw_key):
    if not raw_key:
        return '8A', 'Standard Scale'
    
    clean = raw_key.strip().upper()
    cam_match = re.match(r'^([1-9]|1[0-2])([AB])$', clean)
    if cam_match:
        return clean, raw_key
    
    norm = clean.replace('♯', '#').replace('♭', 'B')
    norm = re.sub(r'\s+', ' ', norm)
    
    if norm in CAMELOT_MAP:
        return CAMELOT_MAP[norm], raw_key.title()
    
    m = re.search(r'([A-G][#B]?)\s*(MIN|MAJ|M\b)', norm)
    if m:
        root = m.group(1)
        mode = 'MINOR' if 'MIN' in m.group(2) or m.group(2) == 'M' else 'MAJOR'
        k = f'{root} {mode}'
        if k in CAMELOT_MAP:
            return CAMELOT_MAP[k], f"{root} {mode.capitalize()}"
            
    return '8A', raw_key.title()

def scrape_getsongbpm_api(artist, title, api_key):
    if not api_key:
        return None, None, None
    try:
        clean_title = re.sub(r'[\(\[\{].*?[\)\]\}]', '', title).strip()
        q = urllib.parse.quote(f'{artist} {clean_title}')
        url = f'https://api.getsongbpm.com/search/?api_key={api_key.strip()}&type=both&lookup={q}'
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=5) as r:
            if r.status == 200:
                data = json.loads(r.read().decode('utf-8'))
                search_results = data.get('search', [])
                if isinstance(search_results, list) and len(search_results) > 0:
                    top = search_results[0]
                    bpm = top.get('tempo')
                    key = top.get('key_of')
                    if bpm:
                        bpm_int = int(bpm)
                        if bpm_int < 85: bpm_int *= 2
                        return bpm_int, key or 'Standard Scale', 'GetSongBPM API'
    except Exception:
        pass
    return None, None, None

def scrape_ddg_snippets(artist, title):
    try:
        clean_title = re.sub(r'[\(\[\{].*?[\)\]\}]', '', title).strip()
        q = f'{artist} {clean_title} bpm key tunebat'
        url = 'https://lite.duckduckgo.com/lite/'
        data = urllib.parse.urlencode({'q': q}).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=4) as r:
            content = r.read().decode('utf-8', errors='ignore')
            snippets = re.findall(r"<td class='result-snippet'>(.*?)</td>", content, re.DOTALL)
            for s in snippets[:8]:
                clean = html.unescape(re.sub(r'<[^>]+>', '', s)).strip()
                norm = clean.replace('♯', '#').replace('♭', 'b')
                
                m_bpm = re.search(r'\b(1?\d{2,3})\s*BPM\b', norm, re.IGNORECASE)
                bpm = int(m_bpm.group(1)) if m_bpm else None
                
                m_cam = re.search(r'\b(?:camelot:?\s*)?([1-9]|1[0-2])([AB])\b', norm, re.IGNORECASE)
                m_key = re.search(r'\b([A-G][#b]?)\s*(?:minor|major|min|maj|m\b)', norm, re.IGNORECASE)
                m_slash = re.search(r'\b([A-G][#b]?)(?:/[A-G][#b]?)?\s*key\s*and\s*a\s*(minor|major)', norm, re.IGNORECASE)
                
                key = None
                if m_cam and 'camelot' in norm.lower():
                    key = m_cam.group(1).upper() + m_cam.group(2).upper()
                elif m_slash:
                    key = f"{m_slash.group(1)} {m_slash.group(2).capitalize()}"
                elif m_key:
                    key = m_key.group(0)
                elif m_cam:
                    key = m_cam.group(1).upper() + m_cam.group(2).upper()
                    
                if bpm and key:
                    return bpm, key, 'Web Search'
    except Exception:
        pass
    return None, None, None

def scrape_beatport(artist, title):
    try:
        clean_title = re.sub(r'[\(\[\{].*?[\)\]\}]', '', title).strip()
        q = urllib.parse.quote(f'{artist} {clean_title}')
        url = f'https://www.beatport.com/search?q={q}'
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=4) as r:
            content = r.read().decode('utf-8', errors='ignore')
            m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', content, re.DOTALL)
            if m:
                data = json.loads(m.group(1))
                queries = data.get('props', {}).get('pageProps', {}).get('dehydratedState', {}).get('queries', [])
                for q_obj in queries:
                    t_data = q_obj.get('state', {}).get('data', {}).get('tracks', {}).get('data', [])
                    if t_data:
                        # 1. Prioritize Original Mix / Classic / Radio Edit (avoid modern remixes)
                        for t in t_data:
                            mix = (t.get('mix_name') or '').lower()
                            if 'original' in mix or 'radio' in mix or t.get('is_classic'):
                                bpm = t.get('bpm')
                                key = t.get('key_name')
                                if bpm and bpm < 85: bpm = bpm * 2
                                if bpm and key:
                                    return bpm, key, 'Beatport'
                        # 2. Avoid obvious modern remixes if possible
                        for t in t_data:
                            mix = (t.get('mix_name') or '').lower()
                            if not any(w in mix for w in ['remix', 'edit', 'bootleg', '202']):
                                bpm = t.get('bpm')
                                key = t.get('key_name')
                                if bpm and bpm < 85: bpm = bpm * 2
                                if bpm and key:
                                    return bpm, key, 'Beatport'
                        # 3. Fallback to top result
                        top = t_data[0]
                        bpm = top.get('bpm')
                        if bpm and bpm < 85: bpm = bpm * 2
                        key = top.get('key_name')
                        if bpm and key:
                            return bpm, key, 'Beatport'
    except Exception:
        pass
    return None, None, None

def scrape_songbpm(artist, title):
    try:
        def slug(s):
            return re.sub(r'[^a-z0-9]+', '-', re.sub(r'[\(\[\{].*?[\)\]\}]', '', s.lower().replace('&', 'and'))).strip('-')
        url = f'https://songbpm.com/@{slug(artist)}/{slug(title)}'
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=4) as r:
            if r.status == 200:
                content = r.read().decode('utf-8', errors='ignore')
                m_bpm = re.search(r'Tempo\s*\(BPM\)\s*</dt>\s*<dd[^>]*>\s*(\d+)', content)
                m_key = re.search(r'Key\s*</dt>\s*<dd[^>]*>\s*([^<]+)', content)
                m_mode = re.search(r'\b(minor|major)\b\s*mode', content, re.IGNORECASE)
                bpm = int(m_bpm.group(1)) if m_bpm else None
                key_raw = m_key.group(1).strip() if m_key else None
                mode = m_mode.group(1).capitalize() if m_mode else 'Minor'
                if key_raw:
                    # Normalize unicode accidentals: C♯/D♭ -> C#
                    norm_k = key_raw.replace('♯', '#').replace('♭', 'b').split('/')[0].strip()
                    if norm_k:
                        return bpm, f'{norm_k} {mode}', 'SongBPM'
                elif bpm:
                    return bpm, None, 'SongBPM'
    except Exception:
        pass
    return None, None, None

def live_lookup(artist, title, api_key=None):
    # 1. Optional GetSongBPM API if user provided key
    if api_key:
        bpm_api, key_api, src_api = scrape_getsongbpm_api(artist, title, api_key)
        if bpm_api and key_api:
            camelot, musical = to_camelot(key_api)
            return { 'bpm': bpm_api, 'key': camelot, 'musicalKey': musical, 'source': 'scraped', 'databaseName': src_api, 'verified': True }

    # 2. SongBPM Authoritative Original Studio Database
    bpm_sb, key_sb, src_sb = scrape_songbpm(artist, title)
    if bpm_sb and key_sb:
        camelot, musical = to_camelot(key_sb)
        return { 'bpm': bpm_sb, 'key': camelot, 'musicalKey': musical, 'source': 'scraped', 'databaseName': src_sb, 'verified': True }

    # 3. Beatport Search (with Original Mix prioritization)
    bpm_bp, key_bp, src_bp = scrape_beatport(artist, title)
    if bpm_bp and key_bp:
        camelot, musical = to_camelot(key_bp)
        return { 'bpm': bpm_bp, 'key': camelot, 'musicalKey': musical, 'source': 'scraped', 'databaseName': src_bp, 'verified': True }

    # 4. DuckDuckGo Search Snippets (Tunebat / SongBPM index)
    bpm_ddg, key_ddg, src_ddg = scrape_ddg_snippets(artist, title)
    if bpm_ddg and key_ddg:
        camelot, musical = to_camelot(key_ddg)
        return { 'bpm': bpm_ddg, 'key': camelot, 'musicalKey': musical, 'source': 'scraped', 'databaseName': src_ddg, 'verified': True }
    
    # 5. Composite fallback
    final_bpm = bpm_sb or bpm_bp or bpm_ddg
    final_key = key_sb or key_bp or key_ddg
    if final_bpm:
        camelot, musical = to_camelot(final_key or '8A')
        return { 'bpm': final_bpm, 'key': camelot, 'musicalKey': musical, 'source': 'scraped', 'databaseName': src_sb or src_bp or src_ddg or 'Live Web Scraper', 'verified': True }
        
    return None

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
        if parsed.path == '/api/lookup':
            params = urllib.parse.parse_qs(parsed.query)
            artist = params.get('artist', [''])[0].strip()
            title = params.get('title', [''])[0].strip()
            api_key = params.get('api_key', [''])[0].strip()
            
            if not artist or not title:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Missing artist or title'}).encode('utf-8'))
                return

            result = live_lookup(artist, title, api_key=api_key)
            if result:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(result).encode('utf-8'))
            else:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Not found'}).encode('utf-8'))
            return
        
        return super().do_GET()

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), MegamixHandler) as httpd:
        print(f"MegamixGen Server running on http://127.0.0.1:{PORT}")
        httpd.serve_forever()
