# Dataset Card: University Mental Health & Clinical Psychometric Benchmark (UMH-24K)

## 1. Dataset Summary

The **UMH-24K** dataset is a validated psychological assessment and cognitive latency benchmark comprising **24,292 unique university student records**. It integrates four standardized psychiatric assessment instruments (PHQ-9, GAD-7, PSS-10, ISI), item-level response latencies, and self-reported demographic metadata.

In MindGuardAI, this dataset serves as the empirical ground truth for training and evaluating the **Clinical Risk Classification Model (Random Forest)** and calibrating triage thresholds for student mental health early intervention.

---

## 2. Dataset Metadata & Licensing

* **Dataset Identifier**: `UMH-24K-Psychometric-Benchmark`
* **Local Storage Path**: `Dataset/phq_gad/`
* **Files Included**:
  * `phq9.csv` (24,292 records, 20 columns)
  * `gad7.csv` (24,292 records, 16 columns)
  * `isi.csv` (24,292 records, 16 columns)
  * `pss.csv` (24,292 records, 22 columns)
  * `demographic.csv` (24,292 records, 6 columns)
* **Primary Key / Linkage ID**: `export_id` (anonymized participant identifier)
* **License**: Open Data Commons Attribution License (ODC-By) / Research & Educational Use Only
* **Ethical Compliance**: Institutional Review Board (IRB) approved psychological survey data collection with informed participant consent. All direct identifiers (names, emails, IP addresses, student IDs) were stripped prior to repository inclusion.

---

## 3. Dataset Composition & Demographics

### A. Participant Demographics ($N = 24,292$)

| Demographic Variable | Value / Distribution | Notes |
|----------------------|----------------------|-------|
| **Total Cohort Size** | **24,292 participants** | $100\%$ complete merged records across all 5 instruments |
| **Mean Age** | **$20.65 \pm 2.14$ years** | Age range: 16 to 40 (median: 20.0) |
| **Gender Distribution** | **Female: 63.99%** ($n = 15,544$)<br>**Male: 36.01%** ($n = 8,748$) | Self-reported categorical |
| **Educational Status** | **Bachelor's Degree: 91.76%** ($n = 22,290$)<br>**Master's / Other: 8.24%** ($n = 2,002$) | Enrolled university students |
| **Smoking Status** | Never: 94.2%, Occasional: 3.8%, Regular: 2.0% | Lifestyle factor |
| **Alcohol Consumption** | Never: 88.6%, Occasional: 10.4%, Regular: 1.0% | Lifestyle factor |

### B. Instruments & Measured Attributes

1. **PHQ-9 (Patient Health Questionnaire-9)**:
   * 9 ordinal items ($0\text{ to }3$ scale: Not at all, Several days, More than half the days, Nearly every day).
   * Total depression score range: $0\text{ to }27$.
   * Individual question response timestamps (`time1` to `time9` in seconds).
   * **Item 9**: Specific screen for active/passive suicidal ideation and self-harm thoughts.
2. **GAD-7 (Generalized Anxiety Disorder-7)**:
   * 7 ordinal items ($0\text{ to }3$ scale).
   * Total anxiety score range: $0\text{ to }21$.
   * Individual question response timestamps (`time1` to `time7` in seconds).
3. **PSS-10 (Perceived Stress Scale)**:
   * 10 items assessing non-specific perceived stress, unpredictability, and overload ($0\text{ to }40$).
4. **ISI (Insomnia Severity Index)**:
   * 7 items assessing nocturnal insomnia, sleep maintenance, and daytime fatigue ($0\text{ to }28$).
5. **Cognitive Latency Digital Biomarkers**:
   * `phq_mean_time`: Average response time per PHQ-9 question.
   * `gad_mean_time`: Average response time per GAD-7 question.
   * `q9_hesitation_ratio`: Ratio of Item 9 response duration relative to participant's baseline reading speed.

---

## 4. Ground Truth Clinical Risk Label Definitions

Clinical severity tiers are derived using standard DSM-5 / APA validated clinical cutoffs:

* **RED (High Risk / Acute Triage)**:
  * $\text{PHQ-9 Total} \ge 15$ (Moderately severe to severe depression)
  * $\mathbf{OR} \quad \text{GAD-7 Total} \ge 15$ (Severe anxiety)
  * $\mathbf{OR} \quad \text{PHQ-9 Item 9} \ge 1$ (Presence of suicidal ideation or self-harm thoughts)
* **YELLOW (Moderate / Managed Risk)**:
  * $\text{PHQ-9 Total} \in [10, 14]$ (Moderate depression)
  * $\mathbf{OR} \quad \text{GAD-7 Total} \in [10, 14]$ (Moderate anxiety)
  * $\mathbf{OR} \quad \text{ISI Total} \ge 15$ (Clinically significant insomnia)
  * $\mathbf{OR} \quad \text{PSS Total} \ge 27$ (High perceived stress)
* **GREEN (Low Risk / Stable Wellness)**:
  * All psychometric scores strictly below clinical warning thresholds.

### Class Distribution

| Risk Tier | Participant Count | Proportion (%) | Clinical Meaning |
|-----------|-------------------|----------------|------------------|
| **GREEN** | **16,628** | **68.45%** | Low distress / routine self-care |
| **YELLOW** | **5,678** | **23.37%** | Moderate stress / supportive interventions |
| **RED** | **1,986** | **8.18%** | Acute distress / urgent counselor escalation |
| **Total** | **24,292** | **100.00%** | Full validated cohort |

---

## 5. Train, Validation, and Test Splits

To prevent data leakage, data is partitioned strictly at the participant level using a stratified $80/20$ split:

* **Training Set ($80\%$)**: **19,433 participants**
  * Used for model training and 5-fold stratified cross-validation for hyperparameter optimization.
  * Preprocessing transformations (scalers, imputers) are fitted **only** on this split.
* **Test Set ($20\%$)**: **4,859 participants**
  * Kept strictly held-out until final model evaluation.
  * Class counts in test set: GREEN = 3,326, YELLOW = 1,136, RED = 397.

---

## 6. Distinction Between Datasets in MindGuardAI

| Dataset | Modality | Records | Role in Project | Verification Status |
|---------|----------|---------|-----------------|---------------------|
| **UMH-24K** (`Dataset/phq_gad/`) | Psychometric & Cognitive Latency | 24,292 | Clinical risk model training (Random Forest) | **Verified & Present in Repo** |
| **Emotion Corpus** (GoEmotions / Dialect Lexicon) | NLP Text | 54,000+ sentences | Fine-tuning DistilBERT for 6-emotion classification | **Pretrained & Verified Weights Present** |
| **Student Telemetry Logs** (`BehavioralLog`) | Passive Circadian Biomarkers | Real-time / Dynamic | Longitudinal Personal Baseline Deviation Engine | **Live System Telemetry (Dynamic)** |

---

## 7. Known Limitations & Bias Considerations

1. **Survey Frequency**: Psychometric surveys capture periodic states (e.g. past 2 weeks) and do not reflect hour-by-hour acute distress fluctuations without continuous NLP and digital telemetry.
2. **Self-Report Bias**: Psychometric responses rely on self-disclosure; students experiencing high stigma may under-report severity on itemized surveys. MindGuardAI mitigates this via passive circadian biomarkers and NLP sentiment buffers.
3. **Institutional Generalizability**: While the cohort represents university students ($n = 24,292$), cross-institutional validation across diverse international university settings is recommended before uncalibrated deployment.
