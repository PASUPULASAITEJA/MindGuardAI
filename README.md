<div align="center">
  <img src="frontend/public/logo.png" alt="MindGuardAI Logo" width="88" />
  <h1>MindGuardAI</h1>
  <p><strong>Predictive, privacy-first mental health intelligence platform for higher education</strong></p>

---

## What is MindGuardAI?

University students frequently face burnout, chronic sleep disruption, and anxiety long before clinical crises occur, yet campus counseling centers remain overwhelmed and reactive. MindGuardAI bridges this critical gap by providing students with proactive, non-invasive wellness monitoring and an AI coping companion. For university counselors and administrators, it aggregates anonymized risk signals to enable early, compassionate intervention without compromising individual privacy.

---

## Key Features

| Icon | Feature                             | Description                                                                                       |
| :--: | :---------------------------------- | :------------------------------------------------------------------------------------------------ |
| 🛡️ | **Early Risk Stratification** | Multi-tier behavioral inference flagging emerging distress before academic crises.                |
|  🤖  | **Empathetic AI Companion**   | 24/7 conversational support with automatic clinical escalation for high-distress cues.            |
|  📊  | **Explainable AI Insights**   | SHAP-driven factor attribution revealing actionable wellness drivers to students and counselors.  |
|  🔒  | **Zero-Knowledge Privacy**    | Explicit granular consent controls, differential privacy, and $k$-anonymity campus aggregation. |
|  📋  | **Clinical Assessments**      | Automated standardized PHQ-9, GAD-7, and ISI screening with longitudinal history tracking.        |
|  🚨  | **Crisis SOS Protocol**       | Instant emergency lifeline routing with real-time counselor escalation dashboards.                |

---

## Architecture

```text
[ Desktop Telemetry / Mobile Check-ins ] ---> [ Zero-Knowledge Consent Gateway ]
                                                               |
                                            +------------------+------------------+
                                            |                                     |
                                            v                                     v
                                  [ ML Risk & SHAP Engine ]           [ FastAPI Core Services ]
                                  (DistilBERT + Random Forest)        (Auth, Triage, WebSockets)
                                            |                                     |
                                            +------------------+------------------+
                                                               |
                                            v                                     v
                                 [ Student Wellness App ]            [ Clinical Counselor Portal ]
                                 (React 18 + Three.js UI)            (Triage Matrix & Case Notes)
```

---

## Tech Stack

- **Backend**: Python 3.12, FastAPI, SQLAlchemy, Alembic, SQLite / PostgreSQL, Pydantic v2
- **ML & Data**: PyTorch, DistilBERT, Hugging Face Transformers, scikit-learn, SHAP, NumPy, pandas
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Three.js, Framer Motion, Lucide Icons
- **Infrastructure**: Docker, Docker Compose, Windows Service (Desktop Telemetry Agent)

---

## Quick Start

### Option A: Docker (Recommended)

```bash
git clone https://github.com/PASUPULASAITEJA/MindGuardAI.git
cd MindGuardAI
docker compose up --build
```

Access the application at `http://localhost:5173` (Frontend) and `http://localhost:8000/docs` (API Docs).

### Option B: Manual Setup

```bash
# 1. Backend Setup
cd backend
python -m venv .venv && source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m app.initial_data
uvicorn app.main:app --reload --port 8000

# 2. Frontend Setup (in a second terminal)
cd ../frontend
npm install
npm run dev
```

---

## ML Model Performance

| Model                      | Task                           |    Accuracy / F1    | Inference Latency | Notes                                                                    |
| :------------------------- | :----------------------------- | :-----------------: | :---------------: | :----------------------------------------------------------------------- |
| **DistilBERT v1**    | Conversational Intent & Risk   | **89.4% F1** |    ~42ms (CPU)    | Fine-tuned on distress dialogues; optimized for fast CPU inference.      |
| **Random Forest v2** | Academic & Sleep Risk Triaging | **91.2% Acc** |       <5ms       | Combines academic pressure indices, sleep deficit, and check-in history. |
| **SHAP Explainer**   | Clinical Factor Attribution    |         N/A         |       ~85ms       | Generates individualized barrier/protective factor breakdowns.           |

> *Note: Production deployment uses confidence thresholding with fallback rules to guarantee emergency safety protocols.*

---

## Running Tests

```bash
# Backend unit & integration test suite (51 tests)
cd backend
pytest tests/ -v

# Frontend type checking and production build
cd ../frontend
npm run build
```

---

## Documentation

Explore in-depth architectural specifications and operational guides in [`docs/`](docs/):

- [Architecture &amp; Data Flow](docs/ARCHITECTURE.md)
- [API Specification](docs/API.md)
- [Machine Learning Pipeline](docs/ML.md)
- [Database Schema &amp; ERD](docs/DATABASE.md)
- [Security &amp; Threat Model](docs/SECURITY.md)
- [Privacy &amp; Consent Engine](docs/PRIVACY_AND_CONSENT.md)
- [Emergency Escalation Protocol](docs/EMERGENCY_ESCALATION.md)
- [Docker Deployment Guide](docs/DOCKER.md)
- [Product Requirements (PRD)](docs/PRD.md)
- [Project Roadmap](docs/ROADMAP.md)

---

## License

Distributed under the [MIT License](LICENSE).

<div align="center">
  <sub>Built with care for student mental health • MindGuardAI Engineering</sub>
</div>
