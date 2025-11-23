import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import { storage } from '../storage.js';
import { isBetaActive, isBetaEnded, BETA_CONFIG, calculateFounderEmailTime, calculateTrialEndDate } from '../betaConfig.js';
import { sendEmail, sendWaitlistEmail, sendWelcomeEmail } from '../emailService.js';

// Extracted activation logic that can be called from multiple routes
export async function activateBetaTester(id) {
  // Check if we're at capacity
  const activeCount = await storage.countActiveBetaTesters();
  if (activeCount >= BETA_CONFIG.MAX_ACTIVE_TESTERS) {
    throw new Error(`Cannot activate: already at maximum capacity (${BETA_CONFIG.MAX_ACTIVE_TESTERS} active testers)`);
  }

  const tester = await storage.getBetaTester(id);
  if (!tester) {
    throw new Error('Beta tester not found');
  }

  if (tester.status === 'ACTIVE') {
    throw new Error('Beta tester is already active');
  }

  const now = new Date();
  const betaEndDate = new Date(BETA_CONFIG.END_DATE);
  const founderEmailScheduled = calculateFounderEmailTime(now);

  // Generate unique business ID and referral code
  const businessId = `biz_${nanoid(12)}`;
  const referralCode = `PAW${nanoid(8).toUpperCase()}`;

  // Handle referral linking
  let referredByBusinessId = null;
  let referrerBusiness = null;
  if (tester.referredByCode) {
    // Look up the referring business by referral code
    referrerBusiness = await storage.getBusinessByReferralCode(tester.referredByCode);
    if (referrerBusiness && referrerBusiness.id !== businessId) {
      // Prevent self-referrals
      referredByBusinessId = referrerBusiness.id;
      
      // Increment referral count and credits for the referrer
      const newSignupsCount = (referrerBusiness.referralSignupsCount || 0) + 1;
      const referralBonus = 1000; // £10 credit in pence
      const newCreditsCents = (referrerBusiness.referralCreditsCents || 0) + referralBonus;
      
      await storage.updateBusiness(referrerBusiness.id, {
        referralSignupsCount: newSignupsCount,
        referralCreditsCents: newCreditsCents
      });
    }
  }

  // Create business record with Founding Member status and locked pricing
  const billingStart = new Date('2026-01-01T00:00:00Z');
  
  const business = await storage.createBusiness({
    id: businessId,
    name: tester.businessName,
    planStatus: 'BETA',
    planType: 'FOUNDING_MEMBER',
    lockedPrice: 1900,
    billingStartDate: billingStart,
    betaStartedAt: now,
    betaEndsAt: betaEndDate,
    betaActivatedAt: now,
    referralCode,
    referredByBusinessId,
    referralSignupsCount: 0,
    referralCreditsCents: 0,
    settings: {
      branding: {
        primaryColor: '#3F9C9B',
        logo: null
      },
      businessHours: {
        monday: { open: '09:00', close: '17:00', closed: false },
        tuesday: { open: '09:00', close: '17:00', closed: false },
        wednesday: { open: '09:00', close: '17:00', closed: false },
        thursday: { open: '09:00', close: '17:00', closed: false },
        friday: { open: '09:00', close: '17:00', closed: false },
        saturday: { open: '09:00', close: '17:00', closed: true },
        sunday: { open: '09:00', close: '17:00', closed: true }
      },
      notifications: {
        emailOnNewBooking: true,
        emailOnCancellation: true
      }
    },
    onboardingSteps: {
      addedServices: false,
      addedStaff: false,
      addedClients: false,
      firstBooking: false,
      completedBooking: false,
      firstInvoice: false,
      firstPayment: false
    }
  });

  // Generate secure random password for admin
  const tempPassword = `Paw${nanoid(12)}!`;
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  // Create admin user account
  const adminUserId = `u_${nanoid(12)}`;
  const adminUser = await storage.createUser({
    id: adminUserId,
    businessId,
    role: 'ADMIN',
    name: tester.name,
    email: tester.email,
    password: passwordHash
  });

  // Link the admin user as the business owner
  await storage.updateBusiness(businessId, {
    ownerUserId: adminUserId
  });

  // Update tester status with business link and activated timestamp
  const updated = await storage.updateBetaTester(id, {
    status: 'ACTIVE',
    businessId,
    betaStartedAt: now,
    betaEndsAt: betaEndDate,
    activatedAt: now,
    founderEmailScheduledAt: founderEmailScheduled,
    founderEmailSentAt: null
  });

  // Send activation email with credentials and setup link
  // Use VITE_API_BASE from environment, or construct from REPL_SLUG, or fallback to localhost
  const baseUrl = process.env.VITE_API_BASE || (process.env.REPL_SLUG ? `https://${process.env.REPL_ID || ''}.${process.env.REPL_SLUG}.repl.co` : 'http://localhost:3000');
  const setupUrl = `${baseUrl}/admin/login?redirect=/setup-account`;
  
  await sendEmail({
    to: tester.email,
    subject: 'Your Pawtimation beta access is ready',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3F9C9B;">Welcome to Pawtimation Beta!</h1>
        <p>Hi ${tester.name},</p>
        <p>Great news! You've been accepted into the Pawtimation beta program and your account is now active.</p>
        
        <div style="background-color: #f0fdfa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #3F9C9B; margin-top: 0;">Your Login Credentials</h2>
          <p><strong>Email:</strong> ${tester.email}</p>
          <p><strong>Temporary Password:</strong> ${tempPassword}</p>
          <p style="margin: 0;"><em>You can change this password in your settings after logging in.</em></p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${setupUrl}" style="background-color: #3F9C9B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Start Your Setup</a>
        </div>
        
        <h2 style="color: #3F9C9B;">What to Do First</h2>
        <ol>
          <li>Click the "Start Your Setup" button above to log in</li>
          <li>Complete the quick account setup (takes 2 minutes)</li>
          <li>Add your services, staff, and clients</li>
          <li>Create your first booking</li>
        </ol>
        
        <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #3F9C9B; margin: 20px 0;">
          <p style="margin: 0;"><strong>Beta Period:</strong> Now until ${betaEndDate.toLocaleDateString()}</p>
          <p style="margin: 10px 0 0 0;"><strong>Referral Code:</strong> ${referralCode} (Share with other pet-care businesses to earn rewards!)</p>
        </div>
        
        <p>I'll reach out in a few hours to see how you're getting on and answer any questions.</p>
        
        <p>Best,<br>Andrew & the Pawtimation team</p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="font-size: 12px; color: #64748b;">Need help? Reply to this email or contact us at support@pawtimation.com</p>
      </div>
    `
  });

  return { success: true, tester: updated, business, adminUser: { ...adminUser, tempPassword } };
}

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
    const { name, email, businessName, phone, location, businessSize, servicesOffered, currentTools, website, comments } = request.body;

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

    // Create beta tester record (using snake_case for database columns)
    const tester = await storage.createBetaTester({
      id: `beta_${nanoid(16)}`,
      name,
      email,
      businessName,
      phone: phone || null,
      location: location || null,
      businessSize: businessSize || null,
      servicesOffered: servicesOffered || null,
      currentTools: currentTools || null,
      website: website || null,
      comments: comments || null,
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

  // GET /api/beta/testers - List all beta testers (Super Admin only)
  app.get('/beta/testers', async (request, reply) => {
    try {
      await request.jwtVerify();
      
      if (request.user.role !== 'SUPER_ADMIN') {
        return reply.code(403).send({ error: 'Access denied: Super Admin only' });
      }
      
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
      
      const result = await activateBetaTester(id);
      return result;
    } catch (err) {
      if (err.message.includes('not found')) {
        return reply.code(404).send({ error: err.message });
      }
      if (err.message.includes('already active') || err.message.includes('capacity')) {
        return reply.code(400).send({ error: err.message });
      }
      return reply.code(500).send({ error: err.message || 'Failed to activate beta tester' });
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
    const loginUrl = `${process.env.VITE_API_BASE || (process.env.REPL_SLUG ? `https://${process.env.REPL_ID || ''}.${process.env.REPL_SLUG}.repl.co` : 'http://localhost:3000')}/admin/login`;
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
