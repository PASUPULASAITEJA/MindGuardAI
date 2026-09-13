import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FormItem } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Eye, EyeOff, Loader2, Sparkles, ArrowLeft, ShieldCheck, HeartHandshake, Lock } from "lucide-react";
import ThemeToggle from "@/components/layouts/ThemeToggle";

// Form validation schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid university email address."),
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
        title: "Welcome back!",
        description: "Successfully authenticated to MindGuardAI.",
        variant: "success",
      });

      // Redirect depending on user role
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
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4 py-12 transition-colors duration-300">
      {/* Calm Ambient Lighting */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

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
          <p className="text-xs text-muted-foreground mt-1.5 font-medium">Campus Psychological Safety & Early Care</p>
        </div>

        {/* Auth Glass Card */}
        <Card className="border-border/80 bg-card/85 dark:bg-card/80 backdrop-blur-2xl shadow-xl shadow-black/5 dark:shadow-black/20 rounded-3xl">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold tracking-tight">Sign In</CardTitle>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" />
                256-Bit Encrypted
              </span>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Enter your university credentials to access your wellness dashboard
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {/* Email Address */}
              <FormItem>
                <Label htmlFor="email" className="text-xs font-semibold text-foreground">University Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@nmims.in"
                  className="h-11 rounded-xl border-border/80 bg-background/60 text-sm focus-visible:ring-primary focus-visible:ring-1"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive font-medium mt-1">{errors.email.message}</p>
                )}
              </FormItem>

              {/* Password */}
              <FormItem>
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-xs font-semibold text-foreground">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
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

              {/* Remember Me */}
              <div className="flex items-center gap-2 pt-0.5">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded-md border-border text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="remember-me" className="text-xs text-muted-foreground cursor-pointer select-none">
                  Keep me signed in on this device
                </label>
              </div>
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
                    Authenticating...
                  </>
                ) : (
                  "Sign In to Portal"
                )}
              </Button>

              {/* Calm Reassurance Banner */}
              <div className="w-full p-3 rounded-xl bg-muted/40 border border-border/60 text-[11px] text-muted-foreground flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-primary shrink-0" />
                <span>Your identity and reflections are private & never shared without explicit consent.</span>
              </div>

              <div className="text-xs text-center text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/register" className="text-primary hover:underline font-bold">
                  Create Student Account
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
