import { repo, isInvoiceOverdue } from '../repo.js';

export default async function financeRoutes(fastify) {
  // Helper: Require business user (admin or staff, not client)
  async function requireBusinessUser(req, reply) {
    try {
      const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
      if (!token) {
        return reply.code(401).send({ error: 'unauthenticated' });
      }
      
      const payload = fastify.jwt.verify(token);
      
      const user = await repo.getUser(payload.sub);
      if (!user) {
        return reply.code(401).send({ error: 'unauthenticated' });
      }
      
      if (user.role === 'client') {
        return reply.code(403).send({ error: 'forbidden: admin access required' });
      }
      
      req.user = user;
      req.businessId = user.businessId;
    } catch (err) {
      return reply.code(401).send({ error: 'unauthenticated' });
    }
  }

  // Get financial overview with KPIs
  fastify.get('/finance/overview', { preHandler: requireBusinessUser }, async (req, reply) => {
    const overview = await repo.getFinancialOverview(req.businessId);
    const monthlyTrend = await repo.getMonthlyRevenueTrend(req.businessId, 6);

    reply.send({
      overview,
      monthlyTrend
    });
  });

  // Get revenue forecasts
  fastify.get('/finance/forecasts', { preHandler: requireBusinessUser }, async (req, reply) => {
    const forecast = await repo.getRevenueForecast(req.businessId);

    reply.send({ forecast });
  });

  // Get revenue breakdowns
  fastify.get('/finance/breakdowns', { preHandler: requireBusinessUser }, async (req, reply) => {
    const byService = await repo.getRevenueByService(req.businessId);
    const byStaff = await repo.getRevenueByStaff(req.businessId);
    const byClient = await repo.getRevenueByClient(req.businessId, 10);

    reply.send({
      byService,
      byStaff,
      byClient
    });
  });

  // Get unpaid and overdue invoice summary
  fastify.get('/finance/unpaid-summary', { preHandler: requireBusinessUser }, async (req, reply) => {
    const invoices = await repo.listInvoicesByBusiness(req.businessId);
    
    // Calculate totals
    let totalUnpaidCents = 0;
    let totalOverdueCents = 0;
    let unpaidCount = 0;
    let overdueCount = 0;
    
    for (const invoice of invoices) {
      if (!invoice.paidAt) {
        totalUnpaidCents += invoice.amountCents || 0;
        unpaidCount++;
        
        if (isInvoiceOverdue(invoice)) {
          totalOverdueCents += invoice.amountCents || 0;
          overdueCount++;
        }
      }
    }

    reply.send({
      unpaid: {
        totalCents: totalUnpaidCents,
        count: unpaidCount
      },
      overdue: {
        totalCents: totalOverdueCents,
        count: overdueCount
      }
    });
  });
}
