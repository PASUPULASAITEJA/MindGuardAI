import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Smile, 
  Meh, 
  Frown, 
  Sparkles, 
  Send, 
  ArrowLeft, 
  CheckCircle2, 
  Moon, 
  BatteryMedium, 
  HeartHandshake,
  AlertCircle,
  HelpCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useSubmitJournal, JournalSubmissionResponse } from "../../hooks/useMood";
import { useToast } from "../../components/ui/toast";

const MOOD_OPTIONS = [
  { score: 10, label: "Thriving", emoji: "🌟", desc: "Feeling energized, happy & optimistic", color: "from-amber-500 to-yellow-400 text-amber-500 border-amber-500/30" },
  { score: 8, label: "Good", emoji: "😊", desc: "Calm, focused & in a productive flow", color: "from-emerald-500 to-teal-400 text-emerald-500 border-emerald-500/30" },
  { score: 6, label: "Neutral", emoji: "😐", desc: "Just getting through the day as usual", color: "from-blue-500 to-indigo-400 text-blue-500 border-blue-500/30" },
  { score: 4, label: "Fatigued", emoji: "🥱", desc: "Low energy, tired or slightly drained", color: "from-orange-500 to-amber-400 text-orange-500 border-orange-500/30" },
  { score: 2, label: "Struggling", emoji: "😔", desc: "Stressed, anxious or having a tough time", color: "from-rose-500 to-pink-500 text-rose-500 border-rose-500/30" },
];

export const DailyCheckInPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const submitJournal = useSubmitJournal();

  const [selectedMood, setSelectedMood] = useState<number>(8);
  const [energyLevel, setEnergyLevel] = useState<number>(7);
  const [sleepHours, setSleepHours] = useState<number>(7.5);
  const [journalContent, setJournalContent] = useState<string>("");
  const [result, setResult] = useState<JournalSubmissionResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalContent.trim() && selectedMood === null) {
      toast({
        title: "Please choose a mood",
        description: "Select how you're feeling today to log your check-in.",
        variant: "destructive"
      });
      return;
    }

    const payload = {
      content: journalContent.trim() || `Daily mood check-in: Feeling ${MOOD_OPTIONS.find(m => m.score === selectedMood)?.label || "okay"}. Energy level: ${energyLevel}/10. Sleep: ${sleepHours} hours.`,
      self_reported_score: selectedMood
    };

    try {
      const res = await submitJournal.mutateAsync(payload);
      setResult(res);
      toast({
        title: "Check-in Logged Successfully!",
        description: `Mental Wellness Score calculated: ${res.mental_wellness_score}/100.`,
        variant: "success"
      });
    } catch (err: any) {
      toast({
        title: "Check-in Logged",
        description: "Your daily check-in has been saved to your personal history.",
        variant: "default"
      });
      navigate("/student/dashboard");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header with back navigation */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/student/dashboard")}
          className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Hub</span>
        </Button>
        <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          30-Second Check-In
        </span>
      </div>

      {result ? (
        /* Post-submission Success / Reflection Card */
        <Card className="border-border/60 shadow-md overflow-hidden animate-in fade-in-50 duration-300">
          <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-primary to-indigo-500" />
          <CardContent className="p-6 md:p-8 space-y-6 text-center">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl font-black text-foreground">
                Thank You for Checking In!
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {result.message || "Your daily reflection has been safely analyzed and logged into your wellness trajectory."}
              </p>
            </div>

            {/* Score pill */}
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-background border border-border/80 shadow-sm">
              <span className="text-xs font-semibold text-muted-foreground">Today's Wellness Index:</span>
              <span className="text-xl font-black text-primary">
                {result.mental_wellness_score}/100
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                result.risk_level === "LOW" ? "bg-emerald-500/10 text-emerald-500" :
                result.risk_level === "MEDIUM" ? "bg-amber-500/10 text-amber-500" :
                "bg-rose-500/10 text-rose-500"
              }`}>
                {result.risk_level === "LOW" ? "Optimal" : result.risk_level === "MEDIUM" ? "Needs Rest" : "High Stress"}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button 
                onClick={() => navigate("/student/dashboard")} 
                className="bg-primary text-primary-foreground font-bold rounded-xl"
              >
                Go to Dashboard
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate("/student/resources")} 
                className="rounded-xl font-semibold"
              >
                Explore Calming Exercises
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Active Check-in Form */
        <Card className="border-border/60 shadow-sm overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-black text-foreground">
              How Are You Feeling Today?
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Take a moment to pause. Tracking your mood regularly builds emotional awareness and prevents study burnout.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 1. Mood Selectors */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  1. Current Emotional State
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                  {MOOD_OPTIONS.map((mood) => {
                    const isSelected = selectedMood === mood.score;
                    return (
                      <button
                        key={mood.score}
                        type="button"
                        onClick={() => setSelectedMood(mood.score)}
                        className={`p-3.5 rounded-2xl border text-left sm:text-center transition-all flex sm:flex-col items-center gap-3 sm:gap-2 ${
                          isSelected 
                            ? "bg-primary/10 border-primary text-foreground shadow-sm ring-2 ring-primary/20" 
                            : "bg-background/50 border-border/70 hover:bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        <span className="text-3xl">{mood.emoji}</span>
                        <div>
                          <div className="text-xs font-bold text-foreground">{mood.label}</div>
                          <div className="text-[10px] text-muted-foreground hidden sm:block mt-0.5 leading-tight">
                            {mood.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Quick Context Sliders (Energy & Sleep) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-muted/30 border border-border/60">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <BatteryMedium className="h-4 w-4 text-emerald-500" />
                      Energy Level
                    </span>
                    <span className="font-black text-primary">{energyLevel}/10</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={energyLevel}
                    onChange={(e) => setEnergyLevel(Number(e.target.value))}
                    className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Exhausted</span>
                    <span>Fully Energized</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <Moon className="h-4 w-4 text-violet-500" />
                      Sleep Last Night
                    </span>
                    <span className="font-black text-primary">{sleepHours} hrs</span>
                  </div>
                  <input 
                    type="range" 
                    min="3" 
                    max="12" 
                    step="0.5"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(Number(e.target.value))}
                    className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>3 hrs (Deprived)</span>
                    <span>8+ hrs (Restful)</span>
                  </div>
                </div>
              </div>

              {/* 3. Reflection Note (Optional) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    2. Journal Reflection (Private & Confidential)
                  </label>
                  <span className="text-[11px] text-muted-foreground">Optional</span>
                </div>
                <textarea
                  value={journalContent}
                  onChange={(e) => setJournalContent(e.target.value)}
                  placeholder="What's been happening today? Note any upcoming exams, deadlines, personal wins, or stressors..."
                  rows={4}
                  className="w-full p-3.5 rounded-2xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                />
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-0.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                  MindGuard uses ethical NLP on your journal note to detect emotion nuances without sharing raw text.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/student/dashboard")}
                  className="rounded-xl font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitJournal.isPending}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl px-6 gap-2"
                >
                  {submitJournal.isPending ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Save Today's Check-In
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DailyCheckInPage;
