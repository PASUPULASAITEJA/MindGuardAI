import time
from collections import defaultdict
from typing import Dict, List, Tuple
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

class RateLimitingMiddleware(BaseHTTPMiddleware):
    """
    Sliding window in-memory rate limiter to protect authentication and API endpoints
    against credential stuffing, brute force, and denial of service.
    """
    def __init__(self, app, auth_limit_per_min: int = 20, api_limit_per_min: int = 300):
        super().__init__(app)
        self.auth_limit = auth_limit_per_min
        self.api_limit = api_limit_per_min
        # Maps client_ip -> list of epoch timestamps
        self.auth_records: Dict[str, List[float]] = defaultdict(list)
        self.api_records: Dict[str, List[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        # Bypass health check and options preflight
        if request.method == "OPTIONS" or request.url.path in ["/health", "/api/health", "/api/v1/health"]:
            return await call_next(request)

        client_ip = request.headers.get("X-Forwarded-For")
        if client_ip:
            client_ip = client_ip.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "127.0.0.1"

        now = time.time()
        window_start = now - 60.0

        # Check if auth endpoint
        path = request.url.path
        is_auth = any(auth_path in path for auth_path in ["/auth/login", "/auth/register", "/auth/forgot-password"])

        if is_auth:
            # Clean expired timestamps
            timestamps = [t for t in self.auth_records[client_ip] if t > window_start]
            if len(timestamps) >= self.auth_limit:
                retry_after = int(60 - (now - timestamps[0])) if timestamps else 60
                return JSONResponse(
                    status_code=429,
                    content={
                        "error_code": "AUTH_RATE_LIMIT_EXCEEDED",
                        "message": f"Too many authentication attempts. Please retry after {retry_after} seconds.",
                        "details": {"retry_after_seconds": retry_after}
                    },
                    headers={"Retry-After": str(retry_after)}
                )
            timestamps.append(now)
            self.auth_records[client_ip] = timestamps
        else:
            timestamps = [t for t in self.api_records[client_ip] if t > window_start]
            if len(timestamps) >= self.api_limit:
                retry_after = int(60 - (now - timestamps[0])) if timestamps else 60
                return JSONResponse(
                    status_code=429,
                    content={
                        "error_code": "RATE_LIMIT_EXCEEDED",
                        "message": f"Rate limit exceeded. Please retry after {retry_after} seconds.",
                        "details": {"retry_after_seconds": retry_after}
                    },
                    headers={"Retry-After": str(retry_after)}
                )
            timestamps.append(now)
            self.api_records[client_ip] = timestamps

        return await call_next(request)

