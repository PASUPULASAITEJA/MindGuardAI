from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, Field
from app.models.assessments import RiskLevel

class AssessmentLatestResponse(BaseModel):
    assessment_id: UUID
    mental_wellness_score: float
    risk_level: RiskLevel
    emotions_detected: Dict[str, float]
    evaluated_at: datetime
    sentiment_score: Optional[float] = None

class RiskFactorItem(BaseModel):
    id: str = Field(..., description="Unique factor identifier")
    name: str = Field(..., description="Human-readable factor title")
    category: str = Field(..., description="Factor clinical category (e.g., CRISIS_SAFETY, LINGUISTIC_AFFECT, BEHAVIORAL_CIRCADIAN)")
    severity: str = Field(..., description="Severity level ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'POSITIVE')")
    impact_pct: int = Field(..., description="Estimated percentage influence on wellness score or risk tier (1-100)")
    description: str = Field(..., description="Detailed explanatory text for counselors")
    source_metric: Optional[str] = Field(None, description="Originating data source or model feature")

class TrendPeriodSummary(BaseModel):
    period_days: int = Field(..., description="Number of lookback days (7 or 30)")
    direction: str = Field(..., description="Trend direction: 'IMPROVING', 'DECLINING', 'STABLE', or 'INSUFFICIENT_DATA'")
    wellness_delta: float = Field(..., description="Point difference between latest and period baseline")
    average_wellness: float = Field(..., description="Average wellness score over this period")
    assessments_count: int = Field(0, description="Total assessments completed in this window")
    mood_logs_count: int = Field(0, description="Total mood/journal logs in this window")
    average_mood_score: Optional[float] = Field(None, description="Average self-reported mood score (1-10)")
    average_sentiment: Optional[float] = Field(None, description="Average NLP sentiment polarity (-1.0 to 1.0)")
    crisis_flags_count: int = Field(0, description="Number of safety/distress crisis flags triggered")

class TrendSummary(BaseModel):
    summary_7d: TrendPeriodSummary
    summary_30d: TrendPeriodSummary
    primary_direction: str = Field(..., description="High-level directional indicator ('IMPROVING', 'DECLINING', 'STABLE', 'CRITICAL')")
    headline: str = Field(..., description="Synthesized clinical summary sentence for counselors")

class PredictionExplanationResponse(BaseModel):
    student_id: UUID
    current_risk_tier: RiskLevel
    current_wellness_score: float
    evaluated_at: datetime
    trend_summary: TrendSummary
    top_factors: List[RiskFactorItem] = Field(..., description="Top 5 synthesized explainable factors")
