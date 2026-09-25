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
from app.models.mood_checkins import MoodCheckin
from app.models.sleep_logs import SleepLog
from app.schemas.trends import (
    WellnessTrendPoint,
    WellnessTrendResponse,
    WellnessTrendSummary,
    PersonalBaseline
)


class TrendAnalysisService:
    """
    Analyzes longitudinal wellness metrics, computes rolling averages,
    evaluates personal baselines with non-stigmatizing deviations,
    and derives multi-dimensional clinical trajectory trends.
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
        if timeframe in ("7d", "7D"):
            days = 7
        elif timeframe in ("90d", "90D", "3m", "3M"):
            days = 90
        elif timeframe in ("180d", "180D", "6m", "6M"):
            days = 180

        cutoff = now - timedelta(days=days)
        recent_7d_cutoff = now - timedelta(days=7)

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

        # 3. Query mood micro checkins
        stmt_checkins = (
            select(MoodCheckin)
            .where(MoodCheckin.user_id == student_id, MoodCheckin.created_at >= cutoff)
            .order_by(MoodCheckin.created_at.asc())
        )
        res_checkins = await db.execute(stmt_checkins)
        micro_checkins: List[MoodCheckin] = list(res_checkins.scalars().all())

        # 4. Query sleep logs
        stmt_sleep = (
            select(SleepLog)
            .where(SleepLog.user_id == student_id, SleepLog.log_date >= cutoff.date())
            .order_by(SleepLog.log_date.asc())
        )
        res_sleep = await db.execute(stmt_sleep)
        sleep_logs: List[SleepLog] = list(res_sleep.scalars().all())

        # Build day-based lookup: date_str -> list of points
        day_buckets: Dict[str, dict] = {}

        for a in assessments:
            d_str = a.evaluated_at.strftime("%Y-%m-%d")
            if d_str not in day_buckets:
                day_buckets[d_str] = {
                    "wellness_scores": [],
                    "mood_scores": [],
                    "stress_scores": [],
                    "sleep_hours": [],
                    "phq9": getattr(a, "phq9_score", None),
                    "gad7": getattr(a, "gad7_score", None),
                    "risk_levels": [],
                    "sentiments": [],
                    "emotions": []
                }
            day_buckets[d_str]["wellness_scores"].append(float(a.mental_wellness_score))
            day_buckets[d_str]["risk_levels"].append(a.risk_level.value if hasattr(a.risk_level, "value") else str(a.risk_level))
            phq9_val = getattr(a, "phq9_score", None)
            gad7_val = getattr(a, "gad7_score", None)
            if phq9_val is not None:
                day_buckets[d_str]["phq9"] = phq9_val
            if gad7_val is not None:
                day_buckets[d_str]["gad7"] = gad7_val

        for mood, emotion in mood_entries:
            d_str = mood.logged_at.strftime("%Y-%m-%d")
            if d_str not in day_buckets:
                day_buckets[d_str] = {
                    "wellness_scores": [],
                    "mood_scores": [],
                    "stress_scores": [],
                    "sleep_hours": [],
                    "phq9": None,
                    "gad7": None,
                    "risk_levels": [],
                    "sentiments": [],
                    "emotions": []
                }
            if mood.self_reported_score is not None:
                day_buckets[d_str]["mood_scores"].append(float(mood.self_reported_score))
                day_buckets[d_str]["wellness_scores"].append(float(mood.self_reported_score * 10))
            if emotion:
                if emotion.sentiment_score is not None:
                    day_buckets[d_str]["sentiments"].append(float(emotion.sentiment_score))
                if emotion.primary_emotion:
                    day_buckets[d_str]["emotions"].append(emotion.primary_emotion)

        for c in micro_checkins:
            d_str = c.created_at.strftime("%Y-%m-%d")
            if d_str not in day_buckets:
                day_buckets[d_str] = {
                    "wellness_scores": [],
                    "mood_scores": [],
                    "stress_scores": [],
                    "sleep_hours": [],
                    "phq9": None,
                    "gad7": None,
                    "risk_levels": [],
                    "sentiments": [],
                    "emotions": []
                }
            if c.mood_score is not None:
                day_buckets[d_str]["mood_scores"].append(float(c.mood_score))
                day_buckets[d_str]["wellness_scores"].append(float(c.mood_score * 10))
            if hasattr(c, "anxiety_level") and c.anxiety_level is not None:
                day_buckets[d_str]["stress_scores"].append(float(c.anxiety_level))
            elif hasattr(c, "stress_level") and c.stress_level is not None:
                day_buckets[d_str]["stress_scores"].append(float(c.stress_level))

        for s in sleep_logs:
            d_str = s.log_date.strftime("%Y-%m-%d") if hasattr(s.log_date, "strftime") else str(s.log_date)
            if d_str not in day_buckets:
                day_buckets[d_str] = {
                    "wellness_scores": [],
                    "mood_scores": [],
                    "stress_scores": [],
                    "sleep_hours": [],
                    "phq9": None,
                    "gad7": None,
                    "risk_levels": [],
                    "sentiments": [],
                    "emotions": []
                }
            if s.sleep_duration_hours is not None:
                day_buckets[d_str]["sleep_hours"].append(float(s.sleep_duration_hours))

        # Sort dates chronologically
        sorted_dates = sorted(day_buckets.keys())

        raw_points: List[dict] = []
        all_emotions: List[str] = []
        all_stress_hist: List[float] = []
        all_sleep_hist: List[float] = []
        all_mood_hist: List[float] = []

        recent_stress: List[float] = []
        recent_sleep: List[float] = []
        recent_mood: List[float] = []

        for d_str in sorted_dates:
            data = day_buckets[d_str]
            scores = data["wellness_scores"]
            avg_score = sum(scores) / len(scores) if scores else 65.0
            avg_score = round(avg_score, 1)

            moods = data["mood_scores"]
            avg_mood = round(sum(moods) / len(moods), 1) if moods else None
            if avg_mood:
                all_mood_hist.append(avg_mood)

            stresses = data["stress_scores"]
            avg_stress = round(sum(stresses) / len(stresses), 1) if stresses else None
            if avg_stress:
                all_stress_hist.append(avg_stress)

            sleeps = data["sleep_hours"]
            avg_sleep = round(sum(sleeps) / len(sleeps), 1) if sleeps else None
            if avg_sleep:
                all_sleep_hist.append(avg_sleep)

            # Check if date is in recent 7 days
            try:
                dt_point = datetime.strptime(d_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                if dt_point >= recent_7d_cutoff:
                    if avg_stress: recent_stress.append(avg_stress)
                    if avg_sleep: recent_sleep.append(avg_sleep)
                    if avg_mood: recent_mood.append(avg_mood)
            except Exception:
                pass

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
                "mood_score": avg_mood,
                "stress_level": avg_stress,
                "sleep_hours": avg_sleep,
                "phq9_score": data.get("phq9"),
                "gad7_score": data.get("gad7"),
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
                    mood_score=pt["mood_score"],
                    stress_level=pt["stress_level"],
                    sleep_hours=pt["sleep_hours"],
                    phq9_score=pt["phq9_score"],
                    gad7_score=pt["gad7_score"],
                    nlp_sentiment=pt["nlp_sentiment"],
                    primary_emotion=pt["primary_emotion"],
                    risk_level=pt["risk_level"],
                    rolling_avg=rolling
                )
            )

        # Compute Personal Baseline
        total_obs = len(all_scores)
        if total_obs >= 7:
            confidence = "HIGH"
        elif total_obs >= 3:
            confidence = "MODERATE"
        else:
            confidence = "ESTABLISHING"

        u_stress = round(sum(all_stress_hist) / len(all_stress_hist), 1) if all_stress_hist else None
        r_stress = round(sum(recent_stress) / len(recent_stress), 1) if recent_stress else u_stress
        delta_stress = round(r_stress - u_stress, 1) if (r_stress is not None and u_stress is not None) else None

        u_sleep = round(sum(all_sleep_hist) / len(all_sleep_hist), 1) if all_sleep_hist else None
        r_sleep = round(sum(recent_sleep) / len(recent_sleep), 1) if recent_sleep else u_sleep
        delta_sleep = round(r_sleep - u_sleep, 1) if (r_sleep is not None and u_sleep is not None) else None

        u_mood = round(sum(all_mood_hist) / len(all_mood_hist), 1) if all_mood_hist else None
        r_mood = round(sum(recent_mood) / len(recent_mood), 1) if recent_mood else u_mood
        delta_mood = round(r_mood - u_mood, 1) if (r_mood is not None and u_mood is not None) else None

        if confidence == "ESTABLISHING":
            summary_msg = "Continue checking in regularly to establish your personal wellbeing baseline."
        elif delta_stress and delta_stress >= 2.0:
            summary_msg = "Your recent stress is elevated compared with your personal baseline."
        elif delta_sleep and delta_sleep <= -1.5:
            summary_msg = "Your recent sleep duration is below your personal baseline."
        elif delta_mood and delta_mood >= 1.0:
            summary_msg = "Your recent mood indicators show an upward trend above your baseline."
        else:
            summary_msg = "Your recent wellbeing indicators are within your usual personal baseline range."

        personal_baseline = PersonalBaseline(
            usual_stress=u_stress,
            recent_stress=r_stress,
            stress_delta=delta_stress,
            usual_sleep_hours=u_sleep,
            recent_sleep_hours=r_sleep,
            sleep_delta=delta_sleep,
            usual_mood_score=u_mood,
            recent_mood_score=r_mood,
            mood_delta=delta_mood,
            baseline_confidence=confidence,
            observations_count=total_obs,
            summary_message=summary_msg
        )

        # Summary calculations
        if all_scores:
            mean_score = round(sum(all_scores) / len(all_scores), 1)
            highest = round(max(all_scores), 1)
            lowest = round(min(all_scores), 1)
            delta = round(all_scores[-1] - all_scores[0], 1)

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
            total_checkins=len(assessments) + len(mood_entries) + len(micro_checkins),
            volatility_score=volatility,
            highest_score=highest,
            lowest_score=lowest
        )

        return WellnessTrendResponse(
            student_id=student_id,
            timeframe=timeframe,
            summary=summary,
            baseline=personal_baseline,
            points=trend_points
        )


trend_service = TrendAnalysisService()
