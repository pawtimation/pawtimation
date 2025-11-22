/**
 * Plan to Stripe Price ID Mapping
 * 
 * Maps Pawtimation plan codes to Stripe price IDs
 * These price IDs will be created by the seed-stripe-products.js script
 * 
 * After running the seed script, update these with the actual price IDs
 */
export const PLAN_PRICE_IDS = {
  SOLO: {
    MONTHLY: process.env.STRIPE_PRICE_SOLO_MONTHLY || 'price_solo_monthly_placeholder',
    ANNUAL: process.env.STRIPE_PRICE_SOLO_ANNUAL || 'price_solo_annual_placeholder',
  },
  TEAM: {
    MONTHLY: process.env.STRIPE_PRICE_TEAM_MONTHLY || 'price_team_monthly_placeholder',
    ANNUAL: process.env.STRIPE_PRICE_TEAM_ANNUAL || 'price_team_annual_placeholder',
  },
  GROWING: {
    MONTHLY: process.env.STRIPE_PRICE_GROWING_MONTHLY || 'price_growing_monthly_placeholder',
    ANNUAL: process.env.STRIPE_PRICE_GROWING_ANNUAL || 'price_growing_annual_placeholder',
  },
  AGENCY: {
    MONTHLY: process.env.STRIPE_PRICE_AGENCY_MONTHLY || 'price_agency_monthly_placeholder',
    ANNUAL: process.env.STRIPE_PRICE_AGENCY_ANNUAL || 'price_agency_annual_placeholder',
  },
};
