import { getEvidenceSuggestions } from '../evidence-suggestions'
import type { FrameworkControlRow } from '../types'

describe('getEvidenceSuggestions', () => {
  test('uses defaults when suggestions are missing', () => {
    const control: FrameworkControlRow = {
      id: '1',
      framework_id: 'fw',
      domain_id: 'd1',
      control_code: 'TEST-1',
      title: 'Test control',
      summary_description: null,
      implementation_guidance: null,
      default_risk_level: 'high',
      review_frequency_days: null,
    }

    const result = getEvidenceSuggestions(control)
    expect(result.evidenceTypes.length).toBeGreaterThan(0)
    expect(result.taskTemplates.length).toBeGreaterThan(0)
    expect(result.reviewCadenceDays).toBeGreaterThan(0)
  })

  test('respects explicit suggestions', () => {
    const control: FrameworkControlRow = {
      id: '1',
      framework_id: 'fw',
      domain_id: 'd1',
      control_code: 'TEST-2',
      title: 'Test control',
      summary_description: null,
      implementation_guidance: null,
      default_risk_level: 'low',
      review_frequency_days: 30,
      suggested_evidence_types: ['Audit log'],
      suggested_automation_triggers: ['control_failed'],
      suggested_task_templates: [{ title: 'Do thing', description: 'desc', priority: 'high' }],
    }

    const result = getEvidenceSuggestions(control)
    expect(result.evidenceTypes).toEqual(['Audit log'])
    expect(result.automationTriggers).toEqual(['control_failed'])
    expect(result.taskTemplates[0].title).toBe('Do thing')
    expect(result.reviewCadenceDays).toBe(30)
  })
})
