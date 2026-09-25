import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  checkinsAPI, 
  MoodCheckinCreatePayload, 
  MoodCheckinSummaryResponse 
} from "@/services/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Loader2, 
  Sparkles,
  Sun,
  Moon,
  Flame,
  Activity
} from "lucide-react";
import { cn } from "@/utils/cn";

export const MoodMicroCheckin: React.FC = () => {
  const queryClient = useQueryClient();

  const currentHour = new Date().getHours();
  const defaultType = currentHour < 16 ? "morning" : "evening";

  const [checkinType, setCheckinType] = useState<"morning" | "evening">(defaultType);
  const [moodScore, setMoodScore] = useState<number>(8);
  const [energyLevel, setEnergyLevel] = useState<number>(7);
  const [anxietyLevel, setAnxietyLevel] = useState<number>(2);
  const [primaryEmotion, setPrimaryEmotion] = useState<string>("calm");
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Fetch summary and streak
  const { data: summary } = useQuery<MoodCheckinSummaryResponse>({
    queryKey: ["mood-checkin-summary"],
    queryFn: () => checkinsAPI.getSummary(),
    staleTime: 60 * 1000
  });

  const checkinMutation = useMutation({
    mutationFn: (payload: MoodCheckinCreatePayload) => checkinsAPI.create(payload),
    onSuccess: () => {
      setIsSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["mood-checkin-summary"] });
      queryClient.invalidateQueries({ queryKey: ["mood-history"] });
      queryClient.invalidateQueries({ queryKey: ["latest-assessment"] });
      setTimeout(() => setIsSuccess(false), 4000);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    checkinMutation.mutate({
      checkin_type: checkinType,
      mood_score: Number(moodScore),
      energy_level: Number(energyLevel),
      anxiety_level: Number(anxietyLevel),
      sleep_quality: "good",
      sleep_hours: 7.5,
      primary_emotion: primaryEmotion,
    });
  };

  const moodOptions = [
    { score: 2, label: "Difficult", symbol: "😔" },
    { score: 4, label: "Low", symbol: "😕" },
    { score: 6, label: "Okay", symbol: "😐" },
    { score: 8, label: "Good", symbol: "🙂" },
    { score: 10, label: "Great", symbol: "😊" },
  ];

  const emotionTags = ["calm", "focused", "energized", "thoughtful", "tired", "stressed"];

  return (
    <Card className="p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Today's Check-in</h3>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">• 1-minute daily reflection</span>
        </div>

        {(summary as any)?.current_streak > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Flame className="h-3.5 w-3.5 text-amber-500" />
            <span>{(summary as any).current_streak} Day Streak</span>
          </div>
        )}
      </div>

      {isSuccess ? (
        <div className="py-6 flex items-center justify-center gap-2.5 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 rounded-lg border border-emerald-500/20 text-xs font-semibold">
          <CheckCircle2 className="h-4 w-4" />
          <span>Check-in successfully recorded. Your wellbeing index has been updated.</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              How are you feeling right now?
            </label>
            <div className="grid grid-cols-5 gap-2">
              {moodOptions.map((opt) => {
                const isSelected = moodScore === opt.score;
                return (
                  <button
                    key={opt.score}
                    type="button"
                    onClick={() => setMoodScore(opt.score)}
                    className={cn(
                      "flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs transition-colors",
                      isSelected
                        ? "border-primary bg-primary/5 text-primary font-semibold shadow-xs"
                        : "border-border hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="text-xl mb-1">{opt.symbol}</span>
                    <span className="text-[11px]">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Energy Level</span>
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
                <span>Tension / Stress Level</span>
                <span className="font-semibold text-foreground">{anxietyLevel} / 10</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={anxietyLevel}
                onChange={(e) => setAnxietyLevel(Number(e.target.value))}
                className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Dominant feeling
            </label>
            <div className="flex flex-wrap gap-1.5">
              {emotionTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setPrimaryEmotion(tag)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[11px] font-medium border capitalize transition-colors",
                    primaryEmotion === tag
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              size="sm"
              disabled={checkinMutation.isPending}
              className="text-xs font-semibold px-4"
            >
              {checkinMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : (
                "Save Check-in"
              )}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
};
