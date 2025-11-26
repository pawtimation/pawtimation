import Stripe from 'stripe';

let connectionSettings = null;
let credentialsCache = null;

async function getCredentials() {
  // Return cached credentials if available
  if (credentialsCache) {
    return credentialsCache;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  if (!hostname) {
    throw new Error('REPLIT_CONNECTORS_HOSTNAME not available');
  }

  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  const connectorName = 'stripe';
  const isProduction = process.env.REPLIT_DEPLOYMENT === '1';
  const targetEnvironment = isProduction ? 'production' : 'development';

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set('include_secrets', 'true');
  url.searchParams.set('connector_names', connectorName);
  url.searchParams.set('environment', targetEnvironment);

  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'X_REPLIT_TOKEN': xReplitToken
    }
  });

  if (!response.ok) {
    throw new Error(`Stripe connector API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  connectionSettings = data.items?.[0];

  if (!connectionSettings || (!connectionSettings.settings?.publishable || !connectionSettings.settings?.secret)) {
    throw new Error(`Stripe ${targetEnvironment} connection not found or incomplete`);
  }

  // Validate keys don't have invalid characters
  const secretKey = connectionSettings.settings.secret;
  const publishableKey = connectionSettings.settings.publishable;

  if (!secretKey || typeof secretKey !== 'string' || !/^sk_(test|live)_[a-zA-Z0-9]+$/.test(secretKey)) {
    throw new Error('Invalid Stripe secret key format');
  }

  if (!publishableKey || typeof publishableKey !== 'string' || !/^pk_(test|live)_[a-zA-Z0-9]+$/.test(publishableKey)) {
    throw new Error('Invalid Stripe publishable key format');
  }

  credentialsCache = {
    publishableKey,
    secretKey,
  };

  return credentialsCache;
}

// WARNING: Never cache this client.
// Always call this function to get a fresh client.
export async function getUncachableStripeClient() {
  const { secretKey } = await getCredentials();

  return new Stripe(secretKey, {
    apiVersion: '2025-08-27.basil',
  });
}

// Get publishable key for client-side operations
export async function getStripePublishableKey() {
  const { publishableKey } = await getCredentials();
  return publishableKey;
}

// Get secret key for server-side operations
export async function getStripeSecretKey() {
  const { secretKey } = await getCredentials();
  return secretKey;
}

// StripeSync singleton for webhook processing and data sync
let stripeSync = null;

export async function getStripeSync() {
  if (!stripeSync) {
    const { StripeSync } = await import('stripe-replit-sync');
    const secretKey = await getStripeSecretKey();

    stripeSync = new StripeSync({
      poolConfig: {
        connectionString: process.env.DATABASE_URL,
        max: 2,
      },
      stripeSecretKey: secretKey,
    });
  }
  return stripeSync;
}
