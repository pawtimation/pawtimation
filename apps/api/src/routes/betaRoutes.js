import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import { storage } from '../storage.js';
import { isBetaActive, isBetaEnded, BETA_CONFIG, calculateFounderEmailTime, calculateTrialEndDate } from '../betaConfig.js';
import { sendEmail, sendWaitlistEmail, sendWelcomeEmail } from '../emailService.js';

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

      // Generate unique business ID and referral code
      const businessId = `biz_${nanoid(12)}`;
      const referralCode = `PAW${nanoid(8).toUpperCase()}`;

      // Create business record with beta status
      const business = await storage.createBusiness({
        id: businessId,
        name: tester.businessName,
        planStatus: 'BETA',
        betaStartedAt: now,
        betaEndsAt: betaEndDate,
        referralCode
      });

      // Generate secure random password for admin
      const tempPassword = `Paw${nanoid(12)}!`;
      const passHash = await bcrypt.hash(tempPassword, 10);

      // Create admin user account
      const adminUser = await storage.createUser({
        id: `u_${nanoid(12)}`,
        businessId,
        role: 'ADMIN',
        name: tester.name,
        email: tester.email,
        passHash,
        isAdmin: false
      });

      // Update tester status with business link
      const updated = await storage.updateBetaTester(id, {
        status: 'ACTIVE',
        businessId,
        betaStartedAt: now,
        betaEndsAt: betaEndDate,
        founderEmailScheduledAt: founderEmailScheduled,
        founderEmailSentAt: null
      });

      // Send activation email with credentials
      const loginUrl = `${process.env.VITE_API_BASE || 'http://localhost:3000'}/admin/login`;
      await sendEmail({
        to: tester.email,
        subject: 'Welcome to Pawtimation Beta - Your Account is Ready!',
        html: `
          <h1>Welcome to Pawtimation!</h1>
          <p>Hi ${tester.name},</p>
          <p>Great news! You've been accepted into the Pawtimation beta program and your account is now active.</p>
          
          <h2>Your Login Credentials</h2>
          <p><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
          <p><strong>Email:</strong> ${tester.email}</p>
          <p><strong>Password:</strong> ${tempPassword}</p>
          
          <p><em>Important: Please change your password after your first login.</em></p>
          
          <h2>Beta Details</h2>
          <p><strong>Business:</strong> ${tester.businessName}</p>
          <p><strong>Beta Period:</strong> Now until ${betaEndDate.toLocaleDateString()}</p>
          <p><strong>Referral Code:</strong> ${referralCode} (Share with other dog-walking businesses to earn rewards!)</p>
          
          <p>I'll reach out in 6 hours to see how you're getting on and answer any questions.</p>
          
          <p>Best,<br>Andrew & the Pawtimation team</p>
        `
      });

      return { success: true, tester: updated, business, adminUser: { ...adminUser, tempPassword } };
    } catch (err) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  // POST /api/beta/start-trial - Convert beta to free trial or start new trial
  app.post('/beta/start-trial', async (request, reply) => {
    const { email, businessName, name, referredBy } = request.body;

    if (!email || !businessName || !name) {
      return reply.code(400).send({ error: 'Email, business name, and name are required' });
    }

    // Generate unique business ID and referral code
    const businessId = `biz_${nanoid(12)}`;
    const referralCode = `PAW${nanoid(8).toUpperCase()}`;
    const now = new Date();
    const trialEndsAt = calculateTrialEndDate(now);

    // Create business record with trial status
    const business = await storage.createBusiness({
      id: businessId,
      name: businessName,
      planStatus: 'FREE_TRIAL',
      trialStartedAt: now,
      trialEndsAt,
      referralCode,
      trialDays: BETA_CONFIG.TRIAL_DEFAULT_DAYS
    });

    // Generate secure random password for admin
    const tempPassword = `Paw${nanoid(12)}!`;
    const passHash = await bcrypt.hash(tempPassword, 10);

    // Create admin user account
    const adminUser = await storage.createUser({
      id: `u_${nanoid(12)}`,
      businessId,
      role: 'ADMIN',
      name,
      email,
      passHash,
      isAdmin: false
    });

    // Track referral if provided
    if (referredBy) {
      try {
        const referrer = await storage.getBusinessByReferralCode(referredBy);
        if (referrer) {
          await storage.createReferral({
            id: `ref_${nanoid(12)}`,
            referrerBusinessId: referrer.id,
            referredBusinessId: businessId,
            referredEmail: email,
            status: 'TRIAL',
            referredAt: now
          });
        }
      } catch (err) {
        console.error('Failed to track referral:', err);
      }
    }

    // Send welcome email with credentials
    const loginUrl = `${process.env.VITE_API_BASE || 'http://localhost:3000'}/admin/login`;
    await sendEmail({
      to: email,
      subject: 'Welcome to Pawtimation - Your Free Trial is Ready!',
      html: `
        <h1>Welcome to Pawtimation!</h1>
        <p>Hi ${name},</p>
        <p>Your ${BETA_CONFIG.TRIAL_DEFAULT_DAYS}-day free trial is now active!</p>
        
        <h2>Your Login Credentials</h2>
        <p><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Password:</strong> ${tempPassword}</p>
        
        <p><em>Important: Please change your password after your first login.</em></p>
        
        <h2>Trial Details</h2>
        <p><strong>Business:</strong> ${businessName}</p>
        <p><strong>Trial Period:</strong> ${BETA_CONFIG.TRIAL_DEFAULT_DAYS} days (ends ${trialEndsAt.toLocaleDateString()})</p>
        <p><strong>Referral Code:</strong> ${referralCode} (Share with other dog-walking businesses!)</p>
        
        <p>Enjoy exploring Pawtimation!</p>
        
        <p>Best,<br>Andrew & the Pawtimation team</p>
      `
    });

    return { 
      success: true, 
      business, 
      adminUser: { id: adminUser.id, email: adminUser.email },
      trialEndsAt
    };
  });

  // POST /api/beta/validate-referral - Validate a referral code
  app.post('/beta/validate-referral', async (request, reply) => {
    const { code } = request.body;

    if (!code) {
      return reply.code(400).send({ error: 'Referral code is required' });
    }

    try {
      const business = await storage.getBusinessByReferralCode(code);
      if (!business) {
        return { valid: false };
      }

      return { 
        valid: true, 
        businessName: business.name,
        code
      };
    } catch (err) {
      return { valid: false };
    }
  });

  // GET /api/beta/referrals - Get referrals for authenticated business
  app.get('/beta/referrals', async (request, reply) => {
    try {
      await request.jwtVerify();
      const user = request.user;

      const referrals = await storage.getReferralsByReferrer(user.businessId);
      const convertedCount = await storage.countConvertedReferrals(user.businessId);

      return {
        referrals,
        convertedCount,
        totalReferrals: referrals.length
      };
    } catch (err) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });
}
