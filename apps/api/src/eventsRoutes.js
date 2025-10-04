import { getUserPlan } from './planRoutes.js';

// Community events with RSVP system
const events = new Map(); // eventId -> { id, title, date, time, location, city, attendees, rsvps: Set() }
const eventRsvps = new Map(); // eventId -> Set(userIds)

// Initialize with demo events for Beaconsfield
events.set('evt_1', {
  id: 'evt_1',
  title: 'Beaconsfield Dog Walk & Coffee',
  date: '2025-10-12',
  time: '10:00',
  location: 'Beaconsfield Old Town',
  city: 'Beaconsfield',
  postcode: 'HP9',
  description: 'Join us for a relaxed group walk through the old town followed by coffee.',
  attendees: 3
});

events.set('evt_2', {
  id: 'evt_2',
  title: 'Puppy Socialisation Hour',
  date: '2025-10-15',
  time: '14:00',
  location: 'Beaconsfield Memorial Park',
  city: 'Beaconsfield',
  postcode: 'HP9',
  description: 'Puppies under 6 months welcome for supervised play and socialisation.',
  attendees: 7
});

events.set('evt_3', {
  id: 'evt_3',
  title: 'Pet First Aid Workshop',
  date: '2025-10-20',
  time: '18:30',
  location: 'Beaconsfield Community Centre',
  city: 'Beaconsfield',
  postcode: 'HP9',
  description: 'Learn essential first aid for pets. Vet-led session. £5 donation suggested.',
  attendees: 12
});

export default async function eventsRoutes(app) {
  
  // List events near a location
  app.get('/events', async (req, reply) => {
    const { near = 'Beaconsfield' } = req.query;
    
    // Filter by city/location
    const eventsList = Array.from(events.values())
      .filter(e => e.city.toLowerCase().includes(near.toLowerCase()))
      .map(e => ({
        ...e,
        status: e.attendees >= 5 ? 'CONFIRMED' : 'PENDING',
        statusMessage: e.attendees >= 5 ? 'Confirmed' : `Pending until 5 RSVP (${e.attendees}/5)`
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return { events: eventsList };
  });
  
  // Create new event (Plus/Premium only)
  app.post('/events', async (req, reply) => {
    try {
      const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
      const payload = app.jwt.verify(token);
      const userPlan = await getUserPlan(app, req);
      
      // Check plan requirement
      if (userPlan === 'FREE') {
        return reply.code(403).send({
          error: 'PLAN_REQUIRED',
          needed: 'PLUS',
          current: userPlan
        });
      }
      
      const { title, date, time, location, city, postcode, description } = req.body;
      
      if (!title || !date || !time || !location) {
        return reply.code(400).send({ error: 'Missing required fields' });
      }
      
      const id = `evt_${Date.now()}`;
      const event = {
        id,
        title,
        date,
        time,
        location,
        city: city || 'Beaconsfield',
        postcode: postcode || '',
        description: description || '',
        attendees: 1, // Creator is first attendee
        createdBy: payload.sub
      };
      
      events.set(id, event);
      eventRsvps.set(id, new Set([payload.sub]));
      
      return { ok: true, event };
    } catch {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });
  
  // RSVP to event
  app.post('/events/:id/rsvp', async (req, reply) => {
    try {
      const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
      const payload = app.jwt.verify(token);
      const { id } = req.params;
      
      const event = events.get(id);
      if (!event) {
        return reply.code(404).send({ error: 'Event not found' });
      }
      
      if (!eventRsvps.has(id)) {
        eventRsvps.set(id, new Set());
      }
      
      const rsvps = eventRsvps.get(id);
      
      // Toggle RSVP
      if (rsvps.has(payload.sub)) {
        rsvps.delete(payload.sub);
        event.attendees = Math.max(0, event.attendees - 1);
      } else {
        rsvps.add(payload.sub);
        event.attendees += 1;
      }
      
      return { 
        ok: true, 
        rsvped: rsvps.has(payload.sub),
        attendees: event.attendees,
        status: event.attendees >= 5 ? 'CONFIRMED' : 'PENDING'
      };
    } catch {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });
}
