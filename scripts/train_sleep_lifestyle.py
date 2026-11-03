"""
MindGuardAI: Sleep Health and Lifestyle Training Pipeline
Dataset Source: https://www.kaggle.com/datasets/uom190346a/sleep-health-and-lifestyle-dataset
Trains a model correlating sleep duration, sleep quality, and physical activity with student distress and insomnia.
"""

import os
import logging
from pathlib import Path
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
import joblib

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("train-sleep-lifestyle")

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "Dataset" / "sleep_lifestyle"
MODEL_DIR = BASE_DIR / "backend" / "app" / "ml" / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)
MODEL_OUTPUT_PATH = MODEL_DIR / "sleep_risk_model.joblib"

def load_sleep_data(data_dir: Path) -> pd.DataFrame:
    csv_files = list(data_dir.glob("*.csv"))
    if not csv_files:
        raise FileNotFoundError(
            f"No CSV file found in {data_dir}!\n"
            "Please download the dataset from: https://www.kaggle.com/datasets/uom190346a/sleep-health-and-lifestyle-dataset\n"
            f"and place Sleep_health_and_lifestyle_dataset.csv inside {data_dir}."
        )

    df = pd.read_csv(csv_files[0])
    logger.info(f"Loaded {len(df):,} records from {csv_files[0].name}")
    return df

def train_model():
    df = load_sleep_data(DATA_DIR)
    
    # Normalize column names
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    logger.info(f"Columns: {list(df.columns)}")

    # Features: sleep_duration, quality_of_sleep, physical_activity_level, stress_level, heart_rate, daily_steps
    req_cols = ["sleep_duration", "quality_of_sleep", "physical_activity_level", "stress_level", "heart_rate", "daily_steps"]
    for col in req_cols:
        if col not in df.columns:
            logger.warning(f"Column '{col}' not found, available: {list(df.columns)}")

    # Target: Sleep Disorder (None, Insomnia, Sleep Apnea) or High Stress
    target_col = "sleep_disorder" if "sleep_disorder" in df.columns else "stress_level"
    
    # Fill None for no sleep disorder
    if target_col == "sleep_disorder":
        df[target_col] = df[target_col].fillna("None").astype(str)
    
    le = LabelEncoder()
    y = le.fit_transform(df[target_col])
    
    feat_cols = [c for c in req_cols if c in df.columns]
    X = df[feat_cols].copy()
    X = X.fillna(X.mean())

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    clf = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
    clf.fit(X_train, y_train)

    preds = clf.predict(X_test)
    acc = accuracy_score(y_test, preds)
    logger.info(f"Test Accuracy: {acc * 100:.2f}%")
    logger.info(f"Classes: {list(le.classes_)}")
    logger.info("\n" + classification_report(y_test, preds, target_names=[str(c) for c in le.classes_]))

    package = {
        "model": clf,
        "features": feat_cols,
        "label_encoder": le,
        "feature_importances": dict(zip(feat_cols, [round(float(v), 4) for v in clf.feature_importances_]))
    }

    joblib.dump(package, MODEL_OUTPUT_PATH)
    logger.info(f"Sleep model package saved to: {MODEL_OUTPUT_PATH}")

if __name__ == "__main__":
    try:
        train_model()
    except Exception as e:
        logger.error(f"Training failed: {e}")
