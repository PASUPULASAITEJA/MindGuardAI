"""
MindGuardAI: GoEmotions Emotion Classification Training Pipeline
Dataset Source: https://www.kaggle.com/datasets/debarshichanda/goemotions
Maps 27 GoEmotions labels to MindGuardAI's 6 core affective states:
joy, sadness, anxiety, anger, fear, surprise.
"""

import os
import logging
from pathlib import Path
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score
import joblib

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("train-goemotions")

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "Dataset" / "goemotions"
MODEL_DIR = BASE_DIR / "backend" / "app" / "ml" / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)
MODEL_OUTPUT_PATH = MODEL_DIR / "goemotions_classifier.joblib"

# Mapping 27 GoEmotions to MindGuard 6-class space
EMOTION_MAPPING = {
    # Joy
    "admiration": "joy", "amusement": "joy", "approval": "joy", "caring": "joy",
    "desire": "joy", "excitement": "joy", "gratitude": "joy", "joy": "joy",
    "love": "joy", "optimism": "joy", "pride": "joy", "relief": "joy",
    # Sadness
    "disappointment": "sadness", "embarrassment": "sadness", "grief": "sadness",
    "remorse": "sadness", "sadness": "sadness",
    # Anxiety
    "nervousness": "anxiety", "confusion": "anxiety",
    # Anger
    "anger": "anger", "annoyance": "anger", "disapproval": "anger", "disgust": "anger",
    # Fear
    "fear": "fear",
    # Surprise
    "curiosity": "surprise", "realization": "surprise", "surprise": "surprise"
}

def load_goemotions_data(data_dir: Path) -> pd.DataFrame:
    csv_files = list(data_dir.glob("*.csv"))
    if not csv_files:
        raise FileNotFoundError(
            f"No CSV files found in {data_dir}!\n"
            "Please download the dataset from: https://www.kaggle.com/datasets/debarshichanda/goemotions\n"
            f"and place the CSV files (e.g. goemotions_1.csv, goemotions_2.csv, etc.) inside {data_dir}."
        )

    dfs = []
    for f in csv_files:
        logger.info(f"Loading {f.name}...")
        try:
            df = pd.read_csv(f, encoding="utf-8", on_bad_lines="skip")
            dfs.append(df)
        except Exception as e:
            logger.warning(f"Error reading {f.name}: {e}")

    df_full = pd.concat(dfs, ignore_index=True)
    logger.info(f"Loaded {len(df_full):,} raw GoEmotions comments.")

    # Find text column
    text_col = "text" if "text" in df_full.columns else df_full.columns[0]
    
    # Map emotion columns to 6 target classes
    records = []
    for _, row in df_full.iterrows():
        t = str(row.get(text_col, "")).strip()
        if len(t) < 3:
            continue
        
        # Check active emotion flags
        assigned_emotions = []
        for emo, target_class in EMOTION_MAPPING.items():
            if emo in row and row[emo] == 1:
                assigned_emotions.append(target_class)
        
        if assigned_emotions:
            # Pick dominant or first assigned class
            records.append({"text": t, "emotion": assigned_emotions[0]})

    df_mapped = pd.DataFrame(records)
    logger.info(f"Mapped {len(df_mapped):,} samples into MindGuard 6-emotion classes:")
    logger.info(f"\n{df_mapped['emotion'].value_counts()}")
    return df_mapped

def train_model():
    df = load_goemotions_data(DATA_DIR)

    X = df["text"]
    y = df["emotion"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(max_features=15000, stop_words="english", ngram_range=(1, 2))),
        ("clf", LogisticRegression(class_weight="balanced", max_iter=1000, random_state=42))
    ])

    logger.info("Fitting TF-IDF and Logistic Regression on GoEmotions...")
    pipeline.fit(X_train, y_train)

    preds = pipeline.predict(X_test)
    acc = accuracy_score(y_test, preds)
    logger.info(f"Test Accuracy: {acc * 100:.2f}%")
    logger.info("\n" + classification_report(y_test, preds))

    joblib.dump(pipeline, MODEL_OUTPUT_PATH)
    logger.info(f"GoEmotions classifier saved to: {MODEL_OUTPUT_PATH}")

if __name__ == "__main__":
    try:
        train_model()
    except Exception as e:
        logger.error(f"Training failed: {e}")

