from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models.users import User, UserRole
from app.models.digital_wellness import Device
from app.services.digital_wellness_service import digital_wellness_service
from app.schemas.digital_wellness import (
    DeviceRegisterRequest,
    DeviceRegisterResponse,
    DeviceUpdateRequest,
    DeviceResponse,
    DeviceSyncPayload,
    DeviceSyncResponse
)

router = APIRouter()

@router.post("/auto-register", response_model=DeviceRegisterResponse, status_code=status.HTTP_201_CREATED)
async def auto_register_device(
    payload: DeviceRegisterRequest,
    student_email: Optional[str] = Query(None, description="Optional student email to auto-link"),
    db: AsyncSession = Depends(get_db)
):
    """
    Automated zero-prompt registration for desktop agent and browser extension.
    Automatically links to the active student without manual terminal credential prompts.
    """
    student = None
    if student_email:
        res = await db.execute(select(User).where(User.email == student_email))
        student = res.scalar_one_or_none()

    if not student:
        res = await db.execute(select(User).where(User.role == UserRole.STUDENT).order_by(desc(User.created_at)))
        student = res.scalars().first()

    if not student:
        from app.core.security import get_password_hash
        student = User(
            email="student@mindguard.ai",
            full_name="MindGuard Student",
            role=UserRole.STUDENT,
            password_hash=get_password_hash("Student@123"),
            is_active=True
        )
        db.add(student)
        await db.commit()
        await db.refresh(student)

    return await digital_wellness_service.register_device(db, student, payload)

@router.post("/register", response_model=DeviceRegisterResponse, status_code=status.HTTP_201_CREATED)
async def register_device(
    payload: DeviceRegisterRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Registers a new desktop client or browser extension for the authenticated student.
    Returns the device ID and a one-time secret device_token for synchronization.
    """
    if current_user.role != UserRole.STUDENT and current_user.role != "STUDENT":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can register monitoring devices."
        )
    return await digital_wellness_service.register_device(db, current_user, payload)

@router.get("", response_model=List[DeviceResponse])
@router.get("/", response_model=List[DeviceResponse])
async def list_devices(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Lists all connected devices for the current student."""
    return await digital_wellness_service.list_user_devices(db, current_user.id)

@router.patch("/{device_id}", response_model=DeviceResponse)
async def update_device(
    device_id: UUID,
    payload: DeviceUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Updates device properties, pauses/resumes tracking, or toggles feature flags."""
    return await digital_wellness_service.update_device(db, current_user.id, device_id, payload)

@router.delete("/{device_id}")
async def delete_device(
    device_id: UUID,
    delete_data: bool = Query(default=False, description="Whether to also purge all telemetry recorded by this device"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Unlinks and removes a registered device from the student's account."""
    return await digital_wellness_service.delete_device(db, current_user.id, device_id, delete_data)

@router.post("/{device_id}/sync", response_model=DeviceSyncResponse)
async def sync_device_telemetry(
    device_id: UUID,
    payload: DeviceSyncPayload,
    x_device_token: Optional[str] = Header(None, alias="X-Device-Token"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: AsyncSession = Depends(get_db)
):
    """
    Synchronizes batched activity events from a desktop agent or browser extension.
    Accepts authentication via X-Device-Token header OR standard Bearer JWT token.
    """
    device: Optional[Device] = None

    if x_device_token:
        device = await digital_wellness_service.authenticate_device(db, device_id, x_device_token)
    elif authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ")[1].strip()
        from app.core.security import verify_access_token
        payload_token = verify_access_token(token)
        if not payload_token or not payload_token.get("sub"):
            raise HTTPException(status_code=401, detail="Invalid token")
        user_id_str = payload_token["sub"]
        
        # Verify device belongs to user
        from sqlalchemy import select, and_
        stmt = select(Device).where(and_(Device.id == device_id, Device.user_id == UUID(user_id_str)))
        device = (await db.execute(stmt)).scalar_one_or_none()
        if not device:
            raise HTTPException(status_code=404, detail="Device not found for authenticated student.")
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials (provide X-Device-Token or Bearer Authorization)."
        )

    return await digital_wellness_service.sync_device_telemetry(db, device, payload)
