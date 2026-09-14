import React, { useState } from "react";
import { X, Calendar, UserCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { appointmentsAPI } from "@/services/api";

interface CounselorBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CounselorBookingModal: React.FC<CounselorBookingModalProps> = ({
  isOpen,
  onClose
}) => {
  const { toast } = useToast();
  const [bookingType, setBookingType] = useState<"VIRTUAL" | "IN_PERSON">("VIRTUAL");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingReason, setBookingReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDate) {
      toast({
        title: "Select Preferred Date",
        description: "Please specify when you would like your consultation.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await appointmentsAPI.bookAppointment({
        scheduled_time: new Date(bookingDate).toISOString(),
        appointment_type: bookingType,
        reason: bookingReason || "General mental wellness check-in"
      });

      toast({
        title: "Counselor Appointment Requested",
        description: "Your university wellness counselor has received your intake request.",
        variant: "success"
      });

      onClose();
      setBookingReason("");
      setBookingDate("");
    } catch (err) {
      toast({
        title: "Booking Error",
        description: "Unable to schedule your appointment right now. Please try again or use Emergency SOS.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-foreground">Schedule 1-on-1 Counseling</h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="h-3 w-3" /> 100% Confidential
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Campus mental wellness consultation</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Format selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Consultation Format</Label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setBookingType("VIRTUAL")}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left ${
                  bookingType === "VIRTUAL"
                    ? "border-primary bg-primary/10 text-primary font-black shadow-xs ring-1 ring-primary"
                    : "border-border/70 text-muted-foreground hover:bg-secondary"
                }`}
              >
                <div className="font-bold">💻 Virtual Video Session</div>
                <span className="text-[10px] text-muted-foreground block mt-0.5">Secure telemedicine link</span>
              </button>
              <button
                type="button"
                onClick={() => setBookingType("IN_PERSON")}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left ${
                  bookingType === "IN_PERSON"
                    ? "border-primary bg-primary/10 text-primary font-black shadow-xs ring-1 ring-primary"
                    : "border-border/70 text-muted-foreground hover:bg-secondary"
                }`}
              >
                <div className="font-bold">🏫 In-Person Office</div>
                <span className="text-[10px] text-muted-foreground block mt-0.5">Campus Health Center Room 204</span>
              </button>
            </div>
          </div>

          {/* Date Picker */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Preferred Date & Time</Label>
            <input
              type="datetime-local"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              className="w-full rounded-2xl border border-border/70 bg-background/50 p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Primary Focus / Topics (Optional)</Label>
            <textarea
              rows={3}
              value={bookingReason}
              onChange={(e) => setBookingReason(e.target.value)}
              placeholder="e.g., Exam anxiety, sleep disturbance, academic pressure, feeling overwhelmed..."
              className="w-full rounded-2xl border border-border/70 bg-background/50 p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-5 rounded-xl shadow-md"
            >
              {isSubmitting ? "Confirming..." : "Confirm Booking"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
