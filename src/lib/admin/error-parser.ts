/**
 * Admin Action Error Parser
 * Provides user-friendly error messages for admin operations
 */

export interface ParsedError {
  message: string;
  type: 'rate_limit' | 'approval_limit' | 'validation' | 'server' | 'unknown';
  retryAfter?: number;
}

/**
 * Parse admin action error and return user-friendly message
 */
export function parseAdminError(error: unknown): ParsedError {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Detect rate limiting
  if (
    errorMessage.toLowerCase().includes('rate limit') ||
    errorMessage.toLowerCase().includes('too many requests')
  ) {
    return {
      message:
        'You are performing actions too quickly. Please wait a moment before trying again.',
      type: 'rate_limit',
    };
  }

  // Detect approval limits
  if (
    errorMessage.toLowerCase().includes('approval limit') ||
    errorMessage.toLowerCase().includes('exceeds') ||
    errorMessage.toLowerCase().includes('daily limit')
  ) {
    return {
      message:
        'This withdrawal amount exceeds your approval limit. Please escalate to a higher authority or contact support.',
      type: 'approval_limit',
    };
  }

  // Detect validation errors
  if (
    errorMessage.toLowerCase().includes('required') ||
    errorMessage.toLowerCase().includes('invalid') ||
    errorMessage.toLowerCase().includes('missing')
  ) {
    return {
      message: errorMessage,
      type: 'validation',
    };
  }

  // Detect server errors
  if (
    errorMessage.toLowerCase().includes('failed to') ||
    errorMessage.toLowerCase().includes('error')
  ) {
    return {
      message: errorMessage,
      type: 'server',
    };
  }

  // Unknown error
  return {
    message: errorMessage || 'An unexpected error occurred. Please try again.',
    type: 'unknown',
  };
}

/**
 * Get appropriate toast variant for error type
 */
export function getErrorToastVariant(
  errorType: ParsedError['type']
): 'destructive' | 'default' {
  if (errorType === 'rate_limit' || errorType === 'approval_limit') {
    return 'default'; // Warning-style
  }
  return 'destructive'; // Error-style
}
