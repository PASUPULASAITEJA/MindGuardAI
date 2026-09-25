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
import { chatAPI, ChatMessageItem, ChatResponsePayload, getAccessToken } from "@/services/api";
import { cn } from "@/utils/cn";
import { useToast } from "@/components/ui/toast";
import { EmergencySOSModal } from "@/components/EmergencySOSModal";

interface QuickPrompt {
  title: string;
  desc: string;
  prompt: string;
  icon: string;
}

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    title: "I'm feeling stressed",
    desc: "Decompress current feelings with calm guided reflection",
    prompt: "I'm feeling stressed right now and need some help sorting through what I'm experiencing.",
    icon: "🌿",
  },
  {
    title: "Help me manage exam pressure",
    desc: "Academic organization and cognitive focus strategy",
    prompt: "Help me manage exam pressure and heavy study deadlines without burning out.",
    icon: "🎓",
  },
  {
    title: "I want to talk to someone",
    desc: "Connect with campus counselling & crisis pathways",
    prompt: "I want to talk to someone about what I'm going through. Can you show me how to speak with a counselor?",
    icon: "🤝",
  },
  {
    title: "Show me relaxation resources",
    desc: "Box breathing, sensory grounding & sleep pacing",
    prompt: "Show me relaxation resources and evidence-based exercises to help steady my mind.",
    icon: "🧘",
  },
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
      const token = getAccessToken();
      const response = await fetch(`/api/v1/chat/conversations/${targetConvId}/messages/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
    <div className="flex h-[calc(100vh-8.5rem)] w-full gap-4 overflow-hidden rounded-2xl bg-card p-2 shadow-sm border border-border">
      {/* LEFT SIDEBAR: Conversations List */}
      <div className="hidden w-72 flex-col rounded-xl border border-border bg-secondary/30 p-3 md:flex">
        <button
          onClick={() => createConvMutation.mutate("New Wellness Conversation")}
          disabled={createConvMutation.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          <span>New Chat</span>
        </button>

        <div className="mt-4 flex items-center justify-between px-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          <span>Recent Conversations</span>
          <span>{conversations.length}</span>
        </div>

        <div className="mt-2 flex-1 space-y-1 overflow-y-auto pr-1">
          {isConversationsLoading ? (
            <div className="p-4 text-center text-xs text-muted-foreground">Loading chats...</div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
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
                      ? "bg-primary/10 text-primary border border-primary/20 font-bold"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <MessageSquare className="h-4 w-4 shrink-0 text-primary/70" />
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

        <div className="mt-auto border-t border-border/60 pt-3">
          <div className="flex items-center gap-2 px-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>256-Bit Encrypted & Confidential</span>
          </div>
        </div>
      </div>

      {/* RIGHT MAIN CHAT AREA */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card/95 dark:bg-card/90 backdrop-blur-xl shadow-sm">
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-5 py-3.5 bg-card/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 text-primary-foreground shadow-md shadow-primary/20">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">
                  MindGuardAI Companion
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  AI Active
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
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
            <div className="flex h-full flex-col items-center justify-center text-center py-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                <Sparkles className="h-7 w-7 animate-pulse" />
              </div>
              <h4 className="mt-4 text-base font-extrabold text-foreground">
                MindGuardAI Sanctuary Companion
              </h4>
              <p className="mt-1 max-w-md text-xs text-muted-foreground leading-relaxed">
                A private, confidential listening space for academic stress, emotional overwhelm, or gentle guided grounding exercises.
              </p>

              {/* Quick Prompts */}
              <div className="mt-6 grid max-w-lg grid-cols-1 gap-2.5 sm:grid-cols-2">
                {QUICK_PROMPTS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item.prompt)}
                    className="flex flex-col text-left p-3.5 rounded-2xl border border-border/80 bg-card hover:border-primary/40 hover:bg-primary/5 transition-all shadow-xs group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xl">{item.icon}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                      {item.title}
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      {item.desc}
                    </span>
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
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div className={cn("max-w-xl space-y-2", isStudent ? "items-end" : "items-start")}>
                    {/* Bubble */}
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs transition-all",
                        isStudent
                          ? "rounded-tr-none bg-primary text-primary-foreground font-medium"
                          : isRed
                          ? "rounded-tl-none border border-rose-500/30 bg-rose-500/10 text-foreground"
                          : "rounded-tl-none border border-border/80 bg-card text-foreground"
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
                              "rounded-md border px-1.5 py-0.5 font-bold uppercase tracking-wide",
                              emotionBadgeColor[msg.primary_emotion.toLowerCase()] ||
                                emotionBadgeColor.neutral
                            )}
                          >
                            {msg.primary_emotion}
                          </span>
                        )}
                        {msg.intent && (
                          <span className="rounded-md bg-secondary px-1.5 py-0.5 text-muted-foreground font-medium">
                            {msg.intent.replace(/_/g, " ")}
                          </span>
                        )}
                        <span className="text-muted-foreground">
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    )}

                    {/* RED Crisis Support Card */}
                    {isRed && !isStudent && (
                      <div className="mt-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 shadow-xs">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs">
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
                            className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700"
                          >
                            <PhoneCall className="h-3.5 w-3.5" />
                            <span>Call Tele-MANAS (14416)</span>
                          </a>
                          <a
                            href="tel:18005990019"
                            className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-card px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 shadow-xs hover:bg-rose-500/10"
                          >
                            <PhoneCall className="h-3.5 w-3.5" />
                            <span>KIRAN (1800-599-0019)</span>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {isStudent && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary border border-border text-foreground">
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
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                <Bot className="h-4 w-4" />
              </div>
              <div className="max-w-xl space-y-2">
                <div className="rounded-2xl rounded-tl-none border border-border/80 bg-card px-4 py-3 text-xs leading-relaxed shadow-xs text-foreground">
                  <div className="whitespace-pre-wrap">{streamingText}</div>
                  <span className="inline-block h-3 w-1.5 ml-1 bg-primary animate-pulse" />
                </div>
              </div>
            </div>
          )}

          {/* Typing Indicator */}
          {isSending && !streamingText && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                <Bot className="h-4 w-4 animate-spin" />
              </div>
              <div className="rounded-2xl rounded-tl-none border border-border bg-card px-4 py-3 text-xs text-muted-foreground shadow-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
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
        <div className="border-t border-border p-3 sm:p-4 bg-secondary/20">
          <div className="relative flex items-end gap-2 rounded-2xl border border-border bg-card p-2.5 shadow-xs focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <textarea
              rows={2}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message here in complete privacy... (Press Enter to send)"
              className="max-h-28 flex-1 resize-none bg-transparent px-2 py-1 text-xs text-foreground outline-none placeholder:text-muted-foreground"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isSending}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-muted-foreground">
            <span>MindGuardAI provides supportive peer guidance, not clinical diagnoses.</span>
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
