import { errorTrackingService } from '../services/errorTrackingService.js';

export async function setupErrorTracking(fastify) {
  fastify.setErrorHandler(async (error, request, reply) => {
    let businessId = null;
    let userId = null;
    let userRole = null;

    if (request.user) {
      userId = request.user.id;
      businessId = request.user.businessId;
      userRole = request.user.role;
    } else if (request.businessId) {
      businessId = request.businessId;
    }

    const statusCode = reply.statusCode || error.statusCode || 500;

    if (statusCode >= 500) {
      errorTrackingService.recordError({
        error,
        request,
        reply,
        businessId,
        userId,
        userRole
      }).catch(trackingError => {
        console.error('[ErrorTracking] Non-blocking error tracking failed:', trackingError.message);
      });
    }

    if (statusCode >= 500) {
      console.error('[ERROR]', error);
    }

    let message = 'Internal server error';
    if (statusCode < 500) {
      message = error.message || message;
    }

    return reply.status(statusCode).send({
      error: message,
      statusCode
    });
  });
}
