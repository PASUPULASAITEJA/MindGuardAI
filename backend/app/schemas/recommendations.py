from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field
from app.models.assessments import RiskLevel


# --- Legacy Schemas for Backward Compatibility ---
class RecommendationActivity(BaseModel):
    type: str = Field(..., description="Type of recommendation (e.g. MINDFULNESS, ARTICLE)")
    title: str = Field(..., description="Actionable title for the student.")
    url: str = Field(..., description="Reference resource web link.")


class RecommendationResponse(BaseModel):
    risk_level: RiskLevel
    activities: List[RecommendationActivity]


# --- Next-Gen Personalized Recommendation Engine Schemas ---
class PersonalizedRecommendationItem(BaseModel):
    id: UUID = Field(..., description="Unique ID for recommendation record")
    category: str = Field(..., description="Intervention category (e.g., BREATHING, GROUNDING, COGNITIVE_REFRAME)")
    title: str = Field(..., description="Concise actionable title")
    description: str = Field(..., description="Guidance instructions for the student")
    reason: Optional[str] = Field(None, description="Clinical rationale for suggestion")
    action_type: str = Field("INTERNAL_ROUTE", description="Type of navigation: INTERNAL_ROUTE or EXTERNAL_URL")
    action_url: str = Field(..., description="App route or URL to launch the interactive intervention")
    risk_tier: Optional[str] = Field(None, description="Longitudinal risk tier at time of recommendation")
    status: str = Field("ACTIVE", description="Recommendation state: ACTIVE, COMPLETED, or DISMISSED")
    feedback: Optional[str] = Field(None, description="Student feedback: HELPFUL or NOT_HELPFUL")
    created_at: datetime = Field(..., description="Timestamp recommendation was generated")
    completed_at: Optional[datetime] = Field(None, description="Timestamp completed")

    class Config:
        from_attributes = True


class PersonalizedRecommendationsResponse(BaseModel):
    risk_tier: str = Field(..., description="Current evaluated risk tier")
    primary_emotion: str = Field(..., description="Dominant emotion identified")
    wellness_score: Optional[float] = Field(None, description="Continuous mental wellness score (0-100)")
    rationale: str = Field(..., description="Contextual explanation for recommendation package")
    recommendations: List[PersonalizedRecommendationItem] = Field(..., description="Tailored self-care interventions")


class RecommendationFeedbackRequest(BaseModel):
    feedback: Optional[str] = Field(None, description="Student feedback: HELPFUL or NOT_HELPFUL")
    status: Optional[str] = Field(None, description="Updated status: ACTIVE, COMPLETED, or DISMISSED")
