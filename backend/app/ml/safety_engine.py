import re
from typing import Dict, List, Optional
from dataclasses import dataclass, field

@dataclass
class SafetyEvaluation:
    risk_level: str  # "GREEN", "YELLOW", "RED"
    risk_score: float  # 0.0 to 100.0 (higher = more distress/risk)
    risk_reasons: List[str] = field(default_factory=list)
    requires_safety_workflow: bool = False
    requires_human_review: bool = False
    trigger_type: Optional[str] = None

# Critical Red Triggers (Suicide, Self-Harm, Life-Threatening Crisis)
RED_PATTERNS = [
    (r"\b(suicide|suicidal|kill myself|want to die|end my life|end it all|hang myself|slit my|cut my wrist)\b", "EXPLICIT_SUICIDAL_IDEATION"),
    (r"\b(overdose|drink bleach|jump off|jump in front of|shoot myself|take all my pills)\b", "LETHAL_SELF_HARM_PLAN"),
    (r"\b(no reason to live|better off dead|world is better without me|don't want to wake up)\b", "SEVERE_HOPELESSNESS_CRISIS"),
    (r"\b(goodbye forever|my final goodbye|leaving this world|farewell everyone)\b", "SUICIDAL_FAREWELL_SIGNAL"),
    (r"\b(hurting myself|self-harm|self harm|burning myself|cutting myself)\b", "ACTIVE_SELF_HARM")
]

# Yellow Distress Triggers (Moderate Risk, Acute Anxiety, Depressive Feelings, Burnout)
YELLOW_PATTERNS = [
    (r"\b(can'?t take this anymore|so overwhelmed|breaking down|having a panic attack|hyperventilating)\b", "ACUTE_PANIC_OR_OVERWHELM"),
    (r"\b(failing everything|ruined my life|worthless|hopeless|crying non stop|can'?t stop crying)\b", "ACUTE_EMOTIONAL_DISTRESS"),
    (r"\b(nobody cares|completely alone|isolated|drowning in stress|extreme burnout)\b", "SEVERE_ISOLATION_OR_BURNOUT")
]

class SafetyEngine:
    """
    Deterministic safety and crisis detection engine.
    This component possesses STRICT PRIORITY over any generative model or LLM.
    Evaluates inputs for safety triggers, escalations, and crisis thresholds.
    """

    def evaluate(
        self,
        current_message: str,
        detected_intent: str,
        emotion_scores: Dict[str, float],
        sentiment_score: float,
        recent_history: Optional[List[Dict[str, any]]] = None,
        previous_safety_events_count: int = 0
    ) -> SafetyEvaluation:
        text = current_message.lower().strip()
        reasons = []

        # 1. Deterministic RED Evaluation (Highest Priority)
        for pattern, trigger_name in RED_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                reasons.append(f"Direct high-risk trigger detected: {trigger_name}")
                return SafetyEvaluation(
                    risk_level="RED",
                    risk_score=95.0,
                    risk_reasons=reasons,
                    requires_safety_workflow=True,
                    requires_human_review=True,
                    trigger_type=trigger_name
                )

        # 2. Intent-Based RED Overrides
        if detected_intent == "crisis_or_high_risk":
            reasons.append("Intent classified as crisis_or_high_risk")
            return SafetyEvaluation(
                risk_level="RED",
                risk_score=90.0,
                risk_reasons=reasons,
                requires_safety_workflow=True,
                requires_human_review=True,
                trigger_type="CRISIS_INTENT_DETECTED"
            )

        # 3. Yellow Distress Evaluation
        yellow_matched = False
        yellow_trigger = None
        for pattern, trigger_name in YELLOW_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                yellow_matched = True
                yellow_trigger = trigger_name
                reasons.append(f"Elevated distress trigger detected: {trigger_name}")
                break

        # 4. Emotion & Sentiment Multi-Signal Calculation
        sadness = emotion_scores.get("sadness", 0.0)
        anxiety = emotion_scores.get("anxiety", 0.0)
        fear = emotion_scores.get("fear", 0.0)
        joy = emotion_scores.get("joy", 0.0)

        # Cumulative distress score (0 to 100)
        distress_score = (sadness * 45.0 + anxiety * 40.0 + fear * 25.0) - (joy * 20.0)
        if sentiment_score < -0.5:
            distress_score += 15.0

        distress_score = max(0.0, min(100.0, distress_score))

        # Check for multi-turn escalating distress in recent conversation history
        escalating_distress = False
        if recent_history and len(recent_history) >= 2:
            recent_distressed = sum(
                1 for msg in recent_history[-3:]
                if msg.get("risk_level") in ["YELLOW", "RED"] or msg.get("primary_emotion") in ["sadness", "anxiety", "fear"]
            )
            if recent_distressed >= 2:
                escalating_distress = True
                distress_score += 15.0
                reasons.append("Multi-turn escalating negative emotional state detected")

        # 5. Risk Tier Assignment (Decision Diamond)
        if distress_score >= 80.0 or (yellow_matched and escalating_distress):
            reasons.append("Severe cumulative emotional distress score exceeded critical threshold")
            return SafetyEvaluation(
                risk_level="RED",
                risk_score=round(distress_score, 1),
                risk_reasons=reasons,
                requires_safety_workflow=True,
                requires_human_review=True,
                trigger_type="CUMULATIVE_ACUTE_DISTRESS"
            )
        elif yellow_matched or distress_score >= 45.0 or previous_safety_events_count > 0:
            if not yellow_matched:
                reasons.append(f"Moderate emotional distress score ({distress_score:.1f})")
            return SafetyEvaluation(
                risk_level="YELLOW",
                risk_score=round(distress_score, 1),
                risk_reasons=reasons,
                requires_safety_workflow=False,
                requires_human_review=False,
                trigger_type=yellow_trigger or "ELEVATED_EMOTIONAL_LOAD"
            )
        else:
            return SafetyEvaluation(
                risk_level="GREEN",
                risk_score=round(distress_score, 1),
                risk_reasons=["Emotional baseline within stable parameters"],
                requires_safety_workflow=False,
                requires_human_review=False,
                trigger_type=None
            )

safety_engine = SafetyEngine()
