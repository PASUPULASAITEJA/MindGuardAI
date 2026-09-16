from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from uuid import UUID

from app.db.session import get_db
from app.api.dependencies import require_role, verify_student_consent
from app.models.users import User, UserRole
from app.models.alerts import AlertStatus, Alert
from app.schemas.alerts import ActiveAlertsResponse, AlertUpdateRequest, AlertUpdateResponse, SOSResponse, AssignAlertRequest
from app.schemas.notes import CreateCounselorNoteRequest, CounselorNoteResponse, CounselorNotesListResponse
from app.services.alerts import alert_service
from app.services.casefile_service import casefile_service
from app.services.notes_service import notes_service
from app.services.audit_service import audit_service

router = APIRouter()
_sos_cooldown_tracker = {}

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
    current_user: User = Depends(require_role([UserRole.COUNSELOR, UserRole.ADMIN]))
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
    current_user: User = Depends(require_role([UserRole.COUNSELOR, UserRole.ADMIN]))
):
    """
    Allows clinic counselors/admins to claim (REVIEWED) or close out (RESOLVED) high-risk warning alerts.
    """
    updated_alert = await alert_service.update_alert_status(
        db,
        alert_id=alert_id,
        status_update=payload.status,
        counselor=current_user
    )
    await audit_service.log_event(
        db,
        action="UPDATE_ALERT_STATUS",
        actor_user_id=current_user.id,
        actor_role=current_user.role.value,
        target_user_id=updated_alert.student_id,
        target_resource_type="ALERT",
        target_resource_id=str(alert_id),
        metadata={"new_status": payload.status.value if hasattr(payload.status, "value") else str(payload.status)}
    )
    return AlertUpdateResponse(
        id=updated_alert.id,
        status=updated_alert.status,
        counselor_id=updated_alert.counselor_id,
        severity=updated_alert.severity,
        resolved_at=updated_alert.resolved_at,
        message="Alert status updated successfully."
    )

@router.patch(
    "/alerts/{alert_id}/assign",
    response_model=AlertUpdateResponse,
    status_code=status.HTTP_200_OK,
    summary="Assign counselor to an alert or self-assign"
)
async def assign_alert_counselor(
    alert_id: UUID,
    payload: Optional[AssignAlertRequest] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.COUNSELOR, UserRole.ADMIN]))
):
    """
    Assigns an alert to a specific counselor or to the calling counselor/admin.
    Transitions alert from PENDING to REVIEWED if currently PENDING.
    """
    alert = await db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "ALERT_NOT_FOUND", "message": "The alert record does not exist.", "details": {}}
        )

    target_counselor_id = payload.counselor_id if (payload and payload.counselor_id) else current_user.id
    target_counselor = await db.get(User, target_counselor_id)
    if not target_counselor or target_counselor.role not in [UserRole.COUNSELOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": "INVALID_COUNSELOR", "message": "Specified user is not an active clinical counselor or admin.", "details": {}}
        )

    alert.counselor_id = target_counselor_id
    if alert.status == AlertStatus.PENDING:
        alert.status = AlertStatus.REVIEWED

    db.add(alert)
    await db.commit()
    await db.refresh(alert)

    await audit_service.log_event(
        db,
        action="ASSIGN_ALERT_COUNSELOR",
        actor_user_id=current_user.id,
        actor_role=current_user.role.value,
        target_user_id=alert.student_id,
        target_resource_type="ALERT",
        target_resource_id=str(alert.id),
        metadata={
            "alert_id": str(alert.id),
            "assigned_counselor_id": str(target_counselor_id),
            "assigned_by": str(current_user.id),
            "status": alert.status.value
        }
    )

    return AlertUpdateResponse(
        id=alert.id,
        status=alert.status,
        counselor_id=alert.counselor_id,
        severity=alert.severity,
        resolved_at=alert.resolved_at,
        message="Alert assigned successfully."
    )

