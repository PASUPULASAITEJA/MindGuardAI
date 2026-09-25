import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Eye, EyeOff, Loader2, ArrowLeft, ShieldCheck, Lock } from "lucide-react";
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
    formState: { errors, isValid },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    }
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      const loggedUser = await login(data.email, data.password, rememberMe);

      toast({
        title: "Authenticated",
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
        navigate("/login");
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      {/* Top Header Controls */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between max-w-5xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg border border-border bg-card"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center mb-6 text-center">
          <img
            src="/logo.png"
            alt="MindGuardAI Logo"
            className="h-16 w-16 rounded-2xl object-contain bg-white dark:bg-card border border-border p-1.5 shadow-sm mb-3"
          />
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Sign in to MindGuard<span className="text-primary">AI</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Campus Student Wellbeing & Early Support Platform
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">
                University Email or Username
              </label>
              <Input
                type="text"
                placeholder="student@university.edu"
                {...register("email")}
                className="text-xs h-9"
              />
              {errors.email && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-foreground block">
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
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  {...register("password")}
                  className="text-xs h-9 pr-8"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                />
                <span className="text-xs text-muted-foreground font-medium">Keep me signed in</span>
              </label>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="w-full text-xs font-semibold h-9"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="pt-4 border-t border-border mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Need an account?{" "}
              <Link to="/register" className="text-primary font-semibold hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </Card>

        {/* Security / Privacy guarantee */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Role-Guarded • End-to-End Encrypted Authentication</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
