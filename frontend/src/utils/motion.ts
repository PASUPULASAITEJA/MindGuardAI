import type { Variants, Transition } from "motion/react";

/**
 * MindGuardAI Unified Motion & Animation System
 * Clear, noticeable, professional healthcare-grade motion variants.
 * Stagger delays ~80ms, entrance durations 350-500ms, smooth cubic ease.
 */

export const easeOutCubic: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const easeInOutCubic: [number, number, number, number] = [0.65, 0, 0.35, 1];

export const defaultTransition: Transition = {
  duration: 0.45,
  ease: easeOutCubic,
};

/** Full page entrance with noticeable elevation and opacity fade */
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: easeOutCubic,
    },
  },
  exit: {
    opacity: 0,
    y: -14,
    transition: { duration: 0.25, ease: "easeIn" },
  },
};

/** Staggered list / dashboard container */
export const staggerContainer: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.06,
    },
  },
};

/** Individual card reveal in a grid or dashboard */
export const cardEntrance: Variants = {
  initial: {
    opacity: 0,
    y: 22,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: easeOutCubic,
    },
  },
};

/** Noticeable card elevation on hover */
export const cardHoverMotion = {
  whileHover: {
    y: -4,
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
    transition: { duration: 0.22, ease: "easeOut" },
  },
};

/** Tactile button feedback */
export const buttonTapMotion = {
  whileHover: { scale: 1.025 },
  whileTap: { scale: 0.96 },
  transition: { duration: 0.15 },
};

/** Interactive mood or filter selector pill */
export const pillSelectMotion = {
  whileHover: { scale: 1.06, y: -2 },
  whileTap: { scale: 0.94 },
  transition: { duration: 0.14 },
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
    scale: 0.93,
    y: 22,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.32, ease: easeOutCubic },
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    y: 16,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

/** Conversational Chat Message Reveals */
export const chatUserMessageVariants: Variants = {
  initial: { opacity: 0, x: 24, scale: 0.96 },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.32, ease: easeOutCubic },
  },
};

export const chatBotMessageVariants: Variants = {
  initial: { opacity: 0, x: -24, scale: 0.96 },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.32, ease: easeOutCubic },
  },
};

/** Smooth Animated Progress Bars */
export const progressBarVariants = (percentage: number): Variants => ({
  initial: { width: "0%" },
  animate: {
    width: `${percentage}%`,
    transition: { duration: 0.7, ease: easeOutCubic },
  },
});
