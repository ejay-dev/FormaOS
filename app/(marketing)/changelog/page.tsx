import type { Metadata } from 'next';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { CompactHero } from '@/components/motion/CompactHero';

export const dynamic = 'force-static';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

export const metadata: Metadata = {
  title: 'Changelog — FormaOS',
  description:
    'Stay up to date with the latest improvements, new features, and fixes shipped by the FormaOS team.',
  alternates: { canonical: `${siteUrl}/changelog` },
  openGraph: {
    title: 'Changelog | FormaOS',
    description: 'New features, improvements, and fixes from the FormaOS team.',
    type: 'website',
    url: `${siteUrl}/changelog`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Changelog | FormaOS',
    description: 'New features, improvements, and fixes from the FormaOS team.',
  },
};

const ENTRIES = [
  {
    version: '1.8',
    date: '2026-02-14',
    tag: 'Feature',
    tagColor: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    title: 'Multi-framework control mapping',
    items: [
      'Controls can now be mapped across multiple frameworks simultaneously — ISO 27001, SOC 2, NDIS Practice Standards, Essential Eight, and custom frameworks in a single view.',
      'Automated gap analysis flags controls that are compliant in one framework but open in another.',
      'Framework coverage dashboard added to the governance overview.',
    ],
  },
  {
    version: '1.7',
    date: '2026-01-28',
    tag: 'Improvement',
    tagColor: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    title: 'Evidence chain defensibility upgrade',
    items: [
      'Evidence records now display full chain-of-custody history: uploaded by, verified by, approval timestamp, and linked control.',
      'Bulk evidence export now generates a signed manifest with SHA-256 checksums for each artifact.',
      'Auditor view added — share a read-only evidence room with external reviewers without exposing operational data.',
    ],
  },
  {
    version: '1.6',
    date: '2026-01-10',
    tag: 'Feature',
    tagColor: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    title: 'Real-time posture dashboard',
    items: [
      'Live compliance posture score updated automatically as tasks complete and evidence is verified.',
      'Risk heat map by framework domain highlights where attention is needed before an audit.',
      'Executive summary export available as PDF or structured JSON for board reporting.',
    ],
  },
  {
    version: '1.5',
    date: '2025-12-19',
    tag: 'Fix',
    tagColor: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    title: 'Notifications and task assignment stability',
    items: [
      'Fixed a race condition where task assignment notifications could arrive before the task was visible in the assignee\'s queue.',
      'Deadline reminders now respect the organization\'s local timezone setting.',
      'Fixed bulk task re-assignment not triggering workflow automation rules.',
    ],
  },
  {
    version: '1.4',
    date: '2025-11-30',
    tag: 'Feature',
    tagColor: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    title: 'Workflow automation engine',
    items: [
      'Compliance controls can now trigger automated task creation when a threshold condition is met.',
      'Escalation rules: overdue tasks escalate automatically to the next owner level after a configurable window.',
      'Audit log now records all automation rule triggers with full context.',
    ],
  },
  {
    version: '1.3',
    date: '2025-10-15',
    tag: 'Improvement',
    tagColor: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    title: 'NDIS Practice Standards deep integration',
    items: [
      'Pre-built NDIS module now covers all 7 Practice Standard Groups with 34 Quality Indicators mapped to controls.',
      'NDIS audit preparation checklist generates automatically from your current control and evidence status.',
      'Worker registration verification workflow added for NDIS worker screening compliance.',
    ],
  },
] as const;

function TagBadge({ tag, className }: { tag: string; className: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      {tag}
    </span>
  );
}

export default function ChangelogPage() {
  return (
    <MarketingPageShell>
      <CompactHero
        title="Changelog"
        description="New features, improvements, and fixes shipped by the FormaOS team. Delivered continuously."
        topColor="cyan"
        bottomColor="blue"
      />

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative">
          {/* Timeline spine */}
          <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-cyan-500/40 via-white/10 to-transparent" />

          <div className="space-y-14 pl-8">
            {ENTRIES.map((entry) => (
              <article key={entry.version} className="relative">
                {/* Timeline dot */}
                <div className="absolute -left-[33px] top-1.5 h-3 w-3 rounded-full bg-canvas-800 ring-2 ring-cyan-500/60" />

                {/* Date and version */}
                <div className="mb-3 flex items-center gap-3">
                  <time
                    dateTime={entry.date}
                    className="text-xs font-mono text-slate-500"
                  >
                    {new Date(entry.date).toLocaleDateString('en-AU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                  <span className="text-xs text-slate-600">v{entry.version}</span>
                </div>

                {/* Card */}
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <TagBadge tag={entry.tag} className={entry.tagColor} />
                    <h2 className="text-base font-bold text-white">{entry.title}</h2>
                  </div>
                  <ul className="space-y-2.5">
                    {entry.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500/50" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Subscribe nudge */}
        <div className="mt-16 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 text-center">
          <p className="text-sm font-semibold text-white">Stay in the loop</p>
          <p className="mt-2 text-sm text-slate-400">
            Subscribe to release notes or follow us for product updates.
          </p>
          <a
            href="/contact"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-400 ring-1 ring-cyan-500/20 transition hover:bg-cyan-500/20"
          >
            Get release notes →
          </a>
        </div>
      </div>
    </MarketingPageShell>
  );
}
