import { storage } from '../storage.js';
import { sendEmail } from '../emailService.js';

// Run every hour to check for beta testers needing founder email
export async function sendPendingFounderEmails() {
  try {
    // Get all active beta testers who haven't received founder email yet
    // and whose scheduled time has passed
    const testersNeedingEmail = await storage.getBetaTestersNeedingFounderEmail();
    
    if (testersNeedingEmail.length === 0) {
      return { sent: 0, message: 'No pending founder emails to send' };
    }

    console.log(`📧 Sending founder emails to ${testersNeedingEmail.length} beta testers...`);

    let sentCount = 0;
    for (const tester of testersNeedingEmail) {
      try {
        await sendEmail({
          to: tester.email,
          subject: "How's your Pawtimation beta experience so far?",
          html: `
            <h1>Hi ${tester.name}!</h1>
            <p>It's Andrew here, founder of Pawtimation. I wanted to reach out personally to see how you're getting on with the platform.</p>
            
            <h2>A few questions:</h2>
            <ul>
              <li>Have you been able to explore the main features (clients, bookings, staff management)?</li>
              <li>Is there anything that's confusing or not working as expected?</li>
              <li>What would make Pawtimation more useful for ${tester.businessName}?</li>
            </ul>
            
            <p>I'm genuinely interested in your feedback - it's how we make Pawtimation better for real dog-walking businesses.</p>
            
            <p>Feel free to reply directly to this email or schedule a quick 15-minute call if you'd prefer to chat.</p>
            
            <p>Thanks for being part of the beta!</p>
            
            <p>Best,<br>Andrew James Beattie<br>Founder, Pawtimation</p>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              P.S. Don't forget your referral code: <strong>${tester.referralCode || 'Contact us for your code'}</strong>. 
              Share it with other dog-walking businesses to earn rewards when they sign up!
            </p>
          `
        });

        // Mark as sent
        await storage.updateBetaTester(tester.id, {
          founderEmailSentAt: new Date()
        });

        sentCount++;
        console.log(`✓ Founder email sent to ${tester.email}`);
      } catch (err) {
        console.error(`✗ Failed to send founder email to ${tester.email}:`, err.message);
      }
    }

    return { 
      sent: sentCount, 
      total: testersNeedingEmail.length,
      message: `Sent ${sentCount} of ${testersNeedingEmail.length} founder emails`
    };
  } catch (err) {
    console.error('Error in sendPendingFounderEmails:', err);
    return { sent: 0, error: err.message };
  }
}

// Start the founder email automation (runs every hour)
export function startFounderEmailAgent() {
  console.log('🤖 Founder email agent started (runs every hour)');
  
  // Run immediately on startup
  sendPendingFounderEmails();
  
  // Then run every hour
  setInterval(async () => {
    await sendPendingFounderEmails();
  }, 60 * 60 * 1000); // 1 hour
}
