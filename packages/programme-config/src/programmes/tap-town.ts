import type { ProgrammeConfigInput } from "../schema";

/**
 * Tap Town — the future-pilot example configuration.
 * Community tap-card movement game: registration platform only.
 * Demonstrates the minimal-module deployment: no surveys, no sessions,
 * no attendance — registration, movement logging (card taps), reporting.
 */
export const tapTown: ProgrammeConfigInput = {
  slug: "tap-town",
  name: "Tap Town",
  description: {
    en: "Grab a free card, tap the posts around town, and score points for your street, school or marae.",
    mi: "Tīkina he kāri koreutu, pāwhiria ngā pou huri noa i te tāone, ka whiwhi piro mō tō tiriti, tō kura, tō marae rānei.",
  },
  support: {
    contactEmail: "taptown@sportwaikato.org.nz",
    safeguardingInfo: {
      en: "Questions or worries? Ask at any card pickup point, or contact Sport Waikato.",
      mi: "He pātai, he āwangawanga rānei? Pātai atu ki tētahi wāhi tiki kāri, whakapā atu rānei ki a Sport Waikato.",
    },
  },
  theme: {
    colors: {
      primary: "#a83208", primaryContrast: "#ffffff",
      surface: "#fff8f2", surfaceText: "#26150c", accent: "#146e5a",
    },
    fonts: { display: "Bricolage Grotesque", body: "Inter" },
    radius: "round",
  },
  // The switchboard doing its job: most modules OFF.
  enabledModules: ["registration", "movement_logging", "reporting", "exports", "issue_reporting"],
  terminology: {
    participant: { en: "player", mi: "kaitākaro" },
    session: { en: "game week", mi: "wiki tākaro" },
    cohort: { en: "team", mi: "kapa" },
  },
  registrationFields: [
    { key: "team", label: { en: "Which team are you playing for?", mi: "Mō tēhea kapa koe?" },
      type: "select", required: true, options: ["School", "Street", "Marae", "Workplace", "Just me"],
      purpose: "Assigns taps to a team for the community leaderboard (teams are groups, never individuals)." },
  ],
  availableRoles: ["participant","facilitator","sw_programme_admin","sw_reporting","system_admin","tech_support"],
  // Card pickup is open to all ages; the card itself is pseudonymous, so
  // consent is informational at pickup rather than caregiver-signed.
  consent: { required: false, grantors: ["self"] },
  surveyPacks: [],
  measures: [
    { key: "taps", label: { en: "Beacon taps", mi: "Ngā pāwhiri" }, unit: "taps", allowedSources: ["recorded"] },
    { key: "est_distance_km", label: { en: "Estimated distance", mi: "Tawhiti whakatau" }, unit: "km", allowedSources: ["calculated"] },
  ],
  sessionTypes: [],
  notifications: { enabled: false },
  dataRetention: { participantMonthsAfterCompletion: 6, surveyResponsesMonths: 6, auditLogMonths: 84 },
  featureFlags: { leaderboards_deidentified: true, public_town_display: true },
};
