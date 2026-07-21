export { ProgrammeConfig, ModuleKey, type BilingualText, type ProgrammeConfigInput } from "./schema";
import { ProgrammeConfig } from "./schema";
import { karawhiua } from "./programmes/karawhiua";
import { freewheeler } from "./programmes/freewheeler";
import { gamefit } from "./programmes/gamefit";
import { tapTown } from "./programmes/tap-town";

/** Registry of all programme configurations shipped with the template. */
export const programmes = { karawhiua, freewheeler, gamefit, "tap-town": tapTown } as const;

export function getProgramme(slug: string) {
  const cfg = (programmes as Record<string, unknown>)[slug];
  if (!cfg) return null;
  return ProgrammeConfig.parse(cfg); // always re-validated at the boundary
}

export function isModuleEnabled(cfg: { enabledModules: string[] }, module: string) {
  return cfg.enabledModules.includes(module);
}
