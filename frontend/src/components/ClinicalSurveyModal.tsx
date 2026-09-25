import React, { useState } from "react";
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  ClipboardCheck, 
  ShieldCheck, 
  Sparkles, 
  BookOpen, 
  Calendar, 
  ArrowRight,
  HeartHandshake,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";

export interface SurveyQuestionItem {
  id: number;
  category: string;
  shortTitle: string;
  prompt: string;
  studentContext: string;
}

export const PHQ9_QUESTIONS: SurveyQuestionItem[] = [
  {
    id: 1,
    category: "Life Enthusiasm & Hobbies",
    shortTitle: "Joy & Interest",
    prompt: "How often have you felt little to no interest or joy in things you normally love doing?",
    studentContext: "Feeling disconnected from hobbies, socializing, creative projects, or daily passions."
  },
  {
    id: 2,
    category: "Inner Mood & Emotional Health",
    shortTitle: "Emotional State",
    prompt: "How often have you been feeling down, deeply sad, empty inside, or hopeless?",
    studentContext: "Carrying emotional heaviness or feeling pessimistic about where your life is heading."
  },
  {
    id: 3,
    category: "Sleep & Circadian Rhythm",
    shortTitle: "Sleep Quality",
    prompt: "How often have you struggled with falling asleep, staying asleep, or oversleeping?",
    studentContext: "Irregular sleep patterns, insomnia, or waking up feeling unrefreshed and sluggish."
  },
  {
    id: 4,
    category: "Vitality & Daily Energy",
    shortTitle: "Energy Levels",
    prompt: "How often have you felt physically drained, exhausted, or lacking energy?",
    studentContext: "Feeling low stamina or like simple daily self-care requires heavy effort."
  },
  {
    id: 5,
    category: "Nourishment & Body Care",
    shortTitle: "Appetite Balance",
    prompt: "How often have you experienced loss of appetite, skipping meals, or stress-eating?",
    studentContext: "Losing interest in food or turning to snacks to cope with emotional stress."
  },
  {
    id: 6,
    category: "Self-Worth & Confidence",
    shortTitle: "Self-Image",
    prompt: "How often have you felt disappointed in yourself, or like you let others down?",
    studentContext: "Harsh inner self-criticism or comparing yourself unfavorably to peers."
  },
  {
    id: 7,
    category: "Mental Clarity & Presence",
    shortTitle: "Concentration",
    prompt: "How often have you found it hard to concentrate on reading, work, or daily tasks?",
    studentContext: "Brain fog, frequent mind wandering, or struggling to focus in class."
  },
  {
    id: 8,
    category: "Physical Pace & Temperament",
    shortTitle: "Body Pace",
    prompt: "How often have you noticed yourself moving/speaking unusually slowly, or feeling too restless to sit still?",
    studentContext: "Feeling sluggish and bogged down, or jittery, pacing, and unable to relax."
  },
  {
    id: 9,
    category: "Emotional Safety & Support",
    shortTitle: "Coping & Hope",
    prompt: "How often have you felt overwhelmed by life, wishing to give up, or having thoughts of self-harm?",
    studentContext: "Life overload. You matter, and confidential campus mental health support is always available 24/7."
  }
];

