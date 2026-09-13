"""
Test Suite: Hinglish Language & Crisis Support for MindGuard AI
Verifies that Hinglish student messages are accurately classified, trigger appropriate
intents and crisis safety responses, and generate warm, empathetic Hinglish dialogue.
"""

import sys
import os
import asyncio

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.ml.intent_inference import intent_classifier
from app.ml.safety_engine import safety_engine
from app.ml.response_orchestrator import response_orchestrator, is_hinglish_message

def test_hinglish():
    print("\n=======================================================")
    print("       Testing MindGuard AI Hinglish Support           ")
    print("=======================================================\n")

    test_cases = [
        ("Bohot zyada exam stress aur anxiety ho rahi hai, kuch samajh nahi aa raha", "exam_stress", False),
        ("Ghar ki bohot yaad aa rahi hai, hostel me mann nahi lag raha", "homesickness", False),
        ("Raat bhar neend nahi aa rahi, so nahi pa raha hoon", "sleep_problem", False),
        ("Mann bohot udas hai aur rona aa raha hai", "sadness", False),
        ("Dimag shant nahi ho raha, bohot ghabrahat aur bechaini hai", "anxiety", False),
        ("Padhne ka mann nahi lag raha, burnout ho gaya hai", "motivation_problem", False),
        ("Kaise calm down karu, breathing exercise batao", "request_for_coping_strategy", False),
        ("Counselor se baat karni hai, appointment book kardo", "request_for_human_support", False),
        ("Namaste! Kaisa chal raha hai?", "greeting", False),
        ("ab aur nahi jeena, sab khatam kar raha hoon", "crisis", True),
    ]

    passed = 0
    total = len(test_cases)

    for msg, expected_intent, is_crisis in test_cases:
        hinglish_flag = is_hinglish_message(msg)
        intent_res = intent_classifier.predict(msg)
        predicted_intent = intent_res["intent"]
        safety_eval = safety_engine.evaluate(msg, predicted_intent, {}, -0.5)

        if is_crisis:
            success = (safety_eval.risk_level == "RED")
            status = "PASSED" if success else "FAILED"
            print(f"[{status}] Crisis Detection: '{msg[:40]}...' -> {safety_eval.risk_level} ({safety_eval.trigger_type})")
        else:
            success = hinglish_flag and (predicted_intent == expected_intent)
            status = "PASSED" if success else "FAILED"
            print(f"[{status}] '{msg[:45]}...' -> Intent: {predicted_intent} (Expected: {expected_intent}), Hinglish: {hinglish_flag}")

        if success:
            passed += 1

    print(f"\nHinglish Test Summary: {passed}/{total} Passed")
    assert passed == total, f"Only {passed}/{total} passed"

    # Test conversational response generation in Hinglish
    response_payload = asyncio.run(
        response_orchestrator.generate(
            student_message="Bohot zyada exam stress ho raha hai",
            intent="exam_stress",
            primary_emotion="anxiety",
            emotion_scores={"anxiety": 0.8},
            sentiment_score=-0.4,
            risk_level="GREEN",
            recent_history=[]
        )
    )
    print("\n[Sample Hinglish Generated Response]:")
    print(response_payload["response"])
    assert len(response_payload["response"]) > 20

    print("\n[ALL HINGLISH TESTS PASSED SUCCESSFULLY]\n")

if __name__ == "__main__":
    test_hinglish()
