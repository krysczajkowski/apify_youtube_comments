/**
 * Exponential backoff retry logic with jitter
 * Per research.md: base 1000ms, max 30000ms, 3 retries, 50% jitter
 */

import type { ErrorCategory } from '../types/run-summary.js';

/**
 * Retry configuration options
 */
export interface RetryOptions {
    /** Base delay in milliseconds (default: 1000) */
    baseDelayMs?: number;
    /** Maximum delay in milliseconds (default: 30000) */
    maxDelayMs?: number;
    /** Maximum number of retries (default: 3) */
    maxRetries?: number;
    /** Jitter factor 0-1 (default: 0.5 for 50% variance) */
    jitterFactor?: number;
}

/**
 * Default retry configuration per research.md
 */
export const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    maxRetries: 3,
    jitterFactor: 0.5,
};

/**
 * Classifies an error based on HTTP status code
 * Per research.md error classification:
 * - Transient: 500, 502, 503, 504, timeout
 * - Blocked: 403, 429, captcha
 * - Permanent: 404, invalid URL, comments disabled
 */
export function classifyError(statusCode: number | null, message?: string): ErrorCategory {
    // Check for permanent errors
    if (statusCode === 404) {
        return 'PERMANENT';
    }

    // Check message for permanent conditions
    const lowerMessage = (message || '').toLowerCase();
    if (
        lowerMessage.includes('comments disabled')
        || lowerMessage.includes('comments are turned off')
        || lowerMessage.includes('private video')
        || lowerMessage.includes('video unavailable')
        || lowerMessage.includes('age-restricted')
    ) {
        return 'PERMANENT';
    }

    // Check for blocked errors
    if (statusCode === 403 || statusCode === 429) {
        return 'BLOCKED';
    }
    if (lowerMessage.includes('captcha') || lowerMessage.includes('bot detected')) {
        return 'BLOCKED';
    }

    // Check for transient errors
    if (statusCode && statusCode >= 500 && statusCode < 600) {
        return 'TRANSIENT';
    }
    if (lowerMessage.includes('timeout') || lowerMessage.includes('econnreset')) {
        return 'TRANSIENT';
    }

    // Default to transient for unknown errors (allows retry)
    return 'TRANSIENT';
}

/**
 * Determines if an error should be retried based on its category
 */
export function shouldRetry(category: ErrorCategory): boolean {
    return category !== 'PERMANENT';
}

/**
 * Calculates delay with exponential backoff and jitter
 * @param attempt - Current attempt number (0-indexed)
 * @param options - Retry configuration
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(attempt: number, options: RetryOptions = {}): number {
    const { baseDelayMs, maxDelayMs, jitterFactor } = { ...DEFAULT_RETRY_OPTIONS, ...options };

    // Exponential backoff: base * 2^attempt
    const exponentialDelay = baseDelayMs * 2 ** attempt;

    // Cap at max delay
    const cappedDelay = Math.min(exponentialDelay, maxDelayMs);

    // Apply jitter: delay * (1 - jitter/2) to (1 + jitter/2)
    const jitterMin = 1 - jitterFactor / 2;
    const jitterMax = 1 + jitterFactor / 2;
    const jitter = jitterMin + Math.random() * (jitterMax - jitterMin);

    return Math.floor(cappedDelay * jitter);
}

/**
 * Sleeps for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Result of a retry operation
 */
export interface RetryResult<T> {
    success: boolean;
    data?: T;
    error?: Error;
    attempts: number;
    category?: ErrorCategory;
}

/**
 * Executes a function with exponential backoff retry
 * @param fn - Async function to retry
 * @param options - Retry configuration
 * @returns Result with success status and data or error
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {},
): Promise<RetryResult<T>> {
    const { maxRetries } = { ...DEFAULT_RETRY_OPTIONS, ...options };

    let lastError: Error | undefined;
    let lastCategory: ErrorCategory = 'TRANSIENT';

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const data = await fn();
            return { success: true, data, attempts: attempt + 1 };
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            // Extract status code from error if available
            const statusCode = (error as { statusCode?: number }).statusCode ?? null;
            lastCategory = classifyError(statusCode, lastError.message);

            // Don't retry permanent errors
            if (!shouldRetry(lastCategory)) {
                return {
                    success: false,
                    error: lastError,
                    attempts: attempt + 1,
                    category: lastCategory,
                };
            }

            // Don't delay after last attempt
            if (attempt < maxRetries) {
                const delay = calculateBackoffDelay(attempt, options);
                await sleep(delay);
            }
        }
    }

    return {
        success: false,
        error: lastError,
        attempts: maxRetries + 1,
        category: lastCategory,
    };
}
