from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID, uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from fastapi import HTTPException, status

from app.models.counselor_notes import CounselorNote
from app.models.case_notes import CaseNote
from app.models.alerts import Alert
from app.models.users import User
from app.schemas.notes import CounselorNoteResponse

class NotesService:
    async def create_alert_note(
        self,
        db: AsyncSession,
        alert_id: UUID,
        counselor: User,
        note_text: str
    ) -> CounselorNoteResponse:
        # Verify alert exists
        alert = await db.get(Alert, alert_id)
        if not alert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error_code": "ALERT_NOT_FOUND",
                    "message": "Alert not found.",
                    "details": {}
                }
            )

        now = datetime.now(timezone.utc)
        note_id = uuid4()
        note_obj = CounselorNote(
            id=note_id,
            alert_id=alert.id,
            student_id=alert.student_id,
            counselor_id=counselor.id,
            note=note_text.strip(),
            created_at=now
        )
        case_note_obj = CaseNote(
            id=note_id,
            alert_id=alert.id,
            student_id=alert.student_id,
            counselor_id=counselor.id,
            note=note_text.strip(),
            created_at=now
        )
        db.add(note_obj)
        db.add(case_note_obj)
        await db.commit()
        await db.refresh(note_obj)

        return CounselorNoteResponse(
            id=note_obj.id,
            alert_id=note_obj.alert_id,
            student_id=note_obj.student_id,
            counselor_id=note_obj.counselor_id,
            counselor_name=counselor.full_name or counselor.email,
            note=note_obj.note,
            created_at=note_obj.created_at
        )

    async def create_student_note(
        self,
        db: AsyncSession,
        student_id: UUID,
        counselor: User,
        note_text: str
    ) -> CounselorNoteResponse:
        student = await db.get(User, student_id)
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error_code": "STUDENT_NOT_FOUND",
                    "message": "Student not found.",
                    "details": {}
                }
            )

        now = datetime.now(timezone.utc)
        note_id = uuid4()
        note_obj = CounselorNote(
            id=note_id,
            alert_id=None,
            student_id=student_id,
            counselor_id=counselor.id,
            note=note_text.strip(),
            created_at=now
        )
        case_note_obj = CaseNote(
            id=note_id,
            alert_id=None,
            student_id=student_id,
            counselor_id=counselor.id,
            note=note_text.strip(),
            created_at=now
        )
        db.add(note_obj)
        db.add(case_note_obj)
        await db.commit()
        await db.refresh(note_obj)

        return CounselorNoteResponse(
            id=note_obj.id,
            alert_id=note_obj.alert_id,
            student_id=note_obj.student_id,
            counselor_id=note_obj.counselor_id,
            counselor_name=counselor.full_name or counselor.email,
            note=note_obj.note,
            created_at=note_obj.created_at
        )

    async def get_notes_for_alert(
        self,
        db: AsyncSession,
        alert_id: UUID
    ) -> List[CounselorNoteResponse]:
        stmt = (
            select(CounselorNote, User.full_name, User.email)
            .join(User, CounselorNote.counselor_id == User.id)
            .where(CounselorNote.alert_id == alert_id)
            .order_by(desc(CounselorNote.created_at))
        )
        res = await db.execute(stmt)
        notes_list: List[CounselorNoteResponse] = []
        for note_obj, c_name, c_email in res.all():
            notes_list.append(CounselorNoteResponse(
                id=note_obj.id,
                alert_id=note_obj.alert_id,
                student_id=note_obj.student_id,
                counselor_id=note_obj.counselor_id,
                counselor_name=c_name or c_email,
                note=note_obj.note,
                created_at=note_obj.created_at
            ))
        return notes_list

    async def get_notes_for_student(
        self,
        db: AsyncSession,
        student_id: UUID
    ) -> List[CounselorNoteResponse]:
        stmt = (
            select(CounselorNote, User.full_name, User.email)
            .join(User, CounselorNote.counselor_id == User.id)
            .where(CounselorNote.student_id == student_id)
            .order_by(desc(CounselorNote.created_at))
        )
        res = await db.execute(stmt)
        notes_list: List[CounselorNoteResponse] = []
        for note_obj, c_name, c_email in res.all():
            notes_list.append(CounselorNoteResponse(
                id=note_obj.id,
                alert_id=note_obj.alert_id,
                student_id=note_obj.student_id,
                counselor_id=note_obj.counselor_id,
                counselor_name=c_name or c_email,
                note=note_obj.note,
                created_at=note_obj.created_at
            ))
        return notes_list

notes_service = NotesService()
