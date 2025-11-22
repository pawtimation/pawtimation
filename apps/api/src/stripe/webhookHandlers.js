import { getStripeSync, getUncachableStripeClient } from './stripeClient.js';
import { repo } from '../repo.js';
import { getPlan } from '../../../../shared/planConfig.js';
import { StripeRetryUtil } from './stripeRetry.js';

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
    const event = await sync.processWebhook(payload, signature, uuid);

    // Handle specific event types
    await this.handleStripeEvent(event);
  }

  static async handleStripeEvent(event) {
    console.log(`[Stripe Webhook] Processing event: ${event.type}`);

    try {
      // Log webhook received
      await StripeRetryUtil.logStripeOperation(
        `webhook_${event.type}`,
        'INFO',
        `Stripe webhook received: ${event.type}`,
        { eventId: event.id, eventType: event.type }
      );

      switch (event.type) {
        case 'checkout.session.completed':
          if (event.account) {
            await this.handleConnectedAccountCheckout(event.data.object, event.account);
          } else {
            await this.handleCheckoutCompleted(event.data.object);
          }
          break;
        
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        
        case 'invoice.paid':
          await this.handleInvoicePaid(event.data.object);
          break;
        
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        
        default:
          console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      }

      // Log webhook processed successfully
      await StripeRetryUtil.logStripeOperation(
        `webhook_${event.type}`,
        'INFO',
        `Stripe webhook processed successfully: ${event.type}`,
        { eventId: event.id, eventType: event.type }
      );
    } catch (error) {
      console.error(`[Stripe Webhook] Error handling ${event.type}:`, error);
      
      // Log webhook processing error
      await StripeRetryUtil.logStripeOperation(
        `webhook_${event.type}`,
        'ERROR',
        `Stripe webhook processing failed: ${event.type}`,
        { 
          eventId: event.id, 
          eventType: event.type,
          errorType: error.type,
          errorMessage: error.message,
          errorStack: error.stack
        }
      );
      
      throw error;
    }
  }

  static async handleCheckoutCompleted(session) {
    console.log(`[Stripe Webhook] Checkout completed for customer: ${session.customer}`);
    
    const { businessId, planCode, billingCycle } = session.metadata;
    if (!businessId || !planCode || !billingCycle) {
      console.error('[Stripe Webhook] Missing metadata in checkout session', session.metadata);
      return;
    }

    // Get subscription to extract actual billing period AND verify price
    const stripe = await getUncachableStripeClient();
    const subscriptionId = session.subscription;
    if (!subscriptionId) {
      console.error('[Stripe Webhook] No subscription in checkout session');
      return;
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price']
    });

    // SECURITY: Verify the actual purchased price matches the claimed plan
    const purchasedPrice = subscription.items.data[0]?.price;
    if (!purchasedPrice) {
      console.error('[Stripe Webhook] No price found in subscription');
      return;
    }

    const pricePlanCode = purchasedPrice.metadata?.plan_code;
    const priceBillingCycle = purchasedPrice.metadata?.billing_cycle;

    if (pricePlanCode !== planCode || priceBillingCycle !== billingCycle) {
      console.error('[Stripe Webhook] Metadata mismatch! Session claims', {planCode, billingCycle}, 'but price is', {pricePlanCode, priceBillingCycle});
      await repo.createSystemLog({
        logType: 'PAYMENT',
        severity: 'ERROR',
        message: 'Stripe metadata mismatch - potential fraud attempt',
        metadata: {
          businessId,
          sessionPlan: planCode,
          sessionBilling: billingCycle,
          pricePlan: pricePlanCode,
          priceBilling: priceBillingCycle,
          sessionId: session.id,
          subscriptionId
        }
      });
      return;
    }

    const plan = getPlan(planCode);
    if (!plan) {
      console.error(`[Stripe Webhook] Invalid plan code: ${planCode}`);
      return;
    }

    const paidUntil = new Date(subscription.current_period_end * 1000);

    // Update business with new plan
    await repo.updateBusiness(businessId, {
      plan: planCode,
      planStatus: 'PAID',
      planBillingCycle: billingCycle,
      paidAt: new Date(),
      paidUntil: paidUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      suspensionReason: null,
      stripeCustomerId: session.customer,
      updatedAt: new Date()
    });

    // Update business features
    await repo.updateBusinessFeatures(businessId, {
      premiumDashboards: plan.premiumDashboards,
      gpsWalkRoutes: plan.gpsWalkRoutes,
      automations: plan.automations,
      referralBoost: plan.referralBoost,
      multiStaff: plan.multiStaff,
      routeOptimisation: plan.routeOptimisation
    });

    // Log the upgrade
    await repo.createSystemLog({
      logType: 'PAYMENT',
      severity: 'INFO',
      message: `Payment successful - Business upgraded to ${planCode}`,
      metadata: {
        businessId,
        planCode,
        billingCycle,
        sessionId: session.id,
        customerId: session.customer
      }
    });

    console.log(`[Stripe Webhook] Successfully upgraded business ${businessId} to ${planCode}`);
  }

  static async handleSubscriptionUpdated(subscription) {
    console.log(`[Stripe Webhook] Subscription updated: ${subscription.id}`);
    
    const customerId = subscription.customer;
    const businesses = await repo.getAllBusinesses();
    const business = businesses.find(b => b.stripeCustomerId === customerId);
    
    if (!business) {
      console.error(`[Stripe Webhook] No business found for customer: ${customerId}`);
      return;
    }

    // Extract plan info from subscription metadata
    const planCode = subscription.items.data[0]?.price?.metadata?.plan_code;
    const billingCycle = subscription.items.data[0]?.price?.metadata?.billing_cycle;
    
    if (!planCode || !billingCycle) {
      console.error('[Stripe Webhook] Missing plan metadata in subscription');
      return;
    }

    const plan = getPlan(planCode);
    if (!plan) {
      console.error(`[Stripe Webhook] Invalid plan code: ${planCode}`);
      return;
    }

    // Update subscription status
    const planStatus = subscription.status === 'active' ? 'PAID' : 
                       subscription.status === 'past_due' ? 'SUSPENDED' : 
                       business.planStatus;

    await repo.updateBusiness(business.id, {
      plan: planCode,
      planStatus,
      planBillingCycle: billingCycle,
      paidUntil: new Date(subscription.current_period_end * 1000),
      suspensionReason: subscription.status === 'past_due' ? 'Payment failed' : null,
      updatedAt: new Date()
    });

    await repo.updateBusinessFeatures(business.id, {
      premiumDashboards: plan.premiumDashboards,
      gpsWalkRoutes: plan.gpsWalkRoutes,
      automations: plan.automations,
      referralBoost: plan.referralBoost,
      multiStaff: plan.multiStaff,
      routeOptimisation: plan.routeOptimisation
    });

    console.log(`[Stripe Webhook] Updated business ${business.id} subscription`);
  }

  static async handleSubscriptionDeleted(subscription) {
    console.log(`[Stripe Webhook] Subscription deleted: ${subscription.id}`);
    
    const customerId = subscription.customer;
    const businesses = await repo.getAllBusinesses();
    const business = businesses.find(b => b.stripeCustomerId === customerId);
    
    if (!business) {
      console.error(`[Stripe Webhook] No business found for customer: ${customerId}`);
      return;
    }

    // Downgrade to FREE plan
    await repo.updateBusiness(business.id, {
      plan: 'SOLO',
      planStatus: 'SUSPENDED',
      suspensionReason: 'Subscription cancelled',
      updatedAt: new Date()
    });

    await repo.createSystemLog({
      logType: 'PAYMENT',
      severity: 'WARN',
      message: `Subscription cancelled - Business suspended`,
      metadata: {
        businessId: business.id,
        subscriptionId: subscription.id,
        customerId
      }
    });

    console.log(`[Stripe Webhook] Suspended business ${business.id} due to cancelled subscription`);
  }

  static async handleInvoicePaid(invoice) {
    console.log(`[Stripe Webhook] Invoice paid: ${invoice.id}`);
    
    const customerId = invoice.customer;
    const businesses = await repo.getAllBusinesses();
    const business = businesses.find(b => b.stripeCustomerId === customerId);
    
    if (!business) {
      console.error(`[Stripe Webhook] No business found for customer: ${customerId}`);
      return;
    }

    // Update paidAt timestamp and clear grace period (including email tracking)
    try {
      await repo.updateBusiness(business.id, {
        paidAt: new Date(),
        planStatus: 'PAID',
        suspensionReason: null,
        gracePeriodEnd: null,
        gracePeriod24hReminderSentAt: null,
        gracePeriodFinalNoticeSentAt: null,
        paymentFailureCount: 0,
        lastPaymentFailureAt: null,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error(`[Stripe Webhook] Failed to update business ${business.id} after successful payment:`, error);
      await repo.createSystemLog({
        logType: 'PAYMENT',
        severity: 'ERROR',
        message: 'Failed to clear grace period after successful payment',
        metadata: {
          businessId: business.id,
          invoiceId: invoice.id,
          error: error.message
        }
      });
      throw error;
    }

    await repo.createSystemLog({
      logType: 'PAYMENT',
      severity: 'INFO',
      message: `Invoice paid successfully`,
      metadata: {
        businessId: business.id,
        invoiceId: invoice.id,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency
      }
    });
  }

  static async handlePaymentFailed(invoice) {
    console.log(`[Stripe Webhook] Payment failed: ${invoice.id}`);
    
    const customerId = invoice.customer;
    const businesses = await repo.getAllBusinesses();
    const business = businesses.find(b => b.stripeCustomerId === customerId);
    
    if (!business) {
      console.error(`[Stripe Webhook] No business found for customer: ${customerId}`);
      return;
    }

    // Calculate 3-day grace period
    const now = new Date();
    const gracePeriodEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days from now
    const failureCount = (business.paymentFailureCount || 0) + 1;

    // Instead of immediate suspension, start grace period
    try {
      await repo.updateBusiness(business.id, {
        gracePeriodEnd,
        gracePeriod24hReminderSentAt: null,
        gracePeriodFinalNoticeSentAt: null,
        paymentFailureCount: failureCount,
        lastPaymentFailureAt: now,
        suspensionReason: `Payment failed - grace period until ${gracePeriodEnd.toISOString().split('T')[0]}`,
        updatedAt: now
      });
    } catch (error) {
      console.error(`[Stripe Webhook] Failed to set grace period for business ${business.id}:`, error);
      await repo.createSystemLog({
        logType: 'PAYMENT',
        severity: 'ERROR',
        message: 'Failed to start grace period after payment failure',
        metadata: {
          businessId: business.id,
          invoiceId: invoice.id,
          error: error.message
        }
      });
      throw error;
    }

    await repo.createSystemLog({
      logType: 'PAYMENT',
      severity: 'WARN',
      message: `Payment failed - Grace period started (${failureCount} failures)`,
      metadata: {
        businessId: business.id,
        invoiceId: invoice.id,
        amount: invoice.amount_due / 100,
        currency: invoice.currency,
        gracePeriodEnd: gracePeriodEnd.toISOString(),
        attemptCount: invoice.attempt_count || 1,
        failureCount
      }
    });

    // Send immediate payment failure warning email
    try {
      const { sendPaymentFailureWarning } = await import('../emailService.js');
      const owner = await repo.getUserById(business.ownerUserId);
      if (owner?.email) {
        await sendPaymentFailureWarning({
          to: owner.email,
          businessName: business.name,
          gracePeriodEnd,
          amount: invoice.amount_due / 100,
          currency: invoice.currency
        });

        console.log(`[Stripe Webhook] Payment failure warning email sent to ${owner.email}`);
      } else {
        console.warn(`[Stripe Webhook] No owner email found for business ${business.id} - skipping warning email`);
        await repo.createSystemLog({
          logType: 'PAYMENT',
          severity: 'WARN',
          message: 'Payment failed but no owner email found - warning email not sent',
          metadata: {
            businessId: business.id,
            invoiceId: invoice.id
          }
        });
      }
    } catch (error) {
      console.error(`[Stripe Webhook] CRITICAL: Failed to send payment failure warning email:`, error);
      await repo.createSystemLog({
        logType: 'PAYMENT',
        severity: 'ERROR',
        message: 'CRITICAL: Failed to send payment failure warning email',
        metadata: {
          businessId: business.id,
          invoiceId: invoice.id,
          error: error.message,
          stack: error.stack
        }
      });
    }

    console.log(`[Stripe Webhook] Grace period started for business ${business.id} until ${gracePeriodEnd.toISOString()}`);
  }

  static async handleConnectedAccountCheckout(session, accountId) {
    console.log(`[Stripe Webhook] Connected account checkout completed: ${session.id} for account ${accountId}`);
    
    const { invoiceId, invoiceNumber } = session.metadata;
    if (!invoiceId) {
      console.error('[Stripe Webhook] No invoiceId in connected account checkout metadata', session.metadata);
      return;
    }

    const invoice = await repo.getInvoice(invoiceId);
    if (!invoice) {
      console.error(`[Stripe Webhook] Invoice not found: ${invoiceId}`);
      return;
    }

    const business = await repo.getBusiness(invoice.businessId);
    if (!business) {
      console.error(`[Stripe Webhook] Business not found: ${invoice.businessId}`);
      return;
    }

    if (business.stripeConnectedAccountId !== accountId) {
      console.error(`[Stripe Webhook] Account ID mismatch. Invoice business has ${business.stripeConnectedAccountId}, webhook is for ${accountId}`);
      await repo.createSystemLog({
        logType: 'PAYMENT',
        severity: 'ERROR',
        message: 'Stripe connected account mismatch - potential fraud attempt',
        metadata: {
          invoiceId,
          businessId: invoice.businessId,
          expectedAccount: business.stripeConnectedAccountId,
          webhookAccount: accountId,
          sessionId: session.id
        }
      });
      return;
    }

    if (invoice.paidAt) {
      console.log(`[Stripe Webhook] Invoice ${invoiceId} already marked as paid`);
      return;
    }

    try {
      await repo.markInvoicePaid(invoiceId, 'stripe');

      await repo.createSystemLog({
        logType: 'PAYMENT',
        severity: 'INFO',
        message: `Invoice paid via Stripe Connect`,
        metadata: {
          invoiceId,
          invoiceNumber,
          businessId: invoice.businessId,
          clientId: invoice.clientId,
          amountCents: invoice.amountCents,
          sessionId: session.id,
          connectedAccount: accountId
        }
      });

      console.log(`[Stripe Webhook] Invoice ${invoiceId} marked as paid via Stripe Connect`);
    } catch (error) {
      console.error(`[Stripe Webhook] Failed to mark invoice ${invoiceId} as paid:`, error);
      await repo.createSystemLog({
        logType: 'PAYMENT',
        severity: 'ERROR',
        message: 'Failed to mark invoice as paid after Stripe payment',
        metadata: {
          invoiceId,
          businessId: invoice.businessId,
          error: error.message,
          stack: error.stack
        }
      });
      throw error;
    }
  }
}
