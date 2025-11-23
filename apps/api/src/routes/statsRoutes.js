// statsRoutes.js
// Dashboard statistics endpoints for mobile admin interface

import { repo } from '../repo.js';

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

export default async function statsRoutes(fastify) {
  // Count upcoming bookings (BOOKED status)
  fastify.get('/stats/bookings/upcoming-count', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const count = await repo.countUpcomingBookings(auth.businessId);
    reply.send({ count });
  });

  // Count pending bookings (PENDING status)
  fastify.get('/stats/bookings/pending-count', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const count = await repo.countPendingBookings(auth.businessId);
    reply.send({ count });
  });

  // Count active clients for business
  fastify.get('/stats/clients/count', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const count = await repo.countClients(auth.businessId);
    reply.send({ count });
  });

  // Get revenue for current week
  fastify.get('/stats/invoices/revenue-week', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const amount = await repo.getRevenueForCurrentWeek(auth.businessId);
    reply.send({ amount });
  });

  // Get upcoming bookings preview with enriched data
  fastify.get('/stats/bookings/upcoming', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const limit = parseInt(req.query.limit) || 5;
    const bookings = await repo.getUpcomingBookingsPreview(auth.businessId, limit);
    reply.send(bookings);
  });

  // Count today's jobs
  fastify.get('/stats/bookings/today-count', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const result = await repo.getTodayJobsStats(auth.businessId);
    reply.send(result);
  });

  // Count this week's jobs
  fastify.get('/stats/bookings/week-count', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const result = await repo.getWeekJobsStats(auth.businessId);
    reply.send(result);
  });

  // Count active staff (with availability this week)
  fastify.get('/stats/staff/active-count', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const result = await repo.getActiveStaffStats(auth.businessId);
    reply.send(result);
  });

  // Get new clients this month count
  fastify.get('/stats/clients/new-this-month', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const count = await repo.getNewClientsThisMonth(auth.businessId);
    reply.send({ count });
  });

  // Get revenue for last 7 days
  fastify.get('/stats/invoices/revenue-7days', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const result = await repo.getRevenueLast7Days(auth.businessId);
    reply.send(result);
  });

  // Get paid invoices this month
  fastify.get('/stats/invoices/paid-this-month', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const result = await repo.getPaidThisMonth(auth.businessId);
    reply.send(result);
  });

  // Get recent activity feed
  fastify.get('/stats/activity/recent', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const limit = parseInt(req.query.limit) || 10;
    const activity = await repo.getRecentActivity(auth.businessId, limit);
    reply.send(activity);
  });

  // Get action items needing attention
  fastify.get('/stats/actions/pending', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const actions = await repo.getPendingActions(auth.businessId);
    reply.send(actions);
  });
}
