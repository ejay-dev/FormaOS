import {
  DsContainer,
  DsFolio,
  DsFolioHead,
  DsDisplay,
  DsLead,
  DsMeta,
  DsStamp,
  DsSeal,
  DsButton,
  DsPerf,
} from './primitives';

/**
 * DsHero — the dossier cover folio. Photograph-led: the Higgsfield-generated
 * "wax-sealed manila dossier on walnut desk" image sits as the masthead
 * plate at the top, with a stamped, watermarked title block below.
 */
export function DsHero() {
  const today = new Date();
  const edition = today.toLocaleDateString('en-AU', {
    month: 'long',
    year: 'numeric',
  });
  const serial = `2026-A-${(Math.floor(Math.random() * 900) + 100).toString()}`;

  return (
    <DsContainer width="wide" className="pt-10">
      <DsFolio
        tabLabel="§ COVER / FY26 ED."
        tabTone="wax"
        watermark="DOSSIER"
        watermarkVariant="type"
      >
        {/* Top-of-folio metadata grid — typewriter labels, classification stamps */}
        <DsFolioHead
          strong
          meta={
            <>
              <DsMeta>
                <strong>FORMAOS</strong> &middot; COMMERCIAL DOSSIER
              </DsMeta>
              <DsMeta className="hidden sm:inline-flex">
                CLASS / <strong>COMMERCIAL-IN-CONFIDENCE</strong>
              </DsMeta>
            </>
          }
          serial={serial}
        />

        {/* Two-column: photograph plate left, title block right */}
        <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[1.05fr_1fr] lg:items-center">
          <figure className="relative">
            <img
              src="/marketing-media/pricing-dossier-hero.jpg"
              alt="A weathered manila compliance dossier on a dark walnut desk, with a deep red wax seal partially intact on the cover."
              fetchPriority="high"
              decoding="async"
              className="block w-full border border-[color:var(--ds-rule-strong)] shadow-[0_8px_28px_rgba(29,26,20,0.18)]"
            />
            {/* APPROVED stamp overlay — rotated, sitting on the figure */}
            <div className="pointer-events-none absolute -top-3 right-4 sm:right-8 lg:right-10">
              <DsStamp tone="red" size="lg">
                APPROVED &middot; {edition.split(' ')[1] ?? edition}
              </DsStamp>
            </div>
            <div className="pointer-events-none absolute -bottom-3 left-4 sm:left-6">
              <DsStamp tone="blue" rotation="right">
                FILE COPY
              </DsStamp>
            </div>
            <figcaption className="ds-caption mt-3">
              FIG. 01 &mdash; FormaOS commercial dossier, FY26 edition.
              Photograph commissioned via Higgsfield (model: nano_banana_flash).
            </figcaption>
          </figure>

          <div>
            <DsMeta className="block">RE: PRICING &amp; PLANS &middot; {edition.toUpperCase()}</DsMeta>
            <DsDisplay as="h1" size="xl" className="mt-4">
              Compliance, <em>priced like infrastructure.</em>
            </DsDisplay>
            <DsLead dropCap className="mt-6">
              Most enterprise compliance pricing is opaque on purpose. Vendors
              hide their tiers behind <em>"request a quote"</em> so they can
              read the room and shape the number to fit. FormaOS publishes its
              scope ladder in full &mdash; compliance buying should not be a
              negotiation about whether you deserve evidence trails.
            </DsLead>

            <DsPerf className="mt-8 mb-6" />

            <div className="flex flex-wrap items-center gap-4">
              <DsButton href="#pricing-table" variant="solid">
                View Pricing &rarr;
              </DsButton>
              <DsButton
                href="/contact?type=compliance-plan&source=pricing_hero"
                variant="wax"
              >
                Get Compliance Plan
              </DsButton>
              <DsSeal>
                Seal
                <br />
                FY26
              </DsSeal>
            </div>

            <DsPerf className="mt-8 mb-3" />
            <DsMeta>
              ENCL. /{' '}
              <strong>
                THE FOUR PLANS &middot; CAPABILITY MATRIX &middot; PROCUREMENT
                ANNEX &middot; INTERROGATORIES
              </strong>
            </DsMeta>
          </div>
        </div>
      </DsFolio>
    </DsContainer>
  );
}
