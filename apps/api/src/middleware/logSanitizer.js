/**
 * Log Sanitization Middleware
 * Prevents sensitive data from being logged to console, files, or error tracking
 * 
 * Sanitizes:
 * - Email addresses (shows only first 3 chars + domain)
 * - Phone numbers
 * - Credit card patterns
 * - Bank account numbers
 * - File contents (base64, buffers)
 * - Password fields
 * - JWT tokens
 */

const SENSITIVE_FIELD_PATTERNS = {
  // Field names that should be redacted
  PASSWORD: /pass(word)?|pwd|secret|token|key|auth|credential|bearer/i,
  CARD: /card|cvv|cvc|pan/i,
  BANK: /account.*number|sort.*code|iban|swift|routing/i,
  
  // CRITICAL: Value patterns updated to match comprehensive sanitizeLogMessage patterns
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  PHONE: /\b(\+?44|0)\s?\d{4}\s?\d{6}\b/g,
  CARD_NUMBER: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  JWT: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/,
  // CRITICAL: Updated to include ALL base64 characters (/+=) for bearer tokens
  BEARER_TOKEN: /^Bearer\s+[A-Za-z0-9-_./+=]+$/i,
  // CRITICAL: Updated to include underscores, hyphens, AND base64 characters (/+=)
  API_KEY: /^[A-Za-z0-9_-/+=]{20,}$/,
  BASE64_LARGE: /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/
};

/**
 * Sanitize email address
 * Example: john.doe@example.com -> joh***@example.com
 */
function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') return email;
  
  const [local, domain] = email.split('@');
  if (!domain) return email;
  
  const visibleChars = Math.min(3, local.length);
  return `${local.substring(0, visibleChars)}***@${domain}`;
}

/**
 * Sanitize phone number
 * Example: +44 7123 456789 -> +44 ****6789
 */
function sanitizePhone(phone) {
  if (!phone || typeof phone !== 'string') return phone;
  return phone.replace(/\d(?=\d{4})/g, '*');
}

/**
 * Sanitize card number
 * Example: 4532 1234 5678 9010 -> **** **** **** 9010
 */
function sanitizeCardNumber(card) {
  if (!card || typeof card !== 'string') return card;
  return card.replace(/\d(?=\d{4})/g, '*');
}

/**
 * Check if a value is a large base64 string or buffer (likely file content)
 */
function isLargeData(value) {
  if (typeof value === 'string' && value.length > 1000) {
    return SENSITIVE_FIELD_PATTERNS.BASE64_LARGE.test(value);
  }
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
    return true;
  }
  return false;
}

/**
 * Recursively sanitize an object
 */
export function sanitizeObject(obj, depth = 0) {
  // Prevent infinite recursion
  if (depth > 10) return '[MAX_DEPTH]';
  
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle primitives
  if (typeof obj !== 'object') {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }

  // Handle buffers
  if (Buffer.isBuffer(obj) || obj instanceof Uint8Array) {
    return `[BUFFER:${obj.length} bytes]`;
  }

  // Handle regular objects
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const keyLower = key.toLowerCase();

    // Check if field name indicates sensitive data
    if (SENSITIVE_FIELD_PATTERNS.PASSWORD.test(keyLower)) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    if (SENSITIVE_FIELD_PATTERNS.CARD.test(keyLower)) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    if (SENSITIVE_FIELD_PATTERNS.BANK.test(keyLower)) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    // Check for large data (file contents)
    if (isLargeData(value)) {
      sanitized[key] = typeof value === 'string' 
        ? `[LARGE_DATA:${value.length} chars]`
        : `[BUFFER:${value.length} bytes]`;
      continue;
    }

    // Sanitize known patterns in string values
    if (typeof value === 'string') {
      // CRITICAL: Apply the same comprehensive sanitization as sanitizeLogMessage
      // This catches embedded tokens like "Failed with key sk_live_51ABC..."
      // Field-specific checks (email, phone) take precedence
      let sanitizedValue = value;

      // Field-specific sanitization (based on key name)
      if (key === 'email' || keyLower.includes('email')) {
        sanitizedValue = sanitizeEmail(value);
      }
      else if (keyLower.includes('phone') || keyLower.includes('mobile')) {
        sanitizedValue = sanitizePhone(value);
      }
      // CRITICAL: For all other strings, apply comprehensive token sanitization
      // This catches standalone AND embedded tokens (Bearer, JWT, API keys, etc.)
      else {
        sanitizedValue = sanitizeLogMessage(value);
      }

      sanitized[key] = sanitizedValue;
    }
    // Recursively sanitize nested objects
    else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value, depth + 1);
    }
    // Keep other values as-is
    else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitize log message string
 * Handles all sensitive patterns including Bearer tokens, JWTs, and API keys
 */
