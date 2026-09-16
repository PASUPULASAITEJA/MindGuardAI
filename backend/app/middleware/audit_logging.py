import logging
from typing import Optional, Tuple
from uuid import UUID
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from jose import jwt, JWTError

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.services.audit_service import audit_service

logger = logging.getLogger("mindguard-audit-middleware")

def extract_user_from_auth_header(auth_header: Optional[str]) -> Tuple[Optional[UUID], str]:
    """Extracts sub (UUID) and role from Bearer JWT safely."""
    if not auth_header or not auth_header.startswith("Bearer "):
        return None, "PUBLIC"
    token = auth_header.split(" ", 1)[1].strip()
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=["HS256"])
        sub = payload.get("sub")
        role = payload.get("role", "SYSTEM")
        if sub:
            return UUID(str(sub)), role
    except (JWTError, ValueError):
        pass
    return None, "PUBLIC"

def classify_audit_action(method: str, path: str) -> Optional[Tuple[str, str]]:
    """
    Maps incoming HTTP request to normalized audit action and resource classification.
    Returns (action, resource_type) if matching auditable events, else None.
    Actions required: login, logout, journal_create, journal_view, prediction_view, alert_view, consent_change, admin_action.
    """
    method_upper = method.upper()
    norm_path = path.lower()

    # 1. login
    if method_upper == "POST" and ("/auth/login" in norm_path):
        return "login", "AUTH"

    # 2. logout
    if method_upper == "POST" and ("/auth/logout" in norm_path):
        return "logout", "AUTH"

    # 3. journal_create
    if method_upper == "POST" and ("/journal/entries" in norm_path or "/journal" in norm_path):
        return "journal_create", "JOURNAL"

    # 4. journal_view
    if method_upper == "GET" and ("/mood/history" in norm_path):
        return "journal_view", "JOURNAL"

    # 5. prediction_view
    if method_upper == "GET" and ("/predictions" in norm_path):
        return "prediction_view", "PREDICTIONS"

    # 6. alert_view
    if method_upper == "GET" and ("/alerts" in norm_path or "/counselors/alerts" in norm_path):
        return "alert_view", "ALERT"

    # 7. consent_change
    if method_upper in ("POST", "PUT", "PATCH") and ("/consent" in norm_path):
        return "consent_change", "CONSENT"

    # 8. admin_action
    if ("/admin" in norm_path) and method_upper in ("POST", "PUT", "PATCH", "DELETE"):
        return "admin_action", "ADMIN"

    return None

from app.db.session import AsyncSessionLocal, get_db

async def get_audit_db_session(request: Request):
    if get_db in request.app.dependency_overrides:
        override = request.app.dependency_overrides[get_db]
        gen = override()
        if hasattr(gen, "__anext__"):
            session = await anext(gen)
            return session, False
        elif hasattr(gen, "__next__"):
            session = next(gen)
            return session, False
    return AsyncSessionLocal(), True

class AuditLoggingMiddleware(BaseHTTPMiddleware):
    """
    FastAPI middleware that auto-logs security and compliance operations:
    - login, logout
    - journal_create, journal_view
    - prediction_view
    - alert_view
    - consent_change
    - admin_action
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        response: Response = await call_next(request)

        # Only audit successful operations (2xx or 3xx)
        if 200 <= response.status_code < 400:
            action_info = classify_audit_action(request.method, request.url.path)
            if action_info:
                action_name, resource_type = action_info
                auth_header = request.headers.get("Authorization")
                user_id, user_role = extract_user_from_auth_header(auth_header)

                # Client IP resolution
                ip_address = (
                    request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
                    or (request.client.host if request.client else "unknown")
                )
                user_agent = request.headers.get("User-Agent", "")[:255]
                request_id = request.headers.get("X-Request-ID")

                # Asynchronously persist audit log
                try:
                    db, should_close = await get_audit_db_session(request)
                    try:
                        await audit_service.log_event(
                            db=db,
                            action=action_name,
                            target_resource_type=resource_type,
                            actor_user_id=user_id,
                            actor_role=user_role,
                            target_user_id=user_id,
                            target_resource_id=request.url.path,
                            request_id=request_id,
                            ip_address=ip_address,
                            user_agent=user_agent,
                            metadata={
                                "method": request.method,
                                "path": request.url.path,
                                "status_code": response.status_code
                            }
                        )
                    finally:
                        if should_close:
                            await db.close()
                except Exception as err:
                    logger.warning(f"AuditLoggingMiddleware failed to record log: {err}")

        return response
