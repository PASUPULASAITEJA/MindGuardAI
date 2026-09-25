from typing import List, Optional, Dict
from uuid import UUID
from pydantic import BaseModel, Field


class WellnessTrendPoint(BaseModel):
    date: str = Field(..., description="Date string in YYYY-MM-DD format")
    wellness_score: float = Field(..., description="Composite mental wellness index (0-100)")
    mood_score: Optional[float] = Field(None, description="Daily self-reported mood on 1-10 scale")
    stress_level: Optional[float] = Field(None, description="Daily reported or inferred stress level (1-10)")
    sleep_hours: Optional[float] = Field(None, description="Recorded or estimated sleep duration in hours")
    phq9_score: Optional[int] = Field(None, description="PHQ-9 screener total score if recorded")
    gad7_score: Optional[int] = Field(None, description="GAD-7 anxiety screener total score if recorded")
    nlp_sentiment: Optional[float] = Field(None, description="NLP sentiment polarity (-1.0 to +1.0)")
    primary_emotion: Optional[str] = Field(None, description="DistilBERT classified dominant emotion")
    risk_level: str = Field(..., description="Assessed risk level: LOW, MEDIUM, HIGH, or CRITICAL")
    rolling_avg: float = Field(..., description="Rolling multi-day moving average score")


class PersonalBaseline(BaseModel):
    usual_stress: Optional[float] = Field(None, description="Historical baseline average stress (1-10)")
    recent_stress: Optional[float] = Field(None, description="Recent 7-day average stress (1-10)")
    stress_delta: Optional[float] = Field(None, description="Difference between recent and baseline stress")

    usual_sleep_hours: Optional[float] = Field(None, description="Historical baseline average sleep duration")
    recent_sleep_hours: Optional[float] = Field(None, description="Recent 7-day average sleep duration")
    sleep_delta: Optional[float] = Field(None, description="Difference in sleep hours from baseline")

    usual_mood_score: Optional[float] = Field(None, description="Historical baseline average mood (1-10)")
    recent_mood_score: Optional[float] = Field(None, description="Recent 7-day average mood (1-10)")
    mood_delta: Optional[float] = Field(None, description="Difference in mood from baseline")

    baseline_confidence: str = Field("ESTABLISHING", description="Confidence in baseline: ESTABLISHING, MODERATE, HIGH")
    observations_count: int = Field(0, description="Total longitudinal observations recorded")
    summary_message: str = Field(..., description="Non-stigmatizing personal baseline summary message")


class WellnessTrendSummary(BaseModel):
    average_wellness_score: float = Field(..., description="Mean wellness score across the timeframe")
    wellness_delta: float = Field(..., description="Change in score between the start and end of period")
    direction: str = Field(..., description="Longitudinal trajectory: IMPROVING, STABLE, or DECLINING")
    dominant_emotion: str = Field(..., description="Most frequently detected emotion")
    emotion_distribution: Dict[str, int] = Field(default_factory=dict, description="Distribution of detected emotions")
    total_checkins: int = Field(..., description="Total check-in interactions logged")
    volatility_score: float = Field(..., description="Standard deviation of wellness scores reflecting stability")
    highest_score: float = Field(..., description="Peak wellness score during the window")
    lowest_score: float = Field(..., description="Lowest wellness score during the window")


class WellnessTrendResponse(BaseModel):
    student_id: UUID = Field(..., description="Student account identifier")
    timeframe: str = Field(..., description="Timeframe requested: 7d, 30d, 90d, or 180d")
    summary: WellnessTrendSummary = Field(..., description="Longitudinal aggregations and summary metrics")
    baseline: Optional[PersonalBaseline] = Field(None, description="Personal baseline calculations and deviations")
    points: List[WellnessTrendPoint] = Field(default_factory=list, description="Chronological trend series")