export function sanitizeLogMessage(message) {
  if (typeof message !== 'string') return message;

  let sanitized = message;

  // CRITICAL: Sanitize Bearer tokens (including base64-encoded tokens with /+=)
  // Examples: "Bearer abc123...", "Bearer dGVzdDo..." (base64)
  sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9-_./+=]+/gi, '[BEARER_TOKEN]');

  // Sanitize standalone JWTs (e.g., "eyJ0...")
  // Match JWT pattern: xxx.yyy.zzz where each part is base64url
  sanitized = sanitized.replace(/\b[A-Za-z0-9-_]{20,}\.[A-Za-z0-9-_]{20,}\.[A-Za-z0-9-_]{20,}\b/g, '[JWT]');

  // CRITICAL: Sanitize API keys with prefixes (both underscore AND hyphen delimited)
  // Examples: sk_live_..., xoxb-..., ghp_..., pk-test-...
  sanitized = sanitized.replace(/\b(sk|pk|rk|api|key|ghp|gho|github_pat|glpat|xoxb|xoxp)[-_][A-Za-z0-9_-]{20,}\b/gi, '[API_KEY]');
  
  // CRITICAL: Sanitize base64-encoded secrets (AWS keys, Firebase keys, HTTP Basic auth, etc.)
  // These contain /, +, = characters and can be as short as 20 chars (Basic auth)
  sanitized = sanitized.replace(/\b[A-Za-z0-9/+]{20,}={0,2}\b/g, (match) => {
    // Only sanitize if it contains base64 special chars or padding
    if (!/[/+=]/.test(match)) {
      return match; // Will be caught by generic token regex below
    }
    return `[BASE64_SECRET:${match.substring(0, 8)}...]`;
  });
  
  // CRITICAL: Sanitize generic long tokens (30+ chars including underscores/hyphens/base64 chars)
  // This includes session IDs, API tokens, base64-encoded secrets, etc.
  sanitized = sanitized.replace(/\b[A-Za-z0-9_-/+=]{30,}\b/g, (match) => {
    // SECURITY: Only skip UUIDs (standard format with specific dash positions)
    // e.g., 550e8400-e29b-41d4-a716-446655440000
    if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(match)) {
      return match; // Standard UUID format, safe to keep
    }
    return `[TOKEN:${match.substring(0, 8)}...]`;
  });

  // Sanitize emails in freeform text
  sanitized = sanitized.replace(SENSITIVE_FIELD_PATTERNS.EMAIL, (match) => sanitizeEmail(match));

  // Sanitize phone numbers in freeform text
  sanitized = sanitized.replace(SENSITIVE_FIELD_PATTERNS.PHONE, (match) => sanitizePhone(match));

  // Sanitize card numbers in freeform text
  sanitized = sanitized.replace(SENSITIVE_FIELD_PATTERNS.CARD_NUMBER, (match) => sanitizeCardNumber(match));

  return sanitized;
}

/**
 * Fastify plugin for automatic log sanitization
 */
