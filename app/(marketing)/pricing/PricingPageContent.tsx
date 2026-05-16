import { DeferredSection } from '../components/shared';
import {
  EditorialCanvas,
  EditorialHero,
  EditorialPlans,
  EditorialCapabilityMatrix,
  EditorialAllPlansInclude,
  EditorialCostComparison,
  EditorialHowPricingWorks,
  EditorialProcurement,
  EditorialFAQ,
  EditorialClosing,
} from './components/editorial';

/**
 * PricingPageContent — editorial / periodical treatment.
 *
 * The pricing page deliberately diverges from the dark `mk-page-bg`
 * marketing canvas used by the rest of the site: it sits on a cream
 * editorial paper canvas (see EditorialCanvas / editorial.css), with
 * serif display type, a numbered section spine, and a printed-feature
 * register meant to read as a procurement document rather than a SaaS
 * pricing template.
 *
 * Nothing about the dark canvas / shared marketing primitives is
 * modified — the editorial canvas neutralises the parent layout's
 * background via `.editorial-page`-scoped CSS so the cream wins, and
 * every other marketing page continues to render dark.
 */
export default function PricingPageContent() {
  return (
    <EditorialCanvas>
      <EditorialHero />

      <DeferredSection minHeight={520}>
        <EditorialPlans />
      </DeferredSection>

      <DeferredSection minHeight={760}>
        <EditorialCapabilityMatrix />
      </DeferredSection>

      <DeferredSection minHeight={520}>
        <EditorialAllPlansInclude />
      </DeferredSection>

      <DeferredSection minHeight={560}>
        <EditorialCostComparison />
      </DeferredSection>

      <DeferredSection minHeight={440}>
        <EditorialHowPricingWorks />
      </DeferredSection>

      <DeferredSection minHeight={500}>
        <EditorialProcurement />
      </DeferredSection>

      <DeferredSection minHeight={700}>
        <EditorialFAQ />
      </DeferredSection>

      <DeferredSection minHeight={440}>
        <EditorialClosing />
      </DeferredSection>
    </EditorialCanvas>
  );
}
