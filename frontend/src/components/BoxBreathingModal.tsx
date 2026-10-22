import React, { useState, useEffect } from "react";
import { X, Wind, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { modalBackdropVariants, modalPanelVariants } from "@/utils/motion";

interface BoxBreathingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BoxBreathingModal: React.FC<BoxBreathingModalProps> = ({ isOpen, onClose }) => {
  const [phase, setPhase] = useState<"Inhale" | "Hold" | "Exhale" | "Hold After">("Inhale");
  const [seconds, setSeconds] = useState(4);

  useEffect(() => {
    if (!isOpen) {
      setPhase("Inhale");
      setSeconds(4);
      return;
    }

    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setPhase((current) => {
            if (current === "Inhale") return "Hold";
            if (current === "Hold") return "Exhale";
            if (current === "Exhale") return "Hold After";
            return "Inhale";
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const phaseInstruction =
    phase === "Inhale"
      ? "Slowly breathe in through your nose..."
      : phase === "Hold"
      ? "Gently hold your breath, relax your shoulders..."
      : phase === "Exhale"
      ? "Slowly breathe out through your mouth..."
      : "Pause in stillness before the next breath...";

  const phaseColor =
    phase === "Inhale"
      ? "text-teal-600 dark:text-teal-400 border-teal-500 bg-teal-500/10 shadow-teal-500/20"
      : phase === "Hold" || phase === "Hold After"
      ? "text-emerald-600 dark:text-emerald-400 border-emerald-500 bg-emerald-500/10 shadow-emerald-500/20"
      : "text-sky-600 dark:text-sky-400 border-sky-500 bg-sky-500/10 shadow-sky-500/20";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          variants={modalBackdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
        >
          <motion.div 
            variants={modalPanelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative w-full max-w-md rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-2xl text-center space-y-6"
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

        {/* Pulsing Visual Circle */}
        <div className="py-6 flex items-center justify-center">
          <motion.div
            animate={{
              scale: phase === "Inhale" ? 1.15 : phase === "Exhale" ? 0.88 : 1.0,
            }}
            transition={{
              duration: phase === "Inhale" || phase === "Exhale" ? 3.8 : 0.8,
              ease: "easeInOut",
            }}
            className={`relative flex h-48 w-48 items-center justify-center rounded-full border-4 shadow-2xl transition-colors duration-700 ${phaseColor}`}
          >
            <div className="text-center space-y-1">
              <span className="text-4xl font-black text-foreground tracking-tight">{seconds}s</span>
              <div className="text-xs font-extrabold uppercase tracking-widest text-primary">
                {phase}
              </div>
            </div>
          </motion.div>
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
    </AnimatePresence>
  );
};
