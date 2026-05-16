import { PRICING_FAQS } from '../faq-data';
import {
  EditorialSection,
  EditorialHeadline,
  EditorialLead,
} from './primitives';

/**
 * EditorialFAQ — editorial Q&A, all answers shown open. No accordion;
 * an accordion is a SaaS-app pattern, not an editorial one. Reads like
 * the back-page Q&A column of a trade publication.
 */
export function EditorialFAQ() {
  return (
    <EditorialSection
      id="questions"
      num="07"
      label="Questions"
      width="wide"
    >
      <div className="mb-10 max-w-3xl">
        <EditorialHeadline as="h2" size="lg" className="mb-5">
          Answers for compliance, <em>procurement, and IT.</em>
        </EditorialHeadline>
        <EditorialLead>
          The questions FormaOS hears most often, answered in full. Written
          for the people who actually evaluate compliance infrastructure
          &mdash; not for a sales call.
        </EditorialLead>
      </div>

      <ol className="ed-qa">
        {PRICING_FAQS.map((faq, idx) => (
          <li key={faq.question} className="ed-qa__item">
            <div>
              <span className="ed-qa__q-num">Q {String(idx + 1).padStart(2, '0')}</span>
              <p className="ed-qa__q">{faq.question}</p>
            </div>
            <p className="ed-qa__a">{faq.answer}</p>
          </li>
        ))}
      </ol>
    </EditorialSection>
  );
}
