// AI USP Logic Endpoints - Heuristic matching, reliability, forecasting
// In-memory storage, no external APIs

// In-memory reliability scores: companionId -> { score: 0-100, events: [] }
const reliabilityScores = new Map();

// Helper: Get or initialize reliability score
function getReliability(companionId) {
  if (!reliabilityScores.has(companionId)) {
    reliabilityScores.set(companionId, { score: 75, events: [] });
  }
  return reliabilityScores.get(companionId);
}

// Helper: Calculate distance score (proximity heuristic)
function calculateProximityScore(companionPostcode, requestPostcode) {
  if (!companionPostcode || !requestPostcode) return 50;
  
  const compArea = companionPostcode.split(' ')[0].toUpperCase();
  const reqArea = requestPostcode.split(' ')[0].toUpperCase();
  
  if (compArea === reqArea) return 100;
  
  const compPrefix = compArea.substring(0, 2);
  const reqPrefix = reqArea.substring(0, 2);
  if (compPrefix === reqPrefix) return 70;
  
  return 30;
}

// Helper: Calculate availability score
function calculateAvailabilityScore(companion, windowStart, windowEnd) {
  const start = new Date(windowStart);
  const end = new Date(windowEnd);
  const duration = (end - start) / (1000 * 60 * 60 * 24);
  
  if (duration <= 1) return 100;
  if (duration <= 3) return 85;
  if (duration <= 7) return 70;
  return 60;
}

// Helper: Calculate price fit score
function calculatePriceFitScore(companionRate, budget) {
  if (!budget || !companionRate) return 50;
  
  const diff = Math.abs(companionRate - budget);
  const percentDiff = diff / budget;
  
  if (percentDiff <= 0.1) return 100;
  if (percentDiff <= 0.25) return 80;
  if (percentDiff <= 0.5) return 60;
  return 40;
}

// Helper: Calculate overall match score
function calculateMatchScore(companion, request) {
  const proximity = calculateProximityScore(companion.postcode, request.location);
  const availability = calculateAvailabilityScore(companion, request.windowStart, request.windowEnd);
  const reliability = getReliability(companion.id).score;
  const rating = (companion.rating || 4.0) * 20;
  const priceFit = calculatePriceFitScore(companion.ratePerDay, request.budget);
  
  const weightedScore = 
    proximity * 0.40 +
    availability * 0.20 +
    reliability * 0.20 +
    rating * 0.10 +
    priceFit * 0.10;
  
  return Math.round(weightedScore);
}

// Helper: Generate match reasons
function generateReasons(companion, request, scores) {
  const reasons = [];
  
  if (scores.proximity >= 90) {
    reasons.push('Excellent location match in your area');
  } else if (scores.proximity >= 70) {
    reasons.push('Good local coverage');
  }
  
  if (scores.reliability >= 85) {
    reasons.push('Highly reliable with strong completion history');
  } else if (scores.reliability >= 70) {
    reasons.push('Reliable service record');
  }
  
  if (scores.availability >= 90) {
    reasons.push('Excellent availability for your dates');
  }
  
  if (scores.rating >= 90) {
    reasons.push('Outstanding customer ratings');
  } else if (scores.rating >= 80) {
    reasons.push('Highly rated by pet owners');
  }
  
  if (scores.priceFit >= 80) {
    reasons.push('Pricing matches your budget perfectly');
  }
  
  return reasons;
}

