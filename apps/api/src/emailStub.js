// Email stub - replace with real email service (Resend, SendGrid, etc.)
export async function sendEmail({ to, subject, html, from = 'Pawtimation <hello@pawtimation.co.uk>' }) {
  console.log('📧 EMAIL STUB - Would send email:');
  console.log(`  To: ${to}`);
  console.log(`  From: ${from}`);
  console.log(`  Subject: ${subject}`);
  console.log(`  Body: ${html.substring(0, 100)}...`);
  
  // TODO: Implement real email sending with Resend API
  // Example:
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({ from, to, subject, html });
  
  return { success: true };
}
