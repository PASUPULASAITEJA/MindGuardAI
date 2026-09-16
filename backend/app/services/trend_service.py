import math
from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assessments import Assessment, RiskLevel
from app.models.emotion_analyses import EmotionAnalysis
from app.models.mood_logs import MoodLog
from app.schemas.trends import WellnessTrendPoint, WellnessTrendResponse, WellnessTrendSummary


class TrendAnalysisService:
    """
    Analyzes longitudinal wellness metrics, computes rolling averages,
    evaluates score volatility, and derives clinical trajectory trends.
    """

    async def get_student_trends(
        self,
        db: AsyncSession,
        *,
        student_id: UUID,
        timeframe: str = "30d"
    ) -> WellnessTrendResponse:
        now = datetime.now(timezone.utc)
        days = 30
        if timeframe == "7d":
            days = 7
        elif timeframe == "90d":
            days = 90

        cutoff = now - timedelta(days=days)

        # 1. Query assessments within window
        stmt_assessments = (
            select(Assessment)
            .where(Assessment.student_id == student_id, Assessment.evaluated_at >= cutoff)
            .order_by(Assessment.evaluated_at.asc())
        )
        res_assessments = await db.execute(stmt_assessments)
        assessments: List[Assessment] = list(res_assessments.scalars().all())

        # 2. Query mood logs & emotion analyses within window
        stmt_moods = (
            select(MoodLog, EmotionAnalysis)
            .outerjoin(EmotionAnalysis, EmotionAnalysis.mood_log_id == MoodLog.id)
            .where(MoodLog.student_id == student_id, MoodLog.logged_at >= cutoff)
            .order_by(MoodLog.logged_at.asc())
        )
        res_moods = await db.execute(stmt_moods)
        mood_entries = res_moods.all()

        # Build day-based lookup: date_str -> list of points
        day_buckets: Dict[str, dict] = {}

        for a in assessments:
            d_str = a.evaluated_at.strftime("%Y-%m-%d")
            if d_str not in day_buckets:
                day_buckets[d_str] = {
                    "wellness_scores": [],
                    "risk_levels": [],
                    "sentiments": [],
                    "emotions": []
                }
            day_buckets[d_str]["wellness_scores"].append(float(a.mental_wellness_score))
            day_buckets[d_str]["risk_levels"].append(a.risk_level.value if hasattr(a.risk_level, "value") else str(a.risk_level))

        for mood, emotion in mood_entries:
            d_str = mood.logged_at.strftime("%Y-%m-%d")
            if d_str not in day_buckets:
                day_buckets[d_str] = {
                    "wellness_scores": [],
                    "risk_levels": [],
                    "sentiments": [],
                    "emotions": []
                }
            if mood.self_reported_score is not None:
                # Scaled to 0-100 if no assessment exists for this day
                day_buckets[d_str]["wellness_scores"].append(float(mood.self_reported_score * 10))
            if emotion:
                if emotion.sentiment_score is not None:
                    day_buckets[d_str]["sentiments"].append(float(emotion.sentiment_score))
                if emotion.primary_emotion:
                    day_buckets[d_str]["emotions"].append(emotion.primary_emotion)

        # Sort dates chronologically
        sorted_dates = sorted(day_buckets.keys())

        raw_points: List[dict] = []
        all_emotions: List[str] = []

        for d_str in sorted_dates:
            data = day_buckets[d_str]
            scores = data["wellness_scores"]
            avg_score = sum(scores) / len(scores) if scores else 65.0
            avg_score = round(avg_score, 1)

            sentiments = data["sentiments"]
            avg_sentiment = round(sum(sentiments) / len(sentiments), 2) if sentiments else None

            emotions = data["emotions"]
            primary_emo = Counter(emotions).most_common(1)[0][0] if emotions else None
            if emotions:
                all_emotions.extend(emotions)

            # Determine dominant risk tier for the day
            risks = data["risk_levels"]
            if "CRITICAL" in risks:
                day_risk = "CRITICAL"
            elif "HIGH" in risks:
                day_risk = "HIGH"
            elif "MEDIUM" in risks:
                day_risk = "MEDIUM"
            elif avg_score < 40:
                day_risk = "HIGH"
            elif avg_score < 60:
                day_risk = "MEDIUM"
            else:
                day_risk = "LOW"

            raw_points.append({
                "date": d_str,
                "wellness_score": avg_score,
                "nlp_sentiment": avg_sentiment,
                "primary_emotion": primary_emo,
                "risk_level": day_risk
            })

        # Calculate rolling moving average across points
        trend_points: List[WellnessTrendPoint] = []
        all_scores: List[float] = []

        for i, pt in enumerate(raw_points):
            all_scores.append(pt["wellness_score"])
            # Window of up to 3 points
            window = [p["wellness_score"] for p in raw_points[max(0, i - 2): i + 1]]
            rolling = round(sum(window) / len(window), 1)

            trend_points.append(
                WellnessTrendPoint(
                    date=pt["date"],
                    wellness_score=pt["wellness_score"],
                    phq9_score=None,
                    gad7_score=None,
                    nlp_sentiment=pt["nlp_sentiment"],
                    primary_emotion=pt["primary_emotion"],
                    risk_level=pt["risk_level"],
                    rolling_avg=rolling
                )
            )

        # Summary calculations
        if all_scores:
            mean_score = round(sum(all_scores) / len(all_scores), 1)
            highest = round(max(all_scores), 1)
            lowest = round(min(all_scores), 1)
            delta = round(all_scores[-1] - all_scores[0], 1)

            # Standard deviation for volatility index
            if len(all_scores) > 1:
                variance = sum((x - mean_score) ** 2 for x in all_scores) / (len(all_scores) - 1)
                volatility = round(math.sqrt(variance), 1)
            else:
                volatility = 0.0

            if delta >= 3.0:
                direction = "IMPROVING"
            elif delta <= -3.0:
                direction = "DECLINING"
            else:
                direction = "STABLE"
        else:
            mean_score = 70.0
            highest = 70.0
            lowest = 70.0
            delta = 0.0
            volatility = 0.0
            direction = "STABLE"

        emotion_counter = Counter(all_emotions)
        dominant_emotion = emotion_counter.most_common(1)[0][0] if all_emotions else "calm"
        emotion_dist = dict(emotion_counter)

        summary = WellnessTrendSummary(
            average_wellness_score=mean_score,
            wellness_delta=delta,
            direction=direction,
            dominant_emotion=dominant_emotion,
            emotion_distribution=emotion_dist,
            total_checkins=len(assessments) + len(mood_entries),
            volatility_score=volatility,
            highest_score=highest,
            lowest_score=lowest
        )

        return WellnessTrendResponse(
            student_id=student_id,
            timeframe=timeframe,
            summary=summary,
            points=trend_points
        )


trend_service = TrendAnalysisService()
