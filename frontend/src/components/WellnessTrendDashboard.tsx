import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Calendar,
  Sparkles,
  HeartPulse,
  Flame,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { trendsAPI, WellnessTrendResponse } from "../services/api";

interface WellnessTrendDashboardProps {
  studentId?: string;
  isCounselorView?: boolean;
}

export const WellnessTrendDashboard: React.FC<WellnessTrendDashboardProps> = ({
  studentId,
  isCounselorView = false
}) => {
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "90d">("30d");
  const [data, setData] = useState<WellnessTrendResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadTrends = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await trendsAPI.getWellnessTrends(timeframe, studentId);
        if (isMounted) {
          setData(res);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.response?.data?.message || "Failed to load wellness trends.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    loadTrends();
    return () => {
      isMounted = false;
    };
  }, [timeframe, studentId]);

  const summary = data?.summary;
  const points = data?.points || [];

  const getDirectionIcon = (dir: string) => {
    if (dir === "IMPROVING") return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    if (dir === "DECLINING") return <TrendingDown className="w-4 h-4 text-rose-400" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const getDirectionBadge = (dir: string) => {
    if (dir === "IMPROVING")
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    if (dir === "DECLINING")
      return "bg-rose-500/15 text-rose-400 border-rose-500/30";
    return "bg-slate-800 text-slate-300 border-slate-700/50";
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-5 rounded-2xl shadow-xl shadow-black/20">
        <div>
          <div className="flex items-center space-x-2">
            <HeartPulse className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white tracking-wide">
              {isCounselorView ? "Longitudinal Wellness Trajectory" : "Your Wellness Trend Dashboard"}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visualizing multi-day mental wellness indices, emotion vectors, and rolling stability.
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 self-start sm:self-auto">
          {(["7d", "30d", "90d"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                timeframe === t
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t === "7d" ? "7 Days" : t === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-72 flex items-center justify-center bg-slate-900/40 border border-slate-800 rounded-2xl">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400 font-medium">Computing longitudinal metrics...</span>
          </div>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-950/20 border border-rose-500/30 rounded-2xl flex items-center space-x-3 text-rose-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-xs">{error}</span>
        </div>
      ) : summary ? (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Avg Score */}
            <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Average Wellness</span>
                <Activity className="w-4 h-4 text-purple-400" />
              </div>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-2xl font-black text-white">{summary.average_wellness_score}</span>
                <span className="text-xs text-slate-500">/ 100</span>
              </div>
              <div className="mt-2 flex items-center space-x-1.5">
                <span className="text-[11px] text-slate-400">
                  Peak: <strong className="text-slate-200">{summary.highest_score}</strong> | Low:{" "}
                  <strong className="text-slate-200">{summary.lowest_score}</strong>
                </span>
              </div>
            </div>

            {/* Trajectory & Delta */}
            <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Period Trajectory</span>
                {getDirectionIcon(summary.direction)}
              </div>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-2xl font-black text-white">
                  {summary.wellness_delta >= 0 ? `+${summary.wellness_delta}` : summary.wellness_delta}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getDirectionBadge(
                    summary.direction
                  )}`}
                >
                  {summary.direction}
                </span>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">Net delta across chosen timeframe</p>
            </div>

            {/* Dominant Emotion */}
            <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Dominant Affect</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-2xl font-black capitalize text-white">
                  {summary.dominant_emotion}
                </span>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                {Object.keys(summary.emotion_distribution).length} emotional markers mapped
              </p>
            </div>

            {/* Stability / Volatility */}
            <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Score Volatility</span>
                <Flame className="w-4 h-4 text-rose-400" />
              </div>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-2xl font-black text-white">±{summary.volatility_score}</span>
                <span className="text-xs text-slate-400">
                  {summary.volatility_score < 8
                    ? "(High Stability)"
                    : summary.volatility_score < 15
                    ? "(Moderate Shift)"
                    : "(High Flux)"}
                </span>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">{summary.total_checkins} total check-in events</p>
            </div>
          </div>

          {/* Interactive Trajectory Chart */}
          <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl shadow-xl shadow-black/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Longitudinal Mental Wellness Curve
                </h3>
                <p className="text-xs text-slate-400">
                  Daily composite scores (Cyan) vs Rolling moving average (Amber)
                </p>
              </div>
              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-cyan-400" />
                  <span className="text-slate-300">Daily Score</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-1 bg-amber-400 rounded" />
                  <span className="text-slate-300">Rolling Avg</span>
                </div>
              </div>
            </div>

            {points.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center">
                <Calendar className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs text-slate-300 font-semibold">No check-ins logged during this window</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Check in daily to build your predictive wellness trajectory.
                </p>
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={points} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="wellnessGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(d) => {
                        const parts = d.split("-");
                        return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : d;
                      }}
                    />
                    <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "0.75rem",
                        boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.5)",
                        fontSize: "12px"
                      }}
                      formatter={(value: any, name: string) => {
                        if (name === "wellness_score") return [`${value} / 100`, "Wellness Score"];
                        if (name === "rolling_avg") return [`${value} / 100`, "Rolling Average"];
                        return [value, name];
                      }}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    {/* Clinical thresholds */}
                    <ReferenceLine y={70} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.4} label={{ value: "Optimal", fill: "#10b981", fontSize: 10, position: "insideTopRight" }} />
                    <ReferenceLine y={40} stroke="#f43f5e" strokeDasharray="3 3" strokeOpacity={0.4} label={{ value: "Elevated Risk", fill: "#f43f5e", fontSize: 10, position: "insideBottomRight" }} />
                    
                    <Area
                      type="monotone"
                      dataKey="wellness_score"
                      stroke="#06b6d4"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#wellnessGradient)"
                    />
                    <Line
                      type="monotone"
                      dataKey="rolling_avg"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Emotion Spectrum Distribution */}
          {Object.keys(summary.emotion_distribution).length > 0 && (
            <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl shadow-xl shadow-black/20">
              <h3 className="text-sm font-bold text-white tracking-wide mb-3">
                Longitudinal Emotion Spectrum Distribution
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(summary.emotion_distribution).map(([emotion, count]) => (
                  <div
                    key={emotion}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80"
                  >
                    <span className="text-xs font-semibold capitalize text-slate-300">{emotion}</span>
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {count} {count === 1 ? "entry" : "entries"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};

export default WellnessTrendDashboard;
