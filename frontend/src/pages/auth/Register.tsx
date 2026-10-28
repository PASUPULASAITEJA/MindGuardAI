import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Eye,
  EyeOff,
  Loader2,
  Brain,
  BarChart3,
  HeartHandshake,
  PhoneCall,
  CheckCircle2,
} from "lucide-react";
import ThemeToggle from "@/components/layouts/ThemeToggle";
import api from "@/services/api";

const registerSchema = z
  .object({
    full_name: z.string().min(2, "Please enter your full name."),
    email: z.string().email("Please enter a valid university email address."),
    role: z.enum(["STUDENT", "COUNSELOR", "ADMIN"], {
      errorMap: () => ({ message: "Please select an account type." }),
    }),
    password: z.string().min(8, "Password must be at least 8 characters long."),
    confirm_password: z.string().min(1, "Please confirm your password."),
  })
  .superRefine((data, ctx) => {
    const email = data.email.toLowerCase().trim();
    const isAuthorized = email.includes("@") && email.includes(".");
    if (!isAuthorized) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["email"],
        message: "Please enter a valid institutional or university email address.",
      });
    }
    if (data.password !== data.confirm_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirm_password"],
        message: "Passwords do not match.",
      });
    }
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const { register: registerUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rosterStatus, setRosterStatus] = useState<{
    checked: boolean;
    isAuthorized: boolean;
    assignedRole: UserRole | null;
  }>({ checked: false, isAuthorized: false, assignedRole: null });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      full_name: "",
      email: "",
      role: "STUDENT",
      password: "",
      confirm_password: "",
    },
  });

  const typedEmail = watch("email");

  // Roster verification check
  useEffect(() => {
    const checkEmail = async () => {
      const email = (typedEmail || "").trim().toLowerCase();
      if (email.includes("@") && email.includes(".")) {
        try {
          const res = await api.get(`/auth/roster-info?email=${encodeURIComponent(email)}`);
          if (res.data?.is_authorized) {
            setRosterStatus({
              checked: true,
              isAuthorized: true,
              assignedRole: res.data.role,
            });
            if (res.data.role) {
              setValue("role", res.data.role);
            }
          } else {
            setRosterStatus({ checked: true, isAuthorized: false, assignedRole: null });
          }
        } catch {
          setRosterStatus({ checked: false, isAuthorized: false, assignedRole: null });
        }
      } else {
        setRosterStatus({ checked: false, isAuthorized: false, assignedRole: null });
      }
    };

    const timeout = setTimeout(checkEmail, 400);
    return () => clearTimeout(timeout);
  }, [typedEmail, setValue]);

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    try {
      await registerUser(data.email, data.password, data.role as UserRole, data.full_name);
      toast({
        title: "Account Created Successfully",
        description: `Welcome to MindGuardAI, ${data.full_name}!`,
        variant: "success",
      });
      navigate(
        data.role === "STUDENT"
          ? "/student/dashboard"
          : data.role === "COUNSELOR"
          ? "/counselor/dashboard"
          : "/admin/dashboard"
      );
    } catch (error: any) {
      const msg = error.response?.data?.detail?.message || "Registration failed. Please check details.";
      toast({
        title: "Registration Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground font-sans antialiased">
      {/* LEFT PANEL — hidden below lg, lg:flex, w-1/2 */}
      <div className="hidden lg:flex w-1/2 bg-primary flex-col justify-between p-12 text-white relative select-none">
        {/* TOP */}
        <div>
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-1 font-extrabold text-xl tracking-tight text-white">
              <span>MindGuard</span>
              <span className="text-white/90">AI</span>
            </div>
          </Link>

          {/* Headline & Body */}
          <div className="mt-14 max-w-md">
            <h2 className="text-3xl font-extrabold text-white leading-snug">
              Join thousands of students protecting their wellbeing.
            </h2>
            <p className="text-sm text-white/70 mt-3 max-w-xs leading-relaxed">
              Create your account and start tracking your wellness journey with clinical-grade AI support.
            </p>
          </div>

          {/* MIDDLE — 3 bullet points */}
          <div className="mt-10 space-y-5">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-white/10 p-2 w-9 h-9 flex items-center justify-center shrink-0">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm text-white/85 font-medium self-center">
                AI-powered emotion detection
              </span>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-white/10 p-2 w-9 h-9 flex items-center justify-center shrink-0">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm text-white/85 font-medium self-center">
                30-day wellness trend tracking
              </span>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-white/10 p-2 w-9 h-9 flex items-center justify-center shrink-0">
                <HeartHandshake className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm text-white/85 font-medium self-center">
                Connect with campus counsellors
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

      {/* RIGHT PANEL — flex-1, flex flex-col items-center justify-center min-h-screen bg-background px-8 py-10 */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-background px-6 sm:px-8 py-10 relative">
        {/* ThemeToggle absolute top-4 right-4 */}
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>

        {/* Mobile logo (lg:hidden) */}
        <Link to="/" className="lg:hidden flex items-center gap-2 mb-8 group">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm shadow-primary/25">
            <Brain className="w-5 h-5" />
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
              Create your account
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Start your wellbeing journey today
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name field */}
            <div className="space-y-1.5">
              <label
                htmlFor="full_name"
                className="text-xs font-semibold text-foreground block"
              >
                Full Name
              </label>
              <Input
                id="full_name"
                type="text"
                placeholder="Your full name"
                className="rounded-xl h-10 text-sm focus:ring-2 focus:ring-primary/30"
                {...register("full_name")}
              />
              {errors.full_name && (
                <p className="text-xs text-destructive font-medium">
                  {errors.full_name.message}
                </p>
              )}
            </div>

            {/* University Email field */}
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
              {rosterStatus.checked && rosterStatus.isAuthorized && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Verified Campus Roster ({rosterStatus.assignedRole})</span>
                </div>
              )}
              {errors.email && (
                <p className="text-xs text-destructive font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Role select dropdown */}
            <div className="space-y-1.5">
              <label
                htmlFor="role"
                className="text-xs font-semibold text-foreground block"
              >
                Account Role
              </label>
              <select
                id="role"
                className="w-full rounded-xl h-10 border border-input bg-background text-sm px-3 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground cursor-pointer"
                {...register("role")}
              >
                <option value="STUDENT">Student</option>
                <option value="COUNSELOR">Counsellor</option>
                <option value="ADMIN">Administrator</option>
              </select>
              {errors.role && (
                <p className="text-xs text-destructive font-medium">
                  {errors.role.message}
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
                  autoComplete="new-password"
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

            {/* Confirm Password field */}
            <div className="space-y-1.5">
              <label
                htmlFor="confirm_password"
                className="text-xs font-semibold text-foreground block"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="rounded-xl h-10 text-sm pr-10 focus:ring-2 focus:ring-primary/30"
                  {...register("confirm_password")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
              {errors.confirm_password && (
                <p className="text-xs text-destructive font-medium">
                  {errors.confirm_password.message}
                </p>
              )}
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {/* Bottom link */}
          <p className="text-xs text-muted-foreground text-center mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Sign in &rarr;
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
