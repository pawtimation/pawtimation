/**
 * Plan Enforcement Helpers
 * 
 * Enforces plan limits and feature gates for Pawtimation pricing system
 */

import { getPlan, getPlanLimits, checkPlanFeature } from '../../../../shared/planConfig.js';

/**
 * Check if business can add more staff
 * @returns {success: boolean, error?: string}
 */
export async function canAddStaff(repo, businessId) {
  const business = await repo.getBusiness(businessId);
  if (!business) {
    return { success: false, error: 'Business not found' };
  }

  // Get current staff count
  const staff = await repo.listUsersByBusiness(businessId);
  const staffCount = staff.filter(u => u.role === 'STAFF' || u.role === 'ADMIN').length;

  // Get plan limits
  const plan = getPlan(business.plan);
  if (!plan) {
    return { success: false, error: 'Invalid plan configuration' };
  }

  // Check limit (null = unlimited)
  if (plan.maxStaff !== null && staffCount >= plan.maxStaff) {
    return {
      success: false,
      error: `Your ${plan.name} plan allows up to ${plan.maxStaff} staff member${plan.maxStaff !== 1 ? 's' : ''}. Upgrade your plan to add more.`,
      limit: plan.maxStaff,
      current: staffCount
    };
  }

  return { success: true };
}

/**
 * Check if business can add more clients
 * @returns {success: boolean, error?: string}
 */
export async function canAddClient(repo, businessId) {
  const business = await repo.getBusiness(businessId);
  if (!business) {
    return { success: false, error: 'Business not found' };
  }

  // Get current client count
  const clients = await repo.getClientsByBusinessId(businessId);
  const clientCount = clients.length;

  // Get plan limits
  const plan = getPlan(business.plan);
  if (!plan) {
    return { success: false, error: 'Invalid plan configuration' };
  }

  // Check limit (null = unlimited)
  if (plan.maxClients !== null && clientCount >= plan.maxClients) {
    return {
      success: false,
      error: `Your ${plan.name} plan allows up to ${plan.maxClients} clients. Upgrade your plan to add more.`,
      limit: plan.maxClients,
      current: clientCount
    };
  }

  return { success: true };
}

/**
 * Check if business has access to a specific feature
 * @returns {success: boolean, error?: string}
 */
export async function canAccessFeature(repo, businessId, featureName) {
  const business = await repo.getBusiness(businessId);
  if (!business) {
    return { success: false, error: 'Business not found' };
  }

  const plan = getPlan(business.plan);
  if (!plan) {
    return { success: false, error: 'Invalid plan configuration' };
  }

  const hasFeature = plan[featureName] === true;

  if (!hasFeature) {
    const featureLabels = {
      routeGeneratorEnabled: 'Route Generator',
      financeDashEnabled: 'Finance Dashboard',
      advancedFeaturesEnabled: 'Advanced Features',
      dailyEmailReports: 'Daily Email Reports',
      betaEarlyAccess: 'Beta Early Access',
      premiumDashboards: 'Premium Dashboards',
      gpsWalkRoutes: 'GPS Walk Routes',
      automations: 'Automations',
      referralBoost: 'Referral Boost',
      multiStaff: 'Multi-Staff Management',
      routeOptimisation: 'Route Optimization'
    };

    const label = featureLabels[featureName] || featureName;

    return {
      success: false,
      error: `${label} is not available on your current plan. Upgrade to unlock this feature.`,
      feature: featureName
    };
  }

  return { success: true };
}

/**
 * Check if business account is suspended (trial expired or payment failed)
 * @returns {isSuspended: boolean, reason?: string, allowAdminAccess: boolean}
 */
export async function checkBusinessSuspension(repo, businessId) {
  const business = await repo.getBusiness(businessId);
  if (!business) {
    return { isSuspended: true, reason: 'Business not found', allowAdminAccess: false };
  }

  const now = new Date();

  // Check if trial expired
  if (business.planStatus === 'TRIAL' && business.trialEndsAt && now > new Date(business.trialEndsAt)) {
    return {
      isSuspended: true,
      reason: 'Your trial has ended. Please choose a plan to continue.',
      allowAdminAccess: true // Admin can still login to choose plan
    };
  }

  // Check if payment expired
  if (business.planStatus === 'PAID' && business.paidUntil && now > new Date(business.paidUntil)) {
    return {
      isSuspended: true,
      reason: 'Your subscription has expired. Please update your payment method.',
      allowAdminAccess: true
    };
  }

  // Check if manually suspended
  if (business.planStatus === 'SUSPENDED') {
    return {
      isSuspended: true,
      reason: business.suspensionReason || 'Your account has been suspended. Please contact support.',
      allowAdminAccess: true
    };
  }

  return { isSuspended: false, allowAdminAccess: true };
}

/**
 * Validate if downgrade is allowed (check if current usage fits new plan)
 * @returns {allowed: boolean, errors: string[]}
 */
export async function canDowngradeToPlan(repo, businessId, newPlanCode) {
  const business = await repo.getBusiness(businessId);
  if (!business) {
    return { allowed: false, errors: ['Business not found'] };
  }

  const newPlan = getPlan(newPlanCode);
  if (!newPlan) {
    return { allowed: false, errors: ['Invalid plan'] };
  }

  const errors = [];

  // Check staff count
  if (newPlan.maxStaff !== null) {
    const staff = await repo.listUsersByBusiness(businessId);
    const staffCount = staff.filter(u => u.role === 'STAFF' || u.role === 'ADMIN').length;
    
    if (staffCount > newPlan.maxStaff) {
      errors.push(
        `You have ${staffCount} staff members, but the ${newPlan.name} plan allows only ${newPlan.maxStaff}. Please reduce your staff count first.`
      );
    }
  }

  // Check client count
  if (newPlan.maxClients !== null) {
    const clients = await repo.getClientsByBusinessId(businessId);
    const clientCount = clients.length;
    
    if (clientCount > newPlan.maxClients) {
      errors.push(
        `You have ${clientCount} clients, but the ${newPlan.name} plan allows only ${newPlan.maxClients}. Please reduce your client count first.`
      );
    }
  }

  return {
    allowed: errors.length === 0,
    errors
  };
}

/**
 * Log feature access attempt (for analytics and upsell tracking)
 */
export async function logFeatureAccess(repo, businessId, featureName, accessGranted) {
  try {
    const business = await repo.getBusiness(businessId);
    
    await repo.createSystemLog({
      logType: 'FEATURE_ACCESS',
      severity: accessGranted ? 'INFO' : 'WARN',
      message: accessGranted 
        ? `Feature accessed: ${featureName}`
        : `Feature access denied: ${featureName}`,
      metadata: {
        businessId,
        businessName: business?.name,
        plan: business?.plan,
        feature: featureName,
        accessGranted
      }
    });
  } catch (error) {
    console.error('Failed to log feature access:', error);
  }
}
