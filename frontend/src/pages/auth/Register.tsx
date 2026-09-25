import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FormItem } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Eye, EyeOff, Loader2, Sparkles, CheckCircle2, ArrowLeft, ShieldCheck, Lock } from "lucide-react";
import ThemeToggle from "@/components/layouts/ThemeToggle";
import api from "@/services/api";

// Registration validation schema
const registerSchema = z
  .object({
    full_name: z.string().min(2, "Please enter your full name or username."),
    email: z.string().email("Please enter a valid university email address."),
    password: z.string().min(8, "Password must be at least 8 characters long."),
    role: z.enum(["STUDENT", "COUNSELOR", "ADMIN"], {
      errorMap: () => ({ message: "Please select an account type." })
    })
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
    formState: { errors, isValid }
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      role: "STUDENT"
    }
  });

  const selectedRole = watch("role");
  const typedEmail = watch("email");

  // Check roster when email changes
  React.useEffect(() => {
    const checkEmail = async () => {
      const email = (typedEmail || "").trim().toLowerCase();
      if (email.includes("@") && email.includes(".")) {
        try {
          const res = await api.get(`/auth/roster-info?email=${encodeURIComponent(email)}`);
          if (res.data?.is_authorized) {
            setRosterStatus({
              checked: true,
              isAuthorized: true,
              assignedRole: res.data.assigned_role as UserRole
            });
            if (res.data.assigned_role) {
              setValue("role", res.data.assigned_role as UserRole, { shouldValidate: true });
            }
            return;
          }
        } catch (e) {
          // Ignored
        }
      }
      setRosterStatus({ checked: false, isAuthorized: false, assignedRole: null });
    };

    const timer = setTimeout(checkEmail, 300);
    return () => clearTimeout(timer);
  }, [typedEmail, setValue]);

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    try {
      await registerUser(data.email, data.password, data.role, data.full_name);
      toast({
        title: "Account Created!",
        description: `Welcome, ${data.full_name}! Registration completed successfully. You can now log in.`,
        variant: "success"
      });
      navigate("/login");
    } catch (error: any) {
      const apiError = error.response?.data?.detail || {};
      toast({
        title: "Registration Failed",
        description: apiError.message || "Failed to create account. Please ensure your email is on the institutional roster.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4 py-12 transition-colors duration-300">
      {/* Calm Ambient Lighting */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Controls */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10 max-w-5xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-xl border border-border/60 bg-card/60 backdrop-blur-md group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Home</span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md z-10 pt-4">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-7 text-center">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-emerald-400 p-0.5 shadow-xl shadow-indigo-500/15 mb-3.5 flex items-center justify-center">
            <div className="w-full h-full rounded-[14px] bg-card overflow-hidden flex items-center justify-center">
              <img src="/favicon.jpg" alt="MindGuardAI Logo" className="h-full w-full object-cover" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            MindGuard<span className="text-primary">AI</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1.5 font-medium">Join the University Wellness Network</p>
        </div>

        {/* Auth Glass Card */}
        <Card className="border-border/80 bg-card/85 dark:bg-card/80 backdrop-blur-2xl shadow-xl shadow-black/5 dark:shadow-black/20 rounded-3xl">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold tracking-tight">Create Account</CardTitle>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" />
                Verified Campus
              </span>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Register using your authorized institutional email
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {/* Account Type Selector */}
              <FormItem>
                <Label className="text-xs font-semibold text-foreground">Account Type</Label>
                <div className="grid grid-cols-3 gap-1.5 bg-muted/50 p-1 rounded-xl border border-border/60">
                  {(["STUDENT", "COUNSELOR", "ADMIN"] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setValue("role", r, { shouldValidate: true })}
                      className={`py-2 px-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                        selectedRole === r
                          ? "bg-primary text-primary-foreground shadow-sm font-bold"
                          : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                {errors.role && (
                  <p className="text-xs text-destructive font-medium mt-1">{errors.role.message}</p>
                )}
              </FormItem>

              {/* Full Name / Username */}
              <FormItem>
                <Label htmlFor="full_name" className="text-xs font-semibold text-foreground">Full Name or Username</Label>
                <Input
                  id="full_name"
                  type="text"
                  autoComplete="name"
                  placeholder="e.g. Alex Sharma or alex37"
                  className="h-11 rounded-xl border-border/80 bg-background/60 text-sm focus-visible:ring-primary focus-visible:ring-1"
                  {...register("full_name")}
                />
                {errors.full_name && (
                  <p className="text-xs text-destructive font-medium mt-1">{errors.full_name.message}</p>
                )}
              </FormItem>

              {/* Email Address */}
              <FormItem>
                <div className="flex justify-between items-center">
                  <Label htmlFor="email" className="text-xs font-semibold text-foreground">Institutional Email</Label>
                  <span className="text-[10px] text-primary font-medium">
                    {selectedRole === "STUDENT" ? "Student Domain" : "Staff Domain"}
                  </span>
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder={
                    selectedRole === "STUDENT"
                      ? "student.name@university.edu"
                      : selectedRole === "COUNSELOR"
                      ? "counselor.name@university.edu"
                      : "admin.name@university.edu"
                  }
                  className="h-11 rounded-xl border-border/80 bg-background/60 text-sm focus-visible:ring-primary focus-visible:ring-1"
                  {...register("email")}
                />
                {rosterStatus.isAuthorized && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-1.5 px-3 rounded-xl mt-1.5 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span>Authorized Institutional Roster — Assigned: <strong>{rosterStatus.assignedRole}</strong></span>
                  </div>
                )}
                {errors.email && (
                  <p className="text-xs text-destructive font-medium mt-1">{errors.email.message}</p>
                )}
              </FormItem>

              {/* Password */}
              <FormItem>
                <Label htmlFor="password" className="text-xs font-semibold text-foreground">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    className="h-11 rounded-xl border-border/80 bg-background/60 text-sm pr-10 focus-visible:ring-primary focus-visible:ring-1"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive font-medium mt-1">{errors.password.message}</p>
                )}
              </FormItem>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button
                type="submit"
                disabled={isSubmitting || !isValid}
                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md shadow-primary/20 transition-all active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Profile...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              <div className="w-full p-3 rounded-xl bg-muted/40 border border-border/60 text-[11px] text-muted-foreground flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-primary shrink-0" />
                <span>Protected by end-to-end data encryption and strict campus privacy charters.</span>
              </div>

              <div className="text-xs text-center text-muted-foreground">
                Already registered?{" "}
                <Link to="/login" className="text-primary hover:underline font-bold">
                  Sign In
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;
