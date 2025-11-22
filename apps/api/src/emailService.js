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

// Helper to send payment failure warning (immediate)
async function sendPaymentFailureWarning({ to, businessName, gracePeriodEnd, amount, currency }) {
  const subject = '⚠️ Payment Failed - Action Required';
  const gracePeriodDate = new Date(gracePeriodEnd).toLocaleDateString('en-GB', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const html = `
    <h1 style="color: #d97706;">Payment Failed</h1>
    <p>Hi from <strong>${businessName}</strong>,</p>
    <p><strong>Your recent payment of ${currency.toUpperCase()} ${amount.toFixed(2)} could not be processed.</strong></p>
    <p>This might be due to:</p>
    <ul>
      <li>Insufficient funds</li>
      <li>Expired card</li>
      <li>Card declined by your bank</li>
    </ul>
    <p><strong>You have until ${gracePeriodDate} to update your payment details.</strong></p>
    <p>Your business will continue to operate normally during this grace period, but please update your payment method as soon as possible to avoid any service interruption.</p>
    <p><strong>What to do:</strong></p>
    <ol>
      <li>Log in to your Pawtimation account</li>
      <li>Go to Settings → Billing</li>
      <li>Update your payment method</li>
    </ol>
    <p>If you need help or have questions, please reply to this email.</p>
    <p>Best regards,<br>The Pawtimation Team</p>
  `;
  
  return sendEmail({ to, subject, html });
}

// Helper to send payment reminder (24 hours later)
async function sendPaymentReminder({ to, businessName, gracePeriodEnd, daysRemaining }) {
  const subject = '⏰ Payment Reminder - Update Required';
  const gracePeriodDate = new Date(gracePeriodEnd).toLocaleDateString('en-GB', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const html = `
    <h1 style="color: #d97706;">Payment Reminder</h1>
    <p>Hi from <strong>${businessName}</strong>,</p>
    <p><strong>This is a reminder that your payment method needs to be updated.</strong></p>
    <p>You have <strong>${daysRemaining} days</strong> remaining until your grace period expires on <strong>${gracePeriodDate}</strong>.</p>
    <p>To avoid any interruption to your service, please update your payment details as soon as possible:</p>
    <ol>
      <li>Log in to your Pawtimation account</li>
      <li>Go to Settings → Billing</li>
      <li>Update your payment method</li>
    </ol>
    <p>Your business is still operating normally, but this will change if we cannot process your payment by the deadline.</p>
    <p>Need help? Reply to this email and we'll assist you.</p>
    <p>Best regards,<br>The Pawtimation Team</p>
  `;
  
  return sendEmail({ to, subject, html });
}

// Helper to send final payment notice (grace period expiring)
async function sendPaymentFinalNotice({ to, businessName, gracePeriodEnd }) {
  const subject = '🚨 Final Notice - Service Suspension Imminent';
  const gracePeriodDate = new Date(gracePeriodEnd).toLocaleDateString('en-GB', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const html = `
    <h1 style="color: #dc2626;">Final Payment Notice</h1>
    <p>Hi from <strong>${businessName}</strong>,</p>
    <p><strong style="color: #dc2626;">Your grace period expires today at ${gracePeriodDate}.</strong></p>
    <p>We have been unable to process your payment, and your service will be suspended if we do not receive payment by the deadline.</p>
    <p><strong>What happens if payment is not received:</strong></p>
    <ul>
      <li>Your business account will be suspended</li>
      <li>Staff will lose access to the system</li>
      <li>Clients will be unable to book services</li>
      <li>All data will be preserved for when you return</li>
    </ul>
    <p><strong>To prevent suspension (URGENT):</strong></p>
    <ol>
      <li>Log in to your Pawtimation account immediately</li>
      <li>Go to Settings → Billing</li>
      <li>Update your payment method</li>
    </ol>
    <p>If you're experiencing financial difficulties or need to discuss payment options, please reply to this email immediately.</p>
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
  sendReferralEarnedEmail,
  sendPaymentFailureWarning,
  sendPaymentReminder,
  sendPaymentFinalNotice
};
