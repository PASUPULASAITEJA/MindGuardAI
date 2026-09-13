import os
import re
import random
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

# Crisis Safety Responses for RED Risk (Strictly Deterministic, Stigma-Free, Direct Support)
CRISIS_SAFETY_RESPONSES = [
    (
        "I hear how much pain you're going through right now, and I want you to know that you don't have to carry this alone. "
        "Your life and safety are the absolute most important things. Please reach out to someone who can help right now:\n\n"
        "• **National Crisis Helpline (Tele-MANAS)**: Call **14416** or **1800-891-4416** (24/7, Free & Confidential)\n"
        "• **Suicide Prevention Helpline (KIRAN)**: Call **1800-599-0019**\n"
        "• **Campus Wellness / Counselor Emergency Desk**: Please connect with your designated campus counselor immediately.\n\n"
        "Are you in a safe place right now? Please stay with someone you trust or reach out to emergency services."
    ),
    (
        "I'm deeply concerned about what you're experiencing, and I'm here with you. Please know that whatever you're facing, "
        "there is support available and people who care and want to help you through this.\n\n"
        "Please connect with immediate professional support:\n"
        "• **Tele-MANAS 24/7 Mental Health Helpline**: **14416**\n"
        "• **Emergency Services**: **112**\n"
        "• **Campus Wellness Team**: We have flagged this for urgent priority counselor support.\n\n"
        "Is there a friend, family member, or trusted person nearby who can stay with you right now?"
    )
]

# Quick Action Suggestion Mapping
SUGGESTED_ACTIONS_BY_INTENT: Dict[str, List[str]] = {
    "exam_stress": [
        "4-7-8 Breathing Exercise",
        "How to break down my syllabus",
        "Tips for study burnout",
        "Take a clinical check-in"
    ],
    "academic_pressure": [
        "Pomodoro focus technique",
        "How to talk to my professor",
        "Manage assignment anxiety",
        "Guided grounding exercise"
    ],
    "anxiety": [
        "Box breathing (4-4-4-4)",
        "5-4-3-2-1 Sensory Grounding",
        "Help me calm racing thoughts",
        "Connect with a counselor"
    ],
    "sadness": [
        "I just want to vent",
        "Self-compassion reflection",
        "Simple grounding activity",
        "Take a PHQ-9 wellness survey"
    ],
    "homesickness": [
        "Schedule a quick call home",
        "Campus clubs & social events",
        "Ways to beat homesickness",
        "Connect with a peer mentor"
    ],
    "loneliness": [
        "Campus student support groups",
        "Ways to connect with peers",
        "Self-care ideas for tonight",
        "Talk to a counselor"
    ],
    "sleep_problem": [
        "Sleep hygiene tips",
        "Progressive muscle relaxation",
        "Calming bedtime reflection",
        "Manage late-night racing thoughts"
    ],
    "relationship_problem": [
        "Processing emotional boundaries",
        "Healthy communication tips",
        "Journaling prompt for clarity",
        "Book a counselor session"
    ],
    "family_problem": [
        "Managing parental expectations",
        "Setting emotional boundaries",
        "Grounding techniques for stress",
        "Talk with a wellness counselor"
    ],
    "motivation_problem": [
        "2-Minute Rule to get started",
        "Overcoming perfectionism",
        "Reframing study goals",
        "Daily mood check-in"
    ],
    "self_esteem_problem": [
        "Challenging imposter syndrome",
        "Recognizing small wins",
        "Positive self-affirmation exercise",
        "Schedule a counselor chat"
    ],
    "greeting": [
        "I'm feeling stressed about exams",
        "Help me calm down",
        "I want to talk about my day",
        "Log a mood check-in"
    ],
    "joy": [
        "Reflect on what went well",
        "Save a positive journal note",
        "Share a small win",
        "Set a positive intention"
    ],
    "casual_conversation": [
        "Share what's on my mind",
        "Check my wellness trends",
        "Try a quick relaxation tool",
        "Take a daily check-in"
    ],
    "default": [
        "Guided breathing exercise",
        "Talk about what's on my mind",
        "Take a wellness assessment",
        "Connect with campus support"
    ]
}

