import { users } from './authRoutes.js';
import { escalations } from './pawbotRoutes.js';

export default async function adminRoutes(app) {
  // Middleware to check admin role
  async function requireAdmin(req, reply) {
    try {
      const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
      const payload = app.jwt.verify(token);
      if (!payload.isAdmin) {
        return reply.code(403).send({ error: 'forbidden' });
      }
      req.user = payload;
    } catch {
      return reply.code(401).send({ error: 'unauthenticated' });
    }
  }

  // Search users by email or ID
  app.get('/admin/search-users', { preHandler: requireAdmin }, async (req) => {
    const q = (req.query.q || '').toLowerCase();
    if (!q) return { users: [] };

    const results = [];
    for (const [email, user] of users) {
      if (email.includes(q) || user.id.includes(q) || (user.name || '').toLowerCase().includes(q)) {
        results.push({
          id: user.id,
          email: user.email,
          name: user.name,
          sitterId: user.sitterId,
          isAdmin: user.isAdmin || false
        });
      }
    }
    
    return { users: results };
  });

  // Get support escalations
  app.get('/admin/support-escalations', { preHandler: requireAdmin }, async () => {
    const escalationsList = [];
    
    for (const [userId, userEscalations] of escalations) {
      for (const esc of userEscalations) {
        escalationsList.push({
          userId,
          ...esc
        });
      }
    }
    
    // Sort by timestamp, newest first
    escalationsList.sort((a, b) => b.ts - a.ts);
    
    return { escalations: escalationsList };
  });

  // Get platform metrics
  app.get('/admin/metrics', { preHandler: requireAdmin }, async () => {
    // Calculate support metrics
    let supportTotal = 0;
    let supportHandled = 0;
    
    for (const [userId, userEscalations] of escalations) {
      supportTotal += userEscalations.length;
      supportHandled += userEscalations.filter(e => e.emailed).length;
    }
    
    return {
      metrics: {
        totalBookings: 0, // Stub for now
        supportHandled,
        supportTotal,
        csat: 0, // Stub for now
        csatResponses: 0 // Stub for now
      }
    };
  });
}
