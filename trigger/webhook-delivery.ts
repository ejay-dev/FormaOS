import { task } from '@trigger.dev/sdk';
import { runWebhookDeliveryJob } from './http';

export const webhookDeliveryTask = task({
  id: 'webhook-delivery',
  run: async (payload: { deliveryId: string }) => {
    const result = await runWebhookDeliveryJob(payload.deliveryId);

    if (result.ok === false && result.status === 'failed') {
      throw new Error(result.error ?? 'Webhook delivery failed');
    }

    return result;
  },
});
