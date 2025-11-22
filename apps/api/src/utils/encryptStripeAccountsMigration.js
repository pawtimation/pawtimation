/**
 * One-time Migration: Encrypt Existing Stripe Connected Account IDs
 * 
 * SCOPE: Encrypts only truly sensitive financial data (Stripe payout account IDs)
 * APPROACH: Dual-column - keeps plaintext for compatibility while adding encrypted version
 * 
 * Usage: node apps/api/src/utils/encryptStripeAccountsMigration.js
 */

import { db } from '../db.js';
import { businesses } from '../../../../shared/schema.js';
import { encrypt } from './encryption.js';
import { eq } from 'drizzle-orm';

async function migrateStripeAccounts() {
  console.log('[MIGRATION] Starting Stripe connected account ID encryption...');
  
  try {
    // Find businesses with Stripe accounts that haven't been encrypted yet
    const businessesWithStripe = await db
      .select()
      .from(businesses)
      .where(
        eq(businesses.stripeConnectedAccountIdEncrypted, null)
      );
    
    const toEncrypt = businessesWithStripe.filter(b => b.stripeConnectedAccountId);
    
    if (toEncrypt.length === 0) {
      console.log('[MIGRATION] ✓ No unencrypted Stripe accounts found. Migration complete.');
      return { success: true, encrypted: 0, skipped: 0 };
    }
    
    console.log(`[MIGRATION] Found ${toEncrypt.length} Stripe accounts to encrypt`);
    
    let encrypted = 0;
    let failed = 0;
    
    for (const business of toEncrypt) {
      try {
        // Encrypt the Stripe account ID
        const encryptedValue = encrypt(business.stripeConnectedAccountId);
        
        // Verify encryption worked
        if (!encryptedValue) {
          console.error(`[MIGRATION] Failed to encrypt for business ${business.id}`);
          failed++;
          continue;
        }
        
        // Store encrypted value
        await db
          .update(businesses)
          .set({ stripeConnectedAccountIdEncrypted: encryptedValue })
          .where(eq(businesses.id, business.id));
        
        encrypted++;
        
        // Log progress every 10 records
        if (encrypted % 10 === 0) {
          console.log(`[MIGRATION] Progress: ${encrypted}/${toEncrypt.length} encrypted`);
        }
        
      } catch (error) {
        console.error(`[MIGRATION] Error encrypting business ${business.id}:`, error.message);
        failed++;
      }
    }
    
    console.log('[MIGRATION] ✓ Migration complete');
    console.log(`[MIGRATION]   - Encrypted: ${encrypted}`);
    console.log(`[MIGRATION]   - Failed: ${failed}`);
    console.log(`[MIGRATION]   - Total: ${toEncrypt.length}`);
    
    return {
      success: failed === 0,
      encrypted,
      failed,
      total: toEncrypt.length
    };
    
  } catch (error) {
    console.error('[MIGRATION] ❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateStripeAccounts()
    .then((result) => {
      if (result.success) {
        console.log('[MIGRATION] ✓ All Stripe accounts encrypted successfully');
        process.exit(0);
      } else {
        console.error('[MIGRATION] ⚠️  Some encryptions failed');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('[MIGRATION] ❌ Fatal error:', error);
      process.exit(1);
    });
}

export { migrateStripeAccounts };
