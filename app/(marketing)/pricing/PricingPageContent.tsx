import { DeferredSection } from '../components/shared';
import {
  DsCanvas,
  DsHero,
  DsPlans,
  DsCapabilityMatrix,
  DsAllPlansInclude,
  DsCostInContext,
  DsHowPricingWorks,
  DsProcurement,
  DsFAQ,
  DsClosing,
} from './components/dossier';

/**
 * PricingPageContent — dossier / document-as-artwork treatment.
 *
 * Each section is staged as a folio in a stamped, watermarked commercial
 * dossier: file-folder tabs, typewriter serial numbers, rubber-stamp
 * accents, ghosted watermarks, wax seals, perforated rules, redacted text.
 * The hero plate is a real Higgsfield-generated photograph of a wax-sealed
 * manila dossier; the procurement annex carries a Higgsfield "APPROVED"
 * rubber-stamp macro.
 *
 * Scoped entirely under `.ds-page` (DsCanvas); the dark marketing canvas
 * and shared `SystemMarketingPrimitives` are untouched.
 */
export default function PricingPageContent() {
  return (
    <DsCanvas>
      <DsHero />

      <DeferredSection minHeight={700}>
        <DsPlans />
      </DeferredSection>

      <DeferredSection minHeight={760}>
        <DsCapabilityMatrix />
      </DeferredSection>

      <DeferredSection minHeight={520}>
        <DsAllPlansInclude />
      </DeferredSection>

      <DeferredSection minHeight={620}>
        <DsCostInContext />
      </DeferredSection>

      <DeferredSection minHeight={540}>
        <DsHowPricingWorks />
      </DeferredSection>

      <DeferredSection minHeight={700}>
        <DsProcurement />
      </DeferredSection>

      <DeferredSection minHeight={760}>
        <DsFAQ />
      </DeferredSection>

      <DeferredSection minHeight={560}>
        <DsClosing />
      </DeferredSection>
    </DsCanvas>
  );
}