export const GAD7_QUESTIONS: SurveyQuestionItem[] = [
  {
    id: 1,
    category: "Nervous System & Calmness",
    shortTitle: "Inner Tension",
    prompt: "How often have you felt nervous, anxious, or on edge in your day-to-day life?",
    studentContext: "A background feeling of tension in your body, jitteriness, or fast heartbeat."
  },
  {
    id: 2,
    category: "Mental Rest & Thought Loops",
    shortTitle: "Controlling Worries",
    prompt: "How often have you found it difficult to stop worrying or quiet racing thoughts?",
    studentContext: "Mental spirals or being unable to quiet your mind when trying to rest."
  },
  {
    id: 3,
    category: "Life Uncertainty & Scope",
    shortTitle: "Everyday Worries",
    prompt: "How often have you felt overwhelmed by worrying about multiple areas at once?",
    studentContext: "Overthinking health, friendships, family, coursework, and future plans simultaneously."
  },
  {
    id: 4,
    category: "Autonomic Nervous System",
    shortTitle: "Physical Relaxation",
    prompt: "How often have you found it hard to unwind, physically relax, and let go of tension?",
    studentContext: "Clenched jaw, tight shoulders, or feeling like you cannot let your guard down."
  },
  {
    id: 5,
    category: "Physical Restlessness",
    shortTitle: "Restless Urge",
    prompt: "How often have you felt so restless or keyed up that it was hard to sit still peacefully?",
    studentContext: "Shaking legs, fidgeting, or feeling an uncontrollable urge to keep moving."
  },
  {
    id: 6,
    category: "Emotional Temperament",
    shortTitle: "Irritability",
    prompt: "How often have you felt easily annoyed, snappy, or frustrated by small everyday inconveniences?",
    studentContext: "Feeling like you have a short fuse or emotionally depleted."
  },
  {
    id: 7,
    category: "Anticipatory Dread",
    shortTitle: "Sense of Dread",
    prompt: "How often have you experienced a feeling of dread, as if something terrible might happen?",
    studentContext: "Sudden waves of panic, stomach knots, or irrational anxiety about the future."
  }
];

const SURVEY_OPTIONS = [
  { value: 0, label: "Not at all", helper: "0 days in past 2 weeks" },
  { value: 1, label: "Several days", helper: "1-6 days in past 2 weeks" },
  { value: 2, label: "More than half the days", helper: "7-11 days in past 2 weeks" },
  { value: 3, label: "Nearly every day", helper: "12-14 days in past 2 weeks" }
];

interface ClinicalSurveyModalProps {
  surveyType: "phq-9" | "gad-7" | null;
  isOpen: boolean;
  onClose: () => void;
  onBookCounselor?: () => void;
}

