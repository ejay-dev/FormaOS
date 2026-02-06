import { loadFrameworkPack } from '../loadFrameworkPack'

function createAdminStub() {
  const calls: Array<{ table: string; payload: any; onConflict?: string }> = []

  return {
    calls,
    from: (table: string) => ({
      upsert: (payload: any, options?: { onConflict?: string }) => {
        calls.push({ table, payload, onConflict: options?.onConflict })
        return {
          select: () => ({
            maybeSingle: async () => ({ data: { id: 'framework-id', slug: payload.slug } }),
          }),
        }
      },
    }),
  }
}

describe('loadFrameworkPack', () => {
  test('loads YAML framework metadata and upserts framework', async () => {
    const yamlPack = `
framework:
  name: NIST Cybersecurity Framework
  slug: nist-csf
  version: "2.0"
  description: Example metadata
  is_active: true
`

    const admin = createAdminStub()
    const result = await loadFrameworkPack(yamlPack, { adminClient: admin as any })

    expect(result.ok).toBe(true)
    expect(admin.calls).toHaveLength(1)
    expect(admin.calls[0].table).toBe('frameworks')
    expect(admin.calls[0].payload.slug).toBe('nist-csf')
  })

  test('returns error when framework metadata is missing', async () => {
    const result = await loadFrameworkPack('{}', { adminClient: createAdminStub() as any })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/framework metadata/i)
    }
  })
})
