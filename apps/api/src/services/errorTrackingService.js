import crypto from 'crypto';
import { storage } from '../storage.js';
import { sanitizeLogMessage } from '../middleware/logSanitizer.js';

const LRU_CACHE_SIZE = 1000;
const LRU_CACHE_TTL_MS = 60000; // 1 minute

class ErrorTrackingService {
  constructor() {
    this.recentErrorsCache = new Map();
    this.cleanupInterval = setInterval(() => this.cleanupCache(), 60000);
  }

  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.recentErrorsCache.entries()) {
      if (now - value.timestamp > LRU_CACHE_TTL_MS) {
        this.recentErrorsCache.delete(key);
      }
    }
    
    if (this.recentErrorsCache.size > LRU_CACHE_SIZE) {
      const entriesToDelete = this.recentErrorsCache.size - LRU_CACHE_SIZE;
      const keysToDelete = Array.from(this.recentErrorsCache.keys()).slice(0, entriesToDelete);
      keysToDelete.forEach(key => this.recentErrorsCache.delete(key));
    }
  }

  generateErrorHash(sanitizedError, endpoint, method) {
    const errorString = `${endpoint}:${method}:${sanitizedError.message}:${sanitizedError.type || 'unknown'}`;
    return crypto.createHash('sha256').update(errorString).digest('hex').substring(0, 16);
  }

  sanitizeError(error) {
    const sanitized = {
      message: sanitizeLogMessage(error.message || 'Unknown error'),
      name: error.name || 'Error',
      type: error.constructor?.name || 'Error',
      code: error.code
    };

    if (error.stack) {
      const stackLines = error.stack.split('\n');
      const sanitizedStack = stackLines.map(line => sanitizeLogMessage(line)).slice(0, 10);
      sanitized.stack = sanitizedStack.join('\n');
    }

    return sanitized;
  }

  extractEndpoint(request) {
    let endpoint = request.routeOptions?.url || request.url || 'unknown';
    
    endpoint = endpoint.replace(/\/[a-f0-9-]{20,}/gi, '/:id');
    endpoint = endpoint.replace(/\/u_[a-zA-Z0-9-_]+/g, '/:userId');
    endpoint = endpoint.replace(/\/c_[a-zA-Z0-9-_]+/g, '/:clientId');
    endpoint = endpoint.replace(/\/biz_[a-zA-Z0-9-_]+/g, '/:businessId');
    endpoint = endpoint.replace(/\/svc_[a-zA-Z0-9-_]+/g, '/:serviceId');
    endpoint = endpoint.replace(/\/job_[a-zA-Z0-9-_]+/g, '/:jobId');
    endpoint = endpoint.replace(/\/inv_[a-zA-Z0-9-_]+/g, '/:invoiceId');
    endpoint = endpoint.replace(/\/dog_[a-zA-Z0-9-_]+/g, '/:dogId');
    
    endpoint = endpoint.split('?')[0];
    
    return endpoint;
  }

  shouldLogError(statusCode, error) {
    if (statusCode < 500) {
      return false;
    }

    if (error.validation) {
      return false;
    }

    if (error.statusCode && error.statusCode < 500) {
      return false;
    }

    const ignoredErrors = [
      'Not Found',
      'not found',
      'Unauthorized',
      'Forbidden',
      'Bad Request',
      'ValidationError'
    ];

    if (ignoredErrors.some(msg => error.message?.includes(msg))) {
      return false;
    }

    return true;
  }

  async recordError({ error, request, reply, businessId, userId, userRole }) {
    try {
      const statusCode = reply?.statusCode || error.statusCode || 500;

      if (!this.shouldLogError(statusCode, error)) {
        return null;
      }

      const sanitizedError = this.sanitizeError(error);
      const endpoint = this.extractEndpoint(request);
      const method = request.method || 'UNKNOWN';
      const errorHash = this.generateErrorHash(sanitizedError, endpoint, method);

      const cacheKey = errorHash;
      if (this.recentErrorsCache.has(cacheKey)) {
        const cachedEntry = this.recentErrorsCache.get(cacheKey);
        if (Date.now() - cachedEntry.timestamp < 5000) {
          return null;
        }
      }

      this.recentErrorsCache.set(cacheKey, { timestamp: Date.now() });

      const existingError = await storage.findErrorEventByHash(errorHash);

      if (existingError) {
        return await storage.incrementErrorEventCount(existingError.id, new Date());
      }

      const requestContext = {
        headers: {
          userAgent: request.headers['user-agent'],
          referer: request.headers['referer'],
          origin: request.headers['origin']
        },
        query: request.query ? sanitizeLogMessage(JSON.stringify(request.query)) : undefined,
        ip: request.ip
      };

      const errorEvent = {
        errorHash,
        endpoint,
        method,
        statusCode,
        businessId: businessId || null,
        userId: userId || null,
        userRole: userRole || null,
        errorMessage: sanitizedError.message,
        stackTrace: sanitizedError.stack || null,
        requestContext,
        dedupeCount: 1,
        firstOccurredAt: new Date(),
        lastOccurredAt: new Date()
      };

      return await storage.recordErrorEvent(errorEvent);
    } catch (trackingError) {
      console.error('[ErrorTracking] Failed to record error:', trackingError);
      return null;
    }
  }

  async getErrorHeatmap(filters = {}) {
    const daysAgo = filters.daysAgo || 7;
    
    const [topErrors, byEndpoint, byBusiness, byUserRole] = await Promise.all([
      storage.getTopErrors(filters.limit || 10, daysAgo),
      storage.getErrorEventsByEndpoint(daysAgo),
      storage.getErrorEventsByBusiness(daysAgo),
      storage.getErrorEventsByUserRole(daysAgo)
    ]);

    const totalErrors = topErrors.reduce((sum, e) => sum + e.dedupeCount, 0);

    return {
      summary: {
        totalErrors,
        uniqueErrors: topErrors.length,
        period: `${daysAgo} days`,
        mostAffectedBusiness: byBusiness[0]?.businessId || null
      },
      topErrors: topErrors.map(e => ({
        id: e.id,
        endpoint: e.endpoint,
        method: e.method,
        errorMessage: e.errorMessage,
        occurrences: e.dedupeCount,
        lastOccurred: e.lastOccurredAt,
        firstOccurred: e.firstOccurredAt,
        statusCode: e.statusCode
      })),
      byEndpoint: byEndpoint.map(e => ({
        endpoint: e.endpoint,
        method: e.method,
        count: e.count,
        uniqueErrors: e.uniqueErrors
      })),
      byBusiness: byBusiness.map(b => ({
        businessId: b.businessId,
        count: b.count,
        uniqueErrors: b.uniqueErrors
      })),
      byUserRole: byUserRole.map(r => ({
        userRole: r.userRole || 'UNAUTHENTICATED',
        count: r.count,
        uniqueErrors: r.uniqueErrors
      }))
    };
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

export const errorTrackingService = new ErrorTrackingService();
