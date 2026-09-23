import pytest
from app.ml.safety_engine import safety_engine, SafetyEvaluation
from app.ml.inference import ml_service
from app.api.v1.surveys import get_phq9_severity, get_gad7_severity


def test_safety_engine_low_risk_normal_condition():
    """
    Verifies that neutral or positive emotional inputs classify as GREEN (Normal condition)
    with low risk scores and zero required emergency interventions.
    """
    evaluation: SafetyEvaluation = safety_engine.evaluate(
        current_message="Had a productive study session today and took a nice walk around campus.",
        detected_intent="general_sharing",
        emotion_scores={"joy": 0.85, "sadness": 0.05, "anxiety": 0.1, "fear": 0.0},
        sentiment_score=0.75,
        recent_history=[],
        previous_safety_events_count=0
    )
    assert evaluation.risk_level == "GREEN"
    assert evaluation.risk_score < 45.0
    assert evaluation.requires_safety_workflow is False
    assert evaluation.requires_human_review is False
    assert "Emotional baseline within stable parameters" in evaluation.risk_reasons


def test_safety_engine_medium_risk_elevated_stress():
    """
    Verifies that academic tension, moderate burnout, and panic symptoms classify as YELLOW (Medium risk).
    """
    evaluation: SafetyEvaluation = safety_engine.evaluate(
        current_message="I have three midterms tomorrow and I am freaking out and so worried about failing.",
        detected_intent="academic_stress",
        emotion_scores={"joy": 0.0, "sadness": 0.3, "anxiety": 0.8, "fear": 0.4},
        sentiment_score=-0.4,
        recent_history=[],
        previous_safety_events_count=0
    )
    assert evaluation.risk_level == "YELLOW"
    assert 45.0 <= evaluation.risk_score < 80.0
    assert evaluation.requires_safety_workflow is False
    assert any("trigger detected" in r or "Moderate emotional distress" in r for r in evaluation.risk_reasons)


def test_safety_engine_high_risk_explicit_crisis():
    """
    Verifies that explicit crisis triggers (suicide/self-harm ideation) in English
    deterministically override all other metrics to RED (High/Critical risk) with 95.0 risk score.
    """
    evaluation: SafetyEvaluation = safety_engine.evaluate(
        current_message="I feel like I have no reason to live anymore and want to end it all.",
        detected_intent="crisis_or_high_risk",
        emotion_scores={"joy": 0.0, "sadness": 0.9, "anxiety": 0.7, "fear": 0.5},
        sentiment_score=-0.95,
        recent_history=[],
        previous_safety_events_count=0
    )
    assert evaluation.risk_level == "RED"
    assert evaluation.risk_score >= 90.0
    assert evaluation.requires_safety_workflow is True
    assert evaluation.requires_human_review is True
    assert any("Direct high-risk trigger detected" in r for r in evaluation.risk_reasons)


def test_safety_engine_hinglish_crisis_detection():
    """
    Verifies that Hinglish suicidal expressions are recognized deterministically as RED risk.
    """
    evaluation: SafetyEvaluation = safety_engine.evaluate(
        current_message="ab aur nahi jeena, sab khatam ho gaya marne ka man kar raha hai",
        detected_intent="crisis_or_high_risk",
        emotion_scores={"joy": 0.0, "sadness": 0.8, "anxiety": 0.6, "fear": 0.3},
        sentiment_score=-0.9,
        recent_history=[],
        previous_safety_events_count=0
    )
    assert evaluation.risk_level == "RED"
    assert evaluation.risk_score >= 90.0
    assert evaluation.requires_safety_workflow is True
    assert evaluation.requires_human_review is True


def test_clinical_survey_risk_stratification_thresholds():
    """
    Verifies clinical screening cutoffs:
    - Minimal/Low: PHQ-9 <= 4 (Minimal) or <= 9 (Mild) -> Low Risk
    - Moderate/Medium: PHQ-9 10-14 (Moderate) -> Medium Risk
    - High: PHQ-9 >= 15 (Moderately Severe / Severe) -> High Risk
    """
    # 1. Low Depression
    low_severity = get_phq9_severity(4)
    assert low_severity == "Minimal Depression"
    assert get_phq9_severity(8) == "Mild Depression"

    # 2. Moderate Depression
    moderate_severity = get_phq9_severity(12)
    assert moderate_severity == "Moderate Depression"

    # 3. High/Severe Depression
    severe_severity = get_phq9_severity(18)
    assert severe_severity == "Moderately Severe Depression"
    assert get_phq9_severity(24) == "Severe Depression"

    # 4. GAD-7 Anxiety Scale
    assert get_gad7_severity(3) == "Minimal Anxiety"
    assert get_gad7_severity(7) == "Mild Anxiety"
    assert get_gad7_severity(12) == "Moderate Anxiety"
    assert get_gad7_severity(18) == "Severe Anxiety"


@pytest.mark.asyncio
async def test_inference_wellness_score_risk_tiers():
    """
    Verifies that NLP semantic sentiment directly maps into clinical wellness scores & risk tiers:
    - Positive sentiment (> 0.0) -> Mental wellness score >= 68.0 -> LOW risk
    - Mild/moderate stress (-0.2 to -0.4) -> Mental wellness score 35.0 to 64.9 -> MEDIUM risk
    - Deep despair (< -0.6) or crisis words -> Mental wellness score < 35.0 -> HIGH risk
    """
    # Low Risk Case
    _, low_score, low_risk = await ml_service.predict(
        text="I am feeling wonderful, calm, and looking forward to the week ahead!",
        self_reported_score=9
    )
    assert low_risk == "LOW"
    assert low_score >= 65.0

    # Medium Risk Case
    _, med_score, med_risk = await ml_service.predict(
        text="Feeling pretty drained, stressed with coursework, and struggling to stay focused.",
        self_reported_score=5
    )
    assert med_risk == "MEDIUM"
    assert 35.0 <= med_score < 65.0

    # High Risk Case
    _, high_score, high_risk = await ml_service.predict(
        text="I want to kill myself, I cannot survive this agony anymore.",
        self_reported_score=1
    )
    assert high_risk == "HIGH"
    assert high_score < 35.0
