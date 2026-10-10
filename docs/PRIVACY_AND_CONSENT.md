# MindGuardAI Privacy & Consent Management Framework

## 1. Core Privacy Philosophy & Consent Model

MindGuardAI operates on a **privacy-by-design** and **voluntary informed consent** framework for university students. No student is compelled to enable passive digital biomarker collection to access standard academic services.

### Key Consent Principles:
1. **Granular Consent Toggles**:
   Students can independently authorize or revoke:
   * **Psychometric Assessments**: Completing validated clinical questionnaires (PHQ-9, GAD-7, PSS-10).
   * **Passive Desktop Telemetry**: Background collection of active app category durations and late-night screen time ($T_{\text{late}}$).
   * **NLP Text Analysis**: AI extraction of emotional affect and distress cues from daily journal check-ins.
   * **Counselor Escalation**: Authorization to dispatch high-risk alerts to certified campus counselors.
2. **Revocation Rights & Immediate Ingestion Cease**:
   * A student can revoke consent at any time in the Student Privacy Settings.
   * Revocation immediately revokes the desktop agent heartbeat token and stops backend telemetry ingestion.
3. **Non-Punitive Participation**:
   * Declining or revoking consent carries no academic, administrative, or disciplinary consequence.

---

## 2. Data Protection Standards

* **Compliance Alignment**: Aligned with FERPA (Family Educational Rights and Privacy Act), HIPAA Security Rule guidelines for digital health records, and the Digital Personal Data Protection Act (DPDPA).
* **Storage Isolation**: Clinical counseling notes and psychometric scores are cryptographically isolated from general academic records (grades, attendance, registrar databases).
