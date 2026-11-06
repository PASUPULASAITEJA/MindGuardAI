import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, Compass, ArrowLeft, ShieldAlert, LifeBuoy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DotGridBackground } from "@/components/ui/DotGridBackground";

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-background text-foreground flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <DotGridBackground />

      <Card className="max-w-lg w-full rounded-3xl border-border/60 bg-card/70 backdrop-blur-md shadow-xl text-center overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        <CardContent className="p-8 sm:p-10 space-y-6">
          {/* Header Icon */}
          <div className="relative mx-auto w-20 h-20 rounded-3xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
            <Compass className="w-10 h-10 animate-spin" style={{ animationDuration: "12s" }} />
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xs font-black">
              404
            </div>
          </div>

          <div className="space-y-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs px-3 py-0.5 font-semibold">
              <Sparkles className="w-3 h-3 mr-1" />
              Resource Path Not Located
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Page Not Found
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
              The wellness analytics view, clinical tool, or page you were seeking does not exist or may have been reorganized.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="rounded-xl border-border/60 text-xs font-semibold h-10 gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
            <Link to="/student/dashboard" className="w-full">
              <Button className="w-full rounded-xl bg-primary text-primary-foreground text-xs font-semibold h-10 gap-1.5 shadow-sm">
                <Home className="w-4 h-4" />
                Student Dashboard
              </Button>
            </Link>
          </div>

          {/* Crisis / Emergency Banner */}
          <div className="pt-4 border-t border-border/40 flex items-center justify-between text-left">
            <div className="flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-[11px] text-muted-foreground">In immediate distress?</span>
            </div>
            <Link to="/student/sos">
              <span className="text-[11px] text-rose-500 hover:underline font-bold flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                Emergency Lifeline &rarr;
              </span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFoundPage;
