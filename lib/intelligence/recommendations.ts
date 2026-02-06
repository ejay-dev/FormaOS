import { detectComplianceGaps } from './gap-detector'

export type ComplianceRecommendation = {
  nextActions: string[]
  evidenceRecommendations: string[]
  automationSuggestions: string[]
}

export async function buildComplianceRecommendations(orgId: string): Promise<ComplianceRecommendation> {
  const gaps = await detectComplianceGaps(orgId)

  const nextActions: string[] = []
  const evidenceRecommendations: string[] = []
  const automationSuggestions: string[] = []

  gaps.missingEvidence.slice(0, 5).forEach((gap) => {
    nextActions.push(`Provide evidence for ${gap.title ?? gap.controlKey}`)
    evidenceRecommendations.push(
      `Capture evidence to satisfy ${gap.required} requirement(s) for ${gap.title ?? gap.controlKey}.`,
    )
  })

  if (gaps.unmappedControls.length) {
    automationSuggestions.push(
      `Map ${gaps.unmappedControls.length} SOC 2 control(s) to NIST CSF and CIS Controls for better coverage visibility.`,
    )
  }

  if (gaps.weakAutomationCoverage.length) {
    automationSuggestions.push(
      `Automate remediation workflows for ${gaps.weakAutomationCoverage.length} control(s) without linked tasks.`,
    )
  }

  if (!nextActions.length) {
    nextActions.push('Maintain current control coverage and schedule periodic reviews.')
  }

  return {
    nextActions,
    evidenceRecommendations,
    automationSuggestions,
  }
}
