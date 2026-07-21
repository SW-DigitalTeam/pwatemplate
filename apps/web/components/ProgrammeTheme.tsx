import type { ProgrammeConfig } from "@sw/programme-config";

/**
 * Injects a programme's visual identity as CSS custom properties.
 * The entire UI reads only these variables, so a new programme is a config
 * change, not a redesign.
 */
export function ProgrammeTheme({ cfg, children }: { cfg: ProgrammeConfig; children: React.ReactNode }) {
  const radius = { sharp: "0.125rem", soft: "0.5rem", round: "1.25rem" }[cfg.theme.radius];
  const style = {
    "--sw-primary": cfg.theme.colors.primary,
    "--sw-primary-contrast": cfg.theme.colors.primaryContrast,
    "--sw-surface": cfg.theme.colors.surface,
    "--sw-surface-text": cfg.theme.colors.surfaceText,
    "--sw-accent": cfg.theme.colors.accent,
    "--sw-radius": radius,
    "--sw-font-display": `'${cfg.theme.fonts.display}', system-ui, sans-serif`,
    "--sw-font-body": `'${cfg.theme.fonts.body}', system-ui, sans-serif`,
  } as React.CSSProperties;
  return <div style={style} className="min-h-dvh bg-surface text-surface-text">{children}</div>;
}
