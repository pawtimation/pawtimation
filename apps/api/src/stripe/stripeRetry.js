import { repo } from '../repo.js';

export class StripeRetryUtil {
  static async withRetry(operation, operationName, metadata = {}, options = {}) {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      timeoutMs = 30000
    } = options;

    let lastError = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Log attempt
        if (attempt > 0) {
          console.log(`[Stripe Retry] Attempt ${attempt + 1}/${maxRetries + 1} for ${operationName}`);
        }

        // Add timeout to prevent hanging requests
        const result = await Promise.race([
          operation(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Stripe API timeout')), timeoutMs)
          )
        ]);

        // Log success if retry was needed (non-blocking)
        if (attempt > 0) {
          try {
            await repo.createSystemLog({
              businessId: metadata.businessId || null,
              logType: 'STRIPE',
              severity: 'INFO',
              message: `Stripe operation succeeded after ${attempt} retries`,
              metadata: {
                operation: operationName,
                attempts: attempt + 1,
                ...metadata
              }
            });
          } catch (logError) {
            console.error('[Stripe Retry] Failed to log success:', logError.message);
          }
        }

        return result;
      } catch (error) {
        lastError = error;
        const isLastAttempt = attempt === maxRetries;

        // Determine if error is retryable
        const isRetryable = this.isRetryableError(error);

        // Log the error (non-blocking)
        const severity = isLastAttempt ? 'ERROR' : 'WARN';
        try {
          await repo.createSystemLog({
            businessId: metadata.businessId || null,
            logType: 'STRIPE',
            severity,
            message: `Stripe operation ${isLastAttempt ? 'failed' : 'retry attempt'}: ${operationName}`,
            metadata: {
              operation: operationName,
              attempt: attempt + 1,
              maxRetries: maxRetries + 1,
              errorType: error.type,
              errorCode: error.code,
              errorMessage: error.message,
              retryable: isRetryable,
              ...metadata
            }
          });
        } catch (logError) {
          console.error('[Stripe Retry] Failed to log error:', logError.message);
        }

        // Don't retry on non-retryable errors
        if (!isRetryable || isLastAttempt) {
          throw error;
        }

        // Calculate exponential backoff delay
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
          maxDelay
        );
        
        console.log(`[Stripe Retry] Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  static isRetryableError(error) {
    // Network errors are retryable
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      return true;
    }

    // Stripe timeout/server errors are retryable
    if (error.message && error.message.includes('timeout')) {
      return true;
    }

    // Stripe-specific errors
    if (error.type) {
      // Rate limit errors - always retry
      if (error.type === 'StripeRateLimitError') {
        return true;
      }

      // API connection errors - retry
      if (error.type === 'StripeConnectionError') {
        return true;
      }

      // API errors - retry on 5xx, not on 4xx
      if (error.type === 'StripeAPIError') {
        const statusCode = error.statusCode || error.status;
        return statusCode >= 500 && statusCode < 600;
      }

      // Authentication errors - don't retry
      if (error.type === 'StripeAuthenticationError') {
        return false;
      }

      // Permission errors - don't retry
      if (error.type === 'StripePermissionError') {
        return false;
      }

      // Invalid request errors - don't retry
      if (error.type === 'StripeInvalidRequestError') {
        return false;
      }
    }

    // Default: don't retry unknown errors
    return false;
  }

  static async logStripeOperation(operation, severity, message, metadata = {}) {
    try {
      await repo.createSystemLog({
        businessId: metadata.businessId || null,
        logType: 'STRIPE',
        severity,
        message,
        metadata: {
          operation,
          timestamp: new Date().toISOString(),
          ...metadata
        }
      });
    } catch (error) {
      console.error('[Stripe] Failed to log operation:', error.message);
    }
  }

  static async handleStripeError(operation, error, metadata = {}) {
    const errorInfo = {
      operation,
      errorType: error.type,
      errorCode: error.code,
      errorMessage: error.message,
      statusCode: error.statusCode || error.status,
      ...metadata
    };

    // Log error (non-blocking)
    try {
      await repo.createSystemLog({
        businessId: metadata.businessId || null,
        logType: 'STRIPE',
        severity: 'ERROR',
        message: `Stripe operation failed: ${operation}`,
        metadata: errorInfo
      });
    } catch (logError) {
      console.error('[Stripe] Failed to log error:', logError.message);
    }

    // Return user-friendly error message
    if (error.type === 'StripeCardError') {
      return {
        userMessage: 'Your card was declined. Please try a different payment method.',
        details: error.message
      };
    }

    if (error.type === 'StripeRateLimitError') {
      return {
        userMessage: 'Too many requests. Please try again in a moment.',
        details: 'Rate limit exceeded'
      };
    }

    if (error.type === 'StripeInvalidRequestError') {
      return {
        userMessage: 'Invalid request. Please check your information and try again.',
        details: error.message
      };
    }

    if (error.type === 'StripeAuthenticationError') {
      return {
        userMessage: 'Authentication error. Please contact support.',
        details: 'Stripe authentication failed'
      };
    }

    if (error.type === 'StripeConnectionError') {
      return {
        userMessage: 'Connection error. Please try again.',
        details: 'Unable to connect to payment processor'
      };
    }

    // Generic error
    return {
      userMessage: 'Payment processing error. Please try again or contact support.',
      details: error.message || 'Unknown error'
    };
  }
}
