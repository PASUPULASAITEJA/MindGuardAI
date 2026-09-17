from typing import List, Optional
from uuid import UUID
from datetime import datetime, date
from pydantic import BaseModel, Field, model_validator, ConfigDict


class SleepLogCreateRequest(BaseModel):
    log_date: date = Field(..., description="Calendar date of the sleep session")
    bedtime: datetime = Field(..., description="Timestamp student went to bed")
    wake_time: datetime = Field(..., description="Timestamp student woke up")
    sleep_hours: Optional[float] = Field(
        None,
        ge=0.0,
        le=24.0,
        description="Recorded duration of sleep. If omitted, computed automatically from wake_time and bedtime."
    )
    sleep_quality: int = Field(
        ...,
        ge=1,
        le=4,
        description="Subjective quality score: 1 (Poor), 2 (Fair), 3 (Good), 4 (Great)"
    )
    nap_taken: bool = Field(default=False, description="Whether daytime nap was taken")
    nap_duration_minutes: int = Field(default=0, ge=0, description="Duration of daytime nap in minutes")
    sleep_disruptions: int = Field(default=0, ge=0, description="Count of nighttime awakenings")
    source: str = Field(default="self_report", max_length=30, description="Source origin: self_report, wearable, agent")

    @model_validator(mode="after")
    def compute_sleep_hours_if_missing(self):
        if self.sleep_hours is None:
            diff_seconds = (self.wake_time - self.bedtime).total_seconds()
            if diff_seconds < 0:
                diff_seconds += 24 * 3600
            self.sleep_hours = round(max(0.0, min(24.0, diff_seconds / 3600.0)), 1)
        return self


class SleepLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: UUID
    log_date: date
    bedtime: datetime
    wake_time: datetime
    sleep_hours: float
    sleep_quality: int
    nap_taken: bool
    nap_duration_minutes: int
    sleep_disruptions: int
    source: str
    created_at: datetime


class SleepLogListResponse(BaseModel):
    items: List[SleepLogResponse]
    total: int
    range: str


class SleepAnalysisResponse(BaseModel):
    days_analyzed: int = Field(..., description="Number of days in analysis window")
    avg_sleep_hours: float = Field(..., description="Mean nightly sleep hours")
    sleep_consistency_7d: float = Field(..., description="Standard deviation of sleep hours over the window")
    avg_quality_score: float = Field(..., description="Mean sleep quality score on 1-4 scale")
    avg_disruptions: float = Field(..., description="Mean nocturnal awakenings")
    total_naps_count: int = Field(..., description="Total naps taken in period")
    is_flagged_risk: bool = Field(..., description="Flagged indicator if avg < 6h, consistency > 2.0h, or quality < 2.0")
    risk_reasons: List[str] = Field(..., description="Specific circadian risk triggers detected")
    circadian_insight: str = Field(..., description="Evidence-based psychological summary")
    sleep_hygiene_recommendations: List[str] = Field(..., description="Actionable circadian recovery tips")
