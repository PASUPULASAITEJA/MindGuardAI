# MindGuardAI Capstone Report Asset Guide & Inventory

This directory tree contains all formal academic figures, machine learning evaluation plots, workflow schematics, and user interface screenshots for the MindGuardAI Capstone Project Report.

## Directory Structure and Asset Mapping

```
docs/report_assets/
|-- 01_architecture/
|   |-- fig3_1_system_architecture.png          # Chapter 3 (Section 3.1): Multi-tier microservices architecture
|   |-- fig3_7_digital_wellbeing_data_flow.png  # Chapter 3 (Section 3.11): Digital phenotyping & purpose data flow
|   `-- fig3_8_database_erd.png                 # Chapter 3 (Section 3.4): PostgreSQL relational entity relationship diagram
|
|-- 02_workflow_diagrams/
|   |-- fig3_2_application_workflow.png         # Chapter 3 (Section 3.2): Closed-loop student-counselor workflow
|   |-- fig3_4_emotion_detection_workflow.png   # Chapter 3 (Section 3.7): DistilBERT NLP & Hinglish emotion classifier
|   `-- fig3_5_risk_triage_workflow.png         # Chapter 3 (Section 3.10): Multimodal risk classification & triage
|
|-- 03_ml_results/
|   |-- fig3_3_ml_pipeline.png                  # Chapter 3 (Section 3.8): ML training & inference pipeline
|   |-- fig4_1_confusion_matrix.png             # Chapter 4 (Section 4.8): Multimodal risk confusion matrix (N=4,859)
|   `-- fig4_2_model_evaluation_charts.png      # Chapter 4 (Section 4.7): Ablation study & class-wise PR/F1 metrics
|
|-- 04_ui_screenshots/
|   |-- fig4_3_student_dashboard.png            # Chapter 4 (Section 4.2): Student Wellness Hub interface
|   |-- fig4_4_counselor_dashboard.png          # Chapter 4 (Section 4.3): Counselor clinical triage console
|   |-- fig4_5_ai_chatbot.png                   # Chapter 4 (Section 4.4): Confidential AI Wellness Companion
|   |-- fig4_6_assessment_interface.png         # Chapter 4 (Section 4.5): PHQ-9 & GAD-7 clinical assessment portal
|   |-- fig4_7_digital_wellbeing_dashboard.png  # Chapter 4 (Section 4.6): Screen time & purpose phenotyping portal
|   |-- screenshot_landing_page.png             # Appendix C: Public institutional landing page
|   |-- screenshot_login_page.png               # Appendix C: University roster authentication login
|   |-- screenshot_registration_page.png        # Appendix C: Student onboarding & enrollment
|   |-- screenshot_mood_checkin.png             # Appendix C: Interactive daily mood check-in modal
|   |-- screenshot_mood_history.png             # Appendix C: Longitudinal 30-day emotion trajectory
|   |-- screenshot_student_consent.png          # Appendix C & Chapter 3: Student data sovereignty & consent center
|   |-- screenshot_counselor_student_case.png   # Appendix C: Detailed clinical case file & TreeSHAP waterfall
|   `-- screenshot_notifications.png            # Appendix C: Clinical alerts & break reminders
|
|-- 05_security_diagrams/
|   `-- fig3_6_security_rbac_consent.png        # Chapter 3 (Section 3.12/3.13): Multi-tenant RBAC & k-anonymity
|
|-- 06_testing_results/
|   `-- fig4_8_api_testing_results.png          # Chapter 4 (Section 4.10): FastAPI response time benchmarks (<80ms)
|
`-- 07_deployment/
    `-- fig3_9_aws_deployment_architecture.png  # Chapter 3 (Section 3.15): AWS EC2 Docker microservices architecture
```

## How to Regenerate Assets

To re-render all architectural and machine learning figures:
```powershell
python scripts/generate_diagrams.py
```

To re-render all UI visual screenshots:
```powershell
python scripts/generate_all_ui_screenshots.py
```

To re-build the complete DOCX and PDF Capstone Reports:
```powershell
python scripts/generate_full_capstone_report.py
```

