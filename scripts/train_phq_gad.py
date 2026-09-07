import os
import sys

# Prevent OpenBLAS thread allocation issues on high-core Windows machines
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"

import json
import logging
from pathlib import Path
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, f1_score

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("train-phq-gad")

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "Dataset" / "phq_gad"
MODEL_DIR = BASE_DIR / "backend" / "app" / "ml" / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

MODEL_OUTPUT_PATH = MODEL_DIR / "phq_gad_risk_model.joblib"
METRICS_OUTPUT_PATH = MODEL_DIR / "phq_gad_metrics.json"

def load_and_merge_datasets(data_dir: Path) -> pd.DataFrame:
    """
    Loads and merges the 5 psychometric tables (PHQ-9, GAD-7, ISI, PSS, Demographics)
    on the shared participant key 'export_id'.
    """
    logger.info(f"Loading datasets from: {data_dir}")
    
    phq_path = data_dir / "phq9.csv"
    gad_path = data_dir / "gad7.csv"
    isi_path = data_dir / "isi.csv"
    pss_path = data_dir / "pss.csv"
    demo_path = data_dir / "demographic.csv"
    
    for p in [phq_path, gad_path, isi_path, pss_path, demo_path]:
        if not p.exists():
            raise FileNotFoundError(f"Required dataset file not found: {p}")
            
    df_phq = pd.read_csv(phq_path)
    df_gad = pd.read_csv(gad_path)
    df_isi = pd.read_csv(isi_path)
    df_pss = pd.read_csv(pss_path)
    df_demo = pd.read_csv(demo_path)

    logger.info(f"PHQ-9 rows: {len(df_phq):,}")
    logger.info(f"GAD-7 rows: {len(df_gad):,}")
    logger.info(f"ISI rows:   {len(df_isi):,}")
    logger.info(f"PSS rows:   {len(df_pss):,}")
    logger.info(f"Demo rows:  {len(df_demo):,}")

    # Rename score and question columns to avoid collision during merge
    phq_cols = {"score": "phq_total"}
    for i in range(1, 10):
        phq_cols[f"question{i}"] = f"phq_q{i}"
        phq_cols[f"time{i}"] = f"phq_t{i}"
    df_phq = df_phq.rename(columns=phq_cols)

    gad_cols = {"score": "gad_total"}
    for i in range(1, 8):
        gad_cols[f"question{i}"] = f"gad_q{i}"
        gad_cols[f"time{i}"] = f"gad_t{i}"
    df_gad = df_gad.rename(columns=gad_cols)

    df_isi = df_isi[["export_id", "score"]].rename(columns={"score": "isi_total"})
    df_pss = df_pss[["export_id", "score"]].rename(columns={"score": "pss_total"})
    df_demo = df_demo[["export_id", "gender", "age", "edu"]]

    # Merge on export_id
    df_merged = df_phq.merge(df_gad, on="export_id", how="inner")
    df_merged = df_merged.merge(df_isi, on="export_id", how="inner")
    df_merged = df_merged.merge(df_pss, on="export_id", how="inner")
    df_merged = df_merged.merge(df_demo, on="export_id", how="inner")

    logger.info(f"Successfully merged {len(df_merged):,} complete participant records.")
    return df_merged

