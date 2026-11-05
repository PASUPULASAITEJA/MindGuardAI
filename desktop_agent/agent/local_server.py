import json
import logging
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
from typing import Optional
from datetime import datetime, timezone

from .config import agent_config
from .local_db import LocalStorage

logger = logging.getLogger("mindguard-local-server")

class LocalTelemetryHandler(BaseHTTPRequestHandler):
    storage: Optional[LocalStorage] = None

    def _set_headers(self, status_code: int = 200):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Extension-Version")
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(204)

    def do_GET(self):
        if self.path == "/api/status":
            self._set_headers(200)
            res = {
                "status": "online",
                "device_id": agent_config.device_id,
                "device_name": agent_config.device_name,
                "is_paused": agent_config.is_monitoring_paused,
                "search_consent": agent_config.search_consent,
                "agent_version": agent_config.agent_version
            }
            self.wfile.write(json.dumps(res).encode("utf-8"))
        else:
            self._set_headers(404)
            self.wfile.write(b'{"error": "not_found"}')

    def do_POST(self):
        content_len = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_len) if content_len > 0 else b""
        
        try:
            payload = json.loads(post_data.decode("utf-8")) if post_data else {}
        except Exception:
            self._set_headers(400)
            self.wfile.write(b'{"error": "invalid_json"}')
            return

        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        if self.path == "/api/web-activity":
            domain = payload.get("domain", "").strip().lower()
            seconds = int(payload.get("duration_seconds", 0))
            browser = payload.get("browser", "Chrome")
            category = payload.get("category", "General")
            is_new = bool(payload.get("is_new_visit", False))

            if domain and seconds > 0 and self.storage:
                self.storage.record_web_visit(
                    date_str=today_str,
                    domain=domain,
                    browser_name=browser,
                    seconds=seconds,
                    category=category,
                    is_new_visit=is_new
                )
            self._set_headers(200)
            self.wfile.write(b'{"status": "recorded"}')

        elif self.path == "/api/search-query":
            # Check if user enabled search tracking
            if not agent_config.search_consent:
                self._set_headers(403)
                self.wfile.write(b'{"error": "search_consent_disabled"}')
                return

            query = payload.get("query", "").strip()
            engine = payload.get("engine", "Google")
            category = payload.get("category", "Academic")

            if query and self.storage:
                self.storage.record_search_query(
                    date_str=today_str,
                    engine=engine,
                    query_text=query,
                    category=category
                )
            self._set_headers(200)
            self.wfile.write(b'{"status": "recorded"}')

        else:
            self._set_headers(404)
            self.wfile.write(b'{"error": "unknown_endpoint"}')

    def log_message(self, format, *args):
        # Suppress noisy HTTP request logging in terminal
        pass

def start_local_ipc_server(storage: LocalStorage, port: int = 42424) -> Optional[HTTPServer]:
    """Starts background loopback HTTP server for Browser Extension communication."""
    LocalTelemetryHandler.storage = storage
    try:
        server = HTTPServer(("127.0.0.1", port), LocalTelemetryHandler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        logger.info(f"Local telemetry IPC server running on http://127.0.0.1:{port}")
        return server
    except Exception as e:
        logger.warning(f"Could not bind local IPC server on port {port}: {e}")
        return None

