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
  Smile,
  Frown,
  Meh,
  Activity,
  Zap,
  Wind,
  Compass,
  CheckCircle2,
  X,
  Play,
  Pause,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatAPI, ConversationSummary, ChatMessageItem, ChatResponsePayload } from "@/services/api";
import { cn } from "@/utils/cn";
import { useToast } from "@/components/ui/toast";

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

export const StudentChatbot: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [activeExercise, setActiveExercise] = useState<"breathing" | "grounding" | null>(null);
  const [breathingPhase, setBreathingPhase] = useState<"Inhale" | "Hold" | "Exhale" | "Pause">("Inhale");
  const [breathingCount, setBreathingCount] = useState<number>(4);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Box breathing timer effect
  useEffect(() => {
    if (activeExercise !== "breathing") return;
    const phases: Array<"Inhale" | "Hold" | "Exhale" | "Pause"> = ["Inhale", "Hold", "Exhale", "Pause"];
    let phaseIndex = 0;
    let count = 4;

    const interval = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        phaseIndex = (phaseIndex + 1) % phases.length;
        setBreathingPhase(phases[phaseIndex]);
        count = 4;
      }
      setBreathingCount(count);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeExercise]);


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
    isLoading: isMessagesLoading,
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
    if (lowerText.includes("breath") || lowerText.includes("calm down") || lowerText.includes("anxious") || lowerText.includes("panic")) {
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
      // Fallback
      sendMessageMutation.mutate({ convId: targetConvId, text });
    }
  };


  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
                Safe, non-judgmental student wellness guidance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
                        <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-semibold text-xs">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          <span>Immediate Crisis Helplines (24/7 Free & Confidential)</span>
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

          {/* Typing Indicator (shown before first token arrives) */}
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

        {/* In-Chat Coping Tools Widget */}
        {activeExercise === "breathing" && (
          <div className="mx-4 mb-2 p-4 rounded-xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/90 to-violet-50/90 dark:border-indigo-900/60 dark:bg-slate-900/90 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600/10 border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400">
                <span className="text-sm font-black">{breathingCount}s</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <Wind className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Box Breathing: <span className="text-indigo-600 dark:text-indigo-400 uppercase">{breathingPhase}</span>
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Inhale for 4s, hold for 4s, exhale for 4s, hold for 4s to regulate autonomic nervous system.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveExercise(null)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Quick Coping Exercises Action Bar */}
        <div className="px-4 py-1.5 flex items-center gap-2 border-t border-slate-200/40 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/40 overflow-x-auto">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
            Coping Tools:
          </span>
          <button
            onClick={() => setActiveExercise(activeExercise === "breathing" ? null : "breathing")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all shrink-0",
              activeExercise === "breathing"
                ? "bg-indigo-600 border-indigo-600 text-white"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-indigo-400"
            )}
          >
            <Wind className="h-3.5 w-3.5 text-indigo-500" />
            <span>Box Breathing (4-4-4-4)</span>
          </button>
          <button
            onClick={() => {
              handleSendMessage("Can you guide me through the 5-4-3-2-1 sensory grounding technique?");
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-indigo-400 shrink-0 transition-all"
          >
            <Compass className="h-3.5 w-3.5 text-indigo-500" />
            <span>5-4-3-2-1 Grounding</span>
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
    </div>
  );
};

export default StudentChatbot;
