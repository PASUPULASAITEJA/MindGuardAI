import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Eye,
  EyeOff,
  Loader2,
  Brain,
  ShieldCheck,
  Sparkles,
  Lock,
  PhoneCall,
} from "lucide-react";
import ThemeToggle from "@/components/layouts/ThemeToggle";

const loginSchema = z.object({
  email: z.string().min(2, "Please enter your username or university email address."),
  password: z.string().min(1, "Password is required."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      const loggedUser = await login(data.email, data.password, rememberMe);

      toast({
        title: "Authenticated Successfully",
        description: `Signed in as ${loggedUser.role}.`,
        variant: "success",
      });

      if (loggedUser.role === "STUDENT") {
        navigate("/student/dashboard");
      } else if (loggedUser.role === "COUNSELOR") {
        navigate("/counselor/dashboard");
      } else if (loggedUser.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else {
        navigate("/student/dashboard");
      }
    } catch (error: any) {
      const apiError = error.response?.data?.detail || {};
      toast({
        title: "Authentication Failed",
        description: apiError.message || "Invalid credentials. Please verify your email and password.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const setDemoCredentials = (email: string, pass = "Student@123") => {
    setValue("email", email, { shouldValidate: true });
    setValue("password", pass, { shouldValidate: true });
  };

  const handleDemoNav = (path: string, email: string) => {
    setDemoCredentials(email, "Student@123");
    navigate(path);
  };

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground font-sans antialiased">
      {/* LEFT PANEL — hidden below lg, lg:flex, w-1/2 */}
      <div className="hidden lg:flex w-1/2 bg-primary flex-col justify-between p-12 text-white relative select-none">
        {/* TOP */}
        <div>
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md transition-transform group-hover:scale-105 overflow-hidden">
              <img src="/logo.png" alt="MindGuardAI Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex items-center gap-1 font-extrabold text-xl tracking-tight text-white">
              <span>MindGuard</span>
              <span className="text-white/90">AI</span>
            </div>
          </Link>

          {/* Headline & Body */}
          <div className="mt-14 max-w-md">
            <h2 className="text-3xl font-extrabold text-white leading-snug">
              Protecting student wellbeing — before crisis hits.
            </h2>
            <p className="text-sm text-white/70 mt-3 max-w-xs leading-relaxed">
              MindGuardAI detects burnout early using emotion NLP, sleep analysis, and validated PHQ-9 & GAD-7 screeners.
            </p>
          </div>

          {/* MIDDLE — 3 bullet points */}
          <div className="mt-10 space-y-5">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-white/10 p-2 w-9 h-9 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm text-white/85 font-medium self-center">
                PHQ-9 & GAD-7 validated screeners
              </span>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-white/10 p-2 w-9 h-9 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm text-white/85 font-medium self-center">
                SHAP explainable risk scores
              </span>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-white/10 p-2 w-9 h-9 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm text-white/85 font-medium self-center">
                Zero keystroke surveillance
              </span>
            </div>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="mt-auto pt-8 border-t border-white/20 flex items-center gap-2 text-xs text-white/55">
          <PhoneCall className="w-4 h-4 text-white/60 shrink-0 inline" />
          <span>24/7 Crisis Support &middot; Tele-MANAS: 14416</span>
        </div>
      </div>

      {/* RIGHT PANEL — flex-1, flex flex-col items-center justify-center min-h-screen bg-background px-8 */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-background px-6 sm:px-8 relative">
        {/* ThemeToggle absolute top-4 right-4 */}
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>

        {/* Mobile logo (lg:hidden) */}
        <Link to="/" className="lg:hidden flex items-center gap-2 mb-8 group">
          <div className="w-10 h-10 rounded-xl bg-card border border-border/80 p-0.5 flex items-center justify-center shadow-xs overflow-hidden">
            <img src="/logo.png" alt="MindGuardAI Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex items-center gap-1 font-bold text-lg tracking-tight text-foreground">
            <span>MindGuard</span>
            <span className="text-primary">AI</span>
          </div>
        </Link>

        {/* Form wrapper */}
        <div className="w-full max-w-sm space-y-6">
          {/* Header */}
          <div className="space-y-1 text-center sm:text-left">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in with your university email
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email field */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-semibold text-foreground block"
              >
                University Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@university.edu"
                className="rounded-xl h-10 text-sm focus:ring-2 focus:ring-primary/30"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-xs font-semibold text-foreground block"
              >
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="rounded-xl h-10 text-sm pr-10 focus:ring-2 focus:ring-primary/30"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Row: Remember me + Forgot password? */}
            <div className="flex justify-between items-center pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary"
                />
                <span className="text-xs text-muted-foreground">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-primary font-medium hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center gap-3 my-2">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground">or continue as</span>
            <div className="flex-1 border-t border-border" />
          </div>

          {/* 3 demo role buttons */}
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={() => handleDemoNav("/student/dashboard", "student1@mindguard.edu")}
              className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-secondary transition-colors"
            >
              Student Demo
            </button>
            <button
              type="button"
              onClick={() => handleDemoNav("/counselor/dashboard", "counselor1@mindguard.edu")}
              className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-secondary transition-colors"
            >
              Counsellor Demo
            </button>
            <button
              type="button"
              onClick={() => handleDemoNav("/admin/dashboard", "admin@mindguard.edu")}
              className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-secondary transition-colors"
            >
              Admin Demo
            </button>
          </div>

          {/* Bottom register link */}
          <p className="text-xs text-muted-foreground text-center mt-4">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="text-primary font-semibold hover:underline">
              Register &rarr;
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
