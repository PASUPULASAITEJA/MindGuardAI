import math
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timezone, timedelta, date
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.users import User
from app.models.sleep_logs import SleepLog
from app.repositories.sleep_logs import sleep_log_repository
from app.schemas.sleep_logs import (
    SleepLogCreateRequest,
    SleepLogResponse,
    SleepLogListResponse,
    SleepAnalysisResponse,
)
from app.services.audit_service import audit_service


class SleepService:
    async def record_sleep_log(
        self,
        db: AsyncSession,
        student: User,
        payload: SleepLogCreateRequest
    ) -> SleepLog:
        """
        Records or updates a daily sleep log for the student.
        """
        # Check if log already exists for this date; if so, update it
        existing = await sleep_log_repository.get_by_user_and_date(
            db, user_id=student.id, log_date=payload.log_date
        )

        if existing:
            existing.bedtime = payload.bedtime
            existing.wake_time = payload.wake_time
            existing.sleep_hours = payload.sleep_hours
            existing.sleep_quality = payload.sleep_quality
            existing.nap_taken = payload.nap_taken
            existing.nap_duration_minutes = payload.nap_duration_minutes
            existing.sleep_disruptions = payload.sleep_disruptions
            existing.source = payload.source
            saved = existing
            await db.commit()
            await db.refresh(saved)
        else:
            log_obj = SleepLog(
                user_id=student.id,
                log_date=payload.log_date,
                bedtime=payload.bedtime,
                wake_time=payload.wake_time,
                sleep_hours=payload.sleep_hours,
                sleep_quality=payload.sleep_quality,
                nap_taken=payload.nap_taken,
                nap_duration_minutes=payload.nap_duration_minutes,
                sleep_disruptions=payload.sleep_disruptions,
                source=payload.source,
            )
            saved = await sleep_log_repository.create(db, log_obj)

        await audit_service.log_event(
            db,
            action="RECORD_SLEEP_LOG",
            actor_user_id=student.id,
            actor_role=student.role.value,
            target_user_id=student.id,
            target_resource_type="SLEEP_LOG",
            target_resource_id=str(saved.id),
            metadata={
                "log_date": str(saved.log_date),
                "sleep_hours": float(saved.sleep_hours),
                "sleep_quality": saved.sleep_quality
            }
        )

        return saved

    async def get_sleep_logs(
        self,
        db: AsyncSession,
        student_id: UUID,
        range_str: str = "7d"
    ) -> SleepLogListResponse:
        days = 30 if range_str == "30d" else 7
        logs = await sleep_log_repository.get_by_user(db, user_id=student_id, days=days, limit=100)
        items = [SleepLogResponse.model_validate(log) for log in logs]

        return SleepLogListResponse(
            items=items,
            total=len(items),
            range=range_str
        )

    async def get_sleep_analysis(
        self,
        db: AsyncSession,
        student_id: UUID,
        days: int = 7
    ) -> SleepAnalysisResponse:
        """
        Computes 7-day or 30-day sleep metrics:
        - sleep_consistency_7d = STDDEV(sleep_hours) over the window
        - Evaluates flags: avg_sleep < 6.0, consistency > 2.0, quality < 2.0
        """
        logs = await sleep_log_repository.get_by_user(db, user_id=student_id, days=days, limit=100)

        if not logs:
            return SleepAnalysisResponse(
                days_analyzed=0,
                avg_sleep_hours=7.5,
                sleep_consistency_7d=0.0,
                avg_quality_score=3.0,
                avg_disruptions=0.0,
                total_naps_count=0,
                is_flagged_risk=False,
                risk_reasons=[],
                circadian_insight="No recent sleep telemetry recorded. Log your nightly sleep cycles to establish your circadian baseline.",
                sleep_hygiene_recommendations=[
                    "Maintain a consistent bedtime within a 30-minute window each night.",
                    "Limit blue light exposure 45 minutes prior to sleep.",
                    "Get 10 minutes of direct morning sunlight to anchor your circadian rhythm."
                ]
            )

        n = len(logs)
        hours_list = [float(l.sleep_hours) for l in logs]
        quality_list = [l.sleep_quality for l in logs]
        disruptions_list = [l.sleep_disruptions for l in logs]
        total_naps = sum(1 for l in logs if l.nap_taken)

        avg_hours = sum(hours_list) / n
        avg_quality = sum(quality_list) / n
        avg_disruptions = sum(disruptions_list) / n

        # Sample Standard Deviation of sleep hours
        if n > 1:
            variance = sum((h - avg_hours) ** 2 for h in hours_list) / (n - 1)
            stddev = math.sqrt(variance)
        else:
            stddev = 0.0

        stddev = round(stddev, 2)
        avg_hours = round(avg_hours, 1)
        avg_quality = round(avg_quality, 1)
        avg_disruptions = round(avg_disruptions, 1)

        # Risk Rule Checks
        risk_reasons: List[str] = []
        if avg_hours < 6.0:
            risk_reasons.append("Chronic sleep deficit: Average nightly sleep is below 6.0 hours, impairing memory retention and emotional regulation.")
        if stddev > 2.0:
            risk_reasons.append("High circadian inconsistency: Sleep duration varies by > 2.0 hours, indicating irregular sleep schedule / social jetlag.")
        if avg_quality < 2.0:
            risk_reasons.append("Non-restorative sleep quality: Average subjective quality index is below 2.0 (Poor/Fair).")

        is_flagged = len(risk_reasons) > 0

        # Circadian narrative
        if is_flagged:
            circadian_insight = f"Elevated circadian strain detected over past {n} logged days. Erratic sleep schedules heighten academic burnout susceptibility."
        else:
            circadian_insight = f"Healthy circadian rhythm maintained. Your sleep consistency of ±{stddev}h supports optimal cognitive performance."

        # Recommendations
        recommendations = [
            "Keep bedtime and wake-up times within a 30-minute consistency band every day.",
            "Avoid caffeinated drinks at least 6 hours before planned bedtime.",
            "If daytime energy drops, restrict naps to 20-30 minutes before 3:00 PM."
        ]
        if stddev > 2.0:
            recommendations.insert(0, "Stabilize weekend vs weekday wake times to reduce circadian phase delay.")
        if avg_hours < 6.0:
            recommendations.insert(0, "Gradually shift bedtime earlier in 15-minute increments toward a 7-8 hour target.")

        return SleepAnalysisResponse(
            days_analyzed=n,
            avg_sleep_hours=avg_hours,
            sleep_consistency_7d=stddev,
            avg_quality_score=avg_quality,
            avg_disruptions=avg_disruptions,
            total_naps_count=total_naps,
            is_flagged_risk=is_flagged,
            risk_reasons=risk_reasons,
            circadian_insight=circadian_insight,
            sleep_hygiene_recommendations=recommendations
        )


sleep_service = SleepService()
