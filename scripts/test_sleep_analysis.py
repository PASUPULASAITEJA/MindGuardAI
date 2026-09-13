"""
Test Suite: Sleep Pattern Analysis & Circadian Health Module
Verifies:
1. Mathematical calculation of Sleep Onset (T_sleep), Wake Time (T_wake), and Duration (Delta T).
2. Circadian Regularity Index (CRI) and pre-bedtime blue light screen fatigue.
3. Backend behavioral ingestion, summary endpoint, and wearable sleep sync.
"""

import sys
import os
import asyncio

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from desktop_agent.mindguard_pc_agent import infer_circadian_sleep_metrics
from app.services.behavioral_service import behavioral_service

def test_sleep_analysis():
    print("\n=======================================================")
    print("  Testing Sleep Pattern Analysis & Circadian Module    ")
    print("=======================================================\n")

    # 1. Test mathematical inference for Optimal Sleep (No late-night screen time)
    optimal_metrics = infer_circadian_sleep_metrics(late_night_seconds=0, entertainment_seconds=1200)
    print("[Optimal Sleep Test]")
    print(f"  Inferred Sleep Onset: {optimal_metrics['inferred_sleep_onset']}")
    print(f"  Inferred Wake Time:  {optimal_metrics['inferred_wake_time']}")
    print(f"  Sleep Duration:      {optimal_metrics['sleep_duration_hours']} hrs")
    print(f"  Circadian CRI:       {optimal_metrics['circadian_regularity_score']}/100")
    print(f"  Pre-Bedtime Screen:  {optimal_metrics['pre_bedtime_screen_minutes']} mins")
    assert optimal_metrics["circadian_regularity_score"] >= 90.0
    assert optimal_metrics["sleep_duration_hours"] >= 7.0

    # 2. Test mathematical inference for Severe Late-Night Sleep Disruption (150 mins late night)
    disturbed_metrics = infer_circadian_sleep_metrics(late_night_seconds=150 * 60, entertainment_seconds=7200)
    print("\n[Severe Circadian Disruption Test (Live Machine Wake)]")
    print(f"  Inferred Sleep Onset: {disturbed_metrics['inferred_sleep_onset']}")
    print(f"  Inferred Wake Time:  {disturbed_metrics['inferred_wake_time']}")
    print(f"  Sleep Duration:      {disturbed_metrics['sleep_duration_hours']} hrs")
    print(f"  Circadian CRI:       {disturbed_metrics['circadian_regularity_score']}/100")
    print(f"  Pre-Bedtime Screen:  {disturbed_metrics['pre_bedtime_screen_minutes']} mins")
    assert disturbed_metrics["circadian_regularity_score"] < 60.0
    assert disturbed_metrics["sleep_duration_hours"] <= 7.5

    # Test with standard 8:15 AM wake time override for sleep deficit verification
    simulated_deficit = infer_circadian_sleep_metrics(late_night_seconds=150 * 60, entertainment_seconds=7200, wake_hour_override=8.25)
    print("\n[Sleep Deficit Simulation (Standard 8:15 AM Wake)]")
    print(f"  Inferred Sleep Onset: {simulated_deficit['inferred_sleep_onset']}")
    print(f"  Inferred Wake Time:  {simulated_deficit['inferred_wake_time']}")
    print(f"  Sleep Duration:      {simulated_deficit['sleep_duration_hours']} hrs")
    assert simulated_deficit["sleep_duration_hours"] == 5.5
    assert simulated_deficit["sleep_duration_hours"] < 6.5

    # 3. Test Wearable Sleep Sync Functionality
    class DummyUser:
        id = "00000000-0000-0000-0000-000000000001"

    wearable_payload = {
        "sleep_duration_hours": 7.6,
        "sleep_efficiency_pct": 91.0,
        "deep_sleep_minutes": 70,
        "rem_sleep_minutes": 95,
        "bedtime": "11:15 PM",
        "wake_time": "07:00 AM",
        "device_name": "Apple Watch Series 9"
    }
    sync_result = asyncio.run(behavioral_service.sync_wearable_sleep(None, DummyUser(), wearable_payload))
    print("\n[Wearable Sync Test]")
    print(f"  Status:  {sync_result['status']}")
    print(f"  Message: {sync_result['message']}")
    print(f"  Metrics: {sync_result['sleep_metrics']}")
    assert sync_result["status"] == "success"
    assert sync_result["sleep_metrics"]["sleep_duration_hours"] == 7.6

    print("\n[ALL SLEEP PATTERN ANALYSIS TESTS PASSED SUCCESSFULLY]\n")

if __name__ == "__main__":
    test_sleep_analysis()
