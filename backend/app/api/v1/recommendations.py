from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.dependencies import require_role
from app.models.users import User, UserRole
from app.models.assessments import RiskLevel
from app.models.mood_logs import MoodLog
from app.models.emotion_analyses import EmotionAnalysis
from app.repositories.assessments import assessment_repository
from app.repositories.recommendations import recommendation_repository
from app.services.recommendations import recommendation_service
from app.schemas.recommendations import (
    RecommendationResponse,
    PersonalizedRecommendationsResponse,
    PersonalizedRecommendationItem,
    RecommendationFeedbackRequest
)

router = APIRouter()


@router.get(
    "/current",
    response_model=RecommendationResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current wellness recommendations (legacy)"
)
async def get_current_recommendations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.STUDENT]))
):
    """
    Retrieves personalized wellness suggestions based on the student's latest assessment score
    and primary emotion. Employs fallback defaults for new accounts to solve cold-start issues.
    """
    # 1. Fetch latest assessment
    assessment = await assessment_repository.get_latest_for_student(db, student_id=current_user.id)
    
    if not assessment:
        return recommendation_service.get_recommendations_for_profile(
            risk_level=RiskLevel.LOW,
            primary_emotion="joy"
        )

    # 2. Query latest primary emotion
    statement = (
        select(EmotionAnalysis)
        .join(MoodLog)
        .where(MoodLog.student_id == current_user.id)
        .order_by(EmotionAnalysis.analyzed_at.desc())
        .limit(1)
    )
    result = await db.execute(statement)
    latest_analysis = result.scalars().first()
    primary_emotion = latest_analysis.primary_emotion if latest_analysis else "anxiety"

    return recommendation_service.get_recommendations_for_profile(
        risk_level=assessment.risk_level,
        primary_emotion=primary_emotion
    )


@router.get(
    "/personalized",
    response_model=PersonalizedRecommendationsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get dynamic personalized self-care recommendations"
)
async def get_personalized_recommendations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.STUDENT]))
):
    """
    Generates or retrieves tailored, evidence-based coping tools for the student.
    Links directly to in-app exercises (Breathing, 5-4-3-2-1 Grounding, CBT Reframing, SOS).
    """
    return await recommendation_service.get_or_generate_personalized(db, current_user)


@router.post(
    "/{rec_id}/feedback",
    response_model=PersonalizedRecommendationItem,
    status_code=status.HTTP_200_OK,
    summary="Record feedback or completion for a recommendation"
)
async def record_recommendation_feedback(
    rec_id: UUID,
    payload: RecommendationFeedbackRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.STUDENT]))
):
    """
    Updates the completion status and effectiveness feedback (HELPFUL, NOT_HELPFUL)
    for a specific recommendation item.
    """
    record = await recommendation_repository.get_by_id_and_user(db, rec_id, current_user.id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "RECOMMENDATION_NOT_FOUND", "message": "Recommendation item not found."}
        )

    updated = await recommendation_repository.update_status_and_feedback(
        db,
        record=record,
        feedback=payload.feedback,
        status=payload.status
    )
    return updated
