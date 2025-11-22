/**
 * Plan Management API Routes
 * 
 * Handles plan upgrades, downgrades, and plan information
 */

import { getAllPlans, getPlan, isUpgrade, isDowngrade } from '../../../shared/planConfig.js';
import { canDowngradeToPlan } from './helpers/planEnforcement.js';
import { repo } from './repo.js';

export default async function planRoutes(fastify) {
  // Middleware to verify authenticated user
  async function requireAuth(req, reply) {
    try {
      const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
      const payload = fastify.jwt.verify(token);
      
      const user = await repo.getUser(payload.sub);
      if (!user) {
        return reply.code(401).send({ error: 'unauthenticated' });
      }
      
      req.user = user;
      req.businessId = user.businessId;
    } catch (err) {
      return reply.code(401).send({ error: 'unauthenticated' });
    }
  }

  // Middleware to verify admin role
  async function requireAdmin(req, reply) {
    await requireAuth(req, reply);
    if (reply.sent) return;
    
    if (req.user.role?.toUpperCase() !== 'ADMIN') {
      return reply.code(403).send({ error: 'forbidden: admin access required' });
    }
  }

  /**
   * GET /api/plans/options
   * Get all available plans and current business plan
   */
  fastify.get('/api/plans/options', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const business = await repo.getBusiness(request.businessId);
      if (!business) {
        return reply.code(404).send({ error: 'Business not found' });
      }

      const allPlans = getAllPlans();
      const currentPlan = getPlan(business.plan);

      // Get current usage stats
      const staff = await repo.getUsersByBusinessId(request.businessId);
      const staffCount = staff.filter(u => u.role === 'STAFF' || u.role === 'ADMIN').length;
      const clients = await repo.getClientsByBusinessId(request.businessId);
      const clientCount = clients.length;

      return reply.send({
        currentPlan: {
          code: business.plan,
          name: currentPlan?.name || 'Unknown',
          billingCycle: business.planBillingCycle,
          status: business.planStatus,
          trialEndsAt: business.trialEndsAt,
          paidUntil: business.paidUntil,
          referralCreditMonths: business.referralCreditMonths || 0
        },
        currentUsage: {
          staff: staffCount,
          clients: clientCount
        },
        availablePlans: allPlans.map(plan => ({
          ...plan,
          isCurrentPlan: plan.planCode === business.plan,
          isUpgrade: isUpgrade(business.plan, plan.planCode),
          isDowngrade: isDowngrade(business.plan, plan.planCode)
        }))
      });
    } catch (error) {
      console.error('Error fetching plan options:', error);
      return reply.code(500).send({ error: 'Failed to fetch plan options' });
    }
  });

  /**
   * POST /api/plans/upgrade
   * Create Stripe Checkout session for plan upgrade
   */
  fastify.post('/api/plans/upgrade', { preHandler: requireAdmin }, async (request, reply) => {
    const { newPlan, billingCycle } = request.body;

    if (!newPlan || !['SOLO', 'TEAM', 'GROWING', 'AGENCY'].includes(newPlan)) {
      return reply.code(400).send({ error: 'Invalid plan code' });
    }

    if (!billingCycle || !['MONTHLY', 'ANNUAL'].includes(billingCycle)) {
      return reply.code(400).send({ error: 'Invalid billing cycle. Must be MONTHLY or ANNUAL' });
    }

    try {
      const business = await repo.getBusiness(request.businessId);
      if (!business) {
        return reply.code(404).send({ error: 'Business not found' });
      }

      // Verify it's actually an upgrade
      if (!isUpgrade(business.plan, newPlan)) {
        return reply.code(400).send({ error: 'This is not an upgrade. Use /downgrade endpoint instead.' });
      }

      const plan = getPlan(newPlan);
      if (!plan) {
        return reply.code(404).send({ error: 'Plan not found' });
      }

      // Redirect to Stripe checkout endpoint
      return reply.send({
        requiresCheckout: true,
        redirectTo: '/api/stripe/create-checkout-session',
        checkoutPayload: {
          planCode: newPlan,
          billingCycle
        }
      });
    } catch (error) {
      console.error('Error preparing upgrade:', error);
      return reply.code(500).send({ error: 'Failed to prepare upgrade' });
    }
  });

  /**
   * POST /api/plans/downgrade
   * Downgrade to a lower plan
   */
  fastify.post('/api/plans/downgrade', { preHandler: requireAdmin }, async (request, reply) => {
    const { newPlan, billingCycle } = request.body;

    if (!newPlan || !['SOLO', 'TEAM', 'GROWING', 'AGENCY'].includes(newPlan)) {
      return reply.code(400).send({ error: 'Invalid plan code' });
    }

    if (!billingCycle || !['MONTHLY', 'ANNUAL'].includes(billingCycle)) {
      return reply.code(400).send({ error: 'Invalid billing cycle. Must be MONTHLY or ANNUAL' });
    }

    try {
      const business = await repo.getBusiness(request.businessId);
      if (!business) {
        return reply.code(404).send({ error: 'Business not found' });
      }

      // Verify it's actually a downgrade
      if (!isDowngrade(business.plan, newPlan)) {
        return reply.code(400).send({ error: 'This is not a downgrade. Use /upgrade endpoint instead.' });
      }

      // Check if downgrade is allowed (current usage must fit new plan limits)
      const validation = await canDowngradeToPlan(repo, request.businessId, newPlan);
      if (!validation.allowed) {
        return reply.code(400).send({
          error: 'Cannot downgrade to this plan',
          reasons: validation.errors
        });
      }

      const plan = getPlan(newPlan);
      if (!plan) {
        return reply.code(404).send({ error: 'Plan not found' });
      }

      // Update business plan
      const updated = await repo.updateBusiness(request.businessId, {
        plan: newPlan,
        planBillingCycle: billingCycle,
        updatedAt: new Date()
        // Keep paidUntil as is - downgrade takes effect at next billing cycle
      });

      // Update business features based on new plan
      await repo.updateBusinessFeatures(request.businessId, {
        premiumDashboards: plan.premiumDashboards,
        gpsWalkRoutes: plan.gpsWalkRoutes,
        automations: plan.automations,
        referralBoost: plan.referralBoost,
        multiStaff: plan.multiStaff,
        routeOptimisation: plan.routeOptimisation
      });

      // Log the downgrade
      await repo.createSystemLog({
        logType: 'PLAN_CHANGE',
        severity: 'INFO',
        message: `Business downgraded from ${business.plan} to ${newPlan}`,
        metadata: {
          businessId: request.businessId,
          businessName: business.name,
          oldPlan: business.plan,
          newPlan,
          billingCycle,
          userId: request.user.id
        }
      });

      return reply.send({
        success: true,
        message: `Successfully downgraded to ${plan.name} plan`,
        plan: {
          code: newPlan,
          name: plan.name,
          billingCycle,
          status: business.planStatus
        }
      });
    } catch (error) {
      console.error('Error downgrading plan:', error);
      return reply.code(500).send({ error: 'Failed to downgrade plan' });
    }
  });

  /**
   * GET /api/plans/current
   * Get current business plan details
   */
  fastify.get('/api/plans/current', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const business = await repo.getBusiness(request.businessId);
      if (!business) {
        return reply.code(404).send({ error: 'Business not found' });
      }

      const currentPlan = getPlan(business.plan);
      const features = await repo.getBusinessFeatures(request.businessId);

      return reply.send({
        plan: {
          code: business.plan,
          name: currentPlan?.name || 'Unknown',
          billingCycle: business.planBillingCycle,
          status: business.planStatus,
          trialEndsAt: business.trialEndsAt,
          paidUntil: business.paidUntil,
          paidAt: business.paidAt,
          referralCreditMonths: business.referralCreditMonths || 0,
          suspensionReason: business.suspensionReason
        },
        limits: {
          maxStaff: currentPlan?.maxStaff,
          maxClients: currentPlan?.maxClients
        },
        features: currentPlan ? {
          premiumDashboards: currentPlan.premiumDashboards,
          gpsWalkRoutes: currentPlan.gpsWalkRoutes,
          automations: currentPlan.automations,
          referralBoost: currentPlan.referralBoost,
          multiStaff: currentPlan.multiStaff,
          routeOptimisation: currentPlan.routeOptimisation,
          advancedFeaturesEnabled: currentPlan.advancedFeaturesEnabled,
          routeGeneratorEnabled: currentPlan.routeGeneratorEnabled,
          financeDashEnabled: currentPlan.financeDashEnabled,
          dailyEmailReports: currentPlan.dailyEmailReports,
          betaEarlyAccess: currentPlan.betaEarlyAccess
        } : null
      });
    } catch (error) {
      console.error('Error fetching current plan:', error);
      return reply.code(500).send({ error: 'Failed to fetch current plan' });
    }
  });
}
