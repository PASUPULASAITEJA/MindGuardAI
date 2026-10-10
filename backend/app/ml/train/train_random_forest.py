"""
Reproducible Random Forest Clinical Risk Training Pipeline for MindGuardAI.
Trains an ensemble classifier with balanced weights on participant-split psychometric and cognitive latency data.
"""

import os
import sys

# Prevent OpenBLAS thread allocation issues on high-core Windows machines
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"

import json
import logging
from pathlib import Path
import yaml
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, f1_score

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("train-rf")

def train_risk_model(config_path: Path):
    with open(config_path, "r") as fp:
        cfg = yaml.safe_load(fp)

    base_dir = Path(__file__).resolve().parent.parent.parent.parent.parent
    backend_dir = base_dir / "backend"
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))
    data_dir = base_dir / cfg["data"]["dataset_dir"]
    model_output_dir = base_dir / cfg["experiment"]["output_dir"]
    model_output_dir.mkdir(parents=True, exist_ok=True)

    # Import preprocessing
    from app.ml.data.preprocess_dataset import load_and_preprocess
    df = load_and_preprocess(data_dir)

    # Assemble feature columns
    feature_cols = (
        cfg["features"]["phq_items"] +
        cfg["features"]["gad_items"] +
        cfg["features"]["scales"] +
        cfg["features"]["cognitive_latency"] +
        cfg["features"]["demographics"]
    )

    X = df[feature_cols]
    y = df[cfg["data"]["target_column"]]

    logger.info(f"Features: {len(feature_cols)} items | Total samples: {len(X):,}")

    # Participant-level stratified split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=cfg["data"]["test_split"],
        random_state=cfg["experiment"]["random_seed"],
        stratify=y if cfg["data"]["stratify"] else None
    )

    logger.info(f"Train split: {len(X_train):,} samples | Test split: {len(X_test):,} samples")

    rf_params = cfg["random_forest"]
    clf = RandomForestClassifier(
        n_estimators=rf_params["n_estimators"],
        max_depth=rf_params["max_depth"],
        min_samples_split=rf_params["min_samples_split"],
        min_samples_leaf=rf_params["min_samples_leaf"],
        class_weight=rf_params["class_weight"],
        criterion=rf_params["criterion"],
        random_state=cfg["experiment"]["random_seed"],
        n_jobs=rf_params["n_jobs"]
    )

    logger.info("Fitting Random Forest classifier...")
    clf.fit(X_train, y_train)

    # Evaluate on held-out test split
    y_pred = clf.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    macro_f1 = f1_score(y_test, y_pred, average="macro")
    weighted_f1 = f1_score(y_test, y_pred, average="weighted")

    logger.info(f"Test Accuracy: {accuracy * 100:.2f}% | Macro F1: {macro_f1 * 100:.2f}%")

    # Feature Importance
    importances = dict(zip(feature_cols, clf.feature_importances_))
    sorted_importances = sorted(importances.items(), key=lambda x: x[1], reverse=True)

    # Save artifacts
    model_path = model_output_dir / "phq_gad_risk_model.joblib"
    metrics_path = model_output_dir / "phq_gad_metrics.json"

    artifact = {
        "model": clf,
        "features": feature_cols,
        "classes": clf.classes_.tolist(),
        "trained_samples": len(X_train),
        "test_samples": len(X_test),
        "accuracy": round(float(accuracy), 4),
        "macro_f1": round(float(macro_f1), 4),
        "weighted_f1": round(float(weighted_f1), 4),
        "random_seed": cfg["experiment"]["random_seed"],
        "dataset": "UMH-24K"
    }

    joblib.dump(artifact, model_path)
    logger.info(f"Saved model artifact to: {model_path}")

    metrics_dict = {
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

    with open(metrics_path, "w") as fp:
        json.dump(metrics_dict, fp, indent=2)
    logger.info(f"Saved metrics metadata to: {metrics_path}")

    return artifact

if __name__ == "__main__":
    base_dir = Path(__file__).resolve().parent.parent.parent.parent.parent
    config_file = base_dir / "backend" / "app" / "ml" / "config" / "training_config.yaml"
    train_risk_model(config_file)
