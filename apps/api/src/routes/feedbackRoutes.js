import { storage } from '../storage.js';

export async function feedbackRoutes(app, opts) {
  
  // POST /api/feedback - Submit feedback (public or authenticated)
  app.post('/feedback', async (request, reply) => {
    const { feedbackType, message, metadata } = request.body;

    if (!feedbackType || !message) {
      return reply.code(400).send({ error: 'feedbackType and message are required' });
    }

    if (!['BUG', 'IDEA', 'PRAISE', 'OTHER'].includes(feedbackType)) {
      return reply.code(400).send({ error: 'Invalid feedbackType. Must be BUG, IDEA, PRAISE, or OTHER' });
    }

    let user = null;
    let businessId = null;
    let userId = null;
    let domain = 'PUBLIC';

    try {
      await request.jwtVerify();
      user = request.user;
      businessId = user.businessId;
      userId = user.id;

      if (user.role === 'SUPER_ADMIN') {
        domain = 'OWNER';
      } else if (user.role === 'ADMIN') {
        domain = 'ADMIN';
      } else if (user.role === 'STAFF') {
        domain = 'STAFF';
      } else if (user.role === 'CLIENT') {
        domain = 'CLIENT';
      }
    } catch (err) {
      domain = 'PUBLIC';
    }

    const enhancedMetadata = {
      ...(metadata || {}),
      userAgent: request.headers['user-agent'],
      url: metadata?.url || request.headers.referer,
      timestamp: new Date().toISOString()
    };

    const feedback = await storage.createFeedback({
      businessId,
      userId,
      domain,
      feedbackType,
      message,
      metadata: enhancedMetadata
    });

    return {
      success: true,
      feedbackId: feedback.id,
      message: 'Thank you for your feedback!'
    };
  });

  // GET /api/feedback - List all feedback (Super Admin only)
  app.get('/feedback', async (request, reply) => {
    try {
      await request.jwtVerify();
      
      if (request.user.role !== 'SUPER_ADMIN') {
        return reply.code(403).send({ error: 'Access denied: Super Admin only' });
      }

      const { domain, feedbackType, status } = request.query;

      const filters = {};
      if (domain) filters.domain = domain;
      if (feedbackType) filters.feedbackType = feedbackType;
      if (status) filters.status = status;

      const feedbackItems = await storage.getAllFeedback(filters);

      return { feedback: feedbackItems };
    } catch (err) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  // PATCH /api/feedback/:id/status - Update feedback status (Super Admin only)
  app.patch('/feedback/:id/status', async (request, reply) => {
    try {
      await request.jwtVerify();
      
      if (request.user.role !== 'SUPER_ADMIN') {
        return reply.code(403).send({ error: 'Access denied: Super Admin only' });
      }

      const { id } = request.params;
      const { status } = request.body;

      if (!['NEW', 'IN_REVIEW', 'RESOLVED', 'DISMISSED'].includes(status)) {
        return reply.code(400).send({ error: 'Invalid status' });
      }

      const feedback = await storage.updateFeedbackStatus(parseInt(id), status);

      return { success: true, feedback };
    } catch (err) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  // GET /api/feedback/summary - Get daily summary (for automation)
  app.get('/feedback/summary', async (request, reply) => {
    try {
      const { date } = request.query;
      
      const targetDate = date ? new Date(date) : new Date();
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      const feedbackItems = await storage.getFeedbackByDateRange(startOfDay, endOfDay);

      return {
        date: targetDate.toISOString().split('T')[0],
        count: feedbackItems.length,
        byType: {
          BUG: feedbackItems.filter(f => f.feedbackType === 'BUG').length,
          IDEA: feedbackItems.filter(f => f.feedbackType === 'IDEA').length,
          PRAISE: feedbackItems.filter(f => f.feedbackType === 'PRAISE').length,
          OTHER: feedbackItems.filter(f => f.feedbackType === 'OTHER').length
        },
        byDomain: {
          ADMIN: feedbackItems.filter(f => f.domain === 'ADMIN').length,
          STAFF: feedbackItems.filter(f => f.domain === 'STAFF').length,
          CLIENT: feedbackItems.filter(f => f.domain === 'CLIENT').length,
          OWNER: feedbackItems.filter(f => f.domain === 'OWNER').length,
          PUBLIC: feedbackItems.filter(f => f.domain === 'PUBLIC').length
        },
        items: feedbackItems
      };
    } catch (err) {
      return reply.code(500).send({ error: 'Failed to generate summary' });
    }
  });
}
