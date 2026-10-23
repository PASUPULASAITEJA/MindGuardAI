import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  Brain,
  Mail,
  User,
  Lock,
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

  // Roster check
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
    <div className="min-h-screen w-full flex bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* LEFT PANEL: Branded Gradient Experience */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white p-12 flex-col justify-between overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-12 -right-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight text-white">MindGuardAI</span>
            <span className="block text-[11px] text-indigo-300 font-medium -mt-1 uppercase tracking-wider">
              Student Registration
            </span>
          </div>
        </div>

        <div className="relative z-10 my-auto max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/60 border border-indigo-700/60 text-xs font-semibold text-indigo-300 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Join 2,400+ Students</span>
          </div>
          <h2 className="text-3xl font-extrabold leading-tight text-white tracking-tight">
            "Prioritize your mental space before the academic semester catches up."
          </h2>
          <p className="mt-4 text-slate-300 text-sm leading-relaxed">
            Create your confidential student account to track wellness habits, access 24/7 AI cognitive support, and connect
            seamlessly with campus health resources.
          </p>

          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3 text-xs text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Full confidentiality — no academic records linked</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Personalized circadian sleep deficit recovery</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Immediate de-escalation & SOS crisis support</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-400 flex items-center justify-between">
          <span>Enterprise Campus Protection</span>
          <span>© {new Date().getFullYear()} MindGuardAI</span>
        </div>
      </div>

      {/* RIGHT PANEL: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 relative overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="max-w-md w-full mx-auto my-auto animate-fade-in">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Create an account
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              Enter your details to activate your campus wellness profile.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Account Role Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Account Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["STUDENT", "COUNSELOR", "ADMIN"] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setValue("role", r, { shouldValidate: true })}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      selectedRole === r
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                    }`}
                  >
                    {r === "STUDENT" ? "Student" : r === "COUNSELOR" ? "Counselor" : "Admin"}
                  </button>
                ))}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Full Name or Preferred Handle
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Aarav Sharma"
                  {...register("full_name")}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.full_name ? "border-rose-500" : "border-slate-300 dark:border-slate-800"
                  }`}
                />
              </div>
              {errors.full_name && (
                <p className="text-xs text-rose-500 font-medium mt-1">{errors.full_name.message}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Institutional Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  placeholder="your.name@nmims.edu"
                  {...register("email")}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.email ? "border-rose-500" : "border-slate-300 dark:border-slate-800"
                  }`}
                />
              </div>
              {rosterStatus.isAuthorized && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Institutional roster match verified ({rosterStatus.assignedRole})</span>
                </div>
              )}
              {errors.email ? (
                <p className="text-xs text-rose-500 font-medium mt-1">{errors.email.message}</p>
              ) : (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Continue with your university-issued email
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Create Secure Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 8 chars with letters & numbers"
                  {...register("password")}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-sm border bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.password ? "border-rose-500" : "border-slate-300 dark:border-slate-800"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-rose-500 font-medium mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating your account...</span>
                </>
              ) : (
                <span>Complete Registration</span>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Already registered on campus?{" "}
            <Link to="/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              Sign In Here
            </Link>
          </p>
        </div>

        <div className="mt-8 pt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Protected under Campus Student Privacy Charter</span>
        </div>
      </div>
    </div>
  );
};

export default Register;
