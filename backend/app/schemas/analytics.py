from typing import List
from pydantic import BaseModel, Field


class RiskDistribution(BaseModel):
    LOW: int = Field(..., description="Count of low-risk students")
    MEDIUM: int = Field(..., description="Count of medium-risk students")
    HIGH: int = Field(..., description="Count of high-risk students")


class InstitutionReportResponse(BaseModel):
    total_students_monitored: int = Field(..., description="Total monitored students")
    average_wellness_score: float = Field(..., description="Campus-wide mean mental wellness index")
    risk_distribution: RiskDistribution = Field(..., description="Macro risk tier breakdown")
    dominant_campus_emotion: str = Field(..., description="Dominant emotion across campus")


class DepartmentRiskItem(BaseModel):
    department: str = Field(..., description="Academic department name")
    student_count: int = Field(..., description="Number of students in department")
    average_wellness_score: float = Field(..., description="Mean wellness score for department")
    low_risk_count: int = Field(default=0, description="Students with low risk index")
    medium_risk_count: int = Field(default=0, description="Students with medium risk index")
    high_risk_count: int = Field(default=0, description="Students with high risk index")


class DepartmentRiskResponse(BaseModel):
    departments: List[DepartmentRiskItem] = Field(..., description="Department breakdown list")
    total_departments: int = Field(..., description="Count of departments represented")
