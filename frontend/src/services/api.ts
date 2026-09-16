import axios from "axios";

// Read API base URL from Vite environment or default to local API gateway path
const API_URL = import.meta.env.VITE_API_URL || "/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Forces sending cookies (refresh_token) automatically
  headers: {
    "Content-Type": "application/json",
  },
});

// In-memory access token storage to prevent XSS extraction, with localStorage fallback for Remember Me
const LOCAL_STORAGE_TOKEN_KEY = "mindguard_auth_token";
const REMEMBER_ME_KEY = "mindguard_remember_me";

let inMemoryToken: string | null = (typeof window !== "undefined" && localStorage.getItem(REMEMBER_ME_KEY) === "true")
  ? localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY)
  : null;

export const setAccessToken = (token: string | null, rememberMe: boolean = false) => {
  inMemoryToken = token;
  if (typeof window !== "undefined") {
    if (token && rememberMe) {
      localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, token);
      localStorage.setItem(REMEMBER_ME_KEY, "true");
    } else if (!token) {
      localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
      localStorage.removeItem(REMEMBER_ME_KEY);
    }
  }
};

export const getAccessToken = () => {
  return inMemoryToken;
};


// 1. Request interceptor to append Bearer JWT automatically
api.interceptors.request.use(
  (config) => {
    if (inMemoryToken && config.headers) {
      config.headers.Authorization = `Bearer ${inMemoryToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Variables to coordinate concurrent token refresh requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// 2. Response interceptor to catch 401 and execute automatic token refreshes
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Catch 401 Unauthorized errors and prevent infinite recursion on auth routes
    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      !originalRequest.url?.includes("/auth/")
    ) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Post to the refresh endpoint. Cookie is transmitted automatically.
        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        
        const { access_token } = response.data;
        setAccessToken(access_token);
        
        processQueue(null, access_token);
        
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);
        
        // Notify AuthProvider to clean local state and redirect to login page
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("auth:session-expired"));
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
      return Promise.reject(error);
    }
  );

  export interface ChatMessageItem {
    id: string;
    conversation_id: string;
    sender: "STUDENT" | "ASSISTANT" | "SYSTEM";
    message: string;
    intent?: string;
    primary_emotion?: string;
    emotion_scores?: Record<string, number>;
    sentiment_score?: number;
    risk_level: "GREEN" | "YELLOW" | "RED";
    is_crisis_flag: boolean;
    created_at: string;
  }

  export interface ConversationSummary {
    id: string;
    student_id: string;
    title: string;
    summary?: string;
    current_risk_level: string;
    created_at: string;
    updated_at: string;
    message_count?: number;
  }

  export interface ChatResponsePayload {
    conversation_id: string;
    message_id: string;
    response: string;
    intent: {
      label: string;
      confidence: number;
      secondary_intents: string[];
    };
    emotion: {
      primary: string;
      confidence: number;
      emotion_scores: Record<string, number>;
    };
    risk: {
      level: "GREEN" | "YELLOW" | "RED";
      score: number;
      requires_safety_workflow: boolean;
      requires_human_review: boolean;
    };
    suggested_actions: string[];
    safety_alert?: {
      severity: string;
      helpline: string;
      counselor_escalation: boolean;
      message: string;
    } | null;
    created_at: string;
  }

  export const chatAPI = {
    createConversation: async (title?: string) => {
      const res = await api.post<ConversationSummary>("/chat/conversations", { title });
      return res.data;
    },
    listConversations: async () => {
      const res = await api.get<ConversationSummary[]>("/chat/conversations");
      return res.data;
    },
    getConversationDetails: async (conversationId: string) => {
      const res = await api.get<{ conversation: ConversationSummary; messages: ChatMessageItem[] }>(
        `/chat/conversations/${conversationId}`
      );
      return res.data;
    },
    sendMessage: async (conversationId: string, message: string) => {
      const res = await api.post<ChatResponsePayload>(
        `/chat/conversations/${conversationId}/messages`,
        { message }
      );
      return res.data;
    },
    getMessages: async (conversationId: string) => {
      const res = await api.get<ChatMessageItem[]>(`/chat/conversations/${conversationId}/messages`);
      return res.data;
    },
    getBehavioralSummary: async () => {
      const res = await api.get<{
        is_agent_connected: boolean;
        is_currently_active: boolean;
        last_synced_minutes_ago: number;
        latest_log: {
          date: string;
          total_screen_time_minutes: number;
          late_night_usage_minutes: number;
          academic_usage_minutes: number;
          social_usage_minutes: number;
          entertainment_usage_minutes: number;
          baseline_deviation_score: number;
          risk_level: string;
          synced_at: string;
        } | null;
        weekly_history: Array<{
          date: string;
          total_screen_time_minutes: number;
          late_night_usage_minutes: number;
          risk_level: string;
        }>;
      }>("/chat/behavioral-features/summary");
      return res.data;
    }
  };

  export interface AppointmentItem {
    id: string;
    student_id: string;
    counselor_id?: string | null;
    appointment_type: "VIRTUAL" | "IN_PERSON";
    scheduled_time: string;
    status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
    reason?: string | null;
    notes?: string | null;
    created_at: string;
    updated_at: string;
  }

  export const appointmentsAPI = {
    bookAppointment: async (data: {
      scheduled_time: string;
      appointment_type: "VIRTUAL" | "IN_PERSON";
      reason?: string;
    }) => {
      const res = await api.post<AppointmentItem>("/appointments", data);
      return res.data;
    },
    getMyAppointments: async (statusFilter?: string) => {
      const url = statusFilter ? `/appointments/my?status_filter=${statusFilter}` : "/appointments/my";
      const res = await api.get<{ appointments: AppointmentItem[]; total: number }>(url);
      return res.data;
    },
    updateStatus: async (appointmentId: string, status: string, notes?: string) => {
      const res = await api.patch<AppointmentItem>(`/appointments/${appointmentId}/status`, {
        status,
        notes
      });
      return res.data;
    }
  };

  export const profileAPI = {
    getStudentProfile: async () => {
      const res = await api.get("/students/me");
      return res.data;
    },
    updateStudentProfile: async (data: any) => {
      const res = await api.put("/students/me", data);
      return res.data;
    }
  };

  export interface SOSHelpline {
    name: string;
    number: string;
    badge: string;
    description: string;
  }

  export interface SOSResponse {
    status: string;
    message: string;
    alert_id: string;
    severity: string;
    created_at?: string;
    helplines: SOSHelpline[];
  }

  export const sosAPI = {
    triggerSOS: async () => {
      const res = await api.post<SOSResponse>("/alerts/sos");
      return res.data;
    }
  };

  export interface AlertRecordItem {
    id: string;
    student_id: string;
    assessment_id: string;
    status: "PENDING" | "REVIEWED" | "RESOLVED";
    severity?: "CRITICAL" | "HIGH" | string;
    counselor_id?: string | null;
    created_at: string;
    resolved_at?: string | null;
  }

  export const alertsAPI = {
    getAlerts: async (status?: string, limit: number = 50) => {
      const url = status ? `/counselors/alerts?status=${status}&limit=${limit}` : `/counselors/alerts?limit=${limit}`;
      const res = await api.get<{ alerts: AlertRecordItem[]; total: number }>(url);
      return res.data;
    },
    assignAlert: async (alertId: string, counselorId?: string) => {
      const res = await api.patch<AlertRecordItem>(`/counselors/alerts/${alertId}/assign`, {
        counselor_id: counselorId || null,
      });
      return res.data;
    },
    updateAlertStatus: async (alertId: string, status: "PENDING" | "REVIEWED" | "RESOLVED") => {
      const res = await api.patch<AlertRecordItem>(`/counselors/alerts/${alertId}/status`, { status });
      return res.data;
    },
    addAlertNote: async (alertId: string, note: string) => {
      const res = await api.post<CounselorNoteItem>(`/counselors/alerts/${alertId}/notes`, { note });
      return res.data;
    },
  };

  export interface ConsentRecord {
    id: string;
    student_id: string;
    consent_type: string;
    status: "GRANTED" | "REVOKED" | "PENDING";
    granted_at: string | null;
    revoked_at: string | null;
    created_at: string;
  }

  export interface ConsentActionResponse {
    status: string;
    message: string;
    consent: ConsentRecord;
  }

  export const consentAPI = {
    getMyConsent: async () => {
      const res = await api.get<ConsentRecord>("/consent/me");
      return res.data;
    },
    grantConsent: async () => {
      const res = await api.post<ConsentActionResponse>("/consent/me/grant");
      return res.data;
    },
    revokeConsent: async () => {
      const res = await api.post<ConsentActionResponse>("/consent/me/revoke");
      return res.data;
    },
    declineConsent: async () => {
      const res = await api.post<ConsentActionResponse>("/consent/me/decline");
      return res.data;
    },
    checkStudentConsent: async (studentId: string) => {
      const res = await api.get<ConsentRecord>(`/consent/status/${studentId}`);
      return res.data;
    }
  };

  export interface CasefileTimelineEvent {
    id: string;
    event_type: "ASSESSMENT" | "EMOTION_ANALYSIS" | "ALERT" | "APPOINTMENT" | "SAFETY_EVENT" | "BEHAVIORAL";
    timestamp: string;
    title: string;
    summary: string;
    severity: "NORMAL" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    details: Record<string, any>;
  }

  export interface StudentCasefile {
    student: {
      id: string;
      full_name: string;
      email: string;
      academic_department?: string;
      current_risk_level: string;
      consent_status: "GRANTED" | "REVOKED";
    };
    summary: {
      total_assessments: number;
      latest_wellness_score: number;
      current_risk_level: string;
      active_alerts_count: number;
      total_appointments: number;
      timeline_events_count: number;
    };
    timeline: CasefileTimelineEvent[];
    timeframe_days: string;
  }

  export const casefileAPI = {
    getStudentCasefile: async (studentId: string, days: string = "90") => {
      const res = await api.get<StudentCasefile>(`/counselors/students/${studentId}/casefile?days=${days}`);
      return res.data;
    }
  };

  export interface CounselorNoteItem {
    id: string;
    alert_id?: string | null;
    student_id: string;
    counselor_id: string;
    counselor_name?: string | null;
    note: string;
    created_at: string;
  }

  export const notesAPI = {
    addAlertNote: async (alertId: string, note: string) => {
      const res = await api.post<CounselorNoteItem>(`/counselors/alerts/${alertId}/notes`, { note });
      return res.data;
    },
    getAlertNotes: async (alertId: string) => {
      const res = await api.get<{ notes: CounselorNoteItem[]; total: number }>(`/counselors/alerts/${alertId}/notes`);
      return res.data;
    },
    getStudentNotes: async (studentId: string) => {
      const res = await api.get<{ notes: CounselorNoteItem[]; total: number }>(`/counselors/students/${studentId}/notes`);
      return res.data;
    },
    addStudentNote: async (studentId: string, note: string) => {
      const res = await api.post<CounselorNoteItem>(`/counselors/students/${studentId}/notes`, { note });
      return res.data;
    }
  };

  export interface AuditLogItem {
    id: string;
    actor_user_id?: string | null;
    actor_name?: string | null;
    actor_role: string;
    action: string;
    target_user_id?: string | null;
    target_user_name?: string | null;
    target_resource_type: string;
    target_resource_id?: string | null;
    request_id?: string | null;
    ip_address?: string | null;
    user_agent?: string | null;
    metadata_json?: Record<string, any> | null;
    created_at: string;
    // Feature 2 aliases
    user_id?: string | null;
    resource_type?: string;
    resource_id?: string | null;
    details?: Record<string, any> | null;
    timestamp?: string;
  }

  export const auditAPI = {
    getAuditLogs: async (params?: { 
      action?: string; 
      actor_role?: string; 
      user_id?: string;
      resource_type?: string;
      date_range?: string;
      start_date?: string;
      end_date?: string;
      page?: number; 
      page_size?: number;
    }) => {
      const res = await api.get<{ logs: AuditLogItem[]; total: number; page: number; page_size: number }>("/admin/audit-logs", { params });
      return res.data;
    }
  };

  export interface RiskFactorItem {
    id: string;
    name: string;
    category: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "POSITIVE";
    impact_pct: number;
    description: string;
    source_metric?: string | null;
  }

  export interface TrendPeriodSummary {
    period_days: number;
    direction: "IMPROVING" | "DECLINING" | "STABLE" | "INSUFFICIENT_DATA" | string;
    wellness_delta: number;
    average_wellness: number;
    assessments_count: number;
    mood_logs_count: number;
    average_mood_score?: number | null;
    average_sentiment?: number | null;
    crisis_flags_count: number;
  }

  export interface TrendSummary {
    summary_7d: TrendPeriodSummary;
    summary_30d: TrendPeriodSummary;
    primary_direction: "IMPROVING" | "DECLINING" | "STABLE" | "CRITICAL" | string;
    headline: string;
  }

  export interface PredictionExplanationResponse {
    student_id: string;
    current_risk_tier: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    current_wellness_score: number;
    evaluated_at: string;
    trend_summary: TrendSummary;
    top_factors: RiskFactorItem[];
  }

  export type ExplanationDirection = "increasing_risk" | "decreasing_risk";

  export interface RiskExplanationItem {
    id: string;
    prediction_id: string;
    feature_name: string;
    shap_value: number;
    direction: ExplanationDirection;
    rank: number;
    impact_symbol: string;
    is_protective: boolean;
    description: string;
  }

  export interface PredictionShapExplanationResponse {
    prediction_id: string;
    wellness_score: number;
    risk_tier: string;
    heading: string;
    disclaimer: string;
    top_factors: RiskExplanationItem[];
  }

  export const predictionsAPI = {
    getRiskExplanation: async (studentId: string) => {
      const res = await api.get<PredictionExplanationResponse>(`/predictions/explain/${studentId}`);
      return res.data;
    },
    getShapExplanation: async (predictionId: string) => {
      const res = await api.get<PredictionShapExplanationResponse>(`/predictions/${predictionId}/explanation`);
      return res.data;
    }
  };

  export interface UserConsentsSummary {
    user_id: string;
    journal_sharing: boolean;
    behavioral_tracking: boolean;
    anonymous_analytics: boolean;
    counselor_access: boolean;
    last_updated?: string | null;
    onboarding_completed: boolean;
  }

  export interface ConsentRecordHistoryItem {
    id: string;
    user_id: string;
    consent_type: "journal_sharing" | "behavioral_tracking" | "anonymous_analytics" | "counselor_access" | string;
    granted: boolean;
    granted_at?: string | null;
    revoked_at?: string | null;
    ip_address?: string | null;
    created_at: string;
  }

  export interface ConsentHistoryResponse {
    history: ConsentRecordHistoryItem[];
    total: number;
  }

  export const consentRecordsAPI = {
    getConsents: async () => {
      const res = await api.get<UserConsentsSummary>("/consent");
      return res.data;
    },
    updateConsent: async (consent_type: string, granted: boolean) => {
      const res = await api.post<UserConsentsSummary>("/consent", { consent_type, granted });
      return res.data;
    },
    batchUpdateConsents: async (consents: Record<string, boolean>) => {
      const res = await api.post<UserConsentsSummary>("/consent/batch", { consents });
      return res.data;
    },
    getHistory: async (limit: number = 100) => {
      const res = await api.get<ConsentHistoryResponse>("/consent/history", { params: { limit } });
      return res.data;
    }
  };

  export interface NotificationItem {
    id: string;
    user_id: string;
    type: "risk_alert" | "session_reminder" | "system" | "counselor_message" | string;
    title: string;
    message: string;
    channel: "in_app" | "email" | "both" | string;
    is_read: boolean;
    created_at: string;
    read_at?: string | null;
  }

  export interface NotificationListResponse {
    items: NotificationItem[];
    total: number;
    unread_count: number;
    notifications?: NotificationItem[];
  }

  export interface NotificationMarkReadResponse {
    success: boolean;
    marked_count: number;
    unread_count: number;
  }

  export const notificationsAPI = {
    getNotifications: async (limit: number = 50, unreadOnly: boolean = false) => {
      const res = await api.get<NotificationListResponse>("/notifications", {
        params: { limit, unread_only: unreadOnly }
      });
      return res.data;
    },
    markRead: async (notificationId: string) => {
      const res = await api.patch<NotificationItem>(`/notifications/${notificationId}/read`);
      return res.data;
    },
    markAllRead: async () => {
      const res = await api.post<NotificationMarkReadResponse>("/notifications/mark-all-read");
      return res.data;
    },
    createTestNotification: async (payload: { title: string; message: string; type?: string; channel?: string }) => {
      const res = await api.post<NotificationItem>("/notifications/test", payload);
      return res.data;
    }
  };

  export interface WellnessTrendPoint {
    date: string;
    wellness_score: number;
    phq9_score?: number | null;
    gad7_score?: number | null;
    nlp_sentiment?: number | null;
    primary_emotion?: string | null;
    risk_level: string;
    rolling_avg: number;
  }

  export interface WellnessTrendSummary {
    average_wellness_score: number;
    wellness_delta: number;
    direction: "IMPROVING" | "STABLE" | "DECLINING" | string;
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
    points: WellnessTrendPoint[];
  }

  export const trendsAPI = {
    getWellnessTrends: async (timeframe: string = "30d", studentId?: string) => {
      const res = await api.get<WellnessTrendResponse>("/predictions/trends", {
        params: { timeframe, student_id: studentId }
      });
      return res.data;
    }
  };

  export interface DepartmentRiskItem {
    department: string;
    student_count: number;
    average_wellness_score: number;
    low_risk_count: number;
    medium_risk_count: number;
    high_risk_count: number;
  }

  export interface DepartmentRiskResponse {
    departments: DepartmentRiskItem[];
    total_departments: number;
  }

  export interface AdminUserItem {
    id: string;
    email: string;
    role: "STUDENT" | "COUNSELOR" | "ADMIN" | string;
    is_active: boolean;
  }

  export interface AdminUserDirectoryResponse {
    users: AdminUserItem[];
    page: number;
    total_pages: number;
  }

  export const adminAPI = {
    getDepartmentRisk: async () => {
      const res = await api.get<DepartmentRiskResponse>("/analytics/department-risk");
      return res.data;
    },
    getUsers: async (page: number = 1, role?: string) => {
      const params: Record<string, any> = { page };
      if (role) params.role = role;
      const res = await api.get<AdminUserDirectoryResponse>("/admin/users", { params });
      return res.data;
    },
    updateUserStatus: async (userId: string, isActive: boolean) => {
      const res = await api.patch<AdminUserItem>(`/admin/users/${userId}/status`, {
        is_active: isActive
      });
      return res.data;
    }
  };

  export interface PersonalizedRecommendationItem {
    id: string;
    category: string;
    title: string;
    description: string;
    reason?: string | null;
    action_type: "INTERNAL_ROUTE" | "EXTERNAL_URL" | string;
    action_url: string;
    risk_tier?: string | null;
    status: "ACTIVE" | "COMPLETED" | "DISMISSED" | string;
    feedback?: "HELPFUL" | "NOT_HELPFUL" | null;
    created_at: string;
    completed_at?: string | null;
  }

  export interface PersonalizedRecommendationsResponse {
    risk_tier: string;
    primary_emotion: string;
    wellness_score?: number | null;
    rationale: string;
    recommendations: PersonalizedRecommendationItem[];
  }

  export const recommendationsAPI = {
    getPersonalized: async () => {
      const res = await api.get<PersonalizedRecommendationsResponse>("/recommendations/personalized");
      return res.data;
    },
    recordFeedback: async (recId: string, payload: { feedback?: string; status?: string }) => {
      const res = await api.post<PersonalizedRecommendationItem>(`/recommendations/${recId}/feedback`, payload);
      return res.data;
    }
  };

  export interface MoodCheckinItem {
    id: number;
    user_id: string;
    checkin_type: "morning" | "evening" | string;
    mood_score: number;
    energy_level: number;
    anxiety_level: number;
    sleep_quality: "poor" | "fair" | "good" | "great" | string;
    sleep_hours: number;
    primary_emotion: string;
    one_word_feeling?: string | null;
    stress_source?: string | null;
    created_at: string;
  }

  export interface MoodCheckinCreatePayload {
    checkin_type: "morning" | "evening";
    mood_score: number;
    energy_level: number;
    anxiety_level: number;
    sleep_quality: "poor" | "fair" | "good" | "great";
    sleep_hours: number;
    primary_emotion: string;
    one_word_feeling?: string;
    stress_source?: string;
  }

  export interface MoodCheckinListResponse {
    items: MoodCheckinItem[];
    total: number;
    range: string;
  }

  export interface MoodCheckinSummaryResponse {
    total_checkins: number;
    streak_days: number;
    avg_mood_score: number;
    avg_energy_level: number;
    avg_anxiety_level: number;
    avg_sleep_hours: number;
    sleep_quality_breakdown: Record<string, number>;
    common_emotions: Record<string, number>;
    common_stress_sources: Record<string, number>;
    latest_checkin?: MoodCheckinItem | null;
  }

  export const checkinsAPI = {
    create: async (payload: MoodCheckinCreatePayload) => {
      const res = await api.post<MoodCheckinItem>("/checkins", payload);
      return res.data;
    },
    getMyCheckins: async (range: string = "7d") => {
      const res = await api.get<MoodCheckinListResponse>("/checkins", { params: { range } });
      return res.data;
    },
    getSummary: async () => {
      const res = await api.get<MoodCheckinSummaryResponse>("/checkins/summary");
      return res.data;
    },
    getStudentCheckinsForCounselor: async (studentId: string, range: string = "30d") => {
      const res = await api.get<MoodCheckinListResponse>(`/counselor/students/${studentId}/checkins`, {
        params: { range }
      });
      return res.data;
    }
  };

  export default api;





