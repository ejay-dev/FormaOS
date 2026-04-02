/** Static industry benchmark data for compliance scoring. */

export interface BenchmarkData {
  industry: string;
  framework: string;
  averageScore: number;
  topQuartileScore: number;
  averageTimeToCompliance: number; // months
  averageEvidencePerControl: number;
  commonGaps: string[];
}

export const BENCHMARK_DATA: BenchmarkData[] = [
  {
    industry: 'SaaS',
    framework: 'SOC 2',
    averageScore: 72,
    topQuartileScore: 89,
    averageTimeToCompliance: 6,
    averageEvidencePerControl: 2.3,
    commonGaps: [
      'Access reviews',
      'Change management documentation',
      'Incident response testing',
    ],
  },
  {
    industry: 'Healthcare',
    framework: 'HIPAA',
    averageScore: 68,
    topQuartileScore: 85,
    averageTimeToCompliance: 9,
    averageEvidencePerControl: 3.1,
    commonGaps: ['Risk assessments', 'BAA management', 'PHI access auditing'],
  },
  {
    industry: 'NDIS Provider',
    framework: 'NDIS Practice Standards',
    averageScore: 65,
    topQuartileScore: 82,
    averageTimeToCompliance: 8,
    averageEvidencePerControl: 2.0,
    commonGaps: [
      'Incident reporting timeliness',
      'Participant care plans',
      'Worker screening records',
    ],
  },
  {
    industry: 'Fintech',
    framework: 'PCI-DSS',
    averageScore: 70,
    topQuartileScore: 88,
    averageTimeToCompliance: 7,
    averageEvidencePerControl: 2.8,
    commonGaps: [
      'Network segmentation',
      'Encryption key management',
      'Vulnerability scanning',
    ],
  },
  {
    industry: 'General',
    framework: 'ISO 27001',
    averageScore: 67,
    topQuartileScore: 84,
    averageTimeToCompliance: 10,
    averageEvidencePerControl: 2.5,
    commonGaps: [
      'Risk treatment plans',
      'Internal audit program',
      'Management review records',
    ],
  },
  {
    industry: 'Aged Care',
    framework: 'Aged Care Quality Standards',
    averageScore: 63,
    topQuartileScore: 80,
    averageTimeToCompliance: 9,
    averageEvidencePerControl: 2.2,
    commonGaps: [
      'Clinical governance',
      'Medication management',
      'Dignity of risk documentation',
    ],
  },
];

/** Get benchmark for a specific industry and framework. */
export function getBenchmark(
  industry: string,
  framework?: string,
): BenchmarkData | null {
  const normalized = industry.toLowerCase();
  return (
    BENCHMARK_DATA.find(
      (b) =>
        b.industry.toLowerCase() === normalized ||
        (framework && b.framework.toLowerCase() === framework.toLowerCase()),
    ) ?? null
  );
}

/** Get all benchmarks. */
export function getAllBenchmarks(): BenchmarkData[] {
  return BENCHMARK_DATA;
}

/** Compute where an org's score falls relative to industry benchmark. */
export function getPositionLabel(
  orgScore: number,
  benchmark: BenchmarkData,
): string {
  if (orgScore >= benchmark.topQuartileScore) {
    return `Top 25% of ${benchmark.industry} providers`;
  }
  if (orgScore >= benchmark.averageScore) {
    return `Above average for ${benchmark.industry} (avg: ${benchmark.averageScore}%)`;
  }
  const gap = benchmark.averageScore - orgScore;
  return `${gap} points behind ${benchmark.industry} average (${benchmark.averageScore}%)`;
}
