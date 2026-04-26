import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  getRuntimeSnapshot,
  readRuntimeStreamVersion,
  resolveControlPlaneEnvironment,
} from '@/lib/control-plane/server';
import { createSafeSseWriter } from '@/lib/control-plane/sse';

const SSE_POLL_MS = 500;
const SSE_HEARTBEAT_MS = 20_000;

function encodeSse(payload: unknown) {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

function encodeSseEvent(eventName: string, payload: unknown) {
  return `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
}

function encodeSseComment(comment: string) {
  return `: ${comment}\n\n`;
}

async function resolveContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      userId: null,
      orgId: null,
    };
  }

  const admin = createSupabaseAdminClient();
  const { data: membership } = await admin
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  return {
    userId: user.id,
    orgId: membership?.organization_id ?? null,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const environment = resolveControlPlaneEnvironment(
    searchParams.get('environment') ?? undefined,
  );

  const context = await resolveContext();

  const encoder = new TextEncoder();
  let interval: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const writer = createSafeSseWriter(controller, () => {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      });

      request.signal.addEventListener('abort', writer.close, { once: true });

      if (request.signal.aborted) {
        writer.close();
        return;
      }

      const pushSnapshot = async () => {
        const snapshot = await getRuntimeSnapshot({
          environment,
          context,
          includePrivateFlags: false,
        });
        writer.enqueue(encoder.encode(encodeSse(snapshot)));
      };

      try {
        let currentVersion = (await readRuntimeStreamVersion(environment)).streamVersion;
        let heartbeatAt = Date.now();

        // Emit prelude chunks to reduce buffering risk on some proxies.
        writer.enqueue(encoder.encode('retry: 1500\n\n'));
        writer.enqueue(encoder.encode(encodeSseComment('connected')));

        await pushSnapshot();

        interval = setInterval(async () => {
          if (writer.isClosed()) return;

          try {
            const marker = await readRuntimeStreamVersion(environment);
            if (marker.streamVersion !== currentVersion) {
              currentVersion = marker.streamVersion;
              await pushSnapshot();
              return;
            }

            if (Date.now() - heartbeatAt >= SSE_HEARTBEAT_MS) {
              heartbeatAt = Date.now();
              writer.enqueue(
                encoder.encode(
                  encodeSseEvent('ping', {
                    ts: new Date().toISOString(),
                    stream: 'runtime',
                  }),
                ),
              );
            }
          } catch {
            writer.enqueue(
              encoder.encode(
                encodeSse({
                  error: 'runtime_stream_update_failed',
                }),
              ),
            );
          }
        }, SSE_POLL_MS);
      } catch {
        writer.enqueue(
          encoder.encode(
            encodeSse({
              error: 'runtime_stream_start_failed',
            }),
          ),
        );
        writer.close();
      }
    },
    cancel() {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
