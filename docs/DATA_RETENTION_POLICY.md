# MindGuardAI Data Retention & Deletion Policy

## 1. Purpose & Scope

This policy defines the retention schedules, automated archiving, and right-to-be-forgotten deletion workflows for student mental health data in accordance with institutional governance and data protection regulations.

---

## 2. Retention Schedule by Data Classification

| Data Category | Examples | Retention Period | Deletion / Archival Workflow |
|---|---|---|---|
| **Raw Telemetry Logs** | App window titles, raw screen minute timestamps | **30 Days** | Automatically purged after aggregation into daily summary metrics. |
| **Daily Behavioral Summaries** | Total screen minutes, late-night minutes, sleep duration | **180 Days** | Retained to power rolling 180-day baseline engine; anonymized thereafter. |
| **Psychometric Assessments** | PHQ-9, GAD-7, PSS scores and item responses | **Duration of Enrollment + 1 Year** | Kept in active student profile; archived to cold encrypted storage upon graduation. |
| **Counselor Case Notes** | Clinical intake records, progress notes | **7 Years** | Mandated by clinical record retention laws; strictly locked to counselor access. |
| **Audit Logs** | Login attempts, record access history | **2 Years** | Immutable security logs purged after compliance verification. |

---

## 3. Account Deletion & Right to Erasure Workflow

When a student requests account termination or complete erasure:
1. Active session tokens are immediately invalidated.
2. Identifiable account records (`email`, `full_name`, `password_hash`) are hard-deleted.
3. Behavioral telemetry logs are permanently purged from database tables.
4. Historical aggregate psychometric indices are stripped of student keys (`student_id = NULL`) to preserve historical campus cohort averages without re-identification risk.
