"""
MindGuardAI: Master Training Pipeline for New Datasets
Executes training for:
1. DAIC-WOZ Clinical Depression Interviews (scripts/train_daicwoz.py)
2. GoEmotions Conversational Emotion Classifier (scripts/train_goemotions.py)
3. Dreaddit Social Media Stress Detector (scripts/train_stress_social.py)
4. Sleep Health & Lifestyle Circadian Model (scripts/train_sleep_lifestyle.py)
"""

import sys
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

PIPELINES = [
    {
        "name": "1. DAIC-WOZ (Clinical Depression Interviews)",
        "script": "scripts/train_daicwoz.py",
        "data_dir": "Dataset/daicwoz"
    },
    {
        "name": "2. GoEmotions (6-Class Conversational Emotion)",
        "script": "scripts/train_goemotions.py",
        "data_dir": "Dataset/goemotions"
    },
    {
        "name": "3. Dreaddit (Social Media Student Stress Detection)",
        "script": "scripts/train_stress_social.py",
        "data_dir": "Dataset/stress_social"
    },
    {
        "name": "4. Sleep Health & Lifestyle (Circadian Model)",
        "script": "scripts/train_sleep_lifestyle.py",
        "data_dir": "Dataset/sleep_lifestyle"
    }
]

def main():
    print("=" * 65)
    print("       MindGuardAI New Datasets Training Orchestrator        ")
    print("=" * 65)

    for item in PIPELINES:
        print(f"\n---> Checking {item['name']}...")
        dir_path = BASE_DIR / item["data_dir"]
        csv_files = list(dir_path.glob("*.csv")) + list(dir_path.glob("*/*.csv"))
        
        if not csv_files:
            print(f" [SKIP] No CSV files found in {item['data_dir']}.")
            print(f"        Please download the dataset and place files in {item['data_dir']}")
            continue

        print(f" [FOUND] Found {len(csv_files)} files in {item['data_dir']}. Starting training...")
        res = subprocess.run([sys.executable, str(BASE_DIR / item["script"])])
        if res.returncode == 0:
            print(f" [SUCCESS] Finished training {item['name']}!")
        else:
            print(f" [WARNING] Training finished with exit code {res.returncode}.")

    print("\n" + "=" * 65)
    print("Training orchestrator run complete.")
    print("=" * 65)

if __name__ == "__main__":
    main()

