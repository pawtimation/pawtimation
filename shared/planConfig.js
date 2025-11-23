/**
 * Plan Definitions for Pawtimation Pricing System
 * 
 * Defines the 4 pricing tiers: SOLO, TEAM, GROWING, AGENCY
 * with feature flags, limits, and pricing.
 */

export const PLANS = {
  TRIAL: {
    planCode: 'TRIAL',
    name: 'Trial',
    description: 'Free trial period',
    maxStaff: 1,
    maxClients: 10,
    advancedFeaturesEnabled: false,
    routeGeneratorEnabled: false,
    financeDashEnabled: false,
    dailyEmailReports: false,
    betaEarlyAccess: false,
    premiumDashboards: false,
    gpsWalkRoutes: false,
    automations: false,
    referralBoost: false,
    multiStaff: false,
    routeOptimisation: false,
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      'Up to 10 clients',
      'Basic calendar',
      'Client portal',
      'Invoice generation',
      'Trial period'
    ]
  },
  FOUNDING_MEMBER: {
    planCode: 'FOUNDING_MEMBER',
    name: 'Founding Member',
    description: 'Exclusive lifetime pricing for beta testers',
    maxStaff: 5,
    maxClients: null, // unlimited
    advancedFeaturesEnabled: true,
    routeGeneratorEnabled: true,
    financeDashEnabled: true,
    dailyEmailReports: true,
    betaEarlyAccess: true,
    premiumDashboards: true,
    gpsWalkRoutes: true,
    automations: false,
    referralBoost: true,
    multiStaff: true,
    routeOptimisation: false,
    monthlyPrice: 19,
    annualPrice: 190,
    features: [
      'Up to 5 staff members',
      'Unlimited clients',
      'Route generator',
      'Finance dashboard',
      'Daily email reports',
      'Lifetime £19/month pricing',
      'Beta early access',
      'Priority support'
    ]
  },
  SOLO: {
    planCode: 'SOLO',
    name: 'Solo',
    description: 'Perfect for independent dog walkers',
    maxStaff: 1,
    maxClients: 25,
    advancedFeaturesEnabled: false,
    routeGeneratorEnabled: false,
    financeDashEnabled: false,
    dailyEmailReports: false,
    betaEarlyAccess: false,
    premiumDashboards: false,
    gpsWalkRoutes: false,
    automations: false,
    referralBoost: false,
    multiStaff: false,
    routeOptimisation: false,
    monthlyPrice: 19,
    annualPrice: 190, // ~16.67/month (2 months free)
    features: [
      'Up to 25 clients',
      'Basic calendar',
      'Client portal',
      'Invoice generation',
      'Email support'
    ]
  },
  TEAM: {
    planCode: 'TEAM',
    name: 'Team',
    description: 'For small teams growing their business',
    maxStaff: 5,
    maxClients: null, // unlimited
    advancedFeaturesEnabled: true,
    routeGeneratorEnabled: true,
    financeDashEnabled: true,
    dailyEmailReports: true,
    betaEarlyAccess: false,
    premiumDashboards: true,
    gpsWalkRoutes: true,
    automations: false,
    referralBoost: true,
    multiStaff: true,
    routeOptimisation: false,
    monthlyPrice: 49,
    annualPrice: 490, // ~40.83/month (2 months free)
    features: [
      'Up to 5 staff members',
      'Unlimited clients',
      'Route generator',
      'Finance dashboard',
      'Daily email reports',
      'Staff management',
      'Referral rewards',
      'Priority email support'
    ]
  },
  GROWING: {
    planCode: 'GROWING',
    name: 'Growing',
    description: 'For established businesses scaling up',
    maxStaff: 15,
    maxClients: null, // unlimited
    advancedFeaturesEnabled: true,
    routeGeneratorEnabled: true,
    financeDashEnabled: true,
    dailyEmailReports: true,
    betaEarlyAccess: true,
    premiumDashboards: true,
    gpsWalkRoutes: true,
    automations: true,
    referralBoost: true,
    multiStaff: true,
    routeOptimisation: true,
    monthlyPrice: 99,
    annualPrice: 990, // ~82.50/month (2 months free)
    features: [
      'Up to 15 staff members',
      'Unlimited clients',
      'Route optimization',
      'Advanced automations',
      'Beta feature access',
      'Multi-location support',
      'Advanced analytics',
      'Priority phone support'
    ]
  },
  AGENCY: {
    planCode: 'AGENCY',
    name: 'Agency',
    description: 'For large operations and franchises',
    maxStaff: null, // unlimited
    maxClients: null, // unlimited
    advancedFeaturesEnabled: true,
    routeGeneratorEnabled: true,
    financeDashEnabled: true,
    dailyEmailReports: true,
    betaEarlyAccess: true,
    premiumDashboards: true,
    gpsWalkRoutes: true,
    automations: true,
    referralBoost: true,
    multiStaff: true,
    routeOptimisation: true,
    monthlyPrice: 249,
    annualPrice: 2490, // ~207.50/month (2 months free)
    features: [
      'Unlimited staff',
      'Unlimited clients',
      'White-label options',
      'Dedicated account manager',
      'Custom integrations',
      'API access',
      'Advanced reporting',
      '24/7 priority support'
    ]
  }
};

/**
 * Get plan configuration by plan code
 */
export function getPlan(planCode) {
  return PLANS[planCode] || null;
}

/**
 * Get all available plans
 */
export function getAllPlans() {
  return Object.values(PLANS);
}

/**
 * Check if a plan allows a specific feature
 */
export function checkPlanFeature(planCode, featureName) {
  const plan = getPlan(planCode);
  if (!plan) return false;
  return plan[featureName] === true;
}

/**
 * Get plan limits
 */
export function getPlanLimits(planCode) {
  const plan = getPlan(planCode);
  if (!plan) return null;
  
  return {
    maxStaff: plan.maxStaff,
    maxClients: plan.maxClients
  };
}

/**
 * Check if upgrade is allowed (moving to higher tier)
 */
export function isUpgrade(currentPlan, newPlan) {
  const tierOrder = ['TRIAL', 'FOUNDING_MEMBER', 'SOLO', 'TEAM', 'GROWING', 'AGENCY'];
  const currentIndex = tierOrder.indexOf(currentPlan);
  const newIndex = tierOrder.indexOf(newPlan);
  return newIndex > currentIndex;
}

/**
 * Check if downgrade is allowed (moving to lower tier)
 */
export function isDowngrade(currentPlan, newPlan) {
  const tierOrder = ['TRIAL', 'FOUNDING_MEMBER', 'SOLO', 'TEAM', 'GROWING', 'AGENCY'];
  const currentIndex = tierOrder.indexOf(currentPlan);
  const newIndex = tierOrder.indexOf(newPlan);
  return newIndex < currentIndex;
}
