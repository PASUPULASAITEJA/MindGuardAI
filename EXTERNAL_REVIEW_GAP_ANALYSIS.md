# MindGuardAI — External Review Gap Analysis & Action Plan

**Project:** MindGuardAI — Multimodal AI-Driven Student Mental Wellness & Early Intervention Platform  
**Audit Date:** 2026-10-10  
**Status:** Audit Complete — Remediation & Implementation Phase  

---

## 1. Executive Summary of Audit

An audit of the existing MindGuardAI codebase was conducted to evaluate the technical reality behind reported metrics, dataset pipelines, baseline calculations, privacy controls, and clinical claims against the 5 external reviewer comments.

### Key Audit Findings:
1. **Source of 99.24% Accuracy & >95% Recall**:
   - The repository contains an actual psychometric dataset of **24,292 rows** in `Dataset/phq_gad/` (`phq9.csv`, `gad7.csv`, `isi.csv`, `pss.csv`, `demographic.csv`).
   - The Random Forest model (`phq_gad_risk_model.joblib`) was trained in `scripts/train_phq_gad.py` to classify clinical risk tiers (`GREEN`, `YELLOW`, `RED`) from itemized questionnaire scores (`phq_q1-q9`, `gad_q1-q7`, `pss_total`, `isi_total`, latency).
   - **Gap Identified**: The 99.24% accuracy represents the model's ability to reconstruct the clinical risk threshold criteria from the underlying questionnaire items. In production/real-world terms, this is a deterministic psychometric risk estimator rather than an end-to-end multi-modal diagnostic accuracy. This distinction was not clearly communicated in previous documentation.
2. **DistilBERT Emotion Model**:
   - The model binary `backend/app/ml/models/distilbert_v1.pt` and inference code exist in `backend/app/ml/inference.py`, supported by a fallback clinical lexicon.
   - **Gap Identified**: Training script `backend/app/ml/pipelines/train_emotion.py` lacked a standardized, reproducible dataset ingestion and split validation script.
3. **Multimodal Feature Contributions (Ablation Study)**:
   - Multimodal inputs (NLP sentiment, psychometric scores, and digital circadian biomarkers) are fused in `behavioral_service.py` and `trend_service.py`.
   - **Gap Identified**: No formal, reproducible ablation experiment was saved with comparative evaluation metrics across isolated and combined modalities.
4. **Personal Baseline Deviation Engine**:
   - Baseline calculation existed in `backend/app/services/trend_service.py` with 7d, 30d, 90d, 180d windows and confidence indicators (`ESTABLISHING`, `MODERATE`, `HIGH`).
   - **Gap Identified**: Needed formal handling for cold-start `INITIALIZING` states, zero-variance safeguards, outlier clipping, and missing telemetry timestamps.
5. **Consent, Security, Retention, and $k \ge 10$ Privacy**:
   - Consent models exist in `backend/app/models/` and basic suppression existed in `analytics.py`.
   - **Gap Identified**: $k \ge 10$ suppression needed strict enforcement by distinct student IDs rather than raw log row counts, with complementary cell suppression and comprehensive documentation (`DATASET_CARD.md`, `SECURITY_MODEL.md`, etc.).

---

## 2. Review Gap Matrix & Remediation Plan

| # | Reviewer Requirement | Current Implementation Status | Evidence in Codebase | Missing Functionality / Gap | Remediation Action | Files to Modify / Create |
|---|----------------------|-------------------------------|----------------------|------------------------------|--------------------|---------------------------|
| **1** | **Dataset Transparency & Reproducible Training Pipeline** | Partially Implemented | `Dataset/phq_gad/*.csv`, `scripts/train_phq_gad.py`, `phq_gad_metrics.json` | Missing formal `DATASET_CARD.md`, standardized validation/preprocessing scripts, and explicit DistilBERT training pipeline. | Create dataset documentation, reproducible ML scripts, and config files with fixed random seeds and participant-level splitting. | `docs/DATASET_CARD.md`, `backend/app/ml/data/`, `backend/app/ml/train/`, `backend/app/ml/config/` |
| **2** | **Class-Wise Metrics, Confusion Matrix & Acute Distress Recall** | Partially Implemented | `phq_gad_metrics.json` has accuracy, macro F1, weighted F1, and class counts. | Missing normalized confusion matrix plots, per-class PR curves, threshold sensitivity analysis, and standalone evaluation report. | Build `evaluate_models.py`, generate CSV metrics, plot raw and normalized confusion matrices, and document acute distress recall formula. | `reports/model_evaluation.md`, `reports/classification_metrics.csv`, `reports/*.png`, `backend/app/ml/evaluate/` |
| **3** | **Multimodal Ablation Study** | Prototype Implemented | Fused formulas in `behavioral_service.py` & `inference.py` | Missing automated 7-configuration ablation benchmark script and empirical comparison report. | Implement `ablation_study.py`, evaluate 7 modality subsets, and generate ablation report and comparison charts. | `backend/app/ml/experiments/ablation_study.py`, `reports/ablation_results.csv`, `reports/ablation_analysis.md` |
| **4** | **Personal Baseline Deviation Engine & Missing Data** | Implemented in Service | `trend_service.py` calculates rolling averages and deltas across 7d, 30d, 90d, 180d. | Lacked explicit zero-variance guard, robust Z-score clamping, cold-start `INITIALIZING` status, and comprehensive unit tests. | Upgrade baseline service with mathematical edge-case guards, write comprehensive specification doc, and build automated tests. | `backend/app/services/trend_service.py`, `docs/PERSONAL_BASELINE_ENGINE.md`, `backend/tests/test_personal_baseline_engine.py` |
| **5** | **Consent, Privacy, Retention, Escalation & $k \ge 10$ Anonymity** | Partially Implemented | RBAC middleware, basic consent tables, emergency helplines modal, `analytics.py` | Aggregation queries need strict unique student counting for $k \ge 10$; missing formal retention policy and security documentation. | Enforce strict $k \ge 10$ distinct student suppression in APIs; author 5 security & privacy markdown specifications; build negative security tests. | `backend/app/api/v1/analytics.py`, `docs/PRIVACY_AND_CONSENT.md`, `docs/SECURITY_MODEL.md`, `docs/DATA_RETENTION_POLICY.md`, `docs/EMERGENCY_ESCALATION.md`, `docs/K_ANONYMITY_IMPLEMENTATION.md`, `backend/tests/test_privacy_and_security.py` |

---

## 3. Acceptance & Verification Criteria

1. **Reproducibility**: All ML training and evaluation scripts can be executed via clean CLI commands (`python -m app.ml.train...`).
2. **Honest Metrics**: Clear distinction between psychometric threshold classification (99.24% on questionnaire items) and multimodal early-warning generalization.
3. **Traceable Artifacts**: Generated confusion matrices, metric CSVs, ablation charts, and experiment logs.
4. **Mathematical Rigor**: Baseline calculations gracefully handle $\sigma = 0$, cold starts ($< 3$ logs), and missing days without false crisis alarms.
5. **Security & Anonymity**: All queries with $N < 10$ unique students are suppressed on administrative endpoints; automated tests verify negative permissions and privacy boundaries.
