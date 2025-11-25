import { repo } from '../repo.js';
import { db } from '../db.js';
import { messages } from '../../../../shared/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

async function getAuthenticatedUser(fastify, req, reply) {
  try {
    const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
    const payload = fastify.jwt.verify(token);
    
    const user = await repo.getUser(payload.sub);
    if (!user) {
      reply.code(403).send({ error: 'forbidden: user account not found' });
      return null;
    }
    
    let resolvedBizId = user.businessId || null;
    
    if (user.role === 'client') {
      if (!user.crmClientId) {
        reply.code(403).send({ error: 'forbidden: client record not linked' });
        return null;
      }
      
      if (!resolvedBizId) {
        const clientRecord = await repo.getClient(user.crmClientId);
        if (!clientRecord) {
          reply.code(404).send({ error: 'client record not found' });
          return null;
        }
        resolvedBizId = clientRecord.businessId || null;
      }
      
      if (!resolvedBizId) {
        reply.code(403).send({ error: 'forbidden: business context missing' });
        return null;
      }
      
      return {
        user,
        crmClientId: user.crmClientId,
        businessId: resolvedBizId,
        isClient: true
      };
    } else {
      if (!resolvedBizId) {
        reply.code(403).send({ error: 'forbidden: business context missing' });
        return null;
      }
      
      return {
        user,
        crmClientId: user.crmClientId || null,
        businessId: resolvedBizId,
        isClient: false
      };
    }
  } catch (err) {
    reply.code(401).send({ error: 'unauthenticated' });
    return null;
  }
}

async function verifyClientOwnership(clientId, businessId) {
  const client = await repo.getClient(clientId);
  if (!client) return { valid: false, error: 'client not found' };
  if (client.businessId !== businessId) return { valid: false, error: 'client does not belong to this business' };
  return { valid: true, client };
}

async function verifyBookingOwnership(bookingId, businessId, clientId = null) {
  const job = await repo.getJob(bookingId);
  if (!job) return { valid: false, error: 'booking not found' };
  if (job.businessId !== businessId) return { valid: false, error: 'booking does not belong to this business' };
  if (clientId && job.clientId !== clientId) return { valid: false, error: 'booking does not belong to this client' };
  return { valid: true, job };
}

