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
    MONTHLY: process.env.STRIPE_PRICE_SOLO_MONTHLY || 'price_1SWGu5Q50avq5y6soPCHL72Q',
    ANNUAL: process.env.STRIPE_PRICE_SOLO_ANNUAL || 'price_1SWGu6Q50avq5y6s26V8CiO6',
  },
  TEAM: {
    MONTHLY: process.env.STRIPE_PRICE_TEAM_MONTHLY || 'price_1SWGu6Q50avq5y6sPBJIcD39',
    ANNUAL: process.env.STRIPE_PRICE_TEAM_ANNUAL || 'price_1SWGu7Q50avq5y6szkE3FHMQ',
  },
  GROWING: {
    MONTHLY: process.env.STRIPE_PRICE_GROWING_MONTHLY || 'price_1SWGu8Q50avq5y6su69m2Mz3',
    ANNUAL: process.env.STRIPE_PRICE_GROWING_ANNUAL || 'price_1SWGu8Q50avq5y6sbAVMhvHH',
  },
  AGENCY: {
    MONTHLY: process.env.STRIPE_PRICE_AGENCY_MONTHLY || 'price_1SWGu9Q50avq5y6s8eq77gFQ',
    ANNUAL: process.env.STRIPE_PRICE_AGENCY_ANNUAL || 'price_1SWGu9Q50avq5y6sWwtGaCEt',
  },
};
