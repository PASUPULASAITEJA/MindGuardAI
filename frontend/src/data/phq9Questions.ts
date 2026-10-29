export interface PHQ9Question {
  id: number;
  question: string;
  subtext?: string;
}

export const PHQ9_QUESTIONS: PHQ9Question[] = [
  {
    id: 1,
    question: "Little interest or pleasure in doing things",
    subtext: "Loss of interest in hobbies or activities you normally enjoy",
  },
  {
    id: 2,
    question: "Feeling down, depressed, or hopeless",
    subtext: "Persistent low mood or sadness throughout the day",
  },
  {
    id: 3,
    question: "Trouble falling or staying asleep, or sleeping too much",
    subtext: "Insomnia, fragmented sleep, or hypersomnia (>10 hours)",
  },
  {
    id: 4,
    question: "Feeling tired or having little energy",
    subtext: "Physical fatigue, sluggishness, or lack of stamina",
  },
  {
    id: 5,
    question: "Poor appetite or overeating",
    subtext: "Noticeable shifts in appetite, skipped meals or binge eating",
  },
  {
    id: 6,
    question: "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
    subtext: "Self-blame, feelings of worthlessness or guilt",
  },
  {
    id: 7,
    question: "Trouble concentrating on things, such as reading or watching television",
    subtext: "Brain fog, difficulty retaining course materials or completing tasks",
  },
  {
    id: 8,
    question: "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless",
    subtext: "Psychomotor agitation or psychomotor retardation",
  },
  {
    id: 9,
    question: "Thoughts that you would be better off dead or of hurting yourself in some way",
    subtext: "Passive or active suicidal ideation (immediately activates crisis triage)",
  },
];

export const PHQ9_OPTIONS = [
  { label: "Not at all", score: 0 },
  { label: "Several days", score: 1 },
  { label: "More than half the days", score: 2 },
  { label: "Nearly every day", score: 3 },
];

export const getPHQ9Severity = (totalScore: number) => {
  if (totalScore <= 4) return { level: "Minimal", color: "emerald", action: "Supportive wellness tracking" };
  if (totalScore <= 9) return { level: "Mild", color: "sky", action: "Psychoeducation & guided self-care" };
  if (totalScore <= 14) return { level: "Moderate", color: "amber", action: "Counselor consultation recommended" };
  if (totalScore <= 19) return { level: "Moderately Severe", color: "orange", action: "Clinical evaluation & monitoring" };
  return { level: "Severe", color: "rose", action: "Immediate crisis team & clinical intervention" };
};

export default PHQ9_QUESTIONS;
