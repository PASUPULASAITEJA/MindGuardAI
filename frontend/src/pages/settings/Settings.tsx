import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/components/ui/toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  User as UserIcon, Shield, Bell, Moon, Sun, Lock, CheckCircle, FileDown, ShieldAlert, AlertTriangle, Check, X
} from "lucide-react";
import { profileAPI, consentAPI, ConsentRecord } from "@/services/api";
import { ConsentBanner } from "@/components/ConsentBanner";
import { ConsentSettingsManager } from "@/components/ConsentSettingsManager";

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  // Profile fields state
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [counselorConsent, setCounselorConsent] = useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Consent Enforcement State
  const [consentData, setConsentData] = useState<ConsentRecord | null>(null);
  const [isLoadingConsent, setIsLoadingConsent] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);

  // Load existing profile and consent on mount
  React.useEffect(() => {
    if (user?.role === "STUDENT") {
      profileAPI.getStudentProfile().then((data) => {
        if (data) {
          setFullName(data.full_name || "");
          setPhoneNumber(data.phone_number || "");
          setDepartment(data.academic_department || "");
          setEmergencyName(data.emergency_contact_name || "");
          setEmergencyPhone(data.emergency_contact_phone || "");
          setCounselorConsent(data.consent_counselor_sharing ?? true);
        }
      }).catch(() => {});

      // Fetch official Consent Record
      consentAPI.getMyConsent().then((record) => {
        setConsentData(record);
      }).catch((err) => {
        console.error("Failed to load consent record:", err);
      });
    }
  }, [user]);

  const handleGrantConsent = async () => {
    setIsLoadingConsent(true);
    try {
      const res = await consentAPI.grantConsent();
      setConsentData(res.consent);
      toast({
        title: "Consent Granted",
        description: "Counselors are authorized to access your wellness insights and case timeline.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Action Failed",
        description: "Could not update consent status.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingConsent(false);
    }
  };

  const handleDeclineConsent = async () => {
    setIsLoadingConsent(true);
    try {
      const res = await consentAPI.declineConsent();
      setConsentData(res.consent);
      toast({
        title: "Consent Declined",
        description: "Counselors remain blocked from accessing your clinical insights.",
        variant: "warning",
      });
    } catch (err) {
      toast({
        title: "Action Failed",
        description: "Could not decline consent.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingConsent(false);
    }
  };

  const handleConfirmRevoke = async () => {
    setIsLoadingConsent(true);
    try {
      const res = await consentAPI.revokeConsent();
      setConsentData(res.consent);
      setShowRevokeModal(false);
      toast({
        title: "Consent Revoked",
        description: "Counselors are now blocked from viewing your clinical trends and case timeline.",
        variant: "warning",
      });
    } catch (err) {
      toast({
        title: "Action Failed",
        description: "Could not revoke consent.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingConsent(false);
    }
  };

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Notification states
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      await profileAPI.updateStudentProfile({
        full_name: fullName,
        phone_number: phoneNumber,
        academic_department: department,
        emergency_contact_name: emergencyName,
        emergency_contact_phone: emergencyPhone,
        consent_counselor_sharing: counselorConsent,
      });
      toast({
        title: "Profile Updated",
        description: "Your contact information and preferences were saved.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Update Failed",
        description: "Could not save your profile details.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleExportSummary = () => {
    window.print();
  };


  if (!user) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <p className="text-muted-foreground text-sm md:text-base">Please log in to view settings.</p>
      </div>
    );
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Please fill out all password fields.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Validation Error",
        description: "New passwords do not match.",
        variant: "destructive"
      });
      return;
    }

    setIsUpdatingPassword(true);
    // Simulate API delay
    setTimeout(() => {
      setIsUpdatingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Password Updated",
        description: "Your account password has been changed successfully.",
        variant: "success"
      });
    }, 1200);
  };

  const handleSaveNotifications = () => {
    toast({
      title: "Preferences Saved",
      description: "Your notification settings have been updated in your profile.",
      variant: "success"
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-foreground text-lg md:text-xl font-extrabold">Account Settings</h3>
        <p className="text-muted-foreground text-xs md:text-sm mt-1">Manage your preferences, security settings, and styling choices.</p>
      </div>

      {/* Top Banner when Consent is Pending */}
      {user.role === "STUDENT" && (
        <ConsentBanner onConsentChange={(newConsent) => setConsentData(newConsent)} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Account Details */}
        <div className="space-y-6 md:col-span-1">
          <Card className="border-border/70 bg-card/50 backdrop-blur-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-foreground text-sm md:text-base font-bold flex items-center gap-2">
                <UserIcon className="h-4.5 w-4.5 text-primary" />
                Profile Info
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">Your registered account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-extrabold text-lg">
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{user.email}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">{user.role}</p>
                </div>
              </div>

              <div className="border-t border-border/70 pt-4 space-y-2.5 text-xs md:text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User ID</span>
                  <span className="font-mono text-xs text-foreground">{user.id.substring(0, 18)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="text-emerald-500 font-bold flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> Active
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Theme Selector */}
          <Card className="border-border/70 bg-card/50 backdrop-blur-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-foreground text-sm md:text-base font-bold flex items-center gap-2">
                {theme === "dark" ? (
                  <Moon className="h-4.5 w-4.5 text-primary" />
                ) : (
                  <Sun className="h-4.5 w-4.5 text-primary" />
                )}
                Appearance
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">Select your dashboard theme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs md:text-sm font-bold transition-all duration-200 ${
                    theme === "light"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border/70 text-muted-foreground hover:bg-accent/40"
                  }`}
                >
                  <Sun className="h-4 w-4" />
                  Light
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs md:text-sm font-bold transition-all duration-200 ${
                    theme === "dark"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border/70 text-muted-foreground hover:bg-accent/40"
                  }`}
                >
                  <Moon className="h-4 w-4" />
                  Dark
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Forms */}
        <div className="space-y-6 md:col-span-2">

          {/* Student Profile & Counselor Sharing Preferences */}
          {user.role === "STUDENT" && (
            <Card className="border-border/70 bg-card/50 backdrop-blur-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground text-sm md:text-base font-bold flex items-center gap-2">
                      <UserIcon className="h-4.5 w-4.5 text-primary" />
                      Student Profile & Wellness Sharing
                    </CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      Configure your contact details and counselor privacy preferences
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    onClick={handleExportSummary}
                    variant="outline"
                    size="sm"
                    className="border-primary/40 text-primary hover:bg-primary/10 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <FileDown className="h-4 w-4" />
                    Export PDF Summary
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="full-name">Full Name</Label>
                      <Input
                        id="full-name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Alex Sharma"
                        className="h-10 text-xs md:text-sm bg-background/50 border-border/70"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone-number">Phone Number</Label>
                      <Input
                        id="phone-number"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="h-10 text-xs md:text-sm bg-background/50 border-border/70"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="dept">Academic Department / Major</Label>
                      <Input
                        id="dept"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. Computer Science, 3rd Year"
                        className="h-10 text-xs md:text-sm bg-background/50 border-border/70"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="emergency-name">Emergency Contact Name</Label>
                      <Input
                        id="emergency-name"
                        value={emergencyName}
                        onChange={(e) => setEmergencyName(e.target.value)}
                        placeholder="Parent / Guardian / Hosteller"
                        className="h-10 text-xs md:text-sm bg-background/50 border-border/70"
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="emergency-phone">Emergency Contact Phone</Label>
                      <Input
                        id="emergency-phone"
                        value={emergencyPhone}
                        onChange={(e) => setEmergencyPhone(e.target.value)}
                        placeholder="Emergency contact telephone number"
                        className="h-10 text-xs md:text-sm bg-background/50 border-border/70"
                      />
                    </div>
                  </div>

                  {/* Privacy & Sharing Checkbox */}
                  <div className="p-3.5 rounded-xl border border-border/70 bg-accent/20 flex items-start gap-3 mt-2">
                    <input
                      type="checkbox"
                      id="counselor-sharing"
                      checked={counselorConsent}
                      onChange={(e) => setCounselorConsent(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary"
                    />
                    <label htmlFor="counselor-sharing" className="text-xs leading-relaxed text-foreground cursor-pointer select-none">
                      <span className="font-bold block">Share Behavioral Indicators With Campus Counselor</span>
                      Allow your designated university clinical counselor to review automated screen time and sleep disruption markers if high-stress anomalies are detected.
                    </label>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs md:text-sm h-10 px-5 rounded-xl transition-all"
                    >
                      {isUpdatingProfile ? "Saving Profile..." : "Save Profile Details"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Feature 1: Granular 4-Surface Consent & Privacy Controls (Student Only) */}
          {user.role === "STUDENT" && <ConsentSettingsManager />}

          {/* Clinical Consent & Privacy Enforcement Card (Student Only) */}
          {user.role === "STUDENT" && (
            <Card className="border-border/70 bg-card/50 backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground text-sm md:text-base font-bold flex items-center gap-2">
                    <Shield className="h-4.5 w-4.5 text-primary" />
                    Clinical Consent & Counselor Access
                  </CardTitle>
                  {consentData && (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                      consentData.status === "GRANTED"
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : consentData.status === "PENDING"
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                        : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        consentData.status === "GRANTED"
                          ? "bg-emerald-500 animate-pulse"
                          : consentData.status === "PENDING"
                          ? "bg-amber-500 animate-bounce"
                          : "bg-rose-500"
                      }`} />
                      {consentData.status === "GRANTED"
                        ? "Access Granted"
                        : consentData.status === "PENDING"
                        ? "Pending (Action Required)"
                        : "Access Revoked"}
                    </span>
                  )}
                </div>
                <CardDescription className="text-xs md:text-sm">
                  Govern your personal wellness data permissions. Enforced by backend privacy-by-design access controls.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl border border-border/70 bg-accent/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1 pr-4">
                    <p className="text-xs md:text-sm font-bold text-foreground">
                      Share Wellness Insights with Counselor
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Allow certified university counselors to view your wellness assessments, emotional mapping, and longitudinal case timeline. When turned off or pending, counselor access is strictly blocked (HTTP 403).
                    </p>
                    {consentData && (
                      <p className="text-[11px] text-muted-foreground/80 font-mono mt-1">
                        Last updated: {new Date(consentData.revoked_at || consentData.granted_at || consentData.created_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    {consentData?.status === "PENDING" ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isLoadingConsent}
                          onClick={handleDeclineConsent}
                          className="h-8 text-xs px-3 border-border hover:bg-rose-500/10 hover:text-rose-600 gap-1"
                        >
                          <X className="h-3.5 w-3.5" />
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          disabled={isLoadingConsent}
                          onClick={handleGrantConsent}
                          className="h-8 text-xs px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Grant Access
                        </Button>
                      </div>
                    ) : consentData?.status === "GRANTED" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isLoadingConsent}
                        onClick={() => setShowRevokeModal(true)}
                        className="h-8 text-xs px-3 border-rose-500/30 text-rose-600 hover:bg-rose-500/10 gap-1.5"
                      >
                        <Lock className="h-3.5 w-3.5" />
                        Revoke Access
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={isLoadingConsent}
                        onClick={handleGrantConsent}
                        className="h-8 text-xs px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Grant Access
                      </Button>
                    )}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-primary" />
                  <span>Student confidentiality is legally protected under institutional wellness guidelines.</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Revoke Consent Warning Modal */}
          {showRevokeModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-card border border-border/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="w-12 h-12 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">Revoke Counselor Access?</h3>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                    Your counselor will not be able to view your trend reports or case timeline.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-600 dark:text-rose-300">
                  ⚠️ Any counselor attempting to open your casefile or view your mood logs will be denied access with HTTP 403 Forbidden until you grant permission again.
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowRevokeModal(false)}
                    disabled={isLoadingConsent}
                    className="h-9 text-xs px-4 rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmRevoke}
                    disabled={isLoadingConsent}
                    className="h-9 text-xs px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium"
                  >
                    {isLoadingConsent ? "Revoking..." : "Revoke Access"}
                  </Button>
                </div>
              </div>
            </div>
          )}


          {/* Change Password Card */}
          <Card className="border-border/70 bg-card/50 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-foreground text-sm md:text-base font-bold flex items-center gap-2">
                <Lock className="h-4.5 w-4.5 text-primary" />
                Security Settings
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">Change your account password safely</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-10 text-xs md:text-sm bg-background/50 border-border/70"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-10 text-xs md:text-sm bg-background/50 border-border/70"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-10 text-xs md:text-sm bg-background/50 border-border/70"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs md:text-sm h-10 px-5 rounded-xl transition-all duration-300"
                  >
                    {isUpdatingPassword ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Notifications Card */}
          <Card className="border-border/70 bg-card/50 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-foreground text-sm md:text-base font-bold flex items-center gap-2">
                <Bell className="h-4.5 w-4.5 text-primary" />
                Notification Preferences
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">Select how you want to receive early warning alerts and updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
                  <div>
                    <p className="text-xs md:text-sm font-bold text-foreground">Critical Warning Alerts</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Receive immediate notifications for high-risk assessments.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-border/70 text-primary focus:ring-primary accent-primary"
                  />
                </div>

                <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
                  <div>
                    <p className="text-xs md:text-sm font-bold text-foreground">Weekly Aggregate Digests</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Receive a weekly clinical summary of mental wellness score trends.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={weeklyDigest}
                    onChange={(e) => setWeeklyDigest(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-border/70 text-primary focus:ring-primary accent-primary"
                  />
                </div>

                <div className="flex items-center justify-between pb-1">
                  <div>
                    <p className="text-xs md:text-sm font-bold text-foreground">In-App Live Toast Feed</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Show popup banners inside the dashboard for instant status changes.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={pushAlerts}
                    onChange={(e) => setPushAlerts(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-border/70 text-primary focus:ring-primary accent-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSaveNotifications}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs md:text-sm h-10 px-5 rounded-xl transition-all duration-300"
                >
                  Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
};

export default Settings;
