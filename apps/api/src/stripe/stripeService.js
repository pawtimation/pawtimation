import { getUncachableStripeClient } from './stripeClient.js';
import { stripeStorage } from './stripeStorage.js';

/**
 * StripeService: Handles direct Stripe API operations
 * Pattern: Use Stripe client for write operations, storage for read operations
 */
export class StripeService {
  // Create customer in Stripe
  async createCustomer(email, businessId, businessName) {
    const stripe = await getUncachableStripeClient();
    return await stripe.customers.create({
      email,
      metadata: { 
        businessId,
        businessName
      },
    });
  }

  // Create checkout session for plan upgrade
  async createCheckoutSession(customerId, priceId, successUrl, cancelUrl, businessId) {
    const stripe = await getUncachableStripeClient();
    return await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        businessId,
      },
      subscription_data: {
        metadata: {
          businessId,
        },
      },
    });
  }

  // Create customer portal session
  async createCustomerPortalSession(customerId, returnUrl) {
    const stripe = await getUncachableStripeClient();
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  // Read operations - delegate to storage (queries PostgreSQL)
  async getProduct(productId) {
    return await stripeStorage.getProduct(productId);
  }

  async getSubscription(subscriptionId) {
    return await stripeStorage.getSubscription(subscriptionId);
  }

  async listProductsWithPrices() {
    return await stripeStorage.listProductsWithPrices();
  }
}

export const stripeService = new StripeService();
