/* Server component on purpose: this is the page's plain-language definition
   of the product, so it has to be in the initial HTML rather than behind a
   client-only chunk. */

const UNIFIES = [
  'Governance structure and framework alignment',
  'Policy, control, and obligation execution',
  'Automated evidence generation and vault',
  'Real-time risk scoring and drift detection',
  'Audit defence with exportable evidence packages',
  'Control ownership across teams and entities',
  'Role-based accountability and access governance',
] as const;

const REPLACES = [
  'No compliance silos',
  'No manual evidence reconciliation',
  'No last-minute audit reconstruction',
  'No undocumented ownership gaps',
] as const;

export function WhatIsFormaOS() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative z-10 mx-auto grid max-w-6xl gap-x-14 gap-y-10 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-12">
        {/* Thesis, left vertical-bar accent */}
        <div className="flex items-start gap-5">
          <span className="mt-1.5 hidden h-14 w-px flex-shrink-0 bg-gradient-to-b from-white/35 to-transparent sm:block" />
          <div>
            <h2 className="font-display text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl">
              An end-to-end compliance operating system.
            </h2>
            <p className="mt-5 text-base leading-7 text-zinc-400">
              Not a GRC checklist tool. Not a document repository. FormaOS is an
              operational layer that enforces compliance as your organisation
              works, with evidence generated automatically.
            </p>

            <ul className="mt-8 space-y-2.5">
              {REPLACES.map((point) => (
                <li
                  key={point}
                  className="flex items-center gap-3 text-sm text-zinc-400"
                >
                  <span className="h-px w-4 flex-shrink-0 bg-zinc-600" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* What it unifies, clean ruled list, no numerals and no icon tiles */}
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
          <p className="border-b border-white/[0.06] px-6 py-4 text-sm font-medium text-zinc-300">
            One operating layer unifies
          </p>
          {UNIFIES.map((label, i) => (
            <div
              key={label}
              className={`px-6 py-3.5 ${
                i > 0 ? 'border-t border-white/[0.05]' : ''
              }`}
            >
              <span className="text-[15px] leading-snug text-zinc-200">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
