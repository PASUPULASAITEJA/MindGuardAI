import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FormItem } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, ArrowLeft, Mail, KeyRound, CheckCircle2 } from "lucide-react";
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
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 p-4 overflow-hidden">
      {/* Visual Excellence Backdrops */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="h-12 w-12 rounded-2xl border border-slate-800 overflow-hidden shadow-lg shadow-violet-500/10 mb-3 bg-slate-900 flex items-center justify-center">
            <img src="/favicon.jpg" alt="MindGuard Logo" className="h-full w-full object-cover" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            MindGuard
          </h1>
          <p className="text-sm text-slate-400 mt-1">Self-Service Account Recovery</p>
        </div>

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-md shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-violet-400" />
              Reset Password
            </CardTitle>
            <CardDescription className="text-slate-400">
              {isDone
                ? "Your credentials have been securely updated."
                : resetToken
                ? "Set a new secure password for your account."
                : "Enter your registered university email address."}
            </CardDescription>
          </CardHeader>

          {isDone ? (
            <CardContent className="space-y-4 py-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-950/60 border border-emerald-700/50 text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <p className="text-sm text-slate-300">
                Your password has been successfully updated. You can now log into your MindGuard portal.
              </p>
              <div className="pt-2">
                <Link to="/login">
                  <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white font-semibold">
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            </CardContent>
          ) : resetToken ? (
            <form onSubmit={handleResetPassword}>
              <CardContent className="space-y-4">
                <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Identity token verified for <strong>{email}</strong>. Enter your new password below.</span>
                </div>

                <FormItem>
                  <Label className="text-slate-300">New Password</Label>
                  <Input
                    type="password"
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="border-slate-800 bg-slate-950/50 text-white placeholder:text-slate-600 focus-visible:ring-violet-500"
                    required
                  />
                </FormItem>

                <FormItem>
                  <Label className="text-slate-300">Confirm New Password</Label>
                  <Input
                    type="password"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border-slate-800 bg-slate-950/50 text-white placeholder:text-slate-600 focus-visible:ring-violet-500"
                    required
                  />
                </FormItem>
              </CardContent>

              <CardFooter className="flex flex-col gap-3">
                <Button
                  type="submit"
                  disabled={isResetting || !newPassword}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white font-semibold"
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
                  <Label htmlFor="email" className="text-slate-300">University Email</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="student@nmims.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-slate-800 bg-slate-950/50 text-white placeholder:text-slate-600 pl-9 focus-visible:ring-violet-500"
                      required
                    />
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  </div>
                </FormItem>
              </CardContent>

              <CardFooter className="flex flex-col gap-3">
                <Button
                  type="submit"
                  disabled={isSubmitting || !email}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white shadow-md shadow-violet-600/10 font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying Account...
                    </>
                  ) : (
                    "Generate Recovery Token"
                  )}
                </Button>

                <div className="text-xs text-center text-slate-400 mt-2">
                  <Link
                    to="/login"
                    className="text-violet-400 hover:text-violet-300 font-semibold transition-colors inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign in
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
