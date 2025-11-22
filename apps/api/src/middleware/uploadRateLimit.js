/**
 * Rate Limiting Configuration for File Uploads/Downloads
 * Prevents abuse and DoS attacks on file endpoints
 * 
 * NOTE: These configs should be applied to specific routes, not registered globally
 * Usage: fastify.post('/upload', { config: { rateLimit: uploadRateLimitConfig } }, handler)
 */

/**
 * Rate limit configuration for file uploads
 * More restrictive than standard API endpoints due to resource intensity
 */
export const uploadRateLimitConfig = {
  max: 20, // 20 uploads per window
  timeWindow: '15 minutes',
  
  keyGenerator: (request) => {
    // Use IP address as key
    return request.ip || request.headers['x-forwarded-for'] || 'unknown';
  },
  
  errorResponseBuilder: (request, context) => {
    return {
      error: 'Too Many Requests',
      message: 'Upload rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(context.after / 1000)
    };
  },

  onExceeding: (request, key) => {
    // Log excessive upload attempts
    console.warn(`[RATE_LIMIT] Upload limit exceeded for IP: ${key}`);
  }
};

/**
 * Rate limit configuration for file downloads
 * Prevents bandwidth abuse
 */
export const downloadRateLimitConfig = {
  max: 100, // 100 downloads per window
  timeWindow: '15 minutes',
  
  keyGenerator: (request) => {
    return request.ip || request.headers['x-forwarded-for'] || 'unknown';
  },
  
  errorResponseBuilder: (request, context) => {
    return {
      error: 'Too Many Requests',
      message: 'Download rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(context.after / 1000)
    };
  }
};
