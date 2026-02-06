import { ShieldCheck, Layers, CheckCircle2 } from 'lucide-react'
import { getCurrentOrgId, getOrgFrameworkOverview } from '@/lib/frameworks/org-frameworks'
import { getControlMappingSummary } from '@/lib/frameworks/mappings'

export default async function ComplianceFrameworksPage() {
  const orgId = await getCurrentOrgId()
  const frameworks = await getOrgFrameworkOverview(orgId)
  const soc2Enabled = frameworks.find((fw: any) => fw.slug === 'soc2')
  const soc2Mappings = soc2Enabled ? await getControlMappingSummary('soc2') : []

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-100 tracking-tight">Framework Library</h1>
        <p className="text-slate-400 mt-1">
          Enabled frameworks, control coverage, and domain structure for your organization.
        </p>
      </div>

      {frameworks.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-400">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <ShieldCheck className="h-5 w-5 text-slate-300" />
          </div>
          <div className="mt-4 text-sm font-semibold text-slate-200">No frameworks enabled</div>
          <div className="mt-1 text-xs text-slate-400">
            Select frameworks during onboarding or contact support to enable additional packs.
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {frameworks.map((framework: any) => (
            <div
              key={framework.slug}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--panel-2))] to-[hsl(var(--panel-2))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                    <Layers className="h-4 w-4 text-sky-300" />
                    <span>Enabled framework</span>
                  </div>
                  <h2 className="mt-2 text-xl font-semibold text-slate-100">
                    {framework.name}
                  </h2>
                  {framework.description ? (
                    <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                      {framework.description}
                    </p>
                  ) : null}
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-right">
                  <div className="text-xs text-slate-400">Controls</div>
                  <div className="text-lg font-semibold text-slate-100">
                    {framework.controlCount}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {framework.domains.length === 0 ? (
                  <span className="text-xs text-slate-500">No domains registered yet.</span>
                ) : (
                  framework.domains.map((domain: any) => (
                    <span
                      key={domain.id}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
                    >
                      <span>{domain.name}</span>
                      <span className="text-slate-500">{domain.controlCount}</span>
                    </span>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {soc2Enabled && soc2Mappings.length ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            <span>SOC 2 Mapping Coverage</span>
          </div>
          <h3 className="mt-2 text-lg font-semibold text-slate-100">Multi-framework control view</h3>
          <p className="mt-1 text-sm text-slate-400">
            SOC 2 controls mapped to NIST CSF and CIS Controls.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[640px] w-full text-sm">
              <thead className="border-b border-white/10 text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-left">Control</th>
                  <th className="px-3 py-2 text-left">Mapped Frameworks</th>
                  <th className="px-3 py-2 text-left">Coverage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {soc2Mappings.map((mapping) => (
                  <tr key={mapping.controlId} className="hover:bg-white/5">
                    <td className="px-3 py-3">
                      <div className="text-sm font-semibold text-slate-100">{mapping.controlCode}</div>
                      <div className="text-xs text-slate-400">{mapping.controlTitle}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        {mapping.mappings.map((item, index) => (
                          <span
                            key={`${item.frameworkSlug}-${index}`}
                            className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300"
                          >
                            {item.frameworkSlug}: {item.reference}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded-full bg-white/10">
                          <div
                            className="h-2 rounded-full bg-emerald-400"
                            style={{ width: `${mapping.coverageScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-200">
                          {mapping.coverageScore}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  )
}
