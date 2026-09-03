import asyncio
import sys
import os
from uuid import uuid4
from datetime import datetime, timezone

# Add backend directory to sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.db.session import AsyncSessionLocal, Base, async_engine
from app.models.users import User, UserRole
from app.models.behavioral import BehavioralLog
from app.models.alerts import Alert, AlertStatus
from app.models.assessments import Assessment, RiskLevel
from app.models.chat import SafetyEvent
from app.schemas.chatbot import BehavioralFeaturesPayload
from app.services.behavioral_service import behavioral_service
from app.core.security import get_password_hash
from sqlalchemy.future import select

async def run_behavioral_tests():
    print("=================================================================")
    print("  MindGuard AI: PC Behavioral Agent & Fusion Test Suite          ")
    print("=================================================================")

    # 1. Initialize DB schema if needed
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Create a mock student for testing
        test_email = f"pc_student_{uuid4().hex[:6]}@nmims.edu"
        student = User(
            email=test_email,
            password_hash=get_password_hash("StudentPass@123"),
            role=UserRole.STUDENT,
            is_active=True
        )
        db.add(student)
        await db.commit()
        await db.refresh(student)
        print(f"\n[SETUP] Created Test Student: {student.email} ({student.id})")

        # 2. Test 1: Ingest Normal Daytime Academic Telemetry (LOW Risk)
        print("\n[TEST 1] Testing Normal Daytime Academic Telemetry (LOW Risk)...")
        payload_normal = BehavioralFeaturesPayload(
            student_id=str(student.id),
            date="2026-09-01",
            total_screen_time_minutes=240,
            late_night_usage_minutes=0,
            academic_usage_minutes=180,
            social_usage_minutes=30,
            entertainment_usage_minutes=30,
            baseline_deviation_score=0.0
        )
        res1 = await behavioral_service.ingest_and_evaluate(db, student, payload_normal)
        print(f"  Ingest Status: {res1['status']}")
        print(f"  Calculated Risk: {res1['risk_assessment']['risk_level']} (Z={res1['baseline_analysis']['deviation_z_score']})")
        assert res1['risk_assessment']['risk_level'] == "LOW", f"Expected LOW, got {res1['risk_assessment']['risk_level']}"
        assert not res1['risk_assessment']['counselor_escalated']
        print("  --> PASS: Normal telemetry properly classified as LOW risk.")

        # 3. Test 2: Ingest Moderate Late-Night Telemetry (MEDIUM Risk)
        print("\n[TEST 2] Testing Moderate Late-Night Screen Activity (MEDIUM Risk)...")
        payload_medium = BehavioralFeaturesPayload(
            student_id=str(student.id),
            date="2026-09-02",
            total_screen_time_minutes=380,
            late_night_usage_minutes=100,  # 100 mins after midnight
            academic_usage_minutes=120,
            social_usage_minutes=160,
            entertainment_usage_minutes=100,
            baseline_deviation_score=0.0
        )
        res2 = await behavioral_service.ingest_and_evaluate(db, student, payload_medium)
        print(f"  Calculated Risk: {res2['risk_assessment']['risk_level']} (Z={res2['baseline_analysis']['deviation_z_score']})")
        print(f"  Reasons: {res2['risk_assessment']['reasons']}")
        assert res2['risk_assessment']['risk_level'] == "MEDIUM", f"Expected MEDIUM, got {res2['risk_assessment']['risk_level']}"
        print("  --> PASS: Moderate late-night activity classified as MEDIUM risk.")

        # 4. Test 3: Ingest Severe Circadian Disruption Telemetry (HIGH Risk / Counselor Alert)
        print("\n[TEST 3] Testing Severe Late-Night Spike (HIGH Risk & Auto Counselor Escalation)...")
        payload_high = BehavioralFeaturesPayload(
            student_id=str(student.id),
            date="2026-09-03",
            total_screen_time_minutes=540,
            late_night_usage_minutes=210,  # 3.5 hours past midnight (severe insomnia/crisis)
            academic_usage_minutes=20,
            social_usage_minutes=280,
            entertainment_usage_minutes=240,
            baseline_deviation_score=0.0
        )
        res3 = await behavioral_service.ingest_and_evaluate(db, student, payload_high)
        print(f"  Calculated Risk: {res3['risk_assessment']['risk_level']} (Z={res3['baseline_analysis']['deviation_z_score']})")
        print(f"  Counselor Escalated: {res3['risk_assessment']['counselor_escalated']}")
        print(f"  Dispatched Alert ID: {res3['risk_assessment']['alert_id']}")
        assert res3['risk_assessment']['risk_level'] == "HIGH"
        assert res3['risk_assessment']['counselor_escalated'] is True

        # Verify DB records created: Assessment, Alert (PENDING), SafetyEvent
        alert_res = await db.execute(select(Alert).where(Alert.student_id == student.id, Alert.status == AlertStatus.PENDING))
        active_alert = alert_res.scalar_one_or_none()
        assert active_alert is not None, "Counselor alert was not created for HIGH behavioral risk!"
        print(f"  [VERIFIED] Counselor Alert created in DB: ID={active_alert.id}, Status={active_alert.status}")

        safety_res = await db.execute(select(SafetyEvent).where(SafetyEvent.student_id == student.id))
        safety_event = safety_res.scalar_one_or_none()
        assert safety_event is not None, "SafetyEvent was not logged!"
        print(f"  [VERIFIED] Safety Event logged in DB: ID={safety_event.id}, Severity={safety_event.severity}")
        print("  --> PASS: Severe late-night spike automatically escalated to counselor triage queue.")

        # 5. Test 4: Verify Summary API output
        print("\n[TEST 4] Testing Dashboard Summary Telemetry Retrieval...")
        summary = await behavioral_service.get_student_summary(db, student.id)
        print(f"  Agent Connected: {summary['is_agent_connected']}")
        print(f"  Live Active: {summary['is_currently_active']}")
        print(f"  Today Total Screen Time: {summary['latest_log']['total_screen_time_minutes']} min")
        print(f"  Weekly History Entries: {len(summary['weekly_history'])}")
        assert summary['is_agent_connected'] is True
        assert len(summary['weekly_history']) >= 3
        print("  --> PASS: Dashboard summary API verified.")

    print("\n=================================================================")
    print("  ALL BEHAVIORAL AGENT TESTS PASSED 100% SUCCESSFULLY!           ")
    print("=================================================================")

if __name__ == "__main__":
    asyncio.run(run_behavioral_tests())
