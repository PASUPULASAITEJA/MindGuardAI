# Counselor Student Case File & Longitudinal Timeline

## Overview
The **Student Case File & Unified Longitudinal Timeline** provides clinical staff with a holistic, time-ordered view of a student's mental health trajectory across all MindGuard AI multi-modal touchpoints.

Rather than fragmenting student data across separate screens (assessments, mood journals, behavioral screen time, alerts, appointments), the Case File consolidates these streams into an interactive chronological dossier.

---

## 1. Backend Service & Architecture
Located in [`backend/app/services/casefile_service.py`](file:///d:/mindguard/backend/app/services/casefile_service.py).

### Aggregated Data Sources:
1. **Clinical Assessments**: Mental wellness scores (0–100), automated risk categories (`LOW`, `MEDIUM`, `HIGH`), and timestamps.
2. **Emotion & Sentiment Analyses**: Extracted GoEmotions vectors, polarity scores, and journal excerpts.
3. **Clinical Alerts**: Triage warnings, current workflow status (`PENDING`, `REVIEWED`, `RESOLVED`), and resolution records.
4. **Counselor Appointments**: Scheduled consultation sessions, appointment type (`VIRTUAL` / `IN_PERSON`), reason for booking, and counselor notes.
5. **Emergency Safety Events**: Crisis escalations (e.g. SOS distress button triggers, acute ideation alerts).
6. **Behavioral Telemetry Anomalies**: Windows battery & app usage patterns (active screen time spikes >10h, late-night usage >2h).

### Sorting & Timeframe Filtering:
All multi-modal events are unified and sorted descending by ISO-8601 timestamp (`timestamp`).
Query parameter `days` supports:
- `days=30`: Last 30 days of observations.
- `days=90`: Last 90 days (default clinical quarterly review).
- `days=all`: Full longitudinal institutional history.

---

## 2. API Specification
- **Method & Path**: `GET /api/v1/counselors/students/{student_id}/casefile?days=90`
- **RBAC**: Restricted to `COUNSELOR` and `ADMIN` roles.
- **Privacy Gate**: Enforces `verify_student_consent(db, student_id)`.
- **Response Format**:
```json
{
  "student": {
    "id": "515ecb0b-60fe-46b9-b836-d8159ddd88be",
    "full_name": "Sai Teja",
    "email": "pasupulasai.teja37@nmims.in",
    "academic_department": "Computer Science & Engineering",
    "current_risk_level": "LOW",
    "consent_status": "GRANTED"
  },
  "summary": {
    "total_assessments": 4,
    "latest_wellness_score": 82.0,
    "current_risk_level": "LOW",
    "active_alerts_count": 0,
    "total_appointments": 1,
    "timeline_events_count": 12
  },
  "timeline": [
    {
      "id": "...",
      "event_type": "ASSESSMENT",
      "timestamp": "2026-09-15T10:30:00Z",
      "title": "Clinical Assessment (LOW Risk)",
      "summary": "Mental wellness score evaluated at 82.0/100.",
      "severity": "LOW",
      "details": {
        "wellness_score": 82.0,
        "risk_level": "LOW"
      }
    }
  ],
  "timeframe_days": "90"
}
```

---

## 3. Privacy-by-Design Consent Enforcement
If the student has set their consent preference to `REVOKED`:
- The backend immediately returns `HTTP 403 Forbidden` with `"Consent revoked: Student has not granted access to their wellness data."`
- The frontend renders an institutional security lock screen explaining that the student has autonomously exercised their right to withhold wellness telemetry.

---

## 4. Frontend Implementation
- **Page Component**: [`frontend/src/pages/counselor/StudentCaseFile.tsx`](file:///d:/mindguard/frontend/src/pages/counselor/StudentCaseFile.tsx)
- **Route**: `/counselor/students/:studentId/casefile` in [`frontend/src/App.tsx`](file:///d:/mindguard/frontend/src/App.tsx)
- **Key UI Capabilities**:
  - Top breadcrumbs & fast navigation back to alert triage queues.
  - Student identity card with initials avatar, email, department, risk badge, and active consent indicator.
  - 4 KPI summary cards (Wellness Score gauge, Active Alerts count, Total Assessments, Counselor Sessions).
  - Timeframe selector buttons (30 Days, 90 Days, All Time).
  - Event type filter pills (`All`, `Assessments`, `Emotions & Journals`, `Alerts`, `Appointments`, `Safety / SOS`, `Behavioral Telemetry`).
  - Interactive spine timeline with color-coded nodes per signal category.
  - Collapsible clinical metadata drawer for deep inspection.

---

## 5. Automated Test Suite
- Automated test implemented in [`backend/tests/test_casefile.py`](file:///d:/mindguard/backend/tests/test_casefile.py).
- Validates:
  - Casefile generation for active students with sorted timeline.
  - Verification that timeline returns proper event types.
  - Immediate blocking with HTTP 403 Forbidden when student revokes consent.
- **Test Result**: `PASSED [100%]`
