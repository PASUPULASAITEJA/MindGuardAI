import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  Smile, 
  Moon, 
  BatteryMedium, 
  CheckCircle2
} from "lucide-react";
import { Card } from "@/components/ui/card";
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
  { score: 2, label: "Difficult", symbol: "😔" },
  { score: 4, label: "Low", symbol: "😕" },
  { score: 6, label: "Okay", symbol: "😐" },
  { score: 8, label: "Good", symbol: "🙂" },
  { score: 10, label: "Great", symbol: "😊" },
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
      content:
        journalContent.trim() ||
        `Daily mood check-in: Feeling ${
          MOOD_OPTIONS.find((m) => m.score === selectedMood)?.label || "okay"
        }. Energy level: ${energyLevel}/10. Sleep duration: ${sleepHours} hours.`,
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
      className="relative w-full max-w-2xl mx-auto space-y-6 pb-12 font-sans text-foreground"
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
            className="max-w-md mx-auto pt-6"
          >
            <Card className="p-6 md:p-8 space-y-6 text-center border border-border/80 bg-card shadow-xl rounded-2xl">
              <div className="h-14 w-14 flex items-center justify-center mx-auto">
                <LottieIllustration variant="success" className="h-14 w-14" loop={false} />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-xl font-bold text-foreground">Check-in Successfully Recorded</h2>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Your responses have been processed into your longitudinal wellbeing record.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 max-w-xs mx-auto">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Updated Wellbeing Score
                </span>
                <span className="text-3xl font-bold text-foreground mt-1 block font-mono">
                  <AnimatedCounter value={result.mental_wellness_score} />{" "}
                  <span className="text-xs text-muted-foreground font-normal">/ 100</span>
                </span>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <Button
                  size="sm"
                  onClick={() => navigate("/student/dashboard")}
                  className="text-xs font-semibold px-4 h-9 rounded-xl"
                >
                  Return to Dashboard
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate("/student/history")}
                  className="text-xs font-semibold px-4 h-9 rounded-xl"
                >
                  View Full History
                </Button>
              </div>
            </Card>
          </motion.div>
        ) : (
          /* Check-in Form Card */
          <motion.div
            key="form-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="pt-2"
          >
            <Card className="p-6 sm:p-8 border border-border/80 bg-card shadow-xl rounded-2xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header & Mood Selection */}
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                    <ShinyText text="How are you feeling today?" />
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Choose the option that best reflects your current emotional state.
                  </p>

                  <div className="grid grid-cols-5 gap-2.5 sm:gap-3 mt-4">
                    {MOOD_OPTIONS.map((opt) => {
                      const isSelected = selectedMood === opt.score;
                      return (
                        <GSAPMagnetic key={opt.score} strength={0.3} className="w-full">
                          <button
                            type="button"
                            onClick={() => setSelectedMood(opt.score)}
                            className={cn(
                              "w-full flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border text-xs transition-all cursor-pointer",
                              isSelected
                                ? "border-primary bg-primary/10 text-primary font-bold ring-2 ring-primary shadow-sm"
                                : "border-border/80 hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <span className="text-2xl sm:text-3xl mb-1.5 filter drop-shadow-xs">
                              {opt.symbol}
                            </span>
                            <span className="text-xs font-medium">{opt.label}</span>
                          </button>
                        </GSAPMagnetic>
                      );
                    })}
                  </div>
                </div>

                {/* Energy & Sleep Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-5 border-t border-border/80">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium text-foreground">
                      <span className="flex items-center gap-1.5">
                        <BatteryMedium className="w-4 h-4 text-amber-500" />
                        Energy & Stamina
                      </span>
                      <span className="font-bold text-primary font-mono">{energyLevel} / 10</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={energyLevel}
                      onChange={(e) => setEnergyLevel(Number(e.target.value))}
                      className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>Low</span>
                      <span>Moderate</span>
                      <span>High</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium text-foreground">
                      <span className="flex items-center gap-1.5">
                        <Moon className="w-4 h-4 text-indigo-500" />
                        Sleep Duration
                      </span>
                      <span className="font-bold text-primary font-mono">{sleepHours} hrs</span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={12}
                      step={0.5}
                      value={sleepHours}
                      onChange={(e) => setSleepHours(Number(e.target.value))}
                      className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>2 hrs</span>
                      <span>7-8 hrs</span>
                      <span>12 hrs</span>
                    </div>
                  </div>
                </div>

                {/* Reflection Notes */}
                <div className="pt-5 border-t border-border/80 space-y-2">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Optional Reflection Notes</span>
                    <span className="text-[11px] text-muted-foreground font-normal">Private & Encrypted</span>
                  </label>
                  <textarea
                    rows={3}
                    value={journalContent}
                    onChange={(e) => setJournalContent(e.target.value)}
                    placeholder="Write any thoughts, events, or feelings from today..."
                    className="w-full p-3 text-xs sm:text-sm rounded-xl border border-border/80 bg-background/80 focus:outline-none focus:ring-1.5 focus:ring-primary leading-relaxed resize-none"
                  />
                </div>

                {/* Action Buttons */}
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
                      className="text-xs font-bold h-9 px-6 rounded-xl shadow-sm shadow-primary/20 hover:shadow-primary/30"
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
