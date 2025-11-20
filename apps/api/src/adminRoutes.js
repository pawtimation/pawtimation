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

  // Exit masquerade - returns JWT for original admin
  app.post('/admin/masquerade/exit', { preHandler: requireAdmin }, async (req, reply) => {
    const { adminUserId } = req.body;
    if (!adminUserId) {
      return reply.code(400).send({ error: 'adminUserId required' });
    }

    const adminUser = await repo.getUser(adminUserId);
    if (!adminUser || !adminUser.isAdmin) {
      return reply.code(403).send({ error: 'Not an admin user' });
    }

    const token = app.jwt.sign({ 
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
        sitterId: adminUser.sitterId,
        isAdmin: true
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
