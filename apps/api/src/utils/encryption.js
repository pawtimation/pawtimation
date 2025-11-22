/**
 * Field-Level Encryption Utility
 * Uses AES-256-GCM for encrypting sensitive PII data
 * 
 * Encrypts:
 * - Bank account details
 * - Addresses
 * - Phone numbers
 * - Other sensitive personal information
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * Get encryption key from environment
 * Key should be 32 bytes (256 bits) for AES-256
 */
function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable not set');
  }
  
  // Ensure key is exactly 32 bytes
  if (Buffer.from(key, 'hex').length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
  }
  
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt sensitive data
 * Returns base64-encoded string: iv:authTag:encryptedData
 * 
 * @param {string} plaintext - Data to encrypt
 * @returns {string} Encrypted data with IV and auth tag
 */
export function encrypt(plaintext) {
  if (!plaintext) return null;
  
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    // Format: iv:authTag:encryptedData (all base64)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  } catch (error) {
    console.error('[ENCRYPTION] Failed to encrypt data:', error.message);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt sensitive data
 * 
 * @param {string} encryptedData - Encrypted string (iv:authTag:data)
 * @returns {string} Decrypted plaintext
 */
export function decrypt(encryptedData) {
  if (!encryptedData) return null;
  
  try {
    const key = getEncryptionKey();
    const parts = encryptedData.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('[ENCRYPTION] Failed to decrypt data:', error.message);
    throw new Error('Decryption failed');
  }
}

/**
 * Check if a string is encrypted (has our format)
 * 
 * @param {string} data - Data to check
 * @returns {boolean} True if data appears to be encrypted
 */
export function isEncrypted(data) {
  if (!data || typeof data !== 'string') return false;
  
  const parts = data.split(':');
  return parts.length === 3 && 
         parts.every(part => /^[A-Za-z0-9+/]+=*$/.test(part));
}

/**
 * Encrypt object fields selectively
 * 
 * @param {Object} obj - Object with fields to encrypt
 * @param {string[]} fields - Array of field names to encrypt
 * @returns {Object} Object with encrypted fields
 */
export function encryptFields(obj, fields) {
  if (!obj) return obj;
  
  const encrypted = { ...obj };
  
  for (const field of fields) {
    if (encrypted[field] && !isEncrypted(encrypted[field])) {
      encrypted[field] = encrypt(encrypted[field]);
    }
  }
  
  return encrypted;
}

/**
 * Decrypt object fields selectively
 * 
 * @param {Object} obj - Object with encrypted fields
 * @param {string[]} fields - Array of field names to decrypt
 * @returns {Object} Object with decrypted fields
 */
export function decryptFields(obj, fields) {
  if (!obj) return obj;
  
  const decrypted = { ...obj };
  
  for (const field of fields) {
    if (decrypted[field] && isEncrypted(decrypted[field])) {
      try {
        decrypted[field] = decrypt(decrypted[field]);
      } catch (error) {
        console.error(`[ENCRYPTION] Failed to decrypt field ${field}:`, error.message);
      }
    }
  }
  
  return decrypted;
}

/**
 * Generate a secure encryption key (for initial setup)
 * Returns 32-byte (256-bit) key as hex string
 */
export function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}
