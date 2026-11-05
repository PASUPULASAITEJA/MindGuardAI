from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models.users import User
from app.services.digital_wellness_service import digital_wellness_service
from app.schemas.digital_wellness import (
    ConsentUpdateRequest,
    DigitalWellnessConsentResponse
)

router = APIRouter()

@router.get("/overview")
async def get_overview(
    date: Optional[str] = Query(None, description="YYYY-MM-DD (defaults to today)"),
    device_id: Optional[UUID] = Query(None, description="Optional device filter"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Returns authentic overview of screen time, active/idle time, and daily trend."""
    target_date = date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return await digital_wellness_service.get_overview(db, current_user.id, target_date, device_id)

@router.get("/applications")
async def get_applications(
    date: Optional[str] = Query(None, description="YYYY-MM-DD (defaults to today)"),
    device_id: Optional[UUID] = Query(None, description="Optional device filter"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Returns authentic application usage breakdown and category distributions."""
    target_date = date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return await digital_wellness_service.get_application_analytics(db, current_user.id, target_date, device_id)

@router.get("/websites")
async def get_websites(
    date: Optional[str] = Query(None, description="YYYY-MM-DD (defaults to today)"),
    device_id: Optional[UUID] = Query(None, description="Optional device filter"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Returns authentic domain-level web browsing duration and visit counts."""
    target_date = date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return await digital_wellness_service.get_website_analytics(db, current_user.id, target_date, device_id)

@router.get("/searches")
async def get_searches(
    limit: int = Query(default=50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Returns search query analytics strictly for the account owner if consent enabled."""
    return await digital_wellness_service.get_search_analytics(db, current_user.id, limit)

@router.delete("/searches")
async def clear_searches(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Permanently purges student search query history."""
    return await digital_wellness_service.clear_search_history(db, current_user.id)

@router.get("/notifications")
async def get_notifications(
    date: Optional[str] = Query(None, description="YYYY-MM-DD (defaults to today)"),
    device_id: Optional[UUID] = Query(None, description="Optional device filter"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Returns authentic notification counts and 24-hour distribution trends."""
    target_date = date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return await digital_wellness_service.get_notification_analytics(db, current_user.id, target_date, device_id)

@router.get("/consent", response_model=DigitalWellnessConsentResponse)
async def get_consent(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves student's granular privacy toggles and data retention window."""
    return await digital_wellness_service.get_or_create_consent(db, current_user.id)

@router.put("/consent", response_model=DigitalWellnessConsentResponse)
async def update_consent(
    payload: ConsentUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Updates student privacy toggles (app, web, search, notification tracking)."""
    return await digital_wellness_service.update_consent(db, current_user.id, payload)

@router.get("/export")
async def export_data(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Exports all personal digital activity records in JSON format."""
    return await digital_wellness_service.export_student_data(db, current_user.id)

@router.delete("/data")
async def delete_all_data(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Permanently purges all digital activity data belonging to student."""
    return await digital_wellness_service.delete_all_student_data(db, current_user.id)
