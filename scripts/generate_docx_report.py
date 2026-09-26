import os
import matplotlib.pyplot as plt
import numpy as np
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def generate_charts(output_dir):
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Methodology Workflow Diagram
    fig, ax = plt.subplots(figsize=(9, 1.8), dpi=300)
    ax.axis("off")
    
    boxes = [
        "1. Data Ingestion\n(Biomarkers, Surveys, Text)",
        "2. Preprocessing\n(Z-Scores, Tokenizer)",
        "3. Hybrid Inference\n(DistilBERT + RF)",
        "4. Risk & TreeSHAP\n(Risk Tiers, phi_i XAI)",
        "5. Triage Console\n(Alerts, Interventions)"
    ]
    
    for i, text in enumerate(boxes):
        ax.text(
            i * 2.2 + 1.0, 0.5, text,
            ha="center", va="center",
            bbox=dict(boxstyle="round,pad=0.6", fc="#F0F4F8", ec="#1E3A8A", lw=1.5),
            fontsize=9, fontweight="bold", color="#1E293B"
        )
        if i < len(boxes) - 1:
            ax.annotate(
                "", xy=(i * 2.2 + 2.05, 0.5), xytext=(i * 2.2 + 1.85, 0.5),
                arrowprops=dict(arrowstyle="->", lw=2, color="#2563EB")
            )
            
    ax.set_xlim(0, 10.8)
    ax.set_ylim(0, 1)
    workflow_img_path = os.path.join(output_dir, "workflow_diagram.png")
    plt.tight_layout()
    plt.savefig(workflow_img_path, bbox_inches="tight")
    plt.close()
    
    # 2. Sprint Progress Dual-Axis Chart
    sprints = ["Sprint 1", "Sprint 2", "Sprint 3", "Sprint 4"]
    accuracy = [72.4, 84.6, 94.1, 99.24]
    fpr = [18.2, 11.5, 5.8, 0.84]
    
    fig, ax1 = plt.subplots(figsize=(7, 3.5), dpi=300)
    
    color = "#1E40AF"
    ax1.set_xlabel("Development Sprint", fontweight="bold", fontsize=10, labelpad=8)
    ax1.set_ylabel("Detection Accuracy (%)", color=color, fontweight="bold", fontsize=10)
    bars = ax1.bar(sprints, accuracy, color="#3B82F6", width=0.45, alpha=0.85, label="Detection Accuracy (%)")
    ax1.tick_params(axis="y", labelcolor=color)
    ax1.set_ylim(0, 115)
    ax1.grid(axis="y", linestyle="--", alpha=0.3)
    
    for bar in bars:
        yval = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width()/2.0, yval + 2, f"{yval}%", ha="center", va="bottom", fontsize=8.5, fontweight="bold", color="#1E3A8A")
        
    ax2 = ax1.twinx()
    color = "#DC2626"
    ax2.set_ylabel("False Positive Rate (%)", color=color, fontweight="bold", fontsize=10)
    line = ax2.plot(sprints, fpr, color="#DC2626", marker="o", linewidth=2.5, markersize=7, label="False Positive Rate (%)")
    ax2.tick_params(axis="y", labelcolor=color)
    ax2.set_ylim(0, 25)
    
    for x, y in zip(sprints, fpr):
        ax2.annotate(f"{y}%", (x, y), textcoords="offset points", xytext=(0, 8), ha="center", fontsize=8.5, fontweight="bold", color="#991B1B")
        
    plt.title("Interim Results Across Development Sprints", fontweight="bold", fontsize=11, pad=12)
    sprint_img_path = os.path.join(output_dir, "sprint_results.png")
    plt.tight_layout()
    plt.savefig(sprint_img_path, bbox_inches="tight")
    plt.close()
    
    return workflow_img_path, sprint_img_path

