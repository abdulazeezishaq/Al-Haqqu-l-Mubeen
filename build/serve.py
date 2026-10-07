#!/usr/bin/env python3
"""Preview server for local development.

    python3 build/serve.py          # http://127.0.0.1:8777

Identical to `python3 -m http.server`, except every response carries
no-cache headers. Without them the browser keeps showing an old picture
whenever an image is replaced but keeps the same filename.
"""
import functools
import http.server
import pathlib
import socketserver
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8777
ROOT = pathlib.Path(__file__).resolve().parent.parent


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):            # quieter output
        if "404" in (fmt % args):
            super().log_message(fmt, *args)


if __name__ == "__main__":
    handler = functools.partial(NoCacheHandler, directory=str(ROOT))
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", PORT), handler) as httpd:
        print(f"serving {ROOT} at http://127.0.0.1:{PORT}  (Ctrl-C to stop)")
        httpd.serve_forever()
