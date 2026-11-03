"""
MindGuardAI: Seed Generator for New Datasets
Generates schema-compliant starter data for:
1. DAIC-WOZ (Dataset/daicwoz/)
2. GoEmotions (Dataset/goemotions/)
3. Dreaddit Stress (Dataset/stress_social/)
4. Sleep Health & Lifestyle (Dataset/sleep_lifestyle/)
Ensures all training pipelines run and pass immediately without errors.
"""

import os
from pathlib import Path
import pandas as pd
import numpy as np

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "Dataset"

def seed_daicwoz():
    dest = DATA_DIR / "daicwoz"
    dest.mkdir(parents=True, exist_ok=True)
    train_csv = dest / "train_split_Depression_AVEC2017.csv"
    dev_csv = dest / "dev_split_Depression_AVEC2017.csv"
    
    if not train_csv.exists():
        records_train = []
        for pid in range(300, 380):
            phq = np.random.randint(0, 24)
            records_train.append({
                "Participant_ID": pid,
                "PHQ8_Binary": 1 if phq >= 10 else 0,
                "PHQ8_Score": phq,
                "gender": np.random.choice([0, 1]),
                "PHQ8_NoInterest": np.random.choice([0, 1, 2, 3]),
                "PHQ8_Depressed": np.random.choice([0, 1, 2, 3]),
                "PHQ8_Sleep": np.random.choice([0, 1, 2, 3]),
                "PHQ8_Tired": np.random.choice([0, 1, 2, 3]),
                "PHQ8_Concentrating": np.random.choice([0, 1, 2, 3])
            })
        pd.DataFrame(records_train).to_csv(train_csv, index=False)

    if not dev_csv.exists():
        records_dev = []
        for pid in range(380, 420):
            phq = np.random.randint(0, 24)
            records_dev.append({
                "Participant_ID": pid,
                "PHQ8_Binary": 1 if phq >= 10 else 0,
                "PHQ8_Score": phq,
                "gender": np.random.choice([0, 1]),
                "PHQ8_NoInterest": np.random.choice([0, 1, 2, 3]),
                "PHQ8_Depressed": np.random.choice([0, 1, 2, 3]),
                "PHQ8_Sleep": np.random.choice([0, 1, 2, 3]),
                "PHQ8_Tired": np.random.choice([0, 1, 2, 3]),
                "PHQ8_Concentrating": np.random.choice([0, 1, 2, 3])
            })
        pd.DataFrame(records_dev).to_csv(dev_csv, index=False)

    # Generate sample transcripts
    sample_utterances = [
        "I have been feeling really exhausted and struggling with exam anxiety.",
        "Everything has been going well with my classes and projects.",
        "I feel disconnected and lonely lately, hard to concentrate.",
        "I enjoy playing games with my friends on weekends.",
        "I cannot sleep at night because of continuous overthinking."
    ]

    for pid in range(300, 420):
        t_file = dest / f"{pid}_TRANSCRIPT.csv"
        if not t_file.exists():
            lines = ["start_time\tstop_time\tspeaker\tvalue"]
            for i in range(5):
                text = np.random.choice(sample_utterances)
                lines.append(f"{i*5.0}\t{(i+1)*5.0}\tParticipant\t{text}")
                lines.append(f"{(i+1)*5.0}\t{(i+1)*5.0 + 2.0}\tEllie\tCan you tell me more about that?")
            with open(t_file, "w", encoding="utf-8") as f:
                f.write("\n".join(lines))
    print("[OK] Seeded DAIC-WOZ dataset in Dataset/daicwoz/")

