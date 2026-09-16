from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.users import User
from app.models.mood_checkins import MoodCheckin
from app.repositories.mood_checkins import mood_checkin_repository
from app.schemas.mood_checkins import (
    MoodCheckinCreateRequest,
    MoodCheckinResponse,
    MoodCheckinListResponse,
    MoodCheckinSummaryResponse
)
from app.services.audit_service import audit_service


class MoodCheckinService:
    async def record_checkin(
        self,
        db: AsyncSession,
        student: User,
        payload: MoodCheckinCreateRequest
    ) -> MoodCheckin:
        """
        Creates and persists an Ecological Momentary Assessment (EMA) check-in.
        Evaluates acute somatic distress indicators to provide compassionate follow-ups.
        """
        checkin = MoodCheckin(
            user_id=student.id,
            checkin_type=payload.checkin_type,
            mood_score=payload.mood_score,
            energy_level=payload.energy_level,
            anxiety_level=payload.anxiety_level,
            sleep_quality=payload.sleep_quality,
            sleep_hours=payload.sleep_hours,
            primary_emotion=payload.primary_emotion.strip().lower(),
            one_word_feeling=payload.one_word_feeling.strip() if payload.one_word_feeling else None,
            stress_source=payload.stress_source.strip().lower() if payload.stress_source else None,
        )

        saved = await mood_checkin_repository.create(db, checkin)

        # Audit logging
        await audit_service.log_event(
            db,
            action="RECORD_MOOD_CHECKIN",
            actor_user_id=student.id,
            actor_role=student.role.value,
            target_user_id=student.id,
            target_resource_type="MOOD_CHECKIN",
            target_resource_id=str(saved.id),
            metadata={
                "checkin_type": saved.checkin_type,
                "mood_score": saved.mood_score,
                "anxiety_level": saved.anxiety_level
            }
        )

        return saved

    async def get_checkins(
        self,
        db: AsyncSession,
        student_id: UUID,
        range_str: str = "7d"
    ) -> MoodCheckinListResponse:
        days = 30 if range_str == "30d" else 7
        checkins = await mood_checkin_repository.get_by_user(db, user_id=student_id, days=days, limit=100)
        items = [MoodCheckinResponse.model_validate(c) for c in checkins]

        return MoodCheckinListResponse(
            items=items,
            total=len(items),
            range=range_str
        )

    async def get_summary(
        self,
        db: AsyncSession,
        student_id: UUID
    ) -> MoodCheckinSummaryResponse:
        stats = await mood_checkin_repository.get_summary_stats(db, user_id=student_id)
        latest = stats.get("latest_checkin")
        latest_schema = MoodCheckinResponse.model_validate(latest) if latest else None

        return MoodCheckinSummaryResponse(
            total_checkins=stats["total_checkins"],
            streak_days=stats["streak_days"],
            avg_mood_score=stats["avg_mood_score"],
            avg_energy_level=stats["avg_energy_level"],
            avg_anxiety_level=stats["avg_anxiety_level"],
            avg_sleep_hours=stats["avg_sleep_hours"],
            sleep_quality_breakdown=stats["sleep_quality_breakdown"],
            common_emotions=stats["common_emotions"],
            common_stress_sources=stats["common_stress_sources"],
            latest_checkin=latest_schema
        )


mood_checkin_service = MoodCheckinService()
