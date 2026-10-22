import type { Variants, Transition } from "motion/react";

/**
 * MindGuardAI Unified Motion & Animation System
 * Calming, professional healthcare-grade motion variants.
 * Respects system accessibility preferences (reduced motion).
 */

export const easeOutCubic: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const easeInOutCubic: [number, number, number, number] = [0.65, 0, 0.35, 1];

export const defaultTransition: Transition = {
  duration: 0.38,
  ease: easeOutCubic,
};

/** Full page entrance with smooth elevation and opacity fade */
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 14,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

/** Staggered list / dashboard container */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.04,
    },
  },
};

/** Individual card reveal in a grid or dashboard */
export const cardEntrance: Variants = {
  initial: {
    opacity: 0,
    y: 16,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: defaultTransition,
  },
};

/** Subtle card elevation on hover */
export const cardHoverMotion = {
  whileHover: {
    y: -3,
    transition: { duration: 0.2, ease: "easeOut" },
  },
};

/** Tactile button feedback */
export const buttonTapMotion = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: { duration: 0.15 },
};

/** Interactive mood or filter selector pill */
export const pillSelectMotion = {
  whileHover: { scale: 1.04 },
  whileTap: { scale: 0.96 },
  transition: { duration: 0.12 },
};

/** Modal / Dialog Backdrop Fade */
export const modalBackdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

/** Modal / Dialog Panel Scale and Slide */
export const modalPanelVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: 12,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.28, ease: easeOutCubic },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 10,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

/** AI Companion chat bubble entrances */
export const chatBotMessageVariants: Variants = {
  initial: {
    opacity: 0,
    x: -12,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.26, ease: easeOutCubic },
  },
};

export const chatUserMessageVariants: Variants = {
  initial: {
    opacity: 0,
    x: 12,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.26, ease: easeOutCubic },
  },
};

/** Progress bar fill animation */
export const progressBarVariants: Variants = {
  initial: { width: "0%" },
  animate: (targetWidth: string | number) => ({
    width: typeof targetWidth === "number" ? `${targetWidth}%` : targetWidth,
    transition: { duration: 0.75, ease: easeOutCubic, delay: 0.1 },
  }),
};
