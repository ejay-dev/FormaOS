import { DISTINCT_FRAMEWORK_COUNT } from '@/lib/marketing/claims';

/**
 * The strip directly under the homepage hero.
 *
 * It previously ran a row of uppercase letter-spaced pills over a
 * blueprint-grid overlay, with a decorative icon beside each claim — on a
 * phone that collapsed into a tall wall of shouting badges before the
 * visitor had read a single sentence. It also advertised "frameworks
 * supported" next to a mix of framework packs and regulators, which is
 * where the site's conflicting framework counts came from.
 *
 * Frameworks and regulators are now stated separately, in plain words.
 */
const frameworkNames = 'ISO 27001, SOC 2, NDIS Practice Standards and HIPAA';
const regulators = 'the NDIS Commission, AHPRA, ACECQA and ASIC';

export function TrustBar({ className = '' }: { className?: string }) {
  return (
    <section
      className={`relative border-y border-white/[0.08] bg-marketing-bg ${className}`}
    >
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-12">
        <div className="grid gap-6 md:grid-cols-2 md:gap-12">
          <p className="text-base leading-7 text-zinc-300">
            <span className="text-white">
              {DISTINCT_FRAMEWORK_COUNT} frameworks scored out of the box
            </span>
            , including {frameworkNames}.
          </p>
          <p className="text-base leading-7 text-zinc-400">
            Policy and register templates are written against{' '}
            {regulators}, so the language matches what your assessor
            expects to see.
          </p>
        </div>
      </div>
    </section>
  );
}
