import { createSupabaseAdminClient } from '@/lib/supabase/admin';

interface PushToken {
  user_id: string;
  org_id: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  device_name?: string;
}

interface PushNotification {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  actions?: Array<{ action: string; title: string }>;
}

/** Register a push notification token for a user. */
export async function registerPushToken(token: PushToken): Promise<void> {
  const db = createSupabaseAdminClient();

  await db.from('push_tokens').upsert(
    {
      user_id: token.user_id,
      org_id: token.org_id,
      token: token.token,
      platform: token.platform,
      device_name: token.device_name,
      last_used_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,token' },
  );
}

/** Remove a push token (on logout or device removal). */
export async function unregisterPushToken(
  userId: string,
  token: string,
): Promise<void> {
  const db = createSupabaseAdminClient();
  await db
    .from('push_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('token', token);
}

/** Send a push notification to a user. */
export async function sendPush(
  userId: string,
  notification: PushNotification,
): Promise<void> {
  const db = createSupabaseAdminClient();

  const { data: tokens } = await db
    .from('push_tokens')
    .select('token, platform')
    .eq('user_id', userId);

  if (!tokens?.length) return;

  for (const t of tokens) {
    if (t.platform === 'web') {
      await sendWebPush(t.token, notification);
    } else {
      await sendFCMPush(t.token, notification);
    }
  }
}

/** Send push to multiple users. */
export async function sendBulkPush(
  userIds: string[],
  notification: PushNotification,
): Promise<void> {
  const db = createSupabaseAdminClient();

  const { data: tokens } = await db
    .from('push_tokens')
    .select('token, platform')
    .in('user_id', userIds);

  if (!tokens?.length) return;

  await Promise.allSettled(
    tokens.map((t) =>
      t.platform === 'web'
        ? sendWebPush(t.token, notification)
        : sendFCMPush(t.token, notification),
    ),
  );
}

/** Send via FCM HTTP v1 API. */
async function sendFCMPush(
  token: string,
  notification: PushNotification,
): Promise<void> {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const serverKey = process.env.FIREBASE_SERVER_KEY;
  if (!projectId || !serverKey) return;

  await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverKey}`,
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title: notification.title, body: notification.body },
          data: { url: notification.url ?? '/app' },
        },
      }),
    },
  );
}

/** Send via Web Push API. */
async function sendWebPush(
  subscription: string,
  notification: PushNotification,
): Promise<void> {
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  if (!vapidPrivateKey) return;

  // Web Push requires subscription object, stored as JSON string
  try {
    const sub = JSON.parse(subscription);
    const webpush = await import('web-push');
    webpush.setVapidDetails(
      'mailto:support@formaos.com.au',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      vapidPrivateKey,
    );
    await webpush.sendNotification(sub, JSON.stringify(notification));
  } catch {
    // Token may be invalid — will be cleaned up on next registration
  }
}
