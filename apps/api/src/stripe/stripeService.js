import { getUncachableStripeClient } from './stripeClient.js';
import { stripeStorage } from './stripeStorage.js';
import { StripeRetryUtil } from './stripeRetry.js';

/**
 * StripeService: Handles direct Stripe API operations with retry logic
 * Pattern: Use Stripe client for write operations, storage for read operations
 */
export class StripeService {
  // Create customer in Stripe
  async createCustomer(email, businessId, businessName) {
    return await StripeRetryUtil.withRetry(
      async () => {
        const stripe = await getUncachableStripeClient();
        return await stripe.customers.create({
          email,
          metadata: { 
            businessId,
            businessName
          },
        });
      },
      'createCustomer',
      { email, businessId, businessName }
    );
  }

  // Create checkout session for plan upgrade
  async createCheckoutSession(customerId, priceId, successUrl, cancelUrl, businessId, planCode, billingCycle) {
    return await StripeRetryUtil.withRetry(
      async () => {
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
            planCode,
            billingCycle,
          },
          subscription_data: {
            metadata: {
              businessId,
              planCode,
              billingCycle,
            },
          },
        });
      },
      'createCheckoutSession',
      { customerId, businessId, planCode, billingCycle }
    );
  }

  // Create customer portal session
  async createCustomerPortalSession(customerId, returnUrl) {
    return await StripeRetryUtil.withRetry(
      async () => {
        const stripe = await getUncachableStripeClient();
        return await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: returnUrl,
        });
      },
      'createCustomerPortalSession',
      { customerId }
    );
  }

  // Stripe Connect: Create account link for onboarding
  async createConnectAccountLink(accountId, refreshUrl, returnUrl) {
    return await StripeRetryUtil.withRetry(
      async () => {
        const stripe = await getUncachableStripeClient();
        return await stripe.accountLinks.create({
          account: accountId,
          refresh_url: refreshUrl,
          return_url: returnUrl,
          type: 'account_onboarding',
        });
      },
      'createConnectAccountLink',
      { accountId }
    );
  }

  // Stripe Connect: Create Express connected account
  async createConnectedAccount(businessId, email, businessName) {
    return await StripeRetryUtil.withRetry(
      async () => {
        const stripe = await getUncachableStripeClient();
        return await stripe.accounts.create({
          type: 'express',
          country: 'GB',
          email,
          business_type: 'individual',
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          metadata: {
            businessId,
            businessName,
          },
        });
      },
      'createConnectedAccount',
      { businessId, email }
    );
  }

  // Stripe Connect: Retrieve account details
  async getConnectedAccount(accountId) {
    return await StripeRetryUtil.withRetry(
      async () => {
        const stripe = await getUncachableStripeClient();
        return await stripe.accounts.retrieve(accountId);
      },
      'getConnectedAccount',
      { accountId }
    );
  }

  // Stripe Connect: Create payment link for invoice
  async createInvoicePaymentLink(connectedAccountId, amountCents, invoiceId, invoiceNumber) {
    return await StripeRetryUtil.withRetry(
      async () => {
        const stripe = await getUncachableStripeClient();
        
        const paymentLink = await stripe.paymentLinks.create({
          line_items: [
            {
              price_data: {
                currency: 'gbp',
                product_data: {
                  name: `Invoice #${invoiceNumber}`,
                  description: `Payment for invoice ${invoiceNumber}`,
                },
                unit_amount: amountCents,
              },
              quantity: 1,
            },
          ],
          metadata: {
            invoiceId,
            invoiceNumber,
          },
          application_fee_amount: 0,
        }, {
          stripeAccount: connectedAccountId,
        });

        return paymentLink;
      },
      'createInvoicePaymentLink',
      { connectedAccountId, invoiceId, amountCents }
    );
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
