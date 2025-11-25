/**
 * Signed URL Generator
 * Creates time-limited, tamper-proof URLs for secure file downloads
 * 
 * Features:
 * - 5-minute expiration (configurable)
 * - HMAC-SHA256 signature to prevent tampering
 * - Business ID validation to prevent cross-business access
 * - Prevents URL sharing/link leaking
 */

import crypto from 'crypto';

const DEFAULT_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

// Get secret at runtime to ensure env vars are loaded
function getUrlSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required for signed URLs');
  }
  return secret;
}

/**
 * Generate a signed URL for file download
 * @param {string} fileKey - The file key in Object Storage
 * @param {string} businessId - The business ID that owns this file
 * @param {number} expiryMs - Optional custom expiry in milliseconds
 * @returns {string} - Signed token to append to download URL
 */
export function generateSignedToken(fileKey, businessId, expiryMs = DEFAULT_EXPIRY_MS) {
  const expiresAt = Date.now() + expiryMs;
  
  // Create payload
  const payload = {
    key: fileKey,
    bid: businessId,
    exp: expiresAt
  };

  // Encode payload as base64
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');

  // Create signature using HMAC-SHA256
  const signature = crypto
    .createHmac('sha256', getUrlSecret())
    .update(payloadBase64)
    .digest('base64url');

  // Combine payload and signature
  return `${payloadBase64}.${signature}`;
}

/**
 * Verify and decode a signed URL token
 * @param {string} token - The signed token from the URL
 * @returns {object|null} - Decoded payload if valid, null if invalid/expired
 */
export function verifySignedToken(token) {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }

    // Split token into payload and signature
    const parts = token.split('.');
    if (parts.length !== 2) {
      return null;
    }

    const [payloadBase64, providedSignature] = parts;

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', getUrlSecret())
      .update(payloadBase64)
      .digest('base64url');

    if (providedSignature !== expectedSignature) {
      console.warn('[SIGNED_URL] Invalid signature');
      return null;
    }

    // Decode payload
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString());

    // Check expiration
    if (Date.now() > payload.exp) {
      console.warn('[SIGNED_URL] Token expired');
      return null;
    }

    return payload;
  } catch (error) {
    console.error('[SIGNED_URL] Token verification error:', error.message);
    return null;
  }
}

/**
 * Generate a complete download URL with signed token
 * @param {string} fileKey - The file key in Object Storage
 * @param {string} businessId - The business ID that owns this file
 * @param {string} baseUrl - Base URL of the API (e.g., /api/media/download)
 * @returns {string} - Full URL with signed token
 */
export function generateDownloadUrl(fileKey, businessId, baseUrl = '/api/media/download') {
  const token = generateSignedToken(fileKey, businessId);
  return `${baseUrl}?token=${encodeURIComponent(token)}`;
}

/**
 * Verify download request has valid signed token and business access
 * @param {string} token - Token from query parameter
 * @param {string} requestedBusinessId - Business ID from authenticated user
 * @returns {object|null} - { fileKey, businessId } if valid, null otherwise
 */
export function verifyDownloadAccess(token, requestedBusinessId) {
  const payload = verifySignedToken(token);
  
  if (!payload) {
    return null;
  }

  // Verify business ID matches
  if (payload.bid !== requestedBusinessId) {
    console.warn('[SIGNED_URL] Business ID mismatch');
    return null;
  }

  return {
    fileKey: payload.key,
    businessId: payload.bid
  };
}