export async function logSanitizerPlugin(fastify, options) {
  // Intercept Fastify's logger (including child loggers)
  const originalLog = fastify.log;
  const originalChild = originalLog.child.bind(originalLog);
  
  // Wrap main logger methods
  ['info', 'warn', 'error', 'debug', 'trace'].forEach(level => {
    const originalMethod = originalLog[level].bind(originalLog);
    
    originalLog[level] = function(obj, msg, ...args) {
      try {
        // CRITICAL: Handle string-only logs (e.g., log.info('Bearer token'))
        if (typeof obj === 'string' && msg === undefined) {
          // First arg is the message, sanitize it
          obj = sanitizeLogMessage(obj);
        }
        // CRITICAL: Unconditionally sanitize objects (even with message present)
        // e.g., log.info({token: 'Bearer...'}, 'processing payment')
        else if (typeof obj === 'object' && obj !== null) {
          obj = sanitizeObject(obj);
        }
        
        // CRITICAL: Sanitize message parameter if present
        if (typeof msg === 'string') {
          msg = sanitizeLogMessage(msg);
        }
        
        // CRITICAL: Sanitize variadic args (e.g., log.info('Bearer %s', token))
        const sanitizedArgs = args.map(arg => {
          if (typeof arg === 'object' && arg !== null) {
            return sanitizeObject(arg);
          }
          if (typeof arg === 'string') {
            return sanitizeLogMessage(arg);
          }
          return arg;
        });
        
        return originalMethod(obj, msg, ...sanitizedArgs);
      } catch (error) {
        // Defensive: If sanitization fails, log the error but don't break logging
        console.error('[LOG_SANITIZER] Sanitization failed:', error.message);
        return originalMethod(obj, msg, ...args);
      }
    };
  });

  // Wrap child logger creation to inherit sanitization
  originalLog.child = function(bindings, options) {
    const childLogger = originalChild(bindings, options);
    
    // Apply sanitization to child logger methods
    ['info', 'warn', 'error', 'debug', 'trace'].forEach(level => {
      const originalChildMethod = childLogger[level].bind(childLogger);
      
      childLogger[level] = function(obj, msg, ...args) {
        try {
          // CRITICAL: Handle string-only logs for child loggers too
          if (typeof obj === 'string' && msg === undefined) {
            obj = sanitizeLogMessage(obj);
          }
          // CRITICAL: Unconditionally sanitize objects (even with message present)
          else if (typeof obj === 'object' && obj !== null) {
            obj = sanitizeObject(obj);
          }
          
          // CRITICAL: Sanitize message parameter if present
          if (typeof msg === 'string') {
            msg = sanitizeLogMessage(msg);
          }
          
          // CRITICAL: Sanitize variadic args for child loggers too
          const sanitizedArgs = args.map(arg => {
            if (typeof arg === 'object' && arg !== null) {
              return sanitizeObject(arg);
            }
            if (typeof arg === 'string') {
              return sanitizeLogMessage(arg);
            }
            return arg;
          });
          
          return originalChildMethod(obj, msg, ...sanitizedArgs);
        } catch (error) {
          console.error('[LOG_SANITIZER] Child sanitization failed:', error.message);
          return originalChildMethod(obj, msg, ...args);
        }
      };
    });
    
    return childLogger;
  };

  // Also wrap console methods for non-Fastify logs
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error
  };

  ['log', 'info', 'warn', 'error'].forEach(method => {
    console[method] = function(...args) {
      try {
        const sanitizedArgs = args.map(arg => {
          if (typeof arg === 'object' && arg !== null) {
            return sanitizeObject(arg);
          }
          if (typeof arg === 'string') {
            return sanitizeLogMessage(arg);
          }
          return arg;
        });
        
        return originalConsole[method](...sanitizedArgs);
      } catch (error) {
        // Fallback to original console if sanitization fails
        return originalConsole[method](...args);
      }
    };
  });
}

/**
 * Utility for manual log sanitization
 * Use this when logging outside of Fastify context
 */
export function sanitizeLog(...args) {
  return args.map(arg => {
    if (typeof arg === 'object' && arg !== null) {
      return sanitizeObject(arg);
    }
    if (typeof arg === 'string') {
      return sanitizeLogMessage(arg);
    }
    return arg;
  });
}
