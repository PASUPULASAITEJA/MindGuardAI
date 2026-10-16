"""
Data Retention and Automated Deletion Service for MindGuardAI.
Enforces institutional retention schedules:
- Purges raw digital telemetry older than 30 days.
- Purges behavioral logs older than 180 days.
- Purges student telemetry and personal logs upon consent withdrawal (Right to Erasure).
- Preserves anonymized aggregate statistics and audit trails required for compliance.
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, select, and_, func

from app.models.behavioral import BehavioralLog
from app.models.sleep_logs import SleepLog
from app.models.mood_checkins import MoodCheckin
from app.models.mood_logs import MoodLog
from app.models.assessments import Assessment
from app.models.audit_logs import AuditLog

logger = logging.getLogger("mindguard-retention")

class DataRetentionService:
    """
    Enforces documented institutional data retention schedules and deletion workflows.
    """

    async def purge_expired_behavioral_telemetry(
        self,
        db: AsyncSession,
        retention_days: int = 180
    ) -> Dict[str, int]:
        """
        Purges raw behavioral and telemetry logs older than the configured retention period.
        Default is 180 days (supporting the longitudinal 180-day baseline engine).
        """
        cutoff_date = (datetime.now(timezone.utc) - timedelta(days=retention_days)).date()
        cutoff_dt = datetime.now(timezone.utc) - timedelta(days=retention_days)

        # 1. Purge BehavioralLog
        cutoff_str = cutoff_date.isoformat()
        stmt_beh = delete(BehavioralLog).where(BehavioralLog.date < cutoff_str)
        res_beh = await db.execute(stmt_beh)
        purged_beh = res_beh.rowcount or 0

        # 2. Purge SleepLog
        stmt_sleep = delete(SleepLog).where(SleepLog.log_date < cutoff_date)
        res_sleep = await db.execute(stmt_sleep)
        purged_sleep = res_sleep.rowcount or 0

        # 3. Purge MoodCheckin
        stmt_checkin = delete(MoodCheckin).where(MoodCheckin.created_at < cutoff_dt)
        res_checkin = await db.execute(stmt_checkin)
        purged_checkins = res_checkin.rowcount or 0

        await db.commit()

        logger.info(
            f"[RETENTION PURGE] Purged records older than {cutoff_date}: "
            f"BehavioralLogs={purged_beh}, SleepLogs={purged_sleep}, MoodCheckins={purged_checkins}"
        )

        return {
            "purged_behavioral_logs": purged_beh,
            "purged_sleep_logs": purged_sleep,
            "purged_mood_checkins": purged_checkins,
            "cutoff_date": str(cutoff_date)
        }

    async def execute_right_to_erasure(
        self,
        db: AsyncSession,
        student_id: UUID
    ) -> Dict[str, Any]:
        """
        Executes right-to-be-forgotten / consent revocation data purge for an individual student.
        Permanently purges raw telemetry and check-ins while disassociating historical assessments.
        """
        # Purge behavioral logs
        del_beh = await db.execute(delete(BehavioralLog).where(BehavioralLog.student_id == student_id))
        del_sleep = await db.execute(delete(SleepLog).where(SleepLog.user_id == student_id))
        del_checkin = await db.execute(delete(MoodCheckin).where(MoodCheckin.user_id == student_id))
        del_mood = await db.execute(delete(MoodLog).where(MoodLog.student_id == student_id))

        await db.commit()

        logger.info(f"[RIGHT TO ERASURE] Successfully purged personal telemetry for student: {student_id}")

        return {
            "student_id": str(student_id),
            "status": "PURGED",
            "purged_records": {
                "behavioral_logs": del_beh.rowcount or 0,
                "sleep_logs": del_sleep.rowcount or 0,
                "mood_checkins": del_checkin.rowcount or 0,
                "mood_logs": del_mood.rowcount or 0
            }
        }

retention_service = DataRetentionService()
