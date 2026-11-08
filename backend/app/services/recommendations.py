from typing import List, Optional
from uuid import UUID, uuid4
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.users import User
from app.models.assessments import Assessment, RiskLevel
from app.models.mood_logs import MoodLog
from app.models.emotion_analyses import EmotionAnalysis
from app.models.recommendations import RecommendationRecord
from app.repositories.assessments import assessment_repository
from app.repositories.recommendations import recommendation_repository
from app.schemas.recommendations import (
    RecommendationActivity,
    RecommendationResponse,
    PersonalizedRecommendationItem,
    PersonalizedRecommendationsResponse,
)


class RecommendationService:
    def get_recommendations_for_profile(
        self,
        risk_level: RiskLevel,
        primary_emotion: str
    ) -> RecommendationResponse:
        """
        Legacy fallback decision matrix for backward compatibility.
        """
        activities = []
        if risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]:
            activities = [
                RecommendationActivity(
                    type="SUPPORT",
                    title="Contact 24/7 Immediate Campus Crisis Support",
                    url="/student/sos"
                ),
                RecommendationActivity(
                    type="APPOINTMENT",
                    title="Schedule Urgent Session with Clinic Counselor",
                    url="/student/appointments"
                )
            ]
        elif risk_level == RiskLevel.MEDIUM:
            if primary_emotion in ["anxiety", "fear", "stress"]:
                activities = [
                    RecommendationActivity(
                        type="MINDFULNESS",
                        title="Box Breathing Regulation Exercise",
                        url="/student/grounding?tool=box"
                    ),
                    RecommendationActivity(
                        type="ARTICLE",
                        title="Coping with Academic Exam Burnout",
                        url="/student/resources#burnout"
                    )
                ]
            else:
                activities = [
                    RecommendationActivity(
                        type="MEDITATION",
                        title="Guided Mindful Grounding Session",
                        url="/student/grounding?tool=54321"
                    ),
                    RecommendationActivity(
                        type="ARTICLE",
                        title="Optimizing Sleep Schedules for Stress Reduction",
                        url="/student/resources#sleep"
                    )
                ]
        else:
            activities = [
                RecommendationActivity(
                    type="ARTICLE",
                    title="Campus Work-Life Balance Guidelines",
                    url="/student/resources#balance"
                ),
                RecommendationActivity(
                    type="JOURNAL",
                    title="Daily Student Wellness Journaling",
                    url="/student/journal"
                )
            ]

        return RecommendationResponse(risk_level=risk_level, activities=activities)

    async def get_or_generate_personalized(
        self,
        db: AsyncSession,
        student: User
    ) -> PersonalizedRecommendationsResponse:
        """
        Next-gen recommendation engine:
        Evaluates student's longitudinal assessments and emotional telemetry to provide
        actionable, evidence-based coping tools with direct in-app navigation.
        """
        # 1. Check existing active recommendations
        active_records = await recommendation_repository.get_active_for_user(db, student.id, limit=6)

        # 2. Query latest assessment & emotional state
        latest_assessment = await assessment_repository.get_latest_for_student(db, student_id=student.id)
        risk_tier = latest_assessment.risk_level.value if latest_assessment else "LOW"
        wellness_score = latest_assessment.mental_wellness_score if latest_assessment else 75.0

        # Query latest emotion analysis
        stmt = (
            select(EmotionAnalysis)
            .join(MoodLog)
            .where(MoodLog.student_id == student.id)
            .order_by(EmotionAnalysis.analyzed_at.desc())
            .limit(1)
        )
        res = await db.execute(stmt)
        latest_emotion_obj = res.scalars().first()
        primary_emotion = (latest_emotion_obj.primary_emotion.lower() if latest_emotion_obj and latest_emotion_obj.primary_emotion else "calm")

        # If active recommendations already exist and are fresh (within 24 hours), return them
        if active_records:
            items = [PersonalizedRecommendationItem.model_validate(r) for r in active_records]
            return PersonalizedRecommendationsResponse(
                risk_tier=risk_tier,
                primary_emotion=primary_emotion,
                wellness_score=wellness_score,
                rationale=self._build_rationale(risk_tier, primary_emotion),
                recommendations=items
            )

        # 3. Generate dynamic recommendations based on matrix
        new_records = self._generate_recommendation_records(
            user_id=student.id,
            risk_tier=risk_tier,
            primary_emotion=primary_emotion,
            wellness_score=wellness_score
        )

        saved_records = await recommendation_repository.create_batch(db, new_records)
        items = [PersonalizedRecommendationItem.model_validate(r) for r in saved_records]

        return PersonalizedRecommendationsResponse(
            risk_tier=risk_tier,
            primary_emotion=primary_emotion,
            wellness_score=wellness_score,
            rationale=self._build_rationale(risk_tier, primary_emotion),
            recommendations=items
        )

    def _build_rationale(self, risk_tier: str, primary_emotion: str) -> str:
        if risk_tier in ["HIGH", "CRITICAL"]:
            return "Prioritized crisis containment and clinical support package based on elevated clinical indicators."
        elif primary_emotion in ["anxiety", "fear", "nervous"]:
            return "Somatic stabilization and panic de-escalation tools selected based on detected anxiety patterns."
        elif primary_emotion in ["sadness", "depressed", "lonely"]:
            return "Cognitive reframing and expressive journaling interventions suggested to support low mood."
        elif primary_emotion in ["anger", "frustration", "irritability"]:
            return "Emotional regulation and physiological grounding tools selected to defuse stress overload."
        else:
            return "Preventative self-care and resilience-building practices tailored for maintenance of mental well-being."

    def _generate_recommendation_records(
        self,
        user_id: UUID,
        risk_tier: str,
        primary_emotion: str,
        wellness_score: float
    ) -> List[RecommendationRecord]:
        records: List[RecommendationRecord] = []

        if risk_tier in ["HIGH", "CRITICAL"]:
            records.append(
                RecommendationRecord(
                    id=uuid4(),
                    user_id=user_id,
                    category="CRISIS_SUPPORT",
                    title="24/7 Immediate Campus Crisis & Helpline Support",
                    description="Connect immediately with confidential 24/7 emergency helplines or campus security responders.",
                    reason="Prioritized due to elevated safety indicators.",
                    action_type="INTERNAL_ROUTE",
                    action_url="/student/sos",
                    risk_tier=risk_tier,
                    status="ACTIVE"
                )
            )
            records.append(
                RecommendationRecord(
                    id=uuid4(),
                    user_id=user_id,
                    category="COUNSELOR_APPOINTMENT",
                    title="Schedule Urgent Session with Clinic Counselor",
                    description="Book a dedicated confidential consultation with a licensed university psychological counselor.",
                    reason="Clinical referral recommended for elevated stress.",
                    action_type="INTERNAL_ROUTE",
                    action_url="/student/appointments",
                    risk_tier=risk_tier,
                    status="ACTIVE"
                )
            )
            records.append(
                RecommendationRecord(
                    id=uuid4(),
                    user_id=user_id,
                    category="BREATHING",
                    title="Box Breathing Regulation (4-4-4-4)",
                    description="A rapid nervous system stabilization technique: 4s inhale, 4s hold, 4s exhale, 4s hold.",
                    reason="Somatic regulation during acute distress.",
                    action_type="INTERNAL_ROUTE",
                    action_url="/student/grounding?tool=box",
                    risk_tier=risk_tier,
                    status="ACTIVE"
                )
            )
        elif primary_emotion in ["anxiety", "fear", "panic", "stress"] or risk_tier == "MEDIUM":
            records.append(
                RecommendationRecord(
                    id=uuid4(),
                    user_id=user_id,
                    category="BREATHING",
                    title="Box Breathing Regulation (4-4-4-4)",
                    description="Guided visual breathing pacing to stimulate the vagus nerve and reduce racing thoughts.",
                    reason="Calms elevated heart rate and somatic anxiety.",
                    action_type="INTERNAL_ROUTE",
                    action_url="/student/grounding?tool=box",
                    risk_tier=risk_tier,
                    status="ACTIVE"
                )
            )
            records.append(
                RecommendationRecord(
                    id=uuid4(),
                    user_id=user_id,
                    category="GROUNDING",
                    title="5-4-3-2-1 Sensory Grounding",
                    description="Engage your five senses to ground your mind in the present physical space.",
                    reason="Proven to interrupt escalating cognitive spirals.",
                    action_type="INTERNAL_ROUTE",
                    action_url="/student/grounding?tool=54321",
                    risk_tier=risk_tier,
                    status="ACTIVE"
                )
            )
            records.append(
                RecommendationRecord(
                    id=uuid4(),
                    user_id=user_id,
                    category="COGNITIVE_REFRAME",
                    title="Cognitive Distortion Reframer",
                    description="Analyze automatic negative thoughts with AI-assisted cognitive restructuring.",
                    reason="Evidence-based CBT approach to counter catastrophizing.",
                    action_type="INTERNAL_ROUTE",
                    action_url="/student/reframer",
                    risk_tier=risk_tier,
                    status="ACTIVE"
                )
            )
        elif primary_emotion in ["sadness", "grief", "loneliness"]:
            records.append(
                RecommendationRecord(
                    id=uuid4(),
                    user_id=user_id,
                    category="COGNITIVE_REFRAME",
                    title="Cognitive Reframer & Balanced Perspective",
                    description="Examine discouraging thought patterns and generate compassionate, balanced alternatives.",
                    reason="Supports cognitive restructuring during periods of low mood.",
                    action_type="INTERNAL_ROUTE",
                    action_url="/student/reframer",
                    risk_tier=risk_tier,
                    status="ACTIVE"
                )
            )
            records.append(
                RecommendationRecord(
                    id=uuid4(),
                    user_id=user_id,
                    category="JOURNALING",
                    title="Guided Reflective Journaling",
                    description="Write freely with automated PII masking and therapeutic emotional insights.",
                    reason="Encourages emotional release and healthy self-expression.",
                    action_type="INTERNAL_ROUTE",
                    action_url="/student/journal",
                    risk_tier=risk_tier,
                    status="ACTIVE"
                )
            )
            records.append(
                RecommendationRecord(
                    id=uuid4(),
                    user_id=user_id,
                    category="COUNSELOR_APPOINTMENT",
                    title="Confidential Counselor Check-in",
                    description="Connect with a wellness advisor to discuss academic or personal adjustments.",
                    reason="Accessible professional sounding board for emotional processing.",
                    action_type="INTERNAL_ROUTE",
                    action_url="/student/appointments",
                    risk_tier=risk_tier,
                    status="ACTIVE"
                )
            )
        else:
            # Low risk / calm / joy / maintenance
            records.append(
                RecommendationRecord(
                    id=uuid4(),
                    user_id=user_id,
                    category="JOURNALING",
                    title="Gratitude & Strengths Journaling",
                    description="Document meaningful achievements and positive interactions from today.",
                    reason="Strengthens positive neural pathways and emotional resilience.",
                    action_type="INTERNAL_ROUTE",
                    action_url="/student/journal",
                    risk_tier=risk_tier,
                    status="ACTIVE"
                )
            )
            records.append(
                RecommendationRecord(
                    id=uuid4(),
                    user_id=user_id,
                    category="BREATHING",
                    title="4-7-8 Mindful Relaxation Pacing",
                    description="Inhale for 4 seconds, hold for 7 seconds, exhale slowly for 8 seconds.",
                    reason="Promotes deep restorative rest and mental clarity.",
                    action_type="INTERNAL_ROUTE",
                    action_url="/student/grounding?tool=478",
                    risk_tier=risk_tier,
                    status="ACTIVE"
                )
            )
            records.append(
                RecommendationRecord(
                    id=uuid4(),
                    user_id=user_id,
                    category="SLEEP_HYGIENE",
                    title="Circadian Sleep & Recovery Protocols",
                    description="Explore campus wellness guides for circadian alignment and sustained focus.",
                    reason="Maintains academic endurance and physical recovery.",
                    action_type="INTERNAL_ROUTE",
                    action_url="/student/resources#sleep",
                    risk_tier=risk_tier,
                    status="ACTIVE"
                )
            )

        return records


recommendation_service = RecommendationService()
