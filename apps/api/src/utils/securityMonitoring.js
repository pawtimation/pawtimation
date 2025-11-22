/**
 * Security Monitoring and Alerting System
 * Tracks security events and triggers alerts for suspicious activity
 */

import { logSystem } from '../storage.js';

// In-memory tracking for rate limiting detection
const failedLoginAttempts = new Map(); // IP -> { count, firstAttempt, lastAttempt }
const suspiciousFileAccess = new Map(); // userId -> { count, lastAccess }
const paymentFailures = new Map(); // businessId -> { count, lastFailure }

// Thresholds for alerting
const THRESHOLDS = {
  FAILED_LOGIN_ATTEMPTS: 5, // Alert after 5 failed logins from same IP
  FAILED_LOGIN_WINDOW: 15 * 60 * 1000, // Within 15 minutes
  SUSPICIOUS_FILE_ACCESS: 50, // Alert after 50 file downloads in short time
  FILE_ACCESS_WINDOW: 5 * 60 * 1000, // Within 5 minutes
  PAYMENT_FAILURES: 3, // Alert after 3 payment failures
  PAYMENT_FAILURE_WINDOW: 24 * 60 * 60 * 1000, // Within 24 hours
};

/**
 * Track failed login attempt
 * Returns true if threshold exceeded (alert should be triggered)
 */
export function trackFailedLogin(ip, email) {
  const now = Date.now();
  const key = ip;
  
  const record = failedLoginAttempts.get(key) || {
    count: 0,
    firstAttempt: now,
    lastAttempt: now,
    attempts: []
  };
  
  // Reset if outside time window
  if (now - record.firstAttempt > THRESHOLDS.FAILED_LOGIN_WINDOW) {
    record.count = 1;
    record.firstAttempt = now;
    record.attempts = [{ email, timestamp: now }];
  } else {
    record.count++;
    record.attempts.push({ email, timestamp: now });
  }
  
  record.lastAttempt = now;
  failedLoginAttempts.set(key, record);
  
  // Log to database
  logSystem({
    businessId: null,
    logType: 'SECURITY_EVENT',
    severity: 'WARN',
    message: `Failed login attempt for ${email} from IP ${ip}`,
    metadata: {
      ip,
      email,
      attemptCount: record.count,
      timestamp: new Date().toISOString()
    }
  }).catch(err => console.error('[MONITORING] Failed to log failed login:', err));
  
  // Check threshold
  if (record.count >= THRESHOLDS.FAILED_LOGIN_ATTEMPTS) {
    console.error(`[SECURITY_ALERT] ${record.count} failed login attempts from IP ${ip} for emails:`, 
      record.attempts.map(a => a.email).join(', '));
    return true;
  }
  
  return false;
}

/**
 * Clear failed login tracking (e.g., after successful login)
 */
export function clearFailedLogins(ip) {
  failedLoginAttempts.delete(ip);
}

/**
 * Track file access for suspicious patterns
 * Returns true if threshold exceeded
 */
export function trackFileAccess(userId, fileKey) {
  const now = Date.now();
  const record = suspiciousFileAccess.get(userId) || {
    count: 0,
    lastAccess: now,
    files: []
  };
  
  // Reset if outside time window
  if (now - record.lastAccess > THRESHOLDS.FILE_ACCESS_WINDOW) {
    record.count = 1;
    record.files = [{ fileKey, timestamp: now }];
  } else {
    record.count++;
    record.files.push({ fileKey, timestamp: now });
  }
  
  record.lastAccess = now;
  suspiciousFileAccess.set(userId, record);
  
  // Check threshold
  if (record.count >= THRESHOLDS.SUSPICIOUS_FILE_ACCESS) {
    console.warn(`[SECURITY_ALERT] Suspicious file access pattern: User ${userId} accessed ${record.count} files in ${THRESHOLDS.FILE_ACCESS_WINDOW / 1000}s`);
    return true;
  }
  
  return false;
}