def is_hinglish_message(text: str) -> bool:
    """
    Detects if the message contains code-mixed Hinglish patterns.
    """
    if not text:
        return False
    text_lower = text.lower()
    hinglish_markers = [
        "bohot", "bahut", "zyada", "raha", "rahi", "rahe", "hai", "hain", "hoon", "yaar", "bhai",
        "kuch", "kya", "nahi", "karu", "kaise", "kare", "karna", "padhai", "darr", "lag", "udas",
        "neend", "ghar", "mummy", "papa", "mann", "dimag", "thak", "pareshan", "bechaini", "ghabrahat",
        "shant", "khatam", "chal", "accha", "theek", "shukriya", "dhanyawad", "namaste", "aap", "tum",
        "aur", "hoga", "hogi", "batao", "karo", "chahiye", "karunga", "karungi", "lagta", "lagti",
        "baat", "karni", "kardo", "karein", "se", "ki", "ka", "ke", "wali", "wale"
    ]
    tokens = re.findall(r"\b[a-zA-Z]+\b", text_lower)
    matches = sum(1 for t in tokens if t in hinglish_markers)
    key_phrases = [
        "ho rahi", "ho raha", "nahi ho", "darr lag", "kuch samajh", "mann nahi", "kya haal",
        "neend nahi", "ghar ki yaad", "bohot zyada", "bahut zyada", "pareshan hoon", "udas hoon",
        "rona aa raha", "fail ho", "padhai nahi"
    ]
    return matches >= 2 or any(p in text_lower for p in key_phrases)

class BaseLLMProvider(ABC):
    @abstractmethod
    async def generate_response(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]],
        context: Dict[str, Any]
    ) -> str:
        pass

