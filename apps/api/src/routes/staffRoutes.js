import { users } from '../authRoutes.js';

function getAuthenticatedBusinessUser(fastify, req, reply) {
  try {
    const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
    const payload = fastify.jwt.verify(token);
    
    const user = [...users.values()].find(u => u.id === payload.sub);
    if (!user) {
      reply.code(401).send({ error: 'unauthenticated' });
      return null;
    }
    
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

export async function staffRoutes(fastify) {
  fastify.get('/staff/:staffId', async (req, reply) => {
    const auth = getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const { repo } = fastify;
    const { staffId } = req.params;
    
    const staff = await repo.getUserById(staffId);

    if (!staff) {
      return reply.code(404).send({ error: 'Staff member not found' });
    }

    if (staff.businessId !== auth.businessId) {
      return reply.code(403).send({ error: 'forbidden: cannot access other businesses\' staff' });
    }

    return staff;
  });

  fastify.get('/staff/:staffId/availability', async (req, reply) => {
    const auth = getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const { repo } = fastify;
    const { staffId } = req.params;
    
    const availability = await repo.getStaffWeeklyAvailability(staffId);
    return availability || {};
  });
}
