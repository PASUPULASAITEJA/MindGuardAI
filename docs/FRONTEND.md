# FRONTEND.md

## 1. Frontend Architecture & State Management

MindGuard’s frontend is a React Single Page Application (SPA) built with TypeScript. It prioritizes modularity, performance, and accessibility using `shadcn/ui` and Tailwind CSS.

### 1.1 State Management Strategy

* **Server State (React Query):** Handles all async data fetching, caching, synchronization, and optimistic updates. Configured with a default `staleTime` of 5 minutes for analytics and 0 minutes for alerts.
* **Client/Global State (React Context):** Kept minimal. Used strictly for `AuthContext` (JWT session, active role) and `ThemeContext` (Dark/Light mode).
* **Form State (React Hook Form + Zod):** Manages all form inputs, validation, and submission states without triggering unnecessary re-renders.

### 1.2 API Integration Layer

* **Axios Instance (`src/services/api.ts`):** Pre-configured with base URL (`/api/v1`).
* **Interceptors:** Automatically attach the JWT `Authorization: Bearer <token>` to requests. A response interceptor catches `401 Unauthorized` errors to trigger a silent token refresh or redirect to `/login`.

---

## 2. Navigation Flow & Routing

Routing is handled via React Router, strictly protected by Role-Based Access Control (RBAC) wrapper components (`<ProtectedRoute allowedRoles={['STUDENT']} />`).

```mermaid
graph TD
    %% Public Routes
    Start[User] --> Login[/login]
    Start --> Register[/register]
    
    %% Auth Check
    Login --> AuthCheck{Role Check}
    
    %% Student Flow
    AuthCheck -->|STUDENT| SDash[Student Dashboard]
    AuthCheck -->|STUDENT| SChat[Companion Chat & CBT Micro-Tools]
    AuthCheck -->|STUDENT| SSOS[Emergency SOS Gateway]
    SDash --> SCheckIn[Mood Check-in & Surveys]
    SDash --> SHistory[Mood History & Behavioral Telemetry]
    SDash --> SResources[Wellness Resources]
    SChat --> CBreathe[Dual Breathing Pacer]
    SChat --> CGround[5-4-3-2-1 Grounding]
    SChat --> CReframe[Cognitive Reframer]
    
    %% Counselor Flow
    AuthCheck -->|COUNSELOR| CDash[Counselor Dashboard]
    CDash --> CAlerts[Active Alerts & Triage Queue]
    CDash --> CStudent[Student Profile & Risk Detail]
    
    %% Admin Flow
    AuthCheck -->|ADMIN| ADash[Institution Dashboard]
    ADash --> AReports[Aggregate Macro Reports]
```

---

## 3. Component Tree

The UI is constructed using atomic design principles, heavily leveraging `shadcn/ui` primitives.

```text
src/
└── App
    ├── AuthProvider
    ├── QueryClientProvider
    └── Router
        ├── PublicLayout
        │   ├── LoginForm
        │   └── RegisterForm
        └── DashboardLayout (Sidebar, TopNav with Emergency SOS Trigger, MobileMenu)
            ├── StudentChatbot (/student/chat)
            │   ├── DualBreathingPacer (Box 4-4-4-4 & Relax 4-7-8)
            │   ├── SensoryGroundingWidget (5-4-3-2-1 Checklist)
            │   ├── ThoughtReframerModal (CBT Distortion Challenger)
            │   └── SSE Streaming Message Stream
            ├── StudentDashboard (/student/dashboard)
            │   ├── WellnessScoreWidget (Radial Chart)
            │   ├── MoodCheckInPanel (Tabs: Text, Voice, Survey)
            │   ├── MoodHistoryChart (Recharts Line)
            │   ├── BehavioralTelemetryWidget (Screen time & circadian metrics)
            │   └── RecommendationList (Cards)
            ├── EmergencySOSModal (Global Crisis Helplines & Counselor Dispatch)
            ├── CounselorView (/counselor/dashboard)
            │   ├── AlertsDataTable (Triage Queue with CRITICAL priority)
            │   │   └── AlertStatusDropdown (Action Form)
            │   └── StudentDetailModal
            └── AdminView (/admin/dashboard)
                ├── MetricCards (Total Students, Avg Score)
                └── RiskDistributionChart (Recharts Pie)
```

---

## 4. Pages & Views

### 4.1 Authentication Pages (`/login`, `/register`)

* **Components:** `AuthLayout`, `Card`, `Input`, `Button`, `Label`.
* **Forms:** `LoginForm` (email, password), `RegisterForm` (email, password, role select). Validated strictly with Zod schema.
* **API Integration:** `POST /auth/login`, `POST /auth/register`.

### 4.2 Student Dashboard (`/student/dashboard`)

The central hub for primary users to track and manage their mental well-being.

* **Components & Widgets:**
  * **Wellness Score Widget:** A radial gauge (`Recharts RadialBarChart`) displaying the latest Mental Wellness Score (0-100). Color-coded based on risk (Green for Low, Yellow for Medium, Red for High).
  * **Mood Check-In Panel:** Tabbed interface for structured text, simulated voice transcript, and standardized PHQ-9/GAD-7 surveys.
  * **Behavioral Telemetry Widget:** Real-time PC screen time, late-night usage indicators, and agent connection status.