class BuiltinEmpatheticGenerator(BaseLLMProvider):
    """
    Built-in high-quality empathetic response generator.
    Produces warm, supportive, student-centered responses adhering to non-diagnostic principles.
    Crafted to be concise, conversational, and bite-sized so students stay engaged.
    """

    async def generate_response(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]],
        context: Dict[str, Any]
    ) -> str:
        intent = context.get("intent", "casual_conversation")
        emotion = context.get("primary_emotion", "neutral")
        sentiment_score = context.get("sentiment_score", 0.0)
        risk_level = context.get("risk_level", "GREEN")
        history = context.get("recent_history", [])
        last_user_msg = (messages[-1]["content"] if messages else "").lower()

        # 0. Hinglish Cultural & Code-Mixed Empathetic Dialogue
        if is_hinglish_message(last_user_msg):
            # Hinglish Gratitude
            if any(k in last_user_msg for k in ["shukriya", "dhanyawad", "thank you", "thanks", "thx"]):
                return (
                    "Arey koi baat nahi! Main hamesha yahin hoon jab bhi baat karni ho ya halka mehsoos karna ho. "
                    "Apna khayal rakhna aur take care!"
                )
            # Hinglish Joy / Positive
            if emotion == "joy" or sentiment_score > 0.15 or any(k in last_user_msg for k in ["accha", "theek", "khush", "happy", "badhiya", "mast", "maza"]):
                return (
                    "Yeh sunkar bohot accha laga! Aise positive moments ko enjoy karna mental wellness ke liye bohot zaroori hai. "
                    "Aaj aisa kya hua jo itna accha feel ho raha hai?"
                )
            # Hinglish Exam Stress
            if intent == "exam_stress":
                return (
                    "Main samajh sakta hoon, exam ke time aisi tension aur stress hona bohot natural hai. "
                    "Par yaad rakho tumhare marks tumhari worth decide nahi karte. "
                    "Kya hum 2-minute ka deep breathing exercise try karein ya syllabus ko chote steps me divide karein?"
                )
            # Hinglish Academic Pressure
            if intent == "academic_pressure":
                return (
                    "Deadlines aur assignments ka load bohot exhausting ho jata hai. Pehle ek gehri saans lo. "
                    "Sabse zaroori kaam kaunsa hai jo pehle nipatana hai? Hum milkar plan karte hain."
                )
            # Hinglish Anxiety
            if intent == "anxiety":
                return (
                    "Main tumhare sath hoon. Anxiety me aisi ghabrahat aur overthinking hona samajh aata hai. "
                    "Pehle ek lambi, gehri saans lo aur thoda paani piyo. "
                    "Kya hum 5-4-3-2-1 grounding exercise try karein jisse thoda calm feel ho?"
                )
            # Hinglish Sadness
            if intent == "sadness":
                return (
                    "Main samajh sakta hoon ki aaj tumhara mann bohot udaas hai. Har waqt strong rehna zaroori nahi hota, "
                    "bura lagna normal hai. Agar mann halka karna ho toh batao kya chal raha hai, main sun raha hoon."
                )
            # Hinglish Homesickness
            if intent == "homesickness":
                return (
                    "Hostel ya college aakar ghar aur mummy-papa ki yaad aana bohot normal hai. Yeh ek naya phase hai, "
                    "khud par thoda patience rakho. Kya aaj ghar par kisi se baat hui ya phone lagane ka mann hai?"
                )
            # Hinglish Loneliness
            if intent == "loneliness":
                return (
                    "College me kabhi kabhi bohot akela pan mehsoos hota hai, par tum bilkul akele nahi ho. "
                    "Main yahin hoon tumhare sath. Aaj ka din kaisa guzra?"
                )
            # Hinglish Sleep Problem
            if intent == "sleep_problem":
                return (
                    "Jab neend na aaye toh agla pura din kharab lagta hai. Kya dimag me thoughts chal rahe hain ya bechaini hai? "
                    "Kya hum ek quick wind-down breathing routine karein jisse neend aane me aasani ho?"
                )
            # Hinglish Motivation Problem
            if intent == "motivation_problem":
                return (
                    "Mann nahi lag raha toh iska matlab yeh nahi ki tum lazy ho — shayad tumhara dimag thoda break maang raha hai. "
                    "Sirf 5 minute ka chota sa task karte hain, fir dekhenge!"
                )
            # Hinglish Family Problem
            if intent == "family_problem":
                return (
                    "Ghar ka pressure aur expectations handle karna bohot exhausting ho jata hai. "
                    "Tum har kisi ko khush nahi rakh sakte. Apna thoda dhyan rakho, kya hua ghar me agar share karna chaho?"
                )
            # Hinglish Coping Strategy Request
            if intent == "request_for_coping_strategy":
                return (
                    "Bilkul! Chalo turant ek quick calming exercise karte hain. 4 seconds saans andar lo, 4 seconds roko, "
                    "aur 4 seconds me dheere se bahar chhodo. Isse nervous system turant shant hoga."
                )
            # Hinglish Human Support Request
            if intent == "request_for_human_support":
                return (
                    "Bilkul, main samajh sakta hoon. Agar tum campus counselor se baat karna chahte ho, "
                    "toh tum Counselor booking tab se easily confidential appointment schedule kar sakte ho."
                )
            # Hinglish Greeting
            if intent == "greeting":
                return (
                    "Namaste! Kaisa chal raha hai aaj ka din? Main tumhara AI Wellness Assistant hoon. "
                    "Kuch baat karni ho ya stress share karna ho toh batao!"
                )
            # General Hinglish Fallback
            return (
                "Main samajh sakta hoon tum kya feel kar rahe ho. Jo bhi mann me chal raha hai, khulkar share kar sakte ho, "
                "main yahin hoon bina kisi judgment ke sunne ke liye."
            )

        # 1. Gratitude detection
        if any(k in last_user_msg for k in ["thank you", "thanks", "thx", "appreciate it"]):
            return (
                "You're very welcome! I'm always right here whenever you need a sounding board or a quick break. "
                "Keep taking good care of yourself!"
            )

        # 2. Joy / Happiness / Positive mood detection
        if emotion == "joy" or sentiment_score > 0.15 or any(k in last_user_msg for k in ["good", "great", "happy", "excited", "awesome", "wonderful", "proud", "fantastic", "feeling well", "better", "joy"]):
            joy_templates = [
                (
                    "That's wonderful to hear! I'm so glad you're feeling so good today. "
                    "What's been the highlight of your day so far?"
                ),
                (
                    "I love hearing that! Celebrating these bright, positive moments is such an important part of mental wellness. "
                    "Did something exciting happen, or are you just in a great flow?"
                ),
                (
                    "That's fantastic! It's so refreshing to feel happy and at peace. "
                    "Soak in those positive vibes — is there anything special you're looking forward to doing today?"
                ),
                (
                    "Hearing this brings a smile! Recognizing when you're feeling great helps anchor positive habits. "
                    "What made today feel so good?"
                )
            ]
            prev_assistant_msgs = [turn.get("message", "") for turn in history if turn.get("sender") != "STUDENT"]
            available = [t for t in joy_templates if t not in prev_assistant_msgs]
            return random.choice(available or joy_templates)

        # Context-aware templates — concise, empathetic, 2-3 short sentences
        if intent == "homesickness":
            templates = [
                (
                    f"Moving away to college is a huge adjustment, and missing your family is completely natural. "
                    f"You're not alone in feeling this way. How are you holding up today - have you been able to call home or chat with anyone?"
                ),
                (
                    f"Homesickness hits really hard, especially during quiet moments. "
                    f"Be patient with yourself while you settle in. What's one comfort from home that usually helps you feel a little better?"
                )
            ]
            return random.choice(templates)

        elif intent == "exam_stress":
            templates = [
                (
                    f"Exams can feel so overwhelming, but remember your grades don't define your worth. "
                    f"Would you like to try a quick 1-minute breathing exercise, or talk through what's stressing you most?"
                ),
                (
                    f"Exam pressure is real, and it's completely normal to feel stressed right now. "
                    f"Remember to pace yourself - have you been able to take even a short 5-minute break today?"
                )
            ]
            return random.choice(templates)

        elif intent == "academic_pressure":
            templates = [
                (
                    f"Deadlines can pile up fast and feel exhausting. "
                    f"What's the single most urgent task on your plate right now? Let's break it down together."
                ),
                (
                    f"Carrying a heavy course load is really tough, so please be gentle with yourself. "
                    f"Would you like a simple tip to tackle your work in smaller, easier chunks?"
                )
            ]
            return random.choice(templates)

        elif intent == "anxiety":
            templates = [
                (
                    f"I hear you - anxiety can feel really intense and overwhelming. "
                    f"Take a slow, deep breath with me right now. Are you in a comfortable, quiet spot?"
                ),
                (
                    f"You're safe here, and you don't have to carry this alone. "
                    f"Would you like to try a quick 5-4-3-2-1 grounding exercise to help steady your thoughts?"
                )
            ]
            return random.choice(templates)

        elif intent == "sadness":
            templates = [
                (
                    f"I'm really sorry you're feeling down today. It's completely okay not to feel okay all the time. "
                    f"I'm here to listen without judgment - would you like to share what's on your mind?"
                ),
                (
                    f"Sending you gentle support today. Carrying heavy feelings takes a lot out of you. "
                    f"Take your time, and let me know if you just want to vent or talk through it."
                )
            ]
            return random.choice(templates)

        elif intent == "loneliness":
            # If student mentions missing family/home inside loneliness intent
            if any(k in last_user_msg for k in ["miss my family", "miss home", "missing my family", "homesick", "moving to college", "moved to college"]):
                return (
                    f"Moving away to college is a huge adjustment, and missing your family is completely natural. "
                    f"You're not alone in feeling this way. How are you holding up today - have you been able to call home or chat with anyone?"
                )
            templates = [
                (
                    f"Feeling lonely on campus is really tough, but please know you're not alone. "
                    f"I'm right here with you. How has your day been going so far?"
                ),
                (
                    f"Finding your circle in college takes time, and it's okay if you haven't found it yet. "
                    f"Would you like to explore small ways to connect on campus, or just chat with me for a bit?"
                )
            ]
            return random.choice(templates)

        elif intent == "sleep_problem":
            templates = [
                (
                    f"Trouble sleeping makes everything harder the next day. "
                    f"Are racing thoughts keeping your mind active, or does your body just feel restless?"
                ),
                (
                    f"When sleep won't come, it's so frustrating. "
                    f"Would you like a quick 2-minute wind-down breathing routine to help quiet your mind?"
                )
            ]
            return random.choice(templates)

        elif intent == "relationship_problem":
            templates = [
                (
                    f"Relationship struggles can take a huge emotional toll, especially alongside college stress. "
                    f"I'm here to listen - would it help to talk through what happened?"
                ),
                (
                    f"Navigating relationship conflict is deeply draining. "
                    f"Remember to protect your own peace. Do you want to vent about what's going on?"
                )
            ]
            return random.choice(templates)

        elif intent == "family_problem":
            templates = [
                (
                    f"Dealing with family tension or pressure while balancing college is really draining. "
                    f"Remember you don't have to carry everyone's expectations. Would it help to talk about what happened?"
                ),
                (
                    f"Family conflicts can leave you feeling stuck and exhausted. "
                    f"I'm here for you - take a breath, and tell me what's been going on if you'd like to share."
                )
            ]
            return random.choice(templates)

        elif intent == "motivation_problem":
            templates = [
                (
                    f"Low motivation doesn't mean you're lazy - it usually means your brain is asking for a break! "
                    f"What's just one tiny 2-minute task we can check off together today?"
                ),
                (
                    f"Burnout is so common in college. Let's not worry about the whole to-do list right now. "
                    f"What can you do right now to give yourself a little breather?"
                )
            ]
            return random.choice(templates)

        elif intent == "self_esteem_problem":
            templates = [
                (
                    f"It's so easy to be hard on yourself, but you're doing much better than you realize. "
                    f"What is one small win or positive thing from your week?"
                ),
                (
                    f"Imposter syndrome is so common in college, but you truly earned your spot here. "
                    f"What's making you doubt yourself today? I'm listening."
                )
            ]
            return random.choice(templates)

        elif intent == "request_for_coping_strategy":
            return (
                f"Let's try a quick **5-4-3-2-1 Grounding** exercise right now:\n"
                f"Notice **5 things you see**, **4 you can touch**, **3 you hear**, **2 you smell**, and take **1 deep breath**.\n\n"
                f"How are you feeling after that?"
            )

        elif intent == "request_for_human_support":
            return (
                f"Reaching out for support is a sign of strength! You can connect with verified campus counselors anytime in the **Counselor Connect** tab. "
                f"Would you like help preparing what to say in your first chat?"
            )

        elif intent == "greeting":
            return (
                f"Hey there! I'm your MindGuardAI companion. I'm here to listen, share quick calming tools, or just chat in complete privacy. "
                f"How are you feeling today?"
            )

        elif intent == "goodbye":
            return (
                f"Take good care of yourself! Remember your wellbeing comes first. "
                f"I'm always here whenever you need a safe space to chat. Have a great day!"
            )

        elif intent in ["casual_conversation", "general_checkin"]:
            casual_templates = [
                "I'm here and listening! How has the rest of your day been going?",
                "Always glad to chat with you. What's been on your mind lately?",
                "I'm all ears! Whether you want to talk about your classes, your day, or just check in, what would you like to explore?",
            ]
            prev_assistant_msgs = [turn.get("message", "") for turn in history if turn.get("sender") != "STUDENT"]
            available = [t for t in casual_templates if t not in prev_assistant_msgs]
            return random.choice(available or casual_templates)

        else:
            # Diverse supportive fallbacks
            fallbacks = [
                (
                    "I hear you, and I'm right here with you. "
                    "Whether you want to vent, try a quick calming exercise, or talk things through, I'm listening. What's on your mind?"
                ),
                (
                    "I'm listening and glad you're sharing with me. "
                    "Take all the time you need — tell me more about what's going on."
                ),
                (
                    "Thanks for reaching out. Whatever is on your mind today, this is a safe, confidential space. "
                    "How are you feeling right now?"
                )
            ]
            prev_assistant_msgs = [turn.get("message", "") for turn in history if turn.get("sender") != "STUDENT"]
            available = [t for t in fallbacks if t not in prev_assistant_msgs]
            return random.choice(available or fallbacks)

