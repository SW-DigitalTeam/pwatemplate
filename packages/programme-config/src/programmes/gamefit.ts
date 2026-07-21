import type { ProgrammeConfigInput } from "../schema";

/** GameFIT — active gaming / VR pilot. Attendance + observations + surveys. */
export const gamefit: ProgrammeConfigInput = {
  slug: "gamefit",
  name: "GameFIT",
  description: {
    en: "Movement that meets you in the game.",
  },
  support: {
    contactEmail: "gamefit@sportwaikato.org.nz",
    safeguardingInfo: {
      en: "If you feel unwell or uncomfortable during a session, tell the facilitator straight away. Concerns can also go to Sport Waikato directly.",
    },
  },
  theme: {
    colors: {
      primary: "#7a29e8", primaryContrast: "#ffffff",
      surface: "#0b0912", surfaceText: "#efeaf7", accent: "#33e07a",
    },
    fonts: { display: "Orbitron", body: "Inter" },
    radius: "soft",
  },
  enabledModules: [
    "school_onboarding", "enrolment", "consent", "cohorts",
    "sessions", "attendance", "movement_logging",
    "surveys", "reporting", "exports", "issue_reporting",
  ],
  terminology: {
    participant: { en: "player", mi: "kaitākaro" },
    session: { en: "session", mi: "wāhanga" },
    cohort: { en: "squad", mi: "rōpū" },
  },
  registrationFields: [],
  availableRoles: ["participant","teacher","facilitator","school_admin","sw_programme_admin","sw_reporting","system_admin","tech_support"],
  consent: { required: true, grantors: ["caregiver"], },
  surveyPacks: [
    { key: "baseline", when: "baseline", audience: "participant" },
    { key: "midpoint-pulse", when: "pulse", audience: "participant" },
    { key: "endpoint", when: "endpoint", audience: "participant" },
    { key: "teacher-observation", when: "midpoint", audience: "teacher", anonymity: "identified" },
  ],
  measures: [
    { key: "active_minutes", label: { en: "Active minutes" }, unit: "minutes",
      allowedSources: ["facilitator_observed","recorded"] },
    { key: "sessions_attended", label: { en: "Sessions attended" }, unit: "sessions",
      allowedSources: ["calculated"] },
  ],
  sessionTypes: [
    { key: "vr_session", label: { en: "VR session" }, defaultDurationMinutes: 45 },
  ],
  notifications: { enabled: false },
  dataRetention: { participantMonthsAfterCompletion: 24, surveyResponsesMonths: 36, auditLogMonths: 84 },
  featureFlags: { vr_equipment_issue_reporting: true },
};
