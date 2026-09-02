import os
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
    "default": [
        "Guided breathing exercise",
        "Talk about what's on my mind",
        "Take a wellness assessment",
        "Connect with campus support"
    ]
}

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
    """

    async def generate_response(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]],
        context: Dict[str, Any]
    ) -> str:
        intent = context.get("intent", "casual_conversation")
        emotion = context.get("primary_emotion", "neutral")
        risk_level = context.get("risk_level", "GREEN")
        history = context.get("recent_history", [])
        last_user_msg = messages[-1]["content"] if messages else ""

        # Context-aware templates and response branches
        if intent == "exam_stress":
            templates = [
                (
                    f"I completely understand how overwhelming exams can feel. The pressure to perform often makes the workload seem impossible. "
                    f"Remember that your worth as a person is not defined by an exam score. "
                    f"Would you like to try a quick 2-minute breathing technique together, or would it help to talk through which specific subject is stressing you out most?"
                ),
                (
                    f"Exam periods bring so much cognitive and emotional stress. It's completely valid that you're feeling {emotion} right now. "
                    f"Taking small, structured breaks actually improves retention and lowers anxiety. "
                    f"Have you been able to take a short pause today, or has it been non-stop study mode?"
                )
            ]
            return random.choice(templates)

        elif intent == "academic_pressure":
            templates = [
                (
                    f"Academic deadlines and heavy course loads can build up so quickly. Feeling {emotion} under this kind of pressure is very natural. "
                    f"When things pile up, focusing on just the very next small step can take some weight off your shoulders. "
                    f"What is the most urgent task on your plate right now?"
                ),
                (
                    f"It sounds like you're carrying a really heavy academic load right now. Please remember to give yourself grace—you're doing your best under demanding conditions. "
                    f"Would you like some practical tips on chunking your workload, or would you prefer to just talk through it?"
                )
            ]
            return random.choice(templates)

        elif intent == "anxiety":
            templates = [
                (
                    f"I hear how intense this anxiety feels right now. When anxiety peaks, our body goes into overdrive. "
                    f"Let's take a slow breath together: breathe in for 4 seconds, hold for 4, and breathe out slowly for 4. "
                    f"Are you in a comfortable spot right now? Tell me what is happening around you."
                ),
                (
                    f"Anxiety can make everything feel urgent and overwhelming. It is okay to pause and acknowledge that you're going through a tough moment. "
                    f"You are safe here. Would you like to try the 5-4-3-2-1 grounding method to help center your thoughts?"
                )
            ]
            return random.choice(templates)

        elif intent == "sadness":
            templates = [
                (
                    f"I'm really sorry you're feeling this weight today. Sadness can feel so heavy and draining. "
                    f"I want to remind you that your feelings are valid, and it's okay not to feel okay all the time. "
                    f"Would it help to share a bit more about what's been bringing you down lately?"
                ),
                (
                    f"Thank you for sharing this with me. Going through periods of sadness takes a lot of emotional energy. "
                    f"I'm here to listen without judgment. Is there anything specific on your mind today, or has this feeling been building up for a while?"
                )
            ]
            return random.choice(templates)

        elif intent == "loneliness":
            templates = [
                (
                    f"Loneliness can be one of the most painful feelings, especially in a busy campus environment where it seems like everyone else has things figured out. "
                    f"Please know that what you're feeling is shared by many students, even if people don't talk about it openly. "
                    f"I'm glad you reached out today. What has your day been like so far?"
                ),
                (
                    f"Feeling disconnected or alone is really tough to sit with. You took a brave step by reaching out here. "
                    f"Would you like to explore small ways to find community or support on campus, or would you simply like someone to chat with right now?"
                )
            ]
            return random.choice(templates)

        elif intent == "sleep_problem":
            templates = [
                (
                    f"Struggling with sleep can make every other part of student life ten times harder. When your mind won't quiet down, nights can feel endless. "
                    f"Have racing thoughts about classes or stress been keeping you awake, or is it more of a physical restlessness?"
                ),
                (
                    f"Sleep disruption is one of the quickest ways stress affects our physical wellness. "
                    f"Simple practices like stepping away from screens 30 minutes before bed or progressive muscle relaxation can help signal to your nervous system that it's safe to rest. "
                    f"Would you like to walk through a soothing wind-down routine?"
                )
            ]
            return random.choice(templates)

        elif intent == "relationship_problem" or intent == "family_problem":
            return (
                f"Navigating relationship and family conflicts while balancing college life is deeply stressful. "
                f"It's completely understandable that you're feeling {emotion}. "
                f"When interpersonal conflicts arise, finding clarity on what you can control versus what you can't often brings relief. "
                f"Would you like to talk more about what happened?"
            )

        elif intent == "motivation_problem" or intent == "self_esteem_problem":
            return (
                f"It is so easy to fall into cycles of low motivation and self-criticism, especially when you're exhausted. "
                f"Experiencing a dip in energy doesn't mean you're lazy or failing—it often means your brain and body are asking for a break. "
                f"What if we set aside the big picture for a moment and picked just one tiny, manageable thing for today?"
            )

        elif intent == "request_for_coping_strategy":
            return (
                f"Here is a powerful 5-4-3-2-1 Sensory Grounding exercise you can do right now to help calm your nervous system:\n\n"
                f"1. **Look around**: Name 5 things you can see.\n"
                f"2. **Touch**: Notice 4 things you can physically feel (e.g., your feet on the floor, your sweater).\n"
                f"3. **Listen**: Identify 3 distinct sounds around you.\n"
                f"4. **Smell**: Notice 2 things you can smell.\n"
                f"5. **Taste**: Focus on 1 taste in your mouth.\n\n"
                f"Take a slow breath as you do each one. How is your breathing feeling right now?"
            )

        elif intent == "request_for_human_support":
            return (
                f"Reaching out to a counselor is one of the most proactive and healthy steps you can take for your mental wellbeing. "
                f"MindGuard connects students directly with verified campus counselors in a safe, confidential environment. "
                f"You can request an appointment or message a counselor through the **Counselor Connect** section on your dashboard. "
                f"Would you like help preparing what to say in your first session?"
            )

        elif intent == "greeting":
            return (
                f"Hello! I'm your MindGuard AI wellness companion. I'm here to listen, support you with stress management, "
                f"offer calming techniques, or just chat through whatever is on your mind today in complete privacy. "
                f"How are you feeling right now?"
            )

        elif intent == "goodbye":
            return (
                f"Take good care of yourself! Remember that your wellbeing comes first. "
                f"I'm always here whenever you need a safe space to check in or talk. Have a restful day ahead!"
            )

        else:
            # Default supportive dialogue
            return (
                f"Thank you for sharing that with me. I'm here to support you in whatever way is most helpful. "
                f"Whether you want to unpack what you're experiencing, try a calming exercise, or explore campus resources, "
                f"I'm listening. What's on your mind right now?"
            )

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
            "You are MindGuard AI, an empathetic student mental wellness companion. "
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
        suggested = SUGGESTED_ACTIONS_BY_INTENT.get(intent, SUGGESTED_ACTIONS_BY_INTENT["default"])

        return {
            "response": response_text,
            "suggested_actions": suggested,
            "safety_alert": None
        }

response_orchestrator = ResponseOrchestrator()
