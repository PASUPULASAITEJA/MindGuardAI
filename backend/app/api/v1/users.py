from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.dependencies import require_role
from app.models.users import User, UserRole
from app.schemas.users import UserProfileResponse, UserDirectoryResponse
from app.schemas.audit import AuditLogListResponse
from app.schemas.notification_deliveries import NotificationDeliveriesListResponse
from app.services.user import user_service
from app.services.audit_service import audit_service

# Define separate routers to mount under different paths as per API.md paths
students_router = APIRouter()
admin_router = APIRouter()

from app.schemas.users import UserProfileResponse, UserProfileUpdateRequest, UserDirectoryResponse

@students_router.get(
    "/me",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current student profile"
)
async def get_student_profile(
    current_user: User = Depends(require_role([UserRole.STUDENT]))
):
    """
    Retrieves the profile information for the authenticated student.
    """
    return current_user

@students_router.put(
    "/me",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Update current student profile and preferences"
)
async def update_student_profile(
    payload: UserProfileUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.STUDENT]))
):
    """
    Updates emergency contacts, academic details, and counselor sharing consent.
    """
    if payload.full_name is not None:
        current_user.full_name = payload.full_name.strip()
    if payload.phone_number is not None:
        current_user.phone_number = payload.phone_number.strip()
    if payload.emergency_contact_name is not None:
        current_user.emergency_contact_name = payload.emergency_contact_name.strip()
    if payload.emergency_contact_phone is not None:
        current_user.emergency_contact_phone = payload.emergency_contact_phone.strip()
    if payload.academic_department is not None:
        current_user.academic_department = payload.academic_department.strip()
    if payload.consent_counselor_sharing is not None:
        current_user.consent_counselor_sharing = payload.consent_counselor_sharing

    await db.commit()
    await db.refresh(current_user)
    return current_user


@admin_router.get(
    "/users",
    response_model=UserDirectoryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get user directory (paginated)"
)
async def get_user_directory(
    role: Optional[UserRole] = Query(None, description="Filter users by role"),
    page: int = Query(1, ge=1, description="Page number"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    """
    Retrieves a paginated list of all users registered in the system. Accessible only by Institution Admins.
    """
    users, total_pages = await user_service.get_users_directory(
        db,
        role=role,
        page=page,
        page_size=10
    )
    
    return UserDirectoryResponse(
        users=users,
        page=page,
        total_pages=total_pages
    )

@admin_router.get(
    "/audit-logs",
    response_model=AuditLogListResponse,
    status_code=status.HTTP_200_OK,
    summary="Get institutional security and clinical access audit logs"
)
async def get_audit_logs(
    action: Optional[str] = Query(None, description="Filter by action code"),
    actor_role: Optional[str] = Query(None, description="Filter by actor role"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(25, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    """
    Retrieves immutable audit records for regulatory compliance, forensics, and privacy governance.
    """
    logs, total = await audit_service.get_audit_logs(
        db, page=page, page_size=page_size, action=action, actor_role=actor_role
    )
    return AuditLogListResponse(
        logs=logs,
        total=total,
        page=page,
        page_size=page_size
    )

@admin_router.get(
    "/notifications/deliveries",
    response_model=NotificationDeliveriesListResponse,
    status_code=status.HTTP_200_OK,
    summary="Get notification deliveries log"
)
async def get_notification_deliveries(
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    delivery_status: Optional[str] = Query(None, alias="status", description="Filter by delivery status: SENT, FAILED"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(25, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.COUNSELOR]))
):
    """
    Retrieves history of dispatched email alert notifications for administrative compliance and delivery auditing.
    """
    from app.services.email_service import email_service
    deliveries, total = await email_service.get_deliveries_log(
        db, page=page, page_size=page_size, event_type=event_type, status=delivery_status
    )
    return NotificationDeliveriesListResponse(
        deliveries=deliveries,
        total=total,
        page=page,
        page_size=page_size
    )
