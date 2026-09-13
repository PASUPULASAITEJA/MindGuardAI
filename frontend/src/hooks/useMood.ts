import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";

export interface MoodHistoryItem {
  id: string;
  input_type: string;
  self_reported_score: number;
  sentiment_score?: number | null;
  nlp_sentiment_scaled?: number | null;
  primary_emotion?: string | null;
  logged_at: string;
}

export interface JournalSubmission {
  content: string;
  self_reported_score?: number;
}

export interface JournalSubmissionResponse {
  mood_log_id: string;
  status: string;
  message: string;
  mental_wellness_score: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  emotions_detected: Record<string, number>;
  sentiment_score: number;
}

export const useMoodHistory = (timeframe: string = "7d", studentId?: string) => {
  return useQuery<MoodHistoryItem[]>({
    queryKey: ["mood-history", timeframe, studentId],
    queryFn: async () => {
      const url = studentId 
        ? `/mood/history?timeframe=${timeframe}&student_id=${studentId}`
        : `/mood/history?timeframe=${timeframe}`;
      const response = await api.get(url);
      return response.data.history;
    },
    staleTime: 0,
  });
};

export const useSubmitJournal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: JournalSubmission): Promise<JournalSubmissionResponse> => {
      const response = await api.post("/journal/entries", payload);
      return response.data;
    },
    onSuccess: (data) => {
      // Immediately hydrate latest-assessment query cache for zero-latency UI update
      if (data && typeof data.mental_wellness_score === "number") {
        queryClient.setQueryData(["latest-assessment", undefined], (old: any) => ({
          ...(old || {}),
          assessment_id: old?.assessment_id || data.mood_log_id,
          mental_wellness_score: data.mental_wellness_score,
          risk_level: data.risk_level,
          emotions_detected: data.emotions_detected,
          sentiment_score: data.sentiment_score,
          evaluated_at: new Date().toISOString()
        }));
      }

      // Invalidate relevant queries to refresh timeline feeds
      queryClient.invalidateQueries({ queryKey: ["mood-history"] });
      queryClient.invalidateQueries({ queryKey: ["latest-assessment"] });
      queryClient.invalidateQueries({ queryKey: ["current-recommendations"] });
      queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["behavioral-summary"] });
    },
  });
};
