import React from "react";

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

export const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  disabled = false,
  speed = 6,
  className = "",
}) => {
  return (
    <span
      className={`inline-block bg-gradient-to-r from-foreground via-indigo-600 dark:via-indigo-400 to-foreground bg-clip-text text-transparent bg-[length:200%_auto] transition-colors ${
        disabled ? "" : "animate-shine"
      } ${className}`}
      style={{
        animationDuration: `${speed}s`,
      }}
    >
      {text}
    </span>
  );
};

export default ShinyText;
