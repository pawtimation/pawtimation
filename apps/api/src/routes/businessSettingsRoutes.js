import { repo } from '../repo.js';

export async function businessSettingsRoutes(fastify) {
  // Helper: Require any authenticated user (staff, client, or admin)
  async function getAuthenticatedUser(req, reply) {
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
      
      return user;
    } catch (err) {
      reply.code(401).send({ error: 'unauthenticated' });
      return null;
    }
  }

  // Helper: Require business user (admin or staff, not client)
  async function requireBusinessUser(req, reply) {
    try {
      const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
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

  // Public branding endpoint - accessible to all authenticated users (staff, client, admin)
  fastify.get('/business/branding', async (req, reply) => {
    const user = await getAuthenticatedUser(req, reply);
    if (!user) return; // Error response already sent by helper
    
    const settings = await repo.getBusinessSettings(user.businessId);
    
    // Return branding or empty object if not configured
    return { branding: settings?.branding || {} };
  });

  fastify.get('/business/settings', { preHandler: requireBusinessUser }, async (req, reply) => {
    
    const settings = await repo.getBusinessSettings(req.businessId);
    
    if (!settings) {
      return reply.code(404).send({ error: 'Business not found' });
    }
    
    return settings;
  });

  fastify.post('/business/settings/update', { preHandler: requireBusinessUser }, async (req, reply) => {
    
    const updated = await repo.updateBusinessSettings(
      req.businessId,
      req.body
    );
    
    if (!updated) {
      return reply.code(404).send({ error: 'Business not found' });
    }
    
    return updated.settings;
  });
}
