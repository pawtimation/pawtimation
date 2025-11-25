/**
 * Rate Limiting Configuration for File Uploads/Downloads
 * Prevents abuse and DoS attacks on file endpoints
 * 
 * NOTE: These configs should be applied to specific routes, not registered globally
 * Usage: fastify.post('/upload', { config: { rateLimit: uploadRateLimitConfig } }, handler)
 */

/**
 * Rate limit configuration for file uploads
 * Balanced to allow legitimate business use while preventing abuse
 */
export const uploadRateLimitConfig = {
  max: 100, // 100 uploads per window - allows batch uploads for business setup
  timeWindow: '15 minutes',
  
  keyGenerator: (request) => {
    // Use business ID + user ID if available for more granular limiting
    // This allows different businesses/users to upload independently
    const businessId = request.user?.businessId || request.clientUser?.businessId;
    const userId = request.user?.userId || request.clientUser?.id;
    
    if (businessId && userId) {
      return `biz:${businessId}:user:${userId}`;
    }
    
    // Fall back to IP for unauthenticated requests
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
    console.warn(`[RATE_LIMIT] Upload limit exceeded for key: ${key}`);
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
