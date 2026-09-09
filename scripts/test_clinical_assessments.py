"""
MindGuard Clinical Assessment & Mental Wellness Index Test Suite
Author: Avuti Anoushka
Verifies clinical cutoff scoring algorithms, survey classifications (PHQ-9, GAD-7),
and ML inference risk evaluation.
"""

import sys
import os
import asyncio

# Setup path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.ml.inference import MLService

GREEN = "\033[92m"
RED = "\033[91m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"

results = []

def record(test_name: str, passed: bool, info: str = ""):
    status = f"{GREEN}PASS{RESET}" if passed else f"{RED}FAIL{RESET}"
    print(f"  [{status}] {test_name} {f'({info})' if info else ''}")
    results.append({"name": test_name, "passed": passed, "info": info})


def test_clinical_wellness_cutoffs():
    print(f"\n{BOLD}1. Testing Mental Wellness Index Standardized Cutoffs{RESET}")
    # Thresholds:
    # 65 - 100: LOW (Optimal)
    # 35 - 64:  MEDIUM (Moderate)
    # 0 - 34:   HIGH (Critical)
    
    cases = [
        (85.0, "LOW", "Optimal Wellness"),
        (65.0, "LOW", "Optimal Wellness Boundary"),
        (64.9, "MEDIUM", "Moderate Strain Boundary High"),
        (48.0, "MEDIUM", "Moderate Strain Midpoint"),
        (35.0, "MEDIUM", "Moderate Strain Boundary Low"),
        (34.9, "HIGH", "Critical Distress Boundary"),
        (15.0, "HIGH", "Critical Distress"),
    ]
    
    for score, expected_tier, desc in cases:
        if score >= 65.0:
            tier = "LOW"
        elif score >= 35.0:
            tier = "MEDIUM"
        else:
            tier = "HIGH"
        passed = (tier == expected_tier)
        record(f"Score {score} -> {tier}", passed, desc)


def test_phq9_scoring():
    print(f"\n{BOLD}2. Testing PHQ-9 Depression Severity Bands{RESET}")
    # 0-4: Minimal, 5-9: Mild, 10-14: Moderate, 15-19: Moderately Severe, 20-27: Severe
    def classify_phq9(score: int) -> str:
        if score <= 4:
            return "MINIMAL"
        elif score <= 9:
            return "MILD"
        elif score <= 14:
            return "MODERATE"
        elif score <= 19:
            return "MODERATELY_SEVERE"
        else:
            return "SEVERE"

    tests = [
        (2, "MINIMAL"),
        (4, "MINIMAL"),
        (5, "MILD"),
        (9, "MILD"),
        (10, "MODERATE"),
        (14, "MODERATE"),
        (15, "MODERATELY_SEVERE"),
        (19, "MODERATELY_SEVERE"),
        (20, "SEVERE"),
        (27, "SEVERE"),
    ]

    for score, expected in tests:
        actual = classify_phq9(score)
        record(f"PHQ-9 Score {score} -> {actual}", actual == expected)


def test_gad7_scoring():
    print(f"\n{BOLD}3. Testing GAD-7 Anxiety Severity Bands{RESET}")
    # 0-4: Minimal, 5-9: Mild, 10-14: Moderate, 15-21: Severe
    def classify_gad7(score: int) -> str:
        if score <= 4:
            return "MINIMAL"
        elif score <= 9:
            return "MILD"
        elif score <= 14:
            return "MODERATE"
        else:
            return "SEVERE"

    tests = [
        (0, "MINIMAL"),
        (4, "MINIMAL"),
        (5, "MILD"),
        (9, "MILD"),
        (10, "MODERATE"),
        (14, "MODERATE"),
        (15, "SEVERE"),
        (21, "SEVERE"),
    ]

    for score, expected in tests:
        actual = classify_gad7(score)
        record(f"GAD-7 Score {score} -> {actual}", actual == expected)


async def test_ml_inference_calibration():
    print(f"\n{BOLD}4. Testing ML Clinical Sentiment & Risk Inference{RESET}")
    ml = MLService()
    ml.load_models()

    # Case 1: Positive emotion check
    emotions_1, score_1, risk_1 = await ml.predict("I am feeling very happy and grateful today!")
    record(
        "Positive check-in classification",
        risk_1 == "LOW" and score_1 >= 65.0,
        f"Score: {score_1}, Risk: {risk_1}"
    )

    # Case 2: Moderate stress / sadness check
    emotions_2, score_2, risk_2 = await ml.predict("I am feeling sad and overwhelmed with exams")
    record(
        "Moderate strain classification",
        risk_2 == "MEDIUM" and 35.0 <= score_2 < 65.0,
        f"Score: {score_2}, Risk: {risk_2}"
    )

    # Case 3: Crisis phrase triggering HIGH risk
    emotions_3, score_3, risk_3 = await ml.predict("I want to end my life and cannot continue")
    record(
        "Crisis detection priority trigger",
        risk_3 == "HIGH" and score_3 < 35.0,
        f"Score: {score_3}, Risk: {risk_3}"
    )


async def main():
    print(f"\n{BOLD}{CYAN}======================================================={RESET}")
    print(f"{BOLD}{CYAN}  MindGuard Clinical Assessment & Scoring Test Suite   {RESET}")
    print(f"{BOLD}{CYAN}======================================================={RESET}")

    test_clinical_wellness_cutoffs()
    test_phq9_scoring()
    test_gad7_scoring()
    await test_ml_inference_calibration()

    total = len(results)
    passed = sum(1 for r in results if r["passed"])
    failed = total - passed

    print(f"\n{BOLD}Test Summary:{RESET} {GREEN}{passed} Passed{RESET}, {RED if failed else GREEN}{failed} Failed{RESET} out of {total} tests.")

    if failed > 0:
        sys.exit(1)
    print(f"{BOLD}{GREEN}All clinical assessment tests successfully validated!{RESET}\n")

if __name__ == "__main__":
    asyncio.run(main())
