import { nanoid } from 'nanoid';
import { storage } from '../storage.js';
import { isBetaActive, isBetaEnded, BETA_CONFIG, calculateFounderEmailTime } from '../betaConfig.js';
import { sendEmail } from '../emailStub.js';

export async function betaRoutes(app, opts) {
  
  // GET /api/beta/status - Check current beta status
  app.get('/beta/status', async (request, reply) => {
    const activeCount = await storage.countActiveBetaTesters();
    
    return {
      betaActive: isBetaActive(),
      betaEnded: isBetaEnded(),
      slotsAvailable: BETA_CONFIG.MAX_ACTIVE_TESTERS - activeCount,
      maxTesters: BETA_CONFIG.MAX_ACTIVE_TESTERS,
      activeTesters: activeCount,
      endDate: BETA_CONFIG.END_DATE
    };
  });

  // POST /api/beta/apply - Submit beta application
  app.post('/beta/apply', async (request, reply) => {
    const { name, email, businessName, phone, notes } = request.body;

    // Validation
    if (!name || !email || !businessName) {
      return reply.code(400).send({ error: 'Name, email, and business name are required' });
    }

    // Check if already applied
    const existing = await storage.getBetaTesterByEmail(email);
    if (existing) {
      return reply.code(400).send({ error: 'You have already applied to the beta program' });
    }

    // Check beta status
    const activeCount = await storage.countActiveBetaTesters();
    const isWaitlisted = isBetaActive() && activeCount >= BETA_CONFIG.MAX_ACTIVE_TESTERS;
    const status = isWaitlisted ? 'WAITLISTED' : 'APPLIED';

    // Create beta tester record
    const tester = await storage.createBetaTester({
      id: `beta_${nanoid(16)}`,
      name,
      email,
      businessName,
      phone: phone || null,
      notes: notes || null,
      status
    });

    // Send appropriate email
    if (isWaitlisted) {
      await sendEmail({
        to: email,
        subject: "You're on the Pawtimation beta waiting list",
        html: `
          <h1>Thanks for your interest!</h1>
          <p>Hi ${name},</p>
          <p>Thanks so much for applying to join the Pawtimation beta. We've reached our current capacity of ${BETA_CONFIG.MAX_ACTIVE_TESTERS} active testers, but you're now on our waiting list.</p>
          <p>We'll reach out as soon as we have spots available or when we launch new features.</p>
          <p>Best,<br>Andrew & the Pawtimation team</p>
        `
      });
    } else {
      await sendEmail({
        to: email,
        subject: 'Your Pawtimation beta application',
        html: `
          <h1>Thanks for applying!</h1>
          <p>Hi ${name},</p>
          <p>We've received your application to join the Pawtimation beta for <strong>${businessName}</strong>.</p>
          <p>We'll review your application and be in touch soon with next steps.</p>
          <p>Best,<br>Andrew & the Pawtimation team</p>
        `
      });
    }

    return {
      success: true,
      status,
      message: isWaitlisted 
        ? "You've been added to the waiting list"
        : "Application received! We'll be in touch soon."
    };
  });

  // GET /api/beta/testers - List all beta testers (admin only)
  app.get('/beta/testers', async (request, reply) => {
    try {
      await request.jwtVerify();
      // TODO: Add proper admin role check
      const testers = await storage.getAllBetaTesters();
      return { testers };
    } catch (err) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  // POST /api/beta/activate/:id - Activate a beta tester (admin only)
  app.post('/beta/activate/:id', async (request, reply) => {
    try {
      await request.jwtVerify();
      const { id } = request.params;

      // Check if we're at capacity
      const activeCount = await storage.countActiveBetaTesters();
      if (activeCount >= BETA_CONFIG.MAX_ACTIVE_TESTERS) {
        return reply.code(400).send({ 
          error: `Cannot activate: already at maximum capacity (${BETA_CONFIG.MAX_ACTIVE_TESTERS} active testers)` 
        });
      }

      const tester = await storage.getBetaTester(id);
      if (!tester) {
        return reply.code(404).send({ error: 'Beta tester not found' });
      }

      if (tester.status === 'ACTIVE') {
        return reply.code(400).send({ error: 'Beta tester is already active' });
      }

      const now = new Date();
      const betaEndDate = new Date(BETA_CONFIG.END_DATE);
      const founderEmailScheduled = calculateFounderEmailTime(now);

      // Update tester status to ACTIVE
      const updated = await storage.updateBetaTester(id, {
        status: 'ACTIVE',
        betaStartedAt: now,
        betaEndsAt: betaEndDate,
        founderEmailScheduledAt: founderEmailScheduled,
        founderEmailSentAt: null
      });

      // TODO: Create business and admin account for the tester
      // This will be implemented as part of the full activation workflow

      // Send activation email
      await sendEmail({
        to: tester.email,
        subject: 'Welcome to Pawtimation Beta!',
        html: `
          <h1>Welcome to Pawtimation!</h1>
          <p>Hi ${tester.name},</p>
          <p>Great news! You've been accepted into the Pawtimation beta program.</p>
          <p>Your beta access for <strong>${tester.businessName}</strong> is now active and will run until ${betaEndDate.toLocaleDateString()}.</p>
          <p>We'll send you login details and onboarding information shortly.</p>
          <p>Best,<br>Andrew & the Pawtimation team</p>
        `
      });

      return { success: true, tester: updated };
    } catch (err) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });
}
