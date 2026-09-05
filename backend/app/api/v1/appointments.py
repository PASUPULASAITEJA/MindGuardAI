from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models.users import User, UserRole
from app.models.appointments import Appointment, AppointmentStatus
from app.schemas.appointments import (
    AppointmentCreateRequest,
    AppointmentStatusUpdateRequest,
    AppointmentResponse,
    AppointmentListResponse,
)

router = APIRouter()

@router.post(
    "",
    response_model=AppointmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Schedule a counseling session"
)
async def create_appointment(
    payload: AppointmentCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Allows students to book 1-on-1 virtual or in-person appointments with university counselors.
    """
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"message": "Only students may schedule counseling appointments."}
        )

    new_appointment = Appointment(
        student_id=current_user.id,
        counselor_id=payload.counselor_id,
        appointment_type=payload.appointment_type,
        scheduled_time=payload.scheduled_time,
        reason=payload.reason,
        status=AppointmentStatus.PENDING
    )
    db.add(new_appointment)
    await db.commit()
    await db.refresh(new_appointment)
    return new_appointment

@router.get(
    "/my",
    response_model=AppointmentListResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve current user's appointments"
)
async def get_my_appointments(
    status_filter: Optional[AppointmentStatus] = Query(None, description="Filter by status"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns appointments for the authenticated student or counselor.
    """
    query = select(Appointment)
    if current_user.role == UserRole.STUDENT:
        query = query.where(Appointment.student_id == current_user.id)
    elif current_user.role == UserRole.COUNSELOR:
        # Show appointments specifically assigned to this counselor OR unassigned pending ones
        query = query.where(
            (Appointment.counselor_id == current_user.id) | 
            (Appointment.counselor_id.is_(None) & (Appointment.status == AppointmentStatus.PENDING))
        )
    else:
        # Admin can view all
        pass

    if status_filter:
        query = query.where(Appointment.status == status_filter)

    query = query.order_by(Appointment.scheduled_time.desc())
    result = await db.execute(query)
    appointments = list(result.scalars().all())

    return AppointmentListResponse(
        appointments=appointments,
        total=len(appointments)
    )

@router.patch(
    "/{appointment_id}/status",
    response_model=AppointmentResponse,
    status_code=status.HTTP_200_OK,
    summary="Update appointment workflow status"
)
async def update_appointment_status(
    appointment_id: UUID,
    payload: AppointmentStatusUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Allows counselors to confirm, complete, cancel or annotate appointments.
    """
    if current_user.role not in [UserRole.COUNSELOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"message": "Only clinical counselors and administrators can update appointment statuses."}
        )

    appointment = await db.get(Appointment, appointment_id)
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "Appointment not found."}
        )

    appointment.status = payload.status
    if payload.notes is not None:
        appointment.notes = payload.notes
    if current_user.role == UserRole.COUNSELOR and not appointment.counselor_id:
        appointment.counselor_id = current_user.id

    await db.commit()
    await db.refresh(appointment)
    return appointment
