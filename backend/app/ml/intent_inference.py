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
            "failing exam", "exam pressure", "study stress", "grade", "gpa", "marks", "test anxiety",
            # Hinglish
            "padhai nahi ho rahi", "exam stress", "paper kharab ho gaya", "fail ho jaunga", "fail hone ka darr",
            "syllabus bacha hai", "marks kam aayenge", "bohot zyada padhai", "exam ka darr", "exam aane wale hain"
        ],
        "regex": r"\b(exam|exams|midterm|midterms|finals|quiz|test stress|failing grade|gpa|padhai|fail ho ja|syllabus|marks kam)\b",
        "weight": 0.85
    },
    "academic_pressure": {
        "keywords": [
            "assignment", "deadline", "submission", "homework", "thesis", "dissertation", "professor",
            "coursework", "academic overload", "behind on studies", "placements", "interview prep",
            # Hinglish
            "submission bacha hai", "assignment submit", "deadline aa gayi", "professor se darr",
            "placement ki tension", "interview clear nahi ho raha", "academic load"
        ],
        "regex": r"\b(assignment|deadline|submission|thesis|dissertation|coursework|academic|placement ki tension|interview)\b",
        "weight": 0.80
    },
    "anxiety": {
        "keywords": [
            "anxious", "anxiety", "panic", "panicking", "nervous", "shaking", "racing thoughts",
            "heart beating fast", "hyperventilating", "overthinking", "terrified", "dread", "freaking out",
            # Hinglish
            "ghabrahat ho rahi", "bechaini", "darr lag raha", "overthinking chal rahi", "dil tezi se dhadak",
            "haath kaanp rahe", "dimag shant nahi", "anxiety ho rahi hai", "bohot ghabrahat"
        ],
        "regex": r"\b(anxiet|anxious|panic|panick|overthink|freaking out|nervous|racing thoughts|ghabrahat|bechaini|darr lag raha|anxiety ho rahi)\b",
        "weight": 0.85
    },
    "sadness": {
        "keywords": [
            "sad", "depressed", "depression", "crying", "miserable", "heartbroken", "grief",
            "unhappy", "hopeless", "down", "gloomy", "heavy heart", "feeling blue", "in tears",
            # Hinglish
            "udas hoon", "mann udas hai", "rona aa raha hai", "dil dukhi hai", "mood bohot kharab",
            "rona nahi ruk raha", "depressed feel kar raha", "bohot dukh ho raha", "bura lag raha hai"
        ],
        "regex": r"\b(sad|depress|crying|miserab|hopeless|heartbroken|unhappy|udas|rona aa raha|mood kharab|bura lag raha)\b",
        "weight": 0.80
    },
    "homesickness": {
        "keywords": [
            "miss my family", "missing my family", "miss home", "missing home",
            "miss my parents", "missing my parents", "homesick", "homesickness",
            "moved to college", "moving to college", "away from home", "first time away from home",
            "new city", "miss my room", "miss my mom", "miss my dad",
            # Hinglish
            "ghar ki yaad", "mummy papa ki yaad", "hostel me mann nahi lag raha", "ghar jana hai",
            "ghar se door", "maa ki yaad", "papa ki yaad", "ghar ki bohot yaad aa rahi"
        ],
        "regex": r"\b(homesick|homesickness|miss (my )?(family|parents|home|mom|dad)|missing (my )?(family|parents|home|mom|dad)|away from home|moving to college|moved to college|ghar ki yaad|mummy papa|hostel me mann)\b",
        "weight": 0.90
    },
    "loneliness": {
        "keywords": [
            "lonely", "alone", "no friends", "isolated", "nobody cares", "left out", "disconnected",
            "homesick", "alienated", "no one understands", "nobody to talk to", "feeling lonely", "feel lonely",
            # Hinglish
            "akela lag raha", "koi dost nahi hai", "koi baat nahi karta", "kisi ko parwah nahi",
            "akela pan", "koi samajhta nahi hai", "bilkul akela hoon"
        ],
        "regex": r"\b(lonel|isolated|no friends|nobody cares|alienat|feeling lonely|feel lonely|akela lag raha|koi dost nahi|akela pan|kisi ko parwah)\b",
        "weight": 0.85
    },
    "sleep_problem": {
        "keywords": [
            "insomnia", "cannot sleep", "can't sleep", "trouble sleeping", "nightmares", "staying up all night",
            "fall asleep", "cannot fall asleep", "can't fall asleep", "exhausted", "sleep deprivation",
            "wake up tired", "sleep schedule", "no sleep", "sleeping problem",
            # Hinglish
            "neend nahi aa rahi", "raat bhar jagta hoon", "so nahi pa raha", "neend ud gayi",
            "subah uthke thakawat", "sleep cycle kharab ho gaya", "neend ki problem"
        ],
        "regex": r"\b(insomnia|can'?t sleep|cannot sleep|fall asleep|trouble sleeping|exhausted|sleep deprivation|nightmare|neend nahi|so nahi pa|sleep cycle kharab)\b",
        "weight": 0.85
    },
    "relationship_problem": {
        "keywords": [
            "breakup", "broke up", "girlfriend", "boyfriend", "partner", "cheating", "fight with friend",
            "toxic friend", "roommate issue", "argument with partner", "relationship",
            # Hinglish
            "breakup ho gaya", "ladai ho gayi", "dost se jhagda", "roommate se ladai", "trust tod diya"
        ],
        "regex": r"\b(breakup|broke up|girlfriend|boyfriend|cheating|roommate fight|fight with friend|toxic friend|breakup ho gaya|dost se jhagda)\b",
        "weight": 0.75
    },
    "family_problem": {
        "keywords": [
            "family pressure", "parents arguing", "parents fighting", "strict parents",
            "family conflict", "fight with parents", "arguing with parents", "family fight",
            "toxic parents", "parents disappointed", "pressure from parents", "family expectations",
            "parents yelling", "abusive parents", "fighting with parents",
            # Hinglish
            "parents se ladai", "ghar me kalesh", "ghar me jhagda", "papa daant rahe hain",
            "mummy naraz hai", "family ka pressure", "ghar wale samajhte nahi"
        ],
        "regex": r"\b(family pressure|strict parents|family conflict|family fight|parents (are )?(fighting|arguing|yelling|screaming)|fight(ing)? with (my )?parents|toxic (family|parents)|parents pressure|parents se ladai|ghar me jhagda|family ka pressure)\b",
        "weight": 0.85
    },
    "motivation_problem": {
        "keywords": [
            "procrastination", "procrastinating", "no motivation", "lost interest", "burnout",
            "burned out", "cannot focus", "can't concentrate", "lazy", "feel unproductive", "drained",
            # Hinglish
            "mann nahi lag raha", "padhne ka mann nahi", "kuch karne ka dil nahi", "thak gaya hoon",
            "focus nahi ho raha", "alasa raha hoon", "burnout ho gaya hai", "procrastinate kar raha hoon"
        ],
        "regex": r"\b(procrastinat|no motivation|burnout|burned out|can'?t focus|concentrat|drained|mann nahi lag|focus nahi ho|thak gaya)\b",
        "weight": 0.75
    },
    "self_esteem_problem": {
        "keywords": [
            "imposter syndrome", "not good enough", "worthless", "hate myself", "ugly", "failure",
            "comparing myself", "low self esteem", "disappointed in myself", "feel useless",
            # Hinglish
            "kisi kaam ka nahi", "khud se nafrat", "fail ho gaya zindagi me", "mera kuch nahi ho sakta",
            "apne aap se naraz hoon", "low feel kar raha"
        ],
        "regex": r"\b(imposter syndrome|not good enough|worthless|hate myself|failure|low self esteem|useless|kisi kaam ka nahi|khud se nafrat)\b",
        "weight": 0.80
    },
    "request_for_coping_strategy": {
        "keywords": [
            "how to calm down", "breathing exercise", "coping techniques", "help me relax", "grounding",
            "meditation", "calm my mind", "stress relief", "tips to study", "manage anxiety",
            # Hinglish
            "kaise calm down karu", "relax kaise kare", "breathing exercise batao", "dimag shant kaise kare",
            "kuch tips do", "stress kam karne ke tarike"
        ],
        "regex": r"\b(calm down|breathing exercise|coping|help me relax|grounding|meditat|stress relief|relax kaise|breathing exercise batao|dimag shant)\b",
        "weight": 0.85
    },
    "request_for_human_support": {
        "keywords": [
            "talk to counselor", "book appointment", "speak with human", "therapist", "psychologist",
            "need a counselor", "mental health doctor", "connect me with someone",
            # Hinglish
            "counselor se baat karni hai", "counselor se milna hai", "appointment book kardo",
            "kisi doctor se connect karo", "therapist chahiye"
        ],
        "regex": r"\b(counselor|therapist|psychologist|appointment|speak with human|talk to someone|counselor se baat|appointment book)\b",
        "weight": 0.90
    },
    "request_for_wellness_resources": {
        "keywords": [
            "resources", "helpline", "emergency number", "articles", "mental health hotline", "contact support",
            # Hinglish
            "helpline number do", "emergency contact", "hotline number", "support resources"
        ],
        "regex": r"\b(resource|helpline|hotline|support contact|articles|helpline number)\b",
        "weight": 0.80
    },
    "greeting": {
        "keywords": [
            "hello", "hi", "hey", "good morning", "good evening", "good afternoon", "hola", "sup", "howdy",
            # Hinglish
            "namaste", "kaisa hai", "kya haal hai", "kem cho", "vanakkam", "pranam"
        ],
        "regex": r"^(hello|hi|hey|good morning|good evening|good afternoon|howdy|sup|namaste|kaisa hai|kya haal hai|kem cho)[\s!.,?]*$",
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
