import React, { useState, useEffect } from "react";
import { X, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { modalBackdropVariants, modalPanelVariants } from "@/utils/motion";
import { BreathingBlob } from "@/components/ui/BreathingBlob";

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

            {/* Breathing Blob Visual Guide */}
            <div className="py-2 flex flex-col items-center justify-center">
              <BreathingBlob size={160} variant="calm">
                <div className="flex flex-col items-center justify-center pointer-events-none select-none">
                  <span className="text-4xl font-black text-foreground drop-shadow-xs">
                    {seconds}s
                  </span>
                  <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mt-1">
                    {phase}
                  </span>
                </div>
              </BreathingBlob>
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

export default BoxBreathingModal;
