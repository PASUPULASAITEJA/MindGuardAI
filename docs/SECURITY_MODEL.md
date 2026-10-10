# MindGuardAI Security & Role-Based Access Control (RBAC) Architecture

## 1. Least-Privilege Role Hierarchy

MindGuardAI enforces strict backend-level Role-Based Access Control (RBAC) across four distinct roles:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      RBAC Matrix & Scope Isolation                     │
├───────────────┬────────────────────────────────────────────────────────┤
│ Role          │ Authorized Capabilities & Access Scope                 │
├───────────────┼────────────────────────────────────────────────────────┤
│ **STUDENT**   │ • Access only own assessments, baselines, & journals   │
│               │ • Configure personal consent preferences & SOS contacts│
│               │ • Strict deny on accessing other students' records     │
├───────────────┼────────────────────────────────────────────────────────┤
│ **COUNSELOR** │ • Access assigned triage queue & student case files    │
│               │ • View TreeSHAP explainability factor attributions     │
│               │ • Create encrypted clinical progress notes             │
├───────────────┼────────────────────────────────────────────────────────┤
│ **ADMIN**     │ • Access institution-wide anonymized macro metrics     │
│               │ • View department health indices (k >= 10 enforced)    │
│               │ • Strict deny on viewing identifiable student journals │
└───────────────┴────────────────────────────────────────────────────────┘
```

---

## 2. Technical Security Safeguards

1. **Authentication & Token Management**:
   * JSON Web Tokens (JWT) signed via HMAC-SHA256 with short-lived expiration ($60\text{ minutes}$).
   * Password hashing using **bcrypt** with a work factor of 12.
2. **Encryption Standards**:
   * **In-Transit**: TLS 1.3 encryption for all REST API endpoints and WebSocket streams.
   * **At-Rest**: AES-256 encryption for database columns storing sensitive text reflections and counselor case notes.
3. **Audit Logging**:
   * All clinical record accesses, counselor note creations, and admin macro queries generate immutable audit log entries recording `user_id`, `action`, `resource_id`, `timestamp`, and `client_ip`.
