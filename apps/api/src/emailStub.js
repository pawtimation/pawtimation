// Email stub - replace with real email service (Resend, SendGrid, etc.)
export async function sendEmail({ to, subject, html, from = 'Pawtimation <hello@pawtimation.co.uk>' }) {
  console.log('📧 EMAIL STUB - Would send email:');
  console.log(`  To: ${to}`);
  console.log(`  From: ${from}`);
  console.log(`  Subject: ${subject}`);
  console.log(`  Body: ${html.substring(0, 100)}...`);
  
  // FUTURE: Replace with Resend API for production email sending
  // Implementation steps:
  // 1. User provides RESEND_API_KEY via environment variables
  // 2. Install Resend: npm install resend
  // 3. Replace this stub with: 
  //    const resend = new Resend(process.env.RESEND_API_KEY);
  //    await resend.emails.send({ from, to, subject, html });
  // 4. Update from address to verified Resend domain
  
  return { success: true };
}
