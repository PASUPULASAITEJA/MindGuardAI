import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, HTTPException, status, WebSocket, WebSocketDisconnect
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.db.session import get_db, AsyncSessionLocal
from app.api.dependencies import get_current_user
from app.models.users import User
from app.models.notifications import NotificationType, NotificationChannel
from app.schemas.notifications import (
    NotificationListResponse,
    NotificationItemResponse,
    NotificationMarkReadResponse,
    NotificationReadResponse,
    NotificationCreateRequest,
)
from app.services.notification_service import notification_service, connection_manager
from app.services.user import user_service

logger = logging.getLogger("mindguard.notifications.api")

router = APIRouter()


@router.get(
    "",
    response_model=NotificationListResponse,
    status_code=status.HTTP_200_OK,
    summary="Get user notifications and unread count"
)
async def get_notifications(
    limit: int = Query(50, ge=1, le=100, description="Max notifications to retrieve"),
    unread_only: bool = Query(False, description="Filter only unread notifications"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves chronological notifications for the authenticated user,
    including the active unread badge count.
    """
    items, unread_count = await notification_service.get_user_notifications(
        db,
        user_id=current_user.id,
        limit=limit,
        unread_only=unread_only
    )
    return NotificationListResponse(
        items=items,
        total=len(items),
        unread_count=unread_count
    )


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationItemResponse,
    status_code=status.HTTP_200_OK,
    summary="Mark single notification as read"
)
async def mark_notification_read_patch(
    notification_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Marks an individual notification as read and updates timestamps.
    """
    notification = await notification_service.mark_as_read(
        db,
        notification_id=notification_id,
        user_id=current_user.id
    )
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error_code": "NOTIFICATION_NOT_FOUND",
                "message": "Notification not found or access unauthorized.",
                "details": {}
            }
        )
    return notification


@router.put(
    "/{notification_id}/read",
    response_model=NotificationReadResponse,
    status_code=status.HTTP_200_OK,
    summary="Legacy mark notification as read (backward compatibility)"
)
async def mark_notification_read_put(
    notification_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Maintains backward compatibility with legacy PUT calls.
    """
    try:
        notif_uuid = UUID(notification_id)
        await notification_service.mark_as_read(
            db,
            notification_id=notif_uuid,
            user_id=current_user.id
        )
    except ValueError:
        pass

    return NotificationReadResponse(
        id=notification_id,
        is_read=True
    )


@router.post(
    "/mark-all-read",
    response_model=NotificationMarkReadResponse,
    status_code=status.HTTP_200_OK,
    summary="Mark all user notifications as read"
)
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Marks all outstanding notifications as read for the authenticated user.
    """
    count = await notification_service.mark_all_read(db, user_id=current_user.id)
    return NotificationMarkReadResponse(
        success=True,
        marked_count=count,
        unread_count=0
    )


@router.post(
    "/test",
    response_model=NotificationItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Dispatch a test notification (development & testing)"
)
async def create_test_notification(
    payload: NotificationCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Dispatches a test notification to verify real-time WebSocket delivery and badge counting.
    """
    target_user_id = payload.user_id if payload.user_id else current_user.id
    notification = await notification_service.create_and_dispatch(
        db,
        user_id=target_user_id,
        type=NotificationType(payload.type.value),
        title=payload.title,
        message=payload.message,
        channel=NotificationChannel(payload.channel.value)
    )
    return notification


@router.websocket("/ws")
async def websocket_notifications(
    websocket: WebSocket,
    token: Optional[str] = Query(None)
):
    """
    Authenticated WebSocket endpoint for real-time notifications and alerts.
    Clients pass JWT as query param: ?token=<jwt_access_token>.
    """
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Authenticate token
    try:
        payload = decode_token(token)
        user_id_str = payload.get("sub")
        token_type = payload.get("type")
        if token_type != "access" or not user_id_str:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        user_id = UUID(user_id_str)
    except (JWTError, ValueError):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    async with AsyncSessionLocal() as db:
        user = await user_service.get_user_by_id(db, user_id)
        if not user or not user.is_active:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

    # Connect WebSocket
    await connection_manager.connect(user_id, websocket)

    try:
        # Send initial confirmation event
        await websocket.send_json({
            "event": "connected",
            "data": {
                "user_id": str(user_id),
                "message": "Connected to MindGuardAI notification stream."
            }
        })

        while True:
            # Handle incoming client messages (heartbeat/ping)
            data = await websocket.receive_text()
            if data == "ping" or '"ping"' in data:
                await websocket.send_json({"event": "pong"})

    except WebSocketDisconnect:
        connection_manager.disconnect(user_id, websocket)
    except Exception as exc:
        logger.warning(f"WebSocket connection error for user {user_id}: {exc}")
        connection_manager.disconnect(user_id, websocket)
