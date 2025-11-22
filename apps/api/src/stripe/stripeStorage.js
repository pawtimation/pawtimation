import { sql } from 'drizzle-orm';
import { db } from '../db.js';

/**
 * Storage: Query Stripe data from PostgreSQL stripe schema
 * Pattern: Simple SQL queries to stripe.* tables (auto-created by stripe-replit-sync)
 */
export class StripeStorage {
  // Query Stripe products
  async getProduct(productId) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.products WHERE id = ${productId}`
    );
    return result.rows[0] || null;
  }

  async listProducts(active = true, limit = 20, offset = 0) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.products WHERE active = ${active} LIMIT ${limit} OFFSET ${offset}`
    );
    return result.rows;
  }

  // Get products with their prices
  async listProductsWithPrices(active = true, limit = 20, offset = 0) {
    const result = await db.execute(
      sql`
        WITH paginated_products AS (
          SELECT id, name, description, metadata, active
          FROM stripe.products
          WHERE active = ${active}
          ORDER BY id
          LIMIT ${limit} OFFSET ${offset}
        )
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.active as product_active,
          p.metadata as product_metadata,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency,
          pr.recurring,
          pr.active as price_active,
          pr.metadata as price_metadata
        FROM paginated_products p
        LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        ORDER BY p.id, pr.unit_amount
      `
    );
    return result.rows;
  }

  // Query Stripe prices
  async getPrice(priceId) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.prices WHERE id = ${priceId}`
    );
    return result.rows[0] || null;
  }

  async listPrices(active = true, limit = 20, offset = 0) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.prices WHERE active = ${active} LIMIT ${limit} OFFSET ${offset}`
    );
    return result.rows;
  }

  async getPricesForProduct(productId) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.prices WHERE product = ${productId} AND active = true`
    );
    return result.rows;
  }

  // Query Stripe customers
  async getCustomer(customerId) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.customers WHERE id = ${customerId}`
    );
    return result.rows[0] || null;
  }

  // Query Stripe subscriptions
  async getSubscription(subscriptionId) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.subscriptions WHERE id = ${subscriptionId}`
    );
    return result.rows[0] || null;
  }

  // Query Stripe checkout sessions
  async getCheckoutSession(sessionId) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.checkout_sessions WHERE id = ${sessionId}`
    );
    return result.rows[0] || null;
  }
}

export const stripeStorage = new StripeStorage();
