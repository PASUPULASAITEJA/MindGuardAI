import logging
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from uuid import UUID

from app.db.session import AsyncSessionLocal
from app.ml.inference import ml_service
from app.models.mood_logs import MoodLog, InputType
from app.models.emotion_analyses import EmotionAnalysis
from app.models.assessments import Assessment, RiskLevel
from app.models.alerts import Alert, AlertStatus
from app.repositories.mood_logs import mood_log_repository
from app.repositories.emotion_analyses import emotion_analysis_repository
from app.repositories.assessments import assessment_repository
from app.repositories.alerts import alert_repository

logger = logging.getLogger("mindguard-mood-service")

async def process_journal_entry_background(
    mood_log_id: UUID,
    content: str,
    self_reported_score: Optional[int] = None,
    student_id: UUID = None
) -> None:
    """
    Background worker task to execute ML evaluations asynchronously.
    Performs PII redaction and inference, saves emotional probability vectors,
    calculates clinical wellness indices, and triggers Early Warning Alerts if high-risk.
    """
    logger.info(f"Asynchronously processing mood log ID: {mood_log_id}...")
    
    async with AsyncSessionLocal() as db:
        try:
            # 1. Trigger joint ML inference (Emotion + Risk mapping)
            detected_emotions, mental_wellness_score, risk_level = await ml_service.predict(
                content, self_reported_score
            )
            
            # 2. Derive sentiment polarity and primary emotion
            primary_emotion = max(detected_emotions, key=detected_emotions.get)
            sentiment_score = detected_emotions.get("joy", 0.0) - (
                detected_emotions.get("sadness", 0.0) * 0.7 + detected_emotions.get("anxiety", 0.0) * 0.3
            )
            sentiment_score = max(-1.0, min(1.0, sentiment_score))
            
            # 3. Persist Emotion Analysis records
            analysis_obj = EmotionAnalysis(
                mood_log_id=mood_log_id,
                detected_emotions=detected_emotions,
                sentiment_score=sentiment_score,
                primary_emotion=primary_emotion,
                analyzed_at=datetime.now(timezone.utc)
            )
            db.add(analysis_obj)

            # 4. Save Wellness Assessment
            assessment_obj = Assessment(
                student_id=student_id,
                mental_wellness_score=mental_wellness_score,
                risk_level=RiskLevel(risk_level),
                evaluated_at=datetime.now(timezone.utc)
            )
            db.add(assessment_obj)
            
            # We flush to get assessment_obj.id for Alert mapping
            await db.flush()

            # 4b. Generate SHAP TreeExplainer Feature Attributions
            try:
                from app.services.shap_service import shap_service
                await shap_service.explain_and_store(
                    db=db,
                    prediction_id=assessment_obj.id,
                    features={
                        "anxiety": detected_emotions.get("anxiety", 0.3),
                        "sadness": detected_emotions.get("sadness", 0.3),
                        "joy": detected_emotions.get("joy", 0.2),
                        "sentiment_score": sentiment_score,
                        "self_reported_score": float(self_reported_score) if self_reported_score else 5.0
                    }
                )
            except Exception as shap_err:
                logger.warning(f"Could not compute SHAP explanations for assessment {assessment_obj.id}: {shap_err}")

            # 5. Decision Diamond: Trigger Alert if risk_level is HIGH
            if risk_level == "HIGH":
                logger.warning(f"HIGH risk level flagged for student {student_id}. Triggering active alert.")
                alert_obj = Alert(
                    assessment_id=assessment_obj.id,
                    student_id=student_id,
                    counselor_id=None,  # Unassigned initially
                    status=AlertStatus.PENDING
                )
                db.add(alert_obj)
                await db.flush()

                # Dispatch asynchronous email notification to campus counselors
                try:
                    from app.models.users import User
                    from app.services.email_service import email_service
                    from app.services.notification_service import notification_service
                    student_user = await db.get(User, student_id)
                    if student_user:
                        await email_service.notify_counselors_on_high_risk(
                            db,
                            student=student_user,
                            assessment_id=assessment_obj.id,
                            alert_id=alert_obj.id,
                            event_type="HIGH_RISK_ALERT",
                            custom_message=f"Student submitted journal entry evaluating to HIGH clinical risk (Wellness Score: {mental_wellness_score:.1f}/100)."
                        )
                        await notification_service.notify_high_risk(
                            db,
                            student_id=student_id,
                            student_email=student_user.email,
                            risk_tier=risk_level,
                            wellness_score=mental_wellness_score,
                            assessment_id=assessment_obj.id
                        )
                except Exception as notify_err:
                    logger.error(f"Failed to dispatch counselor notification: {str(notify_err)}", exc_info=True)
            
            await db.commit()
            logger.info(f"Asynchronous analysis successfully committed for mood log ID {mood_log_id}.")
            return detected_emotions, mental_wellness_score, risk_level, sentiment_score
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to process background mood log analysis {mood_log_id}: {str(e)}", exc_info=True)
            return None, None, None, None

class MoodService:
    async def create_journal_entry(
        self,
        db,  # AsyncSession
        *,
        student_id: UUID,
        content: str,
        self_reported_score: Optional[int] = None
    ) -> MoodLog:
        """
        Creates a raw mood log in the database.
        """
        db_obj_data = {
            "student_id": student_id,
            "input_type": InputType.TEXT,
            "raw_content": content,
            "self_reported_score": self_reported_score
        }
        return await mood_log_repository.create(db, obj_in=db_obj_data)

    async def get_history(
        self,
        db,  # AsyncSession
        student_id: UUID,
        timeframe: Optional[str] = "7d"
    ) -> List[dict]:
        """
        Fetch journal history filtered by timeframe (7d or 30d) in chronological ascending order,
        including NLP sentiment scores scaled to the 1-10 range for visual comparison.
        """
        days = 7
        if timeframe == "30d":
            days = 30
        logs = await mood_log_repository.get_student_history(db, student_id, timeframe_days=days)
        history = []
        for l in logs:
            sentiment = l.emotion_analysis.sentiment_score if getattr(l, "emotion_analysis", None) else None
            emotion = l.emotion_analysis.primary_emotion if getattr(l, "emotion_analysis", None) else None
            
            # Map sentiment (-1.0 to 1.0) into clinical 1-10 scale:
            # -1.0 -> 1.0, 0.0 -> 5.5, +1.0 -> 10.0
            nlp_scaled = round(((sentiment + 1.0) / 2.0) * 9.0 + 1.0, 1) if sentiment is not None else None
            
            self_score = l.self_reported_score
            if self_score is None and nlp_scaled is not None:
                self_score = int(round(nlp_scaled))
            elif nlp_scaled is None and self_score is not None:
                nlp_scaled = float(self_score)

            history.append({
                "id": l.id,
                "input_type": l.input_type,
                "self_reported_score": self_score,
                "sentiment_score": sentiment,
                "nlp_sentiment_scaled": nlp_scaled,
                "primary_emotion": emotion,
                "logged_at": l.logged_at
            })
        return history

mood_service = MoodService()