### 4.3 Student Companion Chat & CBT Micro-Modules (`/student/chat`)

* **Components:** `StudentChatbot`, `DualBreathingPacer`, `SensoryGroundingWidget`, `ThoughtReframerModal`, `EmergencySOSModal`.
* **Features:**
  * Real-time Server-Sent Events (SSE) word-by-word streaming.
  * In-chat Box Breathing (4-4-4-4) and Relaxing Breath (4-7-8) countdown timers.
  * Interactive 5-4-3-2-1 Sensory Grounding step completion.
  * Cognitive Reframer for identifying and restructuring Automatic Negative Thoughts (ANT).

### 4.4 Emergency Crisis SOS Gateway Modal

* **Components:** `EmergencySOSModal`.
* **Features:**
  * One-tap dispatch to campus counselor triage queue with `CRITICAL PRIORITY`.
  * Direct telephone links to **Tele-MANAS** (`14416`), **KIRAN** (`1800-599-0019`), and **Campus Health Clinic** (`+91 22 4235 5555`).
* *Text Tab:* A `<textarea>` form for journaling.
* *Voice Tab:* A microphone toggle button utilizing the browser's MediaRecorder API to capture audio, with a pulsing CSS animation while recording.
* *Survey Tab:* Buttons launching the PHQ-9 or GAD-7 wizard modals.


* **Mood History Chart:** `Recharts LineChart` mapping `self_reported_score` and `sentiment_score` over the last 7 or 30 days.
* **Recommendation List:** A CSS Grid of `Card` components displaying wellness articles or video thumbnails based on the current risk level.


* **API Integration:** `GET /predictions/assessment/latest`, `POST /journal/entries`, `GET /mood/history`, `GET /recommendations/current`.
* **Loading State:** Full-page Skeleton components mimicking the layout of the widgets while React Query fetches data.
* **Empty State:** If `/mood/history` is empty, the chart is replaced with a friendly illustration and a CTA button: "Log your first mood to unlock insights!"

### 4.3 Counselor Dashboard (`/counselor/dashboard`)

Designed for high-density data viewing and rapid triage.

* **Components & Widgets:**
* **Alerts Data Table:** A robust `shadcn` Table featuring sortable columns (Date, Student ID, Risk Level, Status).
* **Alert Status Form:** An inline dropdown (`Select`) within the table rows allowing the counselor to update an alert from `PENDING` to `REVIEWED` or `RESOLVED`.
* **Student Profile Modal:** A slide-out panel (Sheet) displaying a specific student's recent mood history and survey results to provide context before intervention.


* **API Integration:** `GET /counselors/alerts`, `PUT /counselors/alerts/{id}`.
* **Loading State:** Table rows render as shimmering skeletons.
* **Empty State:** When all alerts are resolved, the table is replaced with a success graphic and text: "All caught up! No active alerts."

### 4.4 Institution (Admin) Dashboard (`/admin/dashboard`)

A read-only analytics view for macro-level decision-making.

* **Components & Charts:**
* **KPI Summary:** Row of cards showing Total Monitored, Average Score, and Active Critical Alerts.
* **Risk Distribution Chart:** `Recharts PieChart` visualizing the percentage of students in Low, Medium, and High-risk categories.
* **Wellness Trend Chart:** `Recharts BarChart` showing aggregate campus wellness scores aggregated by month.


* **API Integration:** `GET /analytics/institution/reports`.
* **Loading State:** Individual chart containers display a centered spinner until their specific data resolves.
* **Empty State:** "Insufficient data to generate institution reports. Encourage student check-ins."

---

## 5. UI/UX Patterns & Behaviors

### 5.1 Responsive Behavior

* **Mobile-First Approach:** The UI defaults to a single-column `flex-col` layout for mobile devices (crucial for the Student App).
* **Breakpoints:**
* `< 768px (Mobile):` The sidebar navigation collapses into a hidden hamburger menu (Sheet component). Charts reduce padding and hide complex axes to maintain readability.
* `>= 768px (Tablet/Desktop):` The layout transitions to a CSS Grid (`md:grid-cols-2` or `lg:grid-cols-3` for widgets). The sidebar becomes persistent.



### 5.2 Forms & Validation

* **Validation Strategy:** Immediate client-side feedback using Zod. Submit buttons remain disabled until all required fields pass validation.
* **Error Handling:** Forms do not jump or shift layout when errors appear; fixed-height error text containers are used below inputs.

### 5.3 Notifications & Feedback

* **Toasts (`shadcn` Toaster):** Used globally for non-blocking feedback (e.g., "Mood logged successfully", "Alert status updated", "Network error occurred").
* **Optimistic UI:** When a Counselor marks an alert as `REVIEWED`, the UI immediately updates the table row to reflect the change before the `PUT` request fully resolves, rolling back and showing a Toast error only if the API call fails.