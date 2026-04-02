/** Generate a universal deep link for an entity. */
export function generateDeepLink(entityType: string, entityId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.formaos.com.au';
  const paths: Record<string, string> = {
    task: `/app/tasks/${entityId}`,
    evidence: `/app/evidence/${entityId}`,
    incident: `/app/incidents/${entityId}`,
    visit: `/app/visits/${entityId}`,
    form: `/app/forms/${entityId}`,
    participant: `/app/participants/${entityId}`,
    control: `/app/controls/${entityId}`,
    care_plan: `/app/care-plans/${entityId}`,
    capa: `/app/capa/${entityId}`,
  };

  const path = paths[entityType] ?? `/app/${entityType}/${entityId}`;
  return `${base}${path}`;
}

/** Parse a deep link URL into entity type and ID. */
export function parseDeepLink(
  url: string,
): { entityType: string; entityId: string } | null {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split('/').filter(Boolean);

    // Expected: /app/{entityType}/{entityId}
    if (segments.length >= 3 && segments[0] === 'app') {
      return { entityType: segments[1], entityId: segments[2] };
    }
    return null;
  } catch {
    return null;
  }
}

/** Map entity type to the Capacitor route for mobile deep linking. */
export function getMobileRoute(entityType: string, entityId: string): string {
  return `formaos://app/${entityType}/${entityId}`;
}
