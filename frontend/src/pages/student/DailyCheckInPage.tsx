import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  Smile, 
  CheckCircle2, 
  Moon, 
  BatteryMedium, 
  HeartHandshake,
  Activity,
  ArrowRight,
  BookOpen,
  Flame,
  Calendar,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Clock,
  ChevronRight,
  Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSubmitJournal, useMoodHistory, JournalSubmissionResponse } from "@/hooks/useMood";
import { useLatestAssessment } from "@/hooks/usePredictions";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/utils/cn";
import { motion, AnimatePresence } from "motion/react";
import { pageVariants, staggerContainer, cardEntrance } from "@/utils/motion";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { DotGridBackground } from "@/components/ui/DotGridBackground";
import { ShinyText } from "@/components/ui/ShinyText";
import { LottieIllustration } from "@/components/ui/LottieIllustration";
import { GSAPMagnetic } from "@/components/ui/gsap-magnetic";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

const MOOD_OPTIONS = [
  { score: 2, label: "Difficult", symbol: "😔", color: "rose", helper: "Stressed or overwhelmed" },
  { score: 4, label: "Low", symbol: "😕", color: "amber", helper: "Feeling drained or low on energy" },
  { score: 6, label: "Okay", symbol: "😐", color: "slate", helper: "Getting through the day as usual" },
  { score: 8, label: "Good", symbol: "🙂", color: "emerald", helper: "Calm, focused & productive" },
  { score: 10, label: "Great", symbol: "😊", color: "indigo", helper: "Energized, optimistic & engaged" },
];

const INFLUENCE_TAGS = [
  { id: "academics", label: "Academics & Exams", icon: "📚" },
  { id: "sleep", label: "Sleep Quality", icon: "😴" },
  { id: "social", label: "Friends & Social", icon: "👥" },
  { id: "health", label: "Physical Health", icon: "🏃" },
  { id: "screen", label: "Screen Fatigue", icon: "💻" },
  { id: "routine", label: "Daily Routine", icon: "🌤️" },
];

const PROMPT_CHIPS = [
  "Today I felt challenged by...",
  "One positive highlight was...",
  "I am feeling grateful for...",
];

