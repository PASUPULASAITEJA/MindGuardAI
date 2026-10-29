export interface CopingExercise {
  id: string;
  title: string;
  category: "breathing" | "grounding" | "cognitive" | "sleep";
  durationMinutes: number;
  description: string;
  instructions: string[];
  clinicalBasis: string;
  evidenceTier: "Level 1 (RCT Validated)" | "Level 2 (Quasi-experimental)";
}

export const COPING_EXERCISES: CopingExercise[] = [
  {
    id: "box-breathing",
    title: "Autonomic Box Breathing (4-4-4-4)",
    category: "breathing",
    durationMinutes: 4,
    description: "Down-regulates sympathetic nervous system arousal through paced diaphragmatic respiration.",
    instructions: [
      "Inhale deeply through your nose for 4 counts.",
      "Hold your breath with comfortable stillness for 4 counts.",
      "Exhale smoothly through your mouth for 4 counts.",
      "Hold empty before your next inhalation for 4 counts.",
      "Repeat for 4 to 6 cycles."
    ],
    clinicalBasis: "Activates vagal tone to decrease resting heart rate and attenuate acute cortisol response.",
    evidenceTier: "Level 1 (RCT Validated)",
  },
  {
    id: "sensory-grounding",
    title: "5-4-3-2-1 Sensory Grounding Protocol",
    category: "grounding",
    durationMinutes: 5,
    description: "Anchors cognitive attention back to somatic reality when experiencing sensory overload or anxiety spiral.",
    instructions: [
      "Identify 5 things you can see around your immediate environment.",
      "Identify 4 physical sensations you can touch right now.",
      "Listen for 3 distinct audio signals in your room or outdoors.",
      "Notice 2 scents or aromas in your air.",
      "Acknowledge 1 taste present on your tongue."
    ],
    clinicalBasis: "Engages primary sensory cortices to disrupt rumination in default mode network (DMN).",
    evidenceTier: "Level 1 (RCT Validated)",
  },
  {
    id: "cognitive-reframing",
    title: "CBT Automatic Thought Reframing",
    category: "cognitive",
    durationMinutes: 6,
    description: "Deconstructs catastrophic academic assumptions and replaces them with balanced objective self-talk.",
    instructions: [
      "Identify the automatic negative thought causing acute distress.",
      "List concrete verifiable evidence that directly contradicts the catastrophic thought.",
      "Identify the cognitive distortion (e.g., all-or-nothing thinking, fortune-telling).",
      "Formulate a rational, compassionate counter-statement."
    ],
    clinicalBasis: "Standard Cognitive Behavioral Therapy protocol for reducing cognitive distortions in undergraduate cohorts.",
    evidenceTier: "Level 1 (RCT Validated)",
  },
  {
    id: "circadian-winddown",
    title: "Pre-Sleep Digital Decompression",
    category: "sleep",
    durationMinutes: 10,
    description: "Pre-sleep screen-time tapering protocol to prevent late-night cognitive hyperarousal.",
    instructions: [
      "Dim ambient lighting and shift displays to blue-light filter mode.",
      "Perform progressive muscle relaxation from shoulders down to toes.",
      "Write tomorrow's primary priority tasks on paper to offload working memory.",
      "Transition devices away from immediate bed reach."
    ],
    clinicalBasis: "Facilitates natural melatonin synthesis and reduces sleep-onset latency.",
    evidenceTier: "Level 1 (RCT Validated)",
  },
];
