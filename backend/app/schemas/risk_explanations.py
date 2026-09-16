import enum
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict

class ExplanationDirectionEnum(str, enum.Enum):
    INCREASING_RISK = "increasing_risk"
    DECREASING_RISK = "decreasing_risk"

class RiskExplanationItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    prediction_id: UUID
    feature_name: str = Field(..., description="Human-readable model feature label")
    shap_value: float = Field(..., description="SHAP feature attribution value")
    direction: ExplanationDirectionEnum = Field(..., description="Impact direction ('increasing_risk' or 'decreasing_risk')")
    rank: int = Field(..., ge=1, le=3, description="Attribution rank (1 to 3)")
    impact_symbol: str = Field("↑", description="Directional symbol ('↑' for increasing risk, '↓' for decreasing/protective)")
    is_protective: bool = Field(False, description="True if feature acts as a protective buffer")
    description: str = Field(..., description="Non-diagnostic contextual explanation")

class PredictionExplanationResponse(BaseModel):
    prediction_id: UUID
    wellness_score: float = Field(..., description="Mental wellness score between 0.0 and 100.0")
    risk_tier: str = Field(..., description="Assessed risk level ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')")
    heading: str = Field(
        "Factors that influenced your wellness score",
        description="Strict non-diagnostic title"
    )
    disclaimer: str = Field(
        "These are factors that influenced your wellness score, not diagnosis factors.",
        description="Mandatory screening and non-diagnostic clarification"
    )
    top_factors: List[RiskExplanationItem] = Field(
        default_factory=list,
        description="Top 3 contributing features identified via SHAP TreeExplainer"
    )

ShapPredictionExplanationResponse = PredictionExplanationResponse
