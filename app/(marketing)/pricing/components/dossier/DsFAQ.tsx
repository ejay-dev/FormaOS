import { PRICING_FAQS } from '../faq-data';
import {
  DsContainer,
  DsFolio,
  DsFolioHead,
  DsDisplay,
  DsLead,
  DsMeta,
} from './primitives';

/**
 * DsFAQ — "Interrogatories" folio. Every Q&A shown open; questions set as
 * typewriter Qnn / Ann pairs, like depositions in a legal dossier.
 */
export function DsFAQ() {
  return (
    <DsContainer width="wide">
      <DsFolio
        id="questions"
        tabLabel="§ ANNEX D / INTERROGATORIES"
        watermark="Q & A"
      >
        <DsFolioHead
          strong
          meta={
            <>
              <DsMeta><strong>§07</strong> / INTERROGATORIES</DsMeta>
              <DsMeta className="hidden sm:inline-flex">
                {PRICING_FAQS.length} ITEMS &middot; ANSWERED IN FULL
              </DsMeta>
            </>
          }
        />

        <div className="grid items-end gap-8 lg:grid-cols-[1.4fr_1fr] mb-10">
          <DsDisplay as="h2" size="lg">
            Answers for compliance, <em>procurement, and IT.</em>
          </DsDisplay>
          <DsLead>
            The questions FormaOS hears most often, answered in full &mdash;
            written for the people who evaluate compliance infrastructure,
            not for a sales call.
          </DsLead>
        </div>

        <ol className="ds-qa">
          {PRICING_FAQS.map((faq, idx) => (
            <li key={faq.question} className="ds-qa__item">
              <span className="ds-qa__num">
                Q.{String(idx + 1).padStart(2, '0')}
              </span>
              <p className="ds-qa__q">{faq.question}</p>
              <p className="ds-qa__a">{faq.answer}</p>
            </li>
          ))}
        </ol>
      </DsFolio>
    </DsContainer>
  );
}
