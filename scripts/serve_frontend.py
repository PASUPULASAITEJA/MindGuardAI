import http.server
import socketserver
import os
import sys

PORT = 5173
DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST_DIR, **kwargs)

    def do_GET(self):
        # Translate requested URL path to physical filesystem path
        path = self.translate_path(self.path)
        # If the file does not exist, route back to index.html (SPA client-side routing)
        if not os.path.exists(path) or os.path.isdir(path):
            self.path = "/index.html"
        return super().do_GET()

if __name__ == "__main__":
    # Allow address reuse to avoid port bind conflicts
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", PORT), SPAHandler) as httpd:
        print(f"MindGuard Frontend SPA live at http://localhost:{PORT}")
        sys.stdout.flush()
        httpd.serve_forever()
