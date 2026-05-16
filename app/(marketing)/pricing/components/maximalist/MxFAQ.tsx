import { PRICING_FAQS } from '../faq-data';
import {
  MxBlock,
  MxContainer,
  MxDisplay,
  MxLead,
} from './primitives';

/**
 * MxFAQ — cream block. Editorial Q&A, every answer shown. No accordion
 * (that's a SaaS-app pattern). Each row: huge italic serif Qnn numeral,
 * serif question, sans answer. Three-column on lg+ so density matches
 * the rest of the page.
 */
export function MxFAQ() {
  return (
    <MxBlock tone="cream" id="questions" rail="§07 / Q&A">
      <MxContainer width="full">
        <div className="grid grid-cols-12 items-end gap-6 border-b-[6px] border-[var(--mx-ink)] pb-6 mb-10">
          <div className="col-span-12 lg:col-span-7">
            <p className="mx-eyebrow opacity-70">§07 / QUESTIONS</p>
            <MxDisplay as="h2" size="xl" className="mt-4">
              Answers for compliance, <em>procurement, and IT.</em>
            </MxDisplay>
          </div>
          <div className="col-span-12 lg:col-span-5">
            <MxLead className="text-[var(--mx-ink-mid)]">
              The questions FormaOS hears most often, answered in full
              &mdash; written for the people who evaluate compliance
              infrastructure, not for a sales call.
            </MxLead>
          </div>
        </div>

        <ol className="mx-qa">
          {PRICING_FAQS.map((faq, idx) => (
            <li key={faq.question} className="mx-qa__item">
              <span className="mx-qa__num text-[var(--mx-oxblood)]">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <p className="mx-qa__q">{faq.question}</p>
              <p className="mx-qa__a">{faq.answer}</p>
            </li>
          ))}
        </ol>
      </MxContainer>
    </MxBlock>
  );
}
