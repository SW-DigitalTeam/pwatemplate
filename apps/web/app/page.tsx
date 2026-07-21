import Link from "next/link";
import { programmes } from "@sw/programme-config";

export default function Home() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <p className="text-sm font-medium uppercase tracking-wide opacity-70">Sport Waikato</p>
      <h1 className="mt-1 font-display text-4xl font-bold">Programme platform</h1>
      <p className="mt-3 max-w-prose">
        One foundation, many programmes. Choose a programme to see its configured experience.
      </p>
      <ul className="mt-8 grid gap-3">
        {Object.values(programmes).map((p) => (
          <li key={p.slug}>
            <Link href={`/p/${p.slug}`}
              className="btn block rounded-theme border border-current/15 px-5 py-4 font-medium hover:bg-primary hover:text-primary-contrast focus-visible:bg-primary focus-visible:text-primary-contrast">
              {p.name}
              <span className="mt-1 block text-sm font-normal opacity-75">{p.description.en}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
