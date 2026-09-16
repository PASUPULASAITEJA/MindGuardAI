from typing import List, Optional, Dict
from uuid import UUID
from pydantic import BaseModel, Field


class WellnessTrendPoint(BaseModel):
    date: str = Field(..., description="Date string in YYYY-MM-DD format")
    wellness_score: float = Field(..., description="Composite mental wellness index (0-100)")
    phq9_score: Optional[int] = Field(None, description="PHQ-9 screener total score if recorded")
    gad7_score: Optional[int] = Field(None, description="GAD-7 anxiety screener total score if recorded")
    nlp_sentiment: Optional[float] = Field(None, description="NLP sentiment polarity (-1.0 to +1.0)")
    primary_emotion: Optional[str] = Field(None, description="DistilBERT classified dominant emotion")
    risk_level: str = Field(..., description="Assessed risk level: LOW, MEDIUM, HIGH, or CRITICAL")
    rolling_avg: float = Field(..., description="Rolling multi-day moving average score")


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
    timeframe: str = Field(..., description="Timeframe requested: 7d, 30d, or 90d")
    summary: WellnessTrendSummary = Field(..., description="Longitudinal aggregations and summary metrics")
    points: List[WellnessTrendPoint] = Field(default_factory=list, description="Chronological trend series")
