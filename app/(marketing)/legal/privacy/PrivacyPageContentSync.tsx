import Link from 'next/link';
import { MarketingPageShell } from '../../components/shared/MarketingPageShell';

const EFFECTIVE_DATE = '16 January 2026';

const sections = [
  { id: 'commitment', title: 'Who we are' },
  { id: 'collection', title: 'Information we collect' },
  { id: 'usage', title: 'How we use information' },
  { id: 'legal-basis', title: 'Legal basis for processing' },
  { id: 'storage', title: 'Storage and security' },
  { id: 'sharing', title: 'Data sharing' },
  { id: 'retention', title: 'Data retention' },
  { id: 'rights', title: 'Your rights' },
  { id: 'breach', title: 'Data breach notification' },
  { id: 'transfers', title: 'International data transfers' },
  { id: 'cookies', title: 'Cookies and tracking' },
  { id: 'updates', title: 'Updates to this policy' },
  { id: 'contact', title: 'Contact' },
];

function Clause({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <div className="mt-3 space-y-4 text-[15px] leading-7 text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPageContentSync() {
  return (
    <MarketingPageShell>
      <div className="mx-auto max-w-6xl px-6 pt-28 pb-24">
        <header className="max-w-3xl border-b border-border pb-8">
          <p className="text-sm text-muted-foreground">
            <Link href="/legal" className="hover:underline">
              Legal
            </Link>
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-[15px] leading-7 text-muted-foreground">
            How FormaOS Pty Ltd collects, uses, stores, and discloses personal
            information, written to the Australian Privacy Principles under the
            Privacy Act 1988 and, where it applies, the GDPR.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Effective {EFFECTIVE_DATE} · Last updated {EFFECTIVE_DATE}
          </p>
        </header>

        <div className="mt-10 gap-12 lg:flex">
          <nav
            aria-label="Contents"
            className="mb-10 shrink-0 lg:sticky lg:top-28 lg:mb-0 lg:h-fit lg:w-64 print:hidden"
          >
            <p className="text-sm font-medium text-foreground">Contents</p>
            <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="hover:text-foreground hover:underline underline-offset-4"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="max-w-[68ch] space-y-10">
            <Clause id="commitment" title="Who we are">
              <p>
                FormaOS Pty Ltd is the data controller for personal information
                processed through the FormaOS platform. For personal information
                that customers upload about their own staff and participants, the
                customer is the controller and FormaOS acts as processor under
                the{' '}
                <Link href="/trust/dpa" className="text-primary hover:underline">
                  Data Processing Agreement
                </Link>
                .
              </p>
              <p>
                Privacy enquiries go to{' '}
                <a
                  href="mailto:privacy@formaos.com.au"
                  className="text-primary hover:underline"
                >
                  privacy@formaos.com.au
                </a>
                .
              </p>
            </Clause>

            <Clause id="collection" title="Information we collect">
              <p className="text-foreground">Information you provide</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>name, email address, and phone number</li>
                <li>organisation and role</li>
                <li>account credentials and multi-factor enrolment</li>
                <li>support requests and other correspondence</li>
              </ul>

              <p className="pt-2 text-foreground">Usage data</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>sign-in timestamps and session activity</li>
                <li>audit log entries for actions taken in the platform</li>
                <li>feature usage patterns</li>
                <li>IP address and device metadata</li>
              </ul>

              <p className="pt-2 text-foreground">Customer data</p>
              <p>
                Data your organisation uploads, including compliance records,
                evidence files, task and incident records, and organisational
                structures. Some of this can include sensitive information about
                participants or clients; treat the platform as an in-scope
                system when you complete your own privacy assessments.
              </p>
            </Clause>

            <Clause id="usage" title="How we use information">
              <p>We use information to:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>provide and operate the platform</li>
                <li>authenticate users and secure accounts</li>
                <li>generate audit logs and compliance records</li>
                <li>respond to enquiries and provide support</li>
                <li>diagnose faults and improve performance</li>
              </ul>
              <p>
                We do not sell personal information and we do not disclose it for
                advertising.
              </p>
            </Clause>

            <Clause id="legal-basis" title="Legal basis for processing">
              <p>
                Where the GDPR or an equivalent regime applies, we rely on one of
                the following:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  <span className="text-foreground">
                    Contractual necessity
                  </span>
                  : providing the service you signed up for
                </li>
                <li>
                  <span className="text-foreground">Legal obligation</span>:
                  regulatory record-keeping and audit trails
                </li>
                <li>
                  <span className="text-foreground">Legitimate interest</span>:
                  securing the platform, preventing abuse, and improving the
                  product without undue impact on your privacy
                </li>
                <li>
                  <span className="text-foreground">Consent</span>, where
                  required, for example analytics cookies or marketing email
                </li>
              </ul>
            </Clause>

            <Clause id="storage" title="Storage and security">
              <p>
                Customer data is hosted in Australia by default on Supabase
                managed PostgreSQL and object storage, delivered through Vercel.
                Protections include AES-256 encryption at rest, TLS 1.3 in
                transit, tenant isolation enforced by database row-level
                security, role-based access control, and append-only audit
                logging that a database trigger prevents from being altered.
              </p>
              <p>
                Administrative access to production is restricted and
                security-relevant actions are recorded. The full technical
                description is on the{' '}
                <Link href="/security" className="text-primary hover:underline">
                  security page
                </Link>{' '}
                and in the{' '}
                <Link
                  href="/trust/data-handling"
                  className="text-primary hover:underline"
                >
                  data handling document
                </Link>
                .
              </p>
            </Clause>

            <Clause id="sharing" title="Data sharing">
              <p>We share information only with:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  sub-processors that host, secure, or support the platform,
                  each listed on the{' '}
                  <Link
                    href="/trust/subprocessors"
                    className="text-primary hover:underline"
                  >
                    sub-processors page
                  </Link>
                </li>
                <li>legal or regulatory authorities where required by law</li>
              </ul>
              <p>
                We never share data for advertising or resale. Advance notice of
                new sub-processors is given in accordance with the applicable
                customer agreement.
              </p>
            </Clause>

            <Clause id="retention" title="Data retention">
              <p>We retain personal information only as long as it is:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>necessary to provide the Services</li>
                <li>
                  required for a legal or regulatory obligation, including
                  sector retention rules our customers are subject to
                </li>
                <li>permitted under the applicable customer agreement</li>
              </ul>
              <p>
                Retention periods are configurable per organisation. On
                termination, customer data can be exported before deletion, and
                written confirmation of deletion is available on request.
              </p>
            </Clause>

            <Clause id="rights" title="Your rights">
              <p>You can ask us to:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>give you access to the personal information we hold</li>
                <li>correct information that is inaccurate or out of date</li>
                <li>delete information, where deletion is lawful</li>
                <li>provide your data in a portable format</li>
                <li>withdraw consent you previously gave</li>
              </ul>
              <p>
                Send requests to{' '}
                <a
                  href="mailto:privacy@formaos.com.au"
                  className="text-primary hover:underline"
                >
                  privacy@formaos.com.au
                </a>
                . If your information sits inside a customer organisation&apos;s
                workspace, we will refer the request to that organisation as
                controller and support them in answering it. If you are not
                satisfied with our response, you can complain to the Office of
                the Australian Information Commissioner.
              </p>
            </Clause>

            <Clause id="breach" title="Data breach notification">
              <p>
                We maintain a documented incident response process covering
                detection, containment, assessment, and disclosure. Where an
                eligible data breach is likely to result in serious harm, we
                notify affected customers and the Office of the Australian
                Information Commissioner in line with the Notifiable Data
                Breaches scheme, and support customers with their own
                notification obligations.
              </p>
              <p>
                The process, including severity classification, is described in
                the{' '}
                <Link
                  href="/trust/incident-response"
                  className="text-primary hover:underline"
                >
                  incident response document
                </Link>
                . Specific notification timeframes are set in your executed
                agreement rather than promised generally on this page.
              </p>
            </Clause>

            <Clause id="transfers" title="International data transfers">
              <p>
                Data is processed in Australia by default. Where a transfer
                outside Australia occurs, for example through a sub-processor,
                it is covered by Standard Contractual Clauses or an equivalent
                safeguard, and the receiving party is listed on the
                sub-processors page with its region.
              </p>
            </Clause>

            <Clause id="cookies" title="Cookies and tracking">
              <p>We use a small number of cookies for:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>authentication</li>
                <li>session management</li>
                <li>performance monitoring</li>
              </ul>
              <p>
                No third-party advertising trackers are used. You can review and
                change your analytics preference at any time on the{' '}
                <Link
                  href="/privacy-settings"
                  className="text-primary hover:underline"
                >
                  privacy settings page
                </Link>
                .
              </p>
            </Clause>

            <Clause id="updates" title="Updates to this policy">
              <p>
                We may update this policy to reflect regulatory, technical, or
                operational change. The effective date at the top of the page
                records the current version, and material changes are announced
                on the website before they take effect.
              </p>
            </Clause>

            <Clause id="contact" title="Contact">
              <p>
                Privacy enquiries:{' '}
                <a
                  href="mailto:privacy@formaos.com.au"
                  className="text-primary hover:underline"
                >
                  privacy@formaos.com.au
                </a>
                . General enquiries:{' '}
                <a
                  href="mailto:support@formaos.com.au"
                  className="text-primary hover:underline"
                >
                  support@formaos.com.au
                </a>{' '}
                or{' '}
                <a
                  href="tel:+61469715062"
                  className="text-primary hover:underline"
                >
                  +61 469 715 062
                </a>
                .
              </p>
              <p>
                Related documents:{' '}
                <Link
                  href="/legal/terms"
                  className="text-primary hover:underline"
                >
                  Terms and Conditions
                </Link>
                ,{' '}
                <Link href="/trust/dpa" className="text-primary hover:underline">
                  Data Processing Agreement
                </Link>
                , and the{' '}
                <Link href="/trust" className="text-primary hover:underline">
                  Trust Center
                </Link>
                .
              </p>
            </Clause>
          </div>
        </div>
      </div>
    </MarketingPageShell>
  );
}
