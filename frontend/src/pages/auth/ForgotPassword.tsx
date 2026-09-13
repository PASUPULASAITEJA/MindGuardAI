import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FormItem } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, ArrowLeft, Mail, KeyRound, CheckCircle2, ShieldCheck } from "lucide-react";
import ThemeToggle from "@/components/layouts/ThemeToggle";
import api from "@/services/api";

export const ForgotPassword: React.FC = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  // New password state when token is present
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      if (res.data?.reset_token) {
        setResetToken(res.data.reset_token);
        toast({
          title: "Verification Generated",
          description: "A secure password reset token has been authorized.",
          variant: "success",
        });
      } else {
        toast({
          title: "Request Sent",
          description: res.data.message || "Please check your registered university inbox.",
          variant: "default",
        });
      }
    } catch (err: any) {
      toast({
        title: "Request Failed",
        description: err.response?.data?.message || "Unable to process password reset request.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    setIsResetting(true);
    try {
      await api.post("/auth/reset-password", {
        token: resetToken,
        new_password: newPassword,
      });
      setIsDone(true);
      toast({
        title: "Password Reset Successfully!",
        description: "You may now sign in with your new password.",
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Reset Failed",
        description: err.response?.data?.detail?.message || "Invalid or expired token.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4 py-12 transition-colors duration-200">
      {/* Top Controls */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10 max-w-5xl mx-auto">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-xl border border-border/80 bg-card/80 backdrop-blur-md group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Sign In</span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md z-10 pt-4">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-7 text-center">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-primary to-emerald-500 p-0.5 shadow-xl shadow-primary/15 mb-3.5 flex items-center justify-center">
            <div className="w-full h-full rounded-[14px] bg-card overflow-hidden flex items-center justify-center">
              <img src="/favicon.jpg" alt="MindGuardAI Logo" className="h-full w-full object-cover" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            MindGuard<span className="text-primary">AI</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1.5 font-medium">Self-Service Account Recovery</p>
        </div>

        <Card className="border-border/80 bg-card/95 dark:bg-card/90 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/20 rounded-3xl">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                Reset Password
              </CardTitle>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" />
                Secure
              </span>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              {isDone
                ? "Your credentials have been securely updated."
                : resetToken
                ? "Set a new secure password for your account."
                : "Enter your registered university email or username."}
            </CardDescription>
          </CardHeader>

          {isDone ? (
            <CardContent className="space-y-4 py-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Your password has been successfully updated. You can now log into your MindGuardAI portal.
              </p>
              <div className="pt-2">
                <Link to="/login">
                  <Button className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md shadow-primary/20">
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            </CardContent>
          ) : resetToken ? (
            <form onSubmit={handleResetPassword}>
              <CardContent className="space-y-4">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>Identity token verified for <strong>{email}</strong>. Enter your new password below.</span>
                </div>

                <FormItem>
                  <Label className="text-xs font-semibold text-foreground">New Password</Label>
                  <Input
                    type="password"
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-11 rounded-xl border-border/80 bg-background/60 text-sm focus-visible:ring-primary focus-visible:ring-1"
                    required
                  />
                </FormItem>

                <FormItem>
                  <Label className="text-xs font-semibold text-foreground">Confirm New Password</Label>
                  <Input
                    type="password"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 rounded-xl border-border/80 bg-background/60 text-sm focus-visible:ring-primary focus-visible:ring-1"
                    required
                  />
                </FormItem>
              </CardContent>

              <CardFooter className="flex flex-col gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={isResetting || !newPassword}
                  className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md shadow-primary/20"
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    "Save New Password"
                  )}
                </Button>
              </CardFooter>
            </form>
          ) : (
            <form onSubmit={handleRequestToken}>
              <CardContent className="space-y-4">
                <FormItem>
                  <Label htmlFor="email" className="text-xs font-semibold text-foreground">Institutional Email</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="e.g. your.name@nmims.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 rounded-xl border-border/80 bg-background/60 text-sm pl-9 focus-visible:ring-primary focus-visible:ring-1"
                      required
                    />
                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  </div>
                </FormItem>
              </CardContent>

              <CardFooter className="flex flex-col gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting || !email}
                  className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md shadow-primary/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Authorizing Reset...
                    </>
                  ) : (
                    "Send Reset Verification"
                  )}
                </Button>

                <div className="text-xs text-center text-muted-foreground mt-2">
                  Remember your password?{" "}
                  <Link to="/login" className="text-primary hover:underline font-bold">
                    Sign In
                  </Link>
                </div>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
