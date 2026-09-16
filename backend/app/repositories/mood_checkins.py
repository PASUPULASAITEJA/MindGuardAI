from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timezone, timedelta, date
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.mood_checkins import MoodCheckin


class MoodCheckinRepository:
    async def create(
        self,
        db: AsyncSession,
        checkin: MoodCheckin
    ) -> MoodCheckin:
        db.add(checkin)
        await db.commit()
        await db.refresh(checkin)
        return checkin

    async def get_by_user(
        self,
        db: AsyncSession,
        user_id: UUID,
        days: Optional[int] = None,
        limit: int = 100
    ) -> List[MoodCheckin]:
        stmt = select(MoodCheckin).where(MoodCheckin.user_id == user_id)
        if days is not None and days > 0:
            since = datetime.now(timezone.utc) - timedelta(days=days)
            stmt = stmt.where(MoodCheckin.created_at >= since)

        stmt = stmt.order_by(MoodCheckin.created_at.desc()).limit(limit)
        res = await db.execute(stmt)
        return list(res.scalars().all())

    async def calculate_streak(
        self,
        db: AsyncSession,
        user_id: UUID
    ) -> int:
        """
        Calculates consecutive days of check-in activity up to current date.
        """
        stmt = (
            select(MoodCheckin.created_at)
            .where(MoodCheckin.user_id == user_id)
            .order_by(MoodCheckin.created_at.desc())
        )
        res = await db.execute(stmt)
        timestamps = res.scalars().all()

        if not timestamps:
            return 0

        # Extract unique dates in UTC
        unique_dates = sorted(
            list({ts.date() if isinstance(ts, datetime) else ts for ts in timestamps}),
            reverse=True
        )

        today = datetime.now(timezone.utc).date()
        yesterday = today - timedelta(days=1)

        # Check if latest checkin is today or yesterday
        if unique_dates[0] not in [today, yesterday]:
            return 0

        streak = 1
        expected_date = unique_dates[0] - timedelta(days=1)

        for d in unique_dates[1:]:
            if d == expected_date:
                streak += 1
                expected_date -= timedelta(days=1)
            else:
                break

        return streak

    async def get_summary_stats(
        self,
        db: AsyncSession,
        user_id: UUID
    ) -> Dict[str, Any]:
        """
        Computes aggregated summary stats across the student's EMA history.
        """
        checkins = await self.get_by_user(db, user_id=user_id, days=30, limit=100)
        streak = await self.calculate_streak(db, user_id=user_id)

        if not checkins:
            return {
                "total_checkins": 0,
                "streak_days": 0,
                "avg_mood_score": 7.0,
                "avg_energy_level": 7.0,
                "avg_anxiety_level": 3.0,
                "avg_sleep_hours": 7.5,
                "sleep_quality_breakdown": {"good": 0, "great": 0, "fair": 0, "poor": 0},
                "common_emotions": {},
                "common_stress_sources": {},
                "latest_checkin": None
            }

        total = len(checkins)
        avg_mood = sum(c.mood_score for c in checkins) / total
        avg_energy = sum(c.energy_level for c in checkins) / total
        avg_anxiety = sum(c.anxiety_level for c in checkins) / total
        avg_sleep = sum(float(c.sleep_hours) for c in checkins) / total

        sleep_quality_counts: Dict[str, int] = {}
        for c in checkins:
            sq = c.sleep_quality.lower()
            sleep_quality_counts[sq] = sleep_quality_counts.get(sq, 0) + 1

        emotion_counts: Dict[str, int] = {}
        for c in checkins:
            em = c.primary_emotion.lower()
            emotion_counts[em] = emotion_counts.get(em, 0) + 1

        stress_counts: Dict[str, int] = {}
        for c in checkins:
            if c.stress_source:
                ss = c.stress_source.lower()
                stress_counts[ss] = stress_counts.get(ss, 0) + 1

        return {
            "total_checkins": total,
            "streak_days": streak,
            "avg_mood_score": round(avg_mood, 1),
            "avg_energy_level": round(avg_energy, 1),
            "avg_anxiety_level": round(avg_anxiety, 1),
            "avg_sleep_hours": round(avg_sleep, 1),
            "sleep_quality_breakdown": sleep_quality_counts,
            "common_emotions": emotion_counts,
            "common_stress_sources": stress_counts,
            "latest_checkin": checkins[0]
        }


mood_checkin_repository = MoodCheckinRepository()
