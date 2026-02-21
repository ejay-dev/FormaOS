import { requireFounderAccess } from '@/app/app/admin/access';
import {
  getAdminControlPlaneSnapshot,
  readAdminStreamVersion,
  resolveControlPlaneEnvironment,
} from '@/lib/control-plane/server';

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

export async function GET(request: Request) {
  try {
    await requireFounderAccess();

    const { searchParams } = new URL(request.url);
    const environment = resolveControlPlaneEnvironment(
      searchParams.get('environment') ?? undefined,
    );

    let closed = false;
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let currentVersion = await readAdminStreamVersion(environment);
        let heartbeatAt = Date.now();

        // Emit prelude chunks to reduce buffering risk on some proxies.
        controller.enqueue(encoder.encode('retry: 1500\n\n'));
        controller.enqueue(encoder.encode(encodeSseComment('connected')));

        const pushSnapshot = async () => {
          const snapshot = await getAdminControlPlaneSnapshot({ environment });
          controller.enqueue(encoder.encode(encodeSse(snapshot)));
        };

        await pushSnapshot();

        const interval = setInterval(async () => {
          if (closed) return;

          try {
            const nextVersion = await readAdminStreamVersion(environment);
            if (nextVersion !== currentVersion) {
              currentVersion = nextVersion;
              await pushSnapshot();
              return;
            }

            if (Date.now() - heartbeatAt >= SSE_HEARTBEAT_MS) {
              heartbeatAt = Date.now();
              controller.enqueue(
                encoder.encode(
                  encodeSseEvent('ping', {
                    ts: new Date().toISOString(),
                    stream: 'admin',
                  }),
                ),
              );
            }
          } catch {
            controller.enqueue(
              encoder.encode(
                encodeSse({
                  error: 'stream_update_failed',
                }),
              ),
            );
          }
        }, SSE_POLL_MS);

        request.signal.addEventListener('abort', () => {
          closed = true;
          clearInterval(interval);
          controller.close();
        });
      },
      cancel() {
        closed = true;
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
  } catch {
    return new Response('forbidden', { status: 403 });
  }
}
