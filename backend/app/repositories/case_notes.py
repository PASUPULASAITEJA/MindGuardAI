from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.case_notes import CaseNote
from app.repositories.base import BaseRepository


class CaseNoteRepository(BaseRepository[CaseNote]):
    def __init__(self):
        super().__init__(CaseNote)

    async def create_note(
        self,
        db: AsyncSession,
        *,
        student_id: UUID,
        counselor_id: UUID,
        note: str,
        alert_id: Optional[UUID] = None,
        category: str = "GENERAL"
    ) -> CaseNote:
        case_note = CaseNote(
            student_id=student_id,
            counselor_id=counselor_id,
            alert_id=alert_id,
            note=note,
            category=category,
            created_at=datetime.now(timezone.utc)
        )
        db.add(case_note)
        await db.commit()
        await db.refresh(case_note)
        return case_note

    async def get_for_student(
        self,
        db: AsyncSession,
        student_id: UUID,
        limit: int = 50
    ) -> List[CaseNote]:
        stmt = (
            select(CaseNote)
            .where(CaseNote.student_id == student_id)
            .order_by(desc(CaseNote.created_at))
            .limit(limit)
        )
        res = await db.execute(stmt)
        return list(res.scalars().all())

    async def get_for_alert(
        self,
        db: AsyncSession,
        alert_id: UUID
    ) -> List[CaseNote]:
        stmt = (
            select(CaseNote)
            .where(CaseNote.alert_id == alert_id)
            .order_by(desc(CaseNote.created_at))
        )
        res = await db.execute(stmt)
        return list(res.scalars().all())


case_note_repository = CaseNoteRepository()
