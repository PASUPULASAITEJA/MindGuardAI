# Consent Enforcement & Student Privacy System

## Overview
MindGuard AI implements **Privacy-by-Design Consent Enforcement** allowing students to govern clinical data sharing permissions. Designated university counselors can only access longitudinal mood history, sentiment vector assessments, and casefile timelines when explicit, active consent is granted by the student.

---

## 1. Database Schema (`consents`)
A dedicated table `consents` was created:
- `id` (UUID, Primary Key, default UUIDv4)
- `student_id` (UUID, Foreign Key referencing `users.id` with `CASCADE` delete, indexed)
- `consent_type` (VARCHAR(100), default: `"COUNSELOR_DATA_ACCESS"`)
- `status` (ENUM: `"GRANTED"` | `"REVOKED"`, default: `"GRANTED"`)
- `granted_at` (TIMESTAMP WITH TIMEZONE, nullable)
- `revoked_at` (TIMESTAMP WITH TIMEZONE, nullable)
- `created_at` (TIMESTAMP WITH TIMEZONE, default: `now()`)
- Composite Index: `idx_consent_student_type` on `(student_id, consent_type)`

---

## 2. Backend API Endpoints
All endpoints are mounted under `/api/v1/consent`:
- **`GET /api/v1/consent/me`**:
  Returns the authenticated student's active consent record. Automatically provisions default `GRANTED` state on first access.
- **`POST /api/v1/consent/me/grant`**:
  Transitions consent status to `GRANTED`, sets `granted_at = now()`, and clears `revoked_at`.
- **`POST /api/v1/consent/me/revoke`**:
  Transitions consent status to `REVOKED` and sets `revoked_at = now()`.
- **`GET /api/v1/consent/status/{student_id}`**:
  Allows clinical staff (Counselors and Admins) to verify active consent state prior to opening clinical casefiles.

---

## 3. RBAC & Access Enforcement
A centralized dependency `verify_student_consent(db, student_id)` was implemented in [`backend/app/api/dependencies.py`](file:///d:/mindguard/backend/app/api/dependencies.py).

### Protected Endpoints:
1. **`GET /api/v1/mood/history?student_id={id}`**:
   When a counselor queries a student's mood log history, consent status is verified. If revoked, raises:
   ```json
   HTTP 403 Forbidden: "Consent revoked: Student has not granted access to their wellness data."
   ```
2. **`GET /api/v1/predictions/assessment/latest?student_id={id}`**:
   Counselor requests for student clinical assessments and detected emotional vectors are blocked with HTTP 403 when consent is revoked.
3. **`GET /api/v1/counselors/students/{student_id}/casefile`**:
   Full casefile timeline access requires active student consent.

---

## 4. Frontend Settings & Privacy Controls
In [`frontend/src/pages/settings/Settings.tsx`](file:///d:/mindguard/frontend/src/pages/settings/Settings.tsx):
- **Clinical Consent Card**: Displays real-time consent badge (`ACCESS GRANTED` in emerald, `ACCESS REVOKED` in rose).
- **Interactive Toggle**: Instant toggle switch with live state updates and timestamp.
- **Confirmation Warning Modal**: When toggling off, warns:
  > *"Your counselor will not be able to view your trend reports or case timeline."*
- **Notifications**: Toast feedback upon successful permission change.

---

## 5. Automated Verification & Testing
Automated test suite implemented in [`backend/tests/test_consent.py`](file:///d:/mindguard/backend/tests/test_consent.py):
- Verifies default consent creation.
- Verifies student revocation flow.
- Verifies counselor access blocking (HTTP 403) with exact message match on mood and predictions.
- Verifies re-grant flow and immediate restoration of counselor access.
- **Test Result**: `PASSED [100%]`
