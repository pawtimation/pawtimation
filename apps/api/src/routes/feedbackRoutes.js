import { storage } from '../storage.js';

// Domain auto-detection from route
function detectDomain(url) {
  if (!url) return 'OTHER';
  
  if (url.includes('/calendar') || url.includes('/jobs')) return 'BOOKINGS';
  if (url.includes('/staff')) return 'STAFF';
  if (url.includes('/clients')) return 'CLIENTS';
  if (url.includes('/finance') || url.includes('/invoices')) return 'FINANCE';
  if (url.includes('/routes') || url.includes('/map')) return 'ROUTES';
  if (url.includes('/dashboard')) {
    const isMobile = url.includes('mobile') || url.includes('m.');
    return isMobile ? 'MOBILE_UI' : 'OTHER';
  }
  
  return 'OTHER';
}

export async function feedbackRoutes(app, opts) {
  
  // POST /api/feedback - Submit feedback (public or authenticated)
  app.post('/feedback', async (request, reply) => {
    const { category, title, description, severity, source, domain: manualDomain } = request.body;

    if (!category || !description) {
      return reply.code(400).send({ error: 'category and description are required' });
    }

    if (!['BUG', 'CONFUSION', 'IDEA', 'PRAISE', 'OTHER'].includes(category)) {
      return reply.code(400).send({ error: 'Invalid category. Must be BUG, CONFUSION, IDEA, PRAISE, or OTHER' });
    }

    let user = null;
    let businessId = null;
    let userId = null;
    let userRole = 'ANON';
    let detectedDomain = detectDomain(request.body.url);

    try {
      await request.jwtVerify();
      user = request.user;
      businessId = user.businessId;
      userId = user.id;

      if (user.role === 'SUPER_ADMIN') {
        userRole = 'SUPER_ADMIN';
      } else if (user.role === 'ADMIN') {
        userRole = 'ADMIN';
      } else if (user.role === 'STAFF') {
        userRole = 'STAFF';
      } else if (user.role === 'CLIENT') {
        userRole = 'CLIENT';
      }
    } catch (err) {
      userRole = 'ANON';
    }

    // Fallback: if route-based detection fails, use legacy role-based domain mapping
    let domain = manualDomain || detectedDomain;
    if (domain === 'OTHER' && userRole !== 'ANON') {
      // Legacy fallback for backward compatibility
      if (userRole === 'SUPER_ADMIN') {
        domain = 'OWNER';
      } else if (userRole === 'ADMIN') {
        domain = 'ADMIN';
      } else if (userRole === 'CLIENT') {
        domain = 'CLIENT';
      }
      // Note: STAFF userRole keeps domain as 'OTHER' if route doesn't match
    } else if (domain === 'OTHER' && userRole === 'ANON') {
      domain = 'PUBLIC';
    }

    const context = {
      userAgent: request.headers['user-agent'],
      url: request.body.url || request.headers.referer,
      timestamp: new Date().toISOString(),
      browser: request.body.browser,
      os: request.body.os,
      device: request.body.device,
      route: request.body.route
    };

    const feedback = await storage.createFeedback({
      businessId,
      userId,
      userRole,
      source: source || 'CHAT_WIDGET',
      category,
      domain,
      severity: severity || 'MEDIUM',
      title: title || description.substring(0, 100),
      description,
      context
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

      const { domain, category, severity, status } = request.query;

      const filters = {};
      if (domain) filters.domain = domain;
      if (category) filters.category = category;
      if (severity) filters.severity = severity;
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

      if (!['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'WONT_FIX'].includes(status)) {
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

      // Sort by severity and occurrence for top issues
      const sortedBySeverity = [...feedbackItems].sort((a, b) => {
        const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return b.occurrenceCount - a.occurrenceCount;
      });

      return {
        date: targetDate.toISOString().split('T')[0],
        count: feedbackItems.length,
        byCategory: {
          BUG: feedbackItems.filter(f => f.category === 'BUG').length,
          CONFUSION: feedbackItems.filter(f => f.category === 'CONFUSION').length,
          IDEA: feedbackItems.filter(f => f.category === 'IDEA').length,
          PRAISE: feedbackItems.filter(f => f.category === 'PRAISE').length,
          OTHER: feedbackItems.filter(f => f.category === 'OTHER').length
        },
        bySeverity: {
          CRITICAL: feedbackItems.filter(f => f.severity === 'CRITICAL').length,
          HIGH: feedbackItems.filter(f => f.severity === 'HIGH').length,
          MEDIUM: feedbackItems.filter(f => f.severity === 'MEDIUM').length,
          LOW: feedbackItems.filter(f => f.severity === 'LOW').length
        },
        byDomain: {
          BOOKINGS: feedbackItems.filter(f => f.domain === 'BOOKINGS').length,
          STAFF: feedbackItems.filter(f => f.domain === 'STAFF').length,
          CLIENTS: feedbackItems.filter(f => f.domain === 'CLIENTS').length,
          FINANCE: feedbackItems.filter(f => f.domain === 'FINANCE').length,
          ROUTES: feedbackItems.filter(f => f.domain === 'ROUTES').length,
          MOBILE_UI: feedbackItems.filter(f => f.domain === 'MOBILE_UI').length,
          OTHER: feedbackItems.filter(f => f.domain === 'OTHER').length
        },
        topIssues: sortedBySeverity.slice(0, 10),
        items: feedbackItems
      };
    } catch (err) {
      return reply.code(500).send({ error: 'Failed to generate summary' });
    }
  });
}
