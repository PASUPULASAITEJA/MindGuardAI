import React, { useEffect, useState } from "react";
import { animate } from "motion/react";

interface AnimatedCounterProps {
  value: number | string;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 0.9,
  decimals,
  prefix = "",
  suffix = "",
  className,
}) => {
  // Extract numeric portion
  const strVal = String(value);
  const match = strVal.match(/-?[\d.]+/);
  const targetNumber = match ? parseFloat(match[0]) : 0;
  
  // Infer decimals if not specified
  const inferredDecimals = decimals !== undefined
    ? decimals
    : (match && match[0].includes("."))
      ? match[0].split(".")[1].length
      : 0;

  // Suffix/prefix extraction if not explicitly passed
  let finalPrefix = prefix;
  let finalSuffix = suffix;
  if (!prefix && strVal.startsWith("+")) {
    finalPrefix = "+";
  }
  if (!suffix && (strVal.endsWith("%") || strVal.endsWith("h") || strVal.endsWith("m") || strVal.includes("/"))) {
    const nonNumeric = strVal.replace(/^[+-]?[\d.]+/, "");
    if (nonNumeric) finalSuffix = nonNumeric;
  }

  const [displayNumber, setDisplayNumber] = useState<number>(0);

  useEffect(() => {
    if (isNaN(targetNumber)) {
      return;
    }
    const controls = animate(0, targetNumber, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        setDisplayNumber(latest);
      },
    });

    return () => controls.stop();
  }, [targetNumber, duration]);

  if (isNaN(targetNumber) || targetNumber === 0 && strVal === "—") {
    return <span className={className}>{strVal}</span>;
  }

  const formatted = displayNumber.toFixed(inferredDecimals);

  return (
    <span className={className}>
      {finalPrefix}{formatted}{finalSuffix}
    </span>
  );
};
