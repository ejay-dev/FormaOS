import { getAvailableFrameworks } from '../framework-registry'

const mockFlags = {
  enableFrameworkEngine: false,
}

const mockAdmin = {
  from: jest.fn(),
}

jest.mock('@/lib/feature-flags', () => ({
  getServerSideFeatureFlags: () => mockFlags,
}))

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => mockAdmin,
}))

jest.mock('../framework-installer', () => ({
  ensureFrameworkPacksInstalled: () => Promise.resolve(),
}))

describe('framework-registry', () => {
  beforeEach(() => {
    mockAdmin.from.mockReset()
    mockFlags.enableFrameworkEngine = false
  })

  test('returns empty array when feature flag is disabled', async () => {
    const frameworks = await getAvailableFrameworks()
    expect(frameworks).toEqual([])
    expect(mockAdmin.from).not.toHaveBeenCalled()
  })

  test('returns frameworks when feature flag is enabled', async () => {
    mockFlags.enableFrameworkEngine = true
    const query = {
      select: jest.fn(),
      order: jest.fn(),
    }
    query.select.mockReturnValue(query)
    query.order.mockResolvedValue({
      data: [
        {
          id: 'fw-1',
          name: 'NIST Cybersecurity Framework',
          slug: 'nist-csf',
          version: '2.0',
          description: null,
          is_active: true,
        },
      ],
      error: null,
    })

    mockAdmin.from.mockReturnValue(query)

    const frameworks = await getAvailableFrameworks()
    expect(frameworks).toHaveLength(1)
    expect(frameworks[0].slug).toBe('nist-csf')
  })
})
