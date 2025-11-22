// Beta system configuration
// All beta logic driven by these configuration values
export const BETA_CONFIG = {
  // Enable/disable beta system entirely
  ENABLED: (process.env.BETA_ENABLED || 'true') === 'true',
  
  // Beta end date (ISO string) - Auto-switches to free trial after this
  END_DATE: process.env.BETA_END_DATE || '2024-12-31T23:59:59Z',
  
  // Maximum number of active beta testers allowed
  MAX_ACTIVE_TESTERS: Number(process.env.BETA_MAX_ACTIVE_TESTERS || 15),
  
  // Default trial period in days (for post-beta signups)
  TRIAL_DEFAULT_DAYS: Number(process.env.TRIAL_DEFAULT_DAYS || 30),
  
  // Contact email for beta support
  BETA_CONTACT_EMAIL: process.env.BETA_CONTACT_EMAIL || 'hello@pawtimation.co.uk',
  
  // Hours to wait before sending founder welcome email
  FOUNDER_EMAIL_DELAY_HOURS: Number(process.env.FOUNDER_EMAIL_DELAY_HOURS || 6),
};

// Helper function: Check if beta is currently active
export function isBetaActive() {
  if (!BETA_CONFIG.ENABLED) return false;
  const now = new Date();
  const endDate = new Date(BETA_CONFIG.END_DATE);
  return now < endDate;
}

// Helper function: Check if beta has ended
export function isBetaEnded() {
  if (!BETA_CONFIG.ENABLED) return false;
  const now = new Date();
  const endDate = new Date(BETA_CONFIG.END_DATE);
  return now >= endDate;
}

// Helper function: Calculate trial end date
export function calculateTrialEndDate(startDate = new Date()) {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + BETA_CONFIG.TRIAL_DEFAULT_DAYS);
  return endDate;
}

// Helper function: Calculate founder email scheduled time
export function calculateFounderEmailTime(startDate = new Date()) {
  const scheduledDate = new Date(startDate);
  scheduledDate.setHours(scheduledDate.getHours() + BETA_CONFIG.FOUNDER_EMAIL_DELAY_HOURS);
  return scheduledDate;
}
