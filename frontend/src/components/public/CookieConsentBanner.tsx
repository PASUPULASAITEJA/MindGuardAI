import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const CookieConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("mindguard_cookie_consent");
      if (!consent) {
        setIsVisible(true);
      }
    } catch {
      setIsVisible(false);
    }
  }, []);

  const handleConsent = (level: "all" | "essential") => {
    try {
      localStorage.setItem("mindguard_cookie_consent", JSON.stringify({
        level,
        timestamp: new Date().toISOString()
      }));
    } catch {}
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="p-4 sm:p-5 rounded-2xl bg-card/95 backdrop-blur-md border border-border/80 shadow-2xl space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Cookie className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Cookie & Privacy Consent</h4>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                Zero third-party advertising trackers
              </p>
            </div>
          </div>
          <button
            onClick={() => handleConsent("essential")}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          MindGuard AI uses essential local storage and session tokens strictly to keep your account authenticated and protect your digital phenotyping privacy. Read our{" "}
          <Link to="/privacy" className="text-primary underline font-medium hover:text-primary/80">
            Privacy Policy
          </Link>{" "}
          to learn more.
        </p>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleConsent("essential")}
            className="rounded-xl text-xs h-8 px-3 text-muted-foreground hover:text-foreground"
          >
            Essential Only
          </Button>
          <Button
            size="sm"
            onClick={() => handleConsent("all")}
            className="rounded-xl bg-primary text-primary-foreground text-xs font-semibold h-8 px-3.5 shadow-sm"
          >
            Accept All
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
