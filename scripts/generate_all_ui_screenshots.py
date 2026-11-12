import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

def generate_all_uis():
    out_dir = os.path.abspath("docs/report_assets/04_ui_screenshots")
    os.makedirs(out_dir, exist_ok=True)

    # 1. Figure 4.4: Counselor Dashboard Screenshot
    fig, ax = plt.subplots(figsize=(14, 8.5), dpi=300)
    ax.axis("off")
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 9)

    ax.add_patch(patches.Rectangle((0, 0), 14, 9, fc="#0B0F19"))
    ax.add_patch(patches.Rectangle((0, 8.1), 14, 0.9, fc="#111827", ec="#1F2937", lw=1))
    ax.text(0.6, 8.5, "MindGuard AI", fontsize=14, fontweight="bold", color="#EF4444", va="center")
    ax.text(2.3, 8.5, "|  Clinical Counselor Triage Console", fontsize=11, color="#9CA3AF", va="center")
    
    pill = patches.FancyBboxPatch((11.0, 8.25), 2.5, 0.6, boxstyle="round,pad=0.08", fc="#1F2937", ec="#374151")
    ax.add_patch(pill)
    ax.text(12.25, 8.55, "Dr. Naresh Vurukonda (Counselor)", fontsize=8.0, color="#F3F4F6", ha="center", va="center", fontweight="bold")

    # Sidebar
    ax.add_patch(patches.Rectangle((0, 0), 2.4, 8.1, fc="#0F172A", ec="#1E293B", lw=1))
    c_menus = ["Triage Queue", "Active Student Cases", "Crisis Alert Feed", "Clinical Reports", "Calendar & Bookings", "Settings"]
    for i, m in enumerate(c_menus):
        y_m = 7.3 - i * 0.7
        is_act = (i == 0)
        ax.add_patch(patches.FancyBboxPatch((0.2, y_m), 2.0, 0.5, boxstyle="round,pad=0.06", fc="#991B1B" if is_act else "#0F172A"))
        ax.text(0.4, y_m + 0.25, m, fontsize=8.5, fontweight="bold" if is_act else "normal", color="#FCA5A5" if is_act else "#94A3B8", va="center")

    # Main Header
    ax.text(2.8, 7.6, "Clinical Risk Triage & Intervention Console", fontsize=15, fontweight="bold", color="#F8FAFC")
    ax.text(2.8, 7.25, "Active monitoring of student cohort mental wellness, baseline deviations, and priority alerts.", fontsize=9, color="#94A3B8")

    # 3 Summary Stat Cards
    stats = [
        ("TOTAL ACTIVE COHORT", "4,859", "Enrolled Students", "#3B82F6"),
        ("ACUTE INTERVENTION QUEUE", "14", "Immediate Attention Required (RED)", "#EF4444"),
        ("MODERATE WATCHLIST", "87", "Proactive Monitoring (YELLOW)", "#F59E0B")
    ]
    for idx, (st, val, sub, col) in enumerate(stats):
        x = 2.8 + idx * 3.65
        ax.add_patch(patches.FancyBboxPatch((x, 5.7), 3.45, 1.35, boxstyle="round,pad=0.1", fc="#1E293B", ec="#334155", lw=1.5))
        ax.text(x + 0.25, 6.75, st, fontsize=8.0, fontweight="bold", color="#94A3B8")
        ax.text(x + 0.25, 6.25, val, fontsize=18, fontweight="bold", color=col)
        ax.text(x + 0.25, 5.9, sub, fontsize=7.5, color="#CBD5E1")

    # Triage Queue Table
    ax.add_patch(patches.FancyBboxPatch((2.8, 0.4), 10.8, 5.0, boxstyle="round,pad=0.1", fc="#1E293B", ec="#334155", lw=1.5))
    ax.text(3.1, 5.05, "PRIORITY CLINICAL TRIAGE QUEUE (HELD-OUT VALIDATION SAMPLES)", fontsize=9.5, fontweight="bold", color="#F8FAFC")

    headers = ["Student Name", "SAP ID", "PHQ-9", "GAD-7", "Circadian Debt", "TreeSHAP Dominant Factor", "Risk Level", "Action"]
    x_cols = [3.0, 4.8, 5.9, 6.7, 7.6, 9.1, 11.2, 12.5]
    for h, xc in zip(headers, x_cols):
        ax.text(xc, 4.65, h, fontsize=8.0, fontweight="bold", color="#94A3B8")

    rows = [
        ("Student #1084", "70572200184", "19/27", "16/21", "3.8 hrs", "Late-Night Doom-Scrolling (+0.42)", "RED", "Urgent Outreach"),
        ("Student #2419", "70572200419", "17/27", "14/21", "2.9 hrs", "Consecutive Sleep Disruption (+0.38)", "RED", "Schedule Session"),
        ("Student #3192", "70572200192", "13/27", "12/21", "1.6 hrs", "Exam Anxiety Intent Spikes (+0.29)", "YELLOW", "Proactive Check"),
        ("Student #0482", "70572200082", "11/27", "10/21", "1.2 hrs", "Prolonged Multitasking Entropy (+0.24)", "YELLOW", "Self-Care Push"),
        ("Student #4012", "70572200312", "04/27", "03/21", "0.0 hrs", "Balanced Academic Focus (-0.35)", "GREEN", "Stable Review")
    ]
    for r_idx, r in enumerate(rows):
        y_r = 4.15 - r_idx * 0.7
        bg_col = "#2A1215" if r[6] == "RED" else ("#2A2412" if r[6] == "YELLOW" else "#14241B")
        ax.add_patch(patches.Rectangle((2.9, y_r - 0.15), 10.6, 0.55, fc=bg_col, ec="#334155", lw=0.5))
        for val, xc in zip(r, x_cols):
            tc = "#EF4444" if val == "RED" else ("#F59E0B" if val == "YELLOW" else ("#10B981" if val == "GREEN" else "#F1F5F9"))
            if xc == 12.5:
                ax.add_patch(patches.FancyBboxPatch((xc - 0.1, y_r - 0.1), 1.1, 0.45, boxstyle="round,pad=0.04", fc="#3B82F6"))
                ax.text(xc + 0.45, y_r + 0.12, val, fontsize=7.0, color="#FFFFFF", fontweight="bold", ha="center")
            else:
                ax.text(xc, y_r + 0.12, val, fontsize=7.5, color=tc, fontweight="bold" if r[6] == "RED" else "normal")

    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "fig4_4_counselor_dashboard.png"), bbox_inches="tight")
    plt.close()

    # 2. Figure 4.5: AI Wellness Chatbot
    fig, ax = plt.subplots(figsize=(12, 8), dpi=300)
    ax.axis("off")
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 8)
    ax.add_patch(patches.Rectangle((0, 0), 12, 8, fc="#0B0F19"))
    ax.add_patch(patches.Rectangle((0, 7.2), 12, 0.8, fc="#111827", ec="#1F2937", lw=1))
    ax.text(0.6, 7.6, "MindGuard AI Companion", fontsize=13, fontweight="bold", color="#60A5FA", va="center")
    ax.text(3.5, 7.6, "|  Confidential Dialect-Aware Emotional Support", fontsize=9.5, color="#9CA3AF", va="center")

    # Safety Guardrail Top Banner
    ax.add_patch(patches.FancyBboxPatch((0.6, 6.3), 10.8, 0.7, boxstyle="round,pad=0.08", fc="#FEF2F2", ec="#EF4444", lw=1.2))
    ax.text(0.8, 6.65, "Clinical Safety Guardian Active: Confidential, HIPAA/FERPA compliant. 24/7 National Crisis Hotline: 988", fontsize=8.0, fontweight="bold", color="#991B1B")

    # Chat Dialogue Bubbles
    bubbles = [
        ("user", "Hello... I am feeling extremely overwhelmed with my NMIMS mid-term submissions and placement interviews. Bas lagta hai padhai nahi ho rahi mujhse.", 5.0, "#1E293B", "#F8FAFC", 0.6),
        ("bot", "I hear you, Sai Teja. Exam periods combined with placement stress can feel incredibly heavy, and thinking 'padhai nahi ho rahi' is a very common reaction when your cognitive load is maxed out. Let's take a deep breath together. Have you had a chance to step away from your screen today, even for 10 minutes?", 3.4, "#1E3A8A", "#DBEAFE", 2.2),
        ("user", "Not really... I've been on my laptop since morning working on code and reports.", 2.4, "#1E293B", "#F8FAFC", 0.6),
        ("bot", "Your screen-time tracker shows 4h 55m of intensive focus today. Your mind deserves a quick pause. Would you like to try a 3-minute 4-7-8 breathing exercise, or shall we review the campus counseling drop-in hours?", 1.0, "#1E3A8A", "#DBEAFE", 2.2)
    ]
    for sender, txt, y, fc, tc, x in bubbles:
        w = 8.5
        h = 1.1 if len(txt) > 100 else 0.7
        b = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.1", fc=fc, ec="#334155" if sender=="user" else "#3B82F6", lw=1.2)
        ax.add_patch(b)
        ax.text(x + 0.2, y + h - 0.25, "Student" if sender=="user" else "MindGuard AI (Empathetic Agent)", fontsize=7.5, fontweight="bold", color="#60A5FA" if sender=="user" else "#93C5FD")
        ax.text(x + 0.2, y + 0.2, txt, fontsize=7.8, color=tc, wrap=True)

    # Input Box at Bottom
    ax.add_patch(patches.FancyBboxPatch((0.6, 0.2), 10.8, 0.65, boxstyle="round,pad=0.08", fc="#1E293B", ec="#475569"))
    ax.text(0.9, 0.52, "Type your reflection in English or Hinglish... (e.g., 'feeling stressed about exams')", fontsize=8.0, color="#64748B")

    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "fig4_5_ai_chatbot.png"), bbox_inches="tight")
    plt.close()

    # 3. Figure 4.6: Assessment Interface (PHQ-9 / GAD-7)
    fig, ax = plt.subplots(figsize=(12, 8), dpi=300)
    ax.axis("off")
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 8)
    ax.add_patch(patches.Rectangle((0, 0), 12, 8, fc="#0B0F19"))
    ax.add_patch(patches.Rectangle((0, 7.2), 12, 0.8, fc="#111827", ec="#1F2937", lw=1))
    ax.text(0.6, 7.6, "Standardized Clinical Psychometrics", fontsize=13, fontweight="bold", color="#60A5FA", va="center")
    ax.text(4.4, 7.6, "|  Patient Health Questionnaire (PHQ-9) Assessment", fontsize=9.5, color="#9CA3AF", va="center")

    # Assessment Card
    ax.add_patch(patches.FancyBboxPatch((0.8, 0.8), 10.4, 6.0, boxstyle="round,pad=0.12", fc="#1E293B", ec="#334155", lw=1.5))
    ax.text(1.2, 6.3, "Over the last 2 weeks, how often have you been bothered by any of the following problems?", fontsize=10, fontweight="bold", color="#F8FAFC")
    ax.text(1.2, 5.95, "Question 4 of 9: Feeling tired or having little energy", fontsize=9, color="#60A5FA", fontweight="bold")

    # Likert Options
    opts = [
        ("0 - Not at all", 5.0, False),
        ("1 - Several days", 4.1, True), # Selected
        ("2 - More than half the days", 3.2, False),
        ("3 - Nearly every day", 2.3, False)
    ]
    for opt_txt, y_opt, is_sel in opts:
        fc_o = "#1E3A8A" if is_sel else "#0F172A"
        ec_o = "#3B82F6" if is_sel else "#334155"
        tc_o = "#FFFFFF" if is_sel else "#94A3B8"
        b_o = patches.FancyBboxPatch((1.2, y_opt), 9.6, 0.65, boxstyle="round,pad=0.08", fc=fc_o, ec=ec_o, lw=1.5)
        ax.add_patch(b_o)
        ax.text(1.5, y_opt + 0.32, opt_txt, fontsize=9.0, fontweight="bold" if is_sel else "normal", color=tc_o, va="center")
        if is_sel:
            ax.text(10.2, y_opt + 0.32, "[Selected]", fontsize=8.0, fontweight="bold", color="#60A5FA", va="center")

    # Cognitive Response Latency Telemetry Note
    ax.text(1.2, 1.4, "Telemetry Biomarker: Cognitive item latency: 3.42s | Dynamic baseline deviation Z = +0.12 (Normal)", fontsize=7.8, color="#10B981")

    # Next Button
    b_nxt = patches.FancyBboxPatch((9.2, 0.95), 1.6, 0.5, boxstyle="round,pad=0.06", fc="#2563EB", ec="#1D4ED8")
    ax.add_patch(b_nxt)
    ax.text(10.0, 1.2, "Next Item ->", fontsize=8.5, fontweight="bold", color="#FFFFFF", ha="center", va="center")

    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "fig4_6_assessment_interface.png"), bbox_inches="tight")
    plt.close()

    # 4. Figure 4.7: Digital Wellbeing Dashboard
    fig, ax = plt.subplots(figsize=(13, 8), dpi=300)
    ax.axis("off")
    ax.set_xlim(0, 13)
    ax.set_ylim(0, 8)
    ax.add_patch(patches.Rectangle((0, 0), 13, 8, fc="#0B0F19"))
    ax.add_patch(patches.Rectangle((0, 7.2), 13, 0.8, fc="#111827", ec="#1F2937", lw=1))
    ax.text(0.6, 7.6, "Screen Time & Digital Phenotyping", fontsize=13, fontweight="bold", color="#60A5FA", va="center")
    ax.text(4.2, 7.6, "|  Dual-Platform Active Session & Application Analytics", fontsize=9.5, color="#9CA3AF", va="center")

    # Status Banner
    ax.add_patch(patches.FancyBboxPatch((0.6, 6.2), 11.8, 0.75, boxstyle="round,pad=0.08", fc="#064E3B", ec="#059669", lw=1.2))
    ax.text(0.8, 6.65, "Dual-Platform Autonomous Telemetry Active  |  Zero-Permission Mode Active  |  Mobile & PC Parity", fontsize=8.5, fontweight="bold", color="#A7F3D0")

    # 4 Stat Cards
    sc_items = [
        ("TOTAL ACTIVE TODAY", "4h 55m", "Laptop & Mobile", "#3B82F6"),
        ("DOMINANT PURPOSE", "Studying (54%)", "Academic Focus", "#10B981"),
        ("CIRCADIAN SLEEP DEBT", "0 mins", "Normal 12-4 AM Rest", "#8B5CF6"),
        ("SHANNON FOCUS SCORE", "84.2 / 100", "Low Multi-Task Entropy", "#F59E0B")
    ]
    for idx, (st, val, sub, col) in enumerate(sc_items):
        x = 0.6 + idx * 3.0
        ax.add_patch(patches.FancyBboxPatch((x, 4.8), 2.85, 1.25, boxstyle="round,pad=0.1", fc="#1E293B", ec="#334155", lw=1.5))
        ax.text(x + 0.2, 5.75, st, fontsize=7.5, fontweight="bold", color="#94A3B8")
        ax.text(x + 0.2, 5.3, val, fontsize=14, fontweight="bold", color=col)
        ax.text(x + 0.2, 5.0, sub, fontsize=7.0, color="#CBD5E1")

    # Top Applications Breakdown Table
    ax.add_patch(patches.FancyBboxPatch((0.6, 0.4), 11.8, 4.2, boxstyle="round,pad=0.1", fc="#1E293B", ec="#334155", lw=1.5))
    ax.text(0.9, 4.25, "TOP APPLICATIONS & PURPOSE CLASSIFICATION (AUTONOMOUS TELEMETRY)", fontsize=9.0, fontweight="bold", color="#F8FAFC")

    app_headers = ["Application / Process", "Platform", "Duration", "Share (%)", "Purpose Category", "Times Opened"]
    app_x = [0.9, 4.0, 5.8, 7.2, 8.8, 11.0]
    for ah, ax_pos in zip(app_headers, app_x):
        ax.text(ax_pos, 3.85, ah, fontsize=8.0, fontweight="bold", color="#94A3B8")

    app_rows = [
        ("Visual Studio Code (code.exe)", "Laptop / PC", "125 mins", "42%", "Studying (Academic)", "14 opens"),
        ("Google Classroom (com.google.android.apps.classroom)", "Mobile APK", "110 mins", "37%", "Studying (Academic)", "18 opens"),
        ("Google Chrome (Research Portals & Papers)", "Laptop / PC", "75 mins", "25%", "Studying (Academic)", "22 opens"),
        ("YouTube (Lectures & Media)", "Dual-Platform", "60 mins", "20%", "Playing (Entertainment)", "12 opens"),
        ("WhatsApp & Discord (Batch Discussions)", "Dual-Platform", "55 mins", "18%", "Social Media & Chat", "38 opens"),
        ("Adobe Acrobat Reader (Study Notes PDF)", "Dual-Platform", "30 mins", "10%", "Studying (Academic)", "8 opens")
    ]
    for r_idx, ar in enumerate(app_rows):
        y_ar = 3.4 - r_idx * 0.52
        ax.add_patch(patches.Rectangle((0.7, y_ar - 0.1), 11.6, 0.45, fc="#0F172A", ec="#334155", lw=0.5))
        for val, ax_pos in zip(ar, app_x):
            tc = "#10B981" if "Studying" in val else ("#F59E0B" if "Playing" in val else ("#3B82F6" if "Social" in val else "#F1F5F9"))
            ax.text(ax_pos, y_ar + 0.12, val, fontsize=7.5, color=tc, fontweight="bold" if "Studying" in val else "normal")

    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "fig4_7_digital_wellbeing_dashboard.png"), bbox_inches="tight")
    plt.close()

    # 5. Additional Screenshots: Landing, Login, Registration, Consent, Case File, Mood Checkin
    # Landing Page
    fig, ax = plt.subplots(figsize=(12, 7.5), dpi=300)
    ax.axis("off")
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 7.5)
    ax.add_patch(patches.Rectangle((0, 0), 12, 7.5, fc="#070A11"))
    ax.add_patch(patches.Rectangle((0, 6.7), 12, 0.8, fc="#0F172A", ec="#1E293B", lw=1))
    ax.text(0.8, 7.1, "MindGuard AI", fontsize=14, fontweight="bold", color="#60A5FA")
    ax.text(10.0, 7.1, "Login | Register", fontsize=9, color="#F8FAFC", fontweight="bold")
    ax.text(6.0, 5.2, "Calm Intelligence for Student Mental Wellness", fontsize=18, fontweight="bold", color="#F8FAFC", ha="center")
    ax.text(6.0, 4.6, "AI-driven digital phenotyping, early intervention, and 24/7 confidential clinical triage.", fontsize=10, color="#94A3B8", ha="center")
    ax.add_patch(patches.FancyBboxPatch((4.8, 3.8), 2.4, 0.6, boxstyle="round,pad=0.08", fc="#2563EB"))
    ax.text(6.0, 4.1, "Enter Student Portal", fontsize=9, fontweight="bold", color="#FFFFFF", ha="center")
    # 3 Features
    f_items = [("Multimodal Phenotyping", "Integrates passive screen time, sleep rhythm & study habits."),
               ("Dialect-Aware NLP", "Understands Hinglish campus stress & academic burnout."),
               ("Explainable AI (XAI)", "TreeSHAP transparency for clinical counselor confidence.")]
    for i, (ft, fd) in enumerate(f_items):
        x_f = 0.8 + i * 3.6
        ax.add_patch(patches.FancyBboxPatch((x_f, 1.2), 3.2, 1.8, boxstyle="round,pad=0.1", fc="#111827", ec="#1F2937", lw=1.5))
        ax.text(x_f + 0.2, 2.5, ft, fontsize=9.5, fontweight="bold", color="#60A5FA")
        ax.text(x_f + 0.2, 1.8, fd, fontsize=8.0, color="#CBD5E1", wrap=True)
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "screenshot_landing_page.png"), bbox_inches="tight")
    plt.close()

    # Login Page
    fig, ax = plt.subplots(figsize=(10, 7), dpi=300)
    ax.axis("off")
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7)
    ax.add_patch(patches.Rectangle((0, 0), 10, 7, fc="#070A11"))
    ax.add_patch(patches.FancyBboxPatch((2.5, 1.0), 5.0, 5.2, boxstyle="round,pad=0.15", fc="#111827", ec="#1F2937", lw=2))
    ax.text(5.0, 5.6, "Sign In to MindGuard AI", fontsize=14, fontweight="bold", color="#F8FAFC", ha="center")
    ax.text(5.0, 5.2, "University Roster Authentication Portal", fontsize=8.5, color="#94A3B8", ha="center")
    
    # Inputs
    ax.text(3.0, 4.6, "Email Address", fontsize=8.0, fontweight="bold", color="#CBD5E1")
    ax.add_patch(patches.FancyBboxPatch((3.0, 4.0), 4.0, 0.5, boxstyle="round,pad=0.06", fc="#1F2937", ec="#374151"))
    ax.text(3.2, 4.25, "pasupulasai.teja37@nmims.in", fontsize=8.0, color="#F8FAFC")
    
    ax.text(3.0, 3.5, "Password", fontsize=8.0, fontweight="bold", color="#CBD5E1")
    ax.add_patch(patches.FancyBboxPatch((3.0, 2.9), 4.0, 0.5, boxstyle="round,pad=0.06", fc="#1F2937", ec="#374151"))
    ax.text(3.2, 3.15, "••••••••••••", fontsize=10, color="#F8FAFC")
    
    ax.add_patch(patches.FancyBboxPatch((3.0, 1.9), 4.0, 0.6, boxstyle="round,pad=0.08", fc="#2563EB"))
    ax.text(5.0, 2.2, "Authenticate & Enter", fontsize=9.0, fontweight="bold", color="#FFFFFF", ha="center")
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "screenshot_login_page.png"), bbox_inches="tight")
    plt.close()

    # Privacy & Consent
    fig, ax = plt.subplots(figsize=(11, 7), dpi=300)
    ax.axis("off")
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 7)
    ax.add_patch(patches.Rectangle((0, 0), 11, 7, fc="#0B0F19"))
    ax.add_patch(patches.Rectangle((0, 6.2), 11, 0.8, fc="#111827", ec="#1F2937", lw=1))
    ax.text(0.6, 6.6, "Privacy & Consent Management Center", fontsize=13, fontweight="bold", color="#60A5FA", va="center")
    
    ax.add_patch(patches.FancyBboxPatch((0.8, 0.6), 9.4, 5.2, boxstyle="round,pad=0.12", fc="#1E293B", ec="#334155", lw=1.5))
    ax.text(1.2, 5.4, "Student Data Sovereignty & Granular Consent Controls", fontsize=11, fontweight="bold", color="#F8FAFC")
    ax.text(1.2, 5.0, "You have full ownership of your mental health data under HIPAA/FERPA guidelines.", fontsize=8.5, color="#94A3B8")

    switches = [
        ("Passive Screen-Time Telemetry Tracking", "Allows background categorization of study vs leisure computing.", True),
        ("Natural Language Sentiment Extraction", "Processes check-in messages for 6-emotion affect analysis.", True),
        ("Confidential Clinical Counselor Escalation", "Shares alert summaries with campus counselors if acute risk occurs.", True),
        ("De-Identified Institutional Research Aggregation", "Contributes to k-anonymized (k >= 10) university wellness analytics.", True)
    ]
    for i, (st, sd, val) in enumerate(switches):
        y_s = 4.2 - i * 0.95
        ax.add_patch(patches.FancyBboxPatch((1.2, y_s), 8.6, 0.75, boxstyle="round,pad=0.08", fc="#0F172A", ec="#334155", lw=1.0))
        ax.text(1.4, y_s + 0.45, st, fontsize=8.5, fontweight="bold", color="#F8FAFC")
        ax.text(1.4, y_s + 0.2, sd, fontsize=7.5, color="#94A3B8")
        # Toggle
        ax.add_patch(patches.FancyBboxPatch((8.8, y_s + 0.2), 0.8, 0.35, boxstyle="round,pad=0.04", fc="#10B981"))
        ax.text(9.2, y_s + 0.37, "ON", fontsize=7.0, fontweight="bold", color="#FFFFFF", ha="center")
    
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "screenshot_student_consent.png"), bbox_inches="tight")
    plt.close()

    print("All UI screenshots generated successfully!")

