import { DeferredSection } from '../components/shared';
import {
  MxCanvas,
  MxHero,
  MxPlans,
  MxCapabilityMatrix,
  MxAllPlansInclude,
  MxCostInContext,
  MxHowPricingWorks,
  MxProcurement,
  MxFAQ,
  MxClosing,
} from './components/maximalist';

/**
 * PricingPageContent — maximalist art-directed treatment.
 *
 * Each section claims its own colour mood: oxblood masthead, then four
 * stacked full-bleed plan blocks (bone / mustard / forest / midnight),
 * a cream capability matrix for eye-relief, a forest "what every plan
 * includes" page, a midnight cost-in-context spread, a cream methodology
 * page, an oxblood procurement page, a cream Q&A, and an ink closer.
 * Reference register: Pentagram, 032c, Wallpaper editorial spreads.
 *
 * Scoped entirely under `.mx-page` (MxCanvas); the dark `mk-page-bg`
 * marketing canvas and shared `SystemMarketingPrimitives` are untouched.
 */
export default function PricingPageContent() {
  return (
    <MxCanvas>
      <MxHero />

      <DeferredSection minHeight={600}>
        <MxPlans />
      </DeferredSection>

      <DeferredSection minHeight={780}>
        <MxCapabilityMatrix />
      </DeferredSection>

      <DeferredSection minHeight={620}>
        <MxAllPlansInclude />
      </DeferredSection>

      <DeferredSection minHeight={700}>
        <MxCostInContext />
      </DeferredSection>

      <DeferredSection minHeight={620}>
        <MxHowPricingWorks />
      </DeferredSection>

      <DeferredSection minHeight={680}>
        <MxProcurement />
      </DeferredSection>

      <DeferredSection minHeight={780}>
        <MxFAQ />
      </DeferredSection>

      <DeferredSection minHeight={620}>
        <MxClosing />
      </DeferredSection>
    </MxCanvas>
  );
}
