import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  Plus,
  Bot,
  User as UserIcon,
  Sparkles,
  AlertTriangle,
  PhoneCall,
  HeartHandshake,
  ShieldCheck,
  RefreshCw,
  ChevronRight,
  Wind,
  Compass,
  CheckCircle2,
  X,
  Eye,
  Hand,
  Volume2,
  Coffee,
  BrainCircuit,
  RotateCcw,
  ArrowRight,
  Check,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatAPI, ChatMessageItem, ChatResponsePayload } from "@/services/api";
import { cn } from "@/utils/cn";
import { useToast } from "@/components/ui/toast";
import { EmergencySOSModal } from "@/components/EmergencySOSModal";

const QUICK_PROMPTS = [
  "I'm feeling stressed about my upcoming exams",
  "Help me calm down, I feel overwhelmed",
  "I'm feeling lonely and disconnected lately",
  "Guide me through a 5-minute breathing exercise",
];

const emotionBadgeColor: Record<string, string> = {
  joy: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  sadness: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  anxiety: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  anger: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  fear: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  neutral: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
};

// CBT 5-4-3-2-1 Sensory Grounding Steps
interface GroundingStep {
  count: number;
  sense: string;
  icon: React.FC<{ className?: string }>;
  label: string;
  prompt: string;
  color: string;
}

const GROUNDING_STEPS: GroundingStep[] = [
  {
    count: 5,
    sense: "Sight",
    icon: Eye,
    label: "5 things you can SEE around you",
    prompt: "Scan your surroundings. Look for subtle details: a shadow, a pattern on the wall, a pen on your desk, or leaves outside.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    count: 4,
    sense: "Touch",
    icon: Hand,
    label: "4 things you can physically TOUCH or FEEL",
    prompt: "Feel the texture of your clothes, the coolness of your desk surface, the weight of your feet firmly planted on the floor.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    count: 3,
    sense: "Hearing",
    icon: Volume2,
    label: "3 things you can HEAR right now",
    prompt: "Tune in to background sounds: the gentle hum of a fan, distant traffic, your own breathing, or keys typing.",
    color: "from-amber-500 to-orange-500",
  },
  {
    count: 2,
    sense: "Smell",
    icon: Wind,
    label: "2 things you can SMELL around you",
    prompt: "Breathe in gently. Notice any scent in the air, coffee, fresh breeze, clean laundry, or just neutral fresh air.",
    color: "from-purple-500 to-indigo-500",
  },
  {
    count: 1,
    sense: "Taste / Anchor",
    icon: Coffee,
    label: "1 thing you can TASTE or a grounding affirmation",
    prompt: "Take a slow sip of water, or say to yourself: 'I am safe in this present moment. I can handle whatever comes next.'",
    color: "from-rose-500 to-pink-500",
  },
];

// CBT Cognitive Thought Distortions
interface Distortion {
  id: string;
  name: string;
  shortDesc: string;
  example: string;
  reframedTemplate: string;
}

const COGNITIVE_DISTORTIONS: Distortion[] = [
  {
    id: "catastrophizing",
    name: "Catastrophizing",
    shortDesc: "Assuming the absolute worst outcome will happen.",
    example: "If I don't get an A on this exam, my entire degree and career are ruined.",
    reframedTemplate: "While this exam is important, one grade does not define my future or intelligence. Even if it is challenging, I have options and time to recover.",
  },
  {
    id: "all_or_nothing",
    name: "All-or-Nothing Thinking",
    shortDesc: "Viewing situations in black-and-white terms with no middle ground.",
    example: "Because my presentation wasn't 100% flawless, I completely failed.",
    reframedTemplate: "Perfection is an unrealistic standard. I communicated important ideas well, and minor imperfections are normal opportunities to learn.",
  },
  {
    id: "mind_reading",
    name: "Mind Reading",
    shortDesc: "Assuming you know others are judging or disliking you without proof.",
    example: "My professor looked distracted, so they must think my question was stupid.",
    reframedTemplate: "People have busy, complex days that have nothing to do with me. I cannot read thoughts, and asking questions is how everyone learns.",
  },
  {
    id: "emotional_reasoning",
    name: "Emotional Reasoning",
    shortDesc: "Believing that because you feel anxious, the situation is actually dangerous.",
    example: "I feel intense anxiety right now, which means something terrible is about to happen.",
    reframedTemplate: "Anxiety is an emotional wave in my nervous system, not a factual prophecy. I can feel anxious and still remain completely safe.",
  },
  {
    id: "overgeneralization",
    name: "Overgeneralization",
    shortDesc: "Viewing a single negative event as a permanent, never-ending pattern.",
    example: "I didn't get this internship interview, so nobody will ever hire me.",
    reframedTemplate: "Rejection is part of every career journey. This specific opportunity was not the right fit, but my skills and future opportunities remain intact.",
  },
];

