import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, Dict, Any
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Text, Enum as SQLEnum, JSON
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.types import TypeDecorator, CHAR
from sqlalchemy.orm import relationship

from app.db.session import Base

class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's UUID type, otherwise uses CHAR(36).
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID())
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == "postgresql":
            return str(value)
        else:
            if not isinstance(value, uuid.UUID):
                return str(uuid.UUID(str(value)))
            else:
                return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if not isinstance(value, uuid.UUID):
                return uuid.UUID(str(value))
            return value

class ChatSender(str, Enum):
    STUDENT = "STUDENT"
    ASSISTANT = "ASSISTANT"
    SYSTEM = "SYSTEM"

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    student_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False, default="Wellness Conversation")
    summary = Column(Text, nullable=True)
    current_risk_level = Column(String(20), nullable=False, default="GREEN")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    messages = relationship("ChatMessage", back_populates="conversation", cascade="all, delete-orphan", order_by="ChatMessage.created_at")
    safety_events = relationship("SafetyEvent", back_populates="conversation", cascade="all, delete-orphan")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(GUID(), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    sender = Column(SQLEnum(ChatSender), nullable=False, default=ChatSender.STUDENT)
    message = Column(Text, nullable=False)
    intent = Column(String(100), nullable=True)
    primary_emotion = Column(String(50), nullable=True)
    emotion_scores = Column(Text, nullable=True)  # JSON-serialized dictionary of emotion probabilities
    sentiment_score = Column(Float, nullable=True)
    risk_level = Column(String(20), nullable=False, default="GREEN")  # GREEN, YELLOW, RED
    is_crisis_flag = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relationship
    conversation = relationship("Conversation", back_populates="messages")

class SafetyEvent(Base):
    __tablename__ = "safety_events"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    student_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    conversation_id = Column(GUID(), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=True, index=True)
    message_id = Column(GUID(), nullable=True)
    severity = Column(String(20), nullable=False, default="RED")  # RED, YELLOW
    trigger_type = Column(String(100), nullable=False)  # e.g. EXPLICIT_SUICIDAL_IDEATION, ACUTE_SELF_HARM, ESCALATING_DISTRESS
    status = Column(String(50), nullable=False, default="OPEN")  # OPEN, ESCALATED, RESOLVED
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relationship
    conversation = relationship("Conversation", back_populates="safety_events")
