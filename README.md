<div align="center">
  <img src="frontend/public/logo.png" alt="MindGuardAI Logo" width="180" style="border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);" />
  
  # MindGuardAI
  ### *Your Mind. Our Mission.*

  **Predictive, Privacy-First Mental Wellness & Digital Phenotyping Platform for Higher Education**

  <p align="center">
    <a href="#key-features"><img src="https://img.shields.io/badge/Platform-Higher_Education_Mental_Health-0284c7?style=for-the-badge&logo=react" alt="Platform" /></a>
    <a href="#tech-stack"><img src="https://img.shields.io/badge/Backend-FastAPI_%7C_Python_3.12-059669?style=for-the-badge&logo=fastapi" alt="FastAPI" /></a>
    <a href="#tech-stack"><img src="https://img.shields.io/badge/Frontend-React_18_%7C_TypeScript_%7C_Vite-6366f1?style=for-the-badge&logo=vite" alt="React" /></a>
    <a href="#ml-architecture"><img src="https://img.shields.io/badge/AI_Engine-DistilBERT_%2B_Random_Forest-f59e0b?style=for-the-badge&logo=huggingface" alt="AI Engine" /></a>
    <a href="#license"><img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License" /></a>
  </p>
</div>

---

## 🌟 Executive Overview

University students face elevated risks of academic burnout, severe sleep disruption, and anxiety long before clinical crises occur, yet institutional counseling centers often remain reactive and overwhelmed. 

**MindGuardAI** bridges this gap by combining **passive digital phenotyping**, **standardized clinical psychometrics**, and **explainable machine learning** into an empathetic student wellness ecosystem:

- **For Students:** A confidential, safe space featuring 24/7 empathetic conversational support, daily screen time purpose analysis, breath pacing, and personalized CBT micro-interventions.
- **For Campus Counselors:** Proactive, non-stigmatizing triage matrix providing early risk warnings, consent-governed longitudinal trends, and secure 1-on-1 consultation scheduling.
- **For Campus Administrators:** Aggregated, anonymized campus-wide cohort analytics to address academic pressure points and semester wellness dips.

---

## 🚀 Key Modules & Capabilities

### 🖥️ 1. Screen Time & Digital Phenotyping
- **7-Day Daily Screen Time Graphics:** Interactive longitudinal charts measuring active computer hours, daily averages, and baseline comparisons.
- **Purpose Classification:** Distinguishes device usage across **Studying (Coursework & Coding)**, **Playing (Gaming & Media)**, **Social Browsing**, and **Sensitive Content**.
- **Nocturnal Circadian Tracking:** Pinpoints late-night device exposure (12:00 AM – 5:00 AM) to evaluate melatonin disruption and sleep debt risks.
- **Active Eye-Strain Warnings:** Continuous session alerts encouraging the 20-20-20 rule.

### 🧠 2. Multimodal Clinical Triage & AI Companion
- **Bilingual Empathetic Assistant:** Delivers non-judgmental CBT micro-exercises with natural code-mixed English and Hinglish support.
- **DistilBERT Emotion Inference:** Fine-tuned NLP classifying real-time affective vectors: *Joy*, *Sadness*, *Anxiety*, *Anger*, *Fear*, and *Neutral*.
- **Emergency Safety Diamond:** Deterministic Red-Tier crisis override that immediately activates national hotlines (**Tele-MANAS `14416`**, **KIRAN `1800-599-0019`**) and alerts campus counselors.
- **Standardized Screenings:** Automated digital **PHQ-9** (depression), **GAD-7** (anxiety), and **ISI** (insomnia) clinical surveys.

### 📈 3. Longitudinal Trajectory & Baselines
- **Historical Personal Baselines:** Computes individualized rolling averages and Z-score deviations across Mood, Stress, and Sleep metrics.
- **Longitudinal Mental Wellness Curve:** Composite multi-factor wellness curves with clinical risk boundary overlays.
- **Volatility & Affect Dynamics:** Tracks score volatility (High Stability vs. High Flux) and identifies dominant emotional drivers.

### 📬 4. Authenticated Notifications & Email Verification
- **Real-Time Push Alerts:** Low-latency WebSocket channel delivering immediate status changes and appointment reminders.
- **Delivery Verification:** Authenticated SMTP dispatch with cryptographic password reset links and security audit logging.
- **Granular Preference Management:** Customizable toggles for crisis alerts, weekly digests, and in-app toasts.

