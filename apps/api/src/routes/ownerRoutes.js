// Owner Portal Routes - Super Admin Only
import * as repo from '../storage.js';
import bcrypt from 'bcryptjs';

// Require SUPER_ADMIN role
async function requireSuperAdmin(fastify, req, reply) {
  try {
    // Use dedicated owner_token cookie for SUPER_ADMIN isolation
    const token = req.cookies?.owner_token || (req.headers.authorization || '').replace('Bearer ', '');
    if (!token) {
      reply.code(401).send({ error: 'unauthenticated' });
      return null;
    }
    
    const payload = fastify.jwt.verify(token);
    
    // Verify role claim in JWT
    if (payload.role !== 'SUPER_ADMIN') {
      reply.code(403).send({ error: 'forbidden: super admin access required' });
      return null;
    }
    
    const user = await repo.getUser(payload.sub);
    
    if (!user || user.role?.toUpperCase() !== 'SUPER_ADMIN') {
      reply.code(403).send({ error: 'forbidden: super admin access required' });
      return null;
    }
    
    return { user };
  } catch (err) {
    reply.code(401).send({ error: 'unauthenticated' });
    return null;
  }
}

export default async function ownerRoutes(fastify, options) {
  // Verification endpoint for client-side guard
  fastify.get('/owner/verify', async (req, reply) => {
    const auth = await requireSuperAdmin(fastify, req, reply);
    if (!auth) return;
    return { valid: true };
  });
  
  // Owner Login
  fastify.post('/owner/login', async (req, reply) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return reply.code(400).send({ error: 'email and password required' });
    }
    
    try {
      // Direct lookup by email - constant time, no business enumeration
      const emailLower = email.toLowerCase();
      const user = await repo.getUserByEmail(emailLower);
      
      // Verify user exists, has SUPER_ADMIN role, and has password hash
      if (!user || user.role?.toUpperCase() !== 'SUPER_ADMIN' || !user.passHash) {
        // Log failed login attempt
        await repo.logSystem({
          businessId: null,
          logType: 'AUTH',
          severity: 'WARN',
          message: 'Super Admin login attempt failed - invalid credentials',
          metadata: { email: emailLower, reason: 'user_not_found_or_not_super_admin' }
        });
        return reply.code(401).send({ error: 'invalid credentials' });
      }
      
      const valid = await bcrypt.compare(password, user.passHash);
      if (!valid) {
        // Log failed login attempt
        await repo.logSystem({
          businessId: null,
          logType: 'AUTH',
          severity: 'WARN',
          message: 'Super Admin login attempt failed - incorrect password',
          metadata: { email: emailLower, userId: user.id }
        });
        return reply.code(401).send({ error: 'invalid credentials' });
      }
      
      // Log login event
      await repo.logSystem({
        businessId: null,
        logType: 'AUTH',
        severity: 'INFO',
        message: 'Super Admin login successful',
        metadata: { userId: user.id, email: user.email },
        userId: user.id
      });
      
      // Issue dedicated SUPER_ADMIN JWT with role claim and short expiry
      const token = fastify.jwt.sign({ 
        sub: user.id,
        role: 'SUPER_ADMIN',
        email: user.email
      }, {
        expiresIn: '8h'  // 8-hour session expiry for security
      });
      
      // Use dedicated owner_token cookie for session isolation
      reply.setCookie('owner_token', token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',  // HTTPS-only in production
        sameSite: 'strict',  // Strict for super admin security
        maxAge: 8 * 60 * 60  // 8 hours to match JWT expiry
      });
      
      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isSuperAdmin: true
        }
      };
    } catch (err) {
      console.error('Owner login error:', err);
      await repo.logSystem({
        businessId: null,
        logType: 'ERROR',
        severity: 'ERROR',
        message: 'Owner login failed',
        metadata: { email, error: err.message }
      });
      return reply.code(500).send({ error: 'login failed' });
    }
  });
  
  // List all businesses with stats (with pagination)
  fastify.get('/owner/businesses', async (req, reply) => {
    const auth = await requireSuperAdmin(fastify, req, reply);
    if (!auth) return;
    
    // Parse pagination parameters
    const parsedPage = parseInt(req.query.page);
    const parsedPageSize = parseInt(req.query.pageSize);
    
    // Use defaults only when parameters are not provided
    const requestedPage = req.query.page ? parsedPage : 1;
    const requestedPageSize = req.query.pageSize ? parsedPageSize : 20;
    
    // Validate page and pageSize bounds
    if (Number.isNaN(requestedPage) || requestedPage < 1) {
      return reply.code(400).send({ error: 'page must be >= 1' });
    }
    if (Number.isNaN(requestedPageSize) || requestedPageSize < 1 || requestedPageSize > 100) {
      return reply.code(400).send({ error: 'pageSize must be between 1 and 100' });
    }
    
    try {
      const businesses = await repo.listBusinesses();
      
      // Sort businesses first to ensure consistent pagination
      businesses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Calculate pagination BEFORE loading stats for efficiency
      const totalCount = businesses.length;
      const totalPages = Math.max(1, Math.ceil(totalCount / requestedPageSize));
      
      // Auto-correct page if it exceeds available pages
      const page = Math.min(requestedPage, totalPages);
      const pageSize = requestedPageSize;
      
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedBusinesses = businesses.slice(startIndex, endIndex);
      
      // Load stats only for businesses on current page
      const businessStats = [];
      
      for (const biz of paginatedBusinesses) {
        const [users, clients, jobs, referrals] = await Promise.all([
          repo.listUsers(biz.id),
          repo.listClients(biz.id),
          repo.listJobs(biz.id),
          repo.getReferralsByReferrer(biz.id)
        ]);
        
        const staffCount = users.filter(u => u.role?.toUpperCase() === 'STAFF').length;
        const conversions = referrals.filter(r => r.status === 'CONVERTED').length;
        
        businessStats.push({
          id: biz.id,
          name: biz.name,
          country: biz.settings?.country || 'Not set',
          plan: biz.plan || 'FREE',
          planStatus: biz.planStatus || 'TRIAL',
          planBillingCycle: biz.planBillingCycle,
          trialStartedAt: biz.trialStartedAt,
          trialEndsAt: biz.trialEndsAt,
          paidUntil: biz.paidUntil,
          referralCreditMonths: biz.referralCreditMonths || 0,
          betaTesterId: biz.betaTesterId,
          referralCode: biz.referralCode,
          referralConversions: conversions,
          activeStaff: staffCount,
          activeClients: clients.length,
          totalBookings: jobs.length,
          createdAt: biz.createdAt
        });
      }
      
      return {
        businesses: businessStats,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages,
          hasMore: page < totalPages,
          requestedPage: requestedPage,
          wasAutoCorrected: requestedPage !== page
        }
      };
    } catch (err) {
      console.error('Failed to load businesses:', err);
      await repo.logSystem({
        businessId: null,
        logType: 'ERROR',
        severity: 'ERROR',
        message: 'Failed to load business stats',
        metadata: { error: err.message }
      });
      return reply.code(500).send({ error: 'failed to load businesses' });
    }
  });
  
  // Masquerade as business admin
  fastify.post('/owner/masquerade/:businessId', async (req, reply) => {
    const auth = await requireSuperAdmin(fastify, req, reply);
    if (!auth) return;
    
    const { businessId } = req.params;
    
    try {
      const business = await repo.getBusiness(businessId);
      if (!business) {
        return reply.code(404).send({ error: 'business not found' });
      }
      
      const users = await repo.listUsers(businessId);
      const admin = users.find(u => u.role?.toUpperCase() === 'ADMIN');
      
      if (!admin) {
        return reply.code(404).send({ error: 'no admin user found for this business' });
      }
      
      // Log masquerade event
      await repo.logSystem({
        businessId,
        logType: 'AUTH',
        severity: 'WARN',
        message: 'Super Admin masquerading as business admin',
        metadata: { 
          superAdminId: auth.user.id,
          targetBusinessId: businessId,
          targetAdminId: admin.id
        },
        userId: auth.user.id
      });
      
      // Issue time-limited masquerade token with role claim (4 hour expiry)
      const token = fastify.jwt.sign({ 
        sub: admin.id,
        role: 'ADMIN',
        masqueradeBy: auth.user.id,
        businessId: businessId
      }, {
        expiresIn: '4h'
      });
      
      return {
        token,
        user: {
          id: admin.id,
          businessId: admin.businessId,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          masquerading: true,
          masqueradingFrom: auth.user.id,
          businessName: business.name
        }
      };
    } catch (err) {
      console.error('Masquerade error:', err);
      await repo.logSystem({
        businessId,
        logType: 'ERROR',
        severity: 'ERROR',
        message: 'Masquerade failed',
        metadata: { error: err.message, businessId }
      });
      return reply.code(500).send({ error: 'masquerade failed' });
    }
  });
  
  // Suspend business
  fastify.post('/owner/businesses/:businessId/suspend', async (req, reply) => {
    const auth = await requireSuperAdmin(fastify, req, reply);
    if (!auth) return;
    
    const { businessId } = req.params;
    
    try {
      const business = await repo.getBusiness(businessId);
      if (!business) {
        return reply.code(404).send({ error: 'business not found' });
      }
      
      await repo.updateBusiness(businessId, {
        planStatus: 'SUSPENDED'
      });
      
      await repo.logSystem({
        businessId,
        logType: 'ADMIN_ACTION',
        severity: 'WARN',
        message: 'Business suspended by Super Admin',
        metadata: { adminId: auth.user.id },
        userId: auth.user.id
      });
      
      return { success: true, message: 'Business suspended' };
    } catch (err) {
      console.error('Suspend error:', err);
      return reply.code(500).send({ error: 'failed to suspend business' });
    }
  });
  
  // Extend trial
  fastify.post('/owner/businesses/:businessId/extend-trial', async (req, reply) => {
    const auth = await requireSuperAdmin(fastify, req, reply);
    if (!auth) return;
    
    const { businessId } = req.params;
    const { days } = req.body;
    
    if (!days || days <= 0) {
      return reply.code(400).send({ error: 'days must be positive number' });
    }
    
    try {
      const business = await repo.getBusiness(businessId);
      if (!business) {
        return reply.code(404).send({ error: 'business not found' });
      }
      
      const currentEnd = business.trialEndsAt ? new Date(business.trialEndsAt) : new Date();
      const newEnd = new Date(currentEnd.getTime() + days * 24 * 60 * 60 * 1000);
      
      await repo.updateBusiness(businessId, {
        trialEndsAt: newEnd
      });
      
      await repo.logSystem({
        businessId,
        logType: 'ADMIN_ACTION',
        severity: 'INFO',
        message: `Trial extended by ${days} days`,
        metadata: { 
          adminId: auth.user.id,
          days,
          newEndDate: newEnd
        },
        userId: auth.user.id
      });
      
      return { success: true, message: `Trial extended by ${days} days`, newEndDate: newEnd };
    } catch (err) {
      console.error('Extend trial error:', err);
      return reply.code(500).send({ error: 'failed to extend trial' });
    }
  });
  
  // Reset admin password
  fastify.post('/owner/businesses/:businessId/reset-password', async (req, reply) => {
    const auth = await requireSuperAdmin(fastify, req, reply);
    if (!auth) return;
    
    const { businessId } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return reply.code(400).send({ error: 'password must be at least 6 characters' });
    }
    
    try {
      const users = await repo.listUsers(businessId);
      const admin = users.find(u => u.role?.toUpperCase() === 'ADMIN');
      
      if (!admin) {
        return reply.code(404).send({ error: 'no admin user found' });
      }
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await repo.updateUser(admin.id, {
        passHash: hashedPassword
      });
      
      await repo.logSystem({
        businessId,
        logType: 'ADMIN_ACTION',
        severity: 'WARN',
        message: 'Admin password reset by Super Admin',
        metadata: { 
          adminId: auth.user.id,
          targetUserId: admin.id
        },
        userId: auth.user.id
      });
      
      return { success: true, message: 'Password reset successfully' };
    } catch (err) {
      console.error('Reset password error:', err);
      return reply.code(500).send({ error: 'failed to reset password' });
    }
  });
  
  // Get system logs (enhanced with full filtering)
  fastify.get('/owner/logs', async (req, reply) => {
    const auth = await requireSuperAdmin(fastify, req, reply);
    if (!auth) return;
    
    const { 
      businessId, 
      logType, 
      severity,
      userId,
      startDate,
      endDate,
      search,
      limit = 100,
      offset = 0
    } = req.query;
    
    try {
      const result = await repo.getSystemLogs({
        businessId: businessId || undefined,
        logType: logType || undefined,
        severity: severity || undefined,
        userId: userId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: search || undefined,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      // repo.getSystemLogs now returns { logs, pagination: { limit, offset, total, hasMore } }
      return result;
    } catch (err) {
      console.error('Failed to load logs:', err);
      return reply.code(500).send({ error: 'failed to load logs' });
    }
  });
  
  // Change business plan (Owner Portal)
  fastify.post('/owner/businesses/:businessId/change-plan', async (req, reply) => {
    const auth = await requireSuperAdmin(fastify, req, reply);
    if (!auth) return;
    
    const { businessId } = req.params;
    const { newPlan, billingCycle } = req.body;
    
    if (!newPlan || !['SOLO', 'TEAM', 'GROWING', 'AGENCY'].includes(newPlan)) {
      return reply.code(400).send({ error: 'Invalid plan code' });
    }
    
    if (billingCycle && !['MONTHLY', 'ANNUAL'].includes(billingCycle)) {
      return reply.code(400).send({ error: 'Invalid billing cycle' });
    }
    
    try {
      const business = await repo.getBusiness(businessId);
      if (!business) {
        return reply.code(404).send({ error: 'Business not found' });
      }
      
      const { getPlan } = await import('../../../shared/planConfig.js');
      const plan = getPlan(newPlan);
      
      if (!plan) {
        return reply.code(404).send({ error: 'Plan not found' });
      }
      
      // Update business plan
      await repo.updateBusiness(businessId, {
        plan: newPlan,
        planBillingCycle: billingCycle || business.planBillingCycle || 'MONTHLY',
        planStatus: 'PAID',
        paidAt: new Date(),
        paidUntil: billingCycle === 'ANNUAL' 
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        suspensionReason: null
      });
      
      // Update business features
      await repo.updateBusinessFeatures(businessId, {
        premiumDashboards: plan.premiumDashboards,
        gpsWalkRoutes: plan.gpsWalkRoutes,
        automations: plan.automations,
        referralBoost: plan.referralBoost,
        multiStaff: plan.multiStaff,
        routeOptimisation: plan.routeOptimisation
      });
      
      // Log the change
      await repo.logSystem({
        businessId,
        logType: 'PLAN_CHANGE',
        severity: 'INFO',
        message: `Super Admin changed business plan from ${business.plan} to ${newPlan}`,
        metadata: { 
          adminId: auth.user.id,
          oldPlan: business.plan,
          newPlan,
          billingCycle: billingCycle || business.planBillingCycle
        },
        userId: auth.user.id
      });
      
      return { success: true, message: `Plan changed to ${plan.name}`, plan: newPlan };
    } catch (err) {
      console.error('Change plan error:', err);
      return reply.code(500).send({ error: 'Failed to change plan' });
    }
  });
  
  // Get business plan details (Owner Portal)
  fastify.get('/owner/businesses/:businessId/plan', async (req, reply) => {
    const auth = await requireSuperAdmin(fastify, req, reply);
    if (!auth) return;
    
    const { businessId } = req.params;
    
    try {
      const business = await repo.getBusiness(businessId);
      if (!business) {
        return reply.code(404).send({ error: 'Business not found' });
      }
      
      const { getPlan } = await import('../../../shared/planConfig.js');
      const currentPlan = getPlan(business.plan);
      const features = await repo.getBusinessFeatures(businessId);
      
      // Get usage stats
      const [users, clients] = await Promise.all([
        repo.listUsers(businessId),
        repo.listClients(businessId)
      ]);
      
      const staffCount = users.filter(u => u.role?.toUpperCase() === 'STAFF' || u.role?.toUpperCase() === 'ADMIN').length;
      
      return {
        plan: {
          code: business.plan,
          name: currentPlan?.name || 'Unknown',
          billingCycle: business.planBillingCycle,
          status: business.planStatus,
          trialStartedAt: business.trialStartedAt,
          trialEndsAt: business.trialEndsAt,
          paidAt: business.paidAt,
          paidUntil: business.paidUntil,
          referralCreditMonths: business.referralCreditMonths || 0,
          suspensionReason: business.suspensionReason,
          isPlanLocked: business.isPlanLocked
        },
        limits: currentPlan ? {
          maxStaff: currentPlan.maxStaff,
          maxClients: currentPlan.maxClients
        } : null,
        usage: {
          staff: staffCount,
          clients: clients.length
        },
        features
      };
    } catch (err) {
      console.error('Get plan details error:', err);
      return reply.code(500).send({ error: 'Failed to get plan details' });
    }
  });
}
