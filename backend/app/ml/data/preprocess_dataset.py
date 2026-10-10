"""
Preprocessing and Feature Engineering Module for MindGuardAI.
Merges psychometric inventories, computes response latencies, and prepares participant-split datasets.
"""

import os
import logging
from pathlib import Path
from typing import Tuple
import pandas as pd
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("preprocess-dataset")

def load_and_preprocess(data_dir: Path) -> pd.DataFrame:
    """
    Loads raw CSV files, merges on export_id, engineers cognitive latency features,
    and assigns validated clinical ground-truth risk tiers.
    """
    phq_path = data_dir / "phq9.csv"
    gad_path = data_dir / "gad7.csv"
    isi_path = data_dir / "isi.csv"
    pss_path = data_dir / "pss.csv"
    demo_path = data_dir / "demographic.csv"

    df_phq = pd.read_csv(phq_path)
    df_gad = pd.read_csv(gad_path)
    df_isi = pd.read_csv(isi_path)
    df_pss = pd.read_csv(pss_path)
    df_demo = pd.read_csv(demo_path)

    # Rename score and item columns
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

    # Merge into single participant-level dataframe
    df = df_phq.merge(df_gad, on="export_id", how="inner")
    df = df.merge(df_isi, on="export_id", how="inner")
    df = df.merge(df_pss, on="export_id", how="inner")
    df = df.merge(df_demo, on="export_id", how="inner")

    # Cognitive response latency metrics
    phq_time_cols = [f"phq_t{i}" for i in range(1, 10)]
    gad_time_cols = [f"gad_t{i}" for i in range(1, 8)]
    df["phq_mean_time"] = df[phq_time_cols].mean(axis=1)
    df["gad_mean_time"] = df[gad_time_cols].mean(axis=1)
    df["q9_hesitation_ratio"] = df["phq_t9"] / (df["phq_mean_time"] + 1e-5)

    # Ground truth clinical tier assignment
    def determine_risk(row):
        if row["phq_q9"] > 0 or row["phq_total"] >= 15 or row["gad_total"] >= 15:
            return "RED"
        if row["phq_total"] >= 10 or row["gad_total"] >= 10 or row["isi_total"] >= 15 or row["pss_total"] >= 27:
            return "YELLOW"
        return "GREEN"

    df["risk_level"] = df.apply(determine_risk, axis=1)

    # Encode demographics
    df["is_female"] = (df["gender"].str.lower() == "female").astype(int)
    df["age"] = pd.to_numeric(df["age"], errors="coerce").fillna(20.0).clip(16, 40)

    logger.info(f"Preprocessing completed. Total clean dataset size: {len(df):,} records.")
    return df

if __name__ == "__main__":
    base_dir = Path(__file__).resolve().parent.parent.parent.parent.parent
    data_directory = base_dir / "Dataset" / "phq_gad"
    df_clean = load_and_preprocess(data_directory)
    print("Preprocessed Class Counts:")
    print(df_clean["risk_level"].value_counts())
