import {
  EditorialMasthead,
  EditorialContainer,
  EditorialHeadline,
  EditorialLead,
  EditorialButton,
  EditorialFigure,
  EditorialRule,
} from './primitives';

/**
 * EditorialHero — newspaper-feature opener: nameplate masthead, italic-serif
 * eyebrow, big serif headline ranged left, drop-cap lead, two CTAs, then
 * a wide above-the-fold photograph with a caption rule.
 *
 * No "hero pattern": no centered eyebrow chip, no three-stat row, no glassy
 * card frame, no photo background with vignette overlay. The photo is below
 * the lede, captioned — the way a published feature treats its main image.
 */
export function EditorialHero() {
  const today = new Date();
  const edition = today.toLocaleDateString('en-AU', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <EditorialMasthead
        edition={`No. 01 · ${edition} edition`}
        category="Pricing & Plans"
      />

      <section className="ed-section">
        <EditorialContainer width="wide">
          <div className="grid items-end gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="ed-eyebrow mb-4">A FormaOS report on commercial scope</p>
              <EditorialHeadline as="h1" size="xl" className="mb-6">
                Compliance, priced like <em>infrastructure</em>.
              </EditorialHeadline>
              <EditorialLead dropCap className="mb-7 max-w-2xl">
                Most enterprise compliance pricing is opaque on purpose.
                Vendors hide their tiers behind <em>“request a quote”</em> so
                they can read the room and shape the number to fit. FormaOS
                publishes its scope ladder in full, because compliance buying
                should not be a negotiation about whether you deserve evidence
                trails &mdash; it should be a procurement decision about
                scale.
              </EditorialLead>
              <div className="flex flex-wrap items-center gap-3">
                <EditorialButton href="#pricing-table" variant="solid">
                  Read the four plans &rarr;
                </EditorialButton>
                <EditorialButton
                  href="/contact?type=compliance-plan&source=pricing_hero"
                  variant="ghost"
                >
                  Talk to procurement
                </EditorialButton>
              </div>
            </div>

            <aside className="border-l border-[color:var(--ed-rule-strong)] pl-6 lg:pl-8">
              <p className="ed-eyebrow-caps mb-3">In this edition</p>
              <ol className="space-y-2 text-[0.875rem] leading-snug">
                {[
                  ['01', 'The four plans', '#pricing-table'],
                  ['02', 'Capability matrix', '#capability-matrix'],
                  ['03', 'What every plan includes', '#all-plans-include'],
                  ['04', 'Cost in context', '#cost-in-context'],
                  ['05', 'Pricing methodology', '#pricing-methodology'],
                  ['06', 'Procurement assurance', '#procurement'],
                  ['07', 'Questions', '#questions'],
                  ['08', 'To begin', '#begin'],
                ].map(([num, label, href]) => (
                  <li key={num} className="flex items-baseline gap-3">
                    <span className="ed-section__num-fig shrink-0 w-6 tabular-nums">
                      {num}
                    </span>
                    <a
                      href={href}
                      className="text-[var(--ed-ink)] underline-offset-[3px] hover:underline"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ol>
            </aside>
          </div>

          <EditorialRule strong className="mt-12 mb-8" />

          <EditorialFigure
            src="/marketing-media/pricing.jpg"
            alt=""
            label="01"
            caption="The FormaOS compliance engine, operating across a registered NDIS provider. Photo composition is a placeholder; final imagery commissioned via Higgsfield."
            aspect="21 / 9"
            priority
          />
        </EditorialContainer>
      </section>
    </>
  );
}
