/**
 * Security Headers Middleware
 * Implements comprehensive security headers to protect against common web vulnerabilities
 * 
 * Headers implemented:
 * - X-Content-Type-Options: Prevents MIME-sniffing attacks
 * - Content-Security-Policy: Restricts resource loading to prevent XSS
 * - X-Frame-Options: Prevents clickjacking attacks
 * - Strict-Transport-Security: Forces HTTPS connections
 * - Cross-Origin-Opener-Policy: Isolates browsing context
 * - Cross-Origin-Embedder-Policy: Requires explicit corp for cross-origin resources
 * - X-DNS-Prefetch-Control: Controls DNS prefetching
 * - Referrer-Policy: Controls referrer information
 */

export async function securityHeadersPlugin(fastify, options) {
  const isProduction = process.env.NODE_ENV === 'production';

  fastify.addHook('onSend', async (request, reply) => {
    // Prevent MIME-sniffing attacks
    reply.header('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking attacks (SAMEORIGIN allows Replit preview)
    reply.header('X-Frame-Options', 'SAMEORIGIN');

    // Control DNS prefetching
    reply.header('X-DNS-Prefetch-Control', 'off');

    // Control referrer information (strict for privacy)
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Strict Transport Security (HSTS) - Force HTTPS
    if (isProduction) {
      // 1 year max-age with includeSubDomains and preload
      reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    // Cross-Origin-Opener-Policy - Isolate browsing context
    reply.header('Cross-Origin-Opener-Policy', 'same-origin');

    // Cross-Origin-Embedder-Policy - Require CORP for cross-origin resources
    reply.header('Cross-Origin-Embedder-Policy', 'require-corp');

    // Content Security Policy - Comprehensive protection against XSS
    // Balanced policy: strict security while allowing Stripe, maps, and Replit preview
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com", // React/Vite + Stripe
      "style-src 'self' 'unsafe-inline'", // Tailwind CSS
      "img-src 'self' data: https:", // Images from HTTPS sources
      "font-src 'self' data:",
      "connect-src 'self' https://api.stripe.com https://checkout.stripe.com https://api.maptiler.com https://api.openrouteservice.org", // API calls
      "frame-src 'self' https://checkout.stripe.com https://js.stripe.com", // Stripe embeds
      "object-src 'none'", // Disable plugins
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'", // Allow embedding in same origin (Replit preview)
      "upgrade-insecure-requests" // Auto-upgrade HTTP to HTTPS
    ];

    reply.header('Content-Security-Policy', cspDirectives.join('; '));

    // Permissions Policy (formerly Feature-Policy)
    // Disable unnecessary browser features while allowing necessary ones
    const permissionsPolicy = [
      'geolocation=(self)', // Allow geolocation for address lookup and maps
      'camera=()',
      'microphone=()',
      'payment=(self)', // Allow payment for Stripe
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'speaker=()',
      'vibrate=()',
      'fullscreen=(self)',
      'sync-xhr=()'
    ];

    reply.header('Permissions-Policy', permissionsPolicy.join(', '));

    return reply;
  });
}
