// Email Service - Production-ready with graceful fallback
// Uses Resend when RESEND_API_KEY is set, otherwise logs to console

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'Pawtimation <hello@pawtimation.co.uk>';
const RESEND_ENABLED = !!RESEND_API_KEY;

async function sendEmail({ to, subject, html, text }) {
  try {
    if (!to || !subject) {
      console.warn('[Email] Missing required fields:', { to, subject });
      return { success: false, mode: 'skipped', error: 'Missing required fields' };
    }

    if (RESEND_ENABLED) {
      // Production mode: Send via Resend
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: EMAIL_FROM,
          to: Array.isArray(to) ? to : [to],
          subject,
          html: html || text,
          text: text || undefined
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[Email] Resend API error:', error);
        return { success: false, mode: 'resend', error };
      }

      const data = await response.json();
      console.log('[Email] Sent via Resend:', { to, subject, id: data.id });
      return { success: true, mode: 'resend', id: data.id };

    } else {
      // Manual mode: Console log only
      console.log('\n═══════════════════════════════════════════');
      console.log('📧 EMAIL (Manual Mode - Not Actually Sent)');
      console.log('═══════════════════════════════════════════');
      console.log('From:', EMAIL_FROM);
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('───────────────────────────────────────────');
      if (text) {
        console.log('Text:\n', text);
      }
      if (html) {
        console.log('HTML:\n', html.substring(0, 500) + (html.length > 500 ? '...' : ''));
      }
      console.log('═══════════════════════════════════════════\n');
      
      return { success: true, mode: 'console', message: 'Logged to console' };
    }

  } catch (err) {
    // NEVER throw - fail gracefully
    console.error('[Email] Failed to send:', err.message);
    return { success: false, mode: RESEND_ENABLED ? 'resend' : 'console', error: err.message };
  }
}

// Helper to send welcome email
async function sendWelcomeEmail({ to, businessName, userName }) {
  const subject = `Welcome to Pawtimation Beta, ${businessName}!`;
  const html = `
    <h1>Welcome to Pawtimation! 🐾</h1>
    <p>Hi ${userName},</p>
    <p>Congratulations! Your business <strong>${businessName}</strong> has been activated on Pawtimation.</p>
    <p>You can now:</p>
    <ul>
      <li>Manage clients and their pets</li>
      <li>Schedule dog walking services</li>
      <li>Track bookings and routes</li>
      <li>Manage staff and assignments</li>
    </ul>
    <p>Get started at: <a href="${process.env.VITE_API_BASE || 'https://pawtimation.com'}">${process.env.VITE_API_BASE || 'https://pawtimation.com'}</a></p>
    <p>Best regards,<br>The Pawtimation Team</p>
  `;
  
  return sendEmail({ to, subject, html });
}

// Helper to send trial welcome email
async function sendTrialWelcomeEmail({ to, businessName, userName, trialDays }) {
  const subject = `Your ${trialDays}-Day Free Trial Has Started!`;
  const html = `
    <h1>Welcome to Your Free Trial! 🎉</h1>
    <p>Hi ${userName},</p>
    <p>Your <strong>${trialDays}-day free trial</strong> for <strong>${businessName}</strong> has started!</p>
    <p>You have full access to all Pawtimation features:</p>
    <ul>
      <li>Client & pet management</li>
      <li>Service scheduling</li>
      <li>Route generation</li>
      <li>Financial tracking</li>
      <li>Staff management</li>
    </ul>
    <p>Your trial ends in ${trialDays} days. We'll remind you before it expires.</p>
    <p>Get started: <a href="${process.env.VITE_API_BASE || 'https://pawtimation.com'}">${process.env.VITE_API_BASE || 'https://pawtimation.com'}</a></p>
    <p>Best regards,<br>The Pawtimation Team</p>
  `;
  
  return sendEmail({ to, subject, html });
}

// Helper to send founder follow-up email
async function sendFounderFollowUpEmail({ businessName, adminEmail, adminName, businessId }) {
  const subject = `New Beta Tester: ${businessName} - 6hr Follow-up`;
  const html = `
    <h2>Beta Tester 6-Hour Follow-Up</h2>
    <p><strong>Business:</strong> ${businessName}</p>
    <p><strong>Admin:</strong> ${adminName} (${adminEmail})</p>
    <p><strong>Business ID:</strong> ${businessId}</p>
    <p><strong>Status:</strong> Activated 6 hours ago</p>
    <hr>
    <p>Check in with this tester to see:</p>
    <ul>
      <li>Have they logged in?</li>
      <li>Any confusion or blockers?</li>
      <li>Initial feedback on the platform?</li>
    </ul>
    <p><a href="${process.env.VITE_API_BASE || 'https://pawtimation.com'}/owner">View in Owner Portal</a></p>
  `;
  
  return sendEmail({ 
    to: 'hello@pawtimation.co.uk', 
    subject, 
    html 
  });
}

// Helper to send waitlist email
async function sendWaitlistEmail({ to, businessName }) {
  const subject = 'Added to Pawtimation Beta Waitlist';
  const html = `
    <h1>You're on the Waitlist! 📋</h1>
    <p>Hi there,</p>
    <p>Thanks for your interest in Pawtimation for <strong>${businessName}</strong>!</p>
    <p>We've added you to our beta waitlist. We're currently at capacity, but we'll notify you as soon as a spot opens up.</p>
    <p>In the meantime, feel free to reply to this email with any questions.</p>
    <p>Best regards,<br>The Pawtimation Team</p>
  `;
  
  return sendEmail({ to, subject, html });
}

// Helper to send referral earned email
async function sendReferralEarnedEmail({ to, businessName, referredBusinessName, reward }) {
  const subject = 'Referral Reward Earned! 🎁';
  const html = `
    <h1>Great News! You've Earned a Referral Reward! 🎉</h1>
    <p>Hi from <strong>${businessName}</strong>,</p>
    <p>Thank you for referring <strong>${referredBusinessName}</strong> to Pawtimation!</p>
    <p><strong>Your Reward:</strong> ${reward}</p>
    <p>This reward will be applied to your account.</p>
    <p>Keep spreading the word!</p>
    <p>Best regards,<br>The Pawtimation Team</p>
  `;
  
  return sendEmail({ to, subject, html });
}

export { 
  sendEmail,
  sendWelcomeEmail,
  sendTrialWelcomeEmail,
  sendFounderFollowUpEmail,
  sendWaitlistEmail,
  sendReferralEarnedEmail
};
