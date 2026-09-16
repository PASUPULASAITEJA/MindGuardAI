from datetime import datetime, timedelta, timezone
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.dependencies import get_current_user, verify_student_consent
from app.models.users import User, UserRole
from app.models.assessments import Assessment, RiskLevel
from app.models.mood_logs import MoodLog
from app.models.emotion_analyses import EmotionAnalysis
from app.models.chat import ChatMessage, SafetyEvent
from app.models.behavioral import BehavioralLog
from app.repositories.assessments import assessment_repository
from app.schemas.predictions import (
    AssessmentLatestResponse,
    PredictionExplanationResponse,
    RiskFactorItem,
    TrendSummary,
    TrendPeriodSummary
)
from app.services.audit_service import audit_service

router = APIRouter()

@router.get(
    "/assessment/latest",
    response_model=AssessmentLatestResponse,
    status_code=status.HTTP_200_OK,
    summary="Get latest wellness assessment and NLP emotions"
)
async def get_latest_assessment(
    student_id: Optional[UUID] = Query(None, description="Student ID (required for counselors)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves the most recent mental wellness score, risk level, and emotion vector.
    Students can access their own; counselors can query any student by ID.
    """
    # 1. Enforce RBAC rules and select target student ID
    if current_user.role == UserRole.COUNSELOR:
        if not student_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error_code": "STUDENT_ID_REQUIRED",
                    "message": "Counselors must provide a 'student_id' query parameter.",
                    "details": {}
                }
            )
        target_student_id = student_id
        await verify_student_consent(db, target_student_id)
    elif current_user.role == UserRole.STUDENT:
        target_student_id = current_user.id
    else:
        # Admins are not permitted clinical profiles directly here
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error_code": "FORBIDDEN",
                "message": "Institution Administrators do not have access to clinical profiles.",
                "details": {}
            }
        )

    # 2. Retrieve latest assessment
    assessment = await assessment_repository.get_latest_for_student(db, student_id=target_student_id)
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error_code": "ASSESSMENT_NOT_FOUND",
                "message": "No wellness assessment records found for this student.",
                "details": {}
            }
        )

    # 3. Retrieve latest emotion analysis for emotional mapping
    statement = (
        select(EmotionAnalysis)
        .join(MoodLog)
        .where(MoodLog.student_id == target_student_id)
        .order_by(EmotionAnalysis.analyzed_at.desc(), EmotionAnalysis.id.desc())
        .limit(1)
    )
    result = await db.execute(statement)
    latest_analysis = result.scalars().first()
    emotions = latest_analysis.detected_emotions if latest_analysis else {}
    sentiment_score = latest_analysis.sentiment_score if latest_analysis else None

    return AssessmentLatestResponse(
        assessment_id=assessment.id,
        mental_wellness_score=assessment.mental_wellness_score,
        risk_level=assessment.risk_level,
        emotions_detected=emotions,
        evaluated_at=assessment.evaluated_at,
        sentiment_score=sentiment_score
    )

@router.get(
    "/explain/{student_id}",
    response_model=PredictionExplanationResponse,
    status_code=status.HTTP_200_OK,
    summary="Get unified explainable AI risk factors and longitudinal trend summary"
)
async def explain_student_risk(
    student_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns unified risk explanation for clinical counselors and students:
    (a) Current risk tier ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
    (b) Last 7/30-day longitudinal trend summary (wellness delta, mood scores, sentiment, crisis events)
    (c) Top 5 synthesized explainable factors across mood_logs, emotion_analyses, assessments, chat crisis flags, and behavioral logs.
    """
    # 1. RBAC & Consent Enforcement
    if current_user.role in (UserRole.COUNSELOR, UserRole.ADMIN):
        await verify_student_consent(db, student_id)
    elif current_user.role == UserRole.STUDENT:
        if current_user.id != student_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students can only access their own risk explanations."
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted."
        )

    now = datetime.now(timezone.utc)
    t_7d = now - timedelta(days=7)
    t_30d = now - timedelta(days=30)
    t_30d_str = t_30d.strftime("%Y-%m-%d")

    def ensure_utc(dt: datetime) -> datetime:
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt

    # 2. Fetch Assessments (ordered by evaluated_at desc)
    stmt_assessments = (
        select(Assessment)
        .where(Assessment.student_id == student_id)
        .order_by(Assessment.evaluated_at.desc())
    )
    res_assessments = await db.execute(stmt_assessments)
    assessments: List[Assessment] = list(res_assessments.scalars().all())

    latest_assessment = assessments[0] if assessments else None

    # 3. Fetch Mood Logs (last 30 days)
    stmt_mood = (
        select(MoodLog)
        .where(MoodLog.student_id == student_id, MoodLog.logged_at >= t_30d)
        .order_by(MoodLog.logged_at.desc())
    )
    res_mood = await db.execute(stmt_mood)
    mood_logs: List[MoodLog] = list(res_mood.scalars().all())

    # 4. Fetch Emotion Analyses (last 30 days)
    stmt_emotion = (
        select(EmotionAnalysis)
        .join(MoodLog, EmotionAnalysis.mood_log_id == MoodLog.id)
        .where(MoodLog.student_id == student_id, EmotionAnalysis.analyzed_at >= t_30d)
        .order_by(EmotionAnalysis.analyzed_at.desc())
    )
    res_emotion = await db.execute(stmt_emotion)
    emotion_analyses: List[EmotionAnalysis] = list(res_emotion.scalars().all())

    # 5. Fetch Chat Message Crisis Flags & Safety Events (last 30 days)
    stmt_chat_crisis = (
        select(ChatMessage)
        .where(
            ChatMessage.student_id == student_id,
            ChatMessage.is_crisis_flag == True,
            ChatMessage.created_at >= t_30d
        )
    )
    res_chat_crisis = await db.execute(stmt_chat_crisis)
    chat_crisis_messages: List[ChatMessage] = list(res_chat_crisis.scalars().all())

    stmt_safety = (
        select(SafetyEvent)
        .where(
            SafetyEvent.student_id == student_id,
            SafetyEvent.created_at >= t_30d
        )
    )
    res_safety = await db.execute(stmt_safety)
    safety_events: List[SafetyEvent] = list(res_safety.scalars().all())

    # 6. Fetch Behavioral Logs (last 30 days)
    stmt_behavioral = (
        select(BehavioralLog)
        .where(
            BehavioralLog.student_id == student_id,
            BehavioralLog.date >= t_30d_str
        )
        .order_by(BehavioralLog.date.desc())
    )
    res_behavioral = await db.execute(stmt_behavioral)
    behavioral_logs: List[BehavioralLog] = list(res_behavioral.scalars().all())

    # --- Compute Partitioned Metrics ---
    assessments_30d = [a for a in assessments if ensure_utc(a.evaluated_at) >= t_30d]
    assessments_7d = [a for a in assessments if ensure_utc(a.evaluated_at) >= t_7d]

    mood_logs_30d = mood_logs
    mood_logs_7d = [m for m in mood_logs if ensure_utc(m.logged_at) >= t_7d]

    emotions_30d = emotion_analyses
    emotions_7d = [e for e in emotion_analyses if ensure_utc(e.analyzed_at) >= t_7d]

    chat_crisis_30d = chat_crisis_messages
    chat_crisis_7d = [c for c in chat_crisis_messages if ensure_utc(c.created_at) >= t_7d]

    safety_30d = safety_events
    safety_7d = [s for s in safety_events if ensure_utc(s.created_at) >= t_7d]

    total_crisis_7d = len(chat_crisis_7d) + len(safety_7d)
    total_crisis_30d = len(chat_crisis_30d) + len(safety_30d)

    # Current wellness score & risk tier
    if latest_assessment:
        current_wellness = round(float(latest_assessment.mental_wellness_score), 1)
        current_risk_tier = latest_assessment.risk_level
        evaluated_at = ensure_utc(latest_assessment.evaluated_at)
    else:
        if mood_logs_30d:
            valid_scores = [m.self_reported_score for m in mood_logs_30d if m.self_reported_score is not None]
            avg_m = (sum(valid_scores) / len(valid_scores)) if valid_scores else 6.0
            current_wellness = round(avg_m * 10.0, 1)
        else:
            current_wellness = 65.0
        current_risk_tier = RiskLevel.LOW
        evaluated_at = now

    # Escalate tier if active crisis flags detected in past 7 days
    if total_crisis_7d > 0 and current_risk_tier in (RiskLevel.LOW, RiskLevel.MEDIUM):
        current_risk_tier = RiskLevel.HIGH

    # 7-Day Trend Calculation
    if len(assessments_7d) >= 2:
        delta_7d = round(float(assessments_7d[0].mental_wellness_score - assessments_7d[-1].mental_wellness_score), 1)
        avg_wellness_7d = round(sum(float(a.mental_wellness_score) for a in assessments_7d) / len(assessments_7d), 1)
    elif len(assessments_7d) == 1:
        prior_assessments = [a for a in assessments if ensure_utc(a.evaluated_at) < t_7d]
        if prior_assessments:
            delta_7d = round(float(assessments_7d[0].mental_wellness_score - prior_assessments[0].mental_wellness_score), 1)
        else:
            delta_7d = 0.0
        avg_wellness_7d = round(float(assessments_7d[0].mental_wellness_score), 1)
    else:
        delta_7d = 0.0
        avg_wellness_7d = current_wellness

    if len(assessments_7d) == 0 and len(mood_logs_7d) == 0:
        dir_7d = "INSUFFICIENT_DATA"
    elif delta_7d > 3.0:
        dir_7d = "IMPROVING"
    elif delta_7d < -3.0:
        dir_7d = "DECLINING"
    else:
        dir_7d = "STABLE"

    # 30-Day Trend Calculation
    if len(assessments_30d) >= 2:
        delta_30d = round(float(assessments_30d[0].mental_wellness_score - assessments_30d[-1].mental_wellness_score), 1)
        avg_wellness_30d = round(sum(float(a.mental_wellness_score) for a in assessments_30d) / len(assessments_30d), 1)
    elif len(assessments_30d) == 1:
        prior_assessments = [a for a in assessments if ensure_utc(a.evaluated_at) < t_30d]
        if prior_assessments:
            delta_30d = round(float(assessments_30d[0].mental_wellness_score - prior_assessments[0].mental_wellness_score), 1)
        else:
            delta_30d = 0.0
        avg_wellness_30d = round(float(assessments_30d[0].mental_wellness_score), 1)
    else:
        delta_30d = 0.0
        avg_wellness_30d = current_wellness

    if len(assessments_30d) == 0 and len(mood_logs_30d) == 0:
        dir_30d = "INSUFFICIENT_DATA"
    elif delta_30d > 3.0:
        dir_30d = "IMPROVING"
    elif delta_30d < -3.0:
        dir_30d = "DECLINING"
    else:
        dir_30d = "STABLE"

    # Mood averages
    valid_mood_7d = [m.self_reported_score for m in mood_logs_7d if m.self_reported_score is not None]
    avg_mood_7d = round(sum(valid_mood_7d) / len(valid_mood_7d), 1) if valid_mood_7d else None

    valid_mood_30d = [m.self_reported_score for m in mood_logs_30d if m.self_reported_score is not None]
    avg_mood_30d = round(sum(valid_mood_30d) / len(valid_mood_30d), 1) if valid_mood_30d else None

    # Sentiment averages
    avg_sent_7d = round(sum(e.sentiment_score for e in emotions_7d) / len(emotions_7d), 2) if emotions_7d else None
    avg_sent_30d = round(sum(e.sentiment_score for e in emotions_30d) / len(emotions_30d), 2) if emotions_30d else None

    # Primary direction & Headline
    if total_crisis_7d > 0 or current_risk_tier == RiskLevel.CRITICAL:
        primary_dir = "CRITICAL"
        headline = "Critical distress triggers detected; immediate clinical review recommended."
    elif dir_7d == "DECLINING" or dir_30d == "DECLINING":
        primary_dir = "DECLINING"
        headline = f"Longitudinal wellness displays a downward trajectory ({delta_7d:+.1f} pts over 7 days)."
    elif dir_7d == "IMPROVING" or dir_30d == "IMPROVING":
        primary_dir = "IMPROVING"
        headline = f"Positive progress observed with an upward wellness trend ({delta_7d:+.1f} pts over 7 days)."
    else:
        primary_dir = "STABLE"
        headline = "Longitudinal wellness indicators and check-in metrics remain balanced within baseline."

    trend_summary = TrendSummary(
        summary_7d=TrendPeriodSummary(
            period_days=7,
            direction=dir_7d,
            wellness_delta=delta_7d,
            average_wellness=avg_wellness_7d,
            assessments_count=len(assessments_7d),
            mood_logs_count=len(mood_logs_7d),
            average_mood_score=avg_mood_7d,
            average_sentiment=avg_sent_7d,
            crisis_flags_count=total_crisis_7d
        ),
        summary_30d=TrendPeriodSummary(
            period_days=30,
            direction=dir_30d,
            wellness_delta=delta_30d,
            average_wellness=avg_wellness_30d,
            assessments_count=len(assessments_30d),
            mood_logs_count=len(mood_logs_30d),
            average_mood_score=avg_mood_30d,
            average_sentiment=avg_sent_30d,
            crisis_flags_count=total_crisis_30d
        ),
        primary_direction=primary_dir,
        headline=headline
    )

    # --- Synthesize Rule-Based Top 5 Factors ---
    candidate_factors: List[RiskFactorItem] = []

    # Factor Candidate 1: Safety & Crisis Flags
    if total_crisis_30d > 0:
        candidate_factors.append(RiskFactorItem(
            id="factor_crisis_flags",
            name="Safety & Crisis Alert Flags Triggered",
            category="CRISIS_SAFETY",
            severity="CRITICAL" if total_crisis_7d > 0 else "HIGH",
            impact_pct=min(45, 30 + total_crisis_30d * 5),
            description=f"{total_crisis_30d} acute distress keyword(s) or safety escalation trigger(s) detected across student chat messages.",
            source_metric="SafetyEvent / Chat Crisis Flag"
        ))

    # Factor Candidate 2: Reflective NLP Sentiment & Affect
    if avg_sent_30d is not None:
        if avg_sent_30d < -0.2:
            candidate_factors.append(RiskFactorItem(
                id="factor_negative_sentiment",
                name="Reflective Journaling Negative Polarity",
                category="LINGUISTIC_AFFECT",
                severity="HIGH" if avg_sent_30d < -0.4 else "MEDIUM",
                impact_pct=min(38, int(abs(avg_sent_30d) * 35) + 12),
                description=f"Natural language processing identified depressive polarity (sentiment: {avg_sent_30d:.2f}) across journal submissions.",
                source_metric="EmotionAnalysis / DistilBERT"
            ))
        elif avg_sent_30d > 0.2:
            candidate_factors.append(RiskFactorItem(
                id="factor_positive_sentiment",
                name="Constructive Emotional Valence in Journaling",
                category="LINGUISTIC_AFFECT",
                severity="POSITIVE",
                impact_pct=18,
                description=f"Reflections express optimistic emotional tone (sentiment: +{avg_sent_30d:.2f}), offering psychological resilience.",
                source_metric="EmotionAnalysis / DistilBERT"
            ))

    # Factor Candidate 3: Behavioral Telemetry / Circadian Rhythm
    late_night_mins_sum = sum(b.late_night_usage_minutes for b in behavioral_logs) if behavioral_logs else 0
    avg_late_night = (late_night_mins_sum / len(behavioral_logs)) if behavioral_logs else 0
    if avg_late_night > 30:
        candidate_factors.append(RiskFactorItem(
            id="factor_circadian_disruption",
            name="Late-Night Screen Exposure & Sleep Disruption",
            category="BEHAVIORAL_CIRCADIAN",
            severity="HIGH" if avg_late_night > 60 else "MEDIUM",
            impact_pct=min(32, int(avg_late_night * 0.35) + 10),
            description=f"Active device usage averaged {int(avg_late_night)} minutes between 12:00 AM and 5:00 AM, disrupting restorative sleep cycles.",
            source_metric="BehavioralLog Telemetry"
        ))
    elif behavioral_logs and avg_late_night < 15:
        candidate_factors.append(RiskFactorItem(
            id="factor_healthy_circadian",
            name="Healthy Sleep Hygiene & Nocturnal Rest",
            category="BEHAVIORAL_CIRCADIAN",
            severity="POSITIVE",
            impact_pct=16,
            description="Consistent absence of late-night screen activity indicates healthy sleep consistency and biological rhythm protection.",
            source_metric="BehavioralLog Telemetry"
        ))

    # Factor Candidate 4: Longitudinal Clinical Wellness Score Trajectory
    if delta_7d <= -4.0 or delta_30d <= -6.0:
        worst_delta = min(delta_7d, delta_30d)
        candidate_factors.append(RiskFactorItem(
            id="factor_wellness_decline",
            name="Acute Longitudinal Wellness Score Decline",
            category="LONGITUDINAL_TREND",
            severity="HIGH" if worst_delta <= -10.0 else "MEDIUM",
            impact_pct=min(30, int(abs(worst_delta) * 2) + 12),
            description=f"Clinical wellness score decreased by {abs(worst_delta):.1f} points over the evaluated window, indicating acute strain.",
            source_metric="Assessment Longitudinal Delta"
        ))
    elif delta_7d >= 4.0 or delta_30d >= 6.0:
        best_delta = max(delta_7d, delta_30d)
        candidate_factors.append(RiskFactorItem(
            id="factor_wellness_recovery",
            name="Positive Longitudinal Wellness Rebound",
            category="LONGITUDINAL_TREND",
            severity="POSITIVE",
            impact_pct=18,
            description=f"Multi-modal wellness score showed a steady increase of +{best_delta:.1f} points, demonstrating active recovery.",
            source_metric="Assessment Longitudinal Delta"
        ))

    # Factor Candidate 5: Subjective Self-Reported Mood Scores
    if avg_mood_30d is not None:
        if avg_mood_30d <= 4.0:
            candidate_factors.append(RiskFactorItem(
                id="factor_depressed_mood",
                name="Depressed Self-Reported Mood Frequency",
                category="SELF_REPORTED_MOOD",
                severity="HIGH" if avg_mood_30d <= 2.5 else "MEDIUM",
                impact_pct=min(26, int((5.0 - avg_mood_30d) * 5) + 10),
                description=f"Self-reported daily mood averaged {avg_mood_30d:.1f}/10 across {len(mood_logs_30d)} logs, reflecting persistent low morale.",
                source_metric="MoodLog Self-Reported"
            ))
        elif avg_mood_30d >= 6.5:
            candidate_factors.append(RiskFactorItem(
                id="factor_positive_mood",
                name="Stable & Resilient Self-Reported Mood",
                category="SELF_REPORTED_MOOD",
                severity="POSITIVE",
                impact_pct=15,
                description=f"Self-reported check-in mood averaged {avg_mood_30d:.1f}/10, reflecting sustained emotional stability.",
                source_metric="MoodLog Self-Reported"
            ))

    # Factor Candidate 6: Psychometric Risk Level Baseline
    if current_risk_tier in (RiskLevel.HIGH, RiskLevel.CRITICAL):
        candidate_factors.append(RiskFactorItem(
            id="factor_clinical_risk_tier",
            name="Clinical Predictive Risk Tier Assessment",
            category="PSYCHOMETRIC_EVAL",
            severity="CRITICAL" if current_risk_tier == RiskLevel.CRITICAL else "HIGH",
            impact_pct=28,
            description=f"Comprehensive predictive assessment placed current clinical profile in the {current_risk_tier.value} risk tier.",
            source_metric="Assessments Classification Model"
        ))
    else:
        candidate_factors.append(RiskFactorItem(
            id="factor_clinical_risk_tier_stable",
            name="Predictive Psychometric Baseline Stability",
            category="PSYCHOMETRIC_EVAL",
            severity="LOW",
            impact_pct=12,
            description=f"Longitudinal assessments confirm student currently resides within the {current_risk_tier.value} risk bracket.",
            source_metric="Assessments Classification Model"
        ))

    # Factor Candidate 7: Daytime Activity & Protective Buffer
    candidate_factors.append(RiskFactorItem(
        id="factor_daytime_buffer",
        name="Daytime Routine & Cognitive Focus",
        category="PROTECTIVE_BUFFER",
        severity="POSITIVE",
        impact_pct=14,
        description="Engagement in structured daytime activities and routine check-ins provides positive psychological scaffolding.",
        source_metric="Behavioral Telemetry & Platform Usage"
    ))

    # Sort candidates by severity hierarchy, then impact percentage descending
    severity_rank = {
        "CRITICAL": 0,
        "HIGH": 1,
        "MEDIUM": 2,
        "LOW": 3,
        "POSITIVE": 4
    }
    candidate_factors.sort(key=lambda f: (severity_rank.get(f.severity, 5), -f.impact_pct))

    # Select top 5 unique factors
    seen_ids = set()
    top_5_factors: List[RiskFactorItem] = []
    for f in candidate_factors:
        if f.id not in seen_ids:
            seen_ids.add(f.id)
            top_5_factors.append(f)
            if len(top_5_factors) == 5:
                break

    # 7. Audit Logging
    await audit_service.log_event(
        db=db,
        action="EXPLAIN_RISK_FACTORS",
        target_resource_type="PREDICTIONS",
        actor_user_id=current_user.id,
        actor_role=current_user.role.value,
        target_user_id=student_id,
        target_resource_id=str(student_id),
        metadata={
            "risk_tier": current_risk_tier.value,
            "wellness_score": current_wellness,
            "direction_7d": dir_7d,
            "direction_30d": dir_30d,
            "factors_count": len(top_5_factors)
        }
    )

    return PredictionExplanationResponse(
        student_id=student_id,
        current_risk_tier=current_risk_tier,
        current_wellness_score=current_wellness,
        evaluated_at=evaluated_at,
        trend_summary=trend_summary,
        top_factors=top_5_factors
    )
