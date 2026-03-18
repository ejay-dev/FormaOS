function getTriggerAppBaseUrl(): string {
  const baseUrl =
    process.env.TRIGGER_APP_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!baseUrl) {
    throw new Error(
      'Trigger task bridge requires TRIGGER_APP_BASE_URL or NEXT_PUBLIC_APP_URL',
    );
  }

  return baseUrl.replace(/\/+$/, '');
}

function getTriggerAuthHeaders(): HeadersInit {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    throw new Error('CRON_SECRET is required for Trigger task bridge');
  }

  return {
    authorization: `Bearer ${cronSecret}`,
    'content-type': 'application/json',
  };
}

async function postTriggerBridge<T>(
  path: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(`${getTriggerAppBaseUrl()}${path}`, {
    method: 'POST',
    headers: getTriggerAuthHeaders(),
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const rawBody = await response.text();
  const data = rawBody ? (JSON.parse(rawBody) as T) : ({} as T);

  if (!response.ok) {
    const error =
      typeof data === 'object' &&
      data &&
      'error' in data &&
      typeof (data as { error?: unknown }).error === 'string'
        ? (data as { error: string }).error
        : `Trigger bridge failed with status ${response.status}`;

    throw new Error(error);
  }

  return data;
}

export function runReportExportJob(jobId: string) {
  return postTriggerBridge<{ ok: boolean; fileUrl?: string; error?: string }>(
    '/api/internal/trigger/report-export',
    { jobId },
  );
}

export function runComplianceExportJob(jobId: string) {
  return postTriggerBridge<{ ok: boolean; fileUrl?: string; error?: string }>(
    '/api/internal/trigger/compliance-export',
    { jobId },
  );
}

export function runEnterpriseExportJob(jobId: string) {
  return postTriggerBridge<{ ok: boolean; downloadUrl?: string; error?: string }>(
    '/api/internal/trigger/enterprise-export',
    { jobId },
  );
}

export function runQueueProcessBatch(batchSize?: number) {
  return postTriggerBridge<
    { success?: boolean; processed?: number; failed?: number; error?: string }
  >('/api/internal/trigger/queue-process', { batchSize });
}

export function runWebhookDeliveryJob(deliveryId: string) {
  return postTriggerBridge<
    { ok: boolean; status?: string; deliveryId?: string; error?: string }
  >('/api/internal/trigger/webhook-delivery', { deliveryId });
}
