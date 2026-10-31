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
  BookOpen
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSubmitJournal, JournalSubmissionResponse } from "@/hooks/useMood";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/utils/cn";
import { motion, AnimatePresence } from "motion/react";
import { pageVariants } from "@/utils/motion";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { DotGridBackground } from "@/components/ui/DotGridBackground";
import { ShinyText } from "@/components/ui/ShinyText";
import { LottieIllustration } from "@/components/ui/LottieIllustration";
import { GSAPMagnetic } from "@/components/ui/gsap-magnetic";

const MOOD_OPTIONS = [
  { score: 2, label: "Difficult", symbol: "😔", helper: "Stressed or overwhelmed" },
  { score: 4, label: "Low", symbol: "😕", helper: "Feeling drained or low on energy" },
  { score: 6, label: "Okay", symbol: "😐", helper: "Getting through the day as usual" },
  { score: 8, label: "Good", symbol: "🙂", helper: "Calm, focused & productive" },
  { score: 10, label: "Great", symbol: "😊", helper: "Energized, optimistic & engaged" },
];

export const DailyCheckInPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const submitJournal = useSubmitJournal();

  const queryMood = searchParams.get("mood") ? Number(searchParams.get("mood")) : null;
  const [selectedMood, setSelectedMood] = useState<number>(queryMood || 8);
  const [energyLevel, setEnergyLevel] = useState<number>(7);
  const [sleepHours, setSleepHours] = useState<number>(7.5);
  const [journalContent, setJournalContent] = useState<string>("");
  const [result, setResult] = useState<JournalSubmissionResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      content: journalContent.trim() || `Daily mood check-in: Feeling ${MOOD_OPTIONS.find(m => m.score === selectedMood)?.label || "okay"}. Energy level: ${energyLevel}/10. Sleep: ${sleepHours} hours.`,
      self_reported_score: selectedMood
    };

    try {
      const res = await submitJournal.mutateAsync(payload);
      setResult(res);
      toast({
        title: "Check-in Recorded",
        description: `Wellbeing Score calculated: ${res.mental_wellness_score}/100.`,
        variant: "success"
      });
    } catch (err: any) {
      toast({
        title: "Check-in Saved",
        description: "Your daily check-in has been added to your timeline.",
        variant: "default"
      });
      navigate("/student/dashboard");
    }
  };

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="relative w-full max-w-xl mx-auto space-y-4 pb-12 font-sans text-foreground"
    >
      <DotGridBackground />

      <AnimatePresence mode="wait">
        {result ? (
          /* Post-submission Result View */
          <motion.div
            key="result-card"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card className="p-5 sm:p-6 space-y-5 text-center border-border/80 bg-card/90 backdrop-blur-md shadow-xl rounded-2xl">
              <div className="h-12 w-12 flex items-center justify-center mx-auto">
                <LottieIllustration variant="success" className="h-12 w-12" loop={false} />
              </div>

              <div className="space-y-1">
                <h2 className="text-lg font-bold text-foreground">Check-in Successfully Recorded</h2>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Your emotional pulse has been processed into your longitudinal wellbeing record.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 max-w-xs mx-auto">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Updated Wellbeing Score
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-foreground mt-0.5 block font-mono">
                  <AnimatedCounter value={result.mental_wellness_score} /> <span className="text-xs text-muted-foreground font-normal">/ 100</span>
                </span>
              </div>

              <div className="flex justify-center gap-2.5 pt-1">
                <Button
                  size="sm"
                  onClick={() => navigate("/student/dashboard")}
                  className="text-xs font-semibold px-4 h-8.5 rounded-lg"
                >
                  Return to Dashboard
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate("/student/history")}
                  className="text-xs font-semibold px-4 h-8.5 rounded-lg"
                >
                  View Full History
                </Button>
              </div>
            </Card>
          </motion.div>
        ) : (
          /* Check-in Form */
          <motion.div
            key="form-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card className="p-5 sm:p-6 border-border/80 bg-card/90 backdrop-blur-md shadow-xl rounded-2xl">
              <form onSubmit={handleSubmit} className="space-y-4.5">
                <div>
                  <div className="flex items-center justify-between">
                    <h1 className="text-base sm:text-lg font-bold text-foreground">
                      <ShinyText text="How are you feeling today?" />
                    </h1>
                    <span className="text-[11px] text-muted-foreground font-medium">Daily Pulse</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Select the mood that best reflects your current emotional state.
                  </p>

                  <div className="grid grid-cols-5 gap-2 mt-3">
                    {MOOD_OPTIONS.map((opt) => {
                      const isSelected = selectedMood === opt.score;
                      return (
                        <GSAPMagnetic key={opt.score} strength={0.3} className="w-full">
                          <button
                            type="button"
                            onClick={() => setSelectedMood(opt.score)}
                            className={cn(
                              "w-full flex flex-col items-center justify-center py-2.5 px-1 rounded-xl border text-xs transition-all duration-200",
                              isSelected
                                ? "border-primary bg-primary/10 text-primary font-bold shadow-sm ring-1.5 ring-primary scale-[1.03]"
                                : "border-border/80 bg-secondary/30 hover:bg-secondary/70 text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <span className="text-2xl mb-1 filter drop-shadow-xs">{opt.symbol}</span>
                            <span className="text-[11px] font-medium leading-tight">{opt.label}</span>
                          </button>
                        </GSAPMagnetic>
                      );
                    })}
                  </div>

                  {/* Selected helper status */}
                  <div className="mt-2 text-center">
                    <span className="text-[11px] text-primary/90 font-medium bg-primary/10 px-2.5 py-0.5 rounded-full inline-block">
                      {MOOD_OPTIONS.find((m) => m.score === selectedMood)?.helper}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-3 border-t border-border/60">
                  <div className="p-2.5 rounded-xl border border-border/60 bg-secondary/20">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                      <span className="flex items-center gap-1.5 font-medium text-foreground">
                        <BatteryMedium className="w-3.5 h-3.5 text-amber-500" />
                        Energy Level
                      </span>
                      <span className="font-bold text-xs font-mono text-primary">{energyLevel} / 10</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={energyLevel}
                      onChange={(e) => setEnergyLevel(Number(e.target.value))}
                      className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl border border-border/60 bg-secondary/20">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                      <span className="flex items-center gap-1.5 font-medium text-foreground">
                        <Moon className="w-3.5 h-3.5 text-indigo-500" />
                        Sleep Duration
                      </span>
                      <span className="font-bold text-xs font-mono text-primary">{sleepHours} hrs</span>
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
                  </div>
                </div>

                <div className="pt-2 border-t border-border/60">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between mb-1.5">
                    <span>Optional Reflection Notes</span>
                    <span className="text-[10px] text-muted-foreground font-normal">Encrypted & Private</span>
                  </label>
                  <textarea
                    rows={2.5 as any}
                    value={journalContent}
                    onChange={(e) => setJournalContent(e.target.value)}
                    placeholder="Jot down any thoughts, triggers, or highlights from today..."
                    className="w-full p-2.5 text-xs rounded-xl border border-border/80 bg-background/80 focus:outline-none focus:ring-1.5 focus:ring-primary leading-relaxed resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/student/dashboard")}
                    className="text-xs font-medium h-8.5 px-3.5 rounded-lg"
                  >
                    Cancel
                  </Button>
                  <GSAPMagnetic strength={0.35}>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={submitJournal.isPending}
                      className="text-xs font-bold h-8.5 px-5 rounded-lg shadow-sm shadow-primary/20 hover:shadow-primary/30"
                    >
                      {submitJournal.isPending ? "Recording..." : "Complete Check-in"}
                    </Button>
                  </GSAPMagnetic>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DailyCheckInPage;
