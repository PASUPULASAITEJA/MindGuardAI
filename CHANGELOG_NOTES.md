# Counselor Clinical Notes & Case Observations

## Overview
MindGuard AI provides counselors with **Clinical Case Notes** functionality to document outreach, observation logs, follow-up recommendations, and intervention outcomes directly against alerts and student files.

---

## 1. Database Schema (`counselor_notes`)
Created table `counselor_notes` in [`backend/app/models/counselor_notes.py`](file:///d:/mindguard/backend/app/models/counselor_notes.py):
- `id` (UUID, Primary Key, default UUIDv4)
- `alert_id` (UUID, Foreign Key referencing `alerts.id` with `SET NULL` on delete, nullable)
- `student_id` (UUID, Foreign Key referencing `users.id` with `CASCADE` delete, indexed)
- `counselor_id` (UUID, Foreign Key referencing `users.id` with `RESTRICT` delete, indexed)
- `note` (TEXT, non-null, maximum length 5000 characters)
- `created_at` (TIMESTAMP WITH TIMEZONE, default: `now()`, indexed)
- Indexes: `idx_counselor_notes_student` on `(student_id, created_at)`

---

## 2. API Endpoints
All endpoints are secured under `/api/v1/counselors`:
- **`POST /api/v1/counselors/alerts/{alert_id}/notes`**:
  Allows authenticated counselors to append a timestamped clinical observation to an alert incident.
- **`GET /api/v1/counselors/alerts/{alert_id}/notes`**:
  Returns all notes associated with an alert, ordered descending by timestamp.
- **`POST /api/v1/counselors/students/{student_id}/notes`**:
  Allows counselors to append a direct case note to a student's file. Enforces active student consent.
- **`GET /api/v1/counselors/students/{student_id}/notes`**:
  Returns all historical notes recorded across all alerts and sessions for the specified student. Enforces `verify_student_consent(db, student_id)`.

---

## 3. Casefile Timeline Integration
In [`backend/app/services/casefile_service.py`](file:///d:/mindguard/backend/app/services/casefile_service.py):
- Automatically queries `counselor_notes` for the student.
- Converts each note into a unified event with `event_type: "COUNSELOR_NOTE"`.
- Displays counselor author name, note preview, and full text in the longitudinal timeline.

---

## 4. Frontend User Experience
- In [`frontend/src/pages/counselor/StudentCaseFile.tsx`](file:///d:/mindguard/frontend/src/pages/counselor/StudentCaseFile.tsx):
  - **"Add Clinical Note" Modal**: Accessible directly from the casefile header. Counselors can record observations with one click.
  - **Timeline Entry**: Displays notes with a violet `FileEdit` icon and author attribution (`Dr. ...`).
  - **Event Filters**: Dedicated `"Counselor Notes"` filter pill to isolate staff interventions from raw telemetry.

---

## 5. Automated Verification & Testing
Automated test suite implemented in [`backend/tests/test_counselor_notes.py`](file:///d:/mindguard/backend/tests/test_counselor_notes.py):
- Verifies note creation on alerts.
- Verifies note listing by alert and by student.
- Verifies student role is blocked (HTTP 403 Forbidden) from posting counselor notes.
- Verifies counselor access is blocked (HTTP 403 Forbidden) when student revokes clinical consent.
- **Test Result**: `PASSED [100%]`
