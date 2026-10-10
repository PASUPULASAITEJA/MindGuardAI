"""
Reproducible DistilBERT Sequence Classification Training Pipeline for MindGuardAI.
Fine-tunes a transformer model for 6-emotion multi-class classification on student text reflections.
"""

import os
import sys
from pathlib import Path
import logging
import yaml
import torch
import numpy as np
from torch.utils.data import Dataset
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, precision_recall_fscore_support

try:
    from transformers import AutoTokenizer, AutoModelForSequenceClassification, Trainer, TrainingArguments, EvalPrediction
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("train-distilbert")

class TextEmotionDataset(Dataset):
    def __init__(self, encodings, labels):
        self.encodings = encodings
        self.labels = labels

    def __getitem__(self, idx):
        item = {key: torch.tensor(val[idx]) for key, val in self.encodings.items()}
        item["labels"] = torch.tensor(self.labels[idx], dtype=torch.long)
        return item

    def __len__(self):
        return len(self.labels)

def compute_metrics(p: EvalPrediction):
    preds = np.argmax(p.predictions, axis=1)
    acc = accuracy_score(p.label_ids, preds)
    macro_f1 = f1_score(p.label_ids, preds, average="macro")
    weighted_f1 = f1_score(p.label_ids, preds, average="weighted")
    return {
        "accuracy": acc,
        "macro_f1": macro_f1,
        "weighted_f1": weighted_f1
    }

def train_emotion_model(config_path: Path):
    if not TRANSFORMERS_AVAILABLE:
        logger.warning("PyTorch / Transformers not available in current environment. Skipping neural training.")
        return

    with open(config_path, "r") as fp:
        cfg = yaml.safe_load(fp)

    base_dir = Path(__file__).resolve().parent.parent.parent.parent.parent
    output_dir = base_dir / cfg["experiment"]["output_dir"]
    output_dir.mkdir(parents=True, exist_ok=True)
    model_save_path = output_dir / "distilbert_v1.pt"

    logger.info("Initializing DistilBERT training configuration...")
    torch.manual_seed(cfg["experiment"]["random_seed"])
    np.random.seed(cfg["experiment"]["random_seed"])

    # Curated emotion dataset samples for student reflections
    emotion_samples = [
        # Joy (0)
        ("I felt very relaxed and accomplished after finishing my assignment.", 0),
        ("Had a great study session with my friends today.", 0),
        ("Feeling calm and optimistic about my semester progress.", 0),
        ("Really happy with my presentation marks!", 0),
        ("Enjoyed a restful sleep and morning walk.", 0),
        # Sadness (1)
        ("I feel completely drained, lonely, and hopeless about everything.", 1),
        ("Crying in my room today, feeling like an absolute failure.", 1),
        ("Everything feels overwhelming and I have zero motivation to get out of bed.", 1),
        ("I feel isolated from everyone on campus.", 1),
        ("I feel deeply depressed and miserable.", 1),
        # Anxiety (2)
        ("My heart is racing and I am terrified of failing my exam tomorrow.", 2),
        ("I can't breathe properly, having so much panic about my deadlines.", 2),
        ("Overthinking every little thing and trembling from exam stress.", 2),
        ("Placements are stressing me out so much, severe dread.", 2),
        ("Panic attack before class, feeling completely overwhelmed.", 2),
        # Anger (3)
        ("I am furious with how unfairly my group project members acted.", 3),
        ("So annoyed and irritated with this schedule.", 3),
        ("Angry at the professor for changing deadline suddenly.", 3),
        ("Fed up with continuous administrative delays.", 3),
        ("Full of rage and frustration today.", 3),
        # Fear (4)
        ("I am scared something terrible is going to happen to my family.", 4),
        ("Terrified of being suspended or dismissed.", 4),
        ("Dreading walking outside, feeling constantly frightened.", 4),
        ("Scared of the future and completely lost.", 4),
        ("Horrified by the news today.", 4),
        # Surprise (5)
        ("I was completely surprised by the unexpected quiz result!", 5),
        ("Did not expect the professor to extend the deadline.", 5),
        ("Shocked by how quickly the midterm arrived.", 5),
        ("Astonished by the feedback I received.", 5),
        ("Surprisingly finished all my coursework early.", 5)
    ]

    texts = [s[0] for s in emotion_samples]
    labels = [s[1] for s in emotion_samples]

    train_texts, val_texts, train_labels, val_labels = train_test_split(
        texts, labels, test_size=0.20, random_state=cfg["experiment"]["random_seed"], stratify=labels
    )

    model_name = cfg["distilbert"]["model_name"]
    tokenizer = AutoTokenizer.from_pretrained(model_name)

    train_encodings = tokenizer(train_texts, truncation=True, padding=True, max_length=cfg["distilbert"]["max_length"])
    val_encodings = tokenizer(val_texts, truncation=True, padding=True, max_length=cfg["distilbert"]["max_length"])

    train_dataset = TextEmotionDataset(train_encodings, train_labels)
    val_dataset = TextEmotionDataset(val_encodings, val_labels)

    model = AutoModelForSequenceClassification.from_pretrained(model_name, num_labels=cfg["distilbert"]["num_labels"])

    training_args = TrainingArguments(
        output_dir="./temp_distilbert_results",
        num_train_epochs=cfg["distilbert"]["num_epochs"],
        per_device_train_batch_size=cfg["distilbert"]["batch_size"],
        per_device_eval_batch_size=cfg["distilbert"]["batch_size"],
        warmup_steps=cfg["distilbert"]["warmup_steps"],
        weight_decay=cfg["distilbert"]["weight_decay"],
        logging_dir="./logs",
        logging_steps=5,
        save_strategy="no"
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        compute_metrics=compute_metrics
    )

    logger.info("Starting DistilBERT fine-tuning...")
    trainer.train()

    # Save model state dict
    torch.save(model.state_dict(), model_save_path)
    logger.info(f"DistilBERT weights successfully saved to: {model_save_path}")

if __name__ == "__main__":
    base_dir = Path(__file__).resolve().parent.parent.parent.parent.parent
    config_file = base_dir / "backend" / "app" / "ml" / "config" / "training_config.yaml"
    train_emotion_model(config_file)
