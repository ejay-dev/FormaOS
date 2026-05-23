import { CheckCircle2 } from 'lucide-react';

/**
 * KeyFacts — a TLDR / "key facts" block placed near the top of long
 * marketing pages. SSR-rendered (no client component) so it always
 * lands in the initial HTML response.
 *
 * AEO sprint 2026-05-23: AI answer engines (ChatGPT, Perplexity,
 * Claude, Gemini) preferentially cite from short, scannable, factual
 * blocks. A block with concrete claims and the heading "Key facts" or
 * "At a glance" is more likely to be quoted than a wall of marketing
 * paragraphs further down the page.
 */
export interface KeyFactsItem {
  label: string;
  value: string;
}

export interface KeyFactsProps {
  /** Section heading. Defaults to "At a glance". */
  title?: string;
  /** Brief intro sentence under the heading. Keep ≤200 chars. */
  summary: string;
  /** 4–8 atomic facts. Each label is bold, value is the citable claim. */
  facts: KeyFactsItem[];
}

export function KeyFacts({
  title = 'At a glance',
  summary,
  facts,
}: KeyFactsProps) {
  return (
    <section
      aria-labelledby="key-facts-heading"
      className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10"
    >
      <div className="rounded-2xl border border-cyan-300/15 bg-gradient-to-br from-cyan-500/[0.04] via-white/[0.03] to-transparent backdrop-blur-sm p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <CheckCircle2
            className="h-5 w-5 flex-shrink-0 text-cyan-300 mt-1"
            aria-hidden="true"
          />
          <div>
            <h2
              id="key-facts-heading"
              className="text-xl sm:text-2xl font-semibold text-white"
            >
              {title}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
              {summary}
            </p>
          </div>
        </div>
        <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          {facts.map((fact) => (
            <div key={fact.label} className="flex gap-2">
              <dt className="text-sm font-semibold text-white shrink-0">
                {fact.label}:
              </dt>
              <dd className="text-sm text-slate-300 leading-relaxed">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export default KeyFacts;