def create_document():
    doc = Document()
    
    # Page setup - 0.75 in margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)
        
    # Styles
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = RGBColor(30, 41, 59)
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(4)
    
    # Header Title
    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_run = title_p.add_run("MindGuardAI: Multimodal AI-Driven Student Mental Wellness & Early Intervention Platform\n")
    title_run.bold = True
    title_run.font.size = Pt(15)
    title_run.font.color.rgb = RGBColor(15, 23, 42)
    
    sub_run = title_p.add_run("Interim Report : Extended Abstract — Capstone Project Review-2\n")
    sub_run.bold = True
    sub_run.font.size = Pt(11.5)
    sub_run.font.color.rgb = RGBColor(30, 58, 138)
    
    meta_run = title_p.add_run("Student Name(s): [Student 1, Student 2, Student 3]\nMentors: [Mentor Name 1], [Mentor Name 2], [Designation, Department]\n")
    meta_run.font.size = Pt(10)
    meta_run.font.italic = True
    meta_run.font.color.rgb = RGBColor(71, 85, 105)
    
    # Divider line
    p_div = doc.add_paragraph()
    p_div.paragraph_format.space_after = Pt(6)
    p_div_border = parse_xml(r'<w:pBdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:bottom w:val="single" w:sz="12" w:space="1" w:color="1E3A8A"/></w:pBdr>')
    p_div._p.get_or_add_pPr().append(p_div_border)
    
    # Section Heading Helper
    def add_heading(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(8)
        h.paragraph_format.space_after = Pt(3)
        h.paragraph_format.keep_with_next = True
        run = h.add_run(text)
        run.bold = True
        run.font.size = Pt(12)
        run.font.color.rgb = RGBColor(15, 23, 42)
        return h

    # 1. Abstract
    add_heading("Abstract")
    p_abs = doc.add_paragraph(
        "Modern higher education institutions face an escalating student mental health crisis characterized by severe academic burnout, anxiety, and depressive distress. Traditional counseling models rely entirely on self-referrals, which often fail due to social stigma, denial, or delayed symptom recognition until crisis stages. MindGuardAI is a privacy-first, multimodal observability and early intervention system designed to detect, classify, and triage student mental distress in real-time. By continuously fusing active student reflections (via fine-tuned DistilBERT NLP), validated clinical psychometrics (PHQ-9, GAD-7, PSS-10), and passive circadian digital biomarkers (late-night screen exposure, rest fragmentation), the platform establishes a longitudinal Personal Baseline Deviation Engine. Predictions are classified via an ensemble Random Forest risk model, explained using TreeSHAP game-theoretic feature attribution, and presented on role-based portals for students and university counselors. MindGuardAI achieves 99.24% test accuracy and >95% recall on acute clinical distress cases, enabling closed-loop preventive care before crises escalate."
    )
    p_abs.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    
    # 2. Objectives
    add_heading("Objectives")
    objectives = [
        ("Multimodal Continuous Monitoring: ", "Ingest and synchronize objective digital biomarkers (circadian sleep rhythm, late-night screen time) with subjective psychometric assessments without invasive surveillance."),
        ("Dialect-Aware Clinical NLP: ", "Fine-tune a Transformer-based language model (DistilBERT) paired with a 3-token lookback negation lexicon to classify 6 emotional affects and Hinglish campus stress intents (e.g., 'exam stress', 'placement tension', 'padhai nahi ho rahi')."),
        ("Transparent Explainable AI (XAI): ", "Implement TreeSHAP (\u03c6\u1d62) feature attribution to decompose composite risk scores into interpretable clinical factors, eliminating 'black-box' skepticism among counselors."),
        ("Longitudinal Personal Baselines: ", "Compute dynamic rolling Z-score deviations (7d, 30d, 90d, 180d) against each student\u2019s historical normal rather than static population averages."),
        ("Privacy-Preserving Institutional Governance: ", "Enforce strict k-anonymity (k \u2265 10) on administrative dashboards to protect student identities while exposing department-level mental health trends.")
    ]
    for bold_prefix, text in objectives:
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_after = Pt(2)
        brun = bp.add_run(bold_prefix)
        brun.bold = True
        brun.font.color.rgb = RGBColor(15, 23, 42)
        bp.add_run(text)
        
    # 3. Modules Table
    add_heading("Modules")
    modules = [
        ("M1", "Data Ingestion & Telemetry", "Captures passive circadian digital biomarkers (screen time, late-night usage T_late between 12 AM–5 AM) and daily self-reported mood reflections."),
        ("M2", "Preprocessing & Clinical Psychometrics", "Normalizes telemetry, scales features, and administers standardized questionnaires (PHQ-9, GAD-7, PSS-10, ISI) while logging cognitive response latency."),
        ("M3", "NLP Emotion & Intent Classifier", "Runs fine-tuned DistilBERT for 6-emotion classification (Joy, Sadness, Anxiety, Anger, Fear, Surprise) and includes a crisis negation safety guardian."),
        ("M4", "Risk Inference & TreeSHAP Engine", "Ensemble Random Forest maps fused vectors to risk tiers (GREEN, YELLOW, RED), while TreeSHAP computes local feature attributions (\u03c6\u1d62)."),
        ("M5", "Observatory & Triage Dashboard", "Interactive dual-portal system providing self-care tools for students and clinical triage, automated casefiles, and emergency SOS routing for counselors.")
    ]
    
    mod_table = doc.add_table(rows=1, cols=3)
    mod_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    mod_table.autofit = False
    
    col_widths = [Inches(0.6), Inches(2.3), Inches(4.1)]
    
    # Header Row
    hdr_cells = mod_table.rows[0].cells
    hdr_titles = ["ID", "Module", "Description"]
    for i, title in enumerate(hdr_titles):
        hdr_cells[i].text = title
        hdr_cells[i].width = col_widths[i]
        set_cell_background(hdr_cells[i], "1E3A8A")
        set_cell_margins(hdr_cells[i], 120, 120, 150, 150)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER if i == 0 else WD_ALIGN_PARAGRAPH.LEFT
        run = p.runs[0]
        run.bold = True
        run.font.color.rgb = RGBColor(255, 255, 255)
        run.font.size = Pt(10)
        
    for mid, mname, mdesc in modules:
        row_cells = mod_table.add_row().cells
        for i, text in enumerate([mid, mname, mdesc]):
            row_cells[i].text = text
            row_cells[i].width = col_widths[i]
            set_cell_margins(row_cells[i], 80, 80, 120, 120)
            p = row_cells[i].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if i == 0 else WD_ALIGN_PARAGRAPH.LEFT
            if i == 0:
                p.runs[0].bold = True
            p.runs[0].font.size = Pt(9.5)
            
    # Set borders for table
    for row in mod_table.rows:
        for cell in row.cells:
            tcPr = cell._tc.get_or_add_tcPr()
            borders = parse_xml(r'<w:tcBorders xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/><w:left w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/><w:right w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/></w:tcBorders>')
            tcPr.append(borders)
            
    # 4. Methodology
    add_heading("Methodology")
    p_meth = doc.add_paragraph(
        "The system follows a five-stage pipeline: incoming passive biomarkers and clinical questionnaire inputs are normalized, passed through the NLP emotion and behavioral inference engine, and the resulting predictions are evaluated by the TreeSHAP explainability module, which decomposes risk factors before routing actionable alerts to the counselor triage dashboard, as shown below."
    )
    p_meth.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    
    # Generate charts
    img_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "docs", "assets"))
    wf_img, sprint_img = generate_charts(img_dir)
    
    # Add Workflow Image
    p_wf = doc.add_paragraph()
    p_wf.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_wf.paragraph_format.space_before = Pt(4)
    p_wf.paragraph_format.space_after = Pt(2)
    p_wf.add_run().add_picture(wf_img, width=Inches(6.8))
    
    cap1 = doc.add_paragraph()
    cap1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap1.paragraph_format.space_after = Pt(6)
    crun1 = cap1.add_run("Fig. 1: Methodology / system workflow of the MindGuardAI Platform")
    crun1.italic = True
    crun1.font.size = Pt(9)
    crun1.font.color.rgb = RGBColor(71, 85, 105)
    
    # 5. Implementation
    add_heading("Implementation")
    p_imp = doc.add_paragraph(
        "The prototype is implemented using a Python 3.11 asynchronous FastAPI backend integrated with a modern React 18 + TypeScript + Vite web dashboard for visualization. The risk detection module uses an ensemble Random Forest classifier combined with fine-tuned DistilBERT transformer sequence classification and TreeSHAP explainability; results are persisted in an asynchronous PostgreSQL database for longitudinal personal baseline analysis. Current implementation covers Modules M1–M4 in full, with M5 (dual-interface dashboard) at an advanced prototype stage supporting real-time counselor triage alerts, filterable casefiles, and student self-care recommendations."
    )
    p_imp.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    
    # 6. Interim Results
    add_heading("Interim Results")
    
    res_table = doc.add_table(rows=1, cols=4)
    res_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    res_table.autofit = False
    
    r_col_widths = [Inches(1.8), Inches(1.3), Inches(1.4), Inches(2.5)]
    r_hdr_cells = res_table.rows[0].cells
    r_hdr_titles = ["Milestone", "Detection Acc.", "False Positive Rate", "Notes"]
    
    for i, title in enumerate(r_hdr_titles):
        r_hdr_cells[i].text = title
        r_hdr_cells[i].width = r_col_widths[i]
        set_cell_background(r_hdr_cells[i], "1E3A8A")
        set_cell_margins(r_hdr_cells[i], 100, 100, 120, 120)
        p = r_hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER if i in [1, 2] else WD_ALIGN_PARAGRAPH.LEFT
        run = p.runs[0]
        run.bold = True
        run.font.color.rgb = RGBColor(255, 255, 255)
        run.font.size = Pt(9.5)
        
    sprint_data = [
        ("Sprint 1 (Baseline)", "72.4%", "18.2%", "Rule-based lexicon & basic PHQ-9 survey ingestion."),
        ("Sprint 2 (NLP Engine)", "84.6%", "11.5%", "DistilBERT emotion fine-tuning & Hinglish intent parser."),
        ("Sprint 3 (ML Ensemble)", "94.1%", "5.8%", "Random Forest classifier + SMOTE oversampling."),
        ("Sprint 4 (Current / XAI)", "99.24%", "0.84%", "TreeSHAP attribution, N=24,292 test validation (>95% High-Risk Recall).")
    ]
    
    for s_name, s_acc, s_fpr, s_notes in sprint_data:
        row_cells = res_table.add_row().cells
        for i, text in enumerate([s_name, s_acc, s_fpr, s_notes]):
            row_cells[i].text = text
            row_cells[i].width = r_col_widths[i]
            set_cell_margins(row_cells[i], 70, 70, 100, 100)
            p = row_cells[i].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if i in [1, 2] else WD_ALIGN_PARAGRAPH.LEFT
            p.runs[0].font.size = Pt(9)
            if i == 0:
                p.runs[0].bold = True
                
    for row in res_table.rows:
        for cell in row.cells:
            tcPr = cell._tc.get_or_add_tcPr()
            borders = parse_xml(r'<w:tcBorders xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/><w:left w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/><w:right w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/></w:tcBorders>')
            tcPr.append(borders)
            
    # Add Sprint Chart
    p_sp = doc.add_paragraph()
    p_sp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sp.paragraph_format.space_before = Pt(6)
    p_sp.paragraph_format.space_after = Pt(2)
    p_sp.add_run().add_picture(sprint_img, width=Inches(5.5))
    
    cap2 = doc.add_paragraph()
    cap2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap2.paragraph_format.space_after = Pt(8)
    crun2 = cap2.add_run("Fig. 2: Detection accuracy and false-positive rate across sprints")
    crun2.italic = True
    crun2.font.size = Pt(9)
    crun2.font.color.rgb = RGBColor(71, 85, 105)
    
    # 7. References
    add_heading("References (Base Papers)")
    references = [
        "Gratch, J., et al. (2014). 'The Distress Analysis Interview Corpus (DAIC-WOZ): An Audio-Visual Corpus for Mental Health Assessment.' Proceedings of LREC, pp. 3120–3126.",
        "Lundberg, S. M., & Lee, S.-I. (2017). 'A Unified Approach to Interpreting Model Predictions.' Advances in Neural Information Processing Systems (NeurIPS 30), pp. 4765–4774.",
        "Kroenke, K., Spitzer, R. L., & Williams, J. B. (2001). 'The PHQ-9: Validity of a Brief Depression Severity Measure.' Journal of General Internal Medicine, 16(9), 606–613.",
        "Spitzer, R. L., Kroenke, K., et al. (2006). 'A Brief Measure for Assessing Generalized Anxiety Disorder: The GAD-7.' Archives of Internal Medicine, 166(10), 1092–1097.",
        "Sanh, V., Debut, L., et al. (2019). 'DistilBERT, a Distilled Version of BERT: Smaller, Faster, Cheaper and Lighter.' arXiv preprint arXiv:1910.01108."
    ]
    for i, ref in enumerate(references, 1):
        rp = doc.add_paragraph()
        rp.paragraph_format.space_after = Pt(2)
        rp.paragraph_format.left_indent = Inches(0.25)
        num_run = rp.add_run(f"[{i}] ")
        num_run.bold = True
        rp.add_run(ref)
        rp.runs[0].font.size = Pt(9)
        rp.runs[1].font.size = Pt(9)
        
    # Save output docx
    output_docx_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "docs", "CAPSTONE_REVIEW_2_REPORT.docx"))
    doc.save(output_docx_path)
    print(f"Report DOCX successfully generated at: {output_docx_path}")

if __name__ == "__main__":
    create_document()