export default async function aiRoutes(app) {
  
  // 1) POST /ai/match - Smart companion matching
  app.post('/ai/match', async (req, reply) => {
    const { pets = [], serviceType = 'sitting', windowStart, windowEnd, location, budget } = req.body;
    
    if (!windowStart || !windowEnd || !location) {
      return reply.code(400).send({ error: 'windowStart, windowEnd, and location required' });
    }
    
    try {
      // Fetch available companions from sitters endpoint
      const response = await fetch(`http://localhost:${process.env.API_PORT || 8787}/sitters/search?tier=ANY&postcode=${location}`);
      const data = await response.json();
      const companions = data.results || [];
      
      if (companions.length === 0) {
        return { 
          primary: null, 
          backup: null, 
          message: 'No companions available in your area' 
        };
      }
      
      // Score each companion
      const scored = companions.map(companion => {
        const scores = {
          proximity: calculateProximityScore(companion.postcode, location),
          availability: calculateAvailabilityScore(companion, windowStart, windowEnd),
          reliability: getReliability(companion.id).score,
          rating: (companion.rating || 4.0) * 20,
          priceFit: calculatePriceFitScore(companion.ratePerDay, budget)
        };
        
        const totalScore = calculateMatchScore(companion, { windowStart, windowEnd, location, budget });
        const reasons = generateReasons(companion, { location, budget }, scores);
        
        return {
          companionId: companion.id,
          score: totalScore,
          reasons,
          details: {
            name: companion.name,
            postcode: companion.postcode,
            rating: companion.rating,
            ratePerDay: companion.ratePerDay
          }
        };
      });
      
      // Sort by score descending
      scored.sort((a, b) => b.score - a.score);
      
      const primary = scored[0] || null;
      const backup = scored[1] || null;
      
      return { primary, backup };
      
    } catch (err) {
      return reply.code(500).send({ error: 'Failed to fetch companions' });
    }
  });
  
  // 2) POST /ai/reliability/update - Update companion reliability
  app.post('/ai/reliability/update', async (req, reply) => {
    const { companionId, event } = req.body;
    
    if (!companionId || !event) {
      return reply.code(400).send({ error: 'companionId and event required' });
    }
    
    const validEvents = ['completed', 'cancelled', 'late', '5star'];
    if (!validEvents.includes(event)) {
      return reply.code(400).send({ error: 'Invalid event type' });
    }
    
    const reliability = getReliability(companionId);
    
    // Adjust score based on event type
    switch (event) {
      case 'completed':
        reliability.score = Math.min(100, reliability.score + 2);
        break;
      case '5star':
        reliability.score = Math.min(100, reliability.score + 3);
        break;
      case 'late':
        reliability.score = Math.max(0, reliability.score - 5);
        break;
      case 'cancelled':
        reliability.score = Math.max(0, reliability.score - 10);
        break;
    }
    
    reliability.events.push({
      event,
      timestamp: new Date().toISOString(),
      scoreAfter: reliability.score
    });
    
    return {
      companionId,
      reliability: reliability.score,
      recentEvents: reliability.events.slice(-5)
    };
  });
  
  // 3) GET /ai/forecast - Demand forecasting by area
  app.get('/ai/forecast', async (req, reply) => {
    const { area = 'HP9' } = req.query;
    
    const now = new Date();
    const dayOfWeek = now.getDay();
    const month = now.getMonth();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isSummer = month >= 5 && month <= 8;
    const isDecember = month === 11;
    
    let slotsNeeded = 5;
    let suggestion = 'Maintain current availability';
    
    // Weekend demand
    if (isWeekend) {
      slotsNeeded = 8;
      suggestion = 'Open 2 more morning slots for Sat/Sun';
    }
    
    // Summer holiday demand
    if (isSummer) {
      slotsNeeded += 3;
      suggestion = 'High summer demand - consider opening additional weekday afternoon slots';
    }
    
    // Christmas demand
    if (isDecember) {
      slotsNeeded += 5;
      suggestion = 'Peak December demand - open extra slots for 20th-31st, especially morning walks';
    }
    
    // Friday evening demand
    if (dayOfWeek === 5) {
      slotsNeeded += 2;
      suggestion = 'Friday evening peak - open 1-2 additional 5-7pm slots';
    }
    
    return {
      area,
      slotsNeeded,
      suggestion,
      forecast: {
        isWeekend,
        isSummer,
        isDecember,
        dayOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek]
      }
    };
  });
  
  // 4) GET /ai/priceHint - Dynamic pricing hints
  app.get('/ai/priceHint', async (req, reply) => {
    const { service = 'walk', hp = 'HP9', time } = req.query;
    
    const baseRates = {
      walk: { min: 15, max: 30 },
      sitting: { min: 35, max: 65 },
      daycare: { min: 25, max: 45 },
      boarding: { min: 40, max: 80 }
    };
    
    let range = baseRates[service] || baseRates.walk;
    let reason = 'Standard pricing for your area';
    
    const now = time ? new Date(time) : new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    const month = now.getMonth();
    
    // Peak hour pricing (7-9am, 5-7pm)
    if ((hour >= 7 && hour < 9) || (hour >= 17 && hour < 19)) {
      range = { min: range.min + 5, max: range.max + 8 };
      reason = `High demand window in ${hp}`;
    }
    
    // Weekend premium
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      range = { min: range.min + 3, max: range.max + 5 };
      reason = `Weekend demand in ${hp}`;
    }
    
    // Summer/holiday premium
    if (month >= 5 && month <= 8) {
      range = { min: range.min + 5, max: range.max + 10 };
      reason = `Peak summer demand in ${hp}`;
    }
    
    // December premium
    if (month === 11) {
      range = { min: range.min + 8, max: range.max + 15 };
      reason = `High Christmas demand in ${hp}`;
    }
    
    return {
      service,
      area: hp,
      range,
      reason
    };
  });
  
  // 5) POST /ai/route/validate - Route timing validation
  app.post('/ai/route/validate', async (req, reply) => {
    const { expectedMins, actualMins, distanceKm } = req.body;
    
    if (expectedMins === undefined || actualMins === undefined) {
      return reply.code(400).send({ error: 'expectedMins and actualMins required' });
    }
    
    const tolerance = 0.15;
    const minAllowed = expectedMins * (1 - tolerance);
    const maxAllowed = expectedMins * (1 + tolerance);
    
    const ok = actualMins >= minAllowed && actualMins <= maxAllowed;
    
    let reason;
    if (ok) {
      reason = 'Route timing within expected range';
    } else if (actualMins < minAllowed) {
      const diff = Math.round(minAllowed - actualMins);
      reason = `Route completed ${diff} minutes faster than expected - verify all stops were made`;
    } else {
      const diff = Math.round(actualMins - maxAllowed);
      reason = `Route took ${diff} minutes longer than expected - possible delays or extended stops`;
    }
    
    return {
      ok,
      reason,
      expected: expectedMins,
      actual: actualMins,
      tolerance: `±${tolerance * 100}%`
    };
  });
  
  // 6) POST /ai/escrow/review - Escrow release decision
  app.post('/ai/escrow/review', async (req, reply) => {
    const { bookingId, routeOk, csat, issues = [] } = req.body;
    
    if (!bookingId) {
      return reply.code(400).send({ error: 'bookingId required' });
    }
    
    let action = 'release';
    let reason = 'Service completed successfully';
    const concerns = [];
    
    // Check route validation
    if (routeOk === false) {
      concerns.push('Route timing outside expected range');
    }
    
    // Check customer satisfaction
    if (csat === 'down') {
      concerns.push('Negative customer feedback');
    }
    
    // Check reported issues
    if (issues && issues.length > 0) {
      const criticalIssues = issues.filter(i => 
        i.toLowerCase().includes('injury') || 
        i.toLowerCase().includes('lost') ||
        i.toLowerCase().includes('harm')
      );
      
      if (criticalIssues.length > 0) {
        concerns.push('Critical safety issue reported');
        action = 'hold';
        reason = 'Critical incident requires investigation before payment release';
        return { bookingId, action, reason, concerns };
      }
      
      concerns.push(`${issues.length} issue(s) reported`);
    }
    
    // Decision logic
    if (concerns.length === 0) {
      action = 'release';
      reason = 'Service completed successfully with no concerns';
    } else if (concerns.length === 1 && csat !== 'down') {
      action = 'release';
      reason = 'Minor concern noted but overall service acceptable - release payment';
    } else if (concerns.length >= 2 || csat === 'down') {
      action = 'hold';
      reason = 'Multiple concerns or negative feedback - hold for review';
    }
    
    return {
      bookingId,
      action,
      reason,
      concerns: concerns.length > 0 ? concerns : undefined
    };
  });
}
