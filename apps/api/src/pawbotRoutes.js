// PawBot feedback and escalation system
const chatFeedback = new Map(); // userId -> [{ chatId, value, ts }]
const escalations = new Map(); // userId -> [{ reason, chatId, ts, emailed }]

export default async function pawbotRoutes(app) {
  
  // Submit feedback for a chat
  app.post('/ai/feedback', async (req, reply) => {
    try {
      const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
      const payload = app.jwt.verify(token);
      const { chatId, value } = req.body;
      
      if (!chatId || (value !== 1 && value !== -1)) {
        return reply.code(400).send({ error: 'Invalid feedback' });
      }
      
      const userId = payload.sub;
      if (!chatFeedback.has(userId)) {
        chatFeedback.set(userId, []);
      }
      
      chatFeedback.get(userId).push({
        chatId,
        value,
        ts: Date.now()
      });
      
      return { ok: true };
    } catch {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });
  
  // Get feedback score (last 24h downvote count)
  app.get('/ai/feedback/score', async (req, reply) => {
    try {
      const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
      const payload = app.jwt.verify(token);
      const userId = payload.sub;
      
      const feedback = chatFeedback.get(userId) || [];
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const recentDowns = feedback.filter(f => f.value === -1 && f.ts > oneDayAgo);
      
      return { 
        downcount: recentDowns.length,
        needsEscalation: recentDowns.length >= 3 
      };
    } catch {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });
  
  // Escalate to human support
  app.post('/ai/escalate', async (req, reply) => {
    try {
      const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
      const payload = app.jwt.verify(token);
      const { reason = 'manual', lastChatId } = req.body;
      const userId = payload.sub;
      const userEmail = payload.email;
      
      // Check if escalation is warranted
      const feedback = chatFeedback.get(userId) || [];
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const recentDowns = feedback.filter(f => f.value === -1 && f.ts > oneDayAgo);
      
      const shouldEscalate = recentDowns.length >= 3 || reason === 'manual';
      
      if (!shouldEscalate) {
        return reply.code(400).send({ error: 'Escalation not needed' });
      }
      
      // Record escalation
      if (!escalations.has(userId)) {
        escalations.set(userId, []);
      }
      
      const escalation = {
        reason,
        chatId: lastChatId,
        ts: Date.now(),
        emailed: true
      };
      
      escalations.get(userId).push(escalation);
      
      // Simulate email to hello@pawtimation.co.uk
      console.log('📧 ═════════════════════════════════════════════════════');
      console.log('   PAWBOT ESCALATION EMAIL');
      console.log('═════════════════════════════════════════════════════');
      console.log(`To: hello@pawtimation.co.uk`);
      console.log(`Subject: PawBot Escalation - User Needs Human Support`);
      console.log('');
      console.log(`User ID: ${userId}`);
      console.log(`Email: ${userEmail}`);
      console.log(`Reason: ${reason}`);
      console.log(`Last Chat ID: ${lastChatId}`);
      console.log(`Recent Downvotes (24h): ${recentDowns.length}`);
      console.log(`Timestamp: ${new Date().toISOString()}`);
      console.log('');
      console.log('Please reach out to this user to provide human support.');
      console.log('═════════════════════════════════════════════════════');
      
      return { 
        ok: true, 
        message: 'Support team has been notified. We\'ll email you at hello@pawtimation.co.uk soon.' 
      };
    } catch (err) {
      console.error('Escalation error:', err);
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });
  
  // Get user's chat history (stub data)
  app.get('/ai/chats', async (req, reply) => {
    try {
      const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
      app.jwt.verify(token);
      
      // Stub chat history
      return {
        chats: [
          { id: 'chat_1', preview: 'How do I find a companion?', ts: Date.now() - 3600000 },
          { id: 'chat_2', preview: 'What\'s included in Premium?', ts: Date.now() - 7200000 },
          { id: 'chat_3', preview: 'Help with booking cancellation', ts: Date.now() - 86400000 }
        ]
      };
    } catch {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });
}
