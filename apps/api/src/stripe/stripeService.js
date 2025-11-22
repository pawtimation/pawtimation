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
  async createCheckoutSession(customerId, priceId, successUrl, cancelUrl, businessId, planCode, billingCycle) {
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
  }

  // Create customer portal session
  async createCustomerPortalSession(customerId, returnUrl) {
    const stripe = await getUncachableStripeClient();
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  // Stripe Connect: Create account link for onboarding
  async createConnectAccountLink(accountId, refreshUrl, returnUrl) {
    const stripe = await getUncachableStripeClient();
    return await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });
  }

  // Stripe Connect: Create Express connected account
  async createConnectedAccount(businessId, email, businessName) {
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
  }

  // Stripe Connect: Retrieve account details
  async getConnectedAccount(accountId) {
    const stripe = await getUncachableStripeClient();
    return await stripe.accounts.retrieve(accountId);
  }

  // Stripe Connect: Create payment link for invoice
  async createInvoicePaymentLink(connectedAccountId, amountCents, invoiceId, invoiceNumber) {
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
