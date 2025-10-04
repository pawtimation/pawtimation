// Billing stub endpoints
const userPlans = new Map(); // Shared with planRoutes

export default async function billingRoutes(app) {
  
  // Checkout (stub - would integrate with Stripe)
  app.post('/billing/checkout', async (req, reply) => {
    try {
      const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
      app.jwt.verify(token);
      const { plan } = req.body;
      
      if (!['FREE', 'PLUS', 'PREMIUM'].includes(plan)) {
        return reply.code(400).send({ error: 'Invalid plan' });
      }
      
      console.log(`💳 Checkout initiated for plan: ${plan}`);
      
      // In production, this would create a Stripe checkout session
      return { 
        ok: true, 
        checkoutUrl: '/billing/success?plan=' + plan,
        message: 'Checkout stub - would redirect to Stripe' 
      };
    } catch {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });
  
  // Apply plan (dev only)
  app.post('/billing/apply', async (req, reply) => {
    try {
      const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
      const payload = app.jwt.verify(token);
      const { plan } = req.body;
      
      if (!['FREE', 'PLUS', 'PREMIUM'].includes(plan)) {
        return reply.code(400).send({ error: 'Invalid plan' });
      }
      
      userPlans.set(payload.sub, plan);
      
      return { ok: true, plan };
    } catch {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });
  
  // Get payment history (stub)
  app.get('/billing/history', async (req, reply) => {
    try {
      const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
      app.jwt.verify(token);
      
      // Stub payment history
      return {
        payments: [
          { id: 'pay_1', date: '2025-09-01', amount: 9.99, plan: 'PREMIUM', status: 'Paid' },
          { id: 'pay_2', date: '2025-08-01', amount: 9.99, plan: 'PREMIUM', status: 'Paid' }
        ]
      };
    } catch {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });
}
