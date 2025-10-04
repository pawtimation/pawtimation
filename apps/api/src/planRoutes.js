// Plan management routes with FREE/PLUS/PREMIUM tiers
const userPlans = new Map(); // userId -> plan ('FREE'|'PLUS'|'PREMIUM')

export default async function planRoutes(app) {
  
  // Get current user's plan
  app.get('/me/plan', async (req, reply) => {
    try {
      const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
      const payload = app.jwt.verify(token);
      const plan = userPlans.get(payload.sub) || 'FREE';
      return { plan };
    } catch {
      return { plan: 'FREE' };
    }
  });

  // Dev only: Set plan for testing
  app.get('/dev/set-plan/:plan', async (req, reply) => {
    try {
      const { plan } = req.params;
      if (!['FREE', 'PLUS', 'PREMIUM'].includes(plan)) {
        return reply.code(400).send({ error: 'Invalid plan' });
      }
      const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
      const payload = app.jwt.verify(token);
      userPlans.set(payload.sub, plan);
      return { ok: true, plan };
    } catch {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  // Dev only: Reset to FREE
  app.get('/dev/reset-plan', async (req, reply) => {
    try {
      const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
      const payload = app.jwt.verify(token);
      userPlans.delete(payload.sub);
      return { ok: true, plan: 'FREE' };
    } catch {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });
}

// Plan feature mapping
export const FEATURE_PLANS = {
  autopostSocial: 'PREMIUM',
  analyticsInsights: 'PREMIUM',
  autoMatchCompanion: 'PLUS',
  prioritySupport: 'PREMIUM',
  createEvent: 'PLUS',
  liveTracking: 'PREMIUM',
  aiDiary: 'PLUS',
  unlimitedBio: 'PREMIUM',
  verifiedBadge: 'PREMIUM',
  bannerTheme: 'PREMIUM',
  instantAiSummaries: 'PREMIUM',
  weeklyInsights: 'PREMIUM',
  preferredContactMethod: 'PLUS',
  notificationTone: 'PLUS',
  pinChat: 'PREMIUM',
  summariseThread: 'PREMIUM'
};

const PLAN_HIERARCHY = { FREE: 0, PLUS: 1, PREMIUM: 2 };

export function requirePlan(feature) {
  return async (req, reply) => {
    try {
      const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
      const payload = app.jwt.verify(token);
      const userPlan = userPlans.get(payload.sub) || 'FREE';
      const requiredPlan = FEATURE_PLANS[feature];
      
      if (!requiredPlan) return; // Feature not gated
      
      if (PLAN_HIERARCHY[userPlan] < PLAN_HIERARCHY[requiredPlan]) {
        return reply.code(403).send({ 
          error: 'PLAN_REQUIRED', 
          needed: requiredPlan,
          current: userPlan 
        });
      }
    } catch {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  };
}

// Get user plan utility (for use in other routes)
export async function getUserPlan(app, req) {
  try {
    const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
    const payload = app.jwt.verify(token);
    return userPlans.get(payload.sub) || 'FREE';
  } catch {
    return 'FREE';
  }
}
