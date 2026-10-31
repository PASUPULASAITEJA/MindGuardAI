import React from "react";
import { Lottie } from "lottie-react";
import { cn } from "@/utils/cn";

// Lightweight embedded Lottie JSON data for instant, reliable rendering without external network requests
const successAnimation = {
  v: "5.5.7",
  fr: 30,
  ip: 0,
  op: 45,
  w: 120,
  h: 120,
  nm: "SuccessCheck",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Checkmark",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [60, 60, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [0, 0, 100], e: [110, 110, 100] },
            { t: 25, s: [110, 110, 100], e: [100, 100, 100] },
            { t: 35, s: [100, 100, 100] },
          ],
        },
      },
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "el",
              p: { a: 0, k: [0, 0] },
              s: { a: 0, k: [70, 70] },
              nm: "Circle",
            },
            {
              ty: "fl",
              c: { a: 0, k: [0.08, 0.65, 0.45, 1] },
              o: { a: 0, k: 100 },
              nm: "Fill",
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              sk: { a: 0, k: 0 },
              sa: { a: 0, k: 0 },
            },
          ],
          nm: "CircleGroup",
        },
        {
          ty: "gr",
          it: [
            {
              ty: "sh",
              ks: {
                a: 0,
                k: {
                  i: [[0, 0], [0, 0], [0, 0]],
                  o: [[0, 0], [0, 0], [0, 0]],
                  v: [[-14, 2], [-4, 12], [16, -10]],
                  c: false,
                },
              },
              nm: "Path",
            },
            {
              ty: "st",
              c: { a: 0, k: [1, 1, 1, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 6 },
              lc: 2,
              lj: 2,
              nm: "Stroke",
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              sk: { a: 0, k: 0 },
              sa: { a: 0, k: 0 },
            },
          ],
          nm: "CheckPath",
        },
      ],
    },
  ],
};

const pulseLoadingAnimation = {
  v: "5.5.7",
  fr: 30,
  ip: 0,
  op: 60,
  w: 100,
  h: 100,
  nm: "PulseLoading",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Ring",
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 0, s: [90], e: [20] },
            { t: 30, s: [20], e: [90] },
            { t: 60, s: [90] },
          ],
        },
        r: {
          a: 1,
          k: [
            { t: 0, s: [0], e: [360] },
            { t: 60, s: [360] },
          ],
        },
        p: { a: 0, k: [50, 50, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [90, 90, 100], e: [110, 110, 100] },
            { t: 30, s: [110, 110, 100], e: [90, 90, 100] },
            { t: 60, s: [90, 90, 100] },
          ],
        },
      },
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "el",
              p: { a: 0, k: [0, 0] },
              s: { a: 0, k: [46, 46] },
              nm: "Ellipse",
            },
            {
              ty: "st",
              c: { a: 0, k: [0.15, 0.45, 0.95, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 5 },
              lc: 2,
              nm: "Stroke",
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              sk: { a: 0, k: 0 },
              sa: { a: 0, k: 0 },
            },
          ],
          nm: "RingShape",
        },
      ],
    },
  ],
};

export type IllustrationVariant =
  | "success"
  | "loading"
  | "empty"
  | "companion"
  | "onboarding";

interface LottieIllustrationProps {
  variant: IllustrationVariant;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
}

export const LottieIllustration: React.FC<LottieIllustrationProps> = ({
  variant,
  className,
  loop = true,
  autoplay = true,
}) => {
  if (variant === "success") {
    return (
      <div className={cn("relative flex items-center justify-center", className)}>
        <Lottie
          src={successAnimation}
          loop={loop}
          autoplay={autoplay}
          className="w-full h-full"
        />
      </div>
    );
  }

  if (variant === "loading") {
    return (
      <div className={cn("relative flex items-center justify-center", className)}>
        <Lottie
          src={pulseLoadingAnimation}
          loop={true}
          autoplay={true}
          className="w-full h-full"
        />
      </div>
    );
  }

  if (variant === "empty") {
    return (
      <div className={cn("relative flex items-center justify-center text-primary/80", className)}>
        <svg
          viewBox="0 0 160 140"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full max-w-[140px] drop-shadow-sm transition-transform duration-300 hover:scale-105"
        >
          <circle cx="80" cy="70" r="54" className="fill-primary/5 stroke-primary/20 stroke-dasharray-[4_4]" />
          <rect x="52" y="38" width="56" height="68" rx="8" className="fill-card stroke-border" strokeWidth="2" />
          <line x1="62" y1="52" x2="98" y2="52" className="stroke-muted-foreground/40" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="62" y1="62" x2="88" y2="62" className="stroke-muted-foreground/30" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="62" y1="72" x2="92" y2="72" className="stroke-muted-foreground/30" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="106" cy="100" r="16" className="fill-primary/10 stroke-primary" strokeWidth="2" />
          <path d="M102 100L105 103L111 97" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  if (variant === "companion") {
    return (
      <div className={cn("relative flex items-center justify-center", className)}>
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-teal-500 p-0.5 shadow-lg shadow-primary/20 animate-pulse">
          <div className="w-full h-full bg-card rounded-[14px] flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="w-8 h-8 text-primary"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a4 4 0 0 0-4 4v2a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4Z" />
              <path d="M18 10a6 6 0 0 1-12 0" />
              <line x1="12" y1="16" x2="12" y2="22" />
              <line x1="8" y1="22" x2="16" y2="22" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  // Fallback / onboarding
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full max-w-[100px]"
      >
        <circle cx="60" cy="60" r="48" className="fill-teal-500/10 stroke-teal-500/30" strokeWidth="2" />
        <path
          d="M45 60L55 70L75 48"
          stroke="#0D9488"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
