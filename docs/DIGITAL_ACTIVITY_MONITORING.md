# MindGuardAI – Cross-Platform Digital Activity & Screen-Time Monitoring Architecture

## 1. System Overview

MindGuardAI provides an authentic, privacy-first **Cross-Platform Digital Activity and Screen-Time Monitoring System** designed specifically for university students. 

Unlike conventional surveillance software or synthetic estimation tools:
- **Zero Synthetic Telemetry**: Device uptime is never conflated with active screen time. All duration metrics derive from OS-level physical input activity.
- **Microsecond Physical Idle Detection**: Monitors hardware input timers (keyboard and mouse events) to pause tracking during user inactivity.
- **Multi-Device & Multi-User Isolation**: Students can register and monitor multiple laptops, desktops, and browsers under their own account with isolated per-device authorization tokens.
- **Strict Student Privacy**: Keylogging, screenshots, video recording, form passwords, private messages, email bodies, and notification texts are strictly excluded from architecture and collectors.

---

## 2. Architecture & Data Flow

```
┌────────────────────────────────────────────────────────┐
│                   Student Endpoints                    │
├───────────────────────────────┬────────────────────────┤
│     Desktop Agent (PC/Mac/Linux)│  Browser Extension MV3 │
│  - Windows: GetLastInputInfo   │  - Chrome / Edge       │
│  - macOS: IOHIDSystem / CGWin │  - Active tab domain   │
│  - Linux: xprintidle / xdotool│  - Search query opt-in │
└───────────────┬───────────────┴───────────┬────────────┘
                │                           │ IPC (Port 42424)
                ▼                           ▼
┌────────────────────────────────────────────────────────┐
│             Local Agent SQLite Sync Engine             │
│  - Persistent Hardware UUID Identification            │
│  - Offline buffer & idempotent submission queue        │
│  - Batch upload with exponential backoff               │
└───────────────────────────────┬────────────────────────┘
                                │ HTTPS / Bearer Token
                                ▼
┌────────────────────────────────────────────────────────┐
│                 MindGuard Cloud Backend                │
│  - FastAPI REST Endpoints (/api/v1/devices, /digital)  │
│  - SHA-256 Hashed Device Authentication Tokens        │
│  - SQLAlchemy 2.0 Async Session Management             │
│  - PostgreSQL / SQLite Hybrid Storage                  │
└───────────────────────────────┬────────────────────────┘
                                │ Authenticated React REST API
                                ▼
┌────────────────────────────────────────────────────────┐
│           MindGuard Digital Wellness Dashboard         │
│  - Overview (Active vs. Idle, 7-Day Trend)             │
│  - Application Analytics (Categories & Durations)      │
│  - Website Analytics (Domains & Browser Usage)         │
│  - Search Query Analytics (Academic Search History)    │
│  - Notification Interruption Trends                    │
│  - Device Management (Pair, Pause, Remove)             │
│  - Privacy Controls, Data Export & Permanent Purge     │
└────────────────────────────────────────────────────────┘
```

---

## 3. Multi-User and Multi-Device Support

### Hardware Identification
Each device generates a persistent identifier:
- **Windows**: Machine GUID from `SOFTWARE\Microsoft\Cryptography\MachineGuid` combined with `uuid.getnode()`.
- **macOS**: `IOPlatformUUID` via `ioreg`.
- **Linux**: `/etc/machine-id` or `/var/lib/dbus/machine-id`.

### Device Authentication & Security
1. When a student executes the desktop agent with their login credentials or API key:
   - `POST /api/v1/devices/register` registers the machine.
   - A high-entropy `device_token` is generated.
   - The backend stores `sha256(device_token)` in the `devices` table; raw tokens are never persisted in the database.
2. Subsequent sync payloads authenticate via `Authorization: Bearer <device_token>`.
3. If a student revokes a device in the dashboard, the backend invalidates the token immediately.

---

## 4. Platform Collectors & Idle Detection

### Windows Collector (`desktop_agent/agent/collectors/windows.py`)
- **Idle Detection**: Calls `user32.GetLastInputInfo()` to measure elapsed milliseconds since the last physical keyboard stroke or mouse movement. If elapsed time exceeds `idle_threshold_seconds` (default: 120s), the session transitions to `idle`.
- **Active Window**: Calls `user32.GetForegroundWindow()` and `user32.GetWindowThreadProcessId()` to resolve the executable name (e.g. `Code.exe`, `chrome.exe`) and window title.
- **Lock Detection**: Intercepts session switch notifications and lock screen states.

### macOS Collector (`desktop_agent/agent/collectors/macos.py`)
- **Idle Detection**: Reads `HIDIdleTime` from `IOHIDSystem` via CoreGraphics.
- **Active Window**: Queries `NSWorkspace.sharedWorkspace().frontmostApplication()` or `CGWindowListCopyWindowInfo`.

### Linux Collector (`desktop_agent/agent/collectors/linux.py`)
- **Idle Detection**: Uses `xprintidle` or XScreenSaver extension query.
- **Active Window**: Queries `_NET_ACTIVE_WINDOW` using `xprop` or `xdotool`.

---

## 5. Browser Extension (Chrome & Edge Manifest V3)

The extension monitors active browsing while respecting strict student privacy:
- **Location**: `browser_extension/`
- **Active Tab Tracking**: Listens to `chrome.tabs.onActivated` and `chrome.windows.onFocusChanged`. Accrues browsing time only when the browser window is focused and the tab is actively viewed.
- **Search Query Logging**:
  - Requires explicit opt-in in extension settings (`searchTrackingEnabled`).
  - Detects query parameters on Google (`?q=`), Bing (`?q=`), and DuckDuckGo (`?q=`).
  - **Incognito Exemption**: Never executes or tracks in private/incognito tabs (`tab.incognito === true`).
- **Local IPC Communication**: Sends heartbeat and domain stats to the local MindGuard agent via `http://127.0.0.1:42424/extension/event`.

---

## 6. Privacy, Consent, and Anti-Fabrication Principles

1. **No Fake / Synthetic Data**:
   - If no telemetry has been synchronized, every analytics card displays:
     > *"No activity data available yet. Start monitoring to see your digital wellness analytics."*
   - No hardcoded demo metrics, estimated multiplier curves, or artificial random numbers are used.
2. **Student Data Sovereignty**:
   - **Export**: Students can export their full activity records as formatted JSON at any time.
   - **Purge**: Single-click permanent deletion of all activity sessions, application logs, website visits, and search records.
   - **Retention**: Configurable rolling retention period (7, 14, 30, 90, 180, 365 days).
3. **Counselor Boundary**:
   - Raw search queries, browsing URLs, and application names are strictly private to the student and are never transmitted to counselor or administrator portals.

---

## 7. Setup & Execution Instructions

### Running the Desktop Agent
```bash
# Navigate to desktop agent directory
cd desktop_agent

# Install dependencies
pip install requests psutil pywin32

# Verify device identification
python mindguard_pc_agent.py --status

# Start background monitoring & sync
python mindguard_pc_agent.py --server http://localhost:8000 --user-email student@university.edu
```

### Loading the Browser Extension
1. Open Google Chrome or Microsoft Edge.
2. Navigate to `chrome://extensions` or `edge://extensions`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `browser_extension/` directory.
5. Click the MindGuard extension icon in the toolbar to verify active status.

### Running the Cloud Backend
```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Running the Frontend
```bash
cd frontend
npm install
npm run build
npm run dev
```
Navigate to `http://localhost:5173/student/screentime` to access the full Digital Wellness Dashboard.
