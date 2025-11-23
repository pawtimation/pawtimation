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
  // List all users for a specific business (for admin panel)
  fastify.get('/users/by-business/:businessId', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const { businessId } = req.params;

    // Verify the requesting user has access to this business
    if (businessId !== auth.businessId) {
      return reply.code(403).send({ error: 'forbidden: cannot access other businesses' });
    }

    const users = await repo.listUsersByBusiness(businessId);
    return users;
  });

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

  fastify.post('/staff/:staffId/availability', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const { staffId } = req.params;
    
    // Only allow updating own availability or if admin
    const isAdmin = auth.user.role === 'ADMIN' || auth.user.role === 'admin' || auth.user.isAdmin;
    if (staffId !== auth.user.id && !isAdmin) {
      return reply.code(403).send({ error: 'forbidden: can only update own availability' });
    }

    const staff = await repo.getUser(staffId);
    if (!staff) {
      return reply.code(404).send({ error: 'Staff member not found' });
    }

    // Verify staff belongs to same business
    if (staff.businessId !== auth.businessId) {
      return reply.code(403).send({ error: 'forbidden: cannot update staff from other businesses' });
    }

    // Save availability data (includes weeklySchedule and exceptionDays)
    await repo.saveStaffWeeklyAvailability(staffId, req.body);
    
    return { ok: true, availability: req.body };
  });

  fastify.post('/staff/:staffId/update', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const { staffId } = req.params;
    
    // Only allow updating own profile or if admin
    const isAdmin = auth.user.role === 'ADMIN' || auth.user.role === 'admin' || auth.user.isAdmin;
    if (staffId !== auth.user.id && !isAdmin) {
      return reply.code(403).send({ error: 'forbidden: can only update own profile' });
    }

    const staff = await repo.getUser(staffId);
    if (!staff) {
      return reply.code(404).send({ error: 'Staff member not found' });
    }

    // Verify staff belongs to same business
    if (staff.businessId !== auth.businessId) {
      return reply.code(403).send({ error: 'forbidden: cannot update staff from other businesses' });
    }

    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.phone !== undefined) updateData.phone = req.body.phone;
    if (req.body.notificationPreferences !== undefined) {
      updateData.notificationPreferences = req.body.notificationPreferences;
    }

    // Update staff member
    Object.assign(staff, updateData);
    
    return { ok: true, user: staff };
  });

  fastify.post('/staff/:staffId/services', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const { staffId } = req.params;
    
    // Only admins can update staff service assignments
    const isAdmin = auth.user.role === 'ADMIN' || auth.user.role === 'admin' || auth.user.isAdmin;
    if (!isAdmin) {
      return reply.code(403).send({ error: 'forbidden: admin access required to update service assignments' });
    }

    const staff = await repo.getUser(staffId);
    if (!staff) {
      return reply.code(404).send({ error: 'Staff member not found' });
    }

    // Verify staff belongs to same business
    if (staff.businessId !== auth.businessId) {
      return reply.code(403).send({ error: 'forbidden: cannot update staff from other businesses' });
    }

    const { services } = req.body;
    
    if (!Array.isArray(services)) {
      return reply.code(400).send({ error: 'Services must be an array of service IDs' });
    }

    // Verify all service IDs exist and belong to this business
    const businessServices = await repo.listServicesByBusiness(auth.businessId);
    const validServiceIds = new Set(businessServices.map(s => s.id));
    
    for (const serviceId of services) {
      if (!validServiceIds.has(serviceId)) {
        return reply.code(400).send({ error: `Invalid service ID: ${serviceId}` });
      }
    }

    // Update staff services
    const updatedStaff = await repo.saveStaffServices(staffId, services);
    
    return { ok: true, staff: updatedStaff };
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

    // Check plan limits before creating staff
    const { canAddStaff } = await import('../helpers/planEnforcement.js');
    const staffCheck = await canAddStaff(repo, auth.businessId);
    if (!staffCheck.success) {
      console.log(`[PLAN ENFORCEMENT] Staff creation blocked for business ${auth.businessId}: ${staffCheck.error}`);
      return reply.code(403).send({ 
        error: staffCheck.error,
        limit: staffCheck.limit,
        current: staffCheck.current
      });
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
