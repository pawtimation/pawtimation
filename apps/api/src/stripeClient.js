import Stripe from 'stripe';

// Legacy client - uses environment variable if available, otherwise null
// New integrations should use ./stripe/stripeClient.js which uses Replit connection API
const key = process.env.STRIPE_SECRET_KEY;
export const stripe = key ? new Stripe(key, { apiVersion: '2023-10-16' }) : null;

// Export a safe getter that won't throw
export function getStripeClient() {
  if (!stripe) {
    console.warn('Stripe client not initialized - STRIPE_SECRET_KEY not set');
    return null;
  }
  return stripe;
}
