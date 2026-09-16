from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.models.users import User
from app.models.assessments import Assessment
from app.models.mood_logs import MoodLog
from app.models.emotion_analyses import EmotionAnalysis
from app.models.alerts import Alert, AlertStatus
from app.models.appointments import Appointment
from app.models.chat import SafetyEvent
from app.models.behavioral import BehavioralLog
from app.models.consent import Consent, ConsentStatus
from app.models.counselor_notes import CounselorNote

class CaseFileService:
    async def get_student_casefile(
        self,
        db: AsyncSession,
        student_id: UUID,
        days: Optional[str] = "90"
    ) -> Optional[Dict[str, Any]]:
        # 1. Fetch Student User
        student = await db.get(User, student_id)
        if not student:
            return None

        # 2. Check Consent Status
        consent_stmt = select(Consent).where(
            Consent.student_id == student_id,
            Consent.consent_type == "COUNSELOR_DATA_ACCESS"
        ).order_by(desc(Consent.created_at)).limit(1)
        consent_res = await db.execute(consent_stmt)
        consent = consent_res.scalars().first()
        consent_status = consent.status.value if consent else ConsentStatus.PENDING.value

        # 3. Calculate Cutoff Timestamp
        now = datetime.now(timezone.utc)
        cutoff_dt: Optional[datetime] = None
        if days and days != "all":
            try:
                num_days = int(days)
                cutoff_dt = now - timedelta(days=num_days)
            except ValueError:
                cutoff_dt = now - timedelta(days=90)

        timeline_events: List[Dict[str, Any]] = []

        # 4. Fetch Clinical Assessments
        assessment_q = select(Assessment).where(Assessment.student_id == student_id)
        if cutoff_dt:
            assessment_q = assessment_q.where(Assessment.evaluated_at >= cutoff_dt)
        assessment_q = assessment_q.order_by(desc(Assessment.evaluated_at))
        assessment_res = await db.execute(assessment_q)
        assessments = assessment_res.scalars().all()

        for a in assessments:
            eval_time = a.evaluated_at.isoformat() if a.evaluated_at else now.isoformat()
            risk_val = a.risk_level.value if hasattr(a.risk_level, "value") else str(a.risk_level)
            severity = "CRITICAL" if risk_val == "HIGH" else ("MEDIUM" if risk_val == "MEDIUM" else "LOW")
            timeline_events.append({
                "id": str(a.id),
                "event_type": "ASSESSMENT",
                "timestamp": eval_time,
                "title": f"Clinical Assessment ({risk_val} Risk)",
                "summary": f"Mental wellness score evaluated at {a.mental_wellness_score:.1f}/100.",
                "severity": severity,
                "details": {
                    "wellness_score": a.mental_wellness_score,
                    "risk_level": risk_val,
                }
            })

        # 5. Fetch Emotion Analyses (via MoodLog)
        emotion_q = (
            select(EmotionAnalysis, MoodLog.raw_content, MoodLog.logged_at.label("log_time"))
            .join(MoodLog, EmotionAnalysis.mood_log_id == MoodLog.id)
            .where(MoodLog.student_id == student_id)
        )
        if cutoff_dt:
            emotion_q = emotion_q.where(EmotionAnalysis.analyzed_at >= cutoff_dt)
        emotion_q = emotion_q.order_by(desc(EmotionAnalysis.analyzed_at))
        emotion_res = await db.execute(emotion_q)
        for ea, log_content, log_time in emotion_res.all():
            ea_time = ea.analyzed_at.isoformat() if ea.analyzed_at else (log_time.isoformat() if log_time else now.isoformat())
            top_emotions = ea.detected_emotions or {}
            sorted_emotions = sorted(top_emotions.items(), key=lambda x: x[1], reverse=True)
            primary_label = sorted_emotions[0][0] if sorted_emotions else "neutral"
            snippet = (log_content[:90] + "...") if log_content and len(log_content) > 90 else (log_content or "")

            timeline_events.append({
                "id": str(ea.id),
                "event_type": "EMOTION_ANALYSIS",
                "timestamp": ea_time,
                "title": f"Sentiment Analysis: {primary_label.title()}",
                "summary": f"Detected {primary_label} sentiment. Excerpt: \"{snippet}\"",
                "severity": "MEDIUM" if primary_label in ["sadness", "fear", "anger"] else "NORMAL",
                "details": {
                    "sentiment_score": ea.sentiment_score,
                    "emotions": top_emotions,
                    "journal_excerpt": log_content
                }
            })

        # 6. Fetch Alerts
        alert_q = select(Alert).where(Alert.student_id == student_id)
        if cutoff_dt:
            alert_q = alert_q.where(Alert.created_at >= cutoff_dt)
        alert_q = alert_q.order_by(desc(Alert.created_at))
        alert_res = await db.execute(alert_q)
        alerts = alert_res.scalars().all()

        for alt in alerts:
            alt_time = alt.created_at.isoformat() if alt.created_at else now.isoformat()
            st_val = alt.status.value if hasattr(alt.status, "value") else str(alt.status)
            timeline_events.append({
                "id": str(alt.id),
                "event_type": "ALERT",
                "timestamp": alt_time,
                "title": f"Clinical Alert ({st_val})",
                "summary": f"High-risk early warning status: {st_val}",
                "severity": "CRITICAL" if st_val == "PENDING" else "MEDIUM",
                "details": {
                    "status": st_val,
                    "counselor_id": str(alt.counselor_id) if alt.counselor_id else None,
                    "resolved_at": alt.resolved_at.isoformat() if alt.resolved_at else None
                }
            })

        # 7. Fetch Appointments
        app_q = select(Appointment).where(Appointment.student_id == student_id)
        if cutoff_dt:
            app_q = app_q.where(Appointment.scheduled_time >= cutoff_dt)
        app_q = app_q.order_by(desc(Appointment.scheduled_time))
        app_res = await db.execute(app_q)
        appointments = app_res.scalars().all()

        for appt in appointments:
            appt_time = appt.scheduled_time.isoformat() if appt.scheduled_time else now.isoformat()
            status_val = appt.status.value if hasattr(appt.status, "value") else str(appt.status)
            timeline_events.append({
                "id": str(appt.id),
                "event_type": "APPOINTMENT",
                "timestamp": appt_time,
                "title": f"Counseling Appointment ({status_val})",
                "summary": f"{appt.appointment_type.value if hasattr(appt.appointment_type, 'value') else appt.appointment_type} session. Reason: {appt.reason or 'Routine wellness check'}",
                "severity": "NORMAL",
                "details": {
                    "status": status_val,
                    "appointment_type": appt.appointment_type.value if hasattr(appt.appointment_type, "value") else str(appt.appointment_type),
                    "reason": appt.reason,
                    "notes": appt.notes
                }
            })

        # 8. Fetch Safety Events (SOS / Crisis)
        try:
            safety_q = select(SafetyEvent).where(SafetyEvent.student_id == student_id)
            if cutoff_dt:
                safety_q = safety_q.where(SafetyEvent.created_at >= cutoff_dt)
            safety_q = safety_q.order_by(desc(SafetyEvent.created_at))
            safety_res = await db.execute(safety_q)
            safety_events = safety_res.scalars().all()

            for se in safety_events:
                se_time = se.created_at.isoformat() if se.created_at else now.isoformat()
                timeline_events.append({
                    "id": str(se.id),
                    "event_type": "SAFETY_EVENT",
                    "timestamp": se_time,
                    "title": f"Safety Incident: {se.trigger_type}",
                    "summary": se.details or "Emergency safety escalation triggered.",
                    "severity": "CRITICAL",
                    "details": {
                        "severity": se.severity,
                        "status": se.status,
                        "trigger_type": se.trigger_type
                    }
                })
        except Exception:
            pass

        # 9. Fetch Behavioral Telemetry Highlights
        try:
            beh_q = select(BehavioralLog).where(BehavioralLog.student_id == student_id).order_by(desc(BehavioralLog.date)).limit(14)
            beh_res = await db.execute(beh_q)
            beh_logs = beh_res.scalars().all()
            for b in beh_logs:
                if b.late_night_usage_minutes > 120 or b.total_screen_time_minutes > 600:
                    dt_str = f"{b.date}T23:59:59Z"
                    timeline_events.append({
                        "id": str(b.id),
                        "event_type": "BEHAVIORAL",
                        "timestamp": dt_str,
                        "title": f"Behavioral Anomaly ({b.date})",
                        "summary": f"High active screen time: {b.total_screen_time_minutes // 60}h {b.total_screen_time_minutes % 60}m with {b.late_night_usage_minutes // 60}h {b.late_night_usage_minutes % 60}m late-night usage.",
                        "severity": "MEDIUM",
                        "details": {
                            "screen_time_minutes": b.total_screen_time_minutes,
                            "late_night_minutes": b.late_night_usage_minutes,
                            "academic_minutes": b.academic_usage_minutes
                        }
                    })
        except Exception:
            pass

        # 10. Fetch Clinical Counselor Notes
        try:
            notes_q = (
                select(CounselorNote, User.full_name, User.email)
                .join(User, CounselorNote.counselor_id == User.id)
                .where(CounselorNote.student_id == student_id)
            )
            if cutoff_dt:
                notes_q = notes_q.where(CounselorNote.created_at >= cutoff_dt)
            notes_q = notes_q.order_by(desc(CounselorNote.created_at))
            notes_res = await db.execute(notes_q)
            for note_obj, c_name, c_email in notes_res.all():
                n_time = note_obj.created_at.isoformat() if note_obj.created_at else now.isoformat()
                timeline_events.append({
                    "id": str(note_obj.id),
                    "event_type": "COUNSELOR_NOTE",
                    "timestamp": n_time,
                    "title": f"Counselor Note by {c_name or c_email}",
                    "summary": note_obj.note,
                    "severity": "NORMAL",
                    "details": {
                        "counselor_id": str(note_obj.counselor_id),
                        "counselor_name": c_name or c_email,
                        "alert_id": str(note_obj.alert_id) if note_obj.alert_id else None,
                        "note": note_obj.note
                    }
                })
        except Exception:
            pass

        # 11. Sort Timeline Events Descending by Timestamp
        timeline_events.sort(key=lambda x: x["timestamp"], reverse=True)

        # 11. Compute Summary Aggregates
        latest_assessment = assessments[0] if assessments else None
        active_alerts = [alt for alt in alerts if (alt.status == AlertStatus.PENDING or str(alt.status) == "PENDING")]

        return {
            "student": {
                "id": str(student.id),
                "full_name": student.full_name or "Anonymous Student",
                "email": student.email,
                "academic_department": getattr(student, "academic_department", "Engineering"),
                "current_risk_level": (latest_assessment.risk_level.value if latest_assessment and hasattr(latest_assessment.risk_level, "value") else (str(latest_assessment.risk_level) if latest_assessment else "LOW")),
                "consent_status": consent_status
            },
            "summary": {
                "total_assessments": len(assessments),
                "latest_wellness_score": latest_assessment.mental_wellness_score if latest_assessment else 75.0,
                "current_risk_level": (latest_assessment.risk_level.value if latest_assessment and hasattr(latest_assessment.risk_level, "value") else "LOW"),
                "active_alerts_count": len(active_alerts),
                "total_appointments": len(appointments),
                "timeline_events_count": len(timeline_events)
            },
            "timeline": timeline_events,
            "timeframe_days": days or "90"
        }

casefile_service = CaseFileService()
