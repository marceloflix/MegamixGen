#!/usr/bin/env python3
"""
SoundHunt Local Web Server
Serves static assets on http://localhost:8080 with CORS headers.
"""

import http.server
import socketserver
import os
import sys

PORT = 8080

class SoundHuntHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

if __name__ == '__main__':
    web_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(web_dir)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), SoundHuntHandler) as httpd:
        print(f"SoundHunt Server running at http://localhost:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down SoundHunt Server.")
            sys.exit(0)