@router.patch(
    "/alerts/{alert_id}/status",
    response_model=AlertUpdateResponse,
    status_code=status.HTTP_200_OK,
    summary="Update case workflow status for an alert"
)
async def patch_alert_status(
    alert_id: UUID,
    payload: AlertUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.COUNSELOR, UserRole.ADMIN]))
):
    """
    Updates the clinical triage status of an alert (PENDING, REVIEWED, RESOLVED).
    """
    from datetime import datetime, timezone
    alert = await db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "ALERT_NOT_FOUND", "message": "The alert record does not exist.", "details": {}}
        )

    old_status = alert.status
    alert.status = payload.status

    if payload.status == AlertStatus.RESOLVED:
        alert.resolved_at = datetime.now(timezone.utc)
    elif payload.status == AlertStatus.PENDING:
        alert.resolved_at = None

    if payload.status == AlertStatus.REVIEWED and not alert.counselor_id:
        alert.counselor_id = current_user.id

    db.add(alert)
    await db.commit()
    await db.refresh(alert)

    await audit_service.log_event(
        db,
        action="UPDATE_ALERT_STATUS",
        actor_user_id=current_user.id,
        actor_role=current_user.role.value,
        target_user_id=alert.student_id,
        target_resource_type="ALERT",
        target_resource_id=str(alert.id),
        metadata={
            "alert_id": str(alert.id),
            "old_status": old_status.value if hasattr(old_status, "value") else str(old_status),
            "new_status": alert.status.value if hasattr(alert.status, "value") else str(alert.status)
        }
    )

    return AlertUpdateResponse(
        id=alert.id,
        status=alert.status,
        counselor_id=alert.counselor_id,
        severity=alert.severity,
        resolved_at=alert.resolved_at,
        message="Alert status updated successfully."
    )

    
@router.get(
    "/students/{student_id}/casefile",
    status_code=status.HTTP_200_OK,
    summary="Get unified student clinical casefile and longitudinal timeline"
)
async def get_student_casefile(
    student_id: UUID,
    days: Optional[str] = Query("90", description="Timeframe filter: 30, 90, or all"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.COUNSELOR, UserRole.ADMIN]))
):
    """
    Retrieves aggregated clinical casefile for the designated student.
    Strictly verifies active student consent before returning timeline records.
    """
    # Enforce active consent check
    await verify_student_consent(db, student_id)

    casefile = await casefile_service.get_student_casefile(db, student_id=student_id, days=days)
    if not casefile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error_code": "STUDENT_NOT_FOUND",
                "message": "Student record not found.",
                "details": {}
            }
        )
    
    # Audit log access to sensitive student casefile
    await audit_service.log_event(
        db,
        action="VIEW_STUDENT_CASEFILE",
        actor_user_id=current_user.id,
        actor_role=current_user.role.value,
        target_user_id=student_id,
        target_resource_type="CASEFILE",
        target_resource_id=str(student_id),
        metadata={"timeframe_days": days}
    )

    return casefile

@router.post(
    "/alerts/{alert_id}/notes",
    response_model=CounselorNoteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record clinical counselor note on an alert"
)
async def add_alert_note(
    alert_id: UUID,
    payload: CreateCounselorNoteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.COUNSELOR, UserRole.ADMIN]))
):
    """
    Appends a timestamped clinical case note to the target alert and student history.
    """
    res = await notes_service.create_alert_note(
        db, alert_id=alert_id, counselor=current_user, note_text=payload.note
    )
    await audit_service.log_event(
        db,
        action="CREATE_CASE_NOTE",
        actor_user_id=current_user.id,
        actor_role=current_user.role.value,
        target_user_id=res.student_id,
        target_resource_type="NOTE",
        target_resource_id=str(res.id),
        metadata={"alert_id": str(alert_id)}
    )
    await audit_service.log_event(
        db,
        action="CREATE_COUNSELOR_NOTE",
        actor_user_id=current_user.id,
        actor_role=current_user.role.value,
        target_user_id=res.student_id,
        target_resource_type="NOTE",
        target_resource_id=str(res.id),
        metadata={"alert_id": str(alert_id)}
    )
    return res

@router.get(
    "/alerts/{alert_id}/notes",
    response_model=CounselorNotesListResponse,
    status_code=status.HTTP_200_OK,
    summary="List all counselor notes for a specific alert"
)
async def get_alert_notes(
    alert_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.COUNSELOR, UserRole.ADMIN]))
):
    """
    Retrieves chronological notes recorded for this specific alert incident.
    """
    notes = await notes_service.get_notes_for_alert(db, alert_id=alert_id)
    return CounselorNotesListResponse(notes=notes, total=len(notes))

@router.get(
    "/students/{student_id}/notes",
    response_model=CounselorNotesListResponse,
    status_code=status.HTTP_200_OK,
    summary="List all historical counselor notes for a student across all alerts"
)
async def get_student_notes(
    student_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.COUNSELOR, UserRole.ADMIN]))
):
    """
    Retrieves complete counselor note log for this student. Requires active student consent.
    """
    await verify_student_consent(db, student_id)
    notes = await notes_service.get_notes_for_student(db, student_id=student_id)
    return CounselorNotesListResponse(notes=notes, total=len(notes))

