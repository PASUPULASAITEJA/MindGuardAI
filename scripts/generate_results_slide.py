import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from PIL import Image

def generate_slide():
    output_dir = "docs/report_assets"
    os.makedirs(output_dir, exist_ok=True)
    png_path = os.path.join(output_dir, "nmims_results_slide.png")
    svg_path = os.path.join(output_dir, "nmims_results_slide.svg")

    fig = plt.figure(figsize=(16, 9), dpi=300)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.axis('off')
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 9)

    # Color Palette matching NMIMS Capstone standard
    c_maroon = "#9E1B27"
    c_card_border = "#B82E38"
    c_text_dark = "#1E293B"
    c_white = "#FFFFFF"
    c_line = "#1E293B"

    # Background Canvas
    ax.add_patch(patches.Rectangle((0, 0), 16, 9, fc=c_white))

    # Top Header Banner
    ax.add_patch(patches.Rectangle((0, 7.8), 16, 1.2, fc=c_maroon))
    ax.text(8.0, 8.4, "Results", ha="center", va="center", color=c_white, fontsize=32, fontweight="bold", fontfamily="serif")

    # Logo Placement (Upper Left)
    logo_path = os.path.join(output_dir, "nmims_logo_crop.png")
    if os.path.exists(logo_path):
        logo_img = Image.open(logo_path)
        ax.imshow(logo_img, extent=[0.3, 2.7, 7.55, 8.95], zorder=10)
    else:
        # Fallback badge
        ax.add_patch(patches.Rectangle((0.4, 7.55), 2.5, 1.45, fc=c_white, ec="#CBD5E1", lw=1, zorder=5))
        ax.text(1.65, 8.5, "SVKM'S", ha="center", va="center", color="#334155", fontsize=9, fontweight="bold")
        ax.text(1.65, 8.15, "NMIMS", ha="center", va="center", color=c_maroon, fontsize=18, fontweight="bold")
        ax.text(1.65, 7.8, "Deemed to be UNIVERSITY", ha="center", va="center", color="#475569", fontsize=7.5, fontweight="bold")

    # Bottom Summary Banner
    ax.add_patch(patches.Rectangle((0.8, 0.45), 14.4, 0.65, fc=c_maroon, ec="none"))
    summary_text = "99.28% accuracy   ·   98.49% recall on high-risk (RED) cases   ·   0.84% false alarms   ·   4,859 held-out students"
    ax.text(8.0, 0.77, summary_text, ha="center", va="center", color=c_white, fontsize=13.5, fontweight="bold")

    # Central Timeline Axis Line
    ax.plot([1.2, 14.8], [4.6, 4.6], color=c_line, lw=2.2, zorder=1)

    # 8 Milestone Nodes Definition: (x, is_top, pill_label, title_label, big_metric, sub_metric)
    nodes = [
        (2.1, False, "Weeks 1–4", "Architecture & Security", "21 models", "secure schemas, JWT auth,\nconsent"),
        (3.8, True,  "Weeks 5–8", "Passive Telemetry Agent", "0 keystrokes", "only app categories and late-\nnight use"),
        (5.5, False, "Sprint 1",   "Baseline Detection", "72.4%", "accuracy, 18.2% false alarms"),
        (7.2, True,  "Sprint 2",   "NLP Engine", "84.6%", "DistilBERT + Hinglish\nintents"),
        (8.9, False, "Sprint 3",   "ML Ensemble", "94.1%", "Random Forest + SMOTE\nbalancing"),
        (10.6, True, "Sprint 4",   "Explainable Triage", "99.28%", "TreeSHAP; false alarms\ndown to 0.84%"),
        (12.3, False, "Weeks 13–15", "Multi-Portal Interface", "3 portals", "student, counselor and admin"),
        (14.0, True, "Weeks 16+",  "Testing & Pilot", "74 tests", "automated; campus pilot is\nthe next gate")
    ]

    card_w = 2.45
    card_h = 1.35

    for x, is_top, pill, title, metric, subtext in nodes:
        if is_top:
            # Top branch connector line
            ax.plot([x, x], [4.6, 5.15], color=c_line, lw=2.2, zorder=1)
            # Capsule Pill
            pill_patch = patches.FancyBboxPatch((x - 0.7, 5.0), 1.4, 0.38, boxstyle="round,pad=0.06", fc=c_maroon, ec="none", zorder=3)
            ax.add_patch(pill_patch)
            ax.text(x, 5.19, pill, ha="center", va="center", color=c_white, fontsize=9.5, fontweight="bold", zorder=4)
            # Stage Title
            ax.text(x, 5.65, title, ha="center", va="center", color=c_text_dark, fontsize=11, fontweight="bold")
            # Metric Card
            cy = 6.0
            card_patch = patches.Rectangle((x - card_w/2, cy), card_w, card_h, fc=c_white, ec=c_card_border, lw=1.5, zorder=2)
            ax.add_patch(card_patch)
            ax.text(x, cy + 0.90, metric, ha="center", va="center", color=c_maroon, fontsize=17.5, fontweight="bold")
            ax.text(x, cy + 0.40, subtext, ha="center", va="center", color=c_text_dark, fontsize=8.8, linespacing=1.2)
        else:
            # Bottom branch connector line
            ax.plot([x, x], [4.6, 4.05], color=c_line, lw=2.2, zorder=1)
            # Capsule Pill
            pill_patch = patches.FancyBboxPatch((x - 0.7, 3.75), 1.4, 0.38, boxstyle="round,pad=0.06", fc=c_maroon, ec="none", zorder=3)
            ax.add_patch(pill_patch)
            ax.text(x, 3.94, pill, ha="center", va="center", color=c_white, fontsize=9.5, fontweight="bold", zorder=4)
            # Stage Title
            ax.text(x, 3.42, title, ha="center", va="center", color=c_text_dark, fontsize=11, fontweight="bold")
            # Metric Card
            cy = 1.65
            card_patch = patches.Rectangle((x - card_w/2, cy), card_w, card_h, fc=c_white, ec=c_card_border, lw=1.5, zorder=2)
            ax.add_patch(card_patch)
            ax.text(x, cy + 0.90, metric, ha="center", va="center", color=c_maroon, fontsize=17.5, fontweight="bold")
            ax.text(x, cy + 0.40, subtext, ha="center", va="center", color=c_text_dark, fontsize=8.8, linespacing=1.2)

    plt.savefig(png_path, dpi=300)
    plt.savefig(svg_path)
    plt.close()
    print(f"Generated high-resolution presentation slide at:\n  PNG: {png_path}\n  SVG: {svg_path}")

if __name__ == "__main__":
    generate_slide()