export const ClinicalSurveyModal: React.FC<ClinicalSurveyModalProps> = ({
  surveyType,
  isOpen,
  onClose,
  onBookCounselor,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const questions = surveyType === "phq-9" ? PHQ9_QUESTIONS : GAD7_QUESTIONS;
  const surveyTitle = surveyType === "phq-9" ? "PHQ-9 Wellbeing & Mood Screener" : "GAD-7 Anxiety & Stress Screener";

  const [currentIdx, setCurrentIdx] = useState(0);
  const [responses, setResponses] = useState<number[]>(() => new Array(questions.length).fill(-1));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultData, setResultData] = useState<{
    totalScore: number;
    severity: string;
    guidance: string;
  } | null>(null);

  // Reset when survey changes
  React.useEffect(() => {
    if (surveyType) {
      const qCount = surveyType === "phq-9" ? 9 : 7;
      setResponses(new Array(qCount).fill(-1));
      setCurrentIdx(0);
      setResultData(null);
    }
  }, [surveyType]);

  if (!isOpen || !surveyType) return null;

  const currentQ = questions[currentIdx];
  const progressPct = Math.round(((currentIdx + 1) / questions.length) * 100);
  const answeredCount = responses.filter((r) => r !== -1).length;
  const isComplete = answeredCount === questions.length;

  const handleSelectOption = (value: number) => {
    const updated = [...responses];
    updated[currentIdx] = value;
    setResponses(updated);

    // Auto-advance if not on last question
    if (currentIdx < questions.length - 1) {
      setTimeout(() => setCurrentIdx((prev) => prev + 1), 200);
    }
  };

  const handleSubmit = async () => {
    if (responses.includes(-1)) {
      toast({
        title: "Incomplete Answers",
        description: "Please answer all questions before reviewing your summary.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const url = surveyType === "phq-9" ? "/surveys/phq-9" : "/surveys/gad-7";
      const res = await api.post(url, { responses });
      const rawScore = responses.reduce((a, b) => a + b, 0);
      
      let guidanceText = "Your responses reflect a healthy, stable emotional state. Routine self-care and balanced study habits are working well.";
      if (rawScore >= 15) {
        guidanceText = "Your responses indicate that additional support and speaking with a campus counselor may be very helpful right now.";
      } else if (rawScore >= 8) {
        guidanceText = "Your responses indicate mild to moderate strain. Focused relaxation, sleep hygiene, and pacing may help ease this tension.";
      }

      setResultData({
        totalScore: rawScore,
        severity: res.data?.severity || (rawScore >= 15 ? "Elevated Strain" : rawScore >= 8 ? "Moderate Strain" : "Stable"),
        guidance: guidanceText,
      });

      toast({
        title: "Assessment Successfully Recorded",
        description: "Your responses have been securely benchmarked into your longitudinal wellbeing record.",
        variant: "success"
      });

      // Refresh relevant data
      queryClient.invalidateQueries({ queryKey: ["latest-assessment"] });
      queryClient.invalidateQueries({ queryKey: ["mood-history"] });
      queryClient.invalidateQueries({ queryKey: ["current-recommendations"] });
      queryClient.invalidateQueries({ queryKey: ["behavioral-summary"] });
      
    } catch (err) {
      toast({
        title: "Submission Error",
        description: "Unable to record survey responses. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl border border-border/80 bg-card p-6 md:p-8 shadow-2xl space-y-6">
        
        {/* Results Screen */}
        {resultData ? (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">Assessment Summary</h3>
                  <p className="text-xs text-muted-foreground">{surveyTitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-2xl border border-border/80 bg-secondary/30 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Support Status Indicator
                </span>
                <span className="text-xs font-black px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Score: {resultData.totalScore} / {questions.length * 3}
                </span>
              </div>
              <p className="text-sm font-medium text-foreground leading-relaxed">
                {resultData.guidance}
              </p>
              <p className="text-[11px] text-muted-foreground pt-2 border-t border-border/40">
                * Note: This psychometric screener is a supportive indicator to assist your self-awareness and campus care decisions. It is not a formal medical diagnosis.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl border border-border/70 bg-card space-y-2">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-primary" />
                  Recommended Next Step
                </h4>
                <p className="text-xs text-muted-foreground">
                  Explore self-guided breathing exercises and circadian sleep hygiene practices in the resources center.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-border/70 bg-card space-y-2">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <HeartHandshake className="h-3.5 w-3.5 text-emerald-500" />
                  Counselling Support
                </h4>
                <p className="text-xs text-muted-foreground">
                  Confidential 1-on-1 consultations with certified campus psychologists are available at no cost.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs font-bold rounded-xl"
              >
                Close Summary
              </Button>
              {onBookCounselor && (
                <Button
                  size="sm"
                  onClick={() => {
                    onClose();
                    onBookCounselor();
                  }}
                  className="text-xs font-bold gap-1.5 rounded-xl bg-primary text-primary-foreground shadow-sm"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Request Counselling
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Step-by-Step Question Flow */
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-foreground">{surveyTitle}</h3>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="h-3 w-3" /> Encrypted & Private
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Question {currentIdx + 1} of {questions.length}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold text-muted-foreground">
                <span>Progress: {answeredCount} of {questions.length} answered</span>
                <span>{progressPct}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Question Prompt */}
            <div className="space-y-2 py-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                {currentQ.category}
              </span>
              <h4 className="text-base md:text-lg font-bold text-foreground leading-snug">
                {currentQ.prompt}
              </h4>
              <p className="text-xs text-muted-foreground italic leading-relaxed">
                "{currentQ.studentContext}"
              </p>
            </div>

            {/* Answer Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SURVEY_OPTIONS.map((opt) => {
                const isSelected = responses[currentIdx] === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelectOption(opt.value)}
                    className={`flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                      isSelected
                        ? "border-primary bg-primary/10 text-foreground font-black shadow-sm ring-1 ring-primary"
                        : "border-border/70 hover:border-primary/40 bg-card/60 hover:bg-card text-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold">{opt.label}</span>
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-0.5">{opt.helper}</span>
                  </button>
                );
              })}
            </div>

            {/* Navigation & Submit Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-border/60">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
                disabled={currentIdx === 0}
                className="text-xs font-semibold gap-1 rounded-xl"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                {currentIdx < questions.length - 1 ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setCurrentIdx((p) => Math.min(questions.length - 1, p + 1))}
                    className="text-xs font-bold gap-1 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSubmit}
                    disabled={!isComplete || isSubmitting}
                    className="text-xs font-bold px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                  >
                    {isSubmitting ? "Submitting..." : "Complete & View Score"}
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
