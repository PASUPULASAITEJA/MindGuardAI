"""
MindGuard Comprehensive End-to-End System Test Suite
Tests all roles, API endpoints, ML evaluation pipeline, and security/RBAC enforcement.
"""

import sys
import os
import asyncio
from datetime import datetime

# Setup path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.session import AsyncSessionLocal, async_engine, Base
from app.models.users import User, UserRole

GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"

test_results = []

def record_test(name: str, passed: bool, details: str = ""):
    status_str = f"{GREEN}PASSED{RESET}" if passed else f"{RED}FAILED{RESET}"
    print(f"[{status_str}] {name} {f'({details})' if details else ''}")
    test_results.append({"name": name, "passed": passed, "details": details})

async def run_all_tests():
    print(f"\n{BOLD}{CYAN}======================================================={RESET}")
    print(f"{BOLD}{CYAN}     MindGuard Comprehensive System & Feature Test     {RESET}")
    print(f"{BOLD}{CYAN}======================================================={RESET}\n")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        
        # -------------------------------------------------------------
        # 1. Institutional Whitelist & Roster Verification
        # -------------------------------------------------------------
        print(f"\n{BOLD}1. Testing Institutional Whitelist & Roster Endpoint{RESET}")
        
        # Student in Excel
        res = await client.get("/api/v1/auth/roster-info?email=makkena.lahari06@nmims.in")
        record_test(
            "Roster Check: Student in Excel (makkena.lahari06@nmims.in)",
            res.status_code == 200 and res.json().get("is_authorized") is True and res.json().get("assigned_role") == "STUDENT",
            f"Status: {res.status_code}, Response: {res.json()}"
        )

        # Counselor in Excel
        res = await client.get("/api/v1/auth/roster-info?email=Naresh.Vurukonda@nmims.edu")
        record_test(
            "Roster Check: Counselor in Excel (Naresh.Vurukonda@nmims.edu)",
            res.status_code == 200 and res.json().get("is_authorized") is True and res.json().get("assigned_role") == "COUNSELOR",
            f"Status: {res.status_code}, Role: {res.json().get('assigned_role')}"
        )

        # Admin in Excel
        res = await client.get("/api/v1/auth/roster-info?email=Raja.GovindaAcharyK@nmims.edu")
        record_test(
            "Roster Check: Admin in Excel (Raja.GovindaAcharyK@nmims.edu)",
            res.status_code == 200 and res.json().get("is_authorized") is True and res.json().get("assigned_role") == "ADMIN",
            f"Status: {res.status_code}, Role: {res.json().get('assigned_role')}"
        )

        # Unauthorized external email
        res = await client.get("/api/v1/auth/roster-info?email=random.user@external.com")
        record_test(
            "Roster Check: Unauthorized External Email",
            res.status_code == 200 and res.json().get("is_authorized") is False,
            f"Authorized: {res.json().get('is_authorized')}"
        )

        # Domain fallback check: @nmims.edu.in
        res = await client.get("/api/v1/auth/roster-info?email=student2026@nmims.edu.in")
        record_test(
            "Domain Auth: @nmims.edu.in Student",
            res.status_code == 200 and res.json().get("is_authorized") is True and res.json().get("assigned_role") == "STUDENT",
            f"Authorized: {res.json().get('is_authorized')}, Role: {res.json().get('assigned_role')}"
        )

        # Domain fallback check: @nmims.edu Counselor
        res = await client.get("/api/v1/auth/roster-info?email=counselor2026@nmims.edu&role=COUNSELOR")
        record_test(
            "Domain Auth: @nmims.edu Counselor",
            res.status_code == 200 and res.json().get("is_authorized") is True and res.json().get("assigned_role") == "COUNSELOR",
            f"Authorized: {res.json().get('is_authorized')}, Role: {res.json().get('assigned_role')}"
        )

        # Registration Block: External non-NMIMS email (@gmail.com)
        res_blocked = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "intruder@gmail.com",
                "password": "Password123!",
                "full_name": "Intruder User",
                "role": "STUDENT"
            }
        )
        record_test(
            "Registration Block: Non-NMIMS Domain (intruder@gmail.com)",
            res_blocked.status_code in (403, 422),
            f"Status: {res_blocked.status_code}"
        )

        # -------------------------------------------------------------
        # 2. Authentication & JWT Tokens (Student, Counselor, Admin)
        # -------------------------------------------------------------
        print(f"\n{BOLD}2. Testing Authentication & Session Handshake{RESET}")
        
        # Ensure test accounts exist with test passwords
        from app.db.session import AsyncSessionLocal
        from app.models.users import User, UserRole
        from app.core.security import get_password_hash
        from sqlalchemy import select
        import uuid

        async with AsyncSessionLocal() as session:
            test_users = [
                ("student@nmims.in", UserRole.STUDENT),
                ("counselor@nmims.edu", UserRole.COUNSELOR),
                ("admin@nmims.edu", UserRole.ADMIN),
            ]
            for email, role in test_users:
                res = await session.execute(select(User).where(User.email == email))
                u = res.scalars().first()
                if not u:
                    u = User(
                        id=uuid.uuid4(),
                        email=email,
                        role=role,
                        password_hash=get_password_hash("password123"),
                        is_active=True
                    )
                    session.add(u)
                else:
                    u.password_hash = get_password_hash("password123")
                    u.is_active = True
            await session.commit()

        # Student Login
        res_student_login = await client.post(
            "/api/v1/auth/login",
            json={"email": "student@nmims.in", "password": "password123"}
        )
        student_token = res_student_login.json().get("access_token") if res_student_login.status_code == 200 else None
        record_test(
            "Student Login (student@nmims.in)",
            res_student_login.status_code == 200 and bool(student_token),
            f"Token generated: {bool(student_token)}"
        )

        # Counselor Login
        res_counselor_login = await client.post(
            "/api/v1/auth/login",
            json={"email": "counselor@nmims.edu", "password": "password123"}
        )
        counselor_token = res_counselor_login.json().get("access_token") if res_counselor_login.status_code == 200 else None
        record_test(
            "Counselor Login (counselor@nmims.edu)",
            res_counselor_login.status_code == 200 and bool(counselor_token),
            f"Token generated: {bool(counselor_token)}"
        )

        # Admin Login
        res_admin_login = await client.post(
            "/api/v1/auth/login",
            json={"email": "admin@nmims.edu", "password": "password123"}
        )
        admin_token = res_admin_login.json().get("access_token") if res_admin_login.status_code == 200 else None
        record_test(
            "Admin Login (admin@nmims.edu)",
            res_admin_login.status_code == 200 and bool(admin_token),
            f"Token generated: {bool(admin_token)}"
        )

        # Invalid Credentials
        res_invalid = await client.post(
            "/api/v1/auth/login",
            json={"email": "student@nmims.in", "password": "incorrect_password"}
        )
        record_test(
            "Authentication Rejection for Invalid Password",
            res_invalid.status_code == 401,
            f"Status: {res_invalid.status_code}"
        )

        student_headers = {"Authorization": f"Bearer {student_token}"}
        counselor_headers = {"Authorization": f"Bearer {counselor_token}"}
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # -------------------------------------------------------------
        # 3. Student Workflow (Profile, Journal, NLP, Surveys, Trends)
        # -------------------------------------------------------------
        print(f"\n{BOLD}3. Testing Student Core Workflow & NLP Processing{RESET}")
        
        # Student Profile
        res_profile = await client.get("/api/v1/students/me", headers=student_headers)
        record_test(
            "Get Student Profile (/api/v1/students/me)",
            res_profile.status_code == 200 and res_profile.json().get("email") == "student@nmims.in",
            f"Email: {res_profile.json().get('email')}"
        )

        # Submit Journal Entry (Triggering Emotion Inference)
        journal_payload = {
            "content": "I am feeling extremely overwhelmed with my upcoming midterms and struggling to focus or sleep.",
            "self_reported_score": 3
        }
        res_journal = await client.post("/api/v1/journal/entries", json=journal_payload, headers=student_headers)
        record_test(
            "Submit Journal Entry with NLP Evaluation (/api/v1/journal/entries)",
            res_journal.status_code == 201 and res_journal.json().get("status") == "completed",
            f"Status: {res_journal.json().get('status')}, Log ID: {res_journal.json().get('mood_log_id')}"
        )

        # Mood History
        res_history = await client.get("/api/v1/mood/history?timeframe=30d", headers=student_headers)
        history_list = res_history.json().get("history", [])
        record_test(
            "Retrieve 30-Day Mood Timeline History (/api/v1/mood/history)",
            res_history.status_code == 200 and len(history_list) > 0,
            f"Total history entries returned: {len(history_list)}"
        )

        # PHQ-9 Clinical Survey
        phq9_payload = {"responses": [2, 2, 3, 2, 2, 3, 2, 1, 1]} # Score 18 -> Moderately Severe Depression
        res_phq9 = await client.post("/api/v1/surveys/phq-9", json=phq9_payload, headers=student_headers)
        record_test(
            "Submit PHQ-9 Survey (/api/v1/surveys/phq-9)",
            res_phq9.status_code == 201 and res_phq9.json().get("total_score") == 18,
            f"Score: {res_phq9.json().get('total_score')}, Severity: {res_phq9.json().get('severity')}"
        )

        # GAD-7 Clinical Survey
        gad7_payload = {"responses": [1, 2, 1, 1, 0, 1, 1]} # Score 7 -> Mild Anxiety
        res_gad7 = await client.post("/api/v1/surveys/gad-7", json=gad7_payload, headers=student_headers)
        record_test(
            "Submit GAD-7 Survey (/api/v1/surveys/gad-7)",
            res_gad7.status_code == 201 and res_gad7.json().get("total_score") == 7,
            f"Score: {res_gad7.json().get('total_score')}, Severity: {res_gad7.json().get('severity')}"
        )

        # Latest Assessment & Predictions
        res_pred = await client.get("/api/v1/predictions/assessment/latest", headers=student_headers)
        record_test(
            "Get Latest Wellness Assessment & Emotion Vectors (/api/v1/predictions/assessment/latest)",
            res_pred.status_code == 200 and "mental_wellness_score" in res_pred.json(),
            f"Wellness Score: {res_pred.json().get('mental_wellness_score')}, Risk: {res_pred.json().get('risk_level')}"
        )

        # Current Recommendations
        res_rec = await client.get("/api/v1/recommendations/current", headers=student_headers)
        activities = res_rec.json().get("activities", [])
        record_test(
            "Get Dynamic Wellness Recommendations (/api/v1/recommendations/current)",
            res_rec.status_code == 200 and len(activities) > 0,
            f"Activities: {len(activities)} suggestions"
        )

        # -------------------------------------------------------------
        # 4. Counselor Workflow (Triage Queue, Alerts, Resolution)
        # -------------------------------------------------------------
        print(f"\n{BOLD}4. Testing Clinical Counselor Triage Workflow{RESET}")
        
        # Get Active Alerts
        res_alerts = await client.get("/api/v1/counselors/alerts", headers=counselor_headers)
        alerts_list = res_alerts.json().get("alerts", [])
        record_test(
            "Retrieve Active Crisis Alerts Queue (/api/v1/counselors/alerts)",
            res_alerts.status_code == 200 and "total" in res_alerts.json(),
            f"Total alerts in queue: {res_alerts.json().get('total')}"
        )

        # Update Alert Status if an alert exists
        if alerts_list:
            target_alert_id = alerts_list[0]["id"]
            res_alert_update = await client.put(
                f"/api/v1/counselors/alerts/{target_alert_id}",
                json={"status": "RESOLVED"},
                headers=counselor_headers
            )
            record_test(
                f"Resolve High-Risk Alert Status (/api/v1/counselors/alerts/{target_alert_id})",
                res_alert_update.status_code == 200 and res_alert_update.json().get("status") == "RESOLVED",
                f"Updated status: {res_alert_update.json().get('status')}"
            )

        # Counselor accessing student assessment by ID
        student_id = res_profile.json().get("id")
        res_counselor_pred = await client.get(
            f"/api/v1/predictions/assessment/latest?student_id={student_id}",
            headers=counselor_headers
        )
        record_test(
            "Counselor Accessing Student Assessment Detail by ID",
            res_counselor_pred.status_code == 200,
            f"Assessment ID: {res_counselor_pred.json().get('assessment_id')}"
        )

        # -------------------------------------------------------------
        # 5. Institutional Admin Workflow & Analytics
        # -------------------------------------------------------------
        print(f"\n{BOLD}5. Testing Institution Admin Directory & Analytics{RESET}")
        
        # User Directory
        res_users = await client.get("/api/v1/admin/users?page=1", headers=admin_headers)
        users_count = len(res_users.json().get("users", []))
        record_test(
            "Get Institutional User Directory (/api/v1/admin/users)",
            res_users.status_code == 200 and users_count > 0,
            f"Users retrieved: {users_count}, Total Pages: {res_users.json().get('total_pages')}"
        )

        # Campus Anonymized Stress Report
        res_report = await client.get("/api/v1/analytics/institution/reports", headers=admin_headers)
        record_test(
            "Get Campus-Wide Macro Wellness Report (/api/v1/analytics/institution/reports)",
            res_report.status_code == 200 and "average_wellness_score" in res_report.json(),
            f"Avg Wellness: {res_report.json().get('average_wellness_score')}, Dominant: {res_report.json().get('dominant_campus_emotion')}"
        )

        # -------------------------------------------------------------
        # 6. Security & Role-Based Access Control (RBAC) Enforcement
        # -------------------------------------------------------------
        print(f"\n{BOLD}6. Testing Security & RBAC Boundary Enforcement{RESET}")
        
        # Student trying to access Counselor alerts (Should be 403)
        res_sec_1 = await client.get("/api/v1/counselors/alerts", headers=student_headers)
        record_test(
            "RBAC Block: Student accessing Counselor Triage Queue (Expected: 403)",
            res_sec_1.status_code == 403,
            f"Status: {res_sec_1.status_code}"
        )

        # Counselor trying to access Admin analytics (Should be 403)
        res_sec_2 = await client.get("/api/v1/analytics/institution/reports", headers=counselor_headers)
        record_test(
            "RBAC Block: Counselor accessing Admin Reports (Expected: 403)",
            res_sec_2.status_code == 403,
            f"Status: {res_sec_2.status_code}"
        )

        # Unauthenticated request to protected endpoint (Should be 401)
        res_sec_3 = await client.get("/api/v1/students/me")
        record_test(
            "Auth Block: Unauthenticated Request to Protected Route (Expected: 401)",
            res_sec_3.status_code == 401,
            f"Status: {res_sec_3.status_code}"
        )

    # -------------------------------------------------------------
    # Test Summary
    # -------------------------------------------------------------
    total = len(test_results)
    passed = sum(1 for t in test_results if t["passed"])
    failed = total - passed
    
    print(f"\n{BOLD}{CYAN}======================================================={RESET}")
    print(f"{BOLD}Test Execution Summary: {GREEN}{passed} Passed{RESET}, {RED if failed else GREEN}{failed} Failed{RESET} / Total {total} Tests")
    print(f"{BOLD}{CYAN}======================================================={RESET}\n")
    
    if failed == 0:
        print(f"\n{BOLD}{GREEN}*** ALL {total} CORE SYSTEM CAPABILITIES PASSED 100% SUCCESSFULLY! ***{RESET}\n")
    else:
        print(f"\n{BOLD}{RED}*** WARNING: Some tests failed. Please review the output above. ***{RESET}\n")

if __name__ == "__main__":
    asyncio.run(run_all_tests())