export const DailyCheckInPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const submitJournal = useSubmitJournal();

  const { data: history = [] } = useMoodHistory("7d");
  const { data: latestAssessment } = useLatestAssessment();

  const queryMood = searchParams.get("mood") ? Number(searchParams.get("mood")) : null;
  const [selectedMood, setSelectedMood] = useState<number>(queryMood || 8);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [energyLevel, setEnergyLevel] = useState<number>(7);
  const [sleepHours, setSleepHours] = useState<number>(7.5);
  const [journalContent, setJournalContent] = useState<string>("");
  const [result, setResult] = useState<JournalSubmissionResponse | null>(null);

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const toggleTag = (id: string) => {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const applyPrompt = (prompt: string) => {
    if (!journalContent) {
      setJournalContent(prompt + " ");
    } else {
      setJournalContent((prev) => `${prev}\n${prompt} `);
    }
  };

  // Helper labels for sliders
  const getEnergyText = (val: number) => {
    if (val <= 3) return "Low stamina";
    if (val <= 7) return "Moderate energy";
    return "High energy & focus";
  };

  const getSleepText = (hrs: number) => {
    if (hrs < 6) return "Sleep deficit (<6h)";
    if (hrs <= 8.5) return "Optimal rest (7-8h)";
    return "Extended rest (>8.5h)";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const tagLabels = selectedTags
      .map((t) => INFLUENCE_TAGS.find((tag) => tag.id === t)?.label)
      .filter(Boolean);

    const tagSummary = tagLabels.length > 0 ? ` Contributing factors: ${tagLabels.join(", ")}.` : "";
    const payload = {
      content:
        journalContent.trim()
          ? `${journalContent.trim()}${tagSummary}`
          : `Daily mood check-in: Feeling ${
              MOOD_OPTIONS.find((m) => m.score === selectedMood)?.label || "okay"
            }.${tagSummary} Energy level: ${energyLevel}/10. Sleep duration: ${sleepHours} hours.`,
      self_reported_score: selectedMood,
    };

    try {
      const res = await submitJournal.mutateAsync(payload);
      setResult(res);
      toast({
        title: "Check-in Recorded",
        description: `Wellbeing Score calculated: ${res.mental_wellness_score}/100.`,
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Check-in Saved",
        description: "Your daily check-in has been added to your timeline.",
        variant: "default",
      });
      navigate("/student/dashboard");
    }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="relative w-full space-y-6 pb-12 font-sans text-foreground"
    >
      <DotGridBackground />

      {/* Top Banner Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-0.5">
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
            <ShinyText text="Daily Emotional Check-In" />
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Log your daily emotional pulse, energy stamina, and sleep patterns to calibrate your baseline.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-xl border border-border bg-card/70 backdrop-blur-sm text-xs font-medium text-muted-foreground">
          <Calendar className="w-3.5 h-3.5 text-primary" />
          <span>{todayFormatted}</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {result ? (
          /* Post-submission Result View */
          <motion.div
            key="result-card"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto"
          >
            <Card className="p-6 sm:p-8 space-y-6 text-center border-border/80 bg-card/90 backdrop-blur-md shadow-2xl rounded-2xl">
              <div className="h-16 w-16 flex items-center justify-center mx-auto">
                <LottieIllustration variant="success" className="h-16 w-16" loop={false} />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-xl font-bold text-foreground">Check-in Successfully Recorded</h2>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                  Your emotional pulse has been processed into your longitudinal wellbeing record.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-center">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Updated Wellbeing Score
                  </span>
                  <span className="text-3xl font-extrabold text-foreground mt-1 block font-mono">
                    <AnimatedCounter value={result.mental_wellness_score} />{" "}
                    <span className="text-xs text-muted-foreground font-normal">/ 100</span>
                  </span>
                </div>
                <div className="p-4 rounded-xl border border-border bg-secondary/30 text-center flex flex-col justify-center">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Clinical Risk Status
                  </span>
                  <span
                    className={cn(
                      "text-sm font-bold mt-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-0.5 rounded-full mx-auto",
                      result.risk_level === "LOW"
                        ? "text-emerald-600 bg-emerald-500/10"
                        : result.risk_level === "MEDIUM"
                        ? "text-amber-600 bg-amber-500/10"
                        : "text-rose-600 bg-rose-500/10"
                    )}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {result.risk_level} RISK
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button
                  size="sm"
                  onClick={() => navigate("/student/dashboard")}
                  className="text-xs font-semibold px-5 h-9 rounded-xl"
                >
                  Return to Dashboard
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate("/student/history")}
                  className="text-xs font-semibold px-5 h-9 rounded-xl"
                >
                  View Full History
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate("/student/resources")}
                  className="text-xs font-semibold px-4 h-9 rounded-xl text-primary"
                >
                  Explore Self-Care
                </Button>
              </div>
            </Card>
          </motion.div>
        ) : (
          /* 2-Column Balanced Dashboard Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Main Check-in Form Card */}
            <motion.div
              variants={cardEntrance}
              className="lg:col-span-8 space-y-6"
            >
              <Card className="p-5 sm:p-7 border-border/80 bg-card/90 backdrop-blur-md shadow-xl rounded-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Section 1: Mood Rating */}
                  <div>
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        Step 1 · Current Emotional State
                      </h2>
                      <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {MOOD_OPTIONS.find((m) => m.score === selectedMood)?.label} ({selectedMood}/10)
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-2.5 mt-3">
                      {MOOD_OPTIONS.map((opt) => {
                        const isSelected = selectedMood === opt.score;
                        return (
                          <GSAPMagnetic key={opt.score} strength={0.3} className="w-full">
                            <button
                              type="button"
                              onClick={() => setSelectedMood(opt.score)}
                              className={cn(
                                "w-full flex flex-col items-center justify-center py-3.5 px-1.5 rounded-xl border text-xs transition-all duration-200 cursor-pointer",
                                isSelected
                                  ? "border-primary bg-primary/10 text-primary font-bold shadow-sm ring-2 ring-primary scale-[1.04]"
                                  : "border-border/80 bg-secondary/30 hover:bg-secondary/70 text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <span className="text-2xl sm:text-3xl mb-1.5 filter drop-shadow-xs transition-transform group-hover:scale-110">
                                {opt.symbol}
                              </span>
                              <span className="text-xs font-semibold">{opt.label}</span>
                            </button>
                          </GSAPMagnetic>
                        );
                      })}
                    </div>

                    <div className="mt-2.5 text-center">
                      <span className="text-xs text-primary font-medium bg-primary/5 border border-primary/20 px-3 py-1 rounded-full inline-block">
                        {MOOD_OPTIONS.find((m) => m.score === selectedMood)?.helper}
                      </span>
                    </div>
                  </div>

                  {/* Section 2: Influence Tags */}
                  <div className="pt-4 border-t border-border/60">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        Step 2 · What contributed to this feeling?
                      </h2>
                      <span className="text-[11px] text-muted-foreground">Select all that apply</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {INFLUENCE_TAGS.map((tag) => {
                        const isSelected = selectedTags.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => toggleTag(tag.id)}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-150 cursor-pointer",
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                : "bg-secondary/40 border-border/80 text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                            )}
                          >
                            <span>{tag.icon}</span>
                            <span>{tag.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section 3: Energy & Sleep Sliders */}
                  <div className="pt-4 border-t border-border/60">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      Step 3 · Physical Recovery & Stamina
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Energy */}
                      <div className="p-3.5 rounded-xl border border-border/70 bg-secondary/20 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 font-semibold text-foreground">
                            <BatteryMedium className="w-4 h-4 text-amber-500" />
                            Energy & Stamina
                          </span>
                          <span className="font-bold font-mono text-primary">{energyLevel} / 10</span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={10}
                          value={energyLevel}
                          onChange={(e) => setEnergyLevel(Number(e.target.value))}
                          className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <div className="flex justify-between text-[11px] text-muted-foreground pt-0.5">
                          <span>Exhausted</span>
                          <span className="text-primary font-medium">{getEnergyText(energyLevel)}</span>
                          <span>Peak</span>
                        </div>
                      </div>

                      {/* Sleep */}
                      <div className="p-3.5 rounded-xl border border-border/70 bg-secondary/20 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 font-semibold text-foreground">
                            <Moon className="w-4 h-4 text-indigo-500" />
                            Sleep Duration
                          </span>
                          <span className="font-bold font-mono text-primary">{sleepHours} hrs</span>
                        </div>
                        <input
                          type="range"
                          min={2}
                          max={12}
                          step={0.5}
                          value={sleepHours}
                          onChange={(e) => setSleepHours(Number(e.target.value))}
                          className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <div className="flex justify-between text-[11px] text-muted-foreground pt-0.5">
                          <span>2 hrs</span>
                          <span className="text-indigo-500 font-medium">{getSleepText(sleepHours)}</span>
                          <span>12 hrs</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Reflection Notes */}
                  <div className="pt-4 border-t border-border/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        Step 4 · Journal Reflection (Optional)
                      </label>
                      <span className="text-[11px] text-muted-foreground">Private & Encrypted</span>
                    </div>

                    {/* Quick Prompt Chips */}
                    <div className="flex flex-wrap gap-1.5 pb-1">
                      {PROMPT_CHIPS.map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => applyPrompt(chip)}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-secondary/50 hover:bg-secondary border border-border/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={3}
                      value={journalContent}
                      onChange={(e) => setJournalContent(e.target.value)}
                      placeholder="Write any thoughts, events, wins, or worries from today..."
                      className="w-full p-3 text-xs sm:text-sm rounded-xl border border-border/80 bg-background/80 focus:outline-none focus:ring-1.5 focus:ring-primary leading-relaxed resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/student/dashboard")}
                      className="text-xs font-medium h-9 px-4 rounded-xl"
                    >
                      Cancel
                    </Button>
                    <GSAPMagnetic strength={0.35}>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={submitJournal.isPending}
                        className="text-xs font-bold h-9 px-6 rounded-xl shadow-md shadow-primary/20 hover:shadow-primary/30"
                      >
                        {submitJournal.isPending ? "Recording..." : "Complete Check-in"}
                      </Button>
                    </GSAPMagnetic>
                  </div>
                </form>
              </Card>
            </motion.div>

            {/* Right Context & Support Column */}
            <motion.div
              variants={cardEntrance}
              className="lg:col-span-4 space-y-4"
            >
              {/* Card 1: Streak & Habit Consistency */}
              <SpotlightCard className="p-5 space-y-3" spotlightColor="rgba(245, 158, 11, 0.15)">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      <Flame className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Check-in Habit
                      </h3>
                      <p className="text-[11px] text-muted-foreground">Daily Consistency</p>
                    </div>
                  </div>
                  <span className="text-xl font-black text-amber-500 font-mono">
                    {Math.max(1, history.length)}
                    <span className="text-xs font-medium text-muted-foreground ml-1">days</span>
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Daily check-ins calibrate your baseline stress thresholds and unlock predictive wellbeing insights.
                </p>
                {latestAssessment?.mental_wellness_score && (
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Current Baseline</span>
                    <span className="font-bold text-foreground font-mono">
                      {latestAssessment.mental_wellness_score} / 100
                    </span>
                  </div>
                )}
              </SpotlightCard>

              {/* Card 2: Recent 7-Day Mood Log */}
              <Card className="p-5 space-y-3 border-border/80 bg-card/80 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    Recent Check-Ins
                  </h3>
                  <button
                    onClick={() => navigate("/student/history")}
                    className="text-[11px] text-primary hover:underline font-medium inline-flex items-center"
                  >
                    View All <ChevronRight className="w-3 h-3 ml-0.5" />
                  </button>
                </div>

                {history.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">
                    No recent check-ins yet. Log today to start your tracking streak!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {history.slice(0, 3).map((item, idx) => {
                      const d = new Date(item.logged_at);
                      const dateLabel = d.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "numeric",
                        day: "numeric",
                      });
                      const moodMatch = MOOD_OPTIONS.find(
                        (m) => Math.abs(m.score - item.self_reported_score) <= 1
                      );

                      return (
                        <div
                          key={item.id || idx}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-secondary/30 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{moodMatch?.symbol || "🙂"}</span>
                            <div>
                              <span className="font-semibold text-foreground block">
                                {moodMatch?.label || "Good"}
                              </span>
                              <span className="text-[10px] text-muted-foreground">{dateLabel}</span>
                            </div>
                          </div>
                          <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded-md bg-primary/10">
                            {item.self_reported_score}/10
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* Card 3: Privacy & Student Safety Guarantee */}
              <div className="p-4 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm space-y-2 text-xs">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Student Confidentiality Guarantee</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Your emotional check-ins are strictly confidential. Data is encrypted and analyzed solely to provide personal wellness pathways unless you choose to escalate to campus care.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DailyCheckInPage;