@router.post(
    "/students/{student_id}/notes",
    response_model=CounselorNoteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record clinical counselor note directly to a student casefile"
)
async def post_student_note(
    student_id: UUID,
    payload: CreateCounselorNoteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.COUNSELOR]))
):
    """
    Appends a direct clinical case note to the student file. Requires active student consent.
    """
    await verify_student_consent(db, student_id)
    return await notes_service.create_student_note(
        db, student_id=student_id, counselor=current_user, note_text=payload.note
    )

@router.post(
    "/sos",
    response_model=SOSResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Dispatch emergency SOS alert from distressed student"
)
async def trigger_emergency_sos(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.STUDENT, UserRole.COUNSELOR, UserRole.ADMIN]))
):
    """
    Immediate crisis distress escalation. Instantly alerts designated campus counselors,
    generates a CRITICAL alert, writes in-app notifications and audit logs, with per-user rate limiting.
    """
    from uuid import uuid4
    from datetime import datetime, timezone
    from sqlalchemy import select
    from app.models.assessments import Assessment, RiskLevel
    from app.models.alerts import Alert
    from app.models.chat import SafetyEvent
    from app.models.notification_deliveries import NotificationDelivery

    now = datetime.now(timezone.utc)

    # 1. Enforce Per-User Cooldown Rate Limiting (60 seconds)
    last_trigger = _sos_cooldown_tracker.get(current_user.id)
    if last_trigger:
        elapsed = (now - last_trigger).total_seconds()
        if elapsed < 60:
            remaining = int(60 - elapsed)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Emergency SOS alert was recently dispatched. Cooldown active for {remaining} seconds."
            )

    _sos_cooldown_tracker[current_user.id] = now

    # 2. Create immediate CRITICAL clinical assessment
    assessment = Assessment(
        id=uuid4(),
        student_id=current_user.id,
        mental_wellness_score=5.0,
        risk_level=RiskLevel.CRITICAL,
        evaluated_at=now
    )
    db.add(assessment)
    await db.flush()

    # 3. Dispatch CRITICAL pending counselor alert
    alert = Alert(
        id=uuid4(),
        assessment_id=assessment.id,
        student_id=current_user.id,
        counselor_id=None,
        status=AlertStatus.PENDING,
        severity="CRITICAL",
        created_at=now
    )
    db.add(alert)

    # 4. Log urgent SafetyEvent in database
    safety_event = SafetyEvent(
        id=str(uuid4()),
        student_id=str(current_user.id),
        severity="CRITICAL",
        trigger_type="EMERGENCY_SOS_BUTTON",
        status="OPEN",
        details=f"CRITICAL 1-Click SOS distress signal triggered by student ({current_user.full_name or current_user.email}). Immediate counselor outreach required.",
        created_at=now
    )
    db.add(safety_event)

    # 5. Create in-app notifications for counselors & administrators
    staff_stmt = select(User).where(User.role.in_([UserRole.COUNSELOR, UserRole.ADMIN]))
    staff_res = await db.execute(staff_stmt)
    staff_members = staff_res.scalars().all()
    for staff in staff_members:
        delivery = NotificationDelivery(
            id=uuid4(),
            event_type="EMERGENCY_SOS",
            recipient_user_id=staff.id,
            recipient_email=staff.email,
            channel="IN_APP",
            status="SENT",
            subject="CRITICAL: Emergency SOS Triggered",
            body_preview=f"Student ({current_user.full_name or current_user.email}) triggered an urgent Emergency SOS signal.",
            sent_at=now,
            created_at=now
        )
        db.add(delivery)

    await db.commit()

    # 6. Log high-priority audit event
    await audit_service.log_event(
        db,
        action="DISPATCH_EMERGENCY_SOS",
        actor_user_id=current_user.id,
        actor_role=current_user.role.value,
        target_user_id=current_user.id,
        target_resource_type="SOS",
        target_resource_id=str(alert.id),
        metadata={
            "trigger_type": "EMERGENCY_SOS_BUTTON",
            "alert_id": str(alert.id),
            "severity": "CRITICAL"
        }
    )

    # 7. Dispatch emergency email alert to campus counseling staff
    try:
        from app.services.email_service import email_service
        await email_service.notify_counselors_on_high_risk(
            db,
            student=current_user,
            assessment_id=assessment.id,
            alert_id=alert.id,
            event_type="EMERGENCY_SOS",
            custom_message=f"CRITICAL 1-CLICK SOS DISTRESS SIGNAL triggered by student ({current_user.full_name or current_user.email}). Immediate counselor contact and welfare check required."
        )
    except Exception:
        pass

    return {
        "status": "success",
        "message": "Emergency SOS alert dispatched to campus counseling staff.",
        "alert_id": str(alert.id),
        "severity": "CRITICAL",
        "created_at": now.isoformat(),
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

