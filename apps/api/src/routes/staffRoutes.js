import { repo } from '../repo.js';

async function getAuthenticatedBusinessUser(fastify, req, reply) {
  try {
    const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
    const payload = fastify.jwt.verify(token);
    
    const user = await repo.getUser(payload.sub);
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
  // List all staff for authenticated business user
  fastify.get('/staff/list', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    
    const staff = await repo.listStaffByBusiness(auth.businessId);
    return staff;
  });

  fastify.get('/staff/:staffId', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    
    const { staffId } = req.params;
    
    const staff = await repo.getUser(staffId);

    if (!staff) {
      return reply.code(404).send({ error: 'Staff member not found' });
    }

    if (staff.businessId !== auth.businessId) {
      return reply.code(403).send({ error: 'forbidden: cannot access other businesses\' staff' });
    }

    return staff;
  });

  fastify.get('/staff/:staffId/availability', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    
    const { staffId } = req.params;
    
    const availability = await repo.getStaffWeeklyAvailability(staffId);
    return availability || {};
  });
}