def assign_clinical_labels(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes clinical severity tiers and composite student mental health risk levels.
    
    Risk Level Logic:
      - RED (High Risk):
          PHQ-9 >= 15 (Moderately severe to severe depression)
          OR GAD-7 >= 15 (Severe anxiety)
          OR PHQ-9 Q9 >= 1 (Self-harm / suicidal thoughts)
      - YELLOW (Medium Risk):
          PHQ-9 between 10-14 (Moderate depression)
          OR GAD-7 between 10-14 (Moderate anxiety)
          OR ISI >= 15 (Clinically significant moderate/severe insomnia)
          OR PSS >= 27 (High perceived stress)
      - GREEN (Low Risk):
          All scores below clinical warning thresholds
    """
    df = df.copy()

    # Calculate mean response times
    phq_time_cols = [f"phq_t{i}" for i in range(1, 10)]
    gad_time_cols = [f"gad_t{i}" for i in range(1, 8)]
    df["phq_mean_time"] = df[phq_time_cols].mean(axis=1)
    df["gad_mean_time"] = df[gad_time_cols].mean(axis=1)
    df["q9_hesitation_ratio"] = df["phq_t9"] / (df["phq_mean_time"] + 1e-5)

    def determine_risk(row):
        # Suicidal ideation check (item 9 > 0)
        if row["phq_q9"] > 0:
            return "RED"
        if row["phq_total"] >= 15 or row["gad_total"] >= 15:
            return "RED"
        if row["phq_total"] >= 10 or row["gad_total"] >= 10 or row["isi_total"] >= 15 or row["pss_total"] >= 27:
            return "YELLOW"
        return "GREEN"

    df["risk_level"] = df.apply(determine_risk, axis=1)

    # Encode gender (1: female, 0: male/other)
    df["is_female"] = (df["gender"].str.lower() == "female").astype(int)
    # Fill missing age with median
    df["age"] = pd.to_numeric(df["age"], errors="coerce").fillna(20.0).clip(16, 40)

    return df

def train_and_evaluate(df: pd.DataFrame):
    """
    Trains a balanced Random Forest model on student survey items and behavioral metrics.
    """
    feature_cols = (
        [f"phq_q{i}" for i in range(1, 10)] +
        [f"gad_q{i}" for i in range(1, 8)] +
        ["isi_total", "pss_total", "phq_mean_time", "gad_mean_time", "q9_hesitation_ratio", "age", "is_female"]
    )

    X = df[feature_cols]
    y = df["risk_level"]

    logger.info(f"Feature set size: {len(feature_cols)} features.")
    logger.info(f"Class distribution:\n{y.value_counts(normalize=True).round(4) * 100}%")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    logger.info(f"Training set: {len(X_train):,} samples | Test set: {len(X_test):,} samples")

    # Balanced Random Forest for clinical safety (high recall on RED)
    clf = RandomForestClassifier(
        n_estimators=150,
        max_depth=12,
        class_weight="balanced",
        random_state=42,
        n_jobs=1
    )

    logger.info("Training Random Forest Clinical Risk Model...")
    clf.fit(X_train, y_train)

    # Evaluate
    y_pred = clf.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    macro_f1 = f1_score(y_test, y_pred, average="macro")
    weighted_f1 = f1_score(y_test, y_pred, average="weighted")

    print("\n" + "=" * 65)
    print("  MindGuardAI - PHQ-GAD Risk Model Evaluation Report")
    print("=" * 65)
    print(f"Overall Accuracy:  {accuracy * 100:.2f}%")
    print(f"Macro F1-Score:    {macro_f1 * 100:.2f}%")
    print(f"Weighted F1-Score: {weighted_f1 * 100:.2f}%\n")
    print("Classification Report:")
    print(classification_report(y_test, y_pred, digits=4))
    print("Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred, labels=["GREEN", "YELLOW", "RED"]))
    print("=" * 65 + "\n")

    # Feature Importance
    importances = dict(zip(feature_cols, clf.feature_importances_))
    sorted_importances = sorted(importances.items(), key=lambda x: x[1], reverse=True)

    print("Top 10 Most Predictive Features:")
    for rank, (feat, score) in enumerate(sorted_importances[:10], 1):
        print(f"  {rank:2d}. {feat:<22}: {score * 100:.2f}%")
    print("=" * 65)

    # Save Model Artifact
    model_artifact = {
        "model": clf,
        "features": feature_cols,
        "classes": clf.classes_.tolist(),
        "trained_samples": len(X_train),
        "accuracy": round(float(accuracy), 4),
        "macro_f1": round(float(macro_f1), 4),
        "dataset": "PHQ9-GAD7-ISI-PSS-UniversityCohort-24k"
    }

    joblib.dump(model_artifact, MODEL_OUTPUT_PATH)
    logger.info(f"Model successfully saved to: {MODEL_OUTPUT_PATH}")

    # Save Metrics JSON
    metrics_summary = {
        "model_type": "RandomForestClassifier",
        "sample_count": len(df),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "accuracy": round(float(accuracy), 4),
        "macro_f1": round(float(macro_f1), 4),
        "weighted_f1": round(float(weighted_f1), 4),
        "top_features": sorted_importances[:10],
        "class_distribution": df["risk_level"].value_counts().to_dict(),
        "dataset_demographics": {
            "mean_age": round(float(df["age"].mean()), 2),
            "female_percent": round(float(df["is_female"].mean() * 100), 2),
            "bachelor_enrolled_percent": round(float((df["edu"].str.lower() == "bachelor's degree").mean() * 100), 2)
        }
    }

    with open(METRICS_OUTPUT_PATH, "w") as fp:
        json.dump(metrics_summary, fp, indent=2)
    logger.info(f"Metrics metadata saved to: {METRICS_OUTPUT_PATH}")

    return model_artifact

def main():
    logger.info("=== Starting MindGuardAI PHQ & GAD Training Pipeline ===")
    df = load_and_merge_datasets(DATA_DIR)
    df = assign_clinical_labels(df)
    train_and_evaluate(df)
    logger.info("=== Training and serialization completed successfully! ===")

if __name__ == "__main__":
    main()
