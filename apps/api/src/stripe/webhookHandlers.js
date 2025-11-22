import { getStripeSync } from './stripeClient.js';

export class WebhookHandlers {
  static async processWebhook(payload, signature, uuid) {
    // Validate payload is a Buffer
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means Fastify parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route uses rawBody: true content type parser.'
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature, uuid);
  }
}
