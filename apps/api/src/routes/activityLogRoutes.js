import { storage } from '../storage.js';
import { repo } from '../repo.js';

export async function activityLogRoutes(fastify) {
  async function requireAdmin(req, reply) {
    try {
      const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
      if (!token) {
        reply.code(401).send({ error: 'unauthenticated' });
        return null;
      }
      
      const payload = fastify.jwt.verify(token);
      const user = await repo.getUser(payload.sub);
      
      if (!user || !user.businessId) {
        reply.code(401).send({ error: 'unauthenticated' });
        return null;
      }
      
      if (user.role?.toUpperCase() !== 'ADMIN') {
        reply.code(403).send({ error: 'Admin access required' });
        return null;
      }
      
      return { user };
    } catch (err) {
      reply.code(401).send({ error: 'unauthenticated' });
      return null;
    }
  }

  fastify.get('/activity-logs', async (req, reply) => {
    const auth = await requireAdmin(req, reply);
    if (!auth) return;
    
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    
    try {
      const logs = await storage.getActivityLogs(auth.user.businessId, limit);
      return { logs };
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
      return reply.code(500).send({ error: 'Failed to fetch activity logs' });
    }
  });

  fastify.post('/activity-logs', async (req, reply) => {
    const auth = await requireAdmin(req, reply);
    if (!auth) return;
    
    const { event, description, metadata } = req.body;
    
    if (!event || !description) {
      return reply.code(400).send({ error: 'event and description are required' });
    }
    
    try {
      const log = await storage.createActivityLog({
        businessId: auth.user.businessId,
        userId: auth.user.id,
        userName: auth.user.name || auth.user.email,
        event,
        description,
        metadata: metadata || null
      });
      
      return { log };
    } catch (err) {
      console.error('Failed to create activity log:', err);
      return reply.code(500).send({ error: 'Failed to create activity log' });
    }
  });
}
