import { useQuery } from "@tanstack/react-query";
import api from "../services/api";

export interface LatestAssessment {
  assessment_id: string;
  mental_wellness_score: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  emotions_detected: Record<string, number>;
  sentiment_score?: number;
  evaluated_at: string;
}

export interface WellnessTrendPoint {
  date: string;
  wellness_score: number;
  mood_score?: number | null;
  stress_level?: number | null;
  sleep_hours?: number | null;
  phq9_score?: number | null;
  gad7_score?: number | null;
  nlp_sentiment?: number | null;
  primary_emotion?: string | null;
  risk_level: string;
  rolling_avg: number;
}

export interface PersonalBaseline {
  usual_stress?: number | null;
  recent_stress?: number | null;
  stress_delta?: number | null;
  usual_sleep_hours?: number | null;
  recent_sleep_hours?: number | null;
  sleep_delta?: number | null;
  usual_mood_score?: number | null;
  recent_mood_score?: number | null;
  mood_delta?: number | null;
  baseline_confidence: "ESTABLISHING" | "MODERATE" | "HIGH";
  observations_count: number;
  summary_message: string;
}

export interface WellnessTrendSummary {
  average_wellness_score: number;
  wellness_delta: number;
  direction: string;
  dominant_emotion: string;
  emotion_distribution: Record<string, number>;
  total_checkins: number;
  volatility_score: number;
  highest_score: number;
  lowest_score: number;
}

export interface WellnessTrendResponse {
  student_id: string;
  timeframe: string;
  summary: WellnessTrendSummary;
  baseline?: PersonalBaseline | null;
  points: WellnessTrendPoint[];
}

export const useLatestAssessment = (studentId?: string) => {
  return useQuery<LatestAssessment>({
    queryKey: ["latest-assessment", studentId],
    queryFn: async () => {
      const url = studentId 
        ? `/predictions/assessment/latest?student_id=${studentId}`
        : "/predictions/assessment/latest";
      const response = await api.get(url);
      return response.data;
    },
    staleTime: 0,
  });
};

export const useWellnessTrends = (timeframe: string = "30d", studentId?: string) => {
  return useQuery<WellnessTrendResponse>({
    queryKey: ["wellness-trends", timeframe, studentId],
    queryFn: async () => {
      const url = studentId
        ? `/predictions/trends?timeframe=${timeframe}&student_id=${studentId}`
        : `/predictions/trends?timeframe=${timeframe}`;
      const response = await api.get(url);
      return response.data;
    },
    staleTime: 5000,
  });
};
