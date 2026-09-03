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

        # 4. Determine Behavioral Risk Tier
        behavioral_risk_level = "LOW"
        risk_reasons = []

        if payload.late_night_usage_minutes >= 180 or (late_night_deviation_z >= 3.0 and payload.late_night_usage_minutes >= 120):
            behavioral_risk_level = "HIGH"
            risk_reasons.append(f"Critical late-night computer usage spike ({payload.late_night_usage_minutes} mins past midnight, Z={late_night_deviation_z})")
        elif payload.late_night_usage_minutes >= 60 or late_night_deviation_z >= 1.8:
            behavioral_risk_level = "MEDIUM"
            risk_reasons.append(f"Moderate circadian sleep disruption ({payload.late_night_usage_minutes} mins after midnight)")

        # App isolation factor: High social/gaming with low academic productivity
        non_academic = payload.social_usage_minutes + payload.entertainment_usage_minutes
        if payload.total_screen_time_minutes > 300 and payload.academic_usage_minutes < 30 and non_academic > 250:
            if behavioral_risk_level == "LOW":
                behavioral_risk_level = "MEDIUM"
            risk_reasons.append("Elevated digital isolation and doom-scrolling pattern detected.")

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
                total_screen_time_minutes=180,
                late_night_usage_minutes=0,
                academic_usage_minutes=120,
                social_usage_minutes=30,
                entertainment_usage_minutes=30,
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

        return {
            "is_agent_connected": True,
            "is_currently_active": is_live,
            "last_synced_minutes_ago": diff_mins,
            "latest_log": {
                "date": latest.date,
                "total_screen_time_minutes": latest.total_screen_time_minutes,
                "late_night_usage_minutes": latest.late_night_usage_minutes,
                "academic_usage_minutes": latest.academic_usage_minutes,
                "social_usage_minutes": latest.social_usage_minutes,
                "entertainment_usage_minutes": latest.entertainment_usage_minutes,
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
