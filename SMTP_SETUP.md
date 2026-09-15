# MindGuard AI — Automated Clinical Email Alerts & SMTP Setup Guide

## 1. Overview
MindGuard AI provides automated, high-priority email notifications to designated campus counseling staff whenever a student:
1. Receives an automated clinical assessment classified as **`HIGH RISK`** (NLP emotion analysis + behavioral telemetry fusion).
2. Triggers the **1-Click Emergency SOS** distress button.
3. Completes a clinical diagnostic screening (e.g., PHQ-9 or GAD-7) evaluating to acute severe depression or anxiety.

Every dispatched notification is permanently audited in the **`notification_deliveries`** database table with delivery status, correlation IDs, timestamps, and error diagnostics.

---

## 2. Database Schema (`notification_deliveries`)

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID` (PK) | Unique cryptographic v4 delivery identifier. |
| `event_type` | `VARCHAR(100)` | Event code (e.g. `HIGH_RISK_ALERT`, `EMERGENCY_SOS`). |
| `recipient_user_id` | `UUID` (FK) | References `users.id` of recipient counselor (nullable). |
| `recipient_email` | `VARCHAR(255)` | Target inbox destination. |
| `channel` | `VARCHAR(50)` | Delivery channel (defaults to `EMAIL`). |
| `status` | `VARCHAR(50)` | Delivery state (`SENT`, `FAILED`, `PENDING`). |
| `subject` | `VARCHAR(255)` | Email subject line. |
| `body_preview` | `TEXT` | Redacted preview of notification content. |
| `error_message` | `TEXT` | Diagnostic error string if transport failed. |
| `sent_at` | `TIMESTAMP` | Timestamp when accepted by SMTP transport. |
| `created_at` | `TIMESTAMP` | Timestamp when notification was generated. |

---

## 3. Environment Variables Configuration

Configure the following environment variables in `backend/.env` or production deployment secrets:

```env
# ==============================================================================
# SMTP EMERGENCY ALERT NOTIFICATION SETTINGS
# ==============================================================================
SMTP_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_TLS=true
SMTP_USER=campus.counseling@youruniversity.edu
SMTP_PASSWORD=your_16_character_app_password
SMTP_FROM_EMAIL=alerts@mindguard.ai
SMTP_FROM_NAME="MindGuard Clinical Emergency System"
```

> **Note on Simulated Mode:**
> When `SMTP_ENABLED=false` (default in development and test environments), email deliveries are simulated cleanly:
> deliveries are recorded in `notification_deliveries` with `status="SENT"` without making external socket connections, ensuring zero test flakiness.

---

## 4. Provider Setup Guides

### A. Gmail (Google Workspace)
1. Go to your Google Account > **Security**.
2. Ensure **2-Step Verification** is turned **ON**.
3. Navigate to **App passwords** (`https://myaccount.google.com/apppasswords`).
4. Generate a new app password named `MindGuard AI`.
5. Copy the 16-character string into `backend/.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_TLS=true
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=abcd efgh ijkl mnop
   ```

---

### B. SendGrid (Twilio)
1. Log in to SendGrid and navigate to **Settings** > **API Keys**.
2. Create an API Key with **Mail Send** permissions.
3. Configure `backend/.env`:
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_TLS=true
   SMTP_USER=apikey
   SMTP_PASSWORD=SG.your_actual_api_key_here
   SMTP_FROM_EMAIL=verified_sender@yourdomain.edu
   ```

---

### C. Local Development Testing (MailHog / smtp4dev)
For local offline testing with an interactive web UI:
```bash
# Run MailHog via Docker
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
```

Configure `backend/.env`:
```env
SMTP_ENABLED=true
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_TLS=false
SMTP_USER=
SMTP_PASSWORD=
```
Open `http://localhost:8025` in your browser to inspect delivered HTML emails in real time.

---

## 5. Administrative Inspection Endpoint

Authorized clinical administrators and counselors can audit all outbound alert deliveries:

### Request:
```http
GET /api/v1/admin/notifications/deliveries?page=1&page_size=25&event_type=HIGH_RISK_ALERT
Authorization: Bearer <ADMIN_OR_COUNSELOR_JWT>
```

### Sample Response:
```json
{
  "deliveries": [
    {
      "id": "e305e526-78a3-4ec3-a60d-773df440eec5",
      "event_type": "HIGH_RISK_ALERT",
      "recipient_user_id": "87212c01-74b8-43e4-964d-1896d6dcb228",
      "recipient_email": "counselor@nmims.edu",
      "channel": "EMAIL",
      "status": "SENT",
      "subject": "[URGENT CLINICAL ALERT (HIGH RISK)] MindGuard Intervention Required: Student Sai Teja",
      "body_preview": "================================================================================\nMINDGUARD AI CLINICAL EARLY WARNING NOTIFICATION\n================================================================================...",
      "error_message": null,
      "sent_at": "2026-09-15T17:27:31.189000Z",
      "created_at": "2026-09-15T17:27:31.189000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 25
}
```

---

## 6. Automated Verification

Run the dedicated automated test suite:
```bash
pytest backend/tests/test_email_notifications.py -v
```

All 5 core enterprise test suites:
```bash
pytest backend/tests -v
```
Output:
```
tests/test_audit_logs.py::test_audit_logs_workflow_and_rbac PASSED       [ 20%]
tests/test_casefile.py::test_casefile_retrieval_and_consent_lock PASSED  [ 40%]
tests/test_consent.py::test_consent_lifecycle_and_enforcement PASSED     [ 60%]
tests/test_counselor_notes.py::test_counselor_notes_lifecycle PASSED     [ 80%]
tests/test_email_notifications.py::test_email_notifications_workflow PASSED [100%]
======================= 5 passed in 11.06s =======================
```
