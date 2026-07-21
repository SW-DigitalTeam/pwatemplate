import type { ProgrammeConfigInput } from "../schema";

/** FreeWheeler — indoor smart-bike cycling pilot. Sessions + rides + surveys. */
export const freewheeler: ProgrammeConfigInput = {
  slug: "freewheeler",
  name: "FreeWheeler",
  description: {
    en: "Ride indoors, race your mates, discover you're a rider.",
  },
  support: {
    contactEmail: "freewheeler@sportwaikato.org.nz",
    safeguardingInfo: {
      en: "Tell your teacher or facilitator if anything isn't right. You can also contact Sport Waikato directly.",
    },
  },
  theme: {
    colors: {
      primary: "#1450e0", primaryContrast: "#ffffff",
      surface: "#f4f7ff", surfaceText: "#101a33", accent: "#ffb020",
    },
    fonts: { display: "Chakra Petch", body: "Inter" },
    radius: "round",
  },
  enabledModules: [
    "school_onboarding", "enrolment", "consent", "cohorts",
    "sessions", "attendance", "movement_logging",
    "surveys", "reporting", "exports", "issue_reporting",
  ],
  terminology: {
    participant: { en: "rider", mi: "kaieke" },
    session: { en: "ride session", mi: "wāhanga eke" },
    cohort: { en: "riding group", mi: "rōpū eke" },
  },
  registrationFields: [],
  availableRoles: ["participant","teacher","facilitator","school_admin","sw_programme_admin","sw_reporting","system_admin","tech_support"],
  consent: { required: true, grantors: ["caregiver","self"], minSelfConsentAge: 16 },
  surveyPacks: [
    { key: "baseline", when: "baseline", audience: "participant" },
    { key: "midpoint-pulse", when: "pulse", audience: "participant" },
    { key: "endpoint", when: "endpoint", audience: "participant" },
  ],
  measures: [
    { key: "rides", label: { en: "Rides completed" }, unit: "rides", allowedSources: ["recorded"] },
    { key: "ride_minutes", label: { en: "Ride duration" }, unit: "minutes", allowedSources: ["recorded"] },
    { key: "distance_km", label: { en: "Distance" }, unit: "km", allowedSources: ["recorded"] },
  ],
  sessionTypes: [
    { key: "class_ride", label: { en: "Class ride" }, defaultDurationMinutes: 40 },
    { key: "lunchtime", label: { en: "Lunchtime ride" }, defaultDurationMinutes: 30 },
  ],
  notifications: { enabled: false },
  dataRetention: { participantMonthsAfterCompletion: 24, surveyResponsesMonths: 36, auditLogMonths: 84 },
  featureFlags: { equipment_issue_reporting: true },
};
