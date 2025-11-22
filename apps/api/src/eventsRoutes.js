import { storage } from './storage.js';

export default async function eventsRoutes(app) {
  
  // List events near a location
  app.get('/events', async (req, reply) => {
    const { near = 'Beaconsfield' } = req.query;
    
    const eventsList = await storage.getEventsByCity(near);
    
    const eventsWithStatus = await Promise.all(
      eventsList.map(async (e) => {
        const attendees = await storage.getEventRsvpCount(e.id);
        return {
          ...e,
          attendees,
          status: attendees >= 5 ? 'CONFIRMED' : 'PENDING',
          statusMessage: attendees >= 5 ? 'Confirmed' : `Pending until 5 RSVP (${attendees}/5)`
        };
      })
    );
    
    return { events: eventsWithStatus };
  });
  
  // Create new event
  app.post('/events', async (req, reply) => {
    try {
      const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
      const payload = app.jwt.verify(token);
      
      // NOTE: Events system now persisted to database
      // Future integration: could check business.plan and enforce TEAM+ requirement
      // Plan checks now handled via apps/api/src/helpers/planEnforcement.js
      
      const { title, date, time, location, city, postcode, description } = req.body;
      
      if (!title || !date || !time || !location) {
        return reply.code(400).send({ error: 'Missing required fields' });
      }
      
      const id = `evt_${Date.now()}`;
      const eventData = {
        id,
        title,
        date,
        time,
        location,
        city: city || 'Beaconsfield',
        postcode: postcode || '',
        description: description || '',
        createdBy: payload.sub
      };
      
      const event = await storage.createEvent(eventData);
      await storage.createEventRsvp(id, payload.sub);
      
      return { ok: true, event: { ...event, attendees: 1 } };
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
      
      const event = await storage.getEvent(id);
      if (!event) {
        return reply.code(404).send({ error: 'Event not found' });
      }
      
      // Atomic RSVP toggle using transaction
      const result = await storage.toggleEventRsvp(id, payload.sub);
      
      return { 
        ok: true, 
        rsvped: result.rsvped,
        attendees: result.attendees,
        status: result.attendees >= 5 ? 'CONFIRMED' : 'PENDING'
      };
    } catch (error) {
      if (error.message === 'Unauthorized') {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      console.error('RSVP error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
}
