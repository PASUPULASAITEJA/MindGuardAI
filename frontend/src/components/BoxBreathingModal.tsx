import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { modalBackdropVariants, modalPanelVariants } from "@/utils/motion";
import { cn } from "@/utils/cn";

interface BoxBreathingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Phase = "inhale" | "hold" | "exhale" | "holdOut";

const PHASE_LABELS: Record<Phase, string> = {
  inhale: "Inhale",
  hold: "Hold",
  exhale: "Exhale",
  holdOut: "Hold",
};

const PHASE_INSTRUCTIONS: Record<Phase, string> = {
  inhale: "Slowly breathe in through your nose...",
  hold: "Gently hold your breath, relax your shoulders...",
  exhale: "Slowly breathe out through your mouth...",
  holdOut: "Pause in stillness before the next breath...",
};

export const BoxBreathingModal: React.FC<BoxBreathingModalProps> = ({ isOpen, onClose }) => {
  const [phase, setPhase] = useState<Phase>("inhale");
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    if (!isOpen) {
      setPhase("inhale");
      setCountdown(4);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setPhase((current) => {
            if (current === "inhale") return "hold";
            if (current === "hold") return "exhale";
            if (current === "exhale") return "holdOut";
            return "inhale";
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const phaseLabel = PHASE_LABELS[phase];
  const phaseInstruction = PHASE_INSTRUCTIONS[phase];

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={modalBackdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto"
        >
          <motion.div
            variants={modalPanelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-2xl text-center space-y-6 my-auto"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
              <Wind className="h-3.5 w-3.5" />
              <span>Vagus Nerve Calming Circuit • Box 4-4-4-4</span>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-foreground">Box Breathing Pacer</h3>
              <p className="text-xs text-muted-foreground">
                Follow the cadence to reset stress and restore heart-rate variability.
              </p>
            </div>

            {/* Concentric Animated Breathing Circle Guide */}
            <div className="relative flex items-center justify-center w-48 h-48 mx-auto my-6">
              {/* Outer pulse ring */}
              <div
                className={cn(
                  "absolute inset-0 rounded-full border-2 transition-all duration-1000",
                  phase === "inhale" && "scale-110 border-blue-400/50",
                  phase === "hold" && "scale-110 border-emerald-400/50",
                  phase === "exhale" && "scale-90 border-purple-400/50",
                  phase === "holdOut" && "scale-90 border-amber-400/50"
                )}
              />
              {/* Main breathing circle */}
              <div
                className={cn(
                  "rounded-full flex items-center justify-center transition-all duration-1000 ease-in-out",
                  phase === "inhale" && "w-36 h-36 bg-blue-500/20 border-2 border-blue-400",
                  phase === "hold" && "w-36 h-36 bg-emerald-500/20 border-2 border-emerald-400",
                  phase === "exhale" && "w-28 h-28 bg-purple-500/20 border-2 border-purple-400",
                  phase === "holdOut" && "w-28 h-28 bg-amber-500/20 border-2 border-amber-400"
                )}
              >
                <div className="text-center">
                  <p className="text-xs font-bold text-foreground uppercase tracking-widest">{phaseLabel}</p>
                  <p className="text-3xl font-extrabold text-foreground mt-1">{countdown}</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground italic h-6">{phaseInstruction}</p>

            <Button
              onClick={onClose}
              className="w-full rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-11 shadow-md transition-all"
            >
              Finish Breathing & Return
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default BoxBreathingModal;
