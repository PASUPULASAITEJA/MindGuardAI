from typing import List, Optional, Dict, Literal
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field


class MoodCheckinCreateRequest(BaseModel):
    checkin_type: Literal["morning", "evening"] = Field(
        ...,
        description="Check-in window: morning or evening"
    )
    mood_score: int = Field(
        ...,
        ge=1,
        le=10,
        description="Self-reported mood on a 1-10 scale (1 = lowest, 10 = best)"
    )
    energy_level: int = Field(
        ...,
        ge=1,
        le=10,
        description="Self-reported physical/mental energy on a 1-10 scale"
    )
    anxiety_level: int = Field(
        ...,
        ge=1,
        le=10,
        description="Self-reported anxiety or stress tension on a 1-10 scale (1 = none, 10 = extreme)"
    )
    sleep_quality: Literal["poor", "fair", "good", "great"] = Field(
        ...,
        description="Subjective sleep rating from the previous sleep cycle"
    )
    sleep_hours: float = Field(
        ...,
        ge=0.0,
        le=24.0,
        description="Recorded duration of sleep in hours"
    )
    primary_emotion: str = Field(
        ...,
        max_length=20,
        description="Primary emotional descriptor (e.g., calm, anxious, exhausted, focused, happy)"
    )
    one_word_feeling: Optional[str] = Field(
        None,
        max_length=50,
        description="Optional single word describing present emotional state"
    )
    stress_source: Optional[str] = Field(
        None,
        max_length=30,
        description="Optional primary source of current cognitive load (e.g. academics, exams, social, health, none)"
    )


class MoodCheckinResponse(BaseModel):
    id: int
    user_id: UUID
    checkin_type: str
    mood_score: int
    energy_level: int
    anxiety_level: int
    sleep_quality: str
    sleep_hours: float
    primary_emotion: str
    one_word_feeling: Optional[str] = None
    stress_source: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class MoodCheckinListResponse(BaseModel):
    items: List[MoodCheckinResponse]
    total: int
    range: str


class MoodCheckinSummaryResponse(BaseModel):
    total_checkins: int
    streak_days: int
    avg_mood_score: float
    avg_energy_level: float
    avg_anxiety_level: float
    avg_sleep_hours: float
    sleep_quality_breakdown: Dict[str, int]
    common_emotions: Dict[str, int]
    common_stress_sources: Dict[str, int]
    latest_checkin: Optional[MoodCheckinResponse] = None
