/**
 * Unit tests for src/utils/retry.ts
 * Per data-model.md: Error Classification Test Cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    classifyError,
    shouldRetry,
    calculateBackoffDelay,
    getTimeoutActionableMessage,
    DEFAULT_RETRY_OPTIONS,
} from '../../src/utils/retry.js';

describe('classifyError', () => {
    describe('PERMANENT errors', () => {
        it('should classify 404 as PERMANENT', () => {
            expect(classifyError(404)).toBe('PERMANENT');
        });

        it('should classify "comments disabled" message as PERMANENT', () => {
            expect(classifyError(null, 'Comments disabled for this video')).toBe('PERMANENT');
        });

        it('should classify "comments are turned off" message as PERMANENT', () => {
            expect(classifyError(null, 'Comments are turned off')).toBe('PERMANENT');
        });

        it('should classify "private video" message as PERMANENT', () => {
            expect(classifyError(null, 'This is a private video')).toBe('PERMANENT');
        });

        it('should classify "video unavailable" message as PERMANENT', () => {
            expect(classifyError(null, 'Video unavailable')).toBe('PERMANENT');
        });

        it('should classify "age-restricted" message as PERMANENT', () => {
            expect(classifyError(null, 'This video is age-restricted')).toBe('PERMANENT');
        });
    });

    describe('BLOCKED errors', () => {
        it('should classify 403 as BLOCKED', () => {
            expect(classifyError(403)).toBe('BLOCKED');
        });

        it('should classify 429 as BLOCKED', () => {
            expect(classifyError(429)).toBe('BLOCKED');
        });

        it('should classify "captcha" message as BLOCKED', () => {
            expect(classifyError(null, 'Captcha detected')).toBe('BLOCKED');
        });

        it('should classify "bot detected" message as BLOCKED', () => {
            expect(classifyError(null, 'Bot detected')).toBe('BLOCKED');
        });
    });

    describe('TRANSIENT errors', () => {
        it('should classify 500 as TRANSIENT', () => {
            expect(classifyError(500)).toBe('TRANSIENT');
        });

        it('should classify 502 as TRANSIENT', () => {
            expect(classifyError(502)).toBe('TRANSIENT');
        });

        it('should classify 503 as TRANSIENT', () => {
            expect(classifyError(503)).toBe('TRANSIENT');
        });

        it('should classify 504 as TRANSIENT', () => {
            expect(classifyError(504)).toBe('TRANSIENT');
        });

        it('should classify "timeout" message as TRANSIENT', () => {
            expect(classifyError(null, 'Request timeout')).toBe('TRANSIENT');
        });

        it('should classify "econnreset" message as TRANSIENT', () => {
            expect(classifyError(null, 'ECONNRESET')).toBe('TRANSIENT');
        });

        it('should classify unknown errors as TRANSIENT (allows retry)', () => {
            expect(classifyError(null, 'Unknown error')).toBe('TRANSIENT');
        });

        it('should classify null status code with no message as TRANSIENT', () => {
            expect(classifyError(null)).toBe('TRANSIENT');
        });
    });

    describe('case insensitivity', () => {
        it('should handle uppercase message', () => {
            expect(classifyError(null, 'COMMENTS DISABLED')).toBe('PERMANENT');
        });

        it('should handle mixed case message', () => {
            expect(classifyError(null, 'Captcha Detected')).toBe('BLOCKED');
        });
    });
});

describe('shouldRetry', () => {
    it('should return false for PERMANENT errors', () => {
        expect(shouldRetry('PERMANENT')).toBe(false);
    });

    it('should return true for TRANSIENT errors', () => {
        expect(shouldRetry('TRANSIENT')).toBe(true);
    });

    it('should return true for BLOCKED errors', () => {
        expect(shouldRetry('BLOCKED')).toBe(true);
    });
});

describe('calculateBackoffDelay', () => {
    beforeEach(() => {
        // Mock Math.random to return predictable values
        vi.spyOn(Math, 'random').mockReturnValue(0.5);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should calculate exponential backoff for attempt 0', () => {
        // Base: 1000ms, 2^0 = 1, delay = 1000ms
        // With 50% jitter and random=0.5: 1000 * 1.0 = 1000
        const delay = calculateBackoffDelay(0);
        expect(delay).toBe(1000);
    });

    it('should calculate exponential backoff for attempt 1', () => {
        // Base: 1000ms, 2^1 = 2, delay = 2000ms
        // With 50% jitter and random=0.5: 2000 * 1.0 = 2000
        const delay = calculateBackoffDelay(1);
        expect(delay).toBe(2000);
    });

    it('should calculate exponential backoff for attempt 2', () => {
        // Base: 1000ms, 2^2 = 4, delay = 4000ms
        // With 50% jitter and random=0.5: 4000 * 1.0 = 4000
        const delay = calculateBackoffDelay(2);
        expect(delay).toBe(4000);
    });

    it('should cap delay at maxDelayMs', () => {
        // Attempt 10: 1000 * 2^10 = 1024000ms, but max is 30000ms
        const delay = calculateBackoffDelay(10);
        expect(delay).toBe(30000); // Capped at max
    });

    it('should apply jitter with low random value', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0);
        // Base: 1000, jitterMin = 0.75 (1 - 0.5/2)
        const delay = calculateBackoffDelay(0);
        expect(delay).toBe(750);
    });

    it('should apply jitter with high random value', () => {
        vi.spyOn(Math, 'random').mockReturnValue(1);
        // Base: 1000, jitterMax = 1.25 (1 + 0.5/2)
        const delay = calculateBackoffDelay(0);
        expect(delay).toBe(1250);
    });

    it('should use custom options', () => {
        const delay = calculateBackoffDelay(0, {
            baseDelayMs: 500,
            jitterFactor: 0, // No jitter
        });
        expect(delay).toBe(500);
    });

    it('should respect custom maxDelayMs', () => {
        const delay = calculateBackoffDelay(10, {
            maxDelayMs: 5000,
        });
        expect(delay).toBeLessThanOrEqual(6250); // 5000 * 1.25 with jitter
    });

    it('should use default options when not provided', () => {
        expect(DEFAULT_RETRY_OPTIONS.baseDelayMs).toBe(1000);
        expect(DEFAULT_RETRY_OPTIONS.maxDelayMs).toBe(30000);
        expect(DEFAULT_RETRY_OPTIONS.maxRetries).toBe(3);
        expect(DEFAULT_RETRY_OPTIONS.jitterFactor).toBe(0.5);
    });
});

describe('getTimeoutActionableMessage', () => {
    it('should provide actionable message for timeout', () => {
        const message = getTimeoutActionableMessage('Request timeout after 30s');
        expect(message).toContain('timed out');
        expect(message).toContain('maxComments');
    });

    it('should provide actionable message for ECONNRESET', () => {
        const message = getTimeoutActionableMessage('ECONNRESET');
        expect(message).toContain('reset');
        expect(message).toContain('retry');
    });

    it('should provide actionable message for connection reset', () => {
        const message = getTimeoutActionableMessage('Connection reset by peer');
        expect(message).toContain('reset');
    });

    it('should provide actionable message for ENOTFOUND', () => {
        const message = getTimeoutActionableMessage('ENOTFOUND: getaddrinfo failed');
        expect(message).toContain('Network error');
        expect(message).toContain('internet connection');
    });

    it('should provide actionable message for getaddrinfo errors', () => {
        const message = getTimeoutActionableMessage('getaddrinfo ENOTFOUND');
        expect(message).toContain('Network error');
    });

    it('should provide actionable message for socket errors', () => {
        const message = getTimeoutActionableMessage('Socket hang up');
        expect(message).toContain('Network error');
        expect(message).toContain('retry');
    });

    it('should provide generic network error message for unknown errors', () => {
        const message = getTimeoutActionableMessage('Some other error');
        expect(message).toContain('Network error');
        expect(message).toContain('retry');
    });
});
