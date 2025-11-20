// statsRoutes.js
// Dashboard statistics endpoints for mobile admin interface

import { repo } from '../repo.js';

// Helper to verify authenticated business/admin user
async function getAuthenticatedBusinessUser(fastify, req, reply) {
  try {
    const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
    const payload = fastify.jwt.verify(token);
    
    // Get the user from the unified storage
    const user = await repo.getUserById(payload.sub);
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
  // Count upcoming bookings (SCHEDULED or APPROVED status)
  fastify.get('/stats/bookings/upcoming-count', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const count = await repo.countUpcomingBookings(auth.businessId);
    reply.send({ count });
  });

  // Count pending bookings (REQUESTED or PENDING status)
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
}
