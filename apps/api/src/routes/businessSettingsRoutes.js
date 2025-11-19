import { users } from '../authRoutes.js';

export async function businessSettingsRoutes(fastify) {
  async function requireBusinessUser(req, reply) {
    try {
      const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
      const payload = fastify.jwt.verify(token);
      
      const user = [...users.values()].find(u => u.id === payload.sub);
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

  fastify.get('/business/settings', { preHandler: requireBusinessUser }, async (req, reply) => {
    const { repo } = fastify;
    const settings = await repo.getBusinessSettings(req.businessId);
    
    if (!settings) {
      return reply.code(404).send({ error: 'Business not found' });
    }
    
    return settings;
  });

  fastify.post('/business/settings/update', { preHandler: requireBusinessUser }, async (req, reply) => {
    const { repo } = fastify;
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
