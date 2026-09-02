import re
from typing import Dict, List, Tuple

# Supported Canonical Student Wellness Intents
INTENT_PATTERNS: Dict[str, Dict[str, any]] = {
    "crisis_or_high_risk": {
        "keywords": [
            "suicide", "suicidal", "kill myself", "want to die", "end it all", "end my life",
            "hang myself", "cut myself", "self harm", "self-harm", "slit my", "overdose",
            "better off dead", "no reason to live", "don't want to live", "cannot go on living"
        ],
        "regex": r"\b(suicid|kill myself|want to die|end my life|end it all|self[- ]harm|overdose)\b",
        "weight": 1.0
    },
    "exam_stress": {
        "keywords": [
            "exam", "exams", "midterm", "midterms", "finals", "quiz", "test tomorrow", "syllabus",
            "failing exam", "exam pressure", "study stress", "grade", "gpa", "marks", "test anxiety"
        ],
        "regex": r"\b(exam|exams|midterm|midterms|finals|quiz|test stress|failing grade|gpa)\b",
        "weight": 0.85
    },
    "academic_pressure": {
        "keywords": [
            "assignment", "deadline", "submission", "homework", "thesis", "dissertation", "professor",
            "coursework", "academic overload", "behind on studies", "placements", "interview prep"
        ],
        "regex": r"\b(assignment|deadline|submission|thesis|dissertation|coursework|academic)\b",
        "weight": 0.80
    },
    "anxiety": {
        "keywords": [
            "anxious", "anxiety", "panic", "panicking", "nervous", "shaking", "racing thoughts",
            "heart beating fast", "hyperventilating", "overthinking", "terrified", "dread", "freaking out"
        ],
        "regex": r"\b(anxiet|anxious|panic|panick|overthink|freaking out|nervous|racing thoughts)\b",
        "weight": 0.85
    },
    "sadness": {
        "keywords": [
            "sad", "depressed", "depression", "crying", "miserable", "heartbroken", "grief",
            "unhappy", "hopeless", "down", "gloomy", "heavy heart", "feeling blue", "in tears"
        ],
        "regex": r"\b(sad|depress|crying|miserab|hopeless|heartbroken|unhappy)\b",
        "weight": 0.80
    },
    "loneliness": {
        "keywords": [
            "lonely", "alone", "no friends", "isolated", "nobody cares", "left out", "disconnected",
            "homesick", "alienated", "no one understands", "nobody to talk to"
        ],
        "regex": r"\b(lonel|isolated|no friends|nobody cares|homesick|alienat)\b",
        "weight": 0.80
    },
    "sleep_problem": {
        "keywords": [
            "insomnia", "cannot sleep", "can't sleep", "trouble sleeping", "nightmares", "staying up all night",
            "exhausted", "sleep deprivation", "wake up tired", "sleep schedule", "no sleep"
        ],
        "regex": r"\b(insomnia|can'?t sleep|trouble sleeping|exhausted|sleep deprivation|nightmare)\b",
        "weight": 0.80
    },
    "relationship_problem": {
        "keywords": [
            "breakup", "broke up", "girlfriend", "boyfriend", "partner", "cheating", "fight with friend",
            "toxic friend", "roommate issue", "argument with partner", "relationship"
        ],
        "regex": r"\b(breakup|broke up|girlfriend|boyfriend|partner|cheating|roommate|relationship)\b",
        "weight": 0.75
    },
    "family_problem": {
        "keywords": [
            "parents", "mother", "father", "dad", "mom", "family pressure", "parents arguing",
            "family expectations", "strict parents", "family conflict"
        ],
        "regex": r"\b(parents|mother|father|family pressure|strict parents|family)\b",
        "weight": 0.75
    },
    "motivation_problem": {
        "keywords": [
            "procrastination", "procrastinating", "no motivation", "lost interest", "burnout",
            "burned out", "cannot focus", "can't concentrate", "lazy", "feel unproductive", "drained"
        ],
        "regex": r"\b(procrastinat|no motivation|burnout|burned out|can'?t focus|concentrat|drained)\b",
        "weight": 0.75
    },
    "self_esteem_problem": {
        "keywords": [
            "imposter syndrome", "not good enough", "worthless", "hate myself", "ugly", "failure",
            "comparing myself", "low self esteem", "disappointed in myself", "feel useless"
        ],
        "regex": r"\b(imposter syndrome|not good enough|worthless|hate myself|failure|low self esteem|useless)\b",
        "weight": 0.80
    },
    "request_for_coping_strategy": {
        "keywords": [
            "how to calm down", "breathing exercise", "coping techniques", "help me relax", "grounding",
            "meditation", "calm my mind", "stress relief", "tips to study", "manage anxiety"
        ],
        "regex": r"\b(calm down|breathing exercise|coping|help me relax|grounding|meditat|stress relief)\b",
        "weight": 0.85
    },
    "request_for_human_support": {
        "keywords": [
            "talk to counselor", "book appointment", "speak with human", "therapist", "psychologist",
            "need a counselor", "mental health doctor", "connect me with someone"
        ],
        "regex": r"\b(counselor|therapist|psychologist|appointment|speak with human|talk to someone)\b",
        "weight": 0.90
    },
    "request_for_wellness_resources": {
        "keywords": [
            "resources", "helpline", "emergency number", "articles", "mental health hotline", "contact support"
        ],
        "regex": r"\b(resource|helpline|hotline|support contact|articles)\b",
        "weight": 0.80
    },
    "greeting": {
        "keywords": [
            "hello", "hi", "hey", "good morning", "good evening", "good afternoon", "hola", "sup", "howdy"
        ],
        "regex": r"^(hello|hi|hey|good morning|good evening|good afternoon|howdy|sup)[\s!.,?]*$",
        "weight": 0.95
    },
    "goodbye": {
        "keywords": [
            "bye", "goodbye", "see you", "good night", "talk later", "gotta go", "cya", "thanks bye"
        ],
        "regex": r"\b(bye|goodbye|see you|good night|talk later|gotta go|cya)\b",
        "weight": 0.90
    },
    "casual_conversation": {
        "keywords": [
            "how are you", "who are you", "what can you do", "tell me a joke", "nice to meet you", "thank you", "thanks"
        ],
        "regex": r"\b(how are you|who are you|what can you do|thank you|thanks)\b",
        "weight": 0.70
    }
}

