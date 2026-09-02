import re
import json
import logging
from typing import Dict, Any, List, Optional
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.users import User
from app.models.chat import Conversation, ChatMessage, ChatSender, SafetyEvent
from app.models.assessments import Assessment, RiskLevel
from app.models.alerts import Alert, AlertStatus
from app.schemas.chatbot import ChatResponsePayload, IntentInfo, EmotionInfo, RiskInfo
from app.services.conversation_service import conversation_service
from app.ml.intent_inference import intent_classifier
from app.ml.safety_engine import safety_engine, SafetyEvaluation
from app.ml.response_orchestrator import response_orchestrator
from app.ml.inference import ml_service

logger = logging.getLogger("mindguard-chatbot-service")

def mask_pii(text: str) -> str:
    """
    Sanitizes personally identifiable information (PII) before model analysis.
    Masks emails, phone numbers, and student registration formats.
    """
    if not isinstance(text, str):
        return ""
    # Mask emails
    text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL]', text)
    # Mask phone numbers
    text = re.sub(r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b', '[PHONE]', text)
    # Mask student registration / ID patterns
    text = re.sub(r'\b(?:STU|ID|REG|SAP)[-_]?\d{6,12}\b', '[STUDENT_ID]', text, flags=re.IGNORECASE)
    return text.strip()

class ChatbotService:
    async def process_student_message(
        self,
        db: AsyncSession,
        *,
        student: User,
        conversation_id: UUID,
        raw_message: str
    ) -> ChatResponsePayload:
        """
        Complete end-to-end Chatbot processing pipeline:
        1. Ownership verification
        2. PII masking
        3. Intent understanding
        4. Emotion inference via DistilBERT
        5. Context retrieval
        6. Deterministic Safety Engine evaluation
        7. Decision Diamond & Counselor alert escalation (if RED)
        8. Empathetic response generation
        9. Atomic persistence
        """
        # 1. Verify Conversation Ownership
        conversation = await conversation_service.get_conversation(
            db, conversation_id=conversation_id, student_id=student.id
        )
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found or access denied."
            )

        # 2. PII Masking
        masked_text = mask_pii(raw_message)

        # 3. Intent Understanding
        intent_data = intent_classifier.predict(masked_text)
        detected_intent = intent_data["intent"]
        intent_confidence = intent_data["confidence"]
        secondary_intents = intent_data["secondary_intents"]

        # 4. Emotion Detection via ML Service
        detected_emotions, mental_wellness_score, ml_risk_str = await ml_service.predict(masked_text)
        
        # Primary emotion calculation
        primary_emotion = "neutral"
        primary_emotion_confidence = 0.50
        if detected_emotions:
            sorted_emotions = sorted(detected_emotions.items(), key=lambda x: x[1], reverse=True)
            primary_emotion, primary_emotion_confidence = sorted_emotions[0]

        sentiment_score = float(
            detected_emotions.get("joy", 0.0) - (
                detected_emotions.get("anxiety", 0.0) * 0.5 + detected_emotions.get("sadness", 0.0) * 0.5
            )
        )

        # 5. Context Retrieval (Recent 6 messages)
        recent_db_messages = await conversation_service.get_recent_messages(db, conversation_id=conversation_id, limit=6)
        recent_history = [
            {
                "sender": msg.sender.value if hasattr(msg.sender, "value") else str(msg.sender),
                "message": msg.message,
                "risk_level": msg.risk_level,
                "primary_emotion": msg.primary_emotion
            }
            for msg in recent_db_messages
        ]

        # 6. Safety Engine Evaluation (Strict Priority Gate)
        safety_eval: SafetyEvaluation = safety_engine.evaluate(
            current_message=masked_text,
            detected_intent=detected_intent,
            emotion_scores=detected_emotions,
            sentiment_score=sentiment_score,
            recent_history=recent_history
        )

        final_risk_level = safety_eval.risk_level
        is_crisis = (final_risk_level == "RED")

        # 7. Decision Diamond: High-Risk Safety Workflow
        if is_crisis:
            logger.warning(
                f"[CRISIS TRIGGER] High-risk safety event triggered for student {student.id}. "
                f"Trigger: {safety_eval.trigger_type}. Initiating counselor escalation."
            )
            # Create Assessment record
            assessment = Assessment(
                student_id=student.id,
                mental_wellness_score=round(max(0.0, 100.0 - safety_eval.risk_score), 2),
                risk_level=RiskLevel.HIGH
            )
            db.add(assessment)
            await db.flush()

            # Create Counselor Alert (AlertStatus.PENDING)
            alert = Alert(
                assessment_id=assessment.id,
                student_id=student.id,
                counselor_id=None,
                status=AlertStatus.PENDING
            )
            db.add(alert)

            # Record Safety Event
            safety_event = SafetyEvent(
                student_id=student.id,
                conversation_id=conversation_id,
                message_id=None,
                severity="RED",
                trigger_type=safety_eval.trigger_type or "CRISIS_SAFETY_EVENT",
                status="OPEN",
                details="; ".join(safety_eval.risk_reasons)
            )
            db.add(safety_event)

        # 8. Response Generation
        orchestrator_output = await response_orchestrator.generate(
            student_message=masked_text,
            intent=detected_intent,
            primary_emotion=primary_emotion,
            emotion_scores=detected_emotions,
            sentiment_score=sentiment_score,
            risk_level=final_risk_level,
            recent_history=recent_history,
            conversation_summary=conversation.summary
        )

        assistant_reply = orchestrator_output["response"]
        suggested_actions = orchestrator_output["suggested_actions"]
        safety_alert = orchestrator_output["safety_alert"]

        # 9. Persist Student and Assistant Messages
        student_msg_record = await conversation_service.save_message(
            db,
            conversation_id=conversation_id,
            student_id=student.id,
            sender=ChatSender.STUDENT,
            message=masked_text,
            intent=detected_intent,
            primary_emotion=primary_emotion,
            emotion_scores=detected_emotions,
            sentiment_score=sentiment_score,
            risk_level=final_risk_level,
            is_crisis_flag=is_crisis
        )
        await db.flush()

        assistant_msg_record = await conversation_service.save_message(
            db,
            conversation_id=conversation_id,
            student_id=student.id,
            sender=ChatSender.ASSISTANT,
            message=assistant_reply,
            intent=detected_intent,
            primary_emotion=primary_emotion,
            emotion_scores=detected_emotions,
            sentiment_score=sentiment_score,
            risk_level=final_risk_level,
            is_crisis_flag=is_crisis
        )

        # Update conversation status
        await conversation_service.update_conversation_risk(db, conversation_id=conversation_id, risk_level=final_risk_level)

        await db.commit()

        # 10. Construct Structured Response Payload
        return ChatResponsePayload(
            conversation_id=conversation_id,
            message_id=assistant_msg_record.id,
            response=assistant_reply,
            intent=IntentInfo(
                label=detected_intent,
                confidence=intent_confidence,
                secondary_intents=secondary_intents
            ),
            emotion=EmotionInfo(
                primary=primary_emotion,
                confidence=round(primary_emotion_confidence, 2),
                emotion_scores={k: round(v, 3) for k, v in detected_emotions.items()}
            ),
            risk=RiskInfo(
                level=final_risk_level,
                score=round(safety_eval.risk_score, 1),
                requires_safety_workflow=safety_eval.requires_safety_workflow,
                requires_human_review=safety_eval.requires_human_review
            ),
            suggested_actions=suggested_actions,
            safety_alert=safety_alert,
            created_at=datetime.now(timezone.utc)
        )

chatbot_service = ChatbotService()