### 🔒 5. Zero-Knowledge Privacy & Granular Consent
- **Student-Governed Consent:** Students explicitly control counselor data-sharing with instantaneous revocation rights.
- **PII Scrubbing Gateway:** Built-in regex filters mask emails, phone numbers, and student IDs before inference.
- **Audit Logging:** Tamper-evident immutable access records satisfying strict campus compliance standards.

---

## 🏛️ System Architecture

```text
       +-------------------------------------------------------------------------+
       |                         STUDENT & COUNSELOR CLIENTS                     |
       |               React 18  •  TypeScript  •  Vite  •  Tailwind CSS          |
       +--------------------+-------------------------------+--------------------+
                            |                               |
                   REST API |                               | WebSockets (Real-time Alerts)
                            v                               v
       +-------------------------------------------------------------------------+
       |                           FASTAPI BACKEND GATEWAY                       |
       |  • JWT Auth & Refresh Cookies             • Consent Verification Engine  |
       |  • PII Masking Pipeline                   • Audit Logging Middleware    |
       +--------------------+-------------------------------+--------------------+
                            |                               |
            Inference Hooks |                               | SQLAlchemy Async Engine
                            v                               v
       +----------------------------+             +------------------------------+
       |     MACHINE LEARNING CORE  |             |      PERSISTENCE LAYER       |
       | • DistilBERT (Emotion NLP) |             | • PostgreSQL / SQLite Async   |
       | • Random Forest (Risk)     |             | • Behavioral Telemetry Logs   |
       | • Intent Classifier        |             | • Notifications & Audit Trail|
       | • Deterministic Red Safety |             | • Standardized Surveys       |
       +----------------------------+             +------------------------------+
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, Motion, Canvas-Confetti |
| **Backend** | Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0 (AsyncIO), Uvicorn, Python-Jose, Passlib |
| **Machine Learning** | PyTorch, Hugging Face Transformers (DistilBERT), Scikit-Learn, Joblib, NumPy, Pandas |
| **Database & Cache** | PostgreSQL (Production) / SQLite Async (Development), In-Memory Telemetry Caching |
| **Communications** | WebSockets (RFC 6455), SMTP / TLS Authenticated Email Notifications |
| **DevOps & Containers**| Docker, Docker Compose, Multi-stage Linux builds |

---

## ⚡ Quick Start Guide

### Option 1: Docker (Fastest & Recommended)

Ensure Docker and Docker Compose are installed, then execute:

```bash
# 1. Clone repository
git clone https://github.com/PASUPULASAITEJA/MindGuardAI.git
cd MindGuardAI

# 2. Start all services in isolated containers
docker compose up --build
```

- **Frontend Client:** [http://localhost:5173](http://localhost:5173)
- **FastAPI Interactive API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option 2: Local Manual Setup

#### Step 1: Backend Setup
```bash
cd backend

# Create and activate Python virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Initialize database schema & seed demonstration users
python -m app.initial_data

# Launch FastAPI development server
uvicorn app.main:app --reload --port 8000
```

#### Step 2: Frontend Setup
In a new terminal window:
```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite live-reload dev server
npm run dev
```

---

## 👥 Default Test Accounts

Seed data creates pre-configured accounts with populated histories for demonstration:

| Role | Email | Password | Primary Features |
| :--- | :--- | :--- | :--- |
| **Student** | `student@campus.edu` | `SecurePass123!` | Wellness Dashboard, Screen Time, AI Companion, Toolkit, Surveys |
| **Counselor** | `counselor@campus.edu` | `SecurePass123!` | Clinical Triage Matrix, Student Case Files, Session Bookings |
| **Administrator** | `admin@campus.edu` | `SecurePass123!` | Cohort Analytics, Campus Trends, User Management |

---

## 🧪 Testing & Code Quality

MindGuardAI includes an automated test suite across backend API contracts and frontend bundles:

```bash
# Run backend pytest suite with coverage
cd backend
pytest -v

# Run frontend TypeScript type checking and production build
cd ../frontend
npm run build
```

---

## 🔒 Security & Compliance

- **Authentication:** Dual-token JWT architecture with rotating short-lived access tokens and HttpOnly, Secure, SameSite refresh cookies.
- **PII Protection:** Automatic redaction of student registration numbers, phone numbers, and emails before ML analysis.
- **Emergency Safeguard:** Unwavering deterministic safety priority: suicidal ideation or acute harm indicators immediately bypass conversational loops to provide emergency helplines.
- **Compliance Alignment:** Designed following FERPA privacy mandates and HIPAA health data handling best practices.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for complete details.

<div align="center">
  <br />
  <sub>Built with compassion for university student mental wellness • <strong>MindGuardAI Engineering</strong></sub>
</div>
