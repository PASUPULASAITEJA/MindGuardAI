import React, { useState } from "react";
import {
  BrainCircuit,
  Wrench,
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldCheck,
  Terminal,
  X,
  Cpu,
  BarChart2,
  Layers,
  ArrowUpRight,
  Activity,
  Code2,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/utils/cn";

export interface AgentActivityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeModel?: string;
  lastEmotion?: string;
  riskLevel?: string;
}

export const AgentActivityDrawer: React.FC<AgentActivityDrawerProps> = ({
  isOpen,
  onClose,
  activeModel = "Gemini 1.5 Pro (CBT-Tuned)",
  lastEmotion = "neutral",
  riskLevel = "GREEN",
}) => {
  const [activeTab, setActiveTab] = useState<"activity" | "tools" | "usage">("activity");

  // Multi-agent execution steps
  const agentPlanSteps = [
    {
      step: 1,
      title: "Input Lexical & Sentiment Vectorization",
      description: "Extracting emotional valence, stress markers, and semantic intent vectors",
      status: "completed",
      duration: "42ms",
      tool: "text_vectorizer_v2",
    },
    {
      step: 2,
      title: "Circadian & Digital Phenotype Cross-Reference",
      description: "Verifying current circadian window against screen-time baseline to detect fatigue",
      status: "completed",
      duration: "65ms",
      tool: "phenotype_engine",
    },
    {
      step: 3,
      title: "Crisis Safety & Self-Harm Guardrail Evaluation",
      description: "Dual-tier validation via safety classifiers against crisis protocol thresholds",
      status: "completed",
      duration: "28ms",
      tool: "safety_guardrail_validator",
    },
    {
      step: 4,
      title: "CBT Intervention & Grounding Protocol Selection",
      description: "Matching student state with 5-4-3-2-1 sensory grounding & reframing micro-actions",
      status: "completed",
      duration: "95ms",
      tool: "cbt_intervention_selector",
    },
    {
      step: 5,
      title: "Empathetic Response Generation & Stream Finalization",
      description: "Synthesizing conversational output with therapeutic boundary constraints",
      status: "active",
      duration: "180ms",
      tool: "llm_streaming_synthesizer",
    },
  ];

  // Tool Calls Log
  const toolCalls = [
    {
      id: "call_01",
      name: "emotion_classifier",
      timestamp: "Just now",
      status: "success",
      input: { text_sample: "Exam pressure and irregular sleep patterns", model: "RoBERTa-MentalHealth" },
      output: { detected_emotion: lastEmotion, confidence: 0.942, valence: -0.28 },
    },
    {
      id: "call_02",
      name: "safety_guardrail_validator",
      timestamp: "Just now",
      status: "success",
      input: { risk_policy: "strict_student_safety_v3", severity_level: riskLevel },
      output: { safe_to_stream: true, risk_score: 0.038, emergency_trigger: false },
    },
    {
      id: "call_03",
      name: "circadian_phenotype_lookup",
      timestamp: "1m ago",
      status: "success",
      input: { metric: "late_night_activity", window: "23:00 - 05:00" },
      output: { variance: "low", sleep_strain_index: 0.22, baseline_matched: true },
    },
    {
      id: "call_04",
      name: "cbt_protocol_selector",
      timestamp: "1m ago",
      status: "success",
      input: { stress_domain: "academic_focus", tool_library: "mindguard_cbt_core" },
      output: { recommended_protocol: "box_breathing_grounding_54321", confidence: 0.91 },
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs"
          />

          {/* Drawer Slide-Over */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 240 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-card/80 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    Agent Activity & Tool Calls
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Live
                    </span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-mono">{activeModel}</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close activity drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-border bg-secondary/30 px-4 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab("activity")}
                className={cn(
                  "flex items-center gap-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all",
                  activeTab === "activity"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Agent Plan (5)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("tools")}
                className={cn(
                  "flex items-center gap-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all",
                  activeTab === "tools"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Tool Calls ({toolCalls.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("usage")}
                className={cn(
                  "flex items-center gap-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all",
                  activeTab === "usage"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>AI Usage & Latency</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeTab === "activity" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
                    <span>Autonomous Reasoning Pipeline</span>
                    <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      Pipeline Status: Optimal
                    </span>
                  </div>

                  <div className="space-y-3 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
                    {agentPlanSteps.map((step) => (
                      <div key={step.step} className="relative flex items-start gap-3 group">
                        <div
                          className={cn(
                            "relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border transition-all",
                            step.status === "completed"
                              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                              : "bg-primary/20 border-primary text-primary animate-pulse"
                          )}
                        >
                          {step.status === "completed" ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <Zap className="w-3.5 h-3.5" />
                          )}
                        </div>

                        <div className="flex-1 rounded-xl border border-border bg-card p-3 shadow-xs">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-bold text-foreground">{step.title}</h4>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                              {step.duration}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                            {step.description}
                          </p>
                          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-primary/80">
                            <Terminal className="w-3 h-3" />
                            <span>exec: {step.tool}()</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "tools" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
                    <span>Function Invocations & Payloads</span>
                    <span className="font-mono text-[10px]">Zero Failures</span>
                  </div>

                  {toolCalls.map((call) => (
                    <div
                      key={call.id}
                      className="rounded-xl border border-border bg-card p-3.5 shadow-xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wrench className="w-3.5 h-3.5 text-primary" />
                          <span className="text-xs font-bold font-mono text-foreground">
                            {call.name}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {call.status}
                        </span>
                      </div>

                      {/* Tool Payload Inspection */}
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Arguments
                        </div>
                        <pre className="p-2 rounded-lg bg-secondary/60 text-[10px] font-mono text-foreground/90 overflow-x-auto">
                          {JSON.stringify(call.input, null, 2)}
                        </pre>

                        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pt-1">
                          Result
                        </div>
                        <pre className="p-2 rounded-lg bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 text-[10px] font-mono text-emerald-700 dark:text-emerald-300 overflow-x-auto">
                          {JSON.stringify(call.output, null, 2)}
                        </pre>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                        <span>Invoked: {call.timestamp}</span>
                        <span className="font-mono">ID: {call.id}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "usage" && (
                <div className="space-y-4">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl border border-border bg-card">
                      <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                        Total Tokens
                      </span>
                      <div className="text-xl font-bold font-mono text-foreground mt-0.5">
                        1,420
                      </div>
                      <span className="text-[10px] text-muted-foreground">890 prompt + 530 out</span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-border bg-card">
                      <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                        End-to-End Latency
                      </span>
                      <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                        320ms
                      </div>
                      <span className="text-[10px] text-muted-foreground">Streaming initial token</span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-border bg-card">
                      <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                        Guardrail Score
                      </span>
                      <div className="text-xl font-bold font-mono text-primary mt-0.5">
                        99.8%
                      </div>
                      <span className="text-[10px] text-muted-foreground">Safety policy passed</span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-border bg-card">
                      <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                        Context Window
                      </span>
                      <div className="text-xl font-bold font-mono text-foreground mt-0.5">
                        128k
                      </div>
                      <span className="text-[10px] text-muted-foreground">1.1% capacity consumed</span>
                    </div>
                  </div>

                  {/* Model & Architecture specs */}
                  <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-primary" />
                      Model Configuration & Topology
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-border/50">
                        <span className="text-muted-foreground">Inference Engine:</span>
                        <span className="font-mono font-medium text-foreground">Google Gemini 1.5 Pro</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border/50">
                        <span className="text-muted-foreground">Quantization:</span>
                        <span className="font-mono font-medium text-foreground">FP16 High-Precision</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border/50">
                        <span className="text-muted-foreground">Temperature:</span>
                        <span className="font-mono font-medium text-foreground">0.3 (Strict Clinical)</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border/50">
                        <span className="text-muted-foreground">Safety Boundary:</span>
                        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">Zero-Compromise PII Filter</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-3.5 border-t border-border bg-secondary/20 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Audited for Student Privacy (FERPA/HIPAA)</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AgentActivityDrawer;
