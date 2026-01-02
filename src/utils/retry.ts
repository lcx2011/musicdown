/**
 * Retry utility with exponential backoff
 * Requirements: 5.3
 */

export interface RetryConfig {
  maxAttempts: number;      // Total attempts (1 initial + retries)
  initialDelay: number;     // Initial delay in milliseconds
  maxDelay: number;         // Maximum delay in milliseconds
  backoffMultiplier: number; // Multiplier for exponential backoff
}

/**
 * Default retry configuration
 * - 3 total attempts (1 initial + 2 retries)
 * - Initial delay: 1000ms
 * - Max delay: 5000ms
 * - Exponential backoff with multiplier of 2
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 5000,
  backoffMultiplier: 2,
};

/**
 * Sleep utility function
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute an async operation with retry logic and exponential backoff
 * 
 * @param operation - The async operation to execute
 * @param config - Retry configuration (defaults to DEFAULT_RETRY_CONFIG)
 * @returns Promise resolving to the operation result
 * @throws The last error if all retry attempts fail
 * 
 * Requirements: 5.3
 * - Max 3 attempts (1 initial + 2 retries)
 * - Exponential backoff (1s, 2s, 5s max)
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error;
  let delay = config.initialDelay;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // If this was the last attempt, throw the error
      if (attempt >= config.maxAttempts) {
        throw lastError;
      }
      
      // Wait before retrying with exponential backoff
      await sleep(delay);
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw lastError!;
}
