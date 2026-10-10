"""
Dataset Validation Module for MindGuardAI.
Validates dataset integrity, schema consistency, participant uniqueness, and missingness.
"""

import os
import sys
import logging
from pathlib import Path
import pandas as pd
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("validate-dataset")

def validate_dataset(data_dir: Path) -> dict:
    logger.info(f"Validating dataset in directory: {data_dir.resolve()}")
    
    required_files = {
        "phq9.csv": ["export_id", "score"] + [f"question{i}" for i in range(1, 10)] + [f"time{i}" for i in range(1, 10)],
        "gad7.csv": ["export_id", "score"] + [f"question{i}" for i in range(1, 8)] + [f"time{i}" for i in range(1, 8)],
        "isi.csv": ["export_id", "score"],
        "pss.csv": ["export_id", "score"],
        "demographic.csv": ["export_id", "gender", "age", "edu"]
    }
    
    validation_report = {
        "files_checked": {},
        "total_records": 0,
        "unique_participants": 0,
        "is_valid": True,
        "errors": [],
        "warnings": []
    }
    
    participant_sets = []
    
    for filename, expected_cols in required_files.items():
        file_path = data_dir / filename
        if not file_path.exists():
            msg = f"Missing required file: {filename}"
            logger.error(msg)
            validation_report["errors"].append(msg)
            validation_report["is_valid"] = False
            continue
            
        df = pd.read_csv(file_path)
        record_count = len(df)
        unique_ids = df["export_id"].nunique()
        missing_count = df.isnull().sum().sum()
        
        # Check columns
        missing_cols = [c for c in expected_cols if c not in df.columns]
        if missing_cols:
            msg = f"{filename} missing expected columns: {missing_cols}"
            logger.error(msg)
            validation_report["errors"].append(msg)
            validation_report["is_valid"] = False
            
        # Check duplicate export_ids
        duplicate_count = df.duplicated(subset=["export_id"]).sum()
        if duplicate_count > 0:
            msg = f"{filename} contains {duplicate_count} duplicate participant IDs."
            logger.warning(msg)
            validation_report["warnings"].append(msg)
            
        participant_sets.append(set(df["export_id"]))
        
        validation_report["files_checked"][filename] = {
            "record_count": record_count,
            "unique_ids": unique_ids,
            "missing_values": int(missing_count),
            "duplicate_ids": int(duplicate_count)
        }
        
        logger.info(f"File: {filename:<16} | Rows: {record_count:,} | Unique IDs: {unique_ids:,} | Missing: {missing_count}")

    # Check intersection of participant IDs across all 5 files
    if participant_sets:
        common_ids = set.intersection(*participant_sets)
        validation_report["unique_participants"] = len(common_ids)
        validation_report["total_records"] = len(common_ids)
        logger.info(f"Intersection of complete records across all instruments: {len(common_ids):,}")
        
        if len(common_ids) == 0:
            validation_report["is_valid"] = False
            validation_report["errors"].append("Zero common participant IDs found across tables.")
            
    return validation_report

if __name__ == "__main__":
    base_dir = Path(__file__).resolve().parent.parent.parent.parent.parent
    data_directory = base_dir / "Dataset" / "phq_gad"
    report = validate_dataset(data_directory)
    print("\n" + "=" * 60)
    print(f"Validation Status: {'PASSED' if report['is_valid'] else 'FAILED'}")
    print(f"Total Valid Complete Participants: {report['unique_participants']:,}")
    print("=" * 60)
