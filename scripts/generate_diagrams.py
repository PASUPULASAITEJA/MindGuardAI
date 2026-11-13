import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

def create_all_diagrams():
    base_dir = os.path.abspath("docs/report_assets")
    arch_dir = os.path.join(base_dir, "01_architecture")
    wf_dir = os.path.join(base_dir, "02_workflow_diagrams")
    ml_dir = os.path.join(base_dir, "03_ml_results")
    sec_dir = os.path.join(base_dir, "05_security_diagrams")
    test_dir = os.path.join(base_dir, "06_testing_results")
    dep_dir = os.path.join(base_dir, "07_deployment")

    for d in [arch_dir, wf_dir, ml_dir, sec_dir, test_dir, dep_dir]:
        os.makedirs(d, exist_ok=True)

    # -------------------------------------------------------------
    # 1. Figure 3.1: Complete MindGuardAI System Architecture
    # -------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(12, 7.5), dpi=300)
    ax.axis("off")
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 8.5)

    # Layer boxes
    layers = [
        {"y": 6.8, "h": 1.3, "title": "Presentation Tier (Cross-Platform Clients)", "fc": "#EFF6FF", "ec": "#3B82F6",
         "items": ["Web SPA (React 18 + Vite + Tailwind)", "Android Mobile App (APK v1.4.0)", "Desktop Telemetry Agent (Win32 / macOS)", "Counselor Clinical Portal"]},
        {"y": 4.8, "h": 1.4, "title": "API Gateway & Application Tier (FastAPI Async Framework)", "fc": "#F0FDF4", "ec": "#10B981",
         "items": ["JWT Authentication & RBAC Filter", "Behavioral Ingestion Endpoint", "Clinical Assessment Processor", "Emergency Crisis Escalation Dispatcher"]},
        {"y": 2.8, "h": 1.4, "title": "Machine Learning & Clinical Intelligence Tier (PyTorch + Scikit-Learn)", "fc": "#FAF5FF", "ec": "#8B5CF6",
         "items": ["DistilBERT Emotion & Intent Classifier", "Personal Baseline Deviation Engine", "Random Forest 3-Tier Risk Model", "TreeSHAP Game-Theoretic Explainability"]},
        {"y": 0.8, "h": 1.4, "title": "Data Persistence & Storage Tier (PostgreSQL 15 + Redis)", "fc": "#FFF7ED", "ec": "#F97316",
         "items": ["PostgreSQL Relational DB (SQLAlchemy Async)", "Encrypted Audit & Clinical Logs", "Redis Session & Ephemeral Cache", "k-Anonymized Aggregate Views (k >= 10)"]}
    ]

    for lay in layers:
        rect = patches.FancyBboxPatch((0.5, lay["y"]), 11.0, lay["h"], boxstyle="round,pad=0.15",
                                      fc=lay["fc"], ec=lay["ec"], lw=2.0)
        ax.add_patch(rect)
        ax.text(0.8, lay["y"] + lay["h"] - 0.28, lay["title"], fontsize=11, fontweight="bold", color="#1E293B")
        
        # Add item sub-boxes
        n_items = len(lay["items"])
        w_item = 2.45
        for idx, itm in enumerate(lay["items"]):
            x_pos = 0.8 + idx * 2.65
            sub_rect = patches.FancyBboxPatch((x_pos, lay["y"] + 0.18), w_item, 0.75,
                                              boxstyle="round,pad=0.08", fc="#FFFFFF", ec=lay["ec"], lw=1.2)
            ax.add_patch(sub_rect)
            ax.text(x_pos + w_item/2, lay["y"] + 0.55, itm, ha="center", va="center",
                    fontsize=8.0, fontweight="bold", color="#334155", wrap=True)

    # Inter-layer connecting arrows
    arrow_props = dict(facecolor="#64748B", edgecolor="#475569", width=1.8, headwidth=7)
    for y_arrow in [6.8, 4.8, 2.8]:
        ax.annotate("", xy=(6.0, y_arrow - 0.55), xytext=(6.0, y_arrow + 0.05),
                    arrowprops=dict(arrowstyle="<->", lw=2.5, color="#2563EB"))

    plt.title("Figure 3.1: Complete MindGuardAI Multi-Tier Microservices Architecture",
              fontsize=13, fontweight="bold", pad=15, color="#1E3A8A")
    plt.tight_layout()
    plt.savefig(os.path.join(arch_dir, "fig3_1_system_architecture.png"), bbox_inches="tight")
    plt.close()

    # -------------------------------------------------------------
    # 2. Figure 3.2: Student and Counselor Application Workflow
    # -------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(11, 6), dpi=300)
    ax.axis("off")
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 7)

    # Student Workflow Column
    ax.text(2.5, 6.4, "STUDENT WELLNESS WORKFLOW", ha="center", fontsize=11, fontweight="bold", color="#2563EB")
    student_steps = [
        "1. Daily Authentication & Self Check-in",
        "2. Voice/Text Emotion & Sentiment Logging",
        "3. Validated Clinical Surveys (PHQ-9 / GAD-7)",
        "4. Autonomous Screen-Time Telemetry Sync",
        "5. Personalized Coping & AI Chatbot Support"
    ]
    for i, s in enumerate(student_steps):
        y = 5.3 - i * 1.05
        box = patches.FancyBboxPatch((0.6, y), 3.8, 0.75, boxstyle="round,pad=0.1", fc="#EFF6FF", ec="#3B82F6", lw=1.5)
        ax.add_patch(box)
        ax.text(2.5, y + 0.38, s, ha="center", va="center", fontsize=8.5, fontweight="bold", color="#1E3A8A")
        if i < len(student_steps) - 1:
            ax.annotate("", xy=(2.5, y - 0.28), xytext=(2.5, y), arrowprops=dict(arrowstyle="->", lw=2, color="#3B82F6"))

    # Central Core Ingestion Engine
    center_box = patches.FancyBboxPatch((4.8, 2.2), 1.4, 2.8, boxstyle="round,pad=0.1", fc="#FEF2F2", ec="#EF4444", lw=2.0)
    ax.add_patch(center_box)
    ax.text(5.5, 3.8, "MindGuard AI\nRisk Triage &\nBaseline\nEngine", ha="center", va="center",
            fontsize=9.0, fontweight="bold", color="#991B1B")

    # Connect Student to Center
    ax.annotate("", xy=(4.8, 3.6), xytext=(4.4, 3.6), arrowprops=dict(arrowstyle="->", lw=2.5, color="#2563EB"))
    # Connect Center to Counselor
    ax.annotate("", xy=(6.6, 3.6), xytext=(6.2, 3.6), arrowprops=dict(arrowstyle="->", lw=2.5, color="#DC2626"))

    # Counselor Workflow Column
    ax.text(8.5, 6.4, "COUNSELOR INTERVENTION WORKFLOW", ha="center", fontsize=11, fontweight="bold", color="#DC2626")
    counselor_steps = [
        "1. Real-Time Risk Triage Queue Monitoring",
        "2. Review TreeSHAP Symptom Decompositions",
        "3. Clinical Assessment Severity Inspection",
        "4. Confidential Direct Appointment Scheduling",
        "5. Automated High-Risk SOS Alert Escalation"
    ]
    for i, c in enumerate(counselor_steps):
        y = 5.3 - i * 1.05
        box = patches.FancyBboxPatch((6.6, y), 3.8, 0.75, boxstyle="round,pad=0.1", fc="#FEF2F2", ec="#EF4444", lw=1.5)
        ax.add_patch(box)
        ax.text(8.5, y + 0.38, c, ha="center", va="center", fontsize=8.5, fontweight="bold", color="#991B1B")
        if i < len(counselor_steps) - 1:
            ax.annotate("", xy=(8.5, y - 0.28), xytext=(8.5, y), arrowprops=dict(arrowstyle="->", lw=2, color="#EF4444"))

    plt.title("Figure 3.2: Closed-Loop Student and Counselor Interaction Lifecycle",
              fontsize=13, fontweight="bold", pad=15, color="#1E3A8A")
    plt.tight_layout()
    plt.savefig(os.path.join(wf_dir, "fig3_2_application_workflow.png"), bbox_inches="tight")
    plt.close()

    # -------------------------------------------------------------
    # 3. Figure 3.3: AI/ML Processing Pipeline
    # -------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(12, 5.5), dpi=300)
    ax.axis("off")
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 6)

    pipe_steps = [
        {"title": "1. Multimodal Inputs", "items": ["Chat Utterances", "PHQ-9 / GAD-7", "Screen Time & Apps", "Late-Night Circadian"], "fc": "#EFF6FF", "ec": "#3B82F6"},
        {"title": "2. Preprocessing & NLP", "items": ["Hinglish Normalizer", "3-Token Lookback", "DistilBERT Encoding", "Rolling Z-Score (7-90d)"], "fc": "#F0FDF4", "ec": "#10B981"},
        {"title": "3. Feature Fusion", "items": ["Emotion Prob Vector", "Psychometric Sum", "Circadian Debt Hours", "Entropy Focus Score"], "fc": "#FAF5FF", "ec": "#8B5CF6"},
        {"title": "4. Risk Ensemble", "items": ["Random Forest Classifier", "SMOTE Balancing", "3-Tier Triage (G/Y/R)", "Crisis Safety Override"], "fc": "#FFF7ED", "ec": "#F97316"},
        {"title": "5. Explainability (XAI)", "items": ["TreeSHAP Computation", "Local phi_i Importance", "Clinical Factor Ranks", "Dashboard Waterfall"], "fc": "#FEF2F2", "ec": "#EF4444"}
    ]

    for idx, stp in enumerate(pipe_steps):
        x = 0.4 + idx * 2.3
        box = patches.FancyBboxPatch((x, 0.8), 2.1, 4.2, boxstyle="round,pad=0.1", fc=stp["fc"], ec=stp["ec"], lw=2.0)
        ax.add_patch(box)
        ax.text(x + 1.05, 4.6, stp["title"], ha="center", fontsize=9.0, fontweight="bold", color="#1E293B")
        for j, itm in enumerate(stp["items"]):
            y_itm = 3.8 - j * 0.85
            s_box = patches.FancyBboxPatch((x + 0.15, y_itm), 1.8, 0.65, boxstyle="round,pad=0.06", fc="#FFFFFF", ec=stp["ec"], lw=1.0)
            ax.add_patch(s_box)
            ax.text(x + 1.05, y_itm + 0.32, itm, ha="center", va="center", fontsize=7.5, fontweight="bold", color="#334155")
        
        if idx < len(pipe_steps) - 1:
            ax.annotate("", xy=(x + 2.25, 2.8), xytext=(x + 2.15, 2.8),
                        arrowprops=dict(arrowstyle="->", lw=2.5, color="#475569"))

    plt.title("Figure 3.3: Multimodal Machine Learning & Explainable AI Inference Pipeline",
              fontsize=13, fontweight="bold", pad=15, color="#1E3A8A")
    plt.tight_layout()
    plt.savefig(os.path.join(ml_dir, "fig3_3_ml_pipeline.png"), bbox_inches="tight")
    plt.close()

    # -------------------------------------------------------------
    # 4. Figure 3.4: Emotion Detection Workflow
    # -------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(10, 4.5), dpi=300)
    ax.axis("off")
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 5)

    stages = [
        ("Raw Student Input\n(Text / Voice Check-In)", 1.2),
        ("Dialect & Hinglish\nNegation Preprocessor", 3.4),
        ("DistilBERT Transformer\nEmotion Encoder", 5.6),
        ("6-Emotion Probability\nVector + Safety Gate", 7.8)
    ]
    for label, x in stages:
        box = patches.FancyBboxPatch((x - 0.9, 1.8), 1.8, 1.5, boxstyle="round,pad=0.1", fc="#EFF6FF", ec="#2563EB", lw=1.8)
        ax.add_patch(box)
        ax.text(x, 2.55, label, ha="center", va="center", fontsize=8.5, fontweight="bold", color="#1E3A8A")
        if x < 7.8:
            ax.annotate("", xy=(x + 1.2, 2.55), xytext=(x + 0.95, 2.55), arrowprops=dict(arrowstyle="->", lw=2.5, color="#2563EB"))

    # Crisis bypass branch
    ax.annotate("Crisis Term Detected (e.g. self-harm)", xy=(7.8, 4.0), xytext=(3.4, 3.4),
                arrowprops=dict(arrowstyle="->", lw=2.0, color="#DC2626", linestyle="--"))
    crisis_box = patches.FancyBboxPatch((6.8, 3.8), 2.2, 0.9, boxstyle="round,pad=0.08", fc="#FEF2F2", ec="#DC2626", lw=2.0)
    ax.add_patch(crisis_box)
    ax.text(7.9, 4.25, "Immediate High-Risk Alert\n& 988 Lifeline Routing", ha="center", va="center", fontsize=8.0, fontweight="bold", color="#991B1B")

    plt.title("Figure 3.4: Natural Language Processing & Emotion Detection Architecture",
              fontsize=12, fontweight="bold", pad=12, color="#1E3A8A")
    plt.tight_layout()
    plt.savefig(os.path.join(wf_dir, "fig3_4_emotion_detection_workflow.png"), bbox_inches="tight")
    plt.close()

    # -------------------------------------------------------------
    # 5. Figure 3.5: Mental Wellness Risk Triage Workflow
    # -------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(10, 5), dpi=300)
    ax.axis("off")
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 5)

    tri_box = patches.FancyBboxPatch((0.5, 1.8), 2.5, 1.4, boxstyle="round,pad=0.1", fc="#EFF6FF", ec="#3B82F6", lw=1.8)
    ax.add_patch(tri_box)
    ax.text(1.75, 2.5, "Fused Feature Vector\n(Survey + Telemetry\n+ NLP Emotions)", ha="center", va="center", fontsize=8.5, fontweight="bold", color="#1E3A8A")

    dec_box = patches.FancyBboxPatch((3.8, 1.8), 2.4, 1.4, boxstyle="round,pad=0.1", fc="#FAF5FF", ec="#8B5CF6", lw=1.8)
    ax.add_patch(dec_box)
    ax.text(5.0, 2.5, "Random Forest Classifier\n& Baseline Z-Score\nThreshold Evaluator", ha="center", va="center", fontsize=8.5, fontweight="bold", color="#6D28D9")

    ax.annotate("", xy=(3.7, 2.5), xytext=(3.05, 2.5), arrowprops=dict(arrowstyle="->", lw=2.5, color="#475569"))

    # 3 Risk Tiers
    tiers = [
        ("GREEN TIER (Low Risk)\nSelf-Guided Wellness &\nPsychoeducational Library", 3.8, "#F0FDF4", "#10B981", "#065F46"),
        ("YELLOW TIER (Moderate Risk)\nCounselor Case Watchlist &\nProactive Wellness Tips", 2.0, "#FEF3C7", "#F59E0B", "#92400E"),
        ("RED TIER (Acute Risk / Crisis)\nImmediate Counselor SOS &\nAutomated Helpline Dispatch", 0.2, "#FEF2F2", "#EF4444", "#991B1B")
    ]
    for label, y, fc, ec, tc in tiers:
        t_box = patches.FancyBboxPatch((7.0, y), 2.8, 1.1, boxstyle="round,pad=0.08", fc=fc, ec=ec, lw=1.8)
        ax.add_patch(t_box)
        ax.text(8.4, y + 0.55, label, ha="center", va="center", fontsize=8.0, fontweight="bold", color=tc)
        ax.annotate("", xy=(6.95, y + 0.55), xytext=(6.25, 2.5), arrowprops=dict(arrowstyle="->", lw=2.0, color=ec))

    plt.title("Figure 3.5: Risk Triage Classification & Clinical Escalation Decision Engine",
              fontsize=12, fontweight="bold", pad=12, color="#1E3A8A")
    plt.tight_layout()
    plt.savefig(os.path.join(wf_dir, "fig3_5_risk_triage_workflow.png"), bbox_inches="tight")
    plt.close()

    # -------------------------------------------------------------
    # 6. Figure 3.6: Consent and RBAC Security Architecture
    # -------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(10, 5), dpi=300)
    ax.axis("off")
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 5)

    sec_blocks = [
        ("Student Client\n(Browser / APK)", 0.6, 2.0, "#EFF6FF", "#3B82F6"),
        ("JWT Auth Filter &\nRole Guard (RBAC)", 3.4, 2.0, "#F0FDF4", "#10B981"),
        ("Differential Privacy &\nk-Anonymity Guard (k>=10)", 6.2, 2.0, "#FAF5FF", "#8B5CF6")
    ]
    for label, x, y, fc, ec in sec_blocks:
        b = patches.FancyBboxPatch((x, y), 2.2, 1.4, boxstyle="round,pad=0.1", fc=fc, ec=ec, lw=1.8)
        ax.add_patch(b)
        ax.text(x + 1.1, y + 0.7, label, ha="center", va="center", fontsize=8.5, fontweight="bold", color="#1E293B")
        if x < 6.0:
            ax.annotate("", xy=(x + 2.5, y + 0.7), xytext=(x + 2.25, y + 0.7), arrowprops=dict(arrowstyle="->", lw=2.5, color="#475569"))

    # Roles outputs
    roles = [
        ("STUDENT: Full Self-Data Access & Consent Revocation", 4.0, "#10B981"),
        ("COUNSELOR: De-anonymized Clinical View for Consented Triage", 2.2, "#F59E0B"),
        ("ADMIN: Strictly Aggregated Cohort Metrics (k >= 10)", 0.4, "#6366F1")
    ]
    for r_title, y, col in roles:
        rb = patches.FancyBboxPatch((5.5, y), 4.2, 0.75, boxstyle="round,pad=0.08", fc="#FFFFFF", ec=col, lw=1.5)
        ax.add_patch(rb)
        ax.text(7.6, y + 0.38, r_title, ha="center", va="center", fontsize=7.5, fontweight="bold", color=col)
        ax.annotate("", xy=(5.45, y + 0.38), xytext=(4.5, 2.0), arrowprops=dict(arrowstyle="->", lw=1.5, color=col))

    plt.title("Figure 3.6: Multi-Tenant Role-Based Access Control & Consent Governance",
              fontsize=12, fontweight="bold", pad=12, color="#1E3A8A")
    plt.tight_layout()
    plt.savefig(os.path.join(sec_dir, "fig3_6_security_rbac_consent.png"), bbox_inches="tight")
    plt.close()

    # -------------------------------------------------------------
    # 7. Figure 3.7: Digital Wellbeing Data Flow
    # -------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(10, 4.8), dpi=300)
    ax.axis("off")
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 5)

    dw_steps = [
        ("Device Telemetry\n(PC Foreground Windows\n& Mobile App Packages)", 0.5, 1.8, "#EFF6FF", "#3B82F6"),
        ("Purpose Classifier\n(Studying vs Gaming\nvs Social Media)", 3.8, 1.8, "#F0FDF4", "#10B981"),
        ("Wellbeing Analytics\n(Screen Minutes, Sleep Debt,\nEntropy Focus Score)", 7.1, 1.8, "#FFF7ED", "#F97316")
    ]
    for label, x, y, fc, ec in dw_steps:
        b = patches.FancyBboxPatch((x, y), 2.4, 1.5, boxstyle="round,pad=0.1", fc=fc, ec=ec, lw=1.8)
        ax.add_patch(b)
        ax.text(x + 1.2, y + 0.75, label, ha="center", va="center", fontsize=8.5, fontweight="bold", color="#1E293B")
        if x < 7.0:
            ax.annotate("", xy=(x + 2.75, y + 0.75), xytext=(x + 2.45, y + 0.75), arrowprops=dict(arrowstyle="->", lw=2.5, color="#475569"))

    # Top annotations
    ax.text(5.0, 4.0, "Zero-Permission Fallback: Touch & Active Session Phenotyping",
            ha="center", fontsize=9.0, fontweight="bold", color="#059669",
            bbox=dict(boxstyle="round,pad=0.4", fc="#ECFDF5", ec="#10B981", lw=1.2))

    plt.title("Figure 3.7: Autonomous Digital Wellbeing & Screen-Time Behavioral Data Flow",
              fontsize=12, fontweight="bold", pad=12, color="#1E3A8A")
    plt.tight_layout()
    plt.savefig(os.path.join(arch_dir, "fig3_7_digital_wellbeing_data_flow.png"), bbox_inches="tight")
    plt.close()

    # -------------------------------------------------------------
    # 8. Figure 3.8: Database Entity Relationship Diagram (ERD)
    # -------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(11, 6), dpi=300)
    ax.axis("off")
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 6)

    tables = [
        {"name": "users", "x": 0.8, "y": 3.2, "fields": ["id: UUID [PK]", "email: String [UQ]", "role: UserRole", "full_name: String", "created_at: DateTime"]},
        {"name": "mood_logs", "x": 4.2, "y": 3.8, "fields": ["id: UUID [PK]", "student_id: UUID [FK]", "mood_score: Integer", "emotions: JSONB", "created_at: DateTime"]},
        {"name": "behavioral_logs", "x": 4.2, "y": 0.6, "fields": ["id: UUID [PK]", "student_id: UUID [FK]", "total_screen_time: Int", "top_apps: JSONB", "risk_level: String"]},
        {"name": "clinical_assessments", "x": 7.6, "y": 3.8, "fields": ["id: UUID [PK]", "student_id: UUID [FK]", "type: PHQ9/GAD7", "total_score: Integer", "severity: String"]},
        {"name": "crisis_incidents", "x": 7.6, "y": 0.6, "fields": ["id: UUID [PK]", "student_id: UUID [FK]", "counselor_id: UUID [FK]", "severity: RED", "status: TriageStatus"]}
    ]

    for t in tables:
        h = len(t["fields"]) * 0.32 + 0.5
        box = patches.FancyBboxPatch((t["x"], t["y"]), 2.5, h, boxstyle="round,pad=0.08", fc="#F8FAFC", ec="#334155", lw=1.5)
        ax.add_patch(box)
        header = patches.Rectangle((t["x"], t["y"] + h - 0.45), 2.5, 0.45, fc="#1E3A8A")
        ax.add_patch(header)
        ax.text(t["x"] + 1.25, t["y"] + h - 0.22, t["name"].upper(), ha="center", va="center", fontsize=8.5, fontweight="bold", color="#FFFFFF")
        for idx, f in enumerate(t["fields"]):
            ax.text(t["x"] + 0.15, t["y"] + h - 0.7 - idx * 0.32, f, fontsize=7.2, color="#1E293B")

    # Connect lines
    ax.plot([3.3, 4.2], [4.5, 4.5], color="#2563EB", lw=2)
    ax.plot([3.3, 4.2], [3.5, 1.8], color="#2563EB", lw=2)
    ax.plot([6.7, 7.6], [4.5, 4.5], color="#2563EB", lw=2)
    ax.plot([6.7, 7.6], [1.8, 1.8], color="#DC2626", lw=2)

    plt.title("Figure 3.8: MindGuardAI Relational Database Entity Relationship Diagram (ERD)",
              fontsize=12, fontweight="bold", pad=12, color="#1E3A8A")
    plt.tight_layout()
    plt.savefig(os.path.join(arch_dir, "fig3_8_database_erd.png"), bbox_inches="tight")
    plt.close()

    # -------------------------------------------------------------
    # 9. Figure 3.9: AWS Deployment Architecture
    # -------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(10.5, 5), dpi=300)
    ax.axis("off")
    ax.set_xlim(0, 10.5)
    ax.set_ylim(0, 5)

    # AWS Outer VPC Box
    vpc = patches.FancyBboxPatch((0.4, 0.4), 9.7, 4.0, boxstyle="round,pad=0.15", fc="#F8FAFC", ec="#F59E0B", lw=2.0)
    ax.add_patch(vpc)
    ax.text(0.7, 4.1, "AWS Cloud Infrastructure (EC2 t3.micro | Public IP: 15.207.223.74)", fontsize=10, fontweight="bold", color="#B45309")

    # Containers
    cnts = [
        ("Nginx (Port 80/443)\nReverse Proxy &\nStatic SPA Assets", 0.8, 1.0, "#EFF6FF", "#3B82F6"),
        ("mindguard-api (8000)\nFastAPI Async Core\nREST Controllers", 3.9, 1.0, "#F0FDF4", "#10B981"),
        ("mindguard-db (5432)\nPostgreSQL 15-Alpine\nPersistent Storage", 7.0, 1.0, "#FFF7ED", "#EA580C")
    ]
    for label, x, y, fc, ec in cnts:
        box = patches.FancyBboxPatch((x, y), 2.5, 2.5, boxstyle="round,pad=0.1", fc=fc, ec=ec, lw=1.8)
        ax.add_patch(box)
        ax.text(x + 1.25, y + 1.25, label, ha="center", va="center", fontsize=8.5, fontweight="bold", color="#1E293B")
        if x < 6.5:
            ax.annotate("", xy=(x + 2.8, y + 1.25), xytext=(x + 2.55, y + 1.25), arrowprops=dict(arrowstyle="<->", lw=2.5, color="#475569"))

    plt.title("Figure 3.9: Containerized Docker Architecture & AWS Cloud Deployment",
              fontsize=12, fontweight="bold", pad=12, color="#1E3A8A")
    plt.tight_layout()
    plt.savefig(os.path.join(dep_dir, "fig3_9_aws_deployment_architecture.png"), bbox_inches="tight")
    plt.close()

    # -------------------------------------------------------------
    # 10. Figure 4.1: Actual Confusion Matrix
    # -------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(6, 5), dpi=300)
    cm = np.array([
        [3313, 13, 0],
        [17, 1114, 5],
        [1, 5, 391]
    ])
    classes = ['GREEN\n(Low Risk)', 'YELLOW\n(Moderate)', 'RED\n(Acute Crisis)']
    im = ax.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    ax.set_title('Figure 4.1: Confusion Matrix of Multimodal Risk Classifier\n(N = 4,859 Held-out Samples)',
                 fontweight='bold', fontsize=11, pad=12, color='#1E3A8A')

    tick_marks = np.arange(len(classes))
    ax.set_xticks(tick_marks)
    ax.set_xticklabels(classes, fontweight='bold', fontsize=9)
    ax.set_yticks(tick_marks)
    ax.set_yticklabels(classes, fontweight='bold', fontsize=9)

    thresh = cm.max() / 2.
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            val = f"{cm[i, j]:,}"
            ax.text(j, i, val, ha="center", va="center",
                    color="white" if cm[i, j] > thresh else "#1E293B",
                    fontweight='bold', fontsize=10)

    ax.set_ylabel('True Clinical Risk Tier', fontweight='bold', fontsize=10, labelpad=8)
    ax.set_xlabel('Predicted Clinical Risk Tier', fontweight='bold', fontsize=10, labelpad=8)
    plt.tight_layout()
    plt.savefig(os.path.join(ml_dir, "fig4_1_confusion_matrix.png"), bbox_inches="tight")
    plt.close()

    # -------------------------------------------------------------
    # 11. Figure 4.2: Model Evaluation Charts
    # -------------------------------------------------------------
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 4.5), dpi=300)

    # 1st plot: Ablation study
    models = ["M1: Demographics", "M2: + Surveys", "M3: + NLP Affect", "M4: Full Multimodal"]
    acc = [72.4, 88.1, 94.8, 99.24]
    rec = [64.5, 89.2, 95.1, 98.49]
    x = np.arange(len(models))
    w = 0.35
    ax1.bar(x - w/2, acc, w, label='Accuracy (%)', color='#2563EB', alpha=0.9)
    ax1.bar(x + w/2, rec, w, label='Acute Recall (%)', color='#059669', alpha=0.9)
    ax1.set_ylabel('Performance Metric (%)', fontweight='bold', fontsize=9)
    ax1.set_title('Ablation Study: Incremental Modalities', fontweight='bold', fontsize=10)
    ax1.set_xticks(x)
    ax1.set_xticklabels(models, fontsize=7.5, rotation=15, fontweight='bold')
    ax1.legend(loc='lower right', fontsize=8)
    ax1.set_ylim(50, 110)
    ax1.grid(axis='y', linestyle='--', alpha=0.3)

    # 2nd plot: Class-wise Precision, Recall, F1
    tiers = ['GREEN\n(Low)', 'YELLOW\n(Moderate)', 'RED\n(Acute)']
    prec = [99.46, 98.41, 98.74]
    recall = [99.61, 98.06, 98.49]
    f1 = [99.53, 98.24, 98.61]
    x_t = np.arange(len(tiers))
    w_t = 0.25
    ax2.bar(x_t - w_t, prec, w_t, label='Precision (%)', color='#3B82F6', alpha=0.9)
    ax2.bar(x_t, recall, w_t, label='Recall (%)', color='#10B981', alpha=0.9)
    ax2.bar(x_t + w_t, f1, w_t, label='F1-Score (%)', color='#8B5CF6', alpha=0.9)
    ax2.set_ylabel('Score (%)', fontweight='bold', fontsize=9)
    ax2.set_title('Clinical Class-Wise Classification Metrics', fontweight='bold', fontsize=10)
    ax2.set_xticks(x_t)
    ax2.set_xticklabels(tiers, fontsize=8.0, fontweight='bold')
    ax2.legend(loc='lower right', fontsize=8)
    ax2.set_ylim(85, 105)
    ax2.grid(axis='y', linestyle='--', alpha=0.3)

    plt.suptitle("Figure 4.2: Comprehensive Machine Learning Model Evaluation & Ablation Analysis",
                 fontsize=12, fontweight="bold", y=1.02, color="#1E3A8A")
    plt.tight_layout()
    plt.savefig(os.path.join(ml_dir, "fig4_2_model_evaluation_charts.png"), bbox_inches="tight")
    plt.close()

    # -------------------------------------------------------------
    # 12. Figure 4.8: API Testing Results
    # -------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(8, 4.0), dpi=300)
    endpoints = ["/auth/login", "/chat/message", "/assessments/submit", "/behavioral-features", "/counselor/triage-queue"]
    latencies = [42, 68, 38, 55, 74] # in ms
    y_pos = np.arange(len(endpoints))
    bars = ax.barh(y_pos, latencies, color="#0284C7", alpha=0.85, height=0.55)
    ax.set_yticks(y_pos)
    ax.set_yticklabels(endpoints, fontweight="bold", fontsize=9)
    ax.invert_yaxis()
    ax.set_xlabel("Mean Latency (ms) [Target: < 200 ms]", fontweight="bold", fontsize=9)
    ax.set_xlim(0, 120)
    ax.grid(axis="x", linestyle="--", alpha=0.3)
    for b in bars:
        w_val = b.get_width()
        ax.text(w_val + 2, b.get_y() + b.get_height()/2, f"{w_val} ms (100% Pass)", va="center", fontsize=8.5, fontweight="bold", color="#0369A1")

    plt.title("Figure 4.8: Core API Endpoint Response Time Benchmarks (FastAPI Async)",
              fontsize=11, fontweight="bold", pad=12, color="#1E3A8A")
    plt.tight_layout()
    plt.savefig(os.path.join(test_dir, "fig4_8_api_testing_results.png"), bbox_inches="tight")
    plt.close()

    print("All architectural, workflow, and ML diagrams created successfully!")

if __name__ == "__main__":
    create_all_diagrams()

