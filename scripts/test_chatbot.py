import asyncio
import sys
import os
from uuid import uuid4

# Add backend directory to sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.db.session import AsyncSessionLocal, Base, async_engine
from app.models.users import User, UserRole
from app.models.chat import Conversation, ChatMessage, SafetyEvent
from app.models.alerts import Alert, AlertStatus
from app.models.assessments import Assessment, RiskLevel
from app.ml.intent_inference import intent_classifier
from app.ml.safety_engine import safety_engine
from app.ml.response_orchestrator import response_orchestrator
from app.services.chatbot_service import chatbot_service, mask_pii
from app.services.conversation_service import conversation_service
from app.core.security import get_password_hash

async def run_all_tests():
    print("=================================================================")
    print("  MindGuard AI: Comprehensive AI Wellness Chatbot Test Suite     ")
    print("=================================================================")

    # 1. Test PII Masking
    print("\n[TEST 1] Testing PII Sanitization...")
    raw_text = "My email is student123@nmims.edu and phone is +91 9876543210. My registration is SAP_700123456."
    masked = mask_pii(raw_text)
    print(f"  Raw:    {raw_text}")
    print(f"  Masked: {masked}")
    assert "[EMAIL]" in masked, "PII Masking failed for email"
    assert "[PHONE]" in masked, "PII Masking failed for phone number"
    assert "[STUDENT_ID]" in masked, "PII Masking failed for student registration ID"
    print("  --> PASS: PII properly sanitized.")

    # 2. Test Intent Detection
    print("\n[TEST 2] Testing Intent Classification across canonical categories...")
    test_cases = [
        ("Hello! How are you doing today?", "greeting"),
        ("I am freaking out about my final semester exams tomorrow", "exam_stress"),
        ("I have so many assignments and thesis deadlines this week", "academic_pressure"),
        ("My heart is racing and I feel intense panic right now", "anxiety"),
        ("I have been feeling deeply sad and crying non-stop", "sadness"),
        ("I feel completely alone and isolated on campus", "loneliness"),
        ("I haven't been able to sleep for 3 days due to insomnia", "sleep_problem"),
        ("Can you guide me through a breathing exercise to calm down?", "request_for_coping_strategy"),
        ("I want to speak with a human counselor or psychologist", "request_for_human_support"),
        ("I want to kill myself and end it all", "crisis_or_high_risk"),
    ]
    for text, expected_intent in test_cases:
        res = intent_classifier.predict(text)
        print(f"  Text: '{text[:45]}...' -> Intent: {res['intent']} (Conf: {res['confidence']})")
        assert res["intent"] == expected_intent or expected_intent in res.get("secondary_intents", []) + [res["intent"]], f"Expected {expected_intent}, got {res['intent']}"
    print("  --> PASS: Intent classification verified.")

    # 3. Test Safety Engine Priority
    print("\n[TEST 3] Testing Safety Engine Priority Gates (GREEN / YELLOW / RED)...")
    
    # Green check
    green_eval = safety_engine.evaluate(
        current_message="Hello, I'd like to check in today.",
        detected_intent="greeting",
        emotion_scores={"joy": 0.6, "anxiety": 0.1, "sadness": 0.1},
        sentiment_score=0.5
    )
    print(f"  Green Case -> Risk Level: {green_eval.risk_level}, Score: {green_eval.risk_score}")
    assert green_eval.risk_level == "GREEN"
    assert not green_eval.requires_safety_workflow

    # Yellow check
    yellow_eval = safety_engine.evaluate(
        current_message="I'm feeling really overwhelmed with all my coursework.",
        detected_intent="academic_pressure",
        emotion_scores={"joy": 0.1, "anxiety": 0.7, "sadness": 0.5},
        sentiment_score=-0.4
    )
    print(f"  Yellow Case -> Risk Level: {yellow_eval.risk_level}, Score: {yellow_eval.risk_score}")
    assert yellow_eval.risk_level == "YELLOW"

    # Red check (Explicit Self-Harm)
    red_eval = safety_engine.evaluate(
        current_message="I don't want to live anymore, I want to kill myself tonight.",
        detected_intent="crisis_or_high_risk",
        emotion_scores={"joy": 0.0, "anxiety": 0.8, "sadness": 0.9},
        sentiment_score=-0.9
    )
    print(f"  Red Crisis Case -> Risk Level: {red_eval.risk_level}, Trigger: {red_eval.trigger_type}")
    assert red_eval.risk_level == "RED"
    assert red_eval.requires_safety_workflow
    assert red_eval.requires_human_review
    print("  --> PASS: Safety Engine deterministic priority verified.")

    # 4. Database End-to-End Pipeline & Counselor Escalation Verification
    print("\n[TEST 4] Testing End-to-End Pipeline, Database Persistence & Counselor Alert Dispatch...")
    
    # Initialize DB schema if needed
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Create a mock test student
        test_email = f"test_student_{uuid4().hex[:6]}@nmims.edu"
        student = User(
            email=test_email,
            password_hash=get_password_hash("TestPass@123"),
            role=UserRole.STUDENT,
            is_active=True
        )
        db.add(student)
        await db.commit()
        await db.refresh(student)

        # 4a. Create Conversation
        conv = await conversation_service.create_conversation(db, student_id=student.id, title="Test Wellness Session")
        print(f"  Created Conversation ID: {conv.id}")

        # 4b. Turn 1: Normal Check-In (GREEN)
        resp1 = await chatbot_service.process_student_message(
            db, student=student, conversation_id=conv.id, raw_message="Hello, I'm feeling alright today but wanted to say hi."
        )
        print(f"  Turn 1 (GREEN) -> Intent: {resp1.intent.label}, Emotion: {resp1.emotion.primary}, Risk: {resp1.risk.level}")
        assert resp1.risk.level == "GREEN"

        # 4c. Turn 2: Exam Stress (YELLOW)
        resp2 = await chatbot_service.process_student_message(
            db, student=student, conversation_id=conv.id, raw_message="I have my finals coming up next Monday and I'm feeling really stressed about failing."
        )
        print(f"  Turn 2 (YELLOW) -> Intent: {resp2.intent.label}, Emotion: {resp2.emotion.primary}, Risk: {resp2.risk.level}")
        print(f"  Suggested Actions: {resp2.suggested_actions}")
        assert resp2.risk.level == "YELLOW"
        assert len(resp2.suggested_actions) > 0

        # 4d. Turn 3: Crisis Message (RED) -> Verify Counselor Alert Creation
        resp3 = await chatbot_service.process_student_message(
            db, student=student, conversation_id=conv.id, raw_message="I cannot handle this pain anymore, I want to end my life."
        )
        print(f"  Turn 3 (RED Crisis) -> Risk: {resp3.risk.level}, Safety Alert: {resp3.safety_alert is not None}")
        assert resp3.risk.level == "RED"
        assert resp3.safety_alert is not None
        assert "14416" in resp3.response or "Tele-MANAS" in resp3.response

        # Verify DB records created: Assessment, Alert (PENDING), SafetyEvent
        from sqlalchemy.future import select
        alert_res = await db.execute(select(Alert).where(Alert.student_id == student.id, Alert.status == AlertStatus.PENDING))
        active_alert = alert_res.scalar_one_or_none()
        assert active_alert is not None, "Counselor alert was not created for RED crisis!"
        print(f"  [VERIFIED] Counselor Alert dispatched in DB: ID={active_alert.id}, Status={active_alert.status}")

        event_res = await db.execute(select(SafetyEvent).where(SafetyEvent.student_id == student.id))
        safety_event = event_res.scalar_one_or_none()
        assert safety_event is not None, "SafetyEvent was not logged!"
        print(f"  [VERIFIED] Safety Event logged in DB: ID={safety_event.id}, Severity={safety_event.severity}")

        # Verify message count in conversation
        messages = await conversation_service.get_recent_messages(db, conversation_id=conv.id, limit=20)
        print(f"  [VERIFIED] Total Persisted Messages in Conversation: {len(messages)} (3 student + 3 assistant)")
        assert len(messages) == 6

    print("\n=================================================================")
    print("  ALL TESTS PASSED SUCCESSFULLY! (100% VERIFIED)                 ")
    print("=================================================================")

if __name__ == "__main__":
    asyncio.run(run_all_tests())
