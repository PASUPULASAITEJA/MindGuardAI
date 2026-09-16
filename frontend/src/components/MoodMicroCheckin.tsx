import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  checkinsAPI, 
  MoodCheckinCreatePayload, 
  MoodCheckinSummaryResponse 
} from "@/services/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Flame, 
  Sun, 
  Moon, 
  Smile, 
  Frown, 
  Meh, 
  Sparkles, 
  BatteryMedium, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Clock,
  Heart,
  TrendingUp,
  RefreshCw
} from "lucide-react";

export const MoodMicroCheckin: React.FC = () => {
  const queryClient = useQueryClient();

  // Auto-detect morning vs evening based on local device time (< 16:00 is morning)
  const currentHour = new Date().getHours();
  const defaultType = currentHour < 16 ? "morning" : "evening";

  const [checkinType, setCheckinType] = useState<"morning" | "evening">(defaultType);
  const [moodScore, setMoodScore] = useState<number>(7);
  const [energyLevel, setEnergyLevel] = useState<number>(7);
  const [anxietyLevel, setAnxietyLevel] = useState<number>(3);
  const [sleepQuality, setSleepQuality] = useState<"poor" | "fair" | "good" | "great">("good");
  const [sleepHours, setSleepHours] = useState<number>(7.5);
  const [primaryEmotion, setPrimaryEmotion] = useState<string>("calm");
  const [oneWordFeeling, setOneWordFeeling] = useState<string>("");
  const [stressSource, setStressSource] = useState<string>("academics");
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Fetch summary and streak
  const { data: summary, isLoading: isSummaryLoading } = useQuery<MoodCheckinSummaryResponse>({
    queryKey: ["mood-checkin-summary"],
    queryFn: () => checkinsAPI.getSummary(),
    staleTime: 60 * 1000
  });

  const checkinMutation = useMutation({
    mutationFn: (payload: MoodCheckinCreatePayload) => checkinsAPI.create(payload),
    onSuccess: () => {
      setIsSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["mood-checkin-summary"] });
      queryClient.invalidateQueries({ queryKey: ["mood-checkins"] });
      queryClient.invalidateQueries({ queryKey: ["personalized-recommendations"] });
      setTimeout(() => setIsSuccess(false), 5000);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    checkinMutation.mutate({
      checkin_type: checkinType,
      mood_score: Number(moodScore),
      energy_level: Number(energyLevel),
      anxiety_level: Number(anxietyLevel),
      sleep_quality: sleepQuality,
      sleep_hours: Number(sleepHours),
      primary_emotion: primaryEmotion,
      one_word_feeling: oneWordFeeling.trim() || undefined,
      stress_source: stressSource || undefined,
    });
  };

  const moodEmojis = [
    { score: 2, emoji: "😫", label: "Struggling" },
    { score: 4, emoji: "😔", label: "Low" },
    { score: 6, emoji: "😐", label: "Neutral" },
    { score: 8, emoji: "🙂", label: "Good" },
    { score: 10, emoji: "🤩", label: "Great" },
  ];

  const emotionOptions = ["calm", "focused", "happy", "anxious", "exhausted", "stressed", "sad"];
  const stressOptions = [
    { val: "none", label: "No Major Stress" },
    { val: "academics", label: "Academics & Coursework" },
    { val: "exams", label: "Exams & Deadlines" },
    { val: "relationships", label: "Friendships / Relationships" },
    { val: "career", label: "Career & Placements" },
    { val: "health", label: "Physical Health / Sleep" },
    { val: "finances", label: "Financial Pressure" },
  ];

  return (
    <Card className="wellness-card overflow-hidden shadow-xs border-primary/20 bg-gradient-to-b from-card to-background">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Clock className="h-4 w-4" />
              </span>
              <CardTitle className="text-base md:text-lg font-black text-foreground tracking-tight flex items-center gap-2">
                30-Second Micro Check-In
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Ecological Momentary Assessment (EMA) to track your daily psychological rhythm.
            </CardDescription>
          </div>

          {/* Streak Badge & Window Switcher */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-black text-xs shadow-2xs">
              <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500 animate-bounce" />
              <span>{summary?.streak_days ?? 0} Day Streak</span>
            </div>

            <div className="flex bg-muted/40 p-0.5 rounded-lg border border-border/70 text-xs">
              <button
                type="button"
                onClick={() => setCheckinType("morning")}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                  checkinType === "morning"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sun className="h-3 w-3" />
                Morning
              </button>
              <button
                type="button"
                onClick={() => setCheckinType("evening")}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                  checkinType === "evening"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Moon className="h-3 w-3" />
                Evening
              </button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        {isSuccess && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Check-in saved! Your wellness timeline and personalized tools have been updated.</span>
            </div>
            <button onClick={() => setIsSuccess(false)} className="underline opacity-80 text-xs">
              Dismiss
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Emoji Mood Picker */}
          <div>
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
              How are you feeling right now? (Mood: {moodScore}/10)
            </Label>
            <div className="grid grid-cols-5 gap-2">
              {moodEmojis.map((item) => (
                <button
                  key={item.score}
                  type="button"
                  onClick={() => setMoodScore(item.score)}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                    Math.abs(moodScore - item.score) <= 1
                      ? "bg-primary/10 border-primary text-primary font-bold shadow-2xs scale-105"
                      : "bg-muted/20 border-border/60 hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <span className="text-2xl mb-1">{item.emoji}</span>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Sliders Grid: Energy & Anxiety */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 p-3 rounded-xl bg-muted/20 border border-border/50">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="flex items-center gap-1.5 text-foreground">
                  <BatteryMedium className="h-3.5 w-3.5 text-emerald-500" />
                  Energy Level
                </span>
                <span className="text-emerald-500 font-black">{energyLevel} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={energyLevel}
                onChange={(e) => setEnergyLevel(Number(e.target.value))}
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Drained (1)</span>
                <span>Fully Charged (10)</span>
              </div>
            </div>

            <div className="space-y-1.5 p-3 rounded-xl bg-muted/20 border border-border/50">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="flex items-center gap-1.5 text-foreground">
                  <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                  Anxiety / Tension
                </span>
                <span className="text-rose-500 font-black">{anxietyLevel} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={anxietyLevel}
                onChange={(e) => setAnxietyLevel(Number(e.target.value))}
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Calm (1)</span>
                <span>Severe Panic (10)</span>
              </div>
            </div>
          </div>

          {/* 3. Sleep Metrics: Quality & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Sleep Quality
              </Label>
              <div className="grid grid-cols-4 gap-1.5">
                {(["poor", "fair", "good", "great"] as const).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setSleepQuality(q)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold capitalize transition-all border ${
                      sleepQuality === q
                        ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                        : "bg-muted/20 border-border/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Sleep Duration: <span className="text-foreground">{sleepHours} Hours</span>
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="3.0"
                  max="12.0"
                  step="0.5"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(Number(e.target.value))}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>
          </div>

          {/* 4. Primary Emotion Chips */}
          <div>
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Primary Emotion State
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {emotionOptions.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setPrimaryEmotion(em)}
                  className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition-all border ${
                    primaryEmotion === em
                      ? "bg-primary/15 text-primary border-primary/30 shadow-2xs"
                      : "bg-muted/20 border-border/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Optional Context: One-word feeling & Stress Driver */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="one-word" className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                One-Word Feeling (Optional)
              </Label>
              <Input
                id="one-word"
                placeholder="e.g. Hopeful, Overwhelmed, Restless"
                value={oneWordFeeling}
                onChange={(e) => setOneWordFeeling(e.target.value)}
                maxLength={50}
                className="h-8 text-xs bg-background border-border/70 text-foreground"
              />
            </div>

            <div>
              <Label htmlFor="stress-source" className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Primary Stress Source
              </Label>
              <select
                id="stress-source"
                value={stressSource}
                onChange={(e) => setStressSource(e.target.value)}
                className="w-full h-8 px-2.5 rounded-md text-xs bg-background border border-border/70 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {stressOptions.map((opt) => (
                  <option key={opt.val} value={opt.val}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground italic">
              Takes &lt; 30 seconds • Stored securely under FERPA/HIPAA standards.
            </span>

            <Button
              type="submit"
              disabled={checkinMutation.isPending}
              className="h-9 px-5 text-xs font-bold gap-2 shadow-xs"
            >
              {checkinMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving Check-In...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Log Check-In</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default MoodMicroCheckin;
