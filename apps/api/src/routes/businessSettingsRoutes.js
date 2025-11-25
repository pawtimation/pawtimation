import { repo } from '../repo.js';
import { nanoid } from 'nanoid';

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
    
    // Combine branding data from multiple sources
    const branding = {
      ...(settings?.branding || {}),
      businessName: settings?.profile?.businessName || '',
      logoUrl: settings?.branding?.logoUrl || ''
    };
    
    return { branding };
  });

  fastify.get('/business/settings', { preHandler: requireBusinessUser }, async (req, reply) => {
    
    const settings = await repo.getBusinessSettings(req.businessId);
    
    if (!settings) {
      return reply.code(404).send({ error: 'Business not found' });
    }
    
    // Also fetch the business record to include referralCode and onboardingSteps
    const { storage } = await import('../storage.js');
    let business = await storage.getBusiness(req.businessId);
    
    // Generate referral code if missing
    if (business && !business.referralCode) {
      const referralCode = `PAW${nanoid(8).toUpperCase()}`;
      await storage.updateBusiness(req.businessId, { referralCode });
      business = { ...business, referralCode };
    }
    
    return {
      ...settings,
      referralCode: business?.referralCode || null,
      onboardingSteps: business?.onboardingSteps || {},
      referralSignupsCount: business?.referralSignupsCount || 0,
      referralCreditsCents: business?.referralCreditsCents || 0
    };
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

  // GET settings for a specific business by ID (for admin/super admin access)
  fastify.get('/business/:businessId/settings', { preHandler: requireBusinessUser }, async (req, reply) => {
    const { businessId } = req.params;
    
    const settings = await repo.getBusinessSettings(businessId);
    
    if (!settings) {
      return reply.code(404).send({ error: 'Business not found' });
    }
    
    // Also fetch the business record to include referralCode and onboardingSteps
    const { storage } = await import('../storage.js');
    let business = await storage.getBusiness(businessId);
    
    // Generate referral code if missing
    if (business && !business.referralCode) {
      const referralCode = `PAW${nanoid(8).toUpperCase()}`;
      await storage.updateBusiness(businessId, { referralCode });
      business = { ...business, referralCode };
    }
    
    return {
      ...settings,
      referralCode: business?.referralCode || null,
      onboardingSteps: business?.onboardingSteps || {},
      referralSignupsCount: business?.referralSignupsCount || 0,
      referralCreditsCents: business?.referralCreditsCents || 0
    };
  });

  // PUT settings for a specific business by ID
  fastify.put('/business/:businessId/settings', { preHandler: requireBusinessUser }, async (req, reply) => {
    const { businessId } = req.params;
    
    const updated = await repo.updateBusinessSettings(
      businessId,
      req.body
    );
    
    if (!updated) {
      return reply.code(404).send({ error: 'Business not found' });
    }
    
    return updated.settings;
  });
}
