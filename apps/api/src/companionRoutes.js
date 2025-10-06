// Companion onboarding and profile management
// In-memory storage for MVP

const companionProfiles = new Map(); // userId -> profile data
const companionAvailability = new Map(); // userId -> slots[]
const companionChecklist = new Map(); // userId -> checklist status

function getUserFromToken(app, req, reply) {
  try {
    const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
    const payload = app.jwt.verify(token);
    return payload;
  } catch {
    reply.code(401).send({ error: 'unauthenticated' });
    return null;
  }
}

export default async function companionRoutes(app) {
  
  // Get companion checklist status
  app.get('/companion/checklist', async (req, reply) => {
    const user = getUserFromToken(app, req, reply);
    if (!user) return;
    
    const userId = user.sub;
    const checklist = companionChecklist.get(userId) || {
      photo: false,
      bio: false,
      services: false,
      availability: false,
      verification: false
    };
    
    // Auto-calculate some checklist items
    const profile = companionProfiles.get(userId);
    const slots = companionAvailability.get(userId) || [];
    
    if (profile) {
      if (profile.avatarUrl && !profile.avatarUrl.includes('placehold')) {
        checklist.photo = true;
      }
      if (profile.bio && profile.bio.length >= 80) {
        checklist.bio = true;
      }
      if (profile.services && profile.services.length > 0) {
        checklist.services = true;
      }
    }
    
    if (slots.length >= 3) {
      checklist.availability = true;
    }
    
    companionChecklist.set(userId, checklist);
    
    return { checklist };
  });
  
  // Get companion availability slots
  app.get('/companion/availability', async (req, reply) => {
    const user = getUserFromToken(app, req, reply);
    if (!user) return;
    
    const userId = user.sub;
    const slots = companionAvailability.get(userId) || [];
    
    return { slots };
  });
  
  // Add availability slot
  app.post('/companion/availability', async (req, reply) => {
    const user = getUserFromToken(app, req, reply);
    if (!user) return;
    
    const userId = user.sub;
    const { date, startTime, endTime, service = 'all' } = req.body;
    
    if (!date) {
      return reply.code(400).send({ error: 'date required' });
    }
    
    const slots = companionAvailability.get(userId) || [];
    slots.push({
      date,
      startTime: startTime || '09:00',
      endTime: endTime || '17:00',
      service
    });
    
    companionAvailability.set(userId, slots);
    
    return { ok: true, slots };
  });
  
  // Get opportunities (AI-matched requests)
  app.get('/companion/opportunities', async (req, reply) => {
    const user = getUserFromToken(app, req, reply);
    if (!user) return;
    
    const userId = user.sub;
    
    // Get companion profile for location
    const profile = companionProfiles.get(userId);
    const location = profile?.postcode || profile?.location || 'HP9';
    
    // Generate mock opportunities using AI match
    const opportunities = [];
    
    // Create a few sample requests to match against
    const sampleRequests = [
      {
        id: 'req_001',
        pets: [{ species: 'dog', size: 'medium' }],
        serviceType: 'sitting',
        windowStart: new Date(Date.now() + 5 * 86400000).toISOString(),
        windowEnd: new Date(Date.now() + 10 * 86400000).toISOString(),
        location: location,
        budget: 4000
      },
      {
        id: 'req_002',
        pets: [{ species: 'cat', size: 'small' }],
        serviceType: 'walk',
        windowStart: new Date(Date.now() + 2 * 86400000).toISOString(),
        windowEnd: new Date(Date.now() + 3 * 86400000).toISOString(),
        location: location,
        budget: 3000
      },
      {
        id: 'req_003',
        pets: [{ species: 'dog', size: 'large' }],
        serviceType: 'daycare',
        windowStart: new Date(Date.now() + 7 * 86400000).toISOString(),
        windowEnd: new Date(Date.now() + 14 * 86400000).toISOString(),
        location: location,
        budget: 3500
      }
    ];
    
    // Use AI match to score each request
    for (const request of sampleRequests) {
      try {
        const matchResponse = await fetch(`http://localhost:${process.env.API_PORT || 8787}/api/ai/match`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request)
        });
        
        if (matchResponse.ok) {
          const matchData = await matchResponse.json();
          if (matchData.primary) {
            const days = Math.ceil((new Date(request.windowEnd) - new Date(request.windowStart)) / 86400000);
            opportunities.push({
              id: request.id,
              ...request,
              matchScore: matchData.primary.score,
              matchReasons: matchData.primary.reasons,
              estimatedEarnings: request.budget * days
            });
          }
        }
      } catch (err) {
        console.error('Failed to match opportunity:', err);
      }
    }
    
    // Sort by match score
    opportunities.sort((a, b) => b.matchScore - a.matchScore);
    
    return { opportunities: opportunities.slice(0, 5) };
  });
  
  // Update profile (for checklist progress)
  app.post('/companion/profile/update', async (req, reply) => {
    const user = getUserFromToken(app, req, reply);
    if (!user) return;
    
    const userId = user.sub;
    const updates = req.body;
    
    let profile = companionProfiles.get(userId) || {};
    profile = { ...profile, ...updates };
    companionProfiles.set(userId, profile);
    
    return { ok: true, profile };
  });
}
