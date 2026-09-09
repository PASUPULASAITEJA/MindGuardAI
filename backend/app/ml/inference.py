import os
import logging
from typing import Dict, Optional, Tuple, Any
import numpy as np
import joblib

try:
    import torch
    from transformers import AutoTokenizer, AutoModelForSequenceClassification
    TORCH_AVAILABLE = True
except (ImportError, OSError, Exception):
    TORCH_AVAILABLE = False

logger = logging.getLogger("mindguard-ml")

class MLService:
    _instance: Optional["MLService"] = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(MLService, cls).__new__(cls, *args, **kwargs)
        return cls._instance

    def __init__(self):
        # Prevent re-initialization if singleton instance is already setup
        if hasattr(self, "_initialized") and self._initialized:
            return
        
        self.model_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "models"))
        self.nlp_model_path = os.path.join(self.model_dir, "distilbert_v1.pt")
        self.risk_model_path = os.path.join(self.model_dir, "risk_rf_v2.joblib")
        
        self.tokenizer = None
        self.emotion_model = None
        self.risk_model = None
        self.models_loaded = False
        self._initialized = True

    def load_models(self) -> None:
        """
        Loads the pre-trained NLP and Risk models from disk.
        Falls back to rule-based inference if models are not generated yet.
        """
        try:
            if not TORCH_AVAILABLE:
                logger.warning("PyTorch or Transformers not installed. Using rule-based fallback inference.")
                return

            if os.path.exists(self.nlp_model_path) and os.path.exists(self.risk_model_path):
                logger.info("Loading ML models into memory...")
                
                # 1. Load DistilBERT tokenizer and classification weights
                self.tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased")
                self.emotion_model = AutoModelForSequenceClassification.from_pretrained(
                    "distilbert-base-uncased", num_labels=6
                )
                self.emotion_model.load_state_dict(torch.load(self.nlp_model_path, map_location=torch.device("cpu")))
                self.emotion_model.eval()

                # 2. Load Tree-based classifier
                self.risk_model = joblib.load(self.risk_model_path)
                
                self.models_loaded = True
                logger.info("ML Models successfully loaded into memory (Lifespan Startup completed).")
            else:
                logger.warning(
                    f"ML model binaries not found at:\n- {self.nlp_model_path}\n- {self.risk_model_path}\n"
                    "Starting with rule-based fallback inference."
                )
        except Exception as e:
            logger.error(f"Error loading ML models: {str(e)}. Using fallback execution.", exc_info=True)

    def _analyze_clinical_lexicon(self, text: str) -> Dict[str, Any]:
        """
        Deep clinical and colloquial emotional semantic analyzer.
        Features phrase extraction, negation detection, intensifier weighting, and multi-label mapping.
        """
        import re

        crisis_keywords = {
            "suicidal": 3.5, "suicide": 3.5, "want to die": 3.5, "kill myself": 3.5,
            "end my life": 3.5, "self harm": 3.0, "cutting myself": 3.0, "overdose": 3.0,
            "no reason to live": 3.0, "hopeless": 2.5, "hopelessness": 2.5,
            "worthless": 2.5, "tired of life": 2.8, "giving up": 2.2, "can't take this": 2.2
        }

        depressive_keywords = {
            "very bad": 1.5, "really bad": 1.4, "so bad": 1.3, "feeling bad": 1.2, "felt bad": 1.2,
            "bad": 1.0, "terrible": 1.6, "awful": 1.6, "horrible": 1.6, "horrific": 1.7,
            "worst": 1.6, "sad": 1.0, "unhappy": 1.0, "depressed": 1.6, "depressing": 1.3,
            "depression": 1.6, "crying": 1.3, "cried": 1.3, "tears": 1.1, "overwhelmed": 1.3,
            "lonely": 1.2, "alone": 1.0, "isolated": 1.2, "hurt": 1.1, "hurting": 1.2,
            "pain": 1.1, "painful": 1.2, "gloom": 1.1, "gloomy": 1.1, "miserable": 1.5,
            "misery": 1.5, "drained": 1.2, "exhausted": 1.2, "fatigued": 1.1, "burnout": 1.3,
            "burned out": 1.3, "struggling": 1.2, "down": 0.9, "feeling down": 1.2, "low": 0.9,
            "feeling low": 1.2, "empty": 1.3, "numb": 1.3, "useless": 1.4, "failure": 1.4,
            "failed": 1.2, "hate": 1.1, "ruined": 1.3, "broken": 1.3, "suffering": 1.4,
            "helpless": 1.4, "can't cope": 1.5, "tough": 0.8, "rough": 0.8, "dark": 1.0,
            "heartbroken": 1.4, "disappointed": 1.0
        }

        anxiety_keywords = {
            "panic": 1.6, "panicking": 1.7, "panic attack": 2.2, "anxious": 1.4, "anxiety": 1.5,
            "scared": 1.3, "worried": 1.2, "worry": 1.1, "worrying": 1.2, "fear": 1.3,
            "fearful": 1.3, "terrified": 1.7, "stress": 1.1, "stressed": 1.3, "stressful": 1.3,
            "nervous": 1.2, "tension": 1.1, "tense": 1.1, "midterm": 0.9, "exam": 0.9,
            "deadline": 1.0, "pressure": 1.2, "overload": 1.3, "jittery": 1.2, "freaking out": 1.6,
            "restless": 1.2, "uneasy": 1.2, "dread": 1.5, "dreading": 1.5, "overthinking": 1.3,
            "heart racing": 1.4
        }

        anger_keywords = {
            "angry": 1.7, "mad": 1.5, "furious": 2.0, "annoyed": 1.4, "irritated": 1.5,
            "frustrated": 1.7, "frustration": 1.7, "rage": 2.0, "pissed": 1.7, "fed up": 1.7,
            "disgusted": 1.6
        }

        joy_keywords = {
            "happy": 1.7, "glad": 1.5, "joy": 1.9, "joyful": 1.9, "excited": 1.7,
            "good": 1.3, "great": 1.7, "peace": 1.6, "peaceful": 1.7, "love": 1.6,
            "smile": 1.4, "smiling": 1.5, "pleasant": 1.4, "fine": 1.1, "ok": 0.9,
            "okay": 0.9, "nice": 1.2, "cool": 1.1, "relaxed": 1.6, "chill": 1.3,
            "productive": 1.5, "well": 1.2, "positive": 1.6, "enjoy": 1.5, "enjoyed": 1.5,
            "enjoying": 1.5, "wonderful": 1.9, "awesome": 1.9, "fantastic": 1.9, "blessed": 1.8,
            "grateful": 1.8, "content": 1.6, "energized": 1.7, "optimistic": 1.8, "thriving": 2.0,
            "confident": 1.7, "hopeful": 1.7, "calm": 1.6, "better": 1.3, "feeling good": 1.7
        }

        negations = ["not", "no", "never", "don't", "dont", "can't", "cant", "cannot", "won't", "wont"]

        t = text.lower()
        words = re.findall(r"[a-zA-Z']+", t)

        sad_score = 0.0
        anx_score = 0.0
        joy_score = 0.0
        anger_score = 0.0

        # Crisis detection
        has_crisis = any(phrase in t for phrase in crisis_keywords)
        for phrase, weight in crisis_keywords.items():
            if phrase in t:
                sad_score += weight

        # 1. Multi-word exact phrase matching
        for phrase, weight in depressive_keywords.items():
            if " " in phrase and phrase in t:
                sad_score += weight
        for phrase, weight in anxiety_keywords.items():
            if " " in phrase and phrase in t:
                anx_score += weight
        for phrase, weight in joy_keywords.items():
            if " " in phrase and phrase in t:
                joy_score += weight

        # 2. Single token matching with negation awareness
        for i, word in enumerate(words):
            is_negated = any(neg in words[max(0, i - 3):i] for neg in negations)

            if word in depressive_keywords and " " not in word:
                w = depressive_keywords[word]
                if is_negated:
                    joy_score += w * 0.4
                else:
                    sad_score += w
            elif word in anxiety_keywords and " " not in word:
                w = anxiety_keywords[word]
                if is_negated:
                    joy_score += w * 0.3
                else:
                    anx_score += w
            elif word in anger_keywords:
                w = anger_keywords[word]
                if not is_negated:
                    anger_score += w
            elif word in joy_keywords and " " not in word:
                w = joy_keywords[word]
                if is_negated:
                    sad_score += w * 1.3  # 'not good' -> sadness
                else:
                    joy_score += w

        # Default neutral baseline if zero emotional triggers found
        if sad_score == 0 and anx_score == 0 and joy_score == 0 and anger_score == 0:
            joy_score = 0.65
            sad_score = 0.10
            anx_score = 0.10
            anger_score = 0.05
            neutral_baseline = 0.5
        else:
            sad_score = max(0.02, sad_score)
            anx_score = max(0.02, anx_score)
            joy_score = max(0.02, joy_score)
            anger_score = max(0.01, anger_score)
            neutral_baseline = 1.0  # Prevents a single word from inflating to 99% probability

        tot = sad_score + anx_score + joy_score + anger_score + neutral_baseline
        sad_prob = sad_score / tot
        anx_prob = anx_score / tot
        joy_prob = joy_score / tot
        anger_prob = anger_score / tot

        sentiment = float(joy_prob - (sad_prob * 0.7 + anx_prob * 0.3))
        sentiment = max(-1.0, min(1.0, sentiment))

        # Continuous mental wellness score (0.0 to 100.0)
        # Neutral sentiment (0.0) maps to 60.0 (healthy stable baseline)
        # Positive sentiment (+1.0) maps to ~95.0
        # Mild negative sentiment (-0.2 to -0.4) maps to ~45.0 - 55.0 (Moderate / Managed stress)
        # Severe crisis sentiment maps to < 35.0
        if sentiment <= 0:
            wellness_score = 60.0 + (sentiment * 40.0)
        else:
            wellness_score = 60.0 + (sentiment * 35.0)

        if has_crisis:
            wellness_score = min(wellness_score, 25.0)

        wellness_score = max(10.0, min(100.0, wellness_score))

        if has_crisis or wellness_score < 35.0:
            risk = "HIGH"
        elif wellness_score < 65.0:
            risk = "MEDIUM"
        else:
            risk = "LOW"

        return {
            "detected_emotions": {
                "anxiety": round(anx_prob, 3),
                "sadness": round(sad_prob, 3),
                "joy": round(joy_prob, 3),
                "anger": round(anger_prob, 3),
                "fear": round(anx_prob * 0.7, 3),
                "surprise": 0.03
            },
            "sentiment_score": round(sentiment, 2),
            "mental_wellness_score": round(wellness_score, 2),
            "risk_level": risk
        }

    def _fallback_predict(self, text: str, self_reported_score: Optional[int] = None) -> Tuple[Dict[str, float], float, str]:
        """
        Rule-based clinical inference using the semantic emotion lexicon.
        """
        result = self._analyze_clinical_lexicon(text)
        score = result["mental_wellness_score"]
        
        # If user provided a self score, factor it in proportionally
        if self_reported_score is not None:
            user_score_100 = float(self_reported_score * 10.0)
            score = round((score * 0.60) + (user_score_100 * 0.40), 2)
            has_crisis = any(k in text.lower() for k in [
                "suicide", "suicidal", "want to die", "kill myself", "end my life", "self harm"
            ])
            if has_crisis or score < 35.0:
                risk = "HIGH"
            elif score < 65.0:
                risk = "MEDIUM"
            else:
                risk = "LOW"
            result["risk_level"] = risk

        return result["detected_emotions"], score, result["risk_level"]

    async def predict(
        self, text: str, self_reported_score: Optional[int] = None
    ) -> Tuple[Dict[str, float], float, str]:
        """
        Runs joint clinical inference with priority emotional safeguard:
        1. Runs clinical lexicon analysis.
        2. If DistilBERT and Risk models are loaded, fuses predictions while preventing
           false-positive joy on explicit clinical distress statements (e.g. 'feeling very bad').
        """
        lex_result = self._analyze_clinical_lexicon(text)
        lex_emotions = lex_result["detected_emotions"]
        lex_sentiment = lex_result["sentiment_score"]
        lex_wellness = lex_result["mental_wellness_score"]
        lex_risk = lex_result["risk_level"]

        # If neural weights are unavailable, use the accurate clinical lexicon directly
        if not self.models_loaded or not TORCH_AVAILABLE:
            return self._fallback_predict(text, self_reported_score)

        try:
            # 1. Run DistilBERT inference
            inputs = self.tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=128)
            with torch.no_grad():
                outputs = self.emotion_model(**inputs)
                probs = torch.softmax(outputs.logits, dim=1).numpy()[0]

            labels = ["joy", "sadness", "anxiety", "anger", "fear", "surprise"]
            nn_emotions = {labels[i]: float(probs[i]) for i in range(len(labels))}

            # 2. Clinical Guardian Rule: If clinical lexicon detects negative sentiment or distress,
            # the distress cues MUST override and ground the neural probabilities
            if lex_sentiment < 0 or lex_emotions["sadness"] > 0.3 or lex_emotions["anxiety"] > 0.3:
                detected_emotions = {
                    "anxiety": round(max(nn_emotions.get("anxiety", 0.0), lex_emotions["anxiety"]), 3),
                    "sadness": round(max(nn_emotions.get("sadness", 0.0), lex_emotions["sadness"]), 3),
                    "joy": round(min(nn_emotions.get("joy", 0.0), lex_emotions["joy"]), 3),
                    "anger": round(max(nn_emotions.get("anger", 0.0), lex_emotions["anger"]), 3),
                    "fear": round(lex_emotions["fear"], 3),
                    "surprise": 0.03
                }
                # Normalize
                tot = sum(detected_emotions.values())
                if tot > 0:
                    detected_emotions = {k: round(v / tot, 3) for k, v in detected_emotions.items()}
                
                sentiment_score = float(detected_emotions["joy"] - (detected_emotions["sadness"] * 0.7 + detected_emotions["anxiety"] * 0.3))
                sentiment_score = max(-1.0, min(1.0, sentiment_score))
                mental_wellness_score = lex_wellness
                risk_level = lex_risk
            else:
                detected_emotions = {
                    "anxiety": round((nn_emotions.get("anxiety", 0.0) + lex_emotions["anxiety"]) / 2, 3),
                    "sadness": round((nn_emotions.get("sadness", 0.0) + lex_emotions["sadness"]) / 2, 3),
                    "joy": round((nn_emotions.get("joy", 0.0) + lex_emotions["joy"]) / 2, 3),
                    "anger": round(lex_emotions["anger"], 3),
                    "fear": round(lex_emotions["fear"], 3),
                    "surprise": 0.03
                }
                tot = sum(detected_emotions.values())
                if tot > 0:
                    detected_emotions = {k: round(v / tot, 3) for k, v in detected_emotions.items()}
                
                sentiment_score = float(detected_emotions["joy"] - (detected_emotions["sadness"] * 0.7 + detected_emotions["anxiety"] * 0.3))
                sentiment_score = max(-1.0, min(1.0, sentiment_score))
                mental_wellness_score = lex_wellness
                risk_level = lex_risk

            # Factor in explicit user score if provided
            if self_reported_score is not None:
                user_score_100 = float(self_reported_score * 10.0)
                mental_wellness_score = round((mental_wellness_score * 0.60) + (user_score_100 * 0.40), 2)
                has_crisis = any(k in text.lower() for k in [
                    "suicide", "suicidal", "want to die", "kill myself", "end my life", "self harm"
                ])
                if has_crisis or mental_wellness_score < 35.0:
                    risk_level = "HIGH"
                elif mental_wellness_score < 65.0:
                    risk_level = "MEDIUM"
                else:
                    risk_level = "LOW"

            return detected_emotions, round(mental_wellness_score, 2), risk_level

        except Exception as e:
            logger.error(f"Inference exception: {str(e)}. Defaulting to clinical lexicon.", exc_info=True)
            return self._fallback_predict(text, self_reported_score)

ml_service = MLService()
