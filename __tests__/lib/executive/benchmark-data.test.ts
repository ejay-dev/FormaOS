import {
  BENCHMARK_DATA,
  getBenchmark,
  getAllBenchmarks,
  getPositionLabel,
  type BenchmarkData,
} from '@/lib/executive/benchmark-data';

describe('BENCHMARK_DATA', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(BENCHMARK_DATA)).toBe(true);
    expect(BENCHMARK_DATA.length).toBeGreaterThan(0);
  });

  it.each(BENCHMARK_DATA)(
    'entry for $industry/$framework has valid shape',
    (entry) => {
      expect(typeof entry.industry).toBe('string');
      expect(typeof entry.framework).toBe('string');
      expect(typeof entry.averageScore).toBe('number');
      expect(typeof entry.topQuartileScore).toBe('number');
      expect(entry.topQuartileScore).toBeGreaterThan(entry.averageScore);
      expect(typeof entry.averageTimeToCompliance).toBe('number');
      expect(entry.averageTimeToCompliance).toBeGreaterThan(0);
      expect(typeof entry.averageEvidencePerControl).toBe('number');
      expect(entry.averageEvidencePerControl).toBeGreaterThan(0);
      expect(Array.isArray(entry.commonGaps)).toBe(true);
      expect(entry.commonGaps.length).toBeGreaterThan(0);
    },
  );

  it('contains expected industries', () => {
    const industries = BENCHMARK_DATA.map((b) => b.industry);
    expect(industries).toContain('SaaS');
    expect(industries).toContain('Healthcare');
    expect(industries).toContain('NDIS Provider');
    expect(industries).toContain('Fintech');
    expect(industries).toContain('General');
    expect(industries).toContain('Aged Care');
  });

  it('has unique industry entries', () => {
    const industries = BENCHMARK_DATA.map((b) => b.industry);
    expect(new Set(industries).size).toBe(industries.length);
  });

  it('scores are between 0 and 100', () => {
    for (const entry of BENCHMARK_DATA) {
      expect(entry.averageScore).toBeGreaterThanOrEqual(0);
      expect(entry.averageScore).toBeLessThanOrEqual(100);
      expect(entry.topQuartileScore).toBeGreaterThanOrEqual(0);
      expect(entry.topQuartileScore).toBeLessThanOrEqual(100);
    }
  });
});

describe('getBenchmark', () => {
  it('finds SaaS by industry name', () => {
    const result = getBenchmark('SaaS');
    expect(result).not.toBeNull();
    expect(result!.industry).toBe('SaaS');
    expect(result!.framework).toBe('SOC 2');
  });

  it('is case-insensitive for industry', () => {
    expect(getBenchmark('saas')).not.toBeNull();
    expect(getBenchmark('SAAS')).not.toBeNull();
    expect(getBenchmark('Saas')).not.toBeNull();
  });

  it('finds Healthcare', () => {
    const result = getBenchmark('Healthcare');
    expect(result).not.toBeNull();
    expect(result!.framework).toBe('HIPAA');
  });

  it('finds by framework when provided', () => {
    const result = getBenchmark('anything', 'PCI-DSS');
    expect(result).not.toBeNull();
    expect(result!.industry).toBe('Fintech');
  });

  it('is case-insensitive for framework', () => {
    expect(getBenchmark('x', 'pci-dss')).not.toBeNull();
    expect(getBenchmark('x', 'HIPAA')).not.toBeNull();
  });

  it('returns null for unknown industry/framework', () => {
    expect(getBenchmark('NonExistent')).toBeNull();
    expect(getBenchmark('x', 'UnknownFramework')).toBeNull();
  });

  it('finds NDIS Provider', () => {
    const result = getBenchmark('NDIS Provider');
    expect(result).not.toBeNull();
    expect(result!.framework).toBe('NDIS Practice Standards');
  });

  it('finds Aged Care', () => {
    const result = getBenchmark('Aged Care');
    expect(result).not.toBeNull();
    expect(result!.framework).toBe('Aged Care Quality Standards');
  });
});

describe('getAllBenchmarks', () => {
  it('returns all benchmark entries', () => {
    const all = getAllBenchmarks();
    expect(all).toBe(BENCHMARK_DATA);
    expect(all.length).toBe(BENCHMARK_DATA.length);
  });
});

describe('getPositionLabel', () => {
  const saasBenchmark: BenchmarkData = {
    industry: 'SaaS',
    framework: 'SOC 2',
    averageScore: 72,
    topQuartileScore: 89,
    averageTimeToCompliance: 6,
    averageEvidencePerControl: 2.3,
    commonGaps: [],
  };

  it('returns top 25% label when score >= topQuartileScore', () => {
    expect(getPositionLabel(95, saasBenchmark)).toBe(
      'Top 25% of SaaS providers',
    );
    expect(getPositionLabel(89, saasBenchmark)).toBe(
      'Top 25% of SaaS providers',
    );
  });

  it('returns above average label when score >= averageScore', () => {
    const label = getPositionLabel(80, saasBenchmark);
    expect(label).toBe('Above average for SaaS (avg: 72%)');
  });

  it('returns above average at exactly average score', () => {
    const label = getPositionLabel(72, saasBenchmark);
    expect(label).toBe('Above average for SaaS (avg: 72%)');
  });

  it('returns gap label when score < averageScore', () => {
    const label = getPositionLabel(60, saasBenchmark);
    expect(label).toBe('12 points behind SaaS average (72%)');
  });

  it('handles zero score', () => {
    const label = getPositionLabel(0, saasBenchmark);
    expect(label).toBe('72 points behind SaaS average (72%)');
  });

  it('works with different benchmark data', () => {
    const healthcareBenchmark = getBenchmark('Healthcare')!;
    expect(getPositionLabel(90, healthcareBenchmark)).toBe(
      'Top 25% of Healthcare providers',
    );
    expect(getPositionLabel(70, healthcareBenchmark)).toBe(
      'Above average for Healthcare (avg: 68%)',
    );
    expect(getPositionLabel(50, healthcareBenchmark)).toBe(
      '18 points behind Healthcare average (68%)',
    );
  });
});
