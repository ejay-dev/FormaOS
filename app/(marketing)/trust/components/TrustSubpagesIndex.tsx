import Link from 'next/link';

// Static, server-rendered index of every Trust Center sub-page. Each of
// these documents existed in the sitemap but was previously only reachable
// via JS-rendered cards (TrustModules is dynamic({ ssr: false })). For
// crawlers that don't execute JS, and for the human procurement reviewer
// scanning for a specific document, this gives a guaranteed link.
const TRUST_SUBPAGES = [
  {
    href: '/trust/data-handling',
    title: 'Data handling',
    description:
      'Storage, encryption, retention, and deletion of customer data.',
  },
  {
    href: '/trust/dpa',
    title: 'Data Processing Agreement',
    description:
      'GDPR Article 28 and Australian Privacy Act-aligned terms for enterprise customers.',
  },
  {
    href: '/trust/sla',
    title: 'Service Level Agreement',
    description: 'Uptime targets, incident response timelines, and credits.',
  },
  {
    href: '/trust/subprocessors',
    title: 'Sub-processors',
    description: 'Third-party providers that process customer data.',
  },
  {
    href: '/trust/incident-response',
    title: 'Incident response',
    description: 'How FormaOS detects, contains, and discloses incidents.',
  },
  {
    href: '/trust/vendor-assurance',
    title: 'Vendor assurance',
    description: 'Independent assessment plan and assurance artifacts.',
  },
  {
    href: '/trust/procurement',
    title: 'Procurement',
    description:
      'How a review runs: what you receive, how long it takes, and what happens next.',
  },
  {
    href: '/security-review/faq',
    title: 'Security Review FAQ',
    description:
      'Identity, encryption, isolation, hosting, and the capabilities we do not have.',
  },
  {
    href: '/trust/packet',
    title: 'Vendor trust packet',
    description:
      'Bundled review materials covering architecture and assurance.',
  },
] as const;

export function TrustSubpagesIndex() {
  return (
    <section
      aria-labelledby="trust-subpages-heading"
      className="mk-section relative"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2
            id="trust-subpages-heading"
            className="text-3xl sm:text-4xl font-bold text-white"
          >
            Trust Center sections
          </h2>
          <p className="mt-3 text-slate-300 max-w-3xl">
            Every assurance document a procurement team typically asks for,
            written for compliance buyers and security reviewers. Each section
            is a standalone artifact you can share with your team.
          </p>
        </div>

        {/* Plain document list rather than another card grid: this is an
            index, and a reviewer scanning for one filename reads a list
            faster than eight tiles. */}
        <ul className="grid grid-cols-1 gap-x-12 border-t border-white/[0.08] sm:grid-cols-2">
          {TRUST_SUBPAGES.map((item) => (
            <li key={item.href} className="border-b border-white/[0.08]">
              <Link
                href={item.href}
                className="group block py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <h3 className="text-base font-semibold text-white group-hover:underline underline-offset-4">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default TrustSubpagesIndex;
