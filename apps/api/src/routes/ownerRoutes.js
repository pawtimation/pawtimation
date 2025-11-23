// Owner Portal Routes - Super Admin Only
import * as repo from '../repo.js';
import { storage } from '../storage.js';
import bcrypt from 'bcryptjs';
import { getSecuritySummary } from '../utils/securityMonitoring.js';
import { exportClientData, eraseClientData } from '../utils/gdprCompliance.js';
import { db } from '../db.js';
import { sql } from 'drizzle-orm';

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
  
  // Beta Applications - List all beta testers
  fastify.get('/owner/beta/testers', async (req, reply) => {
    const auth = await requireSuperAdmin(fastify, req, reply);
    if (!auth) return;
    
    const testers = await storage.getAllBetaTesters();
    return { testers };
  });

  // Beta Applications - Activate a beta tester
  fastify.post('/owner/beta/activate/:id', async (req, reply) => {
    const auth = await requireSuperAdmin(fastify, req, reply);
    if (!auth) return;
    
    const { id } = req.params;
    
    try {
      const { activateBetaTester } = await import('./betaRoutes.js');
      const result = await activateBetaTester(id);
      return result;
    } catch (err) {
      console.error('Beta activation error:', err);
      if (err.message.includes('not found')) {
        return reply.code(404).send({ error: err.message });
      }
      if (err.message.includes('already active') || err.message.includes('capacity')) {
        return reply.code(400).send({ error: err.message });
      }
      return reply.code(500).send({ error: err.message || 'Failed to activate beta tester' });
    }
  });

  // Beta Applications - Resend activation email
  fastify.post('/owner/beta/resend/:id', async (req, reply) => {
    const auth = await requireSuperAdmin(fastify, req, reply);
    if (!auth) return;
    
    const { id } = req.params;
    
    try {
      const tester = await storage.getBetaTester(id);
      if (!tester) {
        return reply.code(404).send({ error: 'Beta tester not found' });
      }
      
      if (tester.status !== 'ACTIVE') {
        return reply.code(400).send({ error: 'Beta tester is not active' });
      }
      
      const business = await repo.getBusiness(tester.businessId);
      if (!business) {
        return reply.code(404).send({ error: 'Business not found' });
      }
      
      const users = await repo.listUsersByBusiness(tester.businessId);
      const adminUser = users.find(u => u.role?.toUpperCase() === 'ADMIN');
      if (!adminUser) {
        return reply.code(404).send({ error: 'Admin user not found' });
      }
      
      // Generate new temporary password
      const { nanoid } = await import('nanoid');
      const tempPassword = `Paw${nanoid(12)}!`;
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      
      // Update admin user password
      await repo.updateUser(adminUser.id, { passHash: passwordHash });
      
      // Send activation email with correct URL
      const baseUrl = process.env.VITE_API_BASE || (process.env.REPL_SLUG ? `https://${process.env.REPL_ID || ''}.${process.env.REPL_SLUG}.repl.co` : 'http://localhost:3000');
      const setupUrl = `${baseUrl}/admin/login?redirect=/setup-account`;
      const betaEndDate = new Date(tester.betaEndsAt || '2025-12-31');
      
      const { sendEmail } = await import('../emailService.js');
      await sendEmail({
        to: tester.email,
        subject: 'Your Pawtimation Login Details - Action Required',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #3F9C9B;">Your Pawtimation Login Details</h1>
            <p>Hi ${tester.name},</p>
            <p>Here are your updated login credentials for Pawtimation:</p>
            
            <div style="background-color: #f0fdfa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #3F9C9B; margin-top: 0;">Login Credentials</h2>
              <p><strong>Email:</strong> ${tester.email}</p>
              <p><strong>New Password:</strong> ${tempPassword}</p>
              <p style="margin: 0;"><em>Please change this password in your settings after logging in.</em></p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${setupUrl}" style="background-color: #3F9C9B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Access Your Account</a>
            </div>
            
            <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #3F9C9B; margin: 20px 0;">
              <p style="margin: 0;"><strong>Beta Period:</strong> Now until ${betaEndDate.toLocaleDateString()}</p>
              <p style="margin: 10px 0 0 0;"><strong>Referral Code:</strong> ${business.referralCode} (Share to earn rewards!)</p>
            </div>
            
            <p>If you have any questions, just reply to this email.</p>
            
            <p>Best,<br>Andrew & the Pawtimation team</p>
          </div>
        `
      });
      
      return { success: true, message: 'Activation email resent successfully' };
    } catch (err) {
      console.error('Resend activation email error:', err);
      return reply.code(500).send({ error: 'Failed to resend activation email' });
    }
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
  
  // Get platform-wide stats
  fastify.get('/owner/stats', async (req, reply) => {
    const auth = await requireSuperAdmin(fastify, req, reply);
    if (!auth) return;
    
    try {
      const businesses = await repo.listBusinesses();
      const activeBusinesses = businesses.filter(b => 
        b.planStatus === 'PAID' || b.planStatus === 'TRIAL' || b.planStatus === 'FREE_TRIAL' || b.planStatus === 'BETA'
      );
      
      let totalStaff = 0;
      let totalClients = 0;
      let totalDogs = 0;
      let totalBookings = 0;
      let bookingsLast7Days = 0;
      let bookingsToday = 0;
      
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      for (const biz of businesses) {
        const [users, clients, dogs, jobs] = await Promise.all([
          repo.listUsersByBusiness(biz.id),
          repo.listClientsByBusiness(biz.id),
          repo.listDogsByBusiness(biz.id),
          repo.listJobsByBusiness(biz.id)
        ]);
        
        totalStaff += users.filter(u => u.role?.toUpperCase() === 'STAFF').length;
        totalClients += clients.length;
        totalDogs += dogs.length;
        totalBookings += jobs.length;
        
        const recentJobs = jobs.filter(j => {
          const jobDate = new Date(j.scheduledFor);
          return jobDate >= sevenDaysAgo && jobDate <= now;
        });
        bookingsLast7Days += recentJobs.length;
        
        const todayJobs = jobs.filter(j => {
          const jobDate = new Date(j.scheduledFor);
          return jobDate >= todayStart && jobDate < new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
        });
        bookingsToday += todayJobs.length;
      }
      
      return {
        totalBusinesses: businesses.length,
        activeBusinesses: activeBusinesses.length,
        totalStaff,
        totalClients,
        totalDogs,
        totalBookings,
        bookingsLast7Days,
        bookingsToday
      };
    } catch (err) {
      console.error('Failed to get platform stats:', err);
      console.error('Error stack:', err.stack);
      console.error('Error message:', err.message);
      return reply.code(500).send({ error: 'Failed to retrieve platform statistics' });
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
          repo.listUsersByBusiness(biz.id),
          repo.listClientsByBusiness(biz.id),
          repo.listJobsByBusiness(biz.id),
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
      console.error('Error stack:', err.stack);
      console.error('Error message:', err.message);
      await repo.logSystem({
        businessId: null,
        logType: 'ERROR',
        severity: 'ERROR',
        message: 'Failed to load business stats',
        metadata: { error: err.message, stack: err.stack }
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
      
      const users = await repo.listUsersByBusiness(businessId);
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
      const users = await repo.listUsersByBusiness(businessId);
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
      console.error('Error stack:', err.stack);
      console.error('Error message:', err.message);
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
        repo.listUsersByBusiness(businessId),
        repo.listClientsByBusiness(businessId)
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

  // Trigger manual database backup
  fastify.post('/owner/backup/create', async (req, reply) => {
    const auth = await requireSuperAdmin(fastify, req, reply);
    if (!auth) return;

    try {
      const { backupService } = await import('../utils/databaseBackup.js');
      const result = await backupService.createBackup();

      await repo.logSystem({
        businessId: null,
        logType: 'SYSTEM',
        severity: 'INFO',
        message: 'Manual database backup created',
        metadata: {
          userId: auth.user.id,
          fileName: result.fileName,
          size: result.size
        }
      });

      return result;
    } catch (err) {
      console.error('Manual backup error:', err);
      return reply.code(500).send({ error: 'Failed to create backup', message: err.message });
    }
  });

  // List all database backups
  fastify.get('/owner/backup/list', async (req, reply) => {
    const auth = await requireSuperAdmin(fastify, req, reply);
    if (!auth) return;

    try {
      const { backupService } = await import('../utils/databaseBackup.js');
      const backups = await backupService.listBackups();
      return { backups };
    } catch (err) {
      console.error('List backups error:', err);
      return reply.code(500).send({ error: 'Failed to list backups' });
    }
  });
  
  // Security monitoring summary
  fastify.get('/owner/security/summary', async (req, reply) => {
    const auth = await requireSuperAdmin(fastify, req, reply);
    if (!auth) return;
    
    const summary = getSecuritySummary();
    return summary;
  });
  
  // Export client data (GDPR Right to Data Portability)
  fastify.post('/owner/gdpr/export/:businessId/:clientId', async (req, reply) => {
    const auth = await requireSuperAdmin(fastify, req, reply);
    if (!auth) return;
    
    const { businessId, clientId } = req.params;
    
    try {
      const exportData = await exportClientData(clientId, businessId);
      
      await repo.logSystem({
        businessId,
        logType: 'GDPR_EXPORT',
        severity: 'INFO',
        message: `Client data exported by super admin`,
        metadata: {
          clientId,
          superAdminId: auth.user.id,
          timestamp: new Date().toISOString()
        }
      });
      
      return exportData;
    } catch (err) {
      console.error('GDPR export error:', err);
      return reply.code(500).send({ error: 'Failed to export client data', message: err.message });
    }
  });
  
  // Erase client data (GDPR Right to Erasure)
  fastify.post('/owner/gdpr/erase/:businessId/:clientId', async (req, reply) => {
    const auth = await requireSuperAdmin(fastify, req, reply);
    if (!auth) return;
    
    const { businessId, clientId } = req.params;
    const { keepAnonymizedRecords = true, deleteMedia = true } = req.body || {};
    
    try {
      const deletionSummary = await eraseClientData(clientId, businessId, {
        keepAnonymizedRecords,
        deleteMedia
      });
      
      await repo.logSystem({
        businessId: null,
        logType: 'GDPR_ERASURE',
        severity: 'WARN',
        message: `Client data erased by super admin`,
        metadata: {
          businessId,
          clientId,
          superAdminId: auth.user.id,
          deletionSummary,
          timestamp: new Date().toISOString()
        }
      });
      
      return deletionSummary;
    } catch (err) {
      console.error('GDPR erasure error:', err);
      return reply.code(500).send({ error: 'Failed to erase client data', message: err.message });
    }
  });

  // Sales & Billing Analytics - Executive KPIs
  fastify.get('/owner/sales/stats', async (req, reply) => {
    const auth = await requireSuperAdmin(fastify, req, reply);
    if (!auth) return;
    
    try {
      const result = await db.execute(sql`
        WITH subscription_prices AS (
          SELECT
            s.id,
            s.status,
            s.customer,
            p.unit_amount * COALESCE((item->>'quantity')::integer, 1) as total_amount,
            p.recurring->>'interval' as interval,
            p.currency
          FROM stripe.subscriptions s
          CROSS JOIN LATERAL jsonb_array_elements(s.items -> 'data') as item
          JOIN stripe.prices p ON p.id = item->'price'->>'id'
          WHERE s.status IN ('active', 'trialing', 'canceled', 'past_due')
        ),
        subscription_stats AS (
          SELECT
            COUNT(DISTINCT id) FILTER (WHERE status = 'active') as active_subscriptions,
            COUNT(DISTINCT id) FILTER (WHERE status = 'trialing') as trialing_subscriptions,
            COUNT(DISTINCT id) FILTER (WHERE status = 'canceled') as canceled_subscriptions,
            COUNT(DISTINCT id) FILTER (WHERE status = 'past_due') as past_due_subscriptions,
            COALESCE(SUM(CASE 
              WHEN status = 'active' AND interval = 'month' 
              THEN total_amount::numeric / 100.0
              WHEN status = 'active' AND interval = 'year'
              THEN (total_amount::numeric / 100.0) / 12.0
              ELSE 0 
            END), 0) as mrr,
            COALESCE(SUM(CASE 
              WHEN status = 'trialing' AND interval = 'month' 
              THEN total_amount::numeric / 100.0
              WHEN status = 'trialing' AND interval = 'year'
              THEN (total_amount::numeric / 100.0) / 12.0
              ELSE 0 
            END), 0) as trial_mrr
          FROM subscription_prices
        ),
        invoice_stats AS (
          SELECT
            COUNT(*) FILTER (WHERE status = 'paid') as paid_invoices,
            COUNT(*) FILTER (WHERE status = 'open') as open_invoices,
            COUNT(*) FILTER (WHERE status = 'uncollectible') as failed_invoices,
            SUM(CASE WHEN status = 'paid' THEN (amount_paid::numeric / 100.0) ELSE 0 END) as total_revenue,
            SUM(CASE 
              WHEN status = 'open' AND due_date < EXTRACT(EPOCH FROM NOW()) 
              THEN (amount_due::numeric / 100.0) 
              ELSE 0 
            END) as overdue_amount
          FROM stripe.invoices
        ),
        business_stats AS (
          SELECT
            COUNT(*) as total_businesses,
            COUNT(*) FILTER (WHERE plan_status = 'ACTIVE') as active_businesses,
            COUNT(*) FILTER (WHERE plan_status = 'TRIAL') as trial_businesses,
            COUNT(*) FILTER (WHERE plan_status = 'SUSPENDED') as suspended_businesses
          FROM businesses
        ),
        user_stats AS (
          SELECT
            COUNT(*) FILTER (WHERE role = 'ADMIN') as total_admins,
            COUNT(*) FILTER (WHERE role = 'STAFF') as total_staff,
            COUNT(*) as total_users
          FROM users
          WHERE role != 'SUPER_ADMIN'
        ),
        client_stats AS (
          SELECT COUNT(*) as total_clients FROM clients
        ),
        churn_stats AS (
          SELECT
            COUNT(*) FILTER (
              WHERE status = 'canceled' 
              AND canceled_at >= EXTRACT(EPOCH FROM NOW() - INTERVAL '30 days')
            ) as churned_last_month,
            COUNT(*) FILTER (
              WHERE status IN ('active', 'canceled')
              AND created < EXTRACT(EPOCH FROM NOW() - INTERVAL '30 days')
            ) as total_month_ago
          FROM stripe.subscriptions
        )
        SELECT
          s.*,
          i.*,
          b.*,
          u.*,
          c.*,
          ch.*,
          (s.mrr * 12) as arr,
          CASE 
            WHEN s.active_subscriptions > 0 
            THEN s.mrr / s.active_subscriptions 
            ELSE 0 
          END as arpu,
          CASE
            WHEN ch.total_month_ago > 0
            THEN ROUND((ch.churned_last_month::numeric / ch.total_month_ago::numeric * 100), 2)
            ELSE 0
          END as churn_rate,
          100.0 as nrr
        FROM subscription_stats s
        CROSS JOIN invoice_stats i
        CROSS JOIN business_stats b
        CROSS JOIN user_stats u
        CROSS JOIN client_stats c
        CROSS JOIN churn_stats ch
      `);
      
      const stats = result.rows[0] || {};
      
      return {
        subscriptions: {
          active: parseInt(stats.active_subscriptions) || 0,
          trialing: parseInt(stats.trialing_subscriptions) || 0,
          canceled: parseInt(stats.canceled_subscriptions) || 0,
          pastDue: parseInt(stats.past_due_subscriptions) || 0
        },
        revenue: {
          mrr: parseFloat(stats.mrr) || 0,
          arr: parseFloat(stats.arr) || 0,
          arpu: parseFloat(stats.arpu) || 0,
          trialMrr: parseFloat(stats.trial_mrr) || 0,
          totalRevenue: parseFloat(stats.total_revenue) || 0,
          churnRate: parseFloat(stats.churn_rate) || 0,
          nrr: parseFloat(stats.nrr) || 100
        },
        invoices: {
          paid: parseInt(stats.paid_invoices) || 0,
          open: parseInt(stats.open_invoices) || 0,
          failed: parseInt(stats.failed_invoices) || 0,
          overdueAmount: parseFloat(stats.overdue_amount) || 0
        },
        businesses: {
          total: parseInt(stats.total_businesses) || 0,
          active: parseInt(stats.active_businesses) || 0,
          trial: parseInt(stats.trial_businesses) || 0,
          suspended: parseInt(stats.suspended_businesses) || 0
        },
        users: {
          total: parseInt(stats.total_users) || 0,
          admins: parseInt(stats.total_admins) || 0,
          staff: parseInt(stats.total_staff) || 0,
          clients: parseInt(stats.total_clients) || 0
        }
      };
    } catch (err) {
      console.error('Sales stats error:', err);
      return reply.code(500).send({ error: 'Failed to fetch sales stats' });
    }
  });

  // Revenue time-series metrics
  fastify.get('/owner/sales/metrics', async (req, reply) => {
    const auth = await requireSuperAdmin(fastify, req, reply);
    if (!auth) return;
    
    // Sanitize months parameter to prevent SQL injection
    const rawMonths = req.query.months || 12;
    const months = Math.max(1, Math.min(24, parseInt(rawMonths, 10) || 12));
    
    try {
      // Calculate cutoff timestamp in JavaScript to avoid SQL interpolation
      const cutoffTimestamp = Math.floor(Date.now() / 1000) - (months * 30 * 24 * 60 * 60);
      
      const result = await db.execute(sql`
        WITH monthly_revenue AS (
          SELECT
            DATE_TRUNC('month', TO_TIMESTAMP(created)) as month,
            SUM(amount_paid::numeric / 100.0) as revenue,
            COUNT(*) as invoice_count
          FROM stripe.invoices
          WHERE status = 'paid'
            AND created >= ${cutoffTimestamp}
          GROUP BY DATE_TRUNC('month', TO_TIMESTAMP(created))
          ORDER BY month DESC
        )
        SELECT
          TO_CHAR(month, 'YYYY-MM') as month,
          ROUND(revenue::numeric, 2) as revenue,
          invoice_count
        FROM monthly_revenue
      `);
      
      return {
        timeSeries: result.rows.reverse()
      };
    } catch (err) {
      console.error('Sales metrics error:', err);
      return reply.code(500).send({ error: 'Failed to fetch revenue metrics' });
    }
  });

  // Invoice operations
  fastify.get('/owner/sales/invoices', async (req, reply) => {
    const auth = await requireSuperAdmin(fastify, req, reply);
    if (!auth) return;
    
    const { status, limit = 50, offset = 0 } = req.query;
    
    try {
      let query = sql`
        SELECT
          id,
          customer,
          status,
          (amount_due::numeric / 100.0) as amount_due,
          (amount_paid::numeric / 100.0) as amount_paid,
          currency,
          TO_TIMESTAMP(created) as created_at,
          TO_TIMESTAMP(due_date) as due_date,
          TO_TIMESTAMP(paid_at) as paid_at
        FROM stripe.invoices
      `;
      
      if (status) {
        query = sql`${query} WHERE status = ${status}`;
      }
      
      query = sql`${query} ORDER BY created DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
      
      const result = await db.execute(query);
      
      const countResult = await db.execute(
        status 
          ? sql`SELECT COUNT(*) as total FROM stripe.invoices WHERE status = ${status}`
          : sql`SELECT COUNT(*) as total FROM stripe.invoices`
      );
      
      return {
        invoices: result.rows,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: parseInt(countResult.rows[0]?.total || 0),
          hasMore: parseInt(offset) + result.rows.length < parseInt(countResult.rows[0]?.total || 0)
        }
      };
    } catch (err) {
      console.error('Sales invoices error:', err);
      return reply.code(500).send({ error: 'Failed to fetch invoices' });
    }
  });

  // Payment failures and health
  fastify.get('/owner/sales/payments', async (req, reply) => {
    const auth = await requireSuperAdmin(fastify, req, reply);
    if (!auth) return;
    
    try {
      const result = await db.execute(sql`
        WITH payment_stats AS (
          SELECT
            COUNT(*) as total_charges,
            COUNT(*) FILTER (WHERE paid = true) as successful_charges,
            COUNT(*) FILTER (WHERE paid = false) as failed_charges,
            SUM(CASE WHEN paid = true THEN (amount::numeric / 100.0) ELSE 0 END) as total_processed,
            SUM(CASE WHEN paid = false THEN (amount::numeric / 100.0) ELSE 0 END) as total_failed
          FROM stripe.charges
          WHERE created >= EXTRACT(EPOCH FROM NOW() - INTERVAL '30 days')
        ),
        recent_failures AS (
          SELECT
            id,
            customer,
            (amount::numeric / 100.0) as amount,
            currency,
            failure_message,
            TO_TIMESTAMP(created) as created_at
          FROM stripe.charges
          WHERE paid = false
          ORDER BY created DESC
          LIMIT 10
        )
        SELECT
          (SELECT row_to_json(p) FROM payment_stats p) as stats,
          (SELECT json_agg(f) FROM recent_failures f) as recent_failures
      `);
      
      const data = result.rows[0] || {};
      const stats = data.stats || {};
      
      return {
        stats: {
          totalCharges: parseInt(stats.total_charges) || 0,
          successfulCharges: parseInt(stats.successful_charges) || 0,
          failedCharges: parseInt(stats.failed_charges) || 0,
          totalProcessed: parseFloat(stats.total_processed) || 0,
          totalFailed: parseFloat(stats.total_failed) || 0,
          successRate: stats.total_charges > 0 
            ? (parseFloat(stats.successful_charges) / parseFloat(stats.total_charges) * 100).toFixed(2)
            : 100
        },
        recentFailures: data.recent_failures || []
      };
    } catch (err) {
      console.error('Payment stats error:', err);
      return reply.code(500).send({ error: 'Failed to fetch payment stats' });
    }
  });

  // Business leaderboards
  fastify.get('/owner/sales/businesses', async (req, reply) => {
    const auth = await requireSuperAdmin(fastify, req, reply);
    if (!auth) return;
    
    try {
      const result = await db.execute(sql`
        WITH business_revenue AS (
          SELECT
            b.id,
            b.name,
            b.plan_status,
            b.plan,
            COUNT(DISTINCT u.id) as user_count,
            COUNT(DISTINCT c.id) as client_count,
            COUNT(DISTINCT j.id) as job_count,
            COALESCE(SUM(i.amount_cents / 100.0), 0) as total_revenue
          FROM businesses b
          LEFT JOIN users u ON u.business_id = b.id AND u.role != 'SUPER_ADMIN'
          LEFT JOIN clients c ON c.business_id = b.id
          LEFT JOIN jobs j ON j.business_id = b.id AND j.status = 'COMPLETED'
          LEFT JOIN invoices i ON i.business_id = b.id AND i.status = 'PAID'
          GROUP BY b.id, b.name, b.plan_status, b.plan
        )
        SELECT
          id,
          name,
          plan_status,
          plan as plan_tier,
          user_count,
          client_count,
          job_count,
          ROUND(total_revenue::numeric, 2) as total_revenue
        FROM business_revenue
        ORDER BY total_revenue DESC
        LIMIT 20
      `);
      
      return {
        businesses: result.rows
      };
    } catch (err) {
      console.error('Business leaderboard error:', err);
      return reply.code(500).send({ error: 'Failed to fetch business leaderboard' });
    }
  });

  // User insights
  fastify.get('/owner/sales/users', async (req, reply) => {
    const auth = await requireSuperAdmin(fastify, req, reply);
    if (!auth) return;
    
    try {
      const result = await db.execute(sql`
        WITH user_growth AS (
          SELECT
            DATE_TRUNC('month', created_at) as month,
            COUNT(*) FILTER (WHERE role = 'ADMIN') as new_admins,
            COUNT(*) FILTER (WHERE role = 'STAFF') as new_staff,
            COUNT(*) as total_new_users
          FROM users
          WHERE role != 'SUPER_ADMIN'
            AND created_at >= NOW() - INTERVAL '12 months'
          GROUP BY DATE_TRUNC('month', created_at)
          ORDER BY month DESC
        ),
        business_activity AS (
          SELECT
            b.id,
            b.name,
            COUNT(DISTINCT u.id) as user_count,
            MAX(u.created_at) as last_user_added
          FROM businesses b
          LEFT JOIN users u ON u.business_id = b.id AND u.role != 'SUPER_ADMIN'
          GROUP BY b.id, b.name
          HAVING COUNT(DISTINCT u.id) > 0
          ORDER BY last_user_added DESC
          LIMIT 10
        )
        SELECT
          (SELECT json_agg(g ORDER BY g.month DESC) FROM user_growth g) as growth,
          (SELECT json_agg(a) FROM business_activity a) as recent_activity
      `);
      
      const data = result.rows[0] || {};
      
      return {
        growth: data.growth || [],
        recentActivity: data.recent_activity || []
      };
    } catch (err) {
      console.error('User insights error:', err);
      return reply.code(500).send({ error: 'Failed to fetch user insights' });
    }
  });

  // HEALTH DASHBOARD ENDPOINTS

  // Top-level health status summary
  fastify.get('/owner/health/status', async (req, reply) => {
    const auth = await requireSuperAdmin(fastify, req, reply);
    if (!auth) return;
    
    try {
      const result = await db.execute(sql`
        WITH error_stats AS (
          SELECT
            COUNT(*) FILTER (WHERE severity IN ('ERROR', 'CRITICAL')) as high_errors_24h,
            COUNT(*) FILTER (WHERE severity IN ('ERROR', 'CRITICAL') AND created_at >= NOW() - INTERVAL '1 hour') as high_errors_1h,
            AVG(CASE 
              WHEN metadata->>'responseTime' IS NOT NULL 
              THEN (metadata->>'responseTime')::numeric 
              ELSE NULL 
            END) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour') as avg_response_time_ms
          FROM system_logs
          WHERE created_at >= NOW() - INTERVAL '24 hours'
        ),
        billing_stats AS (
          SELECT
            COUNT(*) FILTER (WHERE status = 'uncollectible') as failed_invoices,
            COUNT(*) FILTER (WHERE status = 'open' AND due_date < EXTRACT(EPOCH FROM NOW())) as overdue_invoices
          FROM stripe.invoices
          WHERE created >= EXTRACT(EPOCH FROM NOW() - INTERVAL '7 days')
        ),
        subscription_health AS (
          SELECT
            COUNT(*) FILTER (WHERE status = 'past_due') as past_due,
            COUNT(*) FILTER (WHERE cancel_at_period_end = true) as canceling_soon
          FROM stripe.subscriptions
        )
        SELECT
          e.*,
          b.failed_invoices,
          b.overdue_invoices,
          s.past_due as past_due_subs,
          s.canceling_soon
        FROM error_stats e
        CROSS JOIN billing_stats b
        CROSS JOIN subscription_health s
      `);
      
      const stats = result.rows[0] || {};
      
      // Calculate system status
      const highErrors1h = parseInt(stats.high_errors_1h) || 0;
      const avgResponseTime = parseFloat(stats.avg_response_time_ms) || 0;
      const billingIssues = (parseInt(stats.failed_invoices) || 0) + (parseInt(stats.past_due_subs) || 0);
      
      let systemStatus = 'Healthy';
      if (highErrors1h > 10 || avgResponseTime > 500 || billingIssues > 5) {
        systemStatus = 'Critical';
      } else if (highErrors1h > 5 || avgResponseTime > 200 || billingIssues > 0) {
        systemStatus = 'Warnings';
      }
      
      return {
        systemStatus,
        apiResponseTime: {
          avgMs: Math.round(avgResponseTime),
          status: avgResponseTime < 200 ? 'good' : avgResponseTime < 500 ? 'warning' : 'critical'
        },
        errors24h: parseInt(stats.high_errors_24h) || 0,
        billingHealth: {
          failedInvoices: parseInt(stats.failed_invoices) || 0,
          overdueInvoices: parseInt(stats.overdue_invoices) || 0,
          pastDueSubscriptions: parseInt(stats.past_due_subs) || 0,
          cancelingSoon: parseInt(stats.canceling_soon) || 0,
          status: billingIssues === 0 ? 'healthy' : billingIssues < 5 ? 'warning' : 'critical'
        }
      };
    } catch (err) {
      console.error('Health status error:', err);
      return reply.code(500).send({ error: 'Failed to fetch health status' });
    }
  });

  // Live system alerts
  fastify.get('/owner/health/alerts', async (req, reply) => {
    const auth = await requireSuperAdmin(fastify, req, reply);
    if (!auth) return;
    
    try {
      const alerts = [];
      
      // Check high error rates
      const errorRates = await db.execute(sql`
        SELECT
          log_type,
          COUNT(*) as error_count,
          MAX(created_at) as last_error
        FROM system_logs
        WHERE severity IN ('ERROR', 'CRITICAL')
          AND created_at >= NOW() - INTERVAL '10 minutes'
        GROUP BY log_type
        HAVING COUNT(*) > 5
        ORDER BY error_count DESC
        LIMIT 5
      `);
      
      for (const row of errorRates.rows) {
        alerts.push({
          severity: row.error_count > 20 ? 'critical' : 'warning',
          type: 'high_error_rate',
          message: `High error rate detected on ${row.logType} (${row.error_count} errors in 10 min)`,
          timestamp: row.last_error,
          metadata: { logType: row.logType, count: row.error_count }
        });
      }
      
      // Check slow endpoints
      const slowEndpoints = await db.execute(sql`
        SELECT
          metadata->>'endpoint' as endpoint,
          AVG((metadata->>'responseTime')::numeric) as avg_time,
          COUNT(*) as request_count
        FROM system_logs
        WHERE log_type = 'API'
          AND metadata->>'responseTime' IS NOT NULL
          AND created_at >= NOW() - INTERVAL '15 minutes'
        GROUP BY metadata->>'endpoint'
        HAVING AVG((metadata->>'responseTime')::numeric) > 2000
        ORDER BY avg_time DESC
        LIMIT 3
      `);
      
      for (const row of slowEndpoints.rows) {
        alerts.push({
          severity: 'warning',
          type: 'slow_endpoint',
          message: `Slow endpoint: ${row.endpoint} - ${(parseFloat(row.avg_time) / 1000).toFixed(2)} sec avg`,
          timestamp: new Date().toISOString(),
          metadata: { endpoint: row.endpoint, avgMs: parseFloat(row.avg_time) }
        });
      }
      
      // Check expired subscriptions
      const expiredSubs = await db.execute(sql`
        SELECT
          s.id,
          s.customer,
          s.status,
          TO_TIMESTAMP(s.current_period_end) as period_end
        FROM stripe.subscriptions s
        WHERE s.status = 'past_due'
          OR (s.status = 'canceled' AND s.canceled_at >= EXTRACT(EPOCH FROM NOW() - INTERVAL '24 hours'))
        LIMIT 5
      `);
      
      for (const row of expiredSubs.rows) {
        alerts.push({
          severity: row.status === 'past_due' ? 'critical' : 'info',
          type: 'subscription_issue',
          message: `Subscription ${row.status} for customer ${row.customer}`,
          timestamp: new Date().toISOString(),
          metadata: { subscriptionId: row.id, customer: row.customer, status: row.status }
        });
      }
      
      // Check unusual activity
      const unusualActivity = await db.execute(sql`
        WITH daily_avg AS (
          SELECT AVG(daily_count) as avg_count
          FROM (
            SELECT DATE(created_at) as day, COUNT(*) as daily_count
            FROM users
            WHERE role = 'STAFF'
              AND created_at >= NOW() - INTERVAL '30 days'
              AND created_at < CURRENT_DATE
            GROUP BY DATE(created_at)
          ) sub
        ),
        today_count AS (
          SELECT COUNT(*) as count
          FROM users
          WHERE role = 'STAFF'
            AND created_at >= CURRENT_DATE
        )
        SELECT
          t.count as today,
          d.avg_count as avg
        FROM today_count t, daily_avg d
        WHERE t.count > d.avg_count * 3
      `);
      
      if (unusualActivity.rows.length > 0) {
        const row = unusualActivity.rows[0];
        alerts.push({
          severity: 'info',
          type: 'unusual_activity',
          message: `New staff logins unusually high today (${Math.round(parseFloat(row.today) / parseFloat(row.avg))}x normal)`,
          timestamp: new Date().toISOString(),
          metadata: { today: parseInt(row.today), average: parseFloat(row.avg) }
        });
      }
      
      // Sort by severity
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
      
      return { alerts: alerts.slice(0, 10) };
    } catch (err) {
      console.error('Health alerts error:', err);
      return reply.code(500).send({ error: 'Failed to fetch health alerts' });
    }
  });

  // Health metrics time-series
  fastify.get('/owner/health/metrics', async (req, reply) => {
    const auth = await requireSuperAdmin(fastify, req, reply);
    if (!auth) return;
    
    const { days = 7 } = req.query;
    const safeDays = Math.max(1, Math.min(30, parseInt(days, 10) || 7));
    
    try {
      const result = await db.execute(sql`
        WITH daily_errors AS (
          SELECT
            DATE(created_at) as day,
            COUNT(*) FILTER (WHERE log_type = 'API' AND metadata->>'statusCode' = '400') as errors_400,
            COUNT(*) FILTER (WHERE log_type = 'API' AND metadata->>'statusCode' = '401') as errors_401,
            COUNT(*) FILTER (WHERE log_type = 'API' AND metadata->>'statusCode' = '404') as errors_404,
            COUNT(*) FILTER (WHERE log_type = 'API' AND metadata->>'statusCode' LIKE '5%') as errors_500,
            COUNT(*) FILTER (WHERE severity = 'ERROR') as total_errors
          FROM system_logs
          WHERE created_at >= CURRENT_DATE - INTERVAL '${sql.raw(safeDays.toString())} days'
          GROUP BY DATE(created_at)
          ORDER BY day ASC
        ),
        daily_latency AS (
          SELECT
            DATE(created_at) as day,
            AVG((metadata->>'responseTime')::numeric) as avg_latency_ms,
            MAX((metadata->>'responseTime')::numeric) as max_latency_ms,
            PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (metadata->>'responseTime')::numeric) as p95_latency_ms
          FROM system_logs
          WHERE log_type = 'API'
            AND metadata->>'responseTime' IS NOT NULL
            AND created_at >= CURRENT_DATE - INTERVAL '${sql.raw(safeDays.toString())} days'
          GROUP BY DATE(created_at)
          ORDER BY day ASC
        ),
        billing_failures AS (
          SELECT
            DATE(TO_TIMESTAMP(created)) as day,
            COUNT(*) FILTER (WHERE status = 'uncollectible') as failed_count,
            SUM(CASE WHEN status = 'uncollectible' THEN amount_due::numeric / 100.0 ELSE 0 END) as failed_amount
          FROM stripe.invoices
          WHERE created >= EXTRACT(EPOCH FROM CURRENT_DATE - INTERVAL '${sql.raw(safeDays.toString())} days')
          GROUP BY DATE(TO_TIMESTAMP(created))
          ORDER BY day ASC
        )
        SELECT
          (SELECT json_agg(e ORDER BY e.day) FROM daily_errors e) as error_trends,
          (SELECT json_agg(l ORDER BY l.day) FROM daily_latency l) as latency_trends,
          (SELECT json_agg(b ORDER BY b.day) FROM billing_failures b) as billing_trends
      `);
      
      const data = result.rows[0] || {};
      
      return {
        errorTrends: data.error_trends || [],
        latencyTrends: data.latency_trends || [],
        billingTrends: data.billing_trends || []
      };
    } catch (err) {
      console.error('Health metrics error:', err);
      return reply.code(500).send({ error: 'Failed to fetch health metrics' });
    }
  });

  // Business activity monitoring
  fastify.get('/owner/health/activity', async (req, reply) => {
    const auth = await requireSuperAdmin(fastify, req, reply);
    if (!auth) return;
    
    try {
      const result = await db.execute(sql`
        WITH walk_stats AS (
          SELECT
            DATE(start) as day,
            COUNT(*) as walk_count,
            COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_count
          FROM jobs
          WHERE start >= CURRENT_DATE - INTERVAL '7 days'
          GROUP BY DATE(start)
          ORDER BY day DESC
        ),
        user_activity AS (
          SELECT
            0 as active_clients_24h,
            0 as active_staff_24h,
            COUNT(DISTINCT id) FILTER (WHERE role = 'CLIENT') as total_clients,
            COUNT(DISTINCT id) FILTER (WHERE role = 'STAFF') as total_staff
          FROM users
          WHERE role != 'SUPER_ADMIN'
        ),
        messaging_stats AS (
          SELECT
            COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as messages_24h,
            COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as messages_7d
          FROM messages
        ),
        invoice_volume AS (
          SELECT
            COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as invoices_24h,
            COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as invoices_7d,
            COALESCE(SUM(amount_cents) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days'), 0)::numeric / 100.0 as revenue_7d
          FROM invoices
        ),
        security_events AS (
          SELECT
            COUNT(*) as failed_logins_24h
          FROM system_logs
          WHERE log_type = 'AUTH'
            AND severity = 'WARN'
            AND message LIKE '%failed%'
            AND created_at >= NOW() - INTERVAL '24 hours'
        )
        SELECT
          (SELECT json_agg(w ORDER BY w.day DESC) FROM walk_stats w LIMIT 7) as walk_trends,
          u.*,
          m.*,
          i.*,
          s.failed_logins_24h
        FROM user_activity u
        CROSS JOIN messaging_stats m
        CROSS JOIN invoice_volume i
        CROSS JOIN security_events s
      `);
      
      const data = result.rows[0] || {};
      
      return {
        walkVolume: data.walk_trends || [],
        userActivity: {
          activeClients24h: parseInt(data.active_clients_24h) || 0,
          activeStaff24h: parseInt(data.active_staff_24h) || 0,
          totalClients: parseInt(data.total_clients) || 0,
          totalStaff: parseInt(data.total_staff) || 0
        },
        messaging: {
          messages24h: parseInt(data.messages_24h) || 0,
          messages7d: parseInt(data.messages_7d) || 0
        },
        invoicing: {
          invoices24h: parseInt(data.invoices_24h) || 0,
          invoices7d: parseInt(data.invoices_7d) || 0,
          revenue7d: parseFloat(data.revenue_7d) || 0
        },
        security: {
          failedLogins24h: parseInt(data.failed_logins_24h) || 0
        }
      };
    } catch (err) {
      console.error('Activity monitoring error:', err);
      return reply.code(500).send({ error: 'Failed to fetch activity data' });
    }
  });

  // Data integrity checks
  // Business Onboarding Progress Tracking
  fastify.get('/owner/health/onboarding-progress', async (req, reply) => {
    const auth = await requireSuperAdmin(fastify, req, reply);
    if (!auth) return;
    
    try {
      const businesses = await repo.getAllBusinesses();
      
      const progress = businesses.map(business => {
        const steps = business.onboardingSteps || {};
        
        const stepFields = [
          'servicesAdded',
          'staffAdded',
          'clientsAdded',
          'firstBookingCreated',
          'firstBookingCompleted',
          'firstInvoiceGenerated',
          'firstPaymentReceived'
        ];
        
        const completedSteps = stepFields.filter(field => steps[field] === true);
        const completionPercent = Math.round((completedSteps.length / stepFields.length) * 100);
        
        let status = 'red';
        if (completionPercent >= 70) status = 'green';
        else if (completionPercent >= 30) status = 'amber';
        
        return {
          businessId: business.id,
          businessName: business.name,
          ownerEmail: business.ownerEmail || 'N/A',
          joinedAt: business.createdAt,
          completedSteps,
          totalSteps: stepFields.length,
          completionPercent,
          status,
          steps: {
            servicesAdded: steps.servicesAdded || false,
            staffAdded: steps.staffAdded || false,
            clientsAdded: steps.clientsAdded || false,
            firstBookingCreated: steps.firstBookingCreated || false,
            firstBookingCompleted: steps.firstBookingCompleted || false,
            firstInvoiceGenerated: steps.firstInvoiceGenerated || false,
            firstPaymentReceived: steps.firstPaymentReceived || false
          }
        };
      });
      
      return { businesses: progress };
    } catch (err) {
      console.error('Failed to fetch onboarding progress:', err);
      return reply.code(500).send({ error: 'failed to fetch onboarding progress' });
    }
  });
  
  fastify.get('/owner/health/integrity', async (req, reply) => {
    const auth = await requireSuperAdmin(fastify, req, reply);
    if (!auth) return;
    
    try {
      const issues = [];
      
      // Dogs without clients
      const orphanDogs = await db.execute(sql`
        SELECT d.id, d.name
        FROM dogs d
        LEFT JOIN clients c ON c.id = d.client_id
        WHERE c.id IS NULL
        LIMIT 10
      `);
      
      if (orphanDogs.rows.length > 0) {
        issues.push({
          severity: 'high',
          category: 'orphaned_records',
          message: `${orphanDogs.rows.length} dogs without valid owners`,
          affectedIds: orphanDogs.rows.map(r => r.id),
          action: 'review_and_reassign'
        });
      }
      
      // Jobs without staff
      const unstaffedJobs = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM jobs
        WHERE staff_id IS NULL
          AND status = 'CONFIRMED'
          AND start >= NOW()
      `);
      
      const unstaffedCount = parseInt(unstaffedJobs.rows[0]?.count) || 0;
      if (unstaffedCount > 0) {
        issues.push({
          severity: 'medium',
          category: 'unassigned_work',
          message: `${unstaffedCount} confirmed jobs without assigned staff`,
          count: unstaffedCount,
          action: 'assign_staff'
        });
      }
      
      // Overlapping jobs for same staff
      const overlaps = await db.execute(sql`
        SELECT
          j1.id as job1_id,
          j2.id as job2_id,
          j1.staff_id
        FROM jobs j1
        JOIN jobs j2 ON j1.staff_id = j2.staff_id
          AND j1.id < j2.id
          AND j1.start < j2.end
          AND j2.start < j1.end
        WHERE j1.status != 'CANCELLED'
          AND j2.status != 'CANCELLED'
          AND j1.start >= NOW()
          AND j1.staff_id IS NOT NULL
        LIMIT 10
      `);
      
      if (overlaps.rows.length > 0) {
        issues.push({
          severity: 'high',
          category: 'scheduling_conflicts',
          message: `${overlaps.rows.length} overlapping job assignments detected`,
          conflicts: overlaps.rows.map(r => ({ job1: r.job1_id, job2: r.job2_id, staffId: r.staffId })),
          action: 'resolve_conflicts'
        });
      }
      
      // Invoices with zero or negative amounts
      const badInvoices = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM invoices
        WHERE amount_cents <= 0
      `);
      
      const badInvoiceCount = parseInt(badInvoices.rows[0]?.count) || 0;
      if (badInvoiceCount > 0) {
        issues.push({
          severity: 'high',
          category: 'data_corruption',
          message: `${badInvoiceCount} invoices with invalid amounts`,
          count: badInvoiceCount,
          action: 'review_invoices'
        });
      }
      
      // Staff without availability
      const noAvailability = await db.execute(sql`
        SELECT u.id, u.name
        FROM users u
        LEFT JOIN availability a ON a.staff_id = u.id
        WHERE u.role = 'STAFF'
          AND u.business_id IS NOT NULL
          AND a.id IS NULL
        LIMIT 10
      `);
      
      if (noAvailability.rows.length > 0) {
        issues.push({
          severity: 'low',
          category: 'incomplete_data',
          message: `${noAvailability.rows.length} staff members without availability settings`,
          affectedUsers: noAvailability.rows.map(r => ({ id: r.id, name: r.name })),
          action: 'configure_availability'
        });
      }
      
      // Clients without required contact data
      const incompleteClients = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM clients
        WHERE (phone IS NULL OR phone = '')
          OR address IS NULL
      `);
      
      const incompleteCount = parseInt(incompleteClients.rows[0]?.count) || 0;
      if (incompleteCount > 0) {
        issues.push({
          severity: 'low',
          category: 'incomplete_data',
          message: `${incompleteCount} clients missing phone or address data`,
          count: incompleteCount,
          action: 'request_client_updates'
        });
      }
      
      return {
        issues,
        summary: {
          total: issues.length,
          high: issues.filter(i => i.severity === 'high').length,
          medium: issues.filter(i => i.severity === 'medium').length,
          low: issues.filter(i => i.severity === 'low').length
        },
        lastChecked: new Date().toISOString()
      };
    } catch (err) {
      console.error('Data integrity check error:', err);
      return reply.code(500).send({ error: 'Failed to run integrity checks' });
    }
  });

  // BLUEPRINT: Data repair endpoint - find and fix orphaned invoice items
  fastify.post('/owner/health/repair-orphaned-items', async (req, reply) => {
    const auth = await requireSuperAdmin(fastify, req, reply);
    if (!auth) return;
    
    const { businessId } = req.body;
    
    if (!businessId) {
      return reply.code(400).send({ error: 'businessId required' });
    }
    
    try {
      const result = await repo.repairOrphanedInvoiceItems(businessId);
      
      // Log the repair action
      await repo.logSystem({
        businessId: null,
        logType: 'SYSTEM',
        severity: 'INFO',
        message: 'Super Admin repaired orphaned invoice items',
        metadata: { 
          businessId,
          orphanedJobs: result.orphanedJobs,
          repairedItems: result.repairedItems,
          performedBy: auth.user.id
        },
        userId: auth.user.id
      });
      
      return result;
    } catch (err) {
      console.error('Repair orphaned items error:', err);
      return reply.code(500).send({ error: 'Failed to repair orphaned items' });
    }
  });

  // BLUEPRINT: Find unbilled invoice items
  fastify.get('/owner/health/unbilled-items/:businessId', async (req, reply) => {
    const auth = await requireSuperAdmin(fastify, req, reply);
    if (!auth) return;
    
    const { businessId } = req.params;
    
    try {
      const items = await repo.findUnbilledInvoiceItems(businessId);
      return {
        count: items.length,
        items: items.slice(0, 100) // Limit to first 100 for display
      };
    } catch (err) {
      console.error('Find unbilled items error:', err);
      return reply.code(500).send({ error: 'Failed to find unbilled items' });
    }
  });
}
