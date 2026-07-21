import { z } from "zod";

/**
 * ProgrammeConfig — the single configuration mechanism that turns the shared
 * platform into a specific programme (GameFIT, FreeWheeler, Karawhiua, Tap
 * Town, or something not yet designed).
 *
 * Every module can be switched off. A registration-only deployment (e.g. a
 * holiday drop-in centre) enables `registration` and nothing else.
 */

export const ModuleKey = z.enum([
  "school_onboarding",
  "registration",          // participant/whānau self-registration
  "enrolment",             // school-managed enrolment
  "consent",
  "cohorts",
  "sessions",
  "attendance",
  "movement_logging",
  "surveys",
  "challenges",
  "badges",
  "leaderboards",
  "reporting",
  "exports",
  "notifications",
  "issue_reporting",
]);
export type ModuleKey = z.infer<typeof ModuleKey>;

export const BilingualText = z.object({
  en: z.string(),
  mi: z.string().optional(),   // te reo Māori; falls back to en when absent
});
export type BilingualText = z.infer<typeof BilingualText>;

export const ThemeConfig = z.object({
  /** CSS custom properties applied at :root for this programme */
  colors: z.object({
    primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    primaryContrast: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    surface: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    surfaceText: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  }),
  /** Google Fonts family names; the app loads them per-programme */
  fonts: z.object({ display: z.string(), body: z.string() }),
  logoPath: z.string().optional(),
  radius: z.enum(["sharp", "soft", "round"]).default("soft"),
});

export const RegistrationField = z.object({
  key: z.string(),
  label: BilingualText,
  type: z.enum(["text", "select", "date", "checkbox"]),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  /** Data-minimisation guard: every field must state why it is collected. */
  purpose: z.string().min(10),
});

export const MeasureDefinition = z.object({
  key: z.string().regex(/^[a-z0-9_]+$/),
  label: BilingualText,
  unit: z.string(),
  /** No universal activity score: measures are reported per-key, never summed across keys. */
  allowedSources: z.array(z.enum(["recorded", "self_reported", "facilitator_observed", "calculated"])),
});

export const SessionTypeDef = z.object({
  key: z.string(),
  label: BilingualText,
  defaultDurationMinutes: z.number().int().positive().optional(),
});

export const RoleKey = z.enum([
  "participant", "caregiver", "teacher", "facilitator", "school_admin",
  "sw_programme_admin", "sw_reporting", "system_admin", "tech_support",
]);

export const ConsentConfig = z.object({
  required: z.boolean(),
  /** who may grant: 'caregiver' | 'self' (16+ programmes) | 'school' (in-loco arrangements documented in privacy design) */
  grantors: z.array(z.enum(["caregiver", "self", "school"])).min(1),
  minSelfConsentAge: z.number().int().min(16).optional(),
});

export const SurveyPackRef = z.object({
  key: z.string(),                      // matches surveys.key in the database
  when: z.enum(["baseline", "midpoint", "endpoint", "pulse", "adhoc"]),
  audience: z.enum(["participant", "teacher", "facilitator", "caregiver", "school"]),
  anonymity: z.enum(["identified", "pseudonymous", "anonymous"]).default("pseudonymous"),
});

export const ProgrammeConfig = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  description: BilingualText,
  support: z.object({
    contactEmail: z.string().email(),
    helpUrl: z.string().url().optional(),
    /** Shown to participants; every programme must state where to get help. */
    safeguardingInfo: BilingualText,
  }),
  theme: ThemeConfig,
  /** The on/off switchboard. Anything not listed is OFF. */
  enabledModules: z.array(ModuleKey).min(1),
  /** e.g. participant → "rider" (FreeWheeler), "player" (Tap Town) */
  terminology: z.object({
    participant: BilingualText,
    session: BilingualText,
    cohort: BilingualText,
  }),
  registrationFields: z.array(RegistrationField).default([]),
  availableRoles: z.array(RoleKey),
  consent: ConsentConfig,
  surveyPacks: z.array(SurveyPackRef).default([]),
  measures: z.array(MeasureDefinition).default([]),
  sessionTypes: z.array(SessionTypeDef).default([]),
  notifications: z.object({
    enabled: z.boolean().default(false),
    fromName: z.string().optional(),
    reminderDaysBeforeSurveyClose: z.number().int().positive().optional(),
  }),
  dataRetention: z.object({
    participantMonthsAfterCompletion: z.number().int().positive().default(24),
    surveyResponsesMonths: z.number().int().positive().default(36),
    auditLogMonths: z.number().int().positive().default(84),
  }),
  featureFlags: z.record(z.string(), z.boolean()).default({}),
}).superRefine((cfg, ctx) => {
  const on = new Set(cfg.enabledModules);
  if (on.has("attendance") && !on.has("sessions"))
    ctx.addIssue({ code: "custom", message: "attendance requires sessions" });
  if (on.has("leaderboards") && !cfg.featureFlags["leaderboards_deidentified"])
    ctx.addIssue({
      code: "custom",
      message:
        "leaderboards require featureFlags.leaderboards_deidentified=true — identifiable participant leaderboards are not permitted by default",
    });
  if (on.has("surveys") && cfg.surveyPacks.length === 0)
    ctx.addIssue({ code: "custom", message: "surveys module enabled but no surveyPacks configured" });
  if (on.has("movement_logging") && cfg.measures.length === 0)
    ctx.addIssue({ code: "custom", message: "movement_logging enabled but no measures defined" });
});
export type ProgrammeConfig = z.infer<typeof ProgrammeConfig>;

/** Author-facing type: schema defaults are optional at authoring time. */
export type ProgrammeConfigInput = z.input<typeof ProgrammeConfig>;
