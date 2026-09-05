from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from uuid import UUID

from app.db.session import get_db
from app.api.dependencies import require_role
from app.models.users import User, UserRole
from app.models.alerts import AlertStatus
from app.schemas.alerts import ActiveAlertsResponse, AlertUpdateRequest, AlertUpdateResponse
from app.services.alerts import alert_service

router = APIRouter()

@router.get(
    "/alerts",
    response_model=ActiveAlertsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get active high-risk alerts queue"
)
async def get_active_alerts(
    status_filter: Optional[AlertStatus] = Query(None, alias="status", description="Filter by alert status: PENDING, REVIEWED, RESOLVED"),
    limit: int = Query(50, ge=1, le=100, description="Max results limit"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.COUNSELOR]))
):
    """
    Retrieves the queue of outstanding high-risk assessments for clinic staff.
    """
    alerts, total = await alert_service.get_active_alerts(
        db, status_filter=status_filter, limit=limit
    )
    
    return ActiveAlertsResponse(alerts=alerts, total=total)

@router.put(
    "/alerts/{alert_id}",
    response_model=AlertUpdateResponse,
    status_code=status.HTTP_200_OK,
    summary="Update alert status classification"
)
async def update_alert_status(
    alert_id: UUID,
    payload: AlertUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.COUNSELOR]))
):
    """
    Allows clinic counselors to claim (REVIEWED) or close out (RESOLVED) high-risk warning alerts.
    """
    updated_alert = await alert_service.update_alert_status(
        db,
        alert_id=alert_id,
        status_update=payload.status,
        counselor=current_user
    )
    
    return updated_alert

@router.post(
    "/sos",
    status_code=status.HTTP_201_CREATED,
    summary="Dispatch emergency SOS alert from distressed student"
)
async def trigger_emergency_sos(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.STUDENT, UserRole.COUNSELOR, UserRole.ADMIN]))
):
    """
    Immediate crisis distress escalation. Instantly alerts designated campus counselors,
    generates a high-priority safety event, and returns immediate 24x7 verified emergency helplines.
    """
    from uuid import uuid4
    from datetime import datetime, timezone
    from app.models.assessments import Assessment, RiskLevel
    from app.models.alerts import Alert
    from app.models.chat import SafetyEvent

    # 1. Create immediate high-risk clinical assessment
    assessment = Assessment(
        id=uuid4(),
        student_id=current_user.id,
        mental_wellness_score=5.0,
        risk_level=RiskLevel.HIGH,
        evaluated_at=datetime.now(timezone.utc)
    )
    db.add(assessment)
    await db.flush()

    # 2. Dispatch high-priority pending counselor alert
    alert = Alert(
        id=uuid4(),
        assessment_id=assessment.id,
        student_id=current_user.id,
        counselor_id=None,
        status=AlertStatus.PENDING,
        created_at=datetime.now(timezone.utc)
    )
    db.add(alert)

    # 3. Log urgent SafetyEvent in audit log
    safety_event = SafetyEvent(
        id=str(uuid4()),
        student_id=str(current_user.id),
        severity="RED",
        trigger_type="EMERGENCY_SOS_BUTTON",
        status="OPEN",
        details=f"Urgent 1-Click SOS distress signal triggered by student ({current_user.full_name or current_user.email}). Immediate counselor outreach required.",
        created_at=datetime.now(timezone.utc)
    )
    db.add(safety_event)
    await db.commit()

    return {
        "status": "success",
        "message": "Emergency SOS alert dispatched to campus counseling staff.",
        "alert_id": str(alert.id),
        "helplines": [
            {
                "name": "Tele-MANAS (Govt of India)",
                "number": "14416",
                "badge": "24/7 Toll-Free",
                "description": "National tele-mental health programme of India"
            },
            {
                "name": "KIRAN Helpline",
                "number": "1800-599-0019",
                "badge": "24/7 Mental Health",
                "description": "Department of Empowerment of Persons with Disabilities"
            },
            {
                "name": "NMIMS Campus Clinic",
                "number": "+91 22 4235 5555",
                "badge": "Campus Security & Medical",
                "description": "On-campus emergency medical and psychological staff"
            }
        ]
    }