/**
 * Track payment failure
 * Returns true if threshold exceeded
 */
export function trackPaymentFailure(businessId, reason) {
  const now = Date.now();
  const record = paymentFailures.get(businessId) || {
    count: 0,
    lastFailure: now,
    failures: []
  };
  
  // Reset if outside time window
  if (now - record.lastFailure > THRESHOLDS.PAYMENT_FAILURE_WINDOW) {
    record.count = 1;
    record.failures = [{ reason, timestamp: now }];
  } else {
    record.count++;
    record.failures.push({ reason, timestamp: now });
  }
  
  record.lastFailure = now;
  paymentFailures.set(businessId, record);
  
  // Log to database
  logSystem({
    businessId,
    logType: 'PAYMENT_FAILURE',
    severity: 'ERROR',
    message: `Payment failure: ${reason}`,
    metadata: {
      failureCount: record.count,
      reason,
      timestamp: new Date().toISOString()
    }
  }).catch(err => console.error('[MONITORING] Failed to log payment failure:', err));
  
  // Check threshold
  if (record.count >= THRESHOLDS.PAYMENT_FAILURES) {
    console.error(`[SECURITY_ALERT] ${record.count} payment failures for business ${businessId} in 24h`);
    return true;
  }
  
  return false;
}

/**
 * Track automation job failure
 */
export function trackAutomationFailure(jobName, error) {
  console.error(`[AUTOMATION_ALERT] ${jobName} failed:`, error);
  
  // Log to database
  logSystem({
    businessId: null,
    logType: 'AUTOMATION_FAILURE',
    severity: 'ERROR',
    message: `Automation job failed: ${jobName}`,
    metadata: {
      jobName,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }
  }).catch(err => console.error('[MONITORING] Failed to log automation failure:', err));
}

/**
 * Get security summary (for dashboard/admin view)
 */
export function getSecuritySummary() {
  const now = Date.now();
  
  return {
    failedLogins: {
      active: Array.from(failedLoginAttempts.entries())
        .filter(([_, record]) => now - record.lastAttempt < THRESHOLDS.FAILED_LOGIN_WINDOW)
        .map(([ip, record]) => ({
          ip,
          attempts: record.count,
          lastAttempt: new Date(record.lastAttempt).toISOString()
        }))
    },
    suspiciousFileAccess: {
      active: Array.from(suspiciousFileAccess.entries())
        .filter(([_, record]) => now - record.lastAccess < THRESHOLDS.FILE_ACCESS_WINDOW)
        .map(([userId, record]) => ({
          userId,
          accessCount: record.count,
          lastAccess: new Date(record.lastAccess).toISOString()
        }))
    },
    paymentFailures: {
      active: Array.from(paymentFailures.entries())
        .filter(([_, record]) => now - record.lastFailure < THRESHOLDS.PAYMENT_FAILURE_WINDOW)
        .map(([businessId, record]) => ({
          businessId,
          failureCount: record.count,
          lastFailure: new Date(record.lastFailure).toISOString()
        }))
    }
  };
}

/**
 * Cleanup old tracking data (run periodically)
 */
export function cleanupMonitoringData() {
  const now = Date.now();
  
  // Clean failed logins
  for (const [key, record] of failedLoginAttempts.entries()) {
    if (now - record.lastAttempt > THRESHOLDS.FAILED_LOGIN_WINDOW) {
      failedLoginAttempts.delete(key);
    }
  }
  
  // Clean file access tracking
  for (const [key, record] of suspiciousFileAccess.entries()) {
    if (now - record.lastAccess > THRESHOLDS.FILE_ACCESS_WINDOW) {
      suspiciousFileAccess.delete(key);
    }
  }
  
  // Clean payment failures
  for (const [key, record] of paymentFailures.entries()) {
    if (now - record.lastFailure > THRESHOLDS.PAYMENT_FAILURE_WINDOW) {
      paymentFailures.delete(key);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupMonitoringData, 60 * 60 * 1000);
