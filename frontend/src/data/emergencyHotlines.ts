export interface EmergencyHotline {
  id: string;
  country: string;
  serviceName: string;
  dialNumber: string;
  smsNumber?: string;
  availability: string;
  languages: string[];
  isPrimary: boolean;
}

export const EMERGENCY_HOTLINES: EmergencyHotline[] = [
  {
    id: "in-telemanas",
    country: "India",
    serviceName: "Tele-MANAS (Govt. of India)",
    dialNumber: "14416",
    availability: "24/7 Free Confidential",
    languages: ["English", "Hindi", "Regional 20+ Languages"],
    isPrimary: true,
  },
  {
    id: "in-kiran",
    country: "India",
    serviceName: "KIRAN Mental Health Helpline",
    dialNumber: "1800-599-0019",
    availability: "24/7 Toll-free",
    languages: ["English", "Hindi", "13 Languages"],
    isPrimary: false,
  },
  {
    id: "us-988",
    country: "United States",
    serviceName: "988 Suicide & Crisis Lifeline",
    dialNumber: "988",
    smsNumber: "988",
    availability: "24/7 Free & Confidential",
    languages: ["English", "Spanish", "240+ via translation"],
    isPrimary: true,
  },
  {
    id: "us-crisis-text",
    country: "United States",
    serviceName: "Crisis Text Line",
    dialNumber: "741741",
    smsNumber: "HOME to 741741",
    availability: "24/7 Free SMS",
    languages: ["English", "Spanish"],
    isPrimary: false,
  },
  {
    id: "uk-111",
    country: "United Kingdom",
    serviceName: "NHS Mental Health Services",
    dialNumber: "111",
    availability: "24/7 NHS Urgent Care",
    languages: ["English"],
    isPrimary: true,
  },
  {
    id: "uk-samaritans",
    country: "United Kingdom",
    serviceName: "Samaritans UK",
    dialNumber: "116123",
    availability: "24/7 Free",
    languages: ["English"],
    isPrimary: false,
  },
  {
    id: "ca-988",
    country: "Canada",
    serviceName: "988 Suicide Crisis Helpline",
    dialNumber: "988",
    smsNumber: "988",
    availability: "24/7 Bilingual",
    languages: ["English", "French"],
    isPrimary: true,
  },
  {
    id: "au-lifeline",
    country: "Australia",
    serviceName: "Lifeline Australia",
    dialNumber: "131114",
    availability: "24/7 Crisis Support",
    languages: ["English"],
    isPrimary: true,
  },
];

export default EMERGENCY_HOTLINES;
