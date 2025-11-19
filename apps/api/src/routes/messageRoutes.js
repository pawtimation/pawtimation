import { repo } from '../repo.js';

export async function messageRoutes(fastify) {
  // Send a message
  fastify.post('/messages/send', async (req, reply) => {
    const { businessId, clientId, bookingId, senderRole, message } = req.body;

    if (!businessId || !clientId || !message || !senderRole) {
      return reply.code(400).send({ 
        error: 'Missing required fields: businessId, clientId, message, senderRole' 
      });
    }

    const msg = repo.addBusinessMessage(businessId, {
      clientId,
      bookingId: bookingId || null,
      senderRole,
      message
    });

    if (!msg) {
      return reply.code(404).send({ error: 'Business not found' });
    }

    return reply.send(msg);
  });

  // Get messages for a specific booking
  fastify.get('/messages/booking', async (req, reply) => {
    const { businessId, bookingId } = req.query;

    if (!businessId || !bookingId) {
      return reply.code(400).send({ 
        error: 'Missing required query params: businessId, bookingId' 
      });
    }

    const list = repo.listMessagesForBooking(businessId, bookingId);
    return reply.send(list);
  });

  // Get inbox messages for a client (not tied to a specific booking)
  fastify.get('/messages/inbox', async (req, reply) => {
    const { businessId, clientId } = req.query;

    if (!businessId || !clientId) {
      return reply.code(400).send({ 
        error: 'Missing required query params: businessId, clientId' 
      });
    }

    const list = repo.listMessagesForInbox(businessId, clientId);
    return reply.send(list);
  });

  // Mark booking messages as read
  fastify.post('/messages/mark-booking-read', async (req, reply) => {
    const { businessId, bookingId, role } = req.body;

    if (!businessId || !bookingId || !role) {
      return reply.code(400).send({ 
        error: 'Missing required fields: businessId, bookingId, role' 
      });
    }

    repo.markBookingMessagesRead(businessId, bookingId, role);
    return reply.send({ success: true });
  });

  // Mark inbox messages as read
  fastify.post('/messages/mark-inbox-read', async (req, reply) => {
    const { businessId, clientId, role } = req.body;

    if (!businessId || !clientId || !role) {
      return reply.code(400).send({ 
        error: 'Missing required fields: businessId, clientId, role' 
      });
    }

    repo.markInboxMessagesRead(businessId, clientId, role);
    return reply.send({ success: true });
  });
}

export default messageRoutes;