export const StudentChatbot: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [streamingText, setStreamingText] = useState("");

  // Coping Tools State
  const [activeExercise, setActiveExercise] = useState<"breathing" | "grounding" | null>(null);
  const [breathingMode, setBreathingMode] = useState<"box" | "relax478">("box");
  const [breathingPhase, setBreathingPhase] = useState<string>("Inhale");
  const [breathingCount, setBreathingCount] = useState<number>(4);

  // 5-4-3-2-1 Grounding State
  const [groundingStepIdx, setGroundingStepIdx] = useState<number>(0);
  const [groundingCompleted, setGroundingCompleted] = useState<boolean>(false);

  // Cognitive Reframer Modal State
  const [isReframerOpen, setIsReframerOpen] = useState(false);
  const [selectedDistortion, setSelectedDistortion] = useState<Distortion>(COGNITIVE_DISTORTIONS[0]);
  const [negativeThought, setNegativeThought] = useState("");
  const [reframedThought, setReframedThought] = useState("");

  // Emergency SOS Modal State
  const [isSOSOpen, setIsSOSOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Dual Breathing Pacer Timer Effect
  useEffect(() => {
    if (activeExercise !== "breathing") return;

    interface PhaseDef {
      name: string;
      duration: number;
    }

    const boxPhases: PhaseDef[] = [
      { name: "Inhale", duration: 4 },
      { name: "Hold", duration: 4 },
      { name: "Exhale", duration: 4 },
      { name: "Hold", duration: 4 },
    ];

    const relaxPhases: PhaseDef[] = [
      { name: "Inhale", duration: 4 },
      { name: "Hold", duration: 7 },
      { name: "Exhale", duration: 8 },
    ];

    const phases = breathingMode === "box" ? boxPhases : relaxPhases;
    let phaseIdx = 0;
    let secondsLeft = phases[0].duration;

    setBreathingPhase(phases[0].name);
    setBreathingCount(secondsLeft);

    const interval = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft <= 0) {
        phaseIdx = (phaseIdx + 1) % phases.length;
        setBreathingPhase(phases[phaseIdx].name);
        secondsLeft = phases[phaseIdx].duration;
      }
      setBreathingCount(secondsLeft);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeExercise, breathingMode]);

  // 1. Fetch Student Conversations
  const {
    data: conversations = [],
    isLoading: isConversationsLoading,
    refetch: refetchConversations,
  } = useQuery({
    queryKey: ["conversations"],
    queryFn: chatAPI.listConversations,
  });

  // Auto-select first conversation or null
  useEffect(() => {
    if (!activeConvId && conversations.length > 0) {
      setActiveConvId(conversations[0].id);
    }
  }, [conversations, activeConvId]);

  // 2. Fetch Active Conversation Details & Messages
  const {
    data: activeConvDetails,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ["conversation", activeConvId],
    queryFn: () => (activeConvId ? chatAPI.getConversationDetails(activeConvId) : null),
    enabled: !!activeConvId,
    refetchInterval: false,
  });

  const messages: ChatMessageItem[] = activeConvDetails?.messages || [];

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  // 3. Mutation: Create Conversation
  const createConvMutation = useMutation({
    mutationFn: (title?: string) => chatAPI.createConversation(title),
    onSuccess: (newConv) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setActiveConvId(newConv.id);
      toast({
        title: "New Chat Started",
        description: "Your confidential wellness chat session is ready.",
        variant: "default",
      });
    },
    onError: () => {
      toast({
        title: "Could not start chat",
        description: "Please check your network connection.",
        variant: "destructive",
      });
    },
  });

  // 4. Mutation: Send Message
  const sendMessageMutation = useMutation({
    mutationFn: ({ convId, text }: { convId: string; text: string }) =>
      chatAPI.sendMessage(convId, text),
    onSuccess: (data: ChatResponsePayload) => {
      queryClient.invalidateQueries({ queryKey: ["conversation", activeConvId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setIsSending(false);

      if (data.risk.level === "RED") {
        toast({
          title: "Support Alert Activated",
          description: "We're here for you. Immediate helpline connections are provided.",
          variant: "destructive",
        });
      }
    },
    onError: (err: any) => {
      setIsSending(false);
      toast({
        title: "Message failed to send",
        description: err.response?.data?.detail || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isSending) return;

    let targetConvId = activeConvId;

    // If no conversation exists yet, create one first
    if (!targetConvId) {
      try {
        const newConv = await chatAPI.createConversation();
        targetConvId = newConv.id;
        setActiveConvId(newConv.id);
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      } catch {
        toast({
          title: "Error",
          description: "Could not create conversation.",
          variant: "destructive",
        });
        return;
      }
    }

    setInputMessage("");
    setIsSending(true);
    setStreamingText("");

    // Detect if user is asking for grounding or breathing exercise
    const lowerText = text.toLowerCase();
    if (
      lowerText.includes("breath") ||
      lowerText.includes("calm down") ||
      lowerText.includes("anxious") ||
      lowerText.includes("panic")
    ) {
      setActiveExercise("breathing");
    }

    // Use SSE Streaming endpoint for word-by-word real-time stream
    try {
      const response = await fetch(`/api/v1/chat/conversations/${targetConvId}/messages/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        // Fallback to standard mutation
        sendMessageMutation.mutate({ convId: targetConvId, text });
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulated = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunkStr = decoder.decode(value, { stream: true });
          const lines = chunkStr.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const parsed = JSON.parse(line.substring(6));
                if (parsed.type === "token") {
                  accumulated += parsed.content;
                  setStreamingText(accumulated);
                } else if (parsed.type === "done") {
                  queryClient.invalidateQueries({ queryKey: ["conversation", targetConvId] });
                  queryClient.invalidateQueries({ queryKey: ["conversations"] });
                  setIsSending(false);
                  setStreamingText("");
                  return;
                }
              } catch (parseErr) {
                // Ignore chunk parse edges
              }
            }
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ["conversation", targetConvId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setIsSending(false);
      setStreamingText("");
    } catch (streamErr) {
      sendMessageMutation.mutate({ convId: targetConvId, text });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNextGroundingStep = () => {
    if (groundingStepIdx < GROUNDING_STEPS.length - 1) {
      setGroundingStepIdx((prev) => prev + 1);
    } else {
      setGroundingCompleted(true);
    }
  };

  const handleResetGrounding = () => {
    setGroundingStepIdx(0);
    setGroundingCompleted(false);
  };

  const handleSendReframedToChat = () => {
    if (!negativeThought.trim()) {
      toast({
        title: "Missing thought",
        description: "Please enter your automatic negative thought.",
        variant: "destructive",
      });
      return;
    }

    const balancedText = reframedThought.trim() || selectedDistortion.reframedTemplate;
    const message = `I worked through a CBT cognitive reframing exercise.\n\nNegative Thought: "${negativeThought.trim()}"\nIdentified Distortion: ${selectedDistortion.name}\nReframed Perspective: "${balancedText}"\n\nCan you give me encouraging feedback on this reframe and how to remember it when stressed?`;

    setIsReframerOpen(false);
    setNegativeThought("");
    setReframedThought("");
    handleSendMessage(message);
  };

  return (
    <div className="flex h-[calc(100vh-8.5rem)] w-full gap-4 overflow-hidden rounded-2xl bg-white/70 p-2 shadow-xl backdrop-blur-md dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800">
      {/* LEFT SIDEBAR: Conversations List */}
      <div className="hidden w-72 flex-col rounded-xl border border-slate-200/60 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-950/40 md:flex">
        <button
          onClick={() => createConvMutation.mutate("New Wellness Conversation")}
          disabled={createConvMutation.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          <span>New Chat</span>
        </button>

        <div className="mt-4 flex items-center justify-between px-2 text-xs font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
          <span>Recent Conversations</span>
          <span>{conversations.length}</span>
        </div>

        <div className="mt-2 flex-1 space-y-1 overflow-y-auto pr-1">
          {isConversationsLoading ? (
            <div className="p-4 text-center text-xs text-slate-400">Loading chats...</div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No conversations yet. Start a new chat to begin!
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === activeConvId;
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-medium transition-all",
                    isActive
                      ? "bg-indigo-50 text-indigo-700 shadow-sm dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold"
                      : "text-slate-600 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:bg-slate-900/60"
                  )}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <MessageSquare className="h-4 w-4 shrink-0 text-indigo-500/70" />
                    <span className="truncate">{conv.title}</span>
                  </div>
                  {conv.current_risk_level === "RED" && (
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="mt-auto border-t border-slate-200/60 pt-3 dark:border-slate-800">
          <div className="flex items-center gap-2 px-2 text-[11px] text-slate-400 dark:text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>256-Bit Encrypted & Confidential</span>
          </div>
        </div>
      </div>

      {/* RIGHT MAIN CHAT AREA */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/60 bg-white/50 dark:border-slate-800 dark:bg-slate-950/20">
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-slate-200/60 px-5 py-3.5 backdrop-blur dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/20">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  MindGuard Companion
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  AI Active
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Safe, non-judgmental student wellness guidance & CBT micro-tools
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSOSOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition-all shadow-sm"
              title="Open Emergency SOS Gateway"
            >
              <PhoneCall className="h-3.5 w-3.5 animate-pulse" />
              <span>SOS Help</span>
            </button>
            <button
              onClick={() => {
                refetchConversations();
                if (activeConvId) refetchMessages();
              }}
              title="Refresh conversation"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-inner dark:bg-indigo-950/60 dark:text-indigo-400">
                <Sparkles className="h-8 w-8 animate-pulse" />
              </div>
              <h4 className="mt-4 text-base font-semibold text-slate-800 dark:text-slate-100">
                Welcome to your Wellness Chat
              </h4>
              <p className="mt-1 max-w-sm text-xs text-slate-400 dark:text-slate-500">
                I'm here to support you with exam stress, anxiety, emotional check-ins, or just
                having a listening ear in complete privacy.
              </p>

              {/* Quick Prompts */}
              <div className="mt-6 grid max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white/80 p-3 text-left text-xs text-slate-600 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-indigo-700"
                  >
                    <span>{prompt}</span>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isStudent = msg.sender === "STUDENT";
              const isRed = msg.risk_level === "RED";

              return (
                <div
                  key={msg.id}
                  className={cn("flex w-full gap-3", isStudent ? "justify-end" : "justify-start")}
                >
                  {!isStudent && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-500/20">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div className={cn("max-w-xl space-y-2", isStudent ? "items-end" : "items-start")}>
                    {/* Bubble */}
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm transition-all",
                        isStudent
                          ? "rounded-tr-none bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-indigo-500/10"
                          : isRed
                          ? "rounded-tl-none border border-rose-300 bg-rose-50/90 text-slate-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-slate-100"
                          : "rounded-tl-none border border-slate-200/80 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                      )}
                    >
                      <div className="whitespace-pre-wrap">{msg.message}</div>
                    </div>

                    {/* Metadata & Badges */}
                    {!isStudent && (
                      <div className="flex flex-wrap items-center gap-1.5 px-1 text-[10px]">
                        {msg.primary_emotion && (
                          <span
                            className={cn(
                              "rounded-md border px-1.5 py-0.5 font-medium uppercase tracking-wide",
                              emotionBadgeColor[msg.primary_emotion.toLowerCase()] ||
                                emotionBadgeColor.neutral
                            )}
                          >
                            {msg.primary_emotion}
                          </span>
                        )}
                        {msg.intent && (
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            {msg.intent.replace(/_/g, " ")}
                          </span>
                        )}
                        <span className="text-slate-400">
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    )}

                    {/* RED Crisis Support Card */}
                    {isRed && !isStudent && (
                      <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 shadow-sm dark:border-rose-900/60 dark:bg-rose-950/50">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-semibold text-xs">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span>Immediate Crisis Helplines (24/7 Free & Confidential)</span>
                          </div>
                          <button
                            onClick={() => setIsSOSOpen(true)}
                            className="text-[10px] font-bold text-rose-600 underline hover:text-rose-700"
                          >
                            Open SOS Gateway
                          </button>
                        </div>
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          <a
                            href="tel:14416"
                            className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-700"
                          >
                            <PhoneCall className="h-3.5 w-3.5" />
                            <span>Call Tele-MANAS (14416)</span>
                          </a>
                          <a
                            href="tel:18005990019"
                            className="flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 shadow-sm hover:bg-rose-50 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-300"
                          >
                            <PhoneCall className="h-3.5 w-3.5" />
                            <span>KIRAN (1800-599-0019)</span>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {isStudent && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <UserIcon className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Live Streaming Response Bubble */}
          {isSending && streamingText && (
            <div className="flex w-full gap-3 justify-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-500/20">
                <Bot className="h-4 w-4" />
              </div>
              <div className="max-w-xl space-y-2">
                <div className="rounded-2xl rounded-tl-none border border-slate-200/80 bg-white px-4 py-3 text-xs leading-relaxed shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                  <div className="whitespace-pre-wrap">{streamingText}</div>
                  <span className="inline-block h-3 w-1.5 ml-1 bg-indigo-600 animate-pulse" />
                </div>
              </div>
            </div>
          )}

          {/* Typing Indicator */}
          {isSending && !streamingText && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Bot className="h-4 w-4 animate-spin" />
              </div>
              <div className="rounded-2xl rounded-tl-none border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-600 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-600 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-600" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* IN-CHAT DUAL BREATHING PACER WIDGET */}
        {activeExercise === "breathing" && (
          <div className="mx-4 mb-2 p-4 rounded-xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/95 via-purple-50/95 to-violet-50/95 dark:border-indigo-900/60 dark:bg-slate-900/95 shadow-md animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Visual breathing ring */}
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600/10 border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-inner">
                  <span className="text-base font-black">{breathingCount}s</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Wind className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                      {breathingMode === "box" ? "Box Breathing (4-4-4-4)" : "4-7-8 Relaxing Breath"} :{" "}
                      <span className="text-indigo-600 dark:text-indigo-400 uppercase tracking-wider underline">
                        {breathingPhase}
                      </span>
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                    {breathingMode === "box"
                      ? "Inhale (4s) → Hold (4s) → Exhale (4s) → Hold (4s). Regulates heart rate variability & autonomic tension."
                      : "Inhale (4s) → Hold (7s) → Exhale (8s). Deep parasympathetic vagal stimulation for rapid relaxation."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Mode Switcher */}
                <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-0.5 text-[11px] font-semibold">
                  <button
                    onClick={() => setBreathingMode("box")}
                    className={cn(
                      "px-2.5 py-1 rounded-md transition-all",
                      breathingMode === "box"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    )}
                  >
                    Box 4-4-4-4
                  </button>
                  <button
                    onClick={() => setBreathingMode("relax478")}
                    className={cn(
                      "px-2.5 py-1 rounded-md transition-all",
                      breathingMode === "relax478"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    )}
                  >
                    Relax 4-7-8
                  </button>
                </div>

                <button
                  onClick={() => setActiveExercise(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-slate-800"
                  title="Close Exercise"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* IN-CHAT 5-4-3-2-1 SENSORY GROUNDING WIDGET */}
        {activeExercise === "grounding" && (
          <div className="mx-4 mb-2 p-4 rounded-xl border border-teal-200/80 bg-gradient-to-r from-teal-50/95 via-emerald-50/95 to-cyan-50/95 dark:border-teal-900/60 dark:bg-slate-900/95 shadow-md animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5 flex-1">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md shadow-teal-600/20">
                  {React.createElement(GROUNDING_STEPS[groundingStepIdx].icon, { className: "h-5 w-5" })}
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-600/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                      Step {groundingStepIdx + 1} of 5 &bull; {GROUNDING_STEPS[groundingStepIdx].sense}
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {GROUNDING_STEPS[groundingStepIdx].label}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {GROUNDING_STEPS[groundingStepIdx].prompt}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!groundingCompleted ? (
                  <button
                    onClick={handleNextGroundingStep}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-all"
                  >
                    <span>{groundingStepIdx === GROUNDING_STEPS.length - 1 ? "Complete" : "Next Sense"}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleResetGrounding}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-teal-300 bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 text-xs font-medium hover:bg-teal-50"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Restart</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveExercise(null);
                        handleSendMessage(
                          "I just completed the 5-4-3-2-1 sensory grounding exercise and brought my attention back to the room."
                        );
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-sm hover:bg-emerald-700"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Share to Chat</span>
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setActiveExercise(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-slate-800"
                  title="Close Exercise"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Step Progress Dots */}
            <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-teal-200/40 dark:border-teal-900/40">
              {GROUNDING_STEPS.map((step, idx) => (
                <button
                  key={step.count}
                  onClick={() => setGroundingStepIdx(idx)}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-all",
                    idx === groundingStepIdx
                      ? "bg-teal-600 shadow-sm"
                      : idx < groundingStepIdx
                      ? "bg-teal-400"
                      : "bg-slate-200 dark:bg-slate-700"
                  )}
                  title={step.label}
                />
              ))}
            </div>
          </div>
        )}

        {/* QUICK COPING EXERCISES ACTION BAR */}
        <div className="px-4 py-2 flex items-center gap-2 border-t border-slate-200/40 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/40 overflow-x-auto">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
            Coping Tools:
          </span>

          {/* Breathing Toggle */}
          <button
            onClick={() => setActiveExercise(activeExercise === "breathing" ? null : "breathing")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all shrink-0",
              activeExercise === "breathing"
                ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-indigo-400"
            )}
          >
            <Wind className="h-3.5 w-3.5 text-indigo-500" />
            <span>Breathing Pacer (Dual Mode)</span>
          </button>

          {/* 5-4-3-2-1 Sensory Grounding Toggle */}
          <button
            onClick={() => setActiveExercise(activeExercise === "grounding" ? null : "grounding")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all shrink-0",
              activeExercise === "grounding"
                ? "bg-teal-600 border-teal-600 text-white shadow-sm"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-teal-400"
            )}
          >
            <Compass className="h-3.5 w-3.5 text-teal-500" />
            <span>5-4-3-2-1 Grounding</span>
          </button>

          {/* Cognitive Thought Distortion Reframer Trigger */}
          <button
            onClick={() => setIsReframerOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 shrink-0 transition-all"
          >
            <BrainCircuit className="h-3.5 w-3.5 text-violet-500" />
            <span>Thought Reframer (CBT)</span>
          </button>

          {/* Direct Emergency SOS Trigger */}
          <button
            onClick={() => setIsSOSOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 shrink-0 ml-auto transition-all"
          >
            <PhoneCall className="h-3.5 w-3.5 text-rose-600 animate-pulse" />
            <span>Crisis SOS</span>
          </button>
        </div>

        {/* Input Box */}
        <div className="border-t border-slate-200/60 p-3 sm:p-4 dark:border-slate-800">
          <div className="relative flex items-end gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-inner focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900">
            <textarea
              rows={2}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message here in complete privacy... (Press Enter to send)"
              className="max-h-28 flex-1 resize-none bg-transparent px-2 py-1 text-xs text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isSending}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-500/20 transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-slate-400 dark:text-slate-500">
            <span>MindGuard AI provides supportive peer guidance, not clinical diagnoses.</span>
            <span>{inputMessage.length} / 4000</span>
          </div>
        </div>
      </div>

      {/* CBT COGNITIVE THOUGHT DISTORTION REFRACTION MODAL */}
      {isReframerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-2xl border border-violet-500/30 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-5 text-slate-800 dark:text-slate-100">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 shadow-inner">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    CBT Thought Reframer
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Identify cognitive distortions and reconstruct a balanced perspective
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReframerOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Step 1: Select Distortion */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                1. Select the Cognitive Pattern:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COGNITIVE_DISTORTIONS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedDistortion(item);
                      if (!negativeThought) {
                        setNegativeThought(item.example);
                      }
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all",
                      selectedDistortion.id === item.id
                        ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:border-violet-300"
                    )}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-violet-600 dark:text-violet-400 bg-violet-50/60 dark:bg-violet-950/30 p-2 rounded-lg border border-violet-200/50 dark:border-violet-900/40">
                <strong>{selectedDistortion.name}:</strong> {selectedDistortion.shortDesc}
              </p>
            </div>

            {/* Step 2: Automatic Negative Thought (ANT) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  2. Your Automatic Thought (ANT):
                </label>
                <button
                  type="button"
                  onClick={() => setNegativeThought(selectedDistortion.example)}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Load Example
                </button>
              </div>
              <textarea
                rows={2}
                value={negativeThought}
                onChange={(e) => setNegativeThought(e.target.value)}
                placeholder="e.g., If I make one mistake on my presentation, everyone will laugh and I'll fail..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              />
            </div>

            {/* Step 3: Reframed Perspective */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  3. Balanced Reframed Perspective:
                </label>
                <button
                  type="button"
                  onClick={() => setReframedThought(selectedDistortion.reframedTemplate)}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Apply Suggested Reframe
                </button>
              </div>
              <textarea
                rows={3}
                value={reframedThought}
                onChange={(e) => setReframedThought(e.target.value)}
                placeholder={selectedDistortion.reframedTemplate}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsReframerOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendReframedToChat}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-600/20 transition-all"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send Reflection to Chatbot</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REUSABLE EMERGENCY SOS MODAL */}
      <EmergencySOSModal isOpen={isSOSOpen} onClose={() => setIsSOSOpen(false)} />
    </div>
  );
};

export default StudentChatbot;
