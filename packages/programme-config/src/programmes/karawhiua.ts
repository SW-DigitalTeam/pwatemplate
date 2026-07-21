import type { ProgrammeConfigInput } from "../schema";

/** Karawhiua — inclusive school movement platform. Full module set. */
export const karawhiua: ProgrammeConfigInput = {
  slug: "karawhiua",
  name: "Karawhiua",
  description: {
    en: "All movement counts. Log your movement, back your house, and celebrate together.",
    mi: "He mea nui ngā nekehanga katoa. Tuhia ō nekehanga, tautokohia tō whare.",
  },
  support: {
    contactEmail: "karawhiua@sportwaikato.org.nz",
    safeguardingInfo: {
      en: "If anything in this programme worries you, talk to your teacher, or contact Sport Waikato. If you need someone to talk to, free call or text 1737 any time.",
      mi: "Mēnā he āwangawanga ōu, kōrero ki tō kaiako, ki a Sport Waikato rānei. Waea koreutu, tuku kupu rānei ki 1737 i ngā wā katoa.",
    },
  },
  theme: {
    colors: {
      primary: "#d103d1", primaryContrast: "#ffffff",
      surface: "#0f0a14", surfaceText: "#f5eefa", accent: "#3ce8c8",
    },
    fonts: { display: "Antonio", body: "Inter" },
    radius: "sharp",
  },
  enabledModules: [
    "school_onboarding", "enrolment", "consent", "cohorts",
    "movement_logging", "challenges", "badges", "leaderboards",
    "surveys", "reporting", "exports", "notifications", "issue_reporting",
  ],
  terminology: {
    participant: { en: "student", mi: "ākonga" },
    session: { en: "session", mi: "wāhanga" },
    cohort: { en: "house", mi: "whare" },
  },
  registrationFields: [
    { key: "year_level", label: { en: "Year level" }, type: "select", required: true,
      options: ["Y7","Y8","Y9","Y10","Y11","Y12","Y13"],
      purpose: "Groups reporting by year level so schools can see participation patterns." },
  ],
  availableRoles: ["participant","teacher","school_admin","sw_programme_admin","sw_reporting","system_admin","tech_support"],
  consent: { required: true, grantors: ["caregiver","self"], minSelfConsentAge: 16 },
  surveyPacks: [
    { key: "baseline", when: "baseline", audience: "participant", anonymity: "pseudonymous" },
    { key: "endpoint", when: "endpoint", audience: "participant", anonymity: "pseudonymous" },
    { key: "teacher-observation", when: "midpoint", audience: "teacher", anonymity: "identified" },
  ],
  measures: [
    { key: "movement_entries", label: { en: "Movement entries" }, unit: "entries",
      allowedSources: ["self_reported"] },
    { key: "active_minutes", label: { en: "Active minutes" }, unit: "minutes",
      allowedSources: ["self_reported","facilitator_observed"] },
  ],
  sessionTypes: [],
  notifications: { enabled: true, fromName: "Karawhiua", reminderDaysBeforeSurveyClose: 3 },
  dataRetention: { participantMonthsAfterCompletion: 24, surveyResponsesMonths: 36, auditLogMonths: 84 },
  featureFlags: { leaderboards_deidentified: true, assembly_mode: true },
};
