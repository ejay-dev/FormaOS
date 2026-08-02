import Link from 'next/link';
import { MarketingPageShell } from '../../components/shared/MarketingPageShell';

const EFFECTIVE_DATE = '16 January 2026';

const sections = [
  { id: 'acceptance', title: 'Acceptance of terms' },
  { id: 'description', title: 'Description of services' },
  { id: 'eligibility', title: 'Eligibility and account responsibility' },
  { id: 'acceptable-use', title: 'Acceptable use' },
  { id: 'data-ownership', title: 'Data ownership and customer content' },
  { id: 'confidentiality', title: 'Confidentiality' },
  { id: 'security', title: 'Security and compliance' },
  { id: 'availability', title: 'Service availability' },
  { id: 'fees', title: 'Fees and subscriptions' },
  { id: 'ip', title: 'Intellectual property' },
  { id: 'termination', title: 'Termination' },
  { id: 'liability', title: 'Limitation of liability' },
  { id: 'indemnification', title: 'Indemnification' },
  { id: 'governing-law', title: 'Governing law' },
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

export default function TermsPageContentSync() {
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
            Terms and Conditions
          </h1>
          <p className="mt-4 text-[15px] leading-7 text-muted-foreground">
            These terms govern access to the FormaOS platform, operated by
            FormaOS Pty Ltd. Where you have signed a separate agreement with us,
            that agreement prevails over anything on this page.
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
            <Clause id="acceptance" title="Acceptance of terms">
              <p>
                By accessing or using the FormaOS platform, website, or related
                services (the Services), you agree to be bound by these terms. If
                you do not agree, you may not access or use the Services. If you
                accept these terms on behalf of an organisation, you confirm you
                are authorised to bind that organisation.
              </p>
            </Clause>

            <Clause id="description" title="Description of services">
              <p>
                FormaOS is a compliance operating system. It is used to model
                governance frameworks, manage controls, assign and track
                operational work, and produce audit-ready evidence. Features
                available to you depend on your plan and any executed order
                form.
              </p>
              <p>
                We may change, add, or withdraw features. Where a change
                materially reduces functionality you rely on, we will give
                reasonable notice.
              </p>
            </Clause>

            <Clause
              id="eligibility"
              title="Eligibility and account responsibility"
            >
              <p>You must:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>be authorised to act on behalf of your organisation</li>
                <li>provide accurate and current account information</li>
                <li>keep credentials and multi-factor devices secure</li>
              </ul>
              <p>
                You are responsible for all activity under your account,
                including the actions of users you invite. Tell us promptly if
                you suspect unauthorised access.
              </p>
            </Clause>

            <Clause id="acceptable-use" title="Acceptable use">
              <p>You agree not to:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  use the platform for unlawful, fraudulent, or unauthorised
                  purposes
                </li>
                <li>interfere with system integrity, security, or performance</li>
                <li>reverse engineer, scrape, or resell the platform</li>
                <li>upload malicious code or knowingly harmful data</li>
              </ul>
              <p>
                We may suspend access where use creates a security, legal, or
                operational risk. Where practical, we will contact you before
                suspending.
              </p>
            </Clause>

            <Clause
              id="data-ownership"
              title="Data ownership and customer content"
            >
              <p>
                You retain ownership of all data you upload (Customer Data). You
                grant us a limited licence to process, store, and display that
                data for the sole purpose of providing the Services, and to
                maintain backups and operational continuity.
              </p>
              <p>
                We do not sell Customer Data and we do not claim ownership of
                it. Processing terms, including the roles of controller and
                processor, are set out in the{' '}
                <Link href="/trust/dpa" className="text-primary hover:underline">
                  Data Processing Agreement
                </Link>
                . The third parties that process data on our behalf are listed
                on the{' '}
                <Link
                  href="/trust/subprocessors"
                  className="text-primary hover:underline"
                >
                  sub-processors page
                </Link>
                .
              </p>
            </Clause>

            <Clause id="confidentiality" title="Confidentiality">
              <p>
                Each party will protect confidential information disclosed by
                the other, including business data, technical architecture, and
                proprietary workflows, and will use it only to perform its
                obligations. This obligation survives termination.
              </p>
            </Clause>

            <Clause id="security" title="Security and compliance">
              <p>FormaOS is built for regulated environments. We implement:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>AES-256 encryption at rest and TLS 1.3 in transit</li>
                <li>
                  tenant isolation enforced by database row-level security
                </li>
                <li>role-based access control and multi-factor authentication</li>
                <li>append-only, tamper-evident audit logging</li>
              </ul>
              <p>
                Our security posture is documented at{' '}
                <Link href="/security" className="text-primary hover:underline">
                  formaos.com.au/security
                </Link>
                , and incident handling, including notification, is described in
                the{' '}
                <Link
                  href="/trust/incident-response"
                  className="text-primary hover:underline"
                >
                  incident response document
                </Link>
                . No system can guarantee absolute security, and nothing here is
                a warranty that a security incident will not occur.
              </p>
            </Clause>

            <Clause id="availability" title="Service availability">
              <p>
                We aim for high availability but do not guarantee uninterrupted
                access. Maintenance, updates, and upstream provider events may
                affect the Services. Availability expectations that apply to
                your plan are described on the{' '}
                <Link href="/trust/sla" className="text-primary hover:underline">
                  service level page
                </Link>
                , and contractual commitments, where they exist, sit in your
                executed agreement.
              </p>
            </Clause>

            <Clause id="fees" title="Fees and subscriptions">
              <p>Where fees apply:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>subscription fees are billed in advance</li>
                <li>payments are non-refundable unless required by law</li>
                <li>pricing and plan inclusions may change with notice</li>
              </ul>
              <p>
                Nothing in these terms limits your rights under the Australian
                Consumer Law.
              </p>
            </Clause>

            <Clause id="ip" title="Intellectual property">
              <p>
                All FormaOS software, designs, branding, framework mappings, and
                proprietary processes remain owned by FormaOS Pty Ltd. You may
                not copy, modify, distribute, or create derivative works without
                written permission. Feedback you send us may be used to improve
                the product without obligation to you.
              </p>
            </Clause>

            <Clause id="termination" title="Termination">
              <p>We may suspend or terminate access if:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>these terms are breached</li>
                <li>required payments are not made</li>
                <li>continued use creates legal or operational risk</li>
              </ul>
              <p>
                On termination, access ceases. You can export compliance data,
                evidence, and audit records before your export window closes;
                deletion timing and written confirmation follow your executed
                agreement and the retention terms in the Data Processing
                Agreement.
              </p>
            </Clause>

            <Clause id="liability" title="Limitation of liability">
              <p>
                To the maximum extent permitted by law, FormaOS is not liable
                for indirect, incidental, or consequential loss, including
                business interruption, loss of data, or regulatory penalties
                arising from use of the Services. FormaOS does not provide legal
                or regulatory advice, and use of the platform does not guarantee
                a compliance or audit outcome.
              </p>
              <p>
                Some rights and remedies under the Australian Consumer Law
                cannot be excluded. Where they apply, this clause is read
                subject to them.
              </p>
            </Clause>

            <Clause id="indemnification" title="Indemnification">
              <p>
                You agree to indemnify FormaOS against claims arising from your
                use of the Services, your breach of law or third-party rights,
                and the data or operational decisions you record in the
                platform.
              </p>
            </Clause>

            <Clause id="governing-law" title="Governing law">
              <p>
                These terms are governed by the laws of Australia. Disputes are
                subject to the exclusive jurisdiction of Australian courts.
              </p>
            </Clause>

            <Clause id="contact" title="Contact">
              <p>
                For legal enquiries, contact{' '}
                <a
                  href="mailto:support@formaos.com.au"
                  className="text-primary hover:underline"
                >
                  support@formaos.com.au
                </a>{' '}
                or call{' '}
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
                  href="/legal/privacy"
                  className="text-primary hover:underline"
                >
                  Privacy Policy
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
