/**
 * MindGuard AI - Clinical Wellness & Assessment Utility Functions
 * Author: Avuti Anoushka
 * Provides standardized clinical cutoffs for PHQ-9, GAD-7, and Mental Wellness Index.
 */

export type ClinicalRiskTier = "LOW" | "MEDIUM" | "HIGH";

export interface WellnessClassification {
  tier: ClinicalRiskTier;
  label: string;
  badgeClass: string;
  color: string;
  recommendation: string;
}

/**
 * Classifies a continuous 0-100 Mental Wellness Index into standardized clinical tiers.
 * - 65 - 100: Optimal Wellness (LOW Risk)
 * - 35 - 64:  Moderate Strain (MEDIUM Risk)
 * - 0 - 34:   Critical Distress (HIGH Risk)
 */
export function classifyMentalWellness(score: number): WellnessClassification {
  if (score >= 65) {
    return {
      tier: "LOW",
      label: "Optimal Wellness",
      badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      color: "#10b981",
      recommendation: "Wellness parameters are stable. Keep up positive daily habits!",
    };
  }

  if (score >= 35) {
    return {
      tier: "MEDIUM",
      label: "Moderate Strain",
      badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      color: "#f59e0b",
      recommendation: "Elevated stress indices. Guided support and self-care tools advised.",
    };
  }

  return {
    tier: "HIGH",
    label: "Critical Distress",
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    color: "#ef4444",
    recommendation: "Significant emotional distress detected. Counselor support recommended.",
  };
}

/**
 * Standardized PHQ-9 Depression Severity Bands.
 * - 0-4: None-minimal
 * - 5-9: Mild
 * - 10-14: Moderate
 * - 15-19: Moderately severe
 * - 20-27: Severe
 */
export function getPHQ9Severity(totalScore: number): {
  severity: string;
  riskTier: ClinicalRiskTier;
  action: string;
} {
  if (totalScore <= 4) {
    return {
      severity: "Minimal / None",
      riskTier: "LOW",
      action: "Maintain current wellness routines.",
    };
  }
  if (totalScore <= 9) {
    return {
      severity: "Mild Depression",
      riskTier: "LOW",
      action: "Watchful waiting; practice CBT self-care tools.",
    };
  }
  if (totalScore <= 14) {
    return {
      severity: "Moderate Depression",
      riskTier: "MEDIUM",
      action: "Guided counseling support advised.",
    };
  }
  if (totalScore <= 19) {
    return {
      severity: "Moderately Severe Depression",
      riskTier: "HIGH",
      action: "Active counselor triage initiated.",
    };
  }
  return {
    severity: "Severe Depression",
    riskTier: "HIGH",
    action: "Immediate clinical counseling priority.",
  };
}

/**
 * Standardized GAD-7 Anxiety Severity Bands.
 * - 0-4: Minimal anxiety
 * - 5-9: Mild anxiety
 * - 10-14: Moderate anxiety
 * - 15-21: Severe anxiety
 */
export function getGAD7Severity(totalScore: number): {
  severity: string;
  riskTier: ClinicalRiskTier;
  action: string;
} {
  if (totalScore <= 4) {
    return {
      severity: "Minimal Anxiety",
      riskTier: "LOW",
      action: "Stable emotional parameters.",
    };
  }
  if (totalScore <= 9) {
    return {
      severity: "Mild Anxiety",
      riskTier: "LOW",
      action: "Practice daily breathing and grounding exercises.",
    };
  }
  if (totalScore <= 14) {
    return {
      severity: "Moderate Anxiety",
      riskTier: "MEDIUM",
      action: "Counselor consultation recommended.",
    };
  }
  return {
    severity: "Severe Anxiety",
    riskTier: "HIGH",
    action: "Urgent counselor outreach prioritized.",
  };
}
