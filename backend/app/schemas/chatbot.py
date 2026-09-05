from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field

# --- Intent & Emotion Schemas ---
class IntentInfo(BaseModel):
    label: str = Field(..., description="Predicted user intent category")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score for intent prediction")
    secondary_intents: List[str] = Field(default_factory=list, description="Secondary intent candidates")

class EmotionInfo(BaseModel):
    primary: str = Field(..., description="Dominant emotion detected")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score of primary emotion")
    emotion_scores: Dict[str, float] = Field(default_factory=dict, description="Probability distribution across emotion classes")

class RiskInfo(BaseModel):
    level: str = Field(..., description="Calculated risk level: GREEN, YELLOW, or RED")
    score: float = Field(default=0.0, description="Calculated mental wellness or distress score")
    requires_safety_workflow: bool = Field(default=False, description="True if RED crisis intervention is activated")
    requires_human_review: bool = Field(default=False, description="True if counselor follow-up is recommended")

# --- Conversation Schemas ---
class CreateConversationRequest(BaseModel):
    title: Optional[str] = Field(None, max_length=255, description="Optional custom conversation title")

class ConversationSummary(BaseModel):
    id: UUID
    student_id: UUID
    title: str
    summary: Optional[str] = None
    current_risk_level: str
    created_at: datetime
    updated_at: datetime
    message_count: Optional[int] = 0

    class Config:
        from_attributes = True

# --- Message Schemas ---
class SendMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000, description="The student's text message")

class ChatMessageItem(BaseModel):
    id: UUID
    conversation_id: UUID
    sender: str
    message: str
    intent: Optional[str] = None
    primary_emotion: Optional[str] = None
    emotion_scores: Optional[Dict[str, float]] = None
    sentiment_score: Optional[float] = None
    risk_level: str = "GREEN"
    is_crisis_flag: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

class ChatResponsePayload(BaseModel):
    conversation_id: UUID
    message_id: UUID
    response: str
    intent: IntentInfo
    emotion: EmotionInfo
    risk: RiskInfo
    suggested_actions: List[str] = Field(default_factory=list, description="Suggested quick action prompts or coping tools")
    safety_alert: Optional[Dict[str, Any]] = Field(None, description="Supportive crisis helpline metadata if RED risk")
    created_at: datetime

class ConversationDetailResponse(BaseModel):
    conversation: ConversationSummary
    messages: List[ChatMessageItem]

# --- Behavioral Features Contract (Desktop PC & Mobile Telemetry) ---
class BehavioralFeaturesPayload(BaseModel):
    student_id: Optional[UUID] = None
    date: str
    total_screen_time_minutes: int = Field(default=0, ge=0)
    late_night_usage_minutes: int = Field(default=0, ge=0)
    academic_usage_minutes: int = Field(default=0, ge=0)
    social_usage_minutes: int = Field(default=0, ge=0)
    entertainment_usage_minutes: int = Field(default=0, ge=0)
    adult_usage_minutes: int = Field(default=0, ge=0, description="Minutes detected on sensitive or adult content")
    continuous_screen_minutes: int = Field(default=0, ge=0, description="Current unbroken active screen time in minutes")
    baseline_deviation_score: float = Field(default=0.0, ge=0.0, le=10.0)
    detected_intent_summary: Optional[str] = Field(default=None, description="Semantic summary of active apps/searches (e.g., Exam Prep, Project Coding)")
    is_crisis_search_flag: bool = Field(default=False, description="Flagged if active search queries match distress/self-harm keywords")


