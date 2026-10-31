import * as React from "react";
import { motion, AnimatePresence, type HTMLMotionProps } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const DialogContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>({
  open: false,
  onOpenChange: () => {},
});

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
};

export const DialogTrigger: React.FC<{
  asChild?: boolean;
  children: React.ReactElement;
}> = ({ children }) => {
  const { onOpenChange } = React.useContext(DialogContext);
  return React.cloneElement(children, {
    onClick: (e: React.MouseEvent) => {
      children.props.onClick?.(e);
      onOpenChange(true);
    },
  });
};

export interface DialogContentProps extends HTMLMotionProps<"div"> {
  className?: string;
  children: React.ReactNode;
}

export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open, onOpenChange } = React.useContext(DialogContext);

    return (
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => onOpenChange(false)}
            />

            {/* Modal Dialog Content */}
            <motion.div
              ref={ref}
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className={cn(
                "relative z-50 w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl shadow-black/5 dark:shadow-black/20 text-card-foreground",
                className
              )}
              {...props}
            >
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
              {children}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }
);
DialogContent.displayName = "DialogContent";

export const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col space-y-1.5 text-left mb-4", className)}
    {...props}
  />
);

export const DialogTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => (
  <h2
    className={cn("text-lg font-bold leading-none tracking-tight text-foreground", className)}
    {...props}
  />
);

export const DialogDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  ...props
}) => (
  <p
    className={cn("text-xs text-muted-foreground leading-relaxed", className)}
    {...props}
  />
);

export const DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6 pt-3 border-t border-border/50", className)}
    {...props}
  />
);