export async function messageRoutes(fastify) {
  fastify.post('/messages/send', async (req, reply) => {
    console.log('[MSG] Send request received, body:', JSON.stringify(req.body || {}));
    const auth = await getAuthenticatedUser(fastify, req, reply);
    if (!auth) {
      console.log('[MSG] Auth failed');
      return;
    }
    console.log('[MSG] Auth passed, isClient:', auth.isClient, 'businessId:', auth.businessId, 'crmClientId:', auth.crmClientId);
    
    const { clientId, bookingId, message } = req.body;
    const businessId = auth.businessId;

    if (!clientId || !message) {
      return reply.code(400).send({ 
        error: 'Missing required fields: clientId, message' 
      });
    }
    
    if (auth.isClient && auth.crmClientId !== clientId) {
      return reply.code(403).send({ error: 'forbidden: client mismatch' });
    }
    
    const clientCheck = await verifyClientOwnership(clientId, businessId);
    if (!clientCheck.valid) {
      return reply.code(403).send({ error: 'forbidden: ' + clientCheck.error });
    }
    
    if (bookingId) {
      const bookingCheck = await verifyBookingOwnership(bookingId, businessId, clientId);
      if (!bookingCheck.valid) {
        return reply.code(403).send({ error: 'forbidden: ' + bookingCheck.error });
      }
    }
    
    const derivedSenderRole = auth.isClient ? 'client' : 'business';

    const msgId = 'msg_' + nanoid(12);
    const isFromClient = auth.isClient;
    
    try {
      console.log('[MSG] Inserting message:', { msgId, businessId, clientId, derivedSenderRole });
      const [newMsg] = await db
        .insert(messages)
        .values({
          id: msgId,
          businessId,
          clientId,
          bookingId: bookingId || null,
          body: message,
          senderRole: derivedSenderRole,
          direction: isFromClient ? 'inbound' : 'outbound',
          readByClient: isFromClient,
          readByBusiness: !isFromClient,
          createdAt: new Date()
        })
        .returning();
      
      console.log('[MSG] Message created successfully:', newMsg.id);
      const response = {
        id: newMsg.id,
        businessId: newMsg.businessId,
        clientId: newMsg.clientId,
        bookingId: newMsg.bookingId,
        senderRole: newMsg.senderRole,
        message: newMsg.body,
        createdAt: newMsg.createdAt,
        readStates: {
          client: newMsg.readByClient,
          business: newMsg.readByBusiness
        }
      };

      return reply.send(response);
    } catch (error) {
      console.error('[MSG] Failed to send message:', error?.message || error);
      return reply.code(500).send({ error: 'Failed to send message' });
    }
  });

  fastify.get('/messages/booking', async (req, reply) => {
    const auth = await getAuthenticatedUser(fastify, req, reply);
    if (!auth) return;
    
    const { bookingId } = req.query;
    const businessId = auth.businessId;

    if (!bookingId) {
      return reply.code(400).send({ 
        error: 'Missing required query param: bookingId' 
      });
    }
    
    const bookingCheck = await verifyBookingOwnership(bookingId, businessId);
    if (!bookingCheck.valid) {
      return reply.code(403).send({ error: 'forbidden: ' + bookingCheck.error });
    }
    
    if (auth.isClient && bookingCheck.job.clientId !== auth.crmClientId) {
      return reply.code(403).send({ error: 'forbidden: booking does not belong to you' });
    }
    
    try {
      const list = await db
        .select()
        .from(messages)
        .where(and(
          eq(messages.businessId, businessId),
          eq(messages.bookingId, bookingId)
        ))
        .orderBy(desc(messages.createdAt));
      
      const result = list.map(m => ({
        id: m.id,
        businessId: m.businessId,
        clientId: m.clientId,
        bookingId: m.bookingId,
        senderRole: m.senderRole,
        message: m.body,
        createdAt: m.createdAt,
        readStates: {
          client: m.readByClient,
          business: m.readByBusiness
        }
      }));
      
      return reply.send(result);
    } catch (error) {
      console.error('Failed to get booking messages:', error);
      return reply.code(500).send({ error: 'Failed to get messages' });
    }
  });

  fastify.get('/messages/inbox', async (req, reply) => {
    const auth = await getAuthenticatedUser(fastify, req, reply);
    if (!auth) return;
    
    const { clientId } = req.query;
    const businessId = auth.businessId;

    if (!clientId) {
      return reply.code(400).send({ 
        error: 'Missing required query param: clientId' 
      });
    }
    
    if (auth.isClient && auth.crmClientId !== clientId) {
      return reply.code(403).send({ error: 'forbidden: client mismatch' });
    }
    
    const clientCheck = await verifyClientOwnership(clientId, businessId);
    if (!clientCheck.valid) {
      return reply.code(403).send({ error: 'forbidden: ' + clientCheck.error });
    }

    try {
      const list = await db
        .select()
        .from(messages)
        .where(and(
          eq(messages.businessId, businessId),
          eq(messages.clientId, clientId)
        ))
        .orderBy(desc(messages.createdAt));
      
      const inboxMessages = list.filter(m => !m.bookingId);
      
      const result = inboxMessages.map(m => ({
        id: m.id,
        businessId: m.businessId,
        clientId: m.clientId,
        bookingId: m.bookingId,
        senderRole: m.senderRole,
        message: m.body,
        createdAt: m.createdAt,
        readStates: {
          client: m.readByClient,
          business: m.readByBusiness
        }
      }));
      
      return reply.send(result);
    } catch (error) {
      console.error('Failed to get inbox messages:', error);
      return reply.code(500).send({ error: 'Failed to get messages' });
    }
  });

  fastify.post('/messages/mark-booking-read', async (req, reply) => {
    const auth = await getAuthenticatedUser(fastify, req, reply);
    if (!auth) return;
    
    const { bookingId } = req.body;
    const businessId = auth.businessId;

    if (!bookingId) {
      return reply.code(400).send({ 
        error: 'Missing required field: bookingId' 
      });
    }
    
    const bookingCheck = await verifyBookingOwnership(bookingId, businessId);
    if (!bookingCheck.valid) {
      return reply.code(403).send({ error: 'forbidden: ' + bookingCheck.error });
    }
    
    if (auth.isClient && bookingCheck.job.clientId !== auth.crmClientId) {
      return reply.code(403).send({ error: 'forbidden: booking does not belong to you' });
    }

    try {
      const updateField = auth.isClient ? { readByClient: true } : { readByBusiness: true };
      
      await db
        .update(messages)
        .set(updateField)
        .where(and(
          eq(messages.businessId, businessId),
          eq(messages.bookingId, bookingId)
        ));
      
      return reply.send({ success: true });
    } catch (error) {
      console.error('Failed to mark messages read:', error);
      return reply.code(500).send({ error: 'Failed to mark messages read' });
    }
  });

  fastify.post('/messages/mark-inbox-read', async (req, reply) => {
    const auth = await getAuthenticatedUser(fastify, req, reply);
    if (!auth) return;
    
    const { clientId } = req.body;
    const businessId = auth.businessId;

    if (!clientId) {
      return reply.code(400).send({ 
        error: 'Missing required field: clientId' 
      });
    }
    
    if (auth.isClient && auth.crmClientId !== clientId) {
      return reply.code(403).send({ error: 'forbidden: client mismatch' });
    }
    
    const clientCheck = await verifyClientOwnership(clientId, businessId);
    if (!clientCheck.valid) {
      return reply.code(403).send({ error: 'forbidden: ' + clientCheck.error });
    }

    try {
      const updateField = auth.isClient ? { readByClient: true } : { readByBusiness: true };
      
      await db
        .update(messages)
        .set(updateField)
        .where(and(
          eq(messages.businessId, businessId),
          eq(messages.clientId, clientId)
        ));
      
      return reply.send({ success: true });
    } catch (error) {
      console.error('Failed to mark inbox messages read:', error);
      return reply.code(500).send({ error: 'Failed to mark messages read' });
    }
  });
}

export default messageRoutes;
