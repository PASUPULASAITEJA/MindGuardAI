import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List
from uuid import UUID, uuid4

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.behavioral import BehavioralLog
from app.models.assessments import Assessment, RiskLevel
from app.models.alerts import Alert, AlertStatus
from app.models.chat import SafetyEvent
from app.models.users import User
from app.schemas.chatbot import BehavioralFeaturesPayload

logger = logging.getLogger("mindguard-behavioral-service")

class BehavioralService:
    """
    Service responsible for:
    1. Ingesting consented laptop/PC behavioral telemetry.
    2. Computing personalized 14-day rolling baseline deviations (Z-score).
    3. Circadian disruption (12 AM - 5 AM late-night screen time) modeling.
    4. Multi-modal risk fusion with counselor triage and automated guardian alerts.
    """

    async def ingest_and_evaluate(
        self,
        db: AsyncSession,
        student: User,
        payload: BehavioralFeaturesPayload
    ) -> Dict[str, Any]:
        """
        Processes PC telemetry, compares with personal baseline, and updates clinical state.
        """
        # 1. Fetch historical 14-day behavioral logs for baseline comparison
        stmt = (
            select(BehavioralLog)
            .where(BehavioralLog.student_id == student.id)
            .order_by(desc(BehavioralLog.synced_at))
            .limit(14)
        )
        result = await db.execute(stmt)
        history_logs: List[BehavioralLog] = result.scalars().all()

        # 2. Compute personalized baseline statistics
        if len(history_logs) >= 3:
            screen_times = [log.total_screen_time_minutes for log in history_logs]
            late_nights = [log.late_night_usage_minutes for log in history_logs]
            
            mean_screen = sum(screen_times) / len(screen_times)
            mean_late = sum(late_nights) / len(late_nights)
            
            std_late = (sum((x - mean_late) ** 2 for x in late_nights) / len(late_nights)) ** 0.5
            std_late = max(30.0, std_late)  # Clinically realistic minimum variance threshold
        else:
            mean_screen = 240.0  # Default 4 hours
            mean_late = 20.0     # Default 20 mins
            std_late = 35.0      # Population variance prior

        # 3. Calculate Normalized Baseline Deviation Z-Score
        late_night_deviation_z = (payload.late_night_usage_minutes - mean_late) / std_late
        late_night_deviation_z = round(float(late_night_deviation_z), 2)

        # 4. Context-Aware Behavioral Risk Determination:
        # --- RULE 1: High Screen Time Risk Evaluated by Usage Purpose ---
        # --- RULE 2: Last Night Screen Time & Circadian Disruption Evaluation ---
        behavioral_risk_level = "LOW"
        risk_reasons = []

        total_mins = max(1, payload.total_screen_time_minutes)
        academic_mins = payload.academic_usage_minutes
        social_mins = payload.social_usage_minutes
        entertainment_mins = payload.entertainment_usage_minutes
        adult_mins = payload.adult_usage_minutes
        late_night_mins = payload.late_night_usage_minutes
        non_academic_mins = social_mins + entertainment_mins + adult_mins

        academic_ratio = academic_mins / total_mins
        non_academic_ratio = non_academic_mins / total_mins
        is_academic_heavy = academic_ratio >= 0.65

        # Priority 1: Direct Crisis Search Trigger (Immediate Escalation)
        if payload.is_crisis_search_flag:
            behavioral_risk_level = "HIGH"
            risk_reasons.append("Urgent distress/crisis search query detected in active browser window.")
        
        # Priority 2: Compulsive Sensitive/Adult Browsing
        if adult_mins >= 30:
            if behavioral_risk_level != "HIGH":
                behavioral_risk_level = "HIGH"
            risk_reasons.append(f"Compulsive sensitive/adult content browsing spike ({adult_mins}m). High correlation with acute stress/avoidance coping.")
        elif adult_mins >= 10:
            if behavioral_risk_level == "LOW":
                behavioral_risk_level = "MEDIUM"
            risk_reasons.append(f"Sensitive content detected ({adult_mins}m). Healthy boundary pacing advised.")

        # Priority 3: Severe Continuous Screen Strain (No breaks for 5h+)
        if payload.continuous_screen_minutes >= 300:
            if behavioral_risk_level != "HIGH":
                behavioral_risk_level = "HIGH"
            risk_reasons.append(f"Excessive unbroken screen strain ({payload.continuous_screen_minutes}m without rest break). Immediate digital detox recommended.")
        elif payload.continuous_screen_minutes >= 180:
            if behavioral_risk_level == "LOW":
                behavioral_risk_level = "MEDIUM"
            risk_reasons.append(f"Prolonged continuous computer usage ({payload.continuous_screen_minutes}m continuous). 20-20-20 eye rest advised.")

        # --- RULE 1: Screen Time Purpose Differentiation ---
        if total_mins >= 300:
            if is_academic_heavy:
                # Heavy screen time dedicated to academic coursework/coding -> NOT HIGH RISK
                risk_reasons.append(f"High Academic Focus: {int(academic_ratio * 100)}% dedicated to coursework & development ({academic_mins}m).")
            elif non_academic_mins >= 360 or (non_academic_mins >= 250 and academic_mins < 30):
                # Extreme digital isolation & near-zero academic productivity -> HIGH RISK
                if behavioral_risk_level != "HIGH":
                    behavioral_risk_level = "HIGH"
                risk_reasons.append(f"Elevated digital isolation & passive doom-scrolling ({non_academic_mins}m social/media, {int(non_academic_ratio * 100)}% of total). Depressive avoidance marker.")
            elif non_academic_mins >= 240:
                # Moderate social & recreational browsing
                if behavioral_risk_level == "LOW":
                    behavioral_risk_level = "MEDIUM"
                risk_reasons.append(f"Elevated social & recreational screen time ({non_academic_mins}m). Consider taking digital breaks.")

        # --- RULE 2: Last Night Screen Time & Circadian Evaluation (12 AM - 5 AM) ---
        if late_night_mins > 0:
            if is_academic_heavy:
                # Late-night study session for assignments / exams
                if late_night_mins >= 240:
                    if behavioral_risk_level == "LOW":
                        behavioral_risk_level = "MEDIUM"
                    risk_reasons.append(f"Extended late-night exam/project study ({late_night_mins}m). Hydration & morning rest recovery recommended.")
                elif late_night_mins >= 60:
                    risk_reasons.append(f"Productive late-night academic study ({late_night_mins}m coding/study).")
            else:
                # Late-night passive social media doom-scrolling, gaming, or entertainment
                if late_night_mins >= 180 or (late_night_deviation_z >= 2.5 and late_night_mins >= 150):
                    behavioral_risk_level = "HIGH"
                    risk_reasons.append(f"Critical late-night circadian disruption ({late_night_mins} mins past midnight, Z={late_night_deviation_z}). Social doom-scrolling suppresses melatonin.")
                elif late_night_mins >= 60 or late_night_deviation_z >= 1.8:
                    if behavioral_risk_level == "LOW":
                        behavioral_risk_level = "MEDIUM"
                    risk_reasons.append(f"Moderate circadian sleep disruption ({late_night_mins} mins after midnight).")



        # 5. Check if entry for today already exists (Upsert)
        today_str = payload.date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
        existing_stmt = select(BehavioralLog).where(
            BehavioralLog.student_id == student.id,
            BehavioralLog.date == today_str
        )
        existing_res = await db.execute(existing_stmt)
        existing_log = existing_res.scalar_one_or_none()

        if existing_log:
            existing_log.total_screen_time_minutes = payload.total_screen_time_minutes
            existing_log.late_night_usage_minutes = payload.late_night_usage_minutes
            existing_log.academic_usage_minutes = payload.academic_usage_minutes
            existing_log.social_usage_minutes = payload.social_usage_minutes
            existing_log.entertainment_usage_minutes = payload.entertainment_usage_minutes
            existing_log.adult_usage_minutes = payload.adult_usage_minutes
            existing_log.continuous_screen_minutes = payload.continuous_screen_minutes
            existing_log.is_crisis_detected = payload.is_crisis_search_flag
            existing_log.baseline_deviation_score = late_night_deviation_z
            existing_log.risk_level = behavioral_risk_level
            existing_log.synced_at = datetime.now(timezone.utc)
            db_log = existing_log
        else:
            db_log = BehavioralLog(
                id=uuid4(),
                student_id=student.id,
                date=today_str,
                total_screen_time_minutes=payload.total_screen_time_minutes,
                late_night_usage_minutes=payload.late_night_usage_minutes,
                academic_usage_minutes=payload.academic_usage_minutes,
                social_usage_minutes=payload.social_usage_minutes,
                entertainment_usage_minutes=payload.entertainment_usage_minutes,
                adult_usage_minutes=payload.adult_usage_minutes,
                continuous_screen_minutes=payload.continuous_screen_minutes,
                is_crisis_detected=payload.is_crisis_search_flag,
                baseline_deviation_score=late_night_deviation_z,
                risk_level=behavioral_risk_level,
                synced_at=datetime.now(timezone.utc)
            )
            db.add(db_log)

        # 6. High-Risk Automated Counselor & Guardian Escalation
        escalated_alert_id = None
        if behavioral_risk_level == "HIGH":
            logger.warning(
                f"[BEHAVIORAL CRISIS] Student {student.id} triggered severe late-night digital biomarker risk (Z={late_night_deviation_z})."
            )
            # Create Assessment in Decision Diamond
            assessment = Assessment(
                id=uuid4(),
                student_id=student.id,
                mental_wellness_score=20.0,
                risk_level=RiskLevel.HIGH,
                evaluated_at=datetime.now(timezone.utc)
            )
            db.add(assessment)
            await db.flush()

            # Push to Counselor Triage Queue
            alert = Alert(
                id=uuid4(),
                assessment_id=assessment.id,
                student_id=student.id,
                counselor_id=None,
                status=AlertStatus.PENDING
            )
            db.add(alert)

            # Log Safety Event
            safety_event = SafetyEvent(
                id=uuid4(),
                student_id=student.id,
                severity="RED",
                trigger_type="SEVERE_CIRCADIAN_DISRUPTION",
                status="OPEN",
                details=f"Automated PC Agent Alert: {'; '.join(risk_reasons)}"
            )
            db.add(safety_event)
            escalated_alert_id = str(alert.id)

        await db.commit()

        return {
            "status": "INGESTED_AND_EVALUATED",
            "student_id": str(student.id),
            "date": today_str,
            "metrics": {
                "total_screen_time_minutes": payload.total_screen_time_minutes,
                "late_night_usage_minutes": payload.late_night_usage_minutes,
                "academic_usage_minutes": payload.academic_usage_minutes,
                "social_usage_minutes": payload.social_usage_minutes,
                "entertainment_usage_minutes": payload.entertainment_usage_minutes,
            },
            "baseline_analysis": {
                "mean_screen_time_minutes": round(mean_screen, 1),
                "mean_late_night_minutes": round(mean_late, 1),
                "deviation_z_score": late_night_deviation_z,
            },
            "risk_assessment": {
                "risk_level": behavioral_risk_level,
                "reasons": risk_reasons,
                "counselor_escalated": behavioral_risk_level == "HIGH",
                "alert_id": escalated_alert_id
            }
        }

    async def get_student_summary(
        self,
        db: AsyncSession,
        student_id: UUID
    ) -> Dict[str, Any]:
        """
        Retrieves live PC digital phenotyping metrics for the student dashboard.
        """
        stmt = (
            select(BehavioralLog)
            .where(BehavioralLog.student_id == student_id)
            .order_by(desc(BehavioralLog.synced_at))
            .limit(7)
        )
        res = await db.execute(stmt)
        recent_logs: List[BehavioralLog] = res.scalars().all()

        if not recent_logs:
            # Auto-initialize an active baseline session for the logged-in student
            today_str = datetime.now(timezone.utc).date().isoformat()
            default_log = BehavioralLog(
                student_id=student_id,
                date=today_str,
                total_screen_time_minutes=0,
                late_night_usage_minutes=0,
                academic_usage_minutes=0,
                social_usage_minutes=0,
                entertainment_usage_minutes=0,
                baseline_deviation_score=0.0,
                risk_level="LOW"
            )
            db.add(default_log)
            await db.commit()
            await db.refresh(default_log)
            recent_logs = [default_log]

        latest = recent_logs[0]

        # Calculate time since last sync
        now = datetime.now(timezone.utc)
        synced_at = latest.synced_at
        if synced_at.tzinfo is None:
            synced_at = synced_at.replace(tzinfo=timezone.utc)

        diff_mins = int((now - synced_at).total_seconds() / 60)
        is_live = diff_mins <= 10

        # --- RULE 1: Purpose Health Breakdown ---
        total_mins = latest.total_screen_time_minutes
        acad_mins = latest.academic_usage_minutes
        soc_mins = latest.social_usage_minutes
        ent_mins = latest.entertainment_usage_minutes
        adult_mins = getattr(latest, "adult_usage_minutes", 0) or 0
        non_acad_mins = soc_mins + ent_mins + adult_mins

        if total_mins == 0:
            acad_pct = 0
            non_acad_pct = 0
            purpose_status = "Tracking Active (Awaiting Session Activity)"
            purpose_tier = "AWAITING"
            purpose_advice = "Your screen activity is actively monitoring in the background. Move your mouse, browse, or code to track your session live."
        else:
            safe_total = max(1, total_mins)
            acad_pct = round((acad_mins / safe_total) * 100)
            non_acad_pct = min(100, 100 - acad_pct)

            if acad_pct >= 65:
                purpose_status = "Productive Academic Focus"
                purpose_tier = "POSITIVE"
                purpose_advice = f"{acad_pct}% of screen time dedicated to coursework & development."
            elif non_acad_pct >= 60 and total_mins >= 240:
                purpose_status = "High Social & Doom-Scrolling Isolation"
                purpose_tier = "CRITICAL"
                purpose_advice = f"{non_acad_pct}% spent on passive social media/gaming. Step outside or connect with peers."
            else:
                purpose_status = "Balanced Digital Routine"
                purpose_tier = "BALANCED"
                purpose_advice = "Balanced distribution between studies and leisure."


        # --- RULE 2: Last Night Circadian Sleep Disruption Analysis ---
        late_mins = latest.late_night_usage_minutes
        if late_mins >= 120:
            circadian_status = "Critical Circadian Sleep Delay"
            circadian_tier = "HIGH"
            estimated_sleep_onset = "After 02:30 AM"
            circadian_debt_hours = round(min(4.5, (late_mins / 60) * 0.9), 1)
            recovery_tip = "☀️ High circadian debt accrued last night. Get 10–15 min direct morning sunlight before 10 AM to reset cortisol."
        elif late_mins >= 45:
            circadian_status = "Moderate Late-Night Sleep Delay"
            circadian_tier = "MEDIUM"
            estimated_sleep_onset = "Around 01:15 AM"
            circadian_debt_hours = round(min(2.5, (late_mins / 60) * 0.7), 1)
            recovery_tip = "🌙 Active past midnight. Dim screens 30 mins before bed tonight to restore natural melatonin release."
        else:
            circadian_status = "Optimal Circadian Sleep Alignment"
            circadian_tier = "HEALTHY"
            estimated_sleep_onset = "Before 12:00 AM"
            circadian_debt_hours = 0.0
            recovery_tip = "✨ Screen shut off before midnight! Sleep architecture was well-preserved."

        return {
            "is_agent_connected": True,
            "is_currently_active": is_live,
            "last_synced_minutes_ago": diff_mins,
            "purpose_analysis": {
                "academic_percentage": acad_pct,
                "non_academic_percentage": non_acad_pct,
                "purpose_status": purpose_status,
                "purpose_tier": purpose_tier,
                "purpose_advice": purpose_advice,
            },
            "circadian_sleep_analysis": {
                "last_night_minutes": late_mins,
                "circadian_status": circadian_status,
                "circadian_tier": circadian_tier,
                "estimated_sleep_onset": estimated_sleep_onset,
                "circadian_debt_hours": circadian_debt_hours,
                "recovery_tip": recovery_tip,
            },
            "latest_log": {
                "date": latest.date,
                "total_screen_time_minutes": latest.total_screen_time_minutes,
                "late_night_usage_minutes": latest.late_night_usage_minutes,
                "academic_usage_minutes": latest.academic_usage_minutes,
                "social_usage_minutes": latest.social_usage_minutes,
                "entertainment_usage_minutes": latest.entertainment_usage_minutes,
                "adult_usage_minutes": getattr(latest, "adult_usage_minutes", 0) or 0,
                "continuous_screen_minutes": getattr(latest, "continuous_screen_minutes", 0) or 0,
                "is_crisis_detected": bool(getattr(latest, "is_crisis_detected", False)),
                "baseline_deviation_score": latest.baseline_deviation_score,
                "risk_level": latest.risk_level,
                "synced_at": latest.synced_at.isoformat()
            },
            "weekly_history": [
                {
                    "date": log.date,
                    "total_screen_time_minutes": log.total_screen_time_minutes,
                    "late_night_usage_minutes": log.late_night_usage_minutes,
                    "risk_level": log.risk_level
                }
                for log in reversed(recent_logs)
            ]
        }


behavioral_service = BehavioralService()
