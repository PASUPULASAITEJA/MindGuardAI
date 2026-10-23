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
  Shield,
  Heart,
  PhoneCall,
  Sparkles,
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
    watch,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const emailValue = watch("email");
  const passwordValue = watch("password");

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

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground font-sans antialiased transition-colors duration-200">
      {/* LEFT PANEL (hidden on mobile, w-1/2, bg-primary text-primary-foreground) */}
      <div className="hidden md:flex md:w-1/2 relative bg-gradient-to-b from-primary to-primary/80 text-primary-foreground p-10 lg:p-14 flex-col justify-between overflow-hidden shadow-2xl">
        {/* Subtle decorative background blur */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-black/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top: MindGuardAI logo + name */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white shadow-sm">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-white block">
              MindGuardAI
            </span>
            <span className="text-[11px] font-medium text-white/80 uppercase tracking-wider block">
              Higher Education Wellbeing
            </span>
          </div>
        </div>

        {/* Center: Quote + 3 bullet points with shield/heart/brain icons */}
        <div className="relative z-10 space-y-8 max-w-md my-auto py-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-semibold text-white">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Campus Wellness Intelligence</span>
            </div>
            <blockquote className="text-2xl lg:text-3xl font-extrabold leading-snug text-white">
              &ldquo;Your wellbeing matters. MindGuardAI is here before you reach out.&rdquo;
            </blockquote>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0 mt-0.5 text-white">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Zero-Keystroke Privacy</p>
                <p className="text-xs text-white/80 mt-0.5">
                  Full cryptographic client anonymity with strictly zero keystroke or screen monitoring.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0 mt-0.5 text-white">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Explainable Clinical AI</p>
                <p className="text-xs text-white/80 mt-0.5">
                  Validated psychometric screeners (PHQ-9/GAD-7) and SHAP factor attribution.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0 mt-0.5 text-white">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Compassionate Triage Pathway</p>
                <p className="text-xs text-white/80 mt-0.5">
                  Direct connection to university counselors before burnout becomes a crisis.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: 24/7 Crisis Support Available with PhoneCall icon */}
        <div className="relative z-10 pt-4 border-t border-white/20 flex items-center justify-between text-xs text-white/90">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-white" />
            <span className="font-semibold">24/7 Crisis Support Available</span>
          </div>
          <span className="font-mono text-[11px] bg-white/15 px-2.5 py-0.5 rounded-full font-medium">
            Tele-MANAS: 14416
          </span>
        </div>
      </div>

      {/* RIGHT PANEL (w-full md:w-1/2, bg-background) */}
      <div className="w-full md:w-1/2 flex flex-col justify-between p-6 sm:p-10 relative">
        {/* Top bar with ThemeToggle in top-right corner of right panel */}
        <div className="w-full flex items-center justify-between">
          <Link
            to="/"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            ← Back to Home
          </Link>
          <ThemeToggle />
        </div>

        {/* Centered form with max-w-sm */}
        <div className="w-full max-w-sm mx-auto my-auto py-8 animate-fade-in-up">
          <div className="text-center sm:text-left space-y-1.5 mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Welcome back
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Sign in with your university email
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field with Floating Label feel */}
            <div className="relative">
              <label
                htmlFor="email"
                className={`text-xs font-medium transition-all ${
                  emailValue ? "text-primary font-semibold" : "text-muted-foreground"
                } block mb-1`}
              >
                Institutional Email or Username
              </label>
              <Input
                id="email"
                type="text"
                autoComplete="email"
                placeholder="student@campus.edu or roll number"
                className={`h-11 rounded-lg ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-[11px] text-destructive mt-1 font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field with Floating Label feel + Show/Hide Toggle */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="password"
                  className={`text-xs font-medium transition-all ${
                    passwordValue ? "text-primary font-semibold" : "text-muted-foreground"
                  }`}
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] text-primary hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`h-11 rounded-lg pr-10 ${
                    errors.password ? "border-destructive focus-visible:ring-destructive" : ""
                  }`}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-destructive mt-1 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center space-x-2 pt-1">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary"
              />
              <label htmlFor="remember" className="text-xs text-muted-foreground select-none cursor-pointer">
                Keep me signed in on this device
              </label>
            </div>

            {/* Submit Button full width, bg-primary */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-lg shadow-sm transition-all"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Quick Persona Demo Fill */}
          <div className="mt-6 pt-5 border-t border-border">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block text-center mb-2.5">
              Quick Test Personas
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDemoCredentials("student1@mindguard.edu", "Student@123")}
                className="px-2 py-1.5 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-[11px] font-medium text-foreground transition-colors text-center"
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("counselor1@mindguard.edu", "Counselor@123")}
                className="px-2 py-1.5 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-[11px] font-medium text-foreground transition-colors text-center"
              >
                Counselor
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("admin@mindguard.edu", "Admin@123")}
                className="px-2 py-1.5 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-[11px] font-medium text-foreground transition-colors text-center"
              >
                Admin
              </button>
            </div>
          </div>

          {/* Link to Register at bottom */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Register here
            </Link>
          </p>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-muted-foreground">
          MindGuardAI • Encrypted & Protected by Institutional FERPA Policy
        </div>
      </div>
    </div>
  );
};

export default Login;
