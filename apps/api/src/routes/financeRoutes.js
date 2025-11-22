import { repo, isInvoiceOverdue } from '../repo.js';

// Helper to verify authenticated business/admin user
async function getAuthenticatedBusinessUser(fastify, req, reply) {
  try {
    const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
    const payload = fastify.jwt.verify(token);
    
    // Get the user from the unified storage
    const user = await repo.getUser(payload.sub);
    if (!user) {
      reply.code(401).send({ error: 'unauthenticated' });
      return null;
    }
    
    // Verify this is an admin or business user (not a client)
    if (user.role === 'client') {
      reply.code(403).send({ error: 'forbidden: admin access required' });
      return null;
    }
    
    return { user, businessId: user.businessId };
  } catch (err) {
    reply.code(401).send({ error: 'unauthenticated' });
    return null;
  }
}

export default async function financeRoutes(fastify) {
  // Get financial overview with KPIs
  fastify.get('/finance/overview', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const overview = await repo.getFinancialOverview(auth.businessId);
    const monthlyTrend = await repo.getMonthlyRevenueTrend(auth.businessId, 6);

    reply.send({
      overview,
      monthlyTrend
    });
  });

  // Get revenue forecasts
  fastify.get('/finance/forecasts', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const forecast = await repo.getRevenueForecast(auth.businessId);

    reply.send({ forecast });
  });

  // Get revenue breakdowns
  fastify.get('/finance/breakdowns', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const byService = await repo.getRevenueByService(auth.businessId);
    const byStaff = await repo.getRevenueByStaff(auth.businessId);
    const byClient = await repo.getRevenueByClient(auth.businessId, 10);

    reply.send({
      byService,
      byStaff,
      byClient
    });
  });

  // Get unpaid and overdue invoice summary
  fastify.get('/finance/unpaid-summary', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const invoices = await repo.listInvoicesByBusiness(auth.businessId);
    
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
