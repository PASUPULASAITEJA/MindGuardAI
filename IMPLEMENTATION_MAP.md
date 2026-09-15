# MindGuard AI — Comprehensive Implementation Map

> **Generated**: September 15, 2026  
> **Source**: Ground-truth codebase inspection across `backend/` and `frontend/`.  
> **Rule**: Every claim is verified against active code and backed by exact relative file paths.

---

## 1. Full Backend Route Table

All 40 routes mounted in the FastAPI application via [`backend/app/main.py`](backend/app/main.py#L160-L173).

| Method | Path | Tags | Required Role(s) | Summary & File Path |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | `Authentication` | `PUBLIC` | Registers a new user with academic whitelist validation. [`backend/app/api/v1/auth.py`](backend/app/api/v1/auth.py) |
| `POST` | `/api/v1/auth/login` | `Authentication` | `PUBLIC` | OAuth2 username/password login; sets secure HTTP-only refresh cookie and returns JWT access token. [`backend/app/api/v1/auth.py`](backend/app/api/v1/auth.py) |
| `POST` | `/api/v1/auth/refresh` | `Authentication` | `PUBLIC` | Rotates refresh token from cookies and issues new access token. [`backend/app/api/v1/auth.py`](backend/app/api/v1/auth.py) |
| `POST` | `/api/v1/auth/forgot-password` | `Authentication` | `PUBLIC` | Generates self-contained password reset token. [`backend/app/api/v1/auth.py`](backend/app/api/v1/auth.py) |
| `POST` | `/api/v1/auth/reset-password` | `Authentication` | `PUBLIC` | Resets password with valid reset token. [`backend/app/api/v1/auth.py`](backend/app/api/v1/auth.py) |
| `GET` | `/api/v1/auth/roster-info` | `Authentication` | `PUBLIC` | Checks institutional whitelist status and pre-assigned role for registration. [`backend/app/api/v1/auth.py`](backend/app/api/v1/auth.py) |
| `GET` | `/api/v1/students/me` | `Students` | `STUDENT` | Retrieves authenticated student profile, emergency contacts, and consent status. [`backend/app/api/v1/users.py`](backend/app/api/v1/users.py) |
| `PUT` | `/api/v1/students/me` | `Students` | `STUDENT` | Updates student profile, emergency contacts, and `consent_counselor_sharing`. [`backend/app/api/v1/users.py`](backend/app/api/v1/users.py) |
| `GET` | `/api/v1/admin/users` | `Institution Administration` | `ADMIN` | Paginated listing and search of all registered campus users. [`backend/app/api/v1/users.py`](backend/app/api/v1/users.py) |
| `GET` | `/api/v1/mood/history` | `Mood Tracking` | `STUDENT`, `COUNSELOR` | Returns historical mood logging entries, self-reported scores, and emotion vectors. [`backend/app/api/v1/mood.py`](backend/app/api/v1/mood.py) |
| `POST` | `/api/v1/journal/entries` | `Journal Entries` | `STUDENT` | Ingests journal text; runs emotion NLP inference, calculates mental wellness score, creates assessment and auto-triggers counselor alerts. [`backend/app/api/v1/mood.py`](backend/app/api/v1/mood.py) |
| `POST` | `/api/v1/surveys/phq-9` | `Clinical Surveys` | `STUDENT` | Submits 9-item PHQ-9 survey, calculates severity, triggers counselor warning alert on moderate/severe scores. [`backend/app/api/v1/surveys.py`](backend/app/api/v1/surveys.py) |
| `POST` | `/api/v1/surveys/gad-7` | `Clinical Surveys` | `STUDENT` | Submits 7-item GAD-7 anxiety survey, calculates anxiety severity and risk classification. [`backend/app/api/v1/surveys.py`](backend/app/api/v1/surveys.py) |
| `GET` | `/api/v1/predictions/assessment/latest` | `Clinical Predictions` | `STUDENT`, `COUNSELOR` | Returns most recent mental wellness score (0–100), risk level (LOW, MEDIUM, HIGH), and emotion vector. [`backend/app/api/v1/predictions.py`](backend/app/api/v1/predictions.py) |
| `GET` | `/api/v1/recommendations/current` | `Wellness Recommendations` | `STUDENT` | Generates evidence-based self-care suggestions and coping protocols tailored to current risk tier. [`backend/app/api/v1/recommendations.py`](backend/app/api/v1/recommendations.py) |
| `GET` | `/api/v1/counselors/alerts` | `Counselor Warning Queues` | `COUNSELOR`, `ADMIN` | Queue of unacknowledged and reviewed high-risk student warnings. [`backend/app/api/v1/alerts.py`](backend/app/api/v1/alerts.py) |
| `PUT` | `/api/v1/counselors/alerts/{alert_id}` | `Counselor Warning Queues` | `COUNSELOR` | Allows counselors to claim (`REVIEWED`) or close out (`RESOLVED`) high-risk alerts. [`backend/app/api/v1/alerts.py`](backend/app/api/v1/alerts.py) |
| `POST` | `/api/v1/counselors/sos` | `Counselor Warning Queues` | `STUDENT`, `COUNSELOR`, `ADMIN` | Instant crisis distress escalation; notifies counselors, logs safety emergency, returns crisis helplines. [`backend/app/api/v1/alerts.py`](backend/app/api/v1/alerts.py) |
| `GET` | `/api/v1/alerts/alerts` | `Emergency Alerts & SOS` | `COUNSELOR`, `ADMIN` | Alias to counselor alerts queue. [`backend/app/api/v1/alerts.py`](backend/app/api/v1/alerts.py) |
| `PUT` | `/api/v1/alerts/alerts/{alert_id}` | `Emergency Alerts & SOS` | `COUNSELOR` | Alias to update alert status. [`backend/app/api/v1/alerts.py`](backend/app/api/v1/alerts.py) |
| `POST` | `/api/v1/alerts/sos` | `Emergency Alerts & SOS` | `STUDENT`, `COUNSELOR`, `ADMIN` | Primary SOS distress button endpoint. [`backend/app/api/v1/alerts.py`](backend/app/api/v1/alerts.py) |
| `GET` | `/api/v1/notifications` | `User Notifications` | `AUTHENTICATED (ANY)` | Retrieves notifications for the authenticated user. [`backend/app/api/v1/notifications.py`](backend/app/api/v1/notifications.py) |
| `PUT` | `/api/v1/notifications/{notification_id}/read` | `User Notifications` | `AUTHENTICATED (ANY)` | Marks a notification as read. [`backend/app/api/v1/notifications.py`](backend/app/api/v1/notifications.py) |
| `GET` | `/api/v1/analytics/institution/reports` | `Campus Analytics` | `STUDENT`, `ADMIN` | Anonymized campus stress indices, monthly average wellness scores, and risk distribution. [`backend/app/api/v1/analytics.py`](backend/app/api/v1/analytics.py) |
| `POST` | `/api/v1/chat/conversations` | `AI Wellness Chatbot` | `STUDENT` | Creates a new conversational thread. [`backend/app/api/v1/chatbot.py`](backend/app/api/v1/chatbot.py) |
| `GET` | `/api/v1/chat/conversations` | `AI Wellness Chatbot` | `STUDENT` | Lists conversations for the current student. [`backend/app/api/v1/chatbot.py`](backend/app/api/v1/chatbot.py) |
| `GET` | `/api/v1/chat/conversations/{conversation_id}` | `AI Wellness Chatbot` | `AUTHENTICATED (ANY)` | Retrieves conversation thread and full message history. [`backend/app/api/v1/chatbot.py`](backend/app/api/v1/chatbot.py) |
| `GET` | `/api/v1/chat/conversations/{conversation_id}/messages` | `AI Wellness Chatbot` | `AUTHENTICATED (ANY)` | Retrieves message list for a conversation. [`backend/app/api/v1/chatbot.py`](backend/app/api/v1/chatbot.py) |
| `POST` | `/api/v1/chat/conversations/{conversation_id}/messages` | `AI Wellness Chatbot` | `STUDENT` | Sends message to AI Wellness Chatbot, runs emotion inference, generates therapeutic response. [`backend/app/api/v1/chatbot.py`](backend/app/api/v1/chatbot.py) |
| `POST` | `/api/v1/chat/conversations/{conversation_id}/messages/stream` | `AI Wellness Chatbot` | `STUDENT` | Server-Sent Events (SSE) streaming endpoint for AI chatbot tokens. [`backend/app/api/v1/chatbot.py`](backend/app/api/v1/chatbot.py) |
| `POST` | `/api/v1/chat/behavioral-features` | `AI Wellness Chatbot` | `STUDENT` | Ingests client/PC screen time telemetry, computes baseline deviation and circadian risk. [`backend/app/api/v1/chatbot.py`](backend/app/api/v1/chatbot.py) |
| `GET` | `/api/v1/chat/behavioral-features/summary` | `AI Wellness Chatbot` | `STUDENT` | Retrieves active screen time, 7-day daily rolling history, and circadian metrics. [`backend/app/api/v1/chatbot.py`](backend/app/api/v1/chatbot.py) |
| `POST` | `/api/v1/chat/wearable-sleep-sync` | `AI Wellness Chatbot` | `STUDENT` | Ingests wearable sleep session data (Apple Health, Fitbit). [`backend/app/api/v1/chatbot.py`](backend/app/api/v1/chatbot.py) |
| `POST` | `/api/v1/appointments` | `Counselor Appointments` | `STUDENT` | Books 1-on-1 virtual or in-person counselor appointment. [`backend/app/api/v1/appointments.py`](backend/app/api/v1/appointments.py) |
| `GET` | `/api/v1/appointments/my` | `Counselor Appointments` | `STUDENT`, `COUNSELOR` | Returns appointments for the student or counselor. [`backend/app/api/v1/appointments.py`](backend/app/api/v1/appointments.py) |
| `PATCH` | `/api/v1/appointments/{appointment_id}/status` | `Counselor Appointments` | `COUNSELOR`, `ADMIN` | Updates appointment status (`CONFIRMED`, `COMPLETED`, `CANCELLED`) with notes. [`backend/app/api/v1/appointments.py`](backend/app/api/v1/appointments.py) |
| `GET` | `/docs` | `Documentation` | `PUBLIC` | Swagger UI documentation. |
| `GET` | `/redoc` | `Documentation` | `PUBLIC` | ReDoc API documentation. |
| `GET` | `/openapi.json` | `Documentation` | `PUBLIC` | OpenAPI 3.0 specification. |
| `GET` | `/docs/oauth2-redirect` | `Documentation` | `PUBLIC` | Swagger OAuth2 redirect handler. |

---

## 2. Backend Relational Database Schema & SQLAlchemy Models

All 10 models inherit from `Base` in [`backend/app/db/session.py`](backend/app/db/session.py) and are declared across [`backend/app/models/`](backend/app/models):

### 1. `users` — Class `User` ([`backend/app/models/users.py`](backend/app/models/users.py#L19))
* `id`: `CHAR(32)` / UUID [PK]
* `email`: `VARCHAR(255)` [UNIQUE, INDEX, NOT NULL]
* `password_hash`: `VARCHAR(255)` [NOT NULL]
* `role`: `Enum(UserRole)` (`STUDENT`, `COUNSELOR`, `ADMIN`) [NOT NULL]
* `is_active`: `BOOLEAN` [NOT NULL, DEFAULT True]
* `full_name`: `VARCHAR(255)` [NULL]
* `phone_number`: `VARCHAR(50)` [NULL]
* `emergency_contact_name`: `VARCHAR(255)` [NULL]
* `emergency_contact_phone`: `VARCHAR(50)` [NULL]
* `academic_department`: `VARCHAR(100)` [NULL]
* `consent_counselor_sharing`: `BOOLEAN` [NOT NULL, DEFAULT False]
* `created_at`: `DATETIME` [NOT NULL]

### 2. `mood_logs` — Class `MoodLog` ([`backend/app/models/mood.py`](backend/app/models/mood.py#L15))
* `id`: `CHAR(32)` / UUID [PK]
* `student_id`: `CHAR(32)` [NOT NULL, FK -> `users.id`]
* `input_type`: `Enum(InputType)` (`TEXT`, `VOICE`, `SURVEY`) [NOT NULL]
* `raw_content`: `TEXT` [NULL]
* `self_reported_score`: `INTEGER` (1–10) [NULL]
* `logged_at`: `DATETIME` [NOT NULL, INDEX]

### 3. `emotion_analyses` — Class `EmotionAnalysis` ([`backend/app/models/mood.py`](backend/app/models/mood.py#L32))
* `id`: `CHAR(32)` / UUID [PK]
* `mood_log_id`: `CHAR(32)` [NOT NULL, UNIQUE, FK -> `mood_logs.id`]
* `detected_emotions`: `JSON` [NOT NULL]
* `sentiment_score`: `FLOAT` (-1.0 to 1.0) [NOT NULL]
* `primary_emotion`: `VARCHAR(50)` [NOT NULL]
* `analyzed_at`: `DATETIME` [NOT NULL]

### 4. `assessments` — Class `Assessment` ([`backend/app/models/assessments.py`](backend/app/models/assessments.py#L18))
* `id`: `CHAR(32)` / UUID [PK]
* `student_id`: `CHAR(32)` [NOT NULL, FK -> `users.id`]
* `mental_wellness_score`: `FLOAT` (0.0 to 100.0) [NOT NULL]
* `risk_level`: `Enum(RiskLevel)` (`LOW`, `MEDIUM`, `HIGH`) [NOT NULL]
* `evaluated_at`: `DATETIME` [NOT NULL, INDEX]

### 5. `alerts` — Class `Alert` ([`backend/app/models/alerts.py`](backend/app/models/alerts.py#L22))
* `id`: `CHAR(32)` / UUID [PK]
* `assessment_id`: `CHAR(32)` [NOT NULL, FK -> `assessments.id`]
* `student_id`: `CHAR(32)` [NOT NULL, FK -> `users.id`]
* `counselor_id`: `CHAR(32)` [NULL, FK -> `users.id`]
* `status`: `Enum(AlertStatus)` (`PENDING`, `REVIEWED`, `RESOLVED`) [NOT NULL, INDEX]
* `created_at`: `DATETIME` [NOT NULL]
* `resolved_at`: `DATETIME` [NULL]

### 6. `behavioral_logs` — Class `BehavioralLog` ([`backend/app/models/behavioral.py`](backend/app/models/behavioral.py#L12))
* `id`: `CHAR(32)` / UUID [PK]
* `student_id`: `CHAR(32)` [NOT NULL, FK -> `users.id`]
* `date`: `VARCHAR(20)` [NOT NULL, INDEX]
* `total_screen_time_minutes`: `INTEGER` [NOT NULL, DEFAULT 0]
* `late_night_usage_minutes`: `INTEGER` [NOT NULL, DEFAULT 0]
* `academic_usage_minutes`: `INTEGER` [NOT NULL, DEFAULT 0]
* `social_usage_minutes`: `INTEGER` [NOT NULL, DEFAULT 0]
* `entertainment_usage_minutes`: `INTEGER` [NOT NULL, DEFAULT 0]
* `adult_usage_minutes`: `INTEGER` [NOT NULL, DEFAULT 0]
* `continuous_screen_minutes`: `INTEGER` [NOT NULL, DEFAULT 0]
* `is_crisis_detected`: `INTEGER` [NOT NULL, DEFAULT 0]
* `active_window_categories`: `TEXT` [NULL]
* `baseline_deviation_score`: `FLOAT` [NOT NULL, DEFAULT 0.0]
* `risk_level`: `VARCHAR(20)` [NOT NULL, DEFAULT 'LOW']
* `synced_at`: `DATETIME` [NOT NULL]

### 7. `conversations` — Class `Conversation` ([`backend/app/models/chat.py`](backend/app/models/chat.py#L18))
* `id`: `CHAR(36)` / UUID [PK]
* `student_id`: `CHAR(36)` [NOT NULL, FK -> `users.id`]
* `title`: `VARCHAR(255)` [NOT NULL]
* `summary`: `TEXT` [NULL]
* `current_risk_level`: `VARCHAR(20)` [NOT NULL, DEFAULT 'GREEN']
* `created_at`: `DATETIME` [NOT NULL]
* `updated_at`: `DATETIME` [NOT NULL]

### 8. `chat_messages` — Class `ChatMessage` ([`backend/app/models/chat.py`](backend/app/models/chat.py#L38))
* `id`: `CHAR(36)` / UUID [PK]
* `conversation_id`: `CHAR(36)` [NOT NULL, FK -> `conversations.id`]
* `student_id`: `CHAR(36)` [NOT NULL, FK -> `users.id`]
* `sender`: `VARCHAR(9)` (`STUDENT`, `ASSISTANT`, `SYSTEM`) [NOT NULL]
* `message`: `TEXT` [NOT NULL]
* `intent`: `VARCHAR(100)` [NULL]
* `primary_emotion`: `VARCHAR(50)` [NULL]
* `emotion_scores`: `TEXT` [NULL]
* `sentiment_score`: `FLOAT` [NULL]
* `risk_level`: `VARCHAR(20)` [NOT NULL, DEFAULT 'GREEN']
* `is_crisis_flag`: `BOOLEAN` [NOT NULL, DEFAULT False]
* `created_at`: `DATETIME` [NOT NULL]

### 9. `safety_events` — Class `SafetyEvent` ([`backend/app/models/chat.py`](backend/app/models/chat.py#L70))
* `id`: `CHAR(36)` / UUID [PK]
* `student_id`: `CHAR(36)` [NOT NULL, FK -> `users.id`]
* `conversation_id`: `CHAR(36)` [NULL, FK -> `conversations.id`]
* `message_id`: `CHAR(36)` [NULL]
* `severity`: `VARCHAR(20)` (`HIGH`, `CRITICAL`) [NOT NULL]
* `trigger_type`: `VARCHAR(100)` [NOT NULL]
* `status`: `VARCHAR(50)` [NOT NULL]
* `details`: `TEXT` [NULL]
* `created_at`: `DATETIME` [NOT NULL]

### 10. `appointments` — Class `Appointment` ([`backend/app/models/appointments.py`](backend/app/models/appointments.py#L22))
* `id`: `CHAR(32)` / UUID [PK]
* `student_id`: `CHAR(32)` [NOT NULL, FK -> `users.id`]
* `counselor_id`: `CHAR(32)` [NULL, FK -> `users.id`]
* `appointment_type`: `VARCHAR(9)` (`VIRTUAL`, `IN_PERSON`) [NOT NULL]
* `scheduled_time`: `DATETIME` [NOT NULL, INDEX]
* `status`: `VARCHAR(9)` (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`) [NOT NULL]
* `reason`: `VARCHAR(255)` [NULL]
* `notes`: `TEXT` [NULL]
* `created_at`: `DATETIME` [NOT NULL]
* `updated_at`: `DATETIME` [NOT NULL]

---

## 3. Frontend Routes & API Consumption Map

All routes configured in [`frontend/src/App.tsx`](frontend/src/App.tsx) and their consumed backend APIs:

| Route Path | Page Component | Protected Role | Consumed API Endpoints & Hooks |
| :--- | :--- | :--- | :--- |
| `/` | [`LandingPage.tsx`](frontend/src/pages/public/LandingPage.tsx) | `PUBLIC` | Static presentation, navigation to `/login` and `/register`. |
| `/login` | [`Login.tsx`](frontend/src/pages/auth/Login.tsx) | `PUBLIC` | `POST /api/v1/auth/login` via [`AuthContext.tsx`](frontend/src/contexts/AuthContext.tsx#L105) |
| `/register` | [`Register.tsx`](frontend/src/pages/auth/Register.tsx) | `PUBLIC` | `GET /api/v1/auth/roster-info`<br>`POST /api/v1/auth/register` |
| `/forgot-password` | [`ForgotPassword.tsx`](frontend/src/pages/auth/ForgotPassword.tsx) | `PUBLIC` | `POST /api/v1/auth/forgot-password`<br>`POST /api/v1/auth/reset-password` |
| `/student/dashboard` | [`StudentDashboard.tsx`](frontend/src/pages/student/StudentDashboard.tsx) | `STUDENT` | `GET /api/v1/predictions/assessment/latest`<br>`GET /api/v1/recommendations/current`<br>`GET /api/v1/mood/history?days=7`<br>`GET /api/v1/chat/behavioral-features/summary`<br>`POST /api/v1/alerts/sos`<br>`POST /api/v1/appointments` |
| `/student/chat` | [`StudentChatbot.tsx`](frontend/src/pages/student/StudentChatbot.tsx) | `STUDENT` | `GET /api/v1/chat/conversations`<br>`POST /api/v1/chat/conversations`<br>`GET /api/v1/chat/conversations/{id}`<br>`POST /api/v1/chat/conversations/{id}/messages`<br>`POST /api/v1/chat/conversations/{id}/messages/stream` (SSE)<br>`POST /api/v1/alerts/sos` |
| `/student/check-in` | [`DailyCheckInPage.tsx`](frontend/src/pages/student/DailyCheckInPage.tsx) | `STUDENT` | `POST /api/v1/journal/entries`<br>`POST /api/v1/surveys/phq-9`<br>`POST /api/v1/surveys/gad-7` |
| `/student/history` | [`MoodHistoryPage.tsx`](frontend/src/pages/student/MoodHistoryPage.tsx) | `STUDENT` | `GET /api/v1/mood/history?days=7`<br>`GET /api/v1/mood/history?days=30` |
| `/student/resources` | [`SelfCareResourcesPage.tsx`](frontend/src/pages/student/SelfCareResourcesPage.tsx) | `STUDENT` | `GET /api/v1/recommendations/current` |
| `/counselor/dashboard` | [`CounselorDashboard.tsx`](frontend/src/pages/counselor/CounselorDashboard.tsx) | `COUNSELOR` | `GET /api/v1/counselors/alerts`<br>`PUT /api/v1/counselors/alerts/{id}`<br>`GET /api/v1/appointments/my`<br>`PATCH /api/v1/appointments/{id}/status` |
| `/counselor/alerts` | [`CounselorDashboard.tsx`](frontend/src/pages/counselor/CounselorDashboard.tsx) | `COUNSELOR` | Same as `/counselor/dashboard` (filtered to alerts view) |
| `/counselor/students` | [`CounselorDashboard.tsx`](frontend/src/pages/counselor/CounselorDashboard.tsx) | `COUNSELOR` | Renders case files overview within CounselorDashboard |
| `/admin/dashboard` | [`AdminDashboard.tsx`](frontend/src/pages/admin/AdminDashboard.tsx) | `ADMIN` | `GET /api/v1/analytics/institution/reports` |
| `/admin/reports` | [`AdminDashboard.tsx`](frontend/src/pages/admin/AdminDashboard.tsx) | `ADMIN` | `GET /api/v1/analytics/institution/reports` |
| `/admin/directory` | [`AdminDashboard.tsx`](frontend/src/pages/admin/AdminDashboard.tsx) | `ADMIN` | `GET /api/v1/admin/users` |
| `/settings` | [`Settings.tsx`](frontend/src/pages/settings/Settings.tsx) | `STUDENT`, `COUNSELOR`, `ADMIN` | `GET /api/v1/students/me`<br>`PUT /api/v1/students/me` |

---

## 4. Implementation Gap Analysis Report

### A. Fully Implemented Features (Verified by Code)
1. **Authentication & Session Lifecycle**:
   * JWT access token in-memory + HTTP-only refresh cookies with automated renewal on 401: [`frontend/src/services/api.ts`](frontend/src/services/api.ts#L72-L130).
   * Institutional email whitelist verification: [`backend/app/api/v1/auth.py`](backend/app/api/v1/auth.py#L36-L54).
2. **Clinical Surveys & Mood Journaling**:
   * Standard PHQ-9 and GAD-7 scoring with severity thresholds: [`backend/app/api/v1/surveys.py`](backend/app/api/v1/surveys.py).
   * Journal text processing with zero-shot NLP sentiment and emotion classification: [`backend/app/services/mood_service.py`](backend/app/services/mood_service.py).
3. **Emergency Crisis Escalation (SOS)**:
   * End-to-end 24/7 SOS alert dispatching to counselors with immediate national helplines: [`backend/app/api/v1/alerts.py`](backend/app/api/v1/alerts.py#L125-L160) and [`frontend/src/components/EmergencySOSModal.tsx`](frontend/src/components/EmergencySOSModal.tsx).
4. **AI Wellness Companion & SSE Streaming**:
   * Conversational state tracking, multi-turn therapy prompts, risk analysis, and SSE response streaming: [`backend/app/api/v1/chatbot.py`](backend/app/api/v1/chatbot.py#L198-L245).
5. **Counselor Appointment Booking**:
   * Booking, status workflow (`PENDING` -> `CONFIRMED` / `COMPLETED` / `CANCELLED`): [`backend/app/api/v1/appointments.py`](backend/app/api/v1/appointments.py).
6. **Passive Behavioral Phenotyping & Screen Time Sync**:
   * Active window tracking, idle thresholding (>180s), 7-day rolling history, circadian disruption modeling, and 3-mode interactive Recharts visualization: [`backend/app/services/behavioral_service.py`](backend/app/services/behavioral_service.py) and [`frontend/src/pages/student/StudentDashboard.tsx`](frontend/src/pages/student/StudentDashboard.tsx).

---

### B. Partially Implemented Features
1. **Consent Management**:
   * **Current Code**: Only a boolean column `consent_counselor_sharing` on table `users` ([`backend/app/models/users.py:29`](backend/app/models/users.py#L29)) updated via `PUT /api/v1/students/me`.
   * **Limitation**: No dedicated `consents` table, no audit timestamps (`granted_at`, `revoked_at`), no specific `require_consent` dependency guarding counselor endpoints (`/mood/history`, `/predictions/assessment/latest`).
   * **Resolution**: Targeted for complete implementation in **Prompt 2**.
2. **Counselor Student Dossier**:
   * **Current Code**: Route `/counselor/students` currently points to [`CounselorDashboard.tsx`](frontend/src/pages/counselor/CounselorDashboard.tsx#L140), which displays alerts and appointments but lacks a dedicated unified timeline case file page (`/counselor/students/:studentId/casefile`).
   * **Resolution**: Targeted for complete implementation in **Prompt 3**.

---

### C. Missing Pieces (To Be Built in Prompts 2–6)
1. **Dedicated Consent Router & Dependency** (Prompt 2):
   * Backend: Table `consents`, router `/api/v1/consent` (`/me`, `/me/grant`, `/me/revoke`), `require_consent` dependency.
   * Frontend: Consent management toggle in Settings with explanation modal.
2. **Counselor Case File Service & Route** (Prompt 3):
   * Backend: Service `casefile_service.py` and endpoint `GET /api/v1/counselors/students/{student_id}/casefile`.
   * Frontend: Dedicated route `/counselor/students/:studentId/casefile` with unified multi-event clinical timeline.
3. **Counselor Notes on Alerts** (Prompt 4):
   * Backend: Table `counselor_notes`, endpoints `POST/GET /api/v1/counselors/alerts/{alert_id}/notes`.
   * Frontend: Note composer in alert modal and timeline.
4. **Security Audit Logging & Admin Viewer** (Prompt 5):
   * Backend: Table `audit_logs`, service `audit_service.py`, endpoint `GET /api/v1/admin/audit-logs`.
   * Frontend: Admin Audit Logs page.
5. **High-Risk Email Notification Delivery** (Prompt 6):
   * Backend: Table `notification_deliveries`, SMTP delivery on HIGH alerts.
   * Frontend: Delivery logs viewer in Admin portal.
