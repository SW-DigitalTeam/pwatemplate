/** Validates every shipped programme config against the schema, and checks
 *  the safety refinements actually reject bad configs. Run: npm test -w @sw/programme-config */
import { ProgrammeConfig } from "./schema";
import { programmes } from "./index";

let failures = 0;
const ok = (name: string) => console.log(`ok: ${name}`);
const fail = (name: string, err: unknown) => { failures++; console.error(`FAILED: ${name}\n`, err); };

for (const [slug, cfg] of Object.entries(programmes)) {
  const r = ProgrammeConfig.safeParse(cfg);
  r.success ? ok(`config '${slug}' is valid`) : fail(`config '${slug}'`, r.error.issues);
}

// Refinement: identifiable leaderboards must be rejected
{
  const bad = structuredClone(programmes.karawhiua) as Record<string, unknown>;
  (bad.featureFlags as Record<string, boolean>).leaderboards_deidentified = false;
  const r = ProgrammeConfig.safeParse(bad);
  !r.success ? ok("identifiable leaderboards rejected by schema") : fail("leaderboard refinement", "accepted bad config");
}

// Refinement: attendance without sessions must be rejected
{
  const bad = structuredClone(programmes["tap-town"]) as { enabledModules: string[] };
  bad.enabledModules = ["registration", "attendance"];
  const r = ProgrammeConfig.safeParse(bad);
  !r.success ? ok("attendance-without-sessions rejected by schema") : fail("module dependency refinement", "accepted bad config");
}

if (failures > 0) { console.error(`${failures} failures`); process.exit(1); }
console.log("ALL CONFIG TESTS PASSED");
