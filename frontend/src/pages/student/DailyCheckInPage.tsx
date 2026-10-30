import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  Smile, 
  ArrowLeft, 
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
      className="relative w-full max-w-4xl mx-auto space-y-6 pb-12 font-sans text-foreground"
    >
      <DotGridBackground />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/student/dashboard")}
          className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2 text-xs font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Dashboard</span>
        </Button>
        <span className="text-xs text-muted-foreground font-medium">
          Daily Wellbeing Log
        </span>
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
          >
            <Card className="p-6 md:p-8 space-y-6 text-center">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-xl font-bold text-foreground">Check-in Successfully Recorded</h2>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Your responses have been processed into your longitudinal wellbeing record.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-secondary/30 max-w-xs mx-auto">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Updated Wellbeing Score
                </span>
                <span className="text-3xl font-bold text-foreground mt-1 block">
                  <AnimatedCounter value={result.mental_wellness_score} /> <span className="text-xs text-muted-foreground font-normal">/ 100</span>
                </span>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="sm"
                    onClick={() => navigate("/student/dashboard")}
                    className="text-xs font-semibold px-5"
                  >
                    Return to Dashboard
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate("/student/history")}
                    className="text-xs font-semibold px-4"
                  >
                    View Full History
                  </Button>
                </motion.div>
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
            <Card className="p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    <ShinyText text="How are you feeling today?" />
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Choose the option that best reflects your current emotional state.
                  </p>

                  <div className="grid grid-cols-5 gap-2 mt-4">
                    {MOOD_OPTIONS.map((opt) => {
                      const isSelected = selectedMood === opt.score;
                      return (
                        <motion.button
                          key={opt.score}
                          type="button"
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          onClick={() => setSelectedMood(opt.score)}
                          className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-xl border text-xs transition-colors",
                            isSelected
                              ? "border-primary bg-primary/5 text-primary font-semibold shadow-xs ring-1 ring-primary"
                              : "border-border hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <span className="text-2xl mb-1">{opt.symbol}</span>
                          <span className="text-xs font-medium">{opt.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Energy & Stamina</span>
                      <span className="font-semibold text-foreground">{energyLevel} / 10</span>
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

                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Sleep Duration</span>
                      <span className="font-semibold text-foreground">{sleepHours} hrs</span>
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

                <div className="pt-2 border-t border-border">
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Optional Journal Notes (Private & Encrypted)
                  </label>
                  <textarea
                    rows={3}
                    value={journalContent}
                    onChange={(e) => setJournalContent(e.target.value)}
                    placeholder="Write any thoughts, events, or feelings from today..."
                    className="w-full p-3 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/student/dashboard")}
                    className="text-xs font-medium"
                  >
                    Cancel
                  </Button>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={submitJournal.isPending}
                      className="text-xs font-semibold px-6"
                    >
                      {submitJournal.isPending ? "Recording..." : "Complete Check-in"}
                    </Button>
                  </motion.div>
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