class ResponseOrchestrator:
    """
    Orchestrates response generation across Safety Overrides, LLM Providers,
    and Built-in Empathetic Engines.
    """

    def __init__(self, provider: Optional[BaseLLMProvider] = None):
        self.provider = provider or BuiltinEmpatheticGenerator()

    async def generate(
        self,
        student_message: str,
        intent: str,
        primary_emotion: str,
        emotion_scores: Dict[str, float],
        sentiment_score: float,
        risk_level: str,
        recent_history: List[Dict[str, Any]],
        conversation_summary: Optional[str] = None
    ) -> Dict[str, Any]:
        
        # 1. Deterministic RED Risk Crisis Response (Highest Priority)
        if risk_level == "RED":
            if is_hinglish_message(student_message):
                chosen_response = (
                    "Main samajh sakta hoon ki tum iss waqt bohot zyada dard aur mushkil me ho, "
                    "par please yaad rakho tum akele nahi ho aur tumhari zindagi sabse zyada keemti hai. "
                    "Turant kisi se baat karo jo tumhari madad kar sake:\n\n"
                    "• **National Crisis Helpline (Tele-MANAS)**: Call **14416** ya **1800-891-4416** (24/7 Free & Confidential)\n"
                    "• **Suicide Prevention Helpline (KIRAN)**: Call **1800-599-0019**\n"
                    "• **Campus Wellness Desk**: Campus counselor ko turant alert bhej diya gaya hai.\n\n"
                    "Kya tum iss waqt kisi safe jagah par ho? Please kisi dost ya family member ke sath raho."
                )
            else:
                chosen_response = random.choice(CRISIS_SAFETY_RESPONSES)
            return {
                "response": chosen_response,
                "suggested_actions": [
                    "Call Tele-MANAS (14416)",
                    "Call KIRAN (1800-599-0019)",
                    "Connect with Campus Counselor",
                    "Guided Breathing Stabilization"
                ],
                "safety_alert": {
                    "severity": "RED",
                    "helpline": "14416",
                    "counselor_escalation": True,
                    "message": "Immediate supportive crisis resources have been activated."
                }
            }

        # 2. Contextual Empathetic Response Generation
        context = {
            "intent": intent,
            "primary_emotion": primary_emotion,
            "emotion_scores": emotion_scores,
            "sentiment_score": sentiment_score,
            "risk_level": risk_level,
            "recent_history": recent_history,
            "conversation_summary": conversation_summary
        }

        system_prompt = (
            "You are MindGuardAI, an empathetic student mental wellness companion. "
            "Your role is to offer warm, supportive, active listening and evidence-based coping strategies. "
            "Never diagnose medical conditions. Keep responses concise, student-friendly, and compassionate."
        )

        messages = []
        for turn in recent_history[-6:]:
            role = "user" if turn.get("sender") == "STUDENT" else "assistant"
            messages.append({"role": role, "content": turn.get("message", "")})
        
        messages.append({"role": "user", "content": student_message})

        response_text = await self.provider.generate_response(system_prompt, messages, context)

        # 3. Populate Suggested Actions
        if primary_emotion == "joy" or sentiment_score > 0.15:
            suggested = SUGGESTED_ACTIONS_BY_INTENT.get("joy", SUGGESTED_ACTIONS_BY_INTENT["default"])
        else:
            suggested = SUGGESTED_ACTIONS_BY_INTENT.get(intent, SUGGESTED_ACTIONS_BY_INTENT["default"])

        return {
            "response": response_text,
            "suggested_actions": suggested,
            "safety_alert": None
        }

response_orchestrator = ResponseOrchestrator()
