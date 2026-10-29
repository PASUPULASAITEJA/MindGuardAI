# MindGuardAI Clinical Assessment & Psychometric Validation Matrix

## 1. Overview
MindGuardAI operates as an evidence-based clinical safety net for higher education institutions. This document establishes the formal clinical validation protocols, psychometric screener thresholds, and algorithmic risk weights used across the telemetry ingestion pipeline.

---

## 2. Standardized Psychometric Instruments

### 2.1 PHQ-9 (Patient Health Questionnaire-9)
Validated depression screener assessing depressive symptoms over the preceding 14 days:
- **0–4**: Minimal or no depressive symptoms (Low Risk)
- **5–9**: Mild depressive symptoms (Low–Moderate Tier; trigger self-guided CBT coping modules)
- **10–14**: Moderate depressive symptoms (Moderate Tier; proactive counselor check-in prompt)
- **15–19**: Moderately severe symptoms (High Tier; priority counselor triage alert)
- **20–27**: Severe symptoms (Emergency Tier; crisis lifeline escalation protocol)
- **Item 9 Trigger**: Any positive endorsement of Item 9 (passive or active self-harm ideation) immediately overrides aggregate scoring and routes to immediate emergency crisis escalation (Tele-MANAS: 14416 / KIRAN: 1800-599-0019).

### 2.2 GAD-7 (Generalized Anxiety Disorder-7)
Standardized assessment for generalized anxiety severity:
- **0–4**: Minimal anxiety
- **5–9**: Mild anxiety (breathing entrainment & grounding exercises)
- **10–14**: Moderate anxiety (counselor priority queue placement)
- **15–21**: Severe anxiety (acute support protocol)

---

## 3. Circadian & Screen-Time Telemetry Synthesis

### 3.1 Sleep Debt & Circadian Fragmentation Index (CFI)
$$\text{CFI} = \alpha \cdot \frac{\text{Late Night Minutes (00:00–05:00)}}{\text{Total Daily Usage}} + \beta \cdot \max(0, 7.5 - \text{Sleep Duration})$$

Where:
- $\alpha = 0.60$ (weight assigned to unseasonal nocturnal blue-light exposure)
- $\beta = 0.40$ (weight assigned to acute sleep deficit)

### 3.2 Longitudinal Velocity Weighting
Risk tiers incorporate 14-day rolling mood velocity ($\Delta v_{\text{mood}}$):
$$\Delta v_{\text{mood}} = \frac{1}{N} \sum_{t=1}^{N} (S_t - S_{t-1})$$
A negative velocity exceeding $-1.5$ standard deviations over 72 hours triggers an autonomous early warning alert to campus clinical counseling staff.

---

## 4. Privacy & Ethical Governance
- **Zero Keystroke Monitoring**: Raw input logs are strictly forbidden. Telemetry is restricted to OS-level process lifetimes and consented mood check-ins.
- **$k$-Anonymity ($k \geq 10$)**: Institutional administration dashboards suppress any cohort or demographic grouping smaller than 10 students to mathematically prevent re-identification.
