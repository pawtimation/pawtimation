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

  // Create new staff member
  fastify.post('/users/create', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const { name, email, role } = req.body;

    // Validate role is STAFF
    if (role !== 'STAFF') {
      return reply.code(400).send({ error: 'Invalid role: only STAFF role is supported' });
    }

    // Validate required fields
    if (!name || !name.trim()) {
      return reply.code(400).send({ error: 'Name is required' });
    }

    try {
      // Create staff member with default password
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash('staff123', 10);

      const staffData = {
        businessId: auth.businessId, // Always use authenticated user's business
        role: 'STAFF',
        name: name.trim(),
        email: email?.trim() || null,
        password: hashedPassword
      };

      const newStaff = await repo.createUser(staffData);

      return reply.code(201).send(newStaff);
    } catch (error) {
      console.error('Failed to create staff member:', error);
      return reply.code(500).send({ error: 'Failed to create staff member' });
    }
  });
}