class IntentClassifier:
    """
    Lightweight, deterministic and pattern-informed intent classification engine.
    Capable of running locally with zero latency, returning primary intent, confidence,
    and secondary intents.
    """

    def predict(self, text: str) -> Dict[str, any]:
        normalized = text.lower().strip()
        if not normalized:
            return {"intent": "unknown", "confidence": 0.0, "secondary_intents": []}

        scored_intents = []

        for intent_name, config in INTENT_PATTERNS.items():
            score = 0.0
            matched_keywords = 0

            # 1. Regex Match
            if re.search(config["regex"], normalized, re.IGNORECASE):
                score += config["weight"] * 0.65

            # 2. Keyword Matches
            for kw in config["keywords"]:
                if kw in normalized:
                    matched_keywords += 1
                    score += 0.20

            if matched_keywords > 0 or score > 0:
                # Bound between 0.0 and 0.99
                final_score = min(0.98, score)
                scored_intents.append((intent_name, final_score))

        if not scored_intents:
            return {"intent": "casual_conversation", "confidence": 0.50, "secondary_intents": []}

        # Sort descending by score
        scored_intents.sort(key=lambda x: x[1], reverse=True)

        primary_intent, primary_confidence = scored_intents[0]
        secondary = [intent for intent, _ in scored_intents[1:4]]

        return {
            "intent": primary_intent,
            "confidence": round(float(primary_confidence), 2),
            "secondary_intents": secondary
        }

intent_classifier = IntentClassifier()
