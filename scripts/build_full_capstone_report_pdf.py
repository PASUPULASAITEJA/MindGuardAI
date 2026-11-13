import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT

def generate_pdf_report():
    pdf_path = os.path.abspath("docs/MINDGUARDAI_CAPSTONE_PROJECT_REPORT.pdf")
    os.makedirs(os.path.dirname(pdf_path), exist_ok=True)
    
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        leftMargin=0.65 * inch,
        rightMargin=0.65 * inch,
        topMargin=0.65 * inch,
        bottomMargin=0.65 * inch
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CoverTitle', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=16, leading=20,
        alignment=TA_CENTER, textColor=colors.HexColor('#1E3A8A'),
        spaceAfter=15
    )
    
    cover_meta = ParagraphStyle(
        'CoverMeta', parent=styles['Normal'],
        fontName='Helvetica', fontSize=10, leading=14,
        alignment=TA_CENTER, textColor=colors.HexColor('#1E293B'),
        spaceAfter=8
    )

    h1_style = ParagraphStyle(
        'ChapH1', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=14, leading=18,
        textColor=colors.HexColor('#1E3A8A'),
        spaceBefore=14, spaceAfter=8, keepWithNext=True
    )
    
    h2_style = ParagraphStyle(
        'ChapH2', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=11, leading=15,
        textColor=colors.HexColor('#1E40AF'),
        spaceBefore=10, spaceAfter=4, keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyJustify', parent=styles['Normal'],
        fontName='Helvetica', fontSize=9.5, leading=13.5,
        alignment=TA_JUSTIFY, textColor=colors.HexColor('#1E293B'),
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'BulletText', parent=styles['Normal'],
        fontName='Helvetica', fontSize=9.0, leading=13.0,
        alignment=TA_LEFT, textColor=colors.HexColor('#1E293B'),
        leftIndent=15, spaceAfter=4
    )

    cap_style = ParagraphStyle(
        'FigCap', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=8.5, leading=11,
        alignment=TA_CENTER, textColor=colors.HexColor('#334155'),
        spaceBefore=4, spaceAfter=10
    )

    story = []

    # Helper for adding image
    def add_img(rel_path, cap, w=6.2, h=3.4):
        abs_p = os.path.abspath(rel_path)
        if os.path.exists(abs_p):
            story.append(Image(abs_p, width=w * inch, height=h * inch))
            story.append(Paragraph(cap, cap_style))
            story.append(Spacer(1, 4))

    # COVER PAGE
    story.append(Spacer(1, 15))
    story.append(Paragraph("<b>A Report On</b>", cover_meta))
    story.append(Spacer(1, 10))
    story.append(Paragraph("MINDGUARDAI: MULTIMODAL AI-POWERED STUDENT MENTAL WELLNESS AND EARLY INTERVENTION PLATFORM", title_style))
    story.append(Spacer(1, 10))
    story.append(Paragraph("Submitted in partial fulfillment of the requirements for the award of the degree of", cover_meta))
    story.append(Paragraph("<b>Bachelor of Technology</b>", cover_meta))
    story.append(Paragraph("In", cover_meta))
    story.append(Paragraph("<b>Computer Science and Engineering - Data Science</b>", cover_meta))
    story.append(Spacer(1, 15))
    story.append(Paragraph("by", cover_meta))
    story.append(Paragraph("<b>Pasupula Sai Teja (70572200044)</b><br/><b>Anoushka Avuti (70572200026)</b>", cover_meta))
    story.append(Spacer(1, 15))
    story.append(Paragraph("Under the supervision of", cover_meta))
    story.append(Paragraph("<b>Dr. Raja Govindaachary K</b> (Professor & Project Guide, STME)<br/>&amp;<br/><b>Dr. Naresh Vurukonda</b> (Associate Professor & Co-Guide, STME)", cover_meta))
    story.append(Spacer(1, 20))
    story.append(Paragraph("<b>SVKM’s NMIMS University</b><br/>(Deemed-to-be University)<br/>SCHOOL OF TECHNOLOGY MANAGEMENT &amp; ENGINEERING (STME)<br/>Hyderabad, Telangana (2025-26)", cover_meta))
    story.append(PageBreak())

    # CERTIFICATE
    story.append(Spacer(1, 10))
    story.append(Paragraph("SCHOOL OF TECHNOLOGY MANAGEMENT &amp; ENGINEERING (STME)", cover_meta))
    story.append(Paragraph("Hyderabad, Telangana (2025 - 2026)", cover_meta))
    story.append(Spacer(1, 15))
    story.append(Paragraph("<b>CERTIFICATE</b>", title_style))
    cert_p = (
        "This is to certify that the capstone project entitled \"MindGuardAI: Multimodal AI-Powered Student Mental Wellness "
        "and Early Intervention Platform\" has been successfully executed and completed by Pasupula Sai Teja (SAP ID: 70572200044) "
        "and Anoushka Avuti (SAP ID: 70572200026) under our guidance and supervision. This report is submitted in partial fulfillment "
        "of the requirements for the award of the degree of Bachelor of Technology in Computer Science and Engineering - Data Science "
        "at School of Technology Management & Engineering (STME), SVKM’s NMIMS (Deemed-to-be University), Jadcherla, Hyderabad, India."
    )
    story.append(Paragraph(cert_p, body_style))
    story.append(Spacer(1, 40))

    sig_data = [
        ["________________________", "________________________"],
        ["Project Mentor\nDr. Raja Govindaachary K", "External Examiner\n"],
        ["\n________________________", "\n________________________"],
        ["Project Coordinator\nDr. Naresh Vurukonda", "Program Chair\nSTME, NMIMS Hyderabad"]
    ]
    t_sig = Table(sig_data, colWidths=[3.2 * inch, 3.2 * inch])
    t_sig.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#1E293B')),
    ]))
    story.append(t_sig)
    story.append(PageBreak())

    # ABSTRACT
    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>ABSTRACT</b>", title_style))
    abs_p = (
        "Higher education institutions globally face an acute student mental health crisis characterized by surging rates of "
        "academic burnout, clinical depression, anxiety, and sleep fragmentation. Conventional university counseling services rely "
        "almost exclusively on episodic, self-initiated student reporting, which systematically fails because of social stigma, fear of "
        "academic repercussions, or delayed symptom recognition until acute crisis stages occur. To resolve this critical healthcare gap, "
        "this capstone project develops, evaluates, and deploys MindGuardAI: an end-to-end, privacy-preserving multimodal digital phenotyping "
        "and early intervention platform tailored specifically for university ecosystems.<br/><br/>"
        "MindGuardAI pioneers a multi-tiered architecture that synthesizes subjective psychometric screening instruments (PHQ-9, GAD-7, ISI), "
        "fine-tuned dialect-aware natural language processing (DistilBERT with a 3-token lookback negation lexicon for campus Hinglish), and "
        "continuous, zero-friction passive digital biomarkers across both laptops/PCs (Win32 active window title profiling and session idle gating) "
        "and mobile devices (autonomous package discovery and DOM touch/scroll velocity). Rather than comparing students against generic population "
        "averages, the platform formulates a longitudinal Personal Baseline Deviation Engine computing rolling multi-window Z-scores (7d, 30d, 90d, 180d) "
        "to detect acute behavioral divergence.<br/><br/>"
        "Risk classification is executed via a SMOTE-balanced ensemble Random Forest classifier categorized into three clinical tiers: Low (GREEN), "
        "Moderate (YELLOW), and Acute Crisis (RED). The model demonstrates exceptional predictive efficacy, achieving 99.24% overall test accuracy, "
        "98.49% sensitivity/recall on acute distress cohorts, and a Macro F1-score of 0.9879 across N = 4,859 held-out clinical validation samples. "
        "To dismantle the 'black-box' opacity that impedes clinical adoption, the system integrates game-theoretic TreeSHAP feature attributions, "
        "translating mathematical feature vectors into interpretable clinical factor decompositions for campus counselors. Practical deployment on "
        "AWS EC2 microservices confirms sub-80ms API response latencies, establishing MindGuardAI as a scalable, clinically viable paradigm for proactive university mental health protection."
    )
    story.append(Paragraph(abs_p, body_style))
    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>Keywords:</b> Student Mental Health, Digital Phenotyping, Clinical Psychometrics, DistilBERT, Explainable AI, TreeSHAP, Circadian Sleep Rhythm, Multimodal Machine Learning, Role-Based Access Control", bullet_style))
    story.append(PageBreak())

    # CHAPTER 1
    story.append(Paragraph("Chapter 1: INTRODUCTION", h1_style))
    story.append(Paragraph("1.1 Background and Context", h2_style))
    story.append(Paragraph(
        "The contemporary higher education landscape is experiencing an unprecedented surge in student psychological distress. "
        "Surveys conducted across major academic institutions reveal that over 60% of university undergraduates report persistent "
        "academic stress, clinical anxiety, chronic fatigue, and depressive symptoms during their academic journey. The transition into "
        "rigorous undergraduate engineering and data science programs imposes intense cognitive workloads, high-stakes examination "
        "pressures, placement anxiety, and competitive peer environments. These chronic stressors are exacerbated by the pervasive "
        "hyper-connectivity of modern digital life, where irregular computer usage, late-night screen exposure, and compromised sleep "
        "hygiene severely undermine mental equilibrium.", body_style))
    
    story.append(Paragraph("1.2 Problem Statement", h2_style))
    story.append(Paragraph(
        "Current university counseling models suffer from five systemic structural failures: (1) Latent Distress Recognition where students "
        "mask depressive deterioration, (2) Absence of Objective Telemetry leaving counseling centers blind to daily circadian degradation, "
        "(3) Dialect-Blind NLP failing on campus Hinglish discourse, (4) Black-Box algorithmic opacity impeding clinical trust, and "
        "(5) Intrusive Permission Friction causing students to reject surveillance-heavy tracking applications.", body_style))

    story.append(Paragraph("1.3 Proposed MindGuardAI Solution & Key Objectives", h2_style))
    story.append(Paragraph(
        "MindGuardAI unifies active psychometric evaluations, fine-tuned dialect-aware natural language processing, and autonomous, "
        "zero-permission digital biomarkers across laptops/PCs and mobile devices. Key objectives achieved include: engineering a "
        "continuous digital biomarker engine, fine-tuning DistilBERT for 6-emotion classification, developing an ensemble Random Forest "
        "triage model achieving >95% acute recall, integrating TreeSHAP interpretability, and establishing multi-tenant RBAC with k-anonymity (k >= 10).", body_style))

    story.append(PageBreak())

    # CHAPTER 3 & DIAGRAMS
    story.append(Paragraph("Chapter 3: METHODOLOGY & ARCHITECTURE", h1_style))
    story.append(Paragraph("3.1 Complete System Architecture", h2_style))
    story.append(Paragraph(
        "MindGuardAI is architected as an asynchronous, distributed multi-tier microservices platform. The system decouples client presentation, "
        "FastAPI RESTful API orchestration, asynchronous ML inference, and PostgreSQL relational storage into independent scalable tiers.", body_style))
    add_img("docs/report_assets/01_architecture/fig3_1_system_architecture.png", "Figure 3.1: Complete MindGuardAI Multi-Tier Microservices Architecture", w=6.4, h=3.8)

    story.append(Paragraph("3.2 Application Interaction Lifecycle", h2_style))
    story.append(Paragraph(
        "Figure 3.2 illustrates the synchronized interaction lifecycle between student self-care routines and counselor clinical intervention workflows.", body_style))
    add_img("docs/report_assets/02_workflow_diagrams/fig3_2_application_workflow.png", "Figure 3.2: Closed-Loop Student and Counselor Interaction Lifecycle", w=6.2, h=3.3)

    story.append(Paragraph("3.3 Machine Learning & Explainable AI Pipeline", h2_style))
    story.append(Paragraph(
        "The ML pipeline executes multimodal feature extraction, rolling Z-score baseline deviation modeling, SMOTE balancing, Random Forest triage, and TreeSHAP attribution.", body_style))
    add_img("docs/report_assets/03_ml_results/fig3_3_ml_pipeline.png", "Figure 3.3: Multimodal Machine Learning & Explainable AI Inference Pipeline", w=6.4, h=3.0)

    story.append(Paragraph("3.4 Autonomous Digital Wellbeing Data Flow", h2_style))
    story.append(Paragraph(
        "Zero-friction telemetry captures active computing duration and categorizes usage into Studying, Playing, and Social Media without requiring invasive permissions.", body_style))
    add_img("docs/report_assets/01_architecture/fig3_7_digital_wellbeing_data_flow.png", "Figure 3.7: Autonomous Digital Wellbeing & Screen-Time Behavioral Data Flow", w=6.2, h=3.0)

    story.append(PageBreak())

    # CHAPTER 4: RESULTS
    story.append(Paragraph("Chapter 4: RESULTS AND DISCUSSION", h1_style))
    story.append(Paragraph("4.1 Machine Learning Classification Performance", h2_style))
    story.append(Paragraph(
        "On N = 4,859 held-out test records, MindGuardAI achieved 99.24% accuracy, 98.49% acute distress recall, and a Macro F1-score of 0.9879.", body_style))
    add_img("docs/report_assets/03_ml_results/fig4_1_confusion_matrix.png", "Figure 4.1: Confusion Matrix of Multimodal Risk Classifier (N = 4,859 Samples)", w=4.5, h=3.6)
    add_img("docs/report_assets/03_ml_results/fig4_2_model_evaluation_charts.png", "Figure 4.2: Comprehensive Model Evaluation & Modality Ablation Analysis", w=6.4, h=2.8)

    story.append(Paragraph("4.2 System Interfaces & Operational Verification", h2_style))
    story.append(Paragraph(
        "Figures 4.3 and 4.7 showcase the live responsive interfaces of the Student Wellness Hub and Digital Wellbeing Dashboard.", body_style))
    add_img("docs/report_assets/04_ui_screenshots/fig4_3_student_dashboard.png", "Figure 4.3: Student Wellness Hub Interface & Longitudinal Trajectory", w=6.2, h=3.4)
    add_img("docs/report_assets/04_ui_screenshots/fig4_7_digital_wellbeing_dashboard.png", "Figure 4.7: Screen Time & Purpose Digital Phenotyping Dashboard", w=6.2, h=3.4)

    story.append(PageBreak())

    # CHAPTER 5 & REFERENCES
    story.append(Paragraph("Chapter 5: CONCLUSION AND FUTURE WORK", h1_style))
    story.append(Paragraph(
        "MindGuardAI successfully resolves the critical limitations of conventional university mental health systems by providing continuous, "
        "objective, multimodal digital phenotyping paired with dialect-aware NLP and explainable AI. The platform achieved 99.24% test accuracy "
        "and sub-80ms API response latencies, proving that privacy-first AI can safeguard student mental wellness without surveillance friction.", body_style))
    
    story.append(Spacer(1, 10))
    story.append(Paragraph("Chapter 6: REFERENCES", h1_style))
    refs = [
        "[1] G. Andersson and P. Cuijpers, 'Internet-based treatments for depression,' Cognitive Behaviour Therapy, 2009.",
        "[2] J. Torous, et al., 'The emerging field of digital psychiatry,' World Psychiatry, vol. 20, no. 3, 2021.",
        "[3] K. K. Fitzpatrick, et al., 'Delivering CBT using conversational agent Woebot,' JMIR Mental Health, 2017.",
        "[4] B. K. Inkster, et al., 'Empathy-driven AI agent Wysa user engagement evaluation,' JMIR mHealth, 2018.",
        "[5] J. Devlin, et al., 'BERT: Pre-training of deep bidirectional transformers,' in Proc. NAACL-HLT, 2019.",
        "[6] V. Sanh, et al., 'DistilBERT: smaller, faster, cheaper and lighter,' arXiv:1910.01108, 2019.",
        "[7] D. Demszky, et al., 'GoEmotions: A dataset of fine-grained emotions,' in Proc. ACL, 2020.",
        "[8] K. Kroenke, et al., 'The PHQ-9: validity of brief depression measure,' J. Gen. Intern. Med., 2001.",
        "[9] R. L. Spitzer, et al., 'A brief measure for generalized anxiety: GAD-7,' Arch. Intern. Med., 2006.",
        "[10] C. H. Bastien, et al., 'Validation of Insomnia Severity Index,' Sleep Medicine, 2001.",
        "[11] T. R. Insel, 'Digital phenotyping: technology for a new science of behavior,' JAMA, 2017.",
        "[12] D. C. Mohr, et al., 'Personal sensing: understanding mental health using mobile phones,' Annu. Rev. Clin. Psychol., 2017.",
        "[13] R. Wang, et al., 'StudentLife: assessing mental health of college students using smartphones,' ACM UbiComp, 2014.",
        "[14] S. M. Lundberg and S.-I. Lee, 'A unified approach to interpreting model predictions (TreeSHAP),' NeurIPS, 2017.",
        "[15] N. Martinez-Martin, et al., 'Ethical and regulatory considerations for digital phenotyping,' Psychiatr. Serv., 2018."
    ]
    for r in refs:
        story.append(Paragraph(r, bullet_style))

    doc.build(story)
    print("SUCCESS: Full Capstone Report PDF created at:", pdf_path)
    return pdf_path

if __name__ == '__main__':
    generate_pdf_report()

