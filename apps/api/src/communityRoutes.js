// Community events routes with Beaconsfield (HP9) defaults
const mem = (globalThis.__PT_MEM__ = globalThis.__PT_MEM__ || {});
const events = (mem.communityEvents = mem.communityEvents || new Map());

function eid(){ return 'e_' + Math.random().toString(36).slice(2,10); }

function seedIfMissing(city, postcode){
  const key = `${city}_${postcode}`;
  if (!events.has(key)){
    const id = eid();
    events.set(key, {
      id, city, postcode,
      title: `${city} Monthly Meetup`,
      date: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
      time: '14:00',
      location: `${city} Park`,
      description: `Join fellow pet owners for our monthly community meetup in ${city}!`,
      rsvps: []
    });
  }
}

// Ensure one seed exists (Beaconsfield demo)
seedIfMissing('Beaconsfield','HP9');

export default async function communityRoutes(app){
  
  app.get('/community/events', async (req, reply) => {
    const { city='Beaconsfield', postcode='HP9' } = req.query || {};
    const key = `${city}_${postcode}`;
    const evt = events.get(key);
    return { events: evt ? [evt] : [] };
  });

  app.post('/community/rsvp', async (req, reply) => {
    const { eventId, userEmail, status='yes' } = req.body || {};
    if (!eventId || !userEmail) return reply.code(400).send({ error:'missing_fields' });
    
    let evt = null;
    for (const e of events.values()){
      if (e.id === eventId) evt = e;
    }
    if (!evt) return reply.code(404).send({ error:'event_not_found' });
    
    // Remove any existing RSVP from this user
    evt.rsvps = evt.rsvps.filter(r => r.email !== userEmail);
    
    // Add new RSVP
    evt.rsvps.push({ email: userEmail, status, ts: new Date().toISOString() });
    
    // Check if threshold met (5+ confirmed)
    const confirmed = evt.rsvps.filter(r => r.status === 'yes').length;
    if (confirmed >= 5) evt.confirmed = true;
    
    return { ok:true, event: evt };
  });

  app.get('/community/rsvp-count', async (req, reply) => {
    let total = 0;
    for (const evt of events.values()){
      total += evt.rsvps.filter(r => r.status === 'yes').length;
    }
    return { count: total };
  });
}
