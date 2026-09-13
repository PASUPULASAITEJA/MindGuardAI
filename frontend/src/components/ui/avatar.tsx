import * as React from "react"
import { cn } from "@/utils/cn"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size = "md", ...props }, ref) => {
    const sizeClasses = {
      sm: "h-8 w-8 text-xs",
      md: "h-10 w-10 text-sm",
      lg: "h-12 w-12 text-base",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-2xl bg-primary/10 border border-primary/20 text-primary font-bold items-center justify-center shadow-xs",
          sizeClasses[size],
          className
        )}
        {...props}
      />
    )
  }
)
Avatar.displayName = "Avatar"

interface AvatarFallbackProps extends React.HTMLAttributes<HTMLSpanElement> {}

const AvatarFallback = React.forwardRef<HTMLSpanElement, AvatarFallbackProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn("flex h-full w-full items-center justify-center font-extrabold uppercase", className)}
      {...props}
    />
  )
)
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarFallback }
