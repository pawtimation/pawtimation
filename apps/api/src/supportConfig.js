export const SUPPORT = {
  ALERT_EMAIL: process.env.ALERT_EMAIL || 'hello@pawtimation.co.uk',
  // Escalate if any of these keywords appear
  KEYWORDS: [
    'complaint','danger','injury','lost dog','lost','emergency','refund','chargeback',
    'abuse','bitten','medical','vet','unsafe','fraud','scam','police','urgent'
  ],
  // Escalate if N bot turns without a "resolved" tag
  MAX_TURNS_WITHOUT_RESOLUTION: Number(process.env.MAX_TURNS_WITHOUT_RESOLUTION || 4),
  // Escalate on CSAT "paw down" immediately?
  ESCALATE_ON_NEGATIVE_CSAT: (process.env.ESCALATE_ON_NEGATIVE_CSAT || 'true') === 'true',
  // Optional email send (use one of these)
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
  SEND_FROM: process.env.SEND_FROM || 'no-reply@pawtimation.co.uk',
  EMAIL_WEBHOOK_URL: process.env.EMAIL_WEBHOOK_URL || '' // alternative: your own Zapier/Make webhook
};