if __name__ == '__main__':
    generate_all_uis()

def generate_remaining_uis():
    out_dir = os.path.abspath("docs/report_assets/04_ui_screenshots")
    
    # 6. Counselor Student Case File (TreeSHAP Waterfall)
    fig, ax = plt.subplots(figsize=(12, 8), dpi=300)
    ax.axis("off")
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 8)
    ax.add_patch(patches.Rectangle((0, 0), 12, 8, fc="#0B0F19"))
    ax.add_patch(patches.Rectangle((0, 7.2), 12, 0.8, fc="#111827", ec="#1F2937", lw=1))
    ax.text(0.6, 7.6, "Student Clinical Case File: Student #1084 (SAP: 70572200184)", fontsize=13, fontweight="bold", color="#EF4444", va="center")
    
    ax.add_patch(patches.FancyBboxPatch((0.6, 4.8), 10.8, 2.2, boxstyle="round,pad=0.1", fc="#1E293B", ec="#334155", lw=1.5))
    ax.text(0.9, 6.6, "LONGITUDINAL CLINICAL VITALS & MULTIMODAL METRICS", fontsize=9.0, fontweight="bold", color="#94A3B8")
    ax.text(0.9, 6.0, "Clinical Risk Tier: ACUTE DISTRESS (RED)  |  Overall Score: 24/100 (High Risk)", fontsize=10.0, fontweight="bold", color="#EF4444")
    ax.text(0.9, 5.5, "PHQ-9 Depression: 19/27 (Moderately Severe)  |  GAD-7 Anxiety: 16/21 (Severe Anxiety)", fontsize=8.5, color="#CBD5E1")
    ax.text(0.9, 5.1, "Screen Time: 7h 45m  |  Circadian Debt: 3.8 hrs (Late-night 12 AM - 4:30 AM continuous activity)", fontsize=8.5, color="#FCA5A5", fontweight="bold")

    # TreeSHAP Factor Waterfall Chart
    ax.add_patch(patches.FancyBboxPatch((0.6, 0.5), 10.8, 4.0, boxstyle="round,pad=0.1", fc="#1E293B", ec="#334155", lw=1.5))
    ax.text(0.9, 4.1, "TREESHAP CLINICAL ATTRIBUTION WATERFALL (phi_i FACTOR DECOMPOSITION)", fontsize=9.0, fontweight="bold", color="#F8FAFC")
    
    factors = [
        ("Circadian Sleep Disruption (12-4 AM)", +0.42, "#EF4444"),
        ("PHQ-9 Item 9 (Suicidal Ideation / Fatigue)", +0.38, "#EF4444"),
        ("Affect NLP: Hopelessness / Anxiety Spikes", +0.29, "#F59E0B"),
        ("Baseline Velocity Deviation (Z = +2.85)", +0.21, "#F59E0B"),
        ("Academic Routine Stability Factor", -0.18, "#10B981")
    ]
    for idx, (f_name, phi_val, bar_col) in enumerate(factors):
        y_f = 3.4 - idx * 0.6
        ax.text(0.9, y_f + 0.15, f_name, fontsize=8.0, fontweight="bold", color="#E2E8F0")
        w_bar = abs(phi_val) * 8.0
        x_bar = 6.2 if phi_val > 0 else (6.2 - w_bar)
        ax.add_patch(patches.Rectangle((x_bar, y_f), w_bar, 0.35, fc=bar_col, ec=bar_col))
        ax.text(x_bar + w_bar + 0.15 if phi_val > 0 else x_bar - 0.7, y_f + 0.1, f"{phi_val:+.2f}", fontsize=8.0, fontweight="bold", color=bar_col)

    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "screenshot_counselor_student_case.png"), bbox_inches="tight")
    plt.close()

    # 7. Mood Check-in
    fig, ax = plt.subplots(figsize=(10, 7), dpi=300)
    ax.axis("off")
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7)
    ax.add_patch(patches.Rectangle((0, 0), 10, 7, fc="#0B0F19"))
    ax.add_patch(patches.FancyBboxPatch((1.5, 0.8), 7.0, 5.4, boxstyle="round,pad=0.15", fc="#1E293B", ec="#334155", lw=1.5))
    ax.text(5.0, 5.7, "How are you feeling right now?", fontsize=13, fontweight="bold", color="#F8FAFC", ha="center")
    ax.text(5.0, 5.3, "Select your primary mood state and add an optional reflection", fontsize=8.5, color="#94A3B8", ha="center")
    
    emojis = [("Rad / Great", 4.3, "#10B981"), ("Good / Content", 3.5, "#34D399"), ("Meh / Okay", 2.7, "#60A5FA"), ("Stressed / Anxious", 1.9, "#F59E0B"), ("Down / Sad", 1.1, "#EF4444")]
    for em_txt, y_em, col in emojis:
        is_sel = ("Meh" in em_txt)
        ax.add_patch(patches.FancyBboxPatch((2.2, y_em), 5.6, 0.6, boxstyle="round,pad=0.06", fc="#1E3A8A" if is_sel else "#0F172A", ec=col if is_sel else "#334155", lw=1.5 if is_sel else 0.8))
        ax.text(2.6, y_em + 0.28, em_txt, fontsize=8.5, fontweight="bold" if is_sel else "normal", color="#FFFFFF" if is_sel else "#94A3B8")
    
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "screenshot_mood_checkin.png"), bbox_inches="tight")
    plt.close()

    # 8. Mood History
    fig, ax = plt.subplots(figsize=(11, 6.5), dpi=300)
    ax.axis("off")
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 6.5)
    ax.add_patch(patches.Rectangle((0, 0), 11, 6.5, fc="#0B0F19"))
    ax.add_patch(patches.FancyBboxPatch((0.8, 0.6), 9.4, 5.3, boxstyle="round,pad=0.12", fc="#1E293B", ec="#334155", lw=1.5))
    ax.text(1.2, 5.4, "Longitudinal Mood & Affect History", fontsize=12, fontweight="bold", color="#F8FAFC")
    ax.text(1.2, 5.0, "30-Day Emotion Trajectory across Joy, Sadness, Anxiety, Anger, and Surprise", fontsize=8.5, color="#94A3B8")
    
    # Bar chart for emotions
    em_names = ["Joy", "Calm", "Anxiety", "Sadness", "Fatigue", "Surprise"]
    em_vals = [42, 35, 18, 9, 14, 6] # percent
    for i, (en, ev) in enumerate(zip(em_names, em_vals)):
        x_b = 1.4 + i * 1.4
        h_b = ev * 0.08
        col_b = "#10B981" if en in ["Joy", "Calm"] else ("#F59E0B" if en in ["Anxiety", "Fatigue"] else "#EF4444")
        ax.add_patch(patches.Rectangle((x_b, 1.2), 0.9, h_b, fc=col_b, ec="#334155", lw=0.8))
        ax.text(x_b + 0.45, 1.2 + h_b + 0.15, f"{ev}%", ha="center", fontsize=8.0, fontweight="bold", color="#F8FAFC")
        ax.text(x_b + 0.45, 0.85, en, ha="center", fontsize=8.0, color="#94A3B8")

    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "screenshot_mood_history.png"), bbox_inches="tight")
    plt.close()

    # 9. Notifications
    fig, ax = plt.subplots(figsize=(10, 6), dpi=300)
    ax.axis("off")
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6)
    ax.add_patch(patches.Rectangle((0, 0), 10, 6, fc="#0B0F19"))
    ax.add_patch(patches.FancyBboxPatch((1.0, 0.6), 8.0, 4.8, boxstyle="round,pad=0.12", fc="#1E293B", ec="#334155", lw=1.5))
    ax.text(1.4, 4.9, "Clinical Alerts & System Notifications", fontsize=11, fontweight="bold", color="#F8FAFC")
    
    n_items = [
        ("Break Reminder: 20-20-20 Rule", "You have been in active continuous screen focus for 45 minutes. Step away for 20 seconds.", "12 mins ago", "#3B82F6"),
        ("Circadian Habit Commendation", "Zero late-night computing observed between 12 AM and 4 AM today. Great job maintaining rest balance!", "2 hrs ago", "#10B981"),
        ("Weekly Clinical Check-in Due", "Your periodic PHQ-9 wellness assessment is ready for review.", "1 day ago", "#F59E0B")
    ]
    for i, (nt, nd, tm, c) in enumerate(n_items):
        y_n = 3.6 - i * 1.2
        ax.add_patch(patches.FancyBboxPatch((1.4, y_n), 7.2, 0.95, boxstyle="round,pad=0.06", fc="#0F172A", ec=c, lw=1.2))
        ax.text(1.7, y_n + 0.62, nt, fontsize=8.5, fontweight="bold", color="#F8FAFC")
        ax.text(1.7, y_n + 0.35, nd, fontsize=7.5, color="#94A3B8")
        ax.text(7.8, y_n + 0.62, tm, fontsize=7.0, color="#64748B", ha="right")

    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "screenshot_notifications.png"), bbox_inches="tight")
    plt.close()

    # 10. Registration
    fig, ax = plt.subplots(figsize=(10, 7), dpi=300)
    ax.axis("off")
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7)
    ax.add_patch(patches.Rectangle((0, 0), 10, 7, fc="#070A11"))
    ax.add_patch(patches.FancyBboxPatch((2.2, 0.6), 5.6, 5.8, boxstyle="round,pad=0.15", fc="#111827", ec="#1F2937", lw=2))
    ax.text(5.0, 5.9, "Create MindGuard AI Account", fontsize=13, fontweight="bold", color="#F8FAFC", ha="center")
    ax.text(5.0, 5.5, "University Student Wellness Enrollment", fontsize=8.0, color="#94A3B8", ha="center")

    fields = [("Full Name", "Pasupula Sai Teja"), ("University Email", "pasupulasai.teja37@nmims.in"), ("SAP ID / Roll No", "70572200026"), ("Academic Department", "B.Tech CSE - Data Science"), ("Password", "••••••••••••")]
    for i, (fn, fv) in enumerate(fields):
        y_f = 4.7 - i * 0.72
        ax.text(2.6, y_f + 0.25, fn, fontsize=7.5, fontweight="bold", color="#CBD5E1")
        ax.add_patch(patches.FancyBboxPatch((2.6, y_f - 0.2), 4.8, 0.4, boxstyle="round,pad=0.04", fc="#1F2937", ec="#374151"))
        ax.text(2.8, y_f, fv, fontsize=7.5, color="#F8FAFC")

    ax.add_patch(patches.FancyBboxPatch((2.6, 0.8), 4.8, 0.5, boxstyle="round,pad=0.06", fc="#2563EB"))
    ax.text(5.0, 1.05, "Enroll & Accept Privacy Terms", fontsize=8.5, fontweight="bold", color="#FFFFFF", ha="center")

    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "screenshot_registration_page.png"), bbox_inches="tight")
    plt.close()

if __name__ == '__main__':
    generate_remaining_uis()
