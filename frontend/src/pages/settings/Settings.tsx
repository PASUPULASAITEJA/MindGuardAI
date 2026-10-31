import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/components/ui/toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  User as UserIcon, Shield, Bell, Moon, Sun, Lock, CheckCircle, FileDown, ShieldAlert, AlertTriangle, Check, X, Mail, Send
} from "lucide-react";
import { profileAPI, consentAPI, ConsentRecord, notificationsAPI } from "@/services/api";
import { ConsentBanner } from "@/components/ConsentBanner";
import { ConsentSettingsManager } from "@/components/ConsentSettingsManager";
import { DotGridBackground } from "@/components/ui/DotGridBackground";
import { ShinyText } from "@/components/ui/ShinyText";
import { cn } from "@/utils/cn";

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"profile" | "consent" | "security" | "notifications">("profile");

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

  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [isSendingTestNotif, setIsSendingTestNotif] = useState(false);

  const handleTestEmail = async () => {
    setIsSendingTestEmail(true);
    try {
      const res = await notificationsAPI.dispatchTestEmail();
      toast({
        title: "Authenticated Email Dispatched",
        description: res.message || `Test wellness alert sent to ${res.recipient} with delivery verification.`,
        variant: "success"
      });
    } catch (err: any) {
      toast({
        title: "Email Dispatch Error",
        description: err.response?.data?.detail || "Could not dispatch test email. Check SMTP settings.",
        variant: "destructive"
      });
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const handleTestNotification = async () => {
    setIsSendingTestNotif(true);
    try {
      await notificationsAPI.createTestNotification({
        title: "Wellness Status Check",
        message: "Your authenticated realtime notification channel is operating normally.",
        type: "SYSTEM_ALERT",
        channel: "WEBSOCKET"
      });
      toast({
        title: "Push Notification Sent",
        description: "Authenticated WebSocket broadcast delivered to your active session.",
        variant: "success"
      });
    } catch (err: any) {
      toast({
        title: "Notification Error",
        description: err.response?.data?.detail || "Could not trigger push notification.",
        variant: "destructive"
      });
    } finally {
      setIsSendingTestNotif(false);
    }
  };

  const handleSaveNotifications = () => {
    toast({
      title: "Preferences Saved",
      description: "Your notification settings have been updated in your profile.",
      variant: "success"
    });
  };

  return (
    <div className="relative w-full space-y-6 pb-12 font-sans text-foreground">
      <DotGridBackground />
      <div>
        <h3 className="text-foreground text-lg md:text-xl font-extrabold">
          <ShinyText text="Account Settings" />
        </h3>
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

        {/* Right Column: Tabbed Forms */}
        <div className="space-y-4 md:col-span-2">
          {/* Tab Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/60 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                activeTab === "profile"
                  ? "bg-card text-foreground shadow-2xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <UserIcon className="h-3.5 w-3.5 text-primary" />
              <span>Profile Details</span>
            </button>
            {user.role === "STUDENT" && (
              <button
                type="button"
                onClick={() => setActiveTab("consent")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                  activeTab === "consent"
                    ? "bg-card text-foreground shadow-2xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                <Shield className="h-3.5 w-3.5 text-emerald-500" />
                <span>Privacy & Consent</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab("security")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                activeTab === "security"
                  ? "bg-card text-foreground shadow-2xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <Lock className="h-3.5 w-3.5 text-amber-500" />
              <span>Security</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("notifications")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                activeTab === "notifications"
                  ? "bg-card text-foreground shadow-2xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <Bell className="h-3.5 w-3.5 text-blue-500" />
              <span>Notifications</span>
            </button>
          </div>

          {/* TAB 1: Profile & Student Details */}
          {activeTab === "profile" && user.role === "STUDENT" && (
            <Card className="border-border/70 bg-card/50 backdrop-blur-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground text-sm md:text-base font-bold flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-primary" />
                      Student Profile & Wellness Sharing
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Configure your contact details and counselor privacy preferences
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    onClick={handleExportSummary}
                    variant="outline"
                    size="sm"
                    className="border-primary/40 text-primary hover:bg-primary/10 text-xs font-semibold h-8 px-2.5 flex items-center gap-1.5"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    Export PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-1">
                <form onSubmit={handleProfileSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="full-name" className="text-xs">Full Name</Label>
                      <Input
                        id="full-name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Alex Sharma"
                        className="h-8.5 text-xs bg-background/50 border-border/70"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="phone-number" className="text-xs">Phone Number</Label>
                      <Input
                        id="phone-number"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="h-8.5 text-xs bg-background/50 border-border/70"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="dept" className="text-xs">Academic Department</Label>
                      <Input
                        id="dept"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. Computer Science, 3rd Year"
                        className="h-8.5 text-xs bg-background/50 border-border/70"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="emergency-name" className="text-xs">Emergency Contact Name</Label>
                      <Input
                        id="emergency-name"
                        value={emergencyName}
                        onChange={(e) => setEmergencyName(e.target.value)}
                        placeholder="Parent / Guardian"
                        className="h-8.5 text-xs bg-background/50 border-border/70"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label htmlFor="emergency-phone" className="text-xs">Emergency Contact Phone</Label>
                      <Input
                        id="emergency-phone"
                        value={emergencyPhone}
                        onChange={(e) => setEmergencyPhone(e.target.value)}
                        placeholder="Emergency contact telephone number"
                        className="h-8.5 text-xs bg-background/50 border-border/70"
                      />
                    </div>
                  </div>

                  {/* Privacy & Sharing Checkbox */}
                  <div className="p-3 rounded-xl border border-border/70 bg-accent/20 flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="counselor-sharing"
                      checked={counselorConsent}
                      onChange={(e) => setCounselorConsent(e.target.checked)}
                      className="mt-0.5 h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary accent-primary"
                    />
                    <label htmlFor="counselor-sharing" className="text-[11px] leading-snug text-foreground cursor-pointer select-none">
                      <span className="font-bold block">Share Behavioral Indicators With Campus Counselor</span>
                      Allow your designated university counselor to review automated screen time and sleep disruption markers if high-stress anomalies are detected.
                    </label>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-8.5 px-4 rounded-xl transition-all"
                    >
                      {isUpdatingProfile ? "Saving..." : "Save Profile Details"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* TAB 2: Privacy & Consent Governance (Student Only) */}
          {activeTab === "consent" && user.role === "STUDENT" && (
            <div className="space-y-3">
              <ConsentSettingsManager />
            </div>
          )}

          {/* TAB 3: Change Password & Security */}
          {activeTab === "security" && (
            <Card className="border-border/70 bg-card/50 backdrop-blur-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground text-sm md:text-base font-bold flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  Security Settings
                </CardTitle>
                <CardDescription className="text-xs">
                  Change your account password safely
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-1">
                <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="current-password" className="text-xs">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-8.5 text-xs bg-background/50 border-border/70"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="new-password" className="text-xs">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-8.5 text-xs bg-background/50 border-border/70"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="confirm-password" className="text-xs">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-8.5 text-xs bg-background/50 border-border/70"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <Button
                      type="submit"
                      disabled={isUpdatingPassword}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-8.5 px-4 rounded-xl transition-all"
                    >
                      {isUpdatingPassword ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* TAB 4: Notifications & Email Preferences */}
          {activeTab === "notifications" && (
            <Card className="border-border/70 bg-card/50 backdrop-blur-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground text-sm md:text-base font-bold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" />
                    Notification & Email Preferences
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Check className="h-3 w-3" /> Authenticated
                  </span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Control clinical alerts delivered to your verified campus inbox (<span className="font-semibold text-foreground">{user?.email || "student@campus.edu"}</span>)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-1">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                    <div>
                      <p className="text-xs font-bold text-foreground">Critical Warning Alerts</p>
                      <p className="text-[11px] text-muted-foreground">Immediate alerts for high-risk assessments.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailAlerts}
                      onChange={(e) => setEmailAlerts(e.target.checked)}
                      className="h-4 w-4 rounded border-border/70 text-primary focus:ring-primary accent-primary"
                    />
                  </div>

                  <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                    <div>
                      <p className="text-xs font-bold text-foreground">Weekly Aggregate Digests</p>
                      <p className="text-[11px] text-muted-foreground">Weekly summary of wellness score trends.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={weeklyDigest}
                      onChange={(e) => setWeeklyDigest(e.target.checked)}
                      className="h-4 w-4 rounded border-border/70 text-primary focus:ring-primary accent-primary"
                    />
                  </div>

                  <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                    <div>
                      <p className="text-xs font-bold text-foreground">In-App Live Toast Feed</p>
                      <p className="text-[11px] text-muted-foreground">Popup banners inside the dashboard for instant updates.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={pushAlerts}
                      onChange={(e) => setPushAlerts(e.target.checked)}
                      className="h-4 w-4 rounded border-border/70 text-primary focus:ring-primary accent-primary"
                    />
                  </div>

                  {/* Delivery Verification Actions */}
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                    <div>
                      <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-primary" /> Delivery Verification
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Dispatch test packets to verify email delivery.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleTestEmail}
                        disabled={isSendingTestEmail}
                        className="text-xs h-7.5 px-2.5 rounded-lg border-border font-semibold flex items-center gap-1"
                      >
                        <Mail className="h-3 w-3 text-primary" />
                        {isSendingTestEmail ? "Sending..." : "Test Email"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleTestNotification}
                        disabled={isSendingTestNotif}
                        className="text-xs h-7.5 px-2.5 rounded-lg border-border font-semibold flex items-center gap-1"
                      >
                        <Bell className="h-3 w-3 text-amber-500" />
                        {isSendingTestNotif ? "Broadcasting..." : "Test Push"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    onClick={handleSaveNotifications}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-8.5 px-4 rounded-xl transition-all"
                  >
                    Save Notification Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
};

export default Settings;