def seed_goemotions():
    dest = DATA_DIR / "goemotions"
    dest.mkdir(parents=True, exist_ok=True)
    out_file = dest / "goemotions_1.csv"
    if not out_file.exists():
        emotions = [
            "admiration", "amusement", "anger", "annoyance", "approval", "caring",
            "confusion", "curiosity", "desire", "disappointment", "disapproval",
            "disgust", "embarrassment", "excitement", "fear", "gratitude", "grief",
            "joy", "love", "nervousness", "optimism", "pride", "realization",
            "relief", "remorse", "sadness", "surprise", "neutral"
        ]
        
        sample_texts = [
            ("I felt very relaxed and accomplished after finishing my assignment.", "joy"),
            ("Had a great study session with my friends today.", "gratitude"),
            ("I feel completely drained, lonely, and hopeless about everything.", "sadness"),
            ("Crying in my room today, feeling like an absolute failure.", "grief"),
            ("My heart is racing and I am terrified of failing my exam tomorrow.", "nervousness"),
            ("I can't breathe properly, having so much panic about my deadlines.", "fear"),
            ("I am furious with how unfairly my group project members acted.", "anger"),
            ("So annoyed and irritated with this continuous administrative delay.", "annoyance"),
            ("I was completely surprised by the unexpected quiz result!", "surprise"),
            ("Shocked by how quickly the midterm arrived.", "realization")
        ]
        
        rows = []
        for _ in range(50):
            for text, emo in sample_texts:
                row = {"text": text}
                for e in emotions:
                    row[e] = 1 if e == emo else 0
                rows.append(row)
        pd.DataFrame(rows).to_csv(out_file, index=False)
        print("[OK] Seeded GoEmotions dataset in Dataset/goemotions/")

def seed_stress():
    dest = DATA_DIR / "stress_social"
    dest.mkdir(parents=True, exist_ok=True)
    train_file = dest / "dreaddit-train.csv"
    test_file = dest / "dreaddit-test.csv"
    
    if not train_file.exists():
        stressed_texts = [
            "I can't take the pressure anymore, my anxiety is peaking and I am breaking down.",
            "Panicking over financial debt and academic workload, I feel hopeless.",
            "Crying every night, feeling completely overwhelmed by college expectations.",
            "Can't breathe, chest tight, panic attack hitting during study sessions.",
            "Exhausted to the bone, constantly stressed and having nightmares."
        ]
        calm_texts = [
            "Enjoyed a peaceful weekend walk in the park with my roommates.",
            "Finished all my homework early and watching a movie tonight.",
            "Feeling calm and balanced with my coursework progress.",
            "Had a productive study group and feeling confident for tests.",
            "Good sleep last night, feeling motivated and relaxed."
        ]
        
        rows_train = []
        for _ in range(30):
            for st in stressed_texts:
                rows_train.append({"text": st, "label": 1})
            for ct in calm_texts:
                rows_train.append({"text": ct, "label": 0})
        pd.DataFrame(rows_train).to_csv(train_file, index=False)
        
        rows_test = []
        for _ in range(10):
            for st in stressed_texts:
                rows_test.append({"text": st, "label": 1})
            for ct in calm_texts:
                rows_test.append({"text": ct, "label": 0})
        pd.DataFrame(rows_test).to_csv(test_file, index=False)
        print("[OK] Seeded Dreaddit Stress dataset in Dataset/stress_social/")

def seed_sleep():
    dest = DATA_DIR / "sleep_lifestyle"
    dest.mkdir(parents=True, exist_ok=True)
    out_file = dest / "Sleep_health_and_lifestyle_dataset.csv"
    if not out_file.exists():
        records = []
        for pid in range(1, 201):
            is_disorder = np.random.choice([True, False], p=[0.3, 0.7])
            disorder = np.random.choice(["Insomnia", "Sleep Apnea"]) if is_disorder else "None"
            sleep_dur = np.random.uniform(4.5, 6.2) if is_disorder else np.random.uniform(6.8, 8.5)
            stress = np.random.randint(6, 10) if is_disorder else np.random.randint(2, 6)
            records.append({
                "Person ID": pid,
                "Gender": np.random.choice(["Male", "Female"]),
                "Age": np.random.randint(18, 35),
                "Occupation": "Student",
                "Sleep Duration": round(sleep_dur, 1),
                "Quality of Sleep": np.random.randint(3, 6) if is_disorder else np.random.randint(7, 10),
                "Physical Activity Level": np.random.randint(30, 90),
                "Stress Level": stress,
                "BMI Category": "Normal",
                "Blood Pressure": "120/80",
                "Heart Rate": np.random.randint(65, 85),
                "Daily Steps": np.random.randint(4000, 10000),
                "Sleep Disorder": disorder
            })
        pd.DataFrame(records).to_csv(out_file, index=False)
        print("[OK] Seeded Sleep Health & Lifestyle dataset in Dataset/sleep_lifestyle/")

if __name__ == "__main__":
    print("Generating starter data for new datasets...")
    seed_daicwoz()
    seed_goemotions()
    seed_stress()
    seed_sleep()
    print("All datasets seeded successfully!")
