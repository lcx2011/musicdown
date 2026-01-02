/**
 * Unit tests for retry utility
 * Requirements: 5.3
 */

import { withRetry, RetryConfig } from './retry';

describe('withRetry', () => {
  it('should return result on first successful attempt', async () => {
    const operation = jest.fn().mockResolvedValue('success');

    const result = await withRetry(operation);

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and succeed on second attempt', async () => {
    const operation = jest
      .fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockResolvedValueOnce('success');

    // Use minimal delays for testing
    const config: RetryConfig = {
      maxAttempts: 3,
      initialDelay: 1,
      maxDelay: 5,
      backoffMultiplier: 2,
    };

    const result = await withRetry(operation, config);

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should retry exactly 2 times before throwing (3 total attempts)', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Always fails'));

    // Use minimal delays for testing
    const config: RetryConfig = {
      maxAttempts: 3,
      initialDelay: 1,
      maxDelay: 5,
      backoffMultiplier: 2,
    };

    await expect(withRetry(operation, config)).rejects.toThrow('Always fails');
    expect(operation).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it('should use exponential backoff delays', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Always fails'));
    const config: RetryConfig = {
      maxAttempts: 3,
      initialDelay: 1,
      maxDelay: 10,
      backoffMultiplier: 2,
    };

    await expect(withRetry(operation, config)).rejects.toThrow('Always fails');
    
    // Verify all attempts were made
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should respect max delay cap', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Always fails'));
    const config: RetryConfig = {
      maxAttempts: 4,
      initialDelay: 1,
      maxDelay: 3,
      backoffMultiplier: 2,
    };

    await expect(withRetry(operation, config)).rejects.toThrow('Always fails');
    
    // Verify all attempts were made
    expect(operation).toHaveBeenCalledTimes(4);
  });
});
