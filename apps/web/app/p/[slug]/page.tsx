import { notFound } from "next/navigation";
import { getProgramme, isModuleEnabled } from "@sw/programme-config";
import { ProgrammeTheme } from "@/components/ProgrammeTheme";

/**
 * Programme home. Everything on this page is driven by ProgrammeConfig:
 * theme, terminology, bilingual labels, and which module entry points render.
 */
export default async function ProgrammePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cfg = getProgramme(slug);
  if (!cfg) notFound();

  const moduleCards: Array<{ module: string; title: string; body: string }> = [
    { module: "registration", title: "Join up", body: `Register as a ${cfg.terminology.participant.en}.` },
    { module: "enrolment", title: "School enrolment", body: `Schools enrol their ${cfg.terminology.participant.en}s.` },
    { module: "sessions", title: cfg.terminology.session.en, body: "Schedule and run sessions." },
    { module: "attendance", title: "Attendance", body: "Record who took part (works offline)." },
    { module: "movement_logging", title: "Movement", body: "Log movement measures defined for this programme." },
    { module: "surveys", title: "Surveys", body: "Baseline, pulse and endpoint surveys." },
    { module: "reporting", title: "Reporting", body: "Participation and movement reporting." },
    { module: "issue_reporting", title: "Report an issue", body: "Equipment, technical or other problems." },
  ];

  return (
    <ProgrammeTheme cfg={cfg}>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-sm font-medium uppercase tracking-wide opacity-70">Sport Waikato</p>
        <h1 className="mt-1 font-display text-5xl font-bold text-primary">{cfg.name}</h1>
        <p className="mt-3 max-w-prose text-lg">{cfg.description.en}</p>
        {cfg.description.mi && <p className="mt-1 max-w-prose opacity-80">{cfg.description.mi}</p>}

        <ul className="mt-10 grid gap-3 sm:grid-cols-2">
          {moduleCards.filter((c) => isModuleEnabled(cfg, c.module)).map((c) => (
            <li key={c.module} className="rounded-theme border border-current/15 p-5">
              <h2 className="font-display text-xl font-semibold">{c.title}</h2>
              <p className="mt-1 text-sm opacity-80">{c.body}</p>
            </li>
          ))}
        </ul>

        <section aria-labelledby="help" className="mt-12 rounded-theme bg-primary p-5 text-primary-contrast">
          <h2 id="help" className="font-display text-lg font-semibold">Need help?</h2>
          <p className="mt-1 text-sm">{cfg.support.safeguardingInfo.en}</p>
          {cfg.support.safeguardingInfo.mi && <p className="mt-1 text-sm opacity-90">{cfg.support.safeguardingInfo.mi}</p>}
          <p className="mt-2 text-sm">Contact: {cfg.support.contactEmail}</p>
        </section>
      </div>
    </ProgrammeTheme>
  );
}

export function generateStaticParams() {
  return [{ slug: "karawhiua" }, { slug: "freewheeler" }, { slug: "gamefit" }, { slug: "tap-town" }];
}
