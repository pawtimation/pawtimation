import { stripeService } from './stripeService.js';
import { repo } from '../repo.js';
import { getStripePublishableKey } from './stripeClient.js';
import { PLAN_PRICE_IDS } from './planPriceMapping.js';

/**
 * Stripe Routes for Pawtimation
 * Handles checkout sessions and customer portal
 */
export async function stripeRoutes(fastify) {
  // Middleware to verify authenticated user
  async function requireAuth(req, reply) {
    try {
      const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
      const payload = fastify.jwt.verify(token);
      
      const user = await repo.getUser(payload.sub);
      if (!user) {
        return reply.code(401).send({ error: 'unauthenticated' });
      }
      
      req.user = user;
      req.businessId = user.businessId;
    } catch (err) {
      return reply.code(401).send({ error: 'unauthenticated' });
    }
  }
  /**
   * GET /stripe/config
   * Get publishable key for frontend
   */
  fastify.get('/stripe/config', async (request, reply) => {
    try {
      const publishableKey = await getStripePublishableKey();
      return reply.send({ publishableKey });
    } catch (error) {
      console.error('Error fetching Stripe config:', error);
      return reply.code(500).send({ error: 'Failed to fetch Stripe config' });
    }
  });

  /**
   * POST /stripe/create-checkout-session
   * Create Stripe Checkout session for plan upgrade
   */
  fastify.post('/stripe/create-checkout-session', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { planCode, billingCycle } = request.body;
      
      if (!planCode || !billingCycle) {
        return reply.code(400).send({ error: 'planCode and billingCycle required' });
      }

      // Get plan price ID from mapping
      const priceId = PLAN_PRICE_IDS[planCode]?.[billingCycle];
      if (!priceId) {
        return reply.code(400).send({ error: 'Invalid plan or billing cycle' });
      }

      // Get business
      const business = await repo.getBusiness(request.businessId);
      if (!business) {
        return reply.code(404).send({ error: 'Business not found' });
      }

      // Create or get Stripe customer
      let customerId = business.stripeCustomerId;
      if (!customerId) {
        const customer = await stripeService.createCustomer(
          business.email || `admin@${business.id}.pawtimation.co.uk`,
          business.id,
          business.name
        );
        await repo.updateBusiness(business.id, { stripeCustomerId: customer.id });
        customerId = customer.id;
      }

      // Create checkout session
      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}`;
      const session = await stripeService.createCheckoutSession(
        customerId,
        priceId,
        `${baseUrl}/admin/settings?tab=billing&success=true`,
        `${baseUrl}/admin/settings?tab=billing&canceled=true`,
        business.id
      );

      return reply.send({ url: session.url });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return reply.code(500).send({ error: 'Failed to create checkout session' });
    }
  });

  /**
   * POST /stripe/create-portal-session
   * Create Stripe Customer Portal session for managing subscription
   */
  fastify.post('/stripe/create-portal-session', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const business = await repo.getBusiness(request.businessId);
      if (!business) {
        return reply.code(404).send({ error: 'Business not found' });
      }

      if (!business.stripeCustomerId) {
        return reply.code(400).send({ error: 'No Stripe customer found' });
      }

      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}`;
      const session = await stripeService.createCustomerPortalSession(
        business.stripeCustomerId,
        `${baseUrl}/admin/settings?tab=billing`
      );

      return reply.send({ url: session.url });
    } catch (error) {
      console.error('Error creating portal session:', error);
      return reply.code(500).send({ error: 'Failed to create portal session' });
    }
  });

  /**
   * GET /stripe/products
   * List available products and prices
   */
  fastify.get('/stripe/products', async (request, reply) => {
    try {
      const products = await stripeService.listProductsWithPrices();
      
      // Group prices by product
      const productsMap = new Map();
      for (const row of products) {
        if (!productsMap.has(row.product_id)) {
          productsMap.set(row.product_id, {
            id: row.product_id,
            name: row.product_name,
            description: row.product_description,
            active: row.product_active,
            metadata: row.product_metadata,
            prices: []
          });
        }
        if (row.price_id) {
          productsMap.get(row.product_id).prices.push({
            id: row.price_id,
            unit_amount: row.unit_amount,
            currency: row.currency,
            recurring: row.recurring,
            active: row.price_active,
            metadata: row.price_metadata
          });
        }
      }

      return reply.send({ data: Array.from(productsMap.values()) });
    } catch (error) {
      console.error('Error listing products:', error);
      return reply.code(500).send({ error: 'Failed to list products' });
    }
  });
}
