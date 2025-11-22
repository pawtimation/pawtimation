import { escalations } from './pawbotRoutes.js';
import { repo } from './repo.js';

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

  // List all businesses for admin selection
  app.get('/admin/businesses', { preHandler: requireAdmin }, async (req) => {
    const businesses = await repo.listBusinesses();
    const search = (req.query.search || '').toLowerCase();
    
    let results = businesses.map(b => ({
      id: b.id,
      name: b.name,
      ownerUserId: b.ownerUserId,
      createdAt: b.createdAt
    }));
    
    if (search) {
      results = results.filter(b => 
        b.name.toLowerCase().includes(search) || 
        b.id.toLowerCase().includes(search)
      );
    }
    
    return { businesses: results };
  });

  // Search users by email or ID
  app.get('/admin/search-users', { preHandler: requireAdmin }, async (req) => {
    const q = (req.query.q || '').toLowerCase();
    if (!q) return { users: [] };

    // Search through all users in the database
    const allUsers = await repo.listAllUsers();
    const results = allUsers
      .filter(user => 
        user.email?.toLowerCase().includes(q) || 
        user.id?.includes(q) || 
        (user.name || '').toLowerCase().includes(q)
      )
      .map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        sitterId: user.sitterId,
        isAdmin: user.isAdmin || false
      }));
    
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

  // Start masquerade - returns JWT for target user
  app.post('/admin/masquerade/start', { preHandler: requireAdmin }, async (req, reply) => {
    const { userId } = req.body;
    if (!userId) {
      return reply.code(400).send({ error: 'userId required' });
    }

    const targetUser = await repo.getUser(userId);
    if (!targetUser) {
      return reply.code(404).send({ error: 'User not found' });
    }

    const token = app.jwt.sign({ 
      sub: targetUser.id, 
      email: targetUser.email, 
      sitterId: targetUser.sitterId, 
      isAdmin: targetUser.isAdmin || false 
    });

    return { 
      token,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        sitterId: targetUser.sitterId,
        isAdmin: targetUser.isAdmin || false
      }
    };
  });

  // Exit masquerade - returns JWT for original admin or super admin
  // No requireAdmin pre-handler - masquerade tokens have masqueradeBy claim instead of isAdmin
  app.post('/admin/masquerade/exit', async (req, reply) => {
    // Verify auth token exists (accept both admin and masquerade tokens)
    const authToken = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
    if (!authToken) {
      return reply.code(401).send({ error: 'unauthenticated' });
    }
    
    let payload;
    try {
      // Verify token is valid and capture payload
      payload = app.jwt.verify(authToken);
    } catch (err) {
      return reply.code(401).send({ error: 'invalid or expired token' });
    }
    
    // Get admin user ID from request body or fall back to JWT masqueradeBy claim
    const adminUserId = req.body.adminUserId || payload.masqueradeBy;
    if (!adminUserId) {
      return reply.code(400).send({ error: 'adminUserId required (missing from request body and JWT)' });
    }

    const adminUser = await repo.getUser(adminUserId);
    if (!adminUser) {
      return reply.code(404).send({ error: 'User not found' });
    }
    
    // Allow both regular admins and super admins to exit masquerade
    const isSuperAdmin = adminUser.role?.toUpperCase() === 'SUPER_ADMIN';
    const isRegularAdmin = adminUser.isAdmin === true;
    
    if (!isSuperAdmin && !isRegularAdmin) {
      return reply.code(403).send({ error: 'Not an admin or super admin user' });
    }

    // Log masquerade exit
    await repo.logSystem({
      logType: 'AUTH',
      severity: 'INFO',
      message: `${isSuperAdmin ? 'Super Admin' : 'Admin'} exited masquerade session`,
      businessId: adminUser.businessId,
      userId: adminUserId,
      metadata: {
        returnedToEmail: adminUser.email,
        userType: isSuperAdmin ? 'SUPER_ADMIN' : 'ADMIN'
      }
    });

    // Return appropriate JWT based on user type
    const token = isSuperAdmin
      ? app.jwt.sign({ 
          sub: adminUser.id,
          role: 'SUPER_ADMIN',
          email: adminUser.email
        }, { expiresIn: '8h' })
      : app.jwt.sign({ 
          sub: adminUser.id, 
          email: adminUser.email, 
          sitterId: adminUser.sitterId, 
          isAdmin: true 
        });

    return { 
      token,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        sitterId: adminUser.sitterId,
        isAdmin: isRegularAdmin,
        isSuperAdmin: isSuperAdmin
      }
    };
  });

  // Middleware to check business access
  async function requireBusinessAccess(req, reply) {
    try {
      const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
      const payload = app.jwt.verify(token);
      req.user = payload;
      
      // Verify user has access to this business
      const requestedBusinessId = req.params.id;
      const user = await repo.getUser(payload.sub);
      
      if (!user) {
        return reply.code(401).send({ error: 'unauthenticated' });
      }
      
      // Get business to check ownership
      const business = await repo.getBusiness(requestedBusinessId);
      if (!business) {
        return reply.code(404).send({ error: 'business not found' });
      }
      
      // Check if user is business owner or admin
      const isOwner = business.ownerUserId === user.id;
      const isAdmin = payload.isAdmin;
      const isMemberOfBusiness = user.businessId === requestedBusinessId;
      
      if (!isOwner && !isAdmin && !isMemberOfBusiness) {
        return reply.code(403).send({ error: 'forbidden' });
      }
    } catch {
      return reply.code(401).send({ error: 'unauthenticated' });
    }
  }

  // Get business settings
  app.get('/business/:id/settings', { preHandler: requireBusinessAccess }, async (req, reply) => {
    const settings = await repo.getBusinessSettings(req.params.id);
    if (!settings) {
      return reply.code(404).send({ error: 'Business not found' });
    }
    return settings;
  });

  // Update business settings
  app.put('/business/:id/settings', { preHandler: requireBusinessAccess }, async (req, reply) => {
    const updated = await repo.updateBusinessSettings(
      req.params.id,
      req.body.settings || req.body
    );
    if (!updated) {
      return reply.code(404).send({ error: 'Business not found' });
    }
    return updated.settings;
  });
}
