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
  Shield,
  Heart,
  PhoneCall,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import ThemeToggle from "@/components/layouts/ThemeToggle";
import api from "@/services/api";

const registerSchema = z
  .object({
    full_name: z.string().min(2, "Please enter your full name or preferred username."),
    email: z.string().email("Please enter a valid university email address."),
    password: z.string().min(8, "Password must be at least 8 characters long."),
    role: z.enum(["STUDENT", "COUNSELOR", "ADMIN"], {
      errorMap: () => ({ message: "Please select an account type." }),
    }),
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
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const { register: registerUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
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
      password: "",
      role: "STUDENT",
    },
  });

  const selectedRole = watch("role");
  const typedEmail = watch("email");
  const typedName = watch("full_name");
  const typedPassword = watch("password");

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
    <div className="min-h-screen w-full flex bg-background text-foreground font-sans antialiased transition-colors duration-200">
      {/* LEFT PANEL (hidden on mobile, w-1/2, bg-primary text-primary-foreground) */}
      <div className="hidden md:flex md:w-1/2 relative bg-gradient-to-b from-primary to-primary/80 text-primary-foreground p-10 lg:p-14 flex-col justify-between overflow-hidden shadow-2xl">
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
        {/* Top bar with ThemeToggle in top-right corner */}
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
              Create your account
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Sign in with your university email
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name with floating label */}
            <div className="relative">
              <label
                htmlFor="full_name"
                className={`text-xs font-medium transition-all ${
                  typedName ? "text-primary font-semibold" : "text-muted-foreground"
                } block mb-1`}
              >
                Full Name or Preferred Name
              </label>
              <Input
                id="full_name"
                type="text"
                placeholder="Jane Doe"
                className={`h-11 rounded-lg ${errors.full_name ? "border-destructive focus-visible:ring-destructive" : ""}`}
                {...register("full_name")}
              />
              {errors.full_name && (
                <p className="text-[11px] text-destructive mt-1 font-medium">
                  {errors.full_name.message}
                </p>
              )}
            </div>

            {/* University Email with floating label */}
            <div className="relative">
              <label
                htmlFor="email"
                className={`text-xs font-medium transition-all ${
                  typedEmail ? "text-primary font-semibold" : "text-muted-foreground"
                } block mb-1`}
              >
                Institutional Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="student@campus.edu"
                className={`h-11 rounded-lg ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                {...register("email")}
              />
              {rosterStatus.checked && rosterStatus.isAuthorized && (
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Authorized Campus Roster Member ({rosterStatus.assignedRole})</span>
                </div>
              )}
              {errors.email && (
                <p className="text-[11px] text-destructive mt-1 font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Account Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["STUDENT", "COUNSELOR", "ADMIN"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setValue("role", r, { shouldValidate: true })}
                    className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all text-center ${
                      selectedRole === r
                        ? "border-primary bg-primary text-primary-foreground shadow-xs"
                        : "border-border bg-secondary/50 text-foreground hover:bg-secondary"
                    }`}
                  >
                    {r === "STUDENT" ? "Student" : r === "COUNSELOR" ? "Counselor" : "Admin"}
                  </button>
                ))}
              </div>
            </div>

            {/* Password with floating label + Show/Hide Toggle */}
            <div className="relative">
              <label
                htmlFor="password"
                className={`text-xs font-medium transition-all ${
                  typedPassword ? "text-primary font-semibold" : "text-muted-foreground"
                } block mb-1`}
              >
                Password (min. 8 characters)
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
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

            {/* Submit Button full width, bg-primary */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-lg shadow-sm transition-all mt-2"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </span>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {/* Link to Login at bottom */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign in here
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

export default Register;
