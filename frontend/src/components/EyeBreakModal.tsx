import React, { useState, useEffect } from "react";
import { X, Eye, CheckCircle2, RotateCcw, Volume2, VolumeX, Sparkles, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EyeBreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export const EyeBreakModal: React.FC<EyeBreakModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(20);
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setSecondsLeft(20);
      setIsActive(true);
      setIsCompleted(false);
    } else {
      setIsActive(false);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isActive && secondsLeft > 0) {
      timer = setTimeout(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && secondsLeft === 0) {
      setIsActive(false);
      setIsCompleted(true);
      if (soundEnabled) {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
          osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5
          gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.5);
        } catch (e) {
          // AudioContext unsupported or blocked by autoplay policy
        }
      }
      if (onComplete) onComplete();
    }
    return () => clearTimeout(timer);
  }, [isActive, secondsLeft, soundEnabled, onComplete]);

  if (!isOpen) return null;

  const progressPct = ((20 - secondsLeft) / 20) * 100;
  const strokeDashoffset = 283 - (283 * progressPct) / 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-card border border-border/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Top Accent Glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">20-20-20 Eye-Strain Relief</h3>
              <p className="text-xs text-muted-foreground">Digital Wellbeing Micro-Break</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title={soundEnabled ? "Mute chime" : "Enable chime"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="py-6 flex flex-col items-center text-center">
          {/* Animated Countdown Circle */}
          <div className="relative w-36 h-36 flex items-center justify-center mb-5">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="45"
                className="stroke-muted/30"
                strokeWidth="7"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r="45"
                className="stroke-emerald-500 transition-all duration-1000 ease-linear"
                strokeWidth="7"
                strokeDasharray="283"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {isCompleted ? (
                <div className="animate-in zoom-in-75 duration-300 flex flex-col items-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-1" />
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Refreshed</span>
                </div>
              ) : (
                <>
                  <span className="text-4xl font-black text-foreground font-mono">{secondsLeft}</span>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Seconds</span>
                </>
              )}
            </div>
          </div>

          {/* Instructions */}
          {isCompleted ? (
            <div className="space-y-1.5">
              <h4 className="text-base font-bold text-foreground flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" /> Eyes Rested & Ciliary Muscle Relaxed!
              </h4>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Great job taking care of your visual health. Your continuous strain streak has been reset to zero.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-foreground">
                Look away from your screen now
              </h4>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Focus your vision on any distant object at least <span className="text-emerald-600 dark:text-emerald-400 font-semibold">20 feet (6 meters) away</span>. Blink naturally and relax your facial muscles.
              </p>
            </div>
          )}

          {/* Clinical Tip Banner */}
          <div className="mt-5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-left w-full flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-emerald-900 dark:text-emerald-200 leading-snug">
              <strong>Why 20-20-20 works:</strong> Shifting focus to distance relieves constant contraction of eye lenses, preventing tension headaches and digital fatigue during heavy study blocks.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
          {!isCompleted ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSecondsLeft(20)}
                className="text-xs h-9 gap-1 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Restart
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={onClose}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-9 px-4 rounded-xl"
              >
                Skip / Resume
              </Button>
            </>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={onClose}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-9 rounded-xl shadow-xs"
            >
              Resume Study Session
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
