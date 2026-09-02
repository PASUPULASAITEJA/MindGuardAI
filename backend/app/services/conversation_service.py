import json
import logging
from typing import List, Optional, Tuple, Dict, Any
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import desc, func

from app.models.chat import Conversation, ChatMessage, SafetyEvent, ChatSender
from app.models.users import User

logger = logging.getLogger("mindguard-chat")

class ConversationService:
    async def create_conversation(
        self,
        db: AsyncSession,
        *,
        student_id: UUID,
        title: Optional[str] = None
    ) -> Conversation:
        conv_title = title.strip() if title and title.strip() else f"Wellness Chat - {datetime.now().strftime('%b %d, %H:%M')}"
        conversation = Conversation(
            student_id=student_id,
            title=conv_title,
            current_risk_level="GREEN"
        )
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)
        return conversation

    async def get_student_conversations(
        self,
        db: AsyncSession,
        *,
        student_id: UUID,
        limit: int = 50
    ) -> List[Tuple[Conversation, int]]:
        """
        Fetches all conversations for a student along with their message count.
        """
        stmt = (
            select(
                Conversation,
                func.count(ChatMessage.id).label("message_count")
            )
            .outerjoin(ChatMessage, Conversation.id == ChatMessage.conversation_id)
            .where(Conversation.student_id == student_id)
            .group_by(Conversation.id)
            .order_by(desc(Conversation.updated_at))
            .limit(limit)
        )
        result = await db.execute(stmt)
        return result.all()

    async def get_conversation(
        self,
        db: AsyncSession,
        *,
        conversation_id: UUID,
        student_id: UUID
    ) -> Optional[Conversation]:
        stmt = (
            select(Conversation)
            .options(selectinload(Conversation.messages))
            .where(Conversation.id == conversation_id, Conversation.student_id == student_id)
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_recent_messages(
        self,
        db: AsyncSession,
        *,
        conversation_id: UUID,
        limit: int = 10
    ) -> List[ChatMessage]:
        stmt = (
            select(ChatMessage)
            .where(ChatMessage.conversation_id == conversation_id)
            .order_by(desc(ChatMessage.created_at))
            .limit(limit)
        )
        result = await db.execute(stmt)
        messages = list(result.scalars().all())
        messages.reverse()  # Return in chronological order
        return messages

    async def save_message(
        self,
        db: AsyncSession,
        *,
        conversation_id: UUID,
        student_id: UUID,
        sender: ChatSender,
        message: str,
        intent: Optional[str] = None,
        primary_emotion: Optional[str] = None,
        emotion_scores: Optional[Dict[str, float]] = None,
        sentiment_score: Optional[float] = None,
        risk_level: str = "GREEN",
        is_crisis_flag: bool = False
    ) -> ChatMessage:
        chat_msg = ChatMessage(
            conversation_id=conversation_id,
            student_id=student_id,
            sender=sender,
            message=message,
            intent=intent,
            primary_emotion=primary_emotion,
            emotion_scores=json.dumps(emotion_scores) if emotion_scores else None,
            sentiment_score=sentiment_score,
            risk_level=risk_level,
            is_crisis_flag=is_crisis_flag
        )
        db.add(chat_msg)
        return chat_msg

    async def create_safety_event(
        self,
        db: AsyncSession,
        *,
        student_id: UUID,
        conversation_id: UUID,
        message_id: Optional[UUID],
        severity: str,
        trigger_type: str,
        details: str
    ) -> SafetyEvent:
        event = SafetyEvent(
            student_id=student_id,
            conversation_id=conversation_id,
            message_id=message_id,
            severity=severity,
            trigger_type=trigger_type,
            status="OPEN",
            details=details
        )
        db.add(event)
        return event

    async def update_conversation_risk(
        self,
        db: AsyncSession,
        *,
        conversation_id: UUID,
        risk_level: str
    ) -> None:
        stmt = select(Conversation).where(Conversation.id == conversation_id)
        result = await db.execute(stmt)
        conv = result.scalar_one_or_none()
        if conv:
            conv.current_risk_level = risk_level
            conv.updated_at = datetime.now(timezone.utc)
            db.add(conv)

conversation_service = ConversationService()
