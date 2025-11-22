import { getUncachableStripeClient } from './stripeClient.js';
import { PLANS } from '../../../../shared/planConfig.js';

/**
 * Seed Stripe Products and Prices
 * 
 * Creates products and prices in Stripe for Pawtimation pricing plans
 * Run this script manually: node apps/api/src/stripe/seed-stripe-products.js
 * 
 * After running, update planPriceMapping.js with the generated price IDs
 */

async function createProducts() {
  const stripe = await getUncachableStripeClient();

  console.log('🎯 Creating Stripe products and prices for Pawtimation...\n');

  for (const [planCode, planConfig] of Object.entries(PLANS)) {
    console.log(`📦 Creating product for ${planConfig.name} plan...`);

    // Check if product already exists
    const existingProducts = await stripe.products.search({
      query: `name:'${planConfig.name}' AND metadata['plan_code']:'${planCode}'`,
    });

    let product;
    if (existingProducts.data.length > 0) {
      product = existingProducts.data[0];
      console.log(`   ✓ Product already exists: ${product.id}`);
    } else {
      // Create product
      product = await stripe.products.create({
        name: planConfig.name,
        description: planConfig.description,
        metadata: {
          plan_code: planCode,
          max_staff: planConfig.maxStaff?.toString() || 'unlimited',
          max_clients: planConfig.maxClients?.toString() || 'unlimited',
        },
      });
      console.log(`   ✓ Product created: ${product.id}`);
    }

    // Create monthly price
    const monthlyPrices = await stripe.prices.search({
      query: `product:'${product.id}' AND metadata['billing_cycle']:'MONTHLY'`,
    });

    if (monthlyPrices.data.length > 0) {
      console.log(`   ✓ Monthly price already exists: ${monthlyPrices.data[0].id}`);
    } else {
      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: planConfig.monthlyPrice * 100, // Convert to cents
        currency: 'gbp',
        recurring: { interval: 'month' },
        metadata: {
          plan_code: planCode,
          billing_cycle: 'MONTHLY',
        },
      });
      console.log(`   ✓ Monthly price created: ${monthlyPrice.id} (£${planConfig.monthlyPrice}/mo)`);
    }

    // Create annual price
    const annualPrices = await stripe.prices.search({
      query: `product:'${product.id}' AND metadata['billing_cycle']:'ANNUAL'`,
    });

    if (annualPrices.data.length > 0) {
      console.log(`   ✓ Annual price already exists: ${annualPrices.data[0].id}`);
    } else {
      const annualPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: planConfig.annualPrice * 100, // Convert to cents
        currency: 'gbp',
        recurring: { interval: 'year' },
        metadata: {
          plan_code: planCode,
          billing_cycle: 'ANNUAL',
        },
      });
      console.log(`   ✓ Annual price created: ${annualPrice.id} (£${planConfig.annualPrice}/yr)\n`);
    }
  }

  console.log('✅ All products and prices created successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Run this command to view all price IDs:');
  console.log('   node -e "import(\'./stripeClient.js\').then(async ({getUncachableStripeClient})=>{const s=await getUncachableStripeClient();const ps=await s.prices.list({limit:100});ps.data.forEach(p=>console.log(`${p.metadata.plan_code}_${p.metadata.billing_cycle}: ${p.id}`))})"');
  console.log('2. Update apps/api/src/stripe/planPriceMapping.js with the actual price IDs');
  console.log('3. Or set environment variables: STRIPE_PRICE_SOLO_MONTHLY, etc.');
}

createProducts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error creating products:', error);
    process.exit(1);
  });
