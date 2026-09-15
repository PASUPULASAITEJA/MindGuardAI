# Institutional Security & Compliance Audit Log System

## Overview
MindGuard AI implements an **Append-Only Security Audit Trail** ensuring complete transparency and regulatory accountability (FERPA / HIPAA alignment) across the clinical platform.

Whenever student wellness records, casefiles, consent states, triage alerts, or emergency SOS signals are accessed or modified, an immutable audit record is committed to the database with cryptographic IDs, client metadata, and contextual payloads.

---

## 1. Database Schema (`audit_logs`)
Created in [`backend/app/models/audit_logs.py`](file:///d:/mindguard/backend/app/models/audit_logs.py):
- `id` (UUID, Primary Key, default UUIDv4)
- `actor_user_id` (UUID, Foreign Key referencing `users.id` with `SET NULL` on delete, indexed)
- `actor_role` (VARCHAR(50), `STUDENT` | `COUNSELOR` | `ADMIN` | `SYSTEM`)
- `action` (VARCHAR(100), normalized action code, indexed)
- `target_user_id` (UUID, Foreign Key referencing `users.id` with `SET NULL` on delete, indexed)
- `target_resource_type` (VARCHAR(100), e.g. `CASEFILE`, `ALERT`, `CONSENT`, `NOTE`, `SOS`)
- `target_resource_id` (VARCHAR(100), nullable entity identifier)
- `request_id` (VARCHAR(100), correlation ID)
- `ip_address` (VARCHAR(100), client IP)
- `user_agent` (VARCHAR(255), client browser / device fingerprint)
- `metadata_json` (JSON, contextual search params, status transitions, etc.)
- `created_at` (TIMESTAMP WITH TIMEZONE, default: `now()`, indexed)
- Composite Indexes: `idx_audit_logs_action_created` on `(action, created_at)` and `idx_audit_logs_target_created` on `(target_user_id, created_at)`.

---

## 2. Core Audited Action Codes

| Action Code | Trigger Event | Target Resource | Security Significance |
| :--- | :--- | :--- | :--- |
| `VIEW_STUDENT_CASEFILE` | Counselor opens student casefile or longitudinal timeline | `CASEFILE` | Tracks access to confidential student mental health history |
| `GRANT_CONSENT` | Student enables counselor data sharing | `CONSENT` | Proves affirmative consent grant for compliance |
| `REVOKE_CONSENT` | Student revokes counselor data sharing | `CONSENT` | Proves immediate revocation of clinical access privileges |
| `UPDATE_ALERT_STATUS` | Counselor claims (`REVIEWED`) or resolves (`RESOLVED`) high-risk alert | `ALERT` | Tracks workflow ownership and clinical response times |
| `CREATE_COUNSELOR_NOTE` | Counselor logs private case observation | `NOTE` | Documents staff intervention entries |
| `DISPATCH_EMERGENCY_SOS` | Student triggers 1-Click crisis distress button | `SOS` | Critical crisis escalation forensics |

---

## 3. Admin API Specification
- **Endpoint**: `GET /api/v1/admin/audit-logs`
- **RBAC**: Restricted strictly to `ADMIN` role (Counselor & Student access rejected with HTTP 403 Forbidden).
- **Query Parameters**:
  - `page`: Integer (default 1)
  - `page_size`: Integer (default 25, max 100)
  - `action`: String filter (e.g. `VIEW_STUDENT_CASEFILE`)
  - `actor_role`: String filter (`COUNSELOR`, `STUDENT`, `ADMIN`, `SYSTEM`)
- **Response Format**:
```json
{
  "logs": [
    {
      "id": "...",
      "actor_user_id": "87212c01-74b8-43e4-964d-1896d6dcb228",
      "actor_name": "Dr. Naresh Vurukonda",
      "actor_role": "COUNSELOR",
      "action": "VIEW_STUDENT_CASEFILE",
      "target_user_id": "515ecb0b-60fe-46b9-b836-d8159ddd88be",
      "target_user_name": "Sai Teja",
      "target_resource_type": "CASEFILE",
      "target_resource_id": "515ecb0b-60fe-46b9-b836-d8159ddd88be",
      "metadata_json": { "timeframe_days": "90" },
      "created_at": "2026-09-15T14:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 25
}
```

---

## 4. Frontend Admin Viewer
- **Page**: [`frontend/src/pages/admin/AdminAuditLogs.tsx`](file:///d:/mindguard/frontend/src/pages/admin/AdminAuditLogs.tsx)
- **Route**: `/admin/audit-logs`
- **Sidebar Integration**: Added "Audit Logs" directly under Admin navigation in [`frontend/src/components/layouts/Sidebar.tsx`](file:///d:/mindguard/frontend/src/components/layouts/Sidebar.tsx).
- **UI Highlights**:
  - Live metric cards (Total Audited Events, Active Filters, Compliance Status, Current Page).
  - Dynamic dropdown filters for action and actor role.
  - Color-coded badges for action types and user roles.
  - Interactive "View JSON" modal displaying granular event metadata.
  - Responsive pagination controls.

---

## 5. Automated Verification & Testing
Automated test suite implemented in [`backend/tests/test_audit_logs.py`](file:///d:/mindguard/backend/tests/test_audit_logs.py):
- Verifies event ingestion via `audit_service.log_event`.
- Verifies RBAC: non-admin roles (counselors, students) are blocked with `HTTP 403 Forbidden`.
- Verifies admin retrieval and filtering by action code.
- **Test Result**: `PASSED [100%]`
