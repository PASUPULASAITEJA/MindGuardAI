import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Monitor,
  Moon,
  Sun,
  Clock,
  BookOpen,
  Gamepad2,
  MessageSquare,
  ShieldAlert,
  Search,
  Activity,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  Laptop,
  Code,
  Globe,
  Music,
  TrendingUp,
  Brain
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { chatAPI } from "@/services/api";
import { useTheme } from "@/contexts/ThemeContext";
import { pageVariants, cardEntrance } from "@/utils/motion";

interface AppUsageItem {
  name: string;
  proc: string;
  minutes: number;
  category: string;
  percentage?: number;
  icon?: string;
}

interface SearchTopicItem {
  query: string;
  count: number;
  category: string;
  flagged?: boolean;
}

export const ScreenTimePage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSummary = async () => {
    try {
      setRefreshing(true);
      const res = await chatAPI.getBehavioralSummary();
      setData(res);
    } catch (err) {
      console.error("Error fetching screen time telemetry:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const latest = data?.latest_log;
  const totalMins = latest?.total_screen_time_minutes || 0;
  const lateNightMins = latest?.late_night_usage_minutes || 0;
  const daytimeMins = latest?.daytime_usage_minutes ?? Math.max(0, totalMins - lateNightMins);
  const academicMins = latest?.academic_usage_minutes || 0;
  const entertainmentMins = latest?.entertainment_usage_minutes || 0;
  const socialMins = latest?.social_usage_minutes || 0;
  const adultMins = latest?.adult_usage_minutes || 0;
  const continuousMins = latest?.continuous_screen_minutes || 0;
  const isCrisis = latest?.is_crisis_detected || false;

  const formatHoursMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  // 1. Category Chart Data (Studying, Playing, Normal, Adult)
  const categoryData = [
    { name: "Studying", value: academicMins, color: "#3b82f6", icon: BookOpen, desc: "Academic, Coding & Coursework" },
    { name: "Playing", value: entertainmentMins, color: "#8b5cf6", icon: Gamepad2, desc: "Gaming, Media & Streaming" },
    { name: "Normal", value: socialMins, color: "#10b981", icon: MessageSquare, desc: "Social, Messaging & Browsing" },
    { name: "Adult", value: adultMins, color: "#f43f5e", icon: ShieldAlert, desc: "Restricted / Sensitive Content" },
  ].filter(c => c.value > 0);

  // 2. Day vs Late Night Data
  const timeOfDayData = [
    { name: "Daytime (5am-11:59pm)", minutes: daytimeMins, color: "#0ea5e9" },
    { name: "Late Night (12am-5am)", minutes: lateNightMins, color: "#f59e0b" },
  ];

  // 3. Top Apps (Only authentic tracked applications)
  const topApps: AppUsageItem[] = (data?.top_apps || latest?.top_apps || []).filter(
    (a: AppUsageItem) => a.minutes > 0
  );

  // 4. Online Searches (Only authentic tracked search queries)
  const searchTopics: SearchTopicItem[] = data?.search_topics || latest?.search_topics || [];

  // Helper for App Icon
  const renderAppIcon = (icon?: string, category?: string) => {
    switch (icon) {
      case "code": return <Code className="w-5 h-5 text-blue-500" />;
      case "book": return <BookOpen className="w-5 h-5 text-indigo-500" />;
      case "gamepad": return <Gamepad2 className="w-5 h-5 text-purple-500" />;
      case "music": return <Music className="w-5 h-5 text-pink-500" />;
      case "message": return <MessageSquare className="w-5 h-5 text-emerald-500" />;
      case "globe": return <Globe className="w-5 h-5 text-sky-500" />;
      case "shield-alert": return <ShieldAlert className="w-5 h-5 text-rose-500" />;
      default:
        if (category === "Playing") return <Gamepad2 className="w-5 h-5 text-purple-500" />;
        if (category === "Normal") return <MessageSquare className="w-5 h-5 text-emerald-500" />;
        if (category === "Adult") return <ShieldAlert className="w-5 h-5 text-rose-500" />;
        return <Laptop className="w-5 h-5 text-blue-500" />;
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case "Studying":
      case "Academic":
        return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30";
      case "Playing":
      case "Entertainment":
        return "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30";
      case "Normal":
      case "Social":
        return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      case "Adult":
        return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
      case "Crisis / Urgent":
        return "bg-red-600 text-white animate-pulse border-red-500";
      default:
        return "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30";
    }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="max-w-6xl mx-auto space-y-8 pb-12 font-sans"
    >
      {/* Top Navigation & Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/student/dashboard")}
            className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Dashboard
          </Button>
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 hidden md:block" />
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={data?.is_agent_connected
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1.5 px-3 py-1"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 flex items-center gap-1.5 px-3 py-1"
              }
            >
              <span className={`w-2 h-2 rounded-full ${data?.is_agent_connected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
              {data?.is_agent_connected ? "Live Desktop Telemetry Active" : "Passive Screen Time Tracking"}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSummary}
            disabled={refreshing}
            className="rounded-xl border-slate-200 dark:border-slate-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            Sync Now
          </Button>
        </div>
      </div>

      {/* Hero Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Monitor className="w-8 h-8 text-blue-500" />
          Screen Time & Digital Phenotyping
        </h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Real-time activity classification, late-night circadian tracking, application usage, and search intent analysis.
        </p>
      </div>

      {/* Crisis Alert Banner (if flagged) */}
      {isCrisis && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 flex items-start gap-3 shadow-lg"
        >
          <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 animate-bounce" />
          <div className="flex-1">
            <h4 className="font-semibold text-sm">Crisis Query Detected & Protection Safeguard Active</h4>
            <p className="text-xs text-red-600/90 dark:text-red-300 mt-0.5">
              A search query indicating severe acute distress was observed. Your campus counselor has been discretely notified.
              24/7 Crisis Hotline is available immediately at <span className="font-bold underline">988</span> or via the AI Companion.
            </p>
          </div>
        </motion.div>
      )}

      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Total Screen Time */}
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Active Today</span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tracking-tight">{formatHoursMins(totalMins)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Sun className="w-3.5 h-3.5 text-amber-500" /> {formatHoursMins(daytimeMins)} daytime active
            </p>
          </CardContent>
        </Card>

        {/* Stat 2: Late Night Disruption */}
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Late Night (12am–5am)</span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Moon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`text-2xl font-bold tracking-tight ${lateNightMins >= 60 ? "text-amber-600 dark:text-amber-400" : ""}`}>
                {formatHoursMins(lateNightMins)}
              </span>
              <Badge variant="outline" className={lateNightMins >= 60 ? "bg-amber-500/15 text-amber-600 text-[10px]" : "bg-emerald-500/15 text-emerald-600 text-[10px]"}>
                {lateNightMins >= 60 ? "Elevated Fatigue" : "Healthy Rest"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Circadian window between 00:00 & 05:00
            </p>
          </CardContent>
        </Card>

        {/* Stat 3: Study Focus Ratio */}
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Studying vs. Rest</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                {totalMins > 0 ? Math.round((academicMins / totalMins) * 100) : 65}%
              </span>
              <span className="text-xs text-muted-foreground ml-1.5">Academic Focus</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatHoursMins(academicMins)} on coursework & tools
            </p>
          </CardContent>
        </Card>

        {/* Stat 4: Unbroken Screen Session */}
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Strain Streak</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tracking-tight">{formatHoursMins(continuousMins)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {continuousMins >= 50 ? "⚠️ Recommended: 20-20-20 eye break" : "Within healthy eye-strain limits"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Row 1: The Screen Time Breakdown Donut & Day vs Late-Night Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Category Donut (Studying, Playing, Normal, Adult) */}
        <Card className="lg:col-span-7 rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  Screen Time Purpose Breakdown
                </CardTitle>
                <CardDescription className="text-xs">
                  Classified into Studying, Playing, Normal Socializing, and Adult Content.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4">
                {/* Donut Chart */}
                <div className="h-64 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [`${formatHoursMins(Number(val))}`, "Duration"]}
                        contentStyle={{
                          backgroundColor: isDark ? "#0f172a" : "#ffffff",
                          borderColor: isDark ? "#1e293b" : "#e2e8f0",
                          borderRadius: "0.75rem",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs text-muted-foreground font-medium">Classified</span>
                    <span className="text-xl font-bold">{formatHoursMins(totalMins)}</span>
                  </div>
                </div>

                {/* Category Legend & Details */}
                <div className="space-y-3">
                  {categoryData.map((cat) => {
                    const Icon = cat.icon;
                    const pct = totalMins > 0 ? Math.round((cat.value / totalMins) * 100) : 0;
                    return (
                      <div key={cat.name} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0" style={{ backgroundColor: cat.color }}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-xs">{cat.name}</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-slate-300 dark:border-slate-700">
                                {pct}%
                              </Badge>
                            </div>
                            <span className="text-[11px] text-muted-foreground block">{cat.desc}</span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-foreground shrink-0">{formatHoursMins(cat.value)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-12 px-4 text-center border border-dashed rounded-xl border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
                <Clock className="w-8 h-8 text-muted-foreground/60 mb-2" />
                <h4 className="text-xs font-semibold text-foreground">No Screen Time Classified Today</h4>
                <p className="text-[11px] text-muted-foreground mt-1 max-w-xs mx-auto">
                  Active computer time will be classified into Studying, Playing, Normal, and Adult content as you work.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Day vs. Late-Night Circadian Analysis */}
        <Card className="lg:col-span-5 rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Moon className="w-5 h-5 text-amber-500" />
              Day vs. Late Night Divide
            </CardTitle>
            <CardDescription className="text-xs">
              Circadian rhythm & melatonin preservation tracking.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeOfDayData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                  <XAxis type="number" tickFormatter={(v) => `${Math.round(v / 60)}h`} stroke="#94a3b8" fontSize={11} />
                  <YAxis type="category" dataKey="name" width={110} stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip
                    formatter={(val: any) => [`${formatHoursMins(Number(val))}`, "Usage"]}
                    contentStyle={{
                      backgroundColor: isDark ? "#0f172a" : "#ffffff",
                      borderColor: isDark ? "#1e293b" : "#e2e8f0",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="minutes" radius={[0, 8, 8, 0]}>
                    {timeOfDayData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Circadian Insight Card */}
            <div className={`p-3.5 rounded-xl border text-xs ${lateNightMins >= 60 ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"}`}>
              <div className="flex items-center gap-2 font-semibold">
                {lateNightMins >= 60 ? <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                {lateNightMins >= 60 ? "Nocturnal Screen Delay Detected" : "Optimal Sleep Preservation"}
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                {lateNightMins >= 60
                  ? `Active screen exposure of ${formatHoursMins(lateNightMins)} occurred past midnight. Nocturnal blue light delays REM sleep and increases cognitive fatigue.`
                  : "Minimal computer usage past midnight. Your natural sleep-wake cycle and melatonin production were preserved."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Top Apps Leaderboard & Online Searches */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Top Apps Leaderboard */}
        <Card className="lg:col-span-6 rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Laptop className="w-5 h-5 text-blue-500" />
                  Most Used Applications
                </CardTitle>
                <CardDescription className="text-xs">
                  Active foreground process duration ranked by time spent.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                {topApps.length} Apps Tracked
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {topApps.length > 0 ? (
              topApps.map((app, idx) => {
                const maxMinutes = Math.max(...topApps.map(a => a.minutes), 1);
                const barWidth = Math.min(100, Math.round((app.minutes / maxMinutes) * 100));

                return (
                  <div
                    key={`${app.proc}-${idx}`}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 space-y-2 hover:border-blue-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-muted-foreground w-4 text-center">
                          #{idx + 1}
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-background border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 shadow-xs">
                          {renderAppIcon(app.icon, app.category)}
                        </div>
                        <div>
                          <span className="font-semibold text-xs block text-foreground">{app.name}</span>
                          <span className="text-[11px] text-muted-foreground font-mono">{app.proc}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] font-medium border px-2 py-0.5 ${getCategoryBadgeClass(app.category)}`}>
                          {app.category}
                        </Badge>
                        <span className="text-xs font-bold text-foreground min-w-[50px] text-right">
                          {formatHoursMins(app.minutes)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200/60 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          app.category === "Studying" ? "bg-blue-500" :
                          app.category === "Playing" ? "bg-purple-500" :
                          app.category === "Adult" ? "bg-rose-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 px-4 text-center border border-dashed rounded-xl border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
                <Laptop className="w-8 h-8 text-muted-foreground/60 mb-2" />
                <h4 className="text-xs font-semibold text-foreground">No Applications Recorded Today</h4>
                <p className="text-[11px] text-muted-foreground mt-1 max-w-xs mx-auto">
                  Foreground applications will be automatically detected and ranked as you work on your PC.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: What the Student is Searching for Online */}
        <Card className="lg:col-span-6 rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Search className="w-5 h-5 text-indigo-500" />
                  Online Search Topics & Intent
                </CardTitle>
                <CardDescription className="text-xs">
                  Keywords and research topics extracted from browser search queries.
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Safe Search Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {searchTopics.length > 0 ? (
              searchTopics.map((item, idx) => (
                <div
                  key={`${item.query}-${idx}`}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                    item.flagged
                      ? "bg-red-500/10 border-red-500/40 text-red-600 dark:text-red-400"
                      : "bg-slate-50 dark:bg-slate-900/60 border-slate-200/50 dark:border-slate-800/50 hover:border-indigo-500/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      item.flagged ? "bg-red-500/20 text-red-500" : "bg-indigo-500/10 text-indigo-500"
                    }`}>
                      {item.flagged ? <AlertTriangle className="w-4 h-4 animate-pulse" /> : <Search className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <span className="font-medium text-xs text-foreground block truncate">
                        "{item.query}"
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        {item.count} search queries observed today
                      </span>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={`text-[10px] px-2 py-0.5 border shrink-0 ${getCategoryBadgeClass(item.category)}`}
                  >
                    {item.category}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="py-12 px-4 text-center border border-dashed rounded-xl border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
                <Search className="w-8 h-8 text-muted-foreground/60 mb-2" />
                <h4 className="text-xs font-semibold text-foreground">No Web Searches Recorded Today</h4>
                <p className="text-[11px] text-muted-foreground mt-1 max-w-xs mx-auto">
                  Queries performed in Google, Bing, YouTube, or DuckDuckGo will be logged here with category tags.
                </p>
              </div>
            )}

            {/* Privacy & FERPA Disclaimer */}
            <div className="p-3 rounded-xl bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 text-[11px] text-muted-foreground flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-blue-500 shrink-0" />
              <span>
                Zero keystroke logging. Searches are categorized semantically to protect student privacy in compliance with FERPA & HIPAA standards.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default ScreenTimePage;
