"""
MindGuardAI: Stress Analysis in Social Media (Dreaddit) Training Pipeline
Dataset Source: https://www.kaggle.com/datasets/ruchi798/stress-analysis-in-social-media
Trains a text stress classification model to detect acute student stress and distress in journal reflections.
"""

import os
import glob
import logging
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score, f1_score
import joblib

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("train-stress-social")

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "Dataset" / "stress_social"
MODEL_DIR = BASE_DIR / "backend" / "app" / "ml" / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)
MODEL_OUTPUT_PATH = MODEL_DIR / "stress_detector.joblib"

def load_dreaddit_data(data_dir: Path):
    """
    Loads dreaddit-train.csv, dreaddit-test.csv, or any matching CSV file in Dataset/stress_social/.
    """
    csv_files = list(data_dir.glob("*.csv"))
    if not csv_files:
        raise FileNotFoundError(
            f"No CSV files found in {data_dir}!\n"
            "Please download the dataset from: https://www.kaggle.com/datasets/ruchi798/stress-analysis-in-social-media\n"
            f"and place the CSV files (e.g., dreaddit-train.csv) inside {data_dir}."
        )

    dfs = []
    for f in csv_files:
        logger.info(f"Loading {f.name}...")
        try:
            df = pd.read_csv(f, encoding="utf-8", on_bad_lines="skip")
            dfs.append(df)
        except Exception as e:
            logger.warning(f"Could not read {f.name}: {e}")

    df_combined = pd.concat(dfs, ignore_index=True)
    logger.info(f"Total raw records loaded: {len(df_combined):,}")

    # Identify text and label column
    text_col = None
    for c in ["text", "post_text", "body", "clean_text"]:
        if c in df_combined.columns:
            text_col = c
            break

    label_col = None
    for c in ["label", "stress", "target", "is_stress"]:
        if c in df_combined.columns:
            label_col = c
            break

    if not text_col or not label_col:
        raise ValueError(
            f"Could not locate text/label columns. Available columns: {list(df_combined.columns)}"
        )

    df_clean = df_combined[[text_col, label_col]].dropna()
    df_clean.rename(columns={text_col: "text", label_col: "label"}, inplace=True)
    df_clean["label"] = df_clean["label"].astype(int)
    logger.info(f"Cleaned dataset: {len(df_clean):,} samples (Stress count: {(df_clean['label'] == 1).sum():,}, No-Stress count: {(df_clean['label'] == 0).sum():,})")
    return df_clean

def train_model():
    logger.info("Starting Stress Analysis model training...")
    df = load_dreaddit_data(DATA_DIR)

    X = df["text"].astype(str)
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(max_features=10000, stop_words="english", ngram_range=(1, 2))),
        ("clf", LogisticRegression(class_weight="balanced", max_iter=1000, random_state=42))
    ])

    logger.info("Fitting TF-IDF Vectorizer and Stress Classifier...")
    pipeline.fit(X_train, y_train)

    preds = pipeline.predict(X_test)
    acc = accuracy_score(y_test, preds)
    f1 = f1_score(y_test, preds)

    logger.info(f"Test Accuracy: {acc * 100:.2f}%")
    logger.info(f"Test F1-Score: {f1 * 100:.2f}%")
    logger.info("\n" + classification_report(y_test, preds, target_names=["No Stress (0)", "Stress (1)"]))

    joblib.dump(pipeline, MODEL_OUTPUT_PATH)
    logger.info(f"Model saved successfully to: {MODEL_OUTPUT_PATH}")

if __name__ == "__main__":
    try:
        train_model()
    except Exception as e:
        logger.error(f"Training failed: {e}")
