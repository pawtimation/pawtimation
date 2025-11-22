import { storage } from '../storage.js';

// Middleware to check beta/trial status for staff and client access
export async function requireActivePlanForStaffClient(request, reply) {
  try {
    await request.jwtVerify();
    const user = request.user;
    
    // Only check for staff and client roles
    if (user.role !== 'STAFF' && user.role !== 'CLIENT') {
      return;
    }

    // Get business to check plan status
    const business = await storage.getBusiness(user.businessId);
    if (!business) {
      return reply.code(403).send({ 
        error: 'Business not found',
        code: 'NO_BUSINESS' 
      });
    }

    const now = new Date();
    
    // Check beta status
    if (business.planStatus === 'BETA') {
      if (business.betaEndsAt && new Date(business.betaEndsAt) <= now) {
        return reply.code(403).send({ 
          error: 'Beta period has ended. Please contact your administrator to activate a paid plan.',
          code: 'BETA_ENDED',
          betaEndsAt: business.betaEndsAt
        });
      }
    }
    
    // Check trial status
    if (business.planStatus === 'FREE_TRIAL') {
      if (business.trialEndsAt && new Date(business.trialEndsAt) <= now) {
        return reply.code(403).send({ 
          error: 'Free trial has ended. Please contact your administrator to activate a paid plan.',
          code: 'TRIAL_ENDED',
          trialEndsAt: business.trialEndsAt
        });
      }
    }
    
    // Check if account is suspended
    if (business.planStatus === 'SUSPENDED') {
      return reply.code(403).send({ 
        error: 'This account has been suspended. Please contact support.',
        code: 'SUSPENDED'
      });
    }
    
    // Allow access
    return;
  } catch (err) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
}
