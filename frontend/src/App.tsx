import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence } from "motion/react";
import CookieConsentBanner from "./components/public/CookieConsentBanner";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/layouts/DashboardLayout";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import PageLoader from "./components/ui/PageLoader";

// Lazy-loaded routes for code-splitting and rapid initial page loads
const LandingPage = lazy(() => import("./pages/public/LandingPage"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const PrivacyPolicyPage = lazy(() => import("./pages/public/PrivacyPolicyPage"));
const TermsAndConditionsPage = lazy(() => import("./pages/public/TermsAndConditionsPage"));
const NotFoundPage = lazy(() => import("./pages/public/NotFoundPage"));

const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard"));
const StudentChatbot = lazy(() => import("./pages/student/StudentChatbot"));
const DailyCheckInPage = lazy(() => import("./pages/student/DailyCheckInPage"));
const MoodHistoryPage = lazy(() => import("./pages/student/MoodHistoryPage"));
const SelfCareResourcesPage = lazy(() => import("./pages/student/SelfCareResourcesPage"));
const PrivacyConsentPage = lazy(() => import("./pages/student/PrivacyConsentPage"));
const ScreenTimePage = lazy(() => import("./pages/student/ScreenTimePage"));
const CounselorDashboard = lazy(() => import("./pages/counselor/CounselorDashboard"));
const StudentCaseFile = lazy(() => import("./pages/counselor/StudentCaseFile"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminAuditLogs = lazy(() => import("./pages/admin/AdminAuditLogs"));
const Settings = lazy(() => import("./pages/settings/Settings"));

// Setup global React Query client with standard stale time (5 minutes)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Router>
            <Suspense fallback={<PageLoader />}>
              <Routes>
            {/* Root & Public auth pages */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsAndConditionsPage />} />


            {/* STUDENT Guarded Pathways */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={["STUDENT"]}>
                  <DashboardLayout
                    title="Student Wellness Hub"
                    subtitle="Your secure, private space to track mental wellness indices and study-rest balance."
                  >
                    <StudentDashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/chat"
              element={
                <ProtectedRoute allowedRoles={["STUDENT"]}>
                  <DashboardLayout
                    title="AI Wellness Companion"
                    subtitle="Confidential, 24/7 AI-guided mental health support, emotional reflection, and coping tools."
                  >
                    <StudentChatbot />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/check-in"
              element={
                <ProtectedRoute allowedRoles={["STUDENT"]}>
                  <DashboardLayout
                    title="Daily Mood Check-In"
                    subtitle="Log your emotional check-in via text, voice, or standard clinical survey."
                  >
                    <DailyCheckInPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/history"
              element={
                <ProtectedRoute allowedRoles={["STUDENT"]}>
                  <DashboardLayout
                    title="Mood Logs & Trajectory"
                    subtitle="Review your historical mood entries, wellness scores, and risk analysis."
                  >
                    <MoodHistoryPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/resources"
              element={
                <ProtectedRoute allowedRoles={["STUDENT"]}>
                  <DashboardLayout
                    title="Self-Care Recommendations"
                    subtitle="Access clinical exercises, meditation techniques, and customized pathways."
                  >
                    <SelfCareResourcesPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/privacy"
              element={
                <ProtectedRoute allowedRoles={["STUDENT"]}>
                  <DashboardLayout
                    title="Privacy & Consent Center"
                    subtitle="Manage data collection preferences, AI explainability rights, and counselor escalation controls."
                  >
                    <PrivacyConsentPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/screentime"
              element={
                <ProtectedRoute allowedRoles={["STUDENT"]}>
                  <DashboardLayout
                    title="Screen Time & Digital Phenotyping"
                    subtitle="Analyze active computer time, late-night circadian fatigue, top applications, and search intent."
                  >
                    <ScreenTimePage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* STUDENT Pathway Interventions & Tool Aliases */}
            <Route
              path="/student/screen-time"
              element={<Navigate to="/student/screentime" replace />}
            />
            <Route
              path="/student/screen_time"
              element={<Navigate to="/student/screentime" replace />}
            />
            <Route
              path="/student/apps"
              element={<Navigate to="/student/screentime" replace />}
            />
            <Route
              path="/student/grounding"
              element={<Navigate to="/student/resources" replace />}
            />
            <Route
              path="/student/journal"
              element={<Navigate to="/student/check-in" replace />}
            />
            <Route
              path="/student/reframer"
              element={<Navigate to="/student/chat" replace />}
            />
            <Route
              path="/student/sos"
              element={<Navigate to="/student/resources" replace />}
            />
            <Route
              path="/student/appointments"
              element={<Navigate to="/student/resources" replace />}
            />

            {/* COUNSELOR Guarded Pathways */}
            <Route
              path="/counselor/dashboard"
              element={
                <ProtectedRoute allowedRoles={["COUNSELOR"]}>
                  <DashboardLayout
                    title="Counselor Triage Console"
                    subtitle="Monitor warnings queue, manage clinical assignments, and update case files."
                  >
                    <CounselorDashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/counselor/alerts"
              element={
                <ProtectedRoute allowedRoles={["COUNSELOR"]}>
                  <DashboardLayout
                    title="Active Intervention Alerts"
                    subtitle="Triage high-risk clinical warnings flagged by student check-ins."
                  >
                    <CounselorDashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/counselor/students"
              element={
                <ProtectedRoute allowedRoles={["COUNSELOR"]}>
                  <DashboardLayout
                    title="Student Case Files"
                    subtitle="Access historical wellness charts, extracted NLP emotions, and user dossiers."
                  >
                    <CounselorDashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/counselor/students/:studentId/casefile"
              element={
                <ProtectedRoute allowedRoles={["COUNSELOR", "ADMIN"]}>
                  <DashboardLayout
                    title="Student Case File & Timeline"
                    subtitle="Longitudinal multi-modal clinical history, emotional trends, and incident timeline."
                  >
                    <StudentCaseFile />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* ADMIN Guarded Pathways */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <DashboardLayout
                    title="Institutional Analytics Dashboard"
                    subtitle="Anonymized macro-level campus stress indices and risk breakdowns."
                  >
                    <AdminDashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <DashboardLayout
                    title="Institutional Wellness Reports"
                    subtitle="Explore aggregated wellness index Average monthly trendlines."
                  >
                    <AdminDashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/directory"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <DashboardLayout
                    title="User Directory"
                    subtitle="Audit and manage all registered student, counselor, and admin accounts."
                  >
                    <AdminDashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <DashboardLayout
                    title="Security Audit Trail"
                    subtitle="Immutable compliance logs for clinical record access and crisis escalations."
                  >
                    <AdminAuditLogs />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* COMMON Settings Pathway */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={["STUDENT", "COUNSELOR", "ADMIN"]}>
                  <DashboardLayout
                    title="Account Settings"
                    subtitle="Manage appearance themes, security configurations, and notification preferences."
                  >
                    <Settings />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

              {/* 404 Dedicated Not Found Page */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
          <CookieConsentBanner />
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
  );
}

export default App;
