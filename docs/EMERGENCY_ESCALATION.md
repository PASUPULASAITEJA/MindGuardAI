# MindGuardAI Emergency Escalation & Crisis Protocol

## 1. Automated Distress Trigger Criteria

MindGuardAI identifies potential urgent student crises through three objective, deterministic triggers:

1. **PHQ-9 Suicidal Ideation Screen**:
   * Any score $\ge 1$ on Item 9 (*"Thoughts that you would be better off dead or of hurting yourself in some way"*).
2. **Critical Wellness Index Drop**:
   * Composite Mental Wellness Score falling to **$\le 35.0$ / 100**.
3. **Explicit Crisis NLP Intent Detection**:
   * Exact matching of self-harm, suicidal, or acute emergency phrases via the **Lexical Guardian Engine** ([`inference.py`](file:///d:/mindguard/backend/app/ml/inference.py#L80-L145)).

---

## 2. Multi-Tier Escalation Workflow

```
                        CRISIS SIGNAL DETECTED
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
[STUDENT IMMEDIATE MODAL]                       [COUNSELOR CLINICAL QUEUE]
• Display Tele-MANAS (14416)                    • Generate Priority Triage Alert
• Display KIRAN (1800-599-0019)                 • Surface TreeSHAP Risk Drivers
• Display Campus Emergency SOS                  • Notify On-Duty Mental Health Staff
```

### Protocol Guidelines:
1. **Immediate Student Emergency Resources**:
   * The UI renders an un-dismissible **Emergency SOS Modal** providing one-click calling to official national helplines:
     * **Tele-MANAS**: `14416` or `1800-891-4416` (24/7 National Mental Health Helpline)
     * **KIRAN**: `1800-599-0019` (Ministry of Social Justice Helpline)
     * **National Emergency**: `112`
2. **Proportional Human Review**:
   * MindGuardAI **never** contacts parents, faculty, or law enforcement directly via unverified automated AI triggers.
   * All clinical escalations route to a **certified human counselor** who conducts clinical verification and follows campus standard operating procedures.
