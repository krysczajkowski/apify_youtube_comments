/**
 * Structured logging utilities
 * Per Constitution Principle VI: Observability
 */

import { log } from 'crawlee';
import type { ErrorCategory } from '../types/run-summary.js';

/**
 * Log levels
 */
export type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR';

/**
 * Structured log context
 */
export interface LogContext {
    videoId?: string;
    videoUrl?: string;
    videoIndex?: number;
    totalVideos?: number;
    commentCount?: number;
    errorCategory?: ErrorCategory;
    statusCode?: number;
    [key: string]: unknown;
}

/**
 * Formats a log message with context
 */
function formatMessage(message: string, context?: LogContext): string {
    if (!context || Object.keys(context).length === 0) {
        return message;
    }

    const contextParts: string[] = [];

    // Add video context if present
    if (context.videoIndex !== undefined && context.totalVideos !== undefined) {
        contextParts.push(`[${context.videoIndex + 1}/${context.totalVideos}]`);
    }

    if (context.videoId) {
        contextParts.push(`[${context.videoId}]`);
    }

    if (context.errorCategory) {
        contextParts.push(`[${context.errorCategory}]`);
    }

    const prefix = contextParts.length > 0 ? `${contextParts.join(' ')} ` : '';
    return `${prefix}${message}`;
}

/**
 * Logs a debug message
 */
export function logDebug(message: string, context?: LogContext): void {
    log.debug(formatMessage(message, context));
}

/**
 * Logs an info message
 */
export function logInfo(message: string, context?: LogContext): void {
    log.info(formatMessage(message, context));
}

/**
 * Logs a warning message
 */
export function logWarning(message: string, context?: LogContext): void {
    log.warning(formatMessage(message, context));
}

/**
 * Logs an error message with category
 */
export function logError(
    message: string,
    error?: Error | unknown,
    context?: LogContext
): void {
    const errorMessage = error instanceof Error ? error.message : String(error || '');
    const fullMessage = errorMessage ? `${message}: ${errorMessage}` : message;
    log.error(formatMessage(fullMessage, context));
}

/**
 * Logs error with category classification
 */
export function logCategorizedError(
    message: string,
    category: ErrorCategory,
    context?: LogContext
): void {
    const contextWithCategory = { ...context, errorCategory: category };

    switch (category) {
        case 'PERMANENT':
            // Permanent errors are expected and handled
            log.warning(formatMessage(message, contextWithCategory));
            break;
        case 'BLOCKED':
            // Blocked errors need attention
            log.error(formatMessage(message, contextWithCategory));
            break;
        case 'TRANSIENT':
        default:
            // Transient errors may resolve with retry
            log.warning(formatMessage(message, contextWithCategory));
            break;
    }
}

/**
 * Logs video processing start
 */
export function logVideoStart(videoId: string, url: string, index: number, total: number): void {
    logInfo(`Starting comment extraction`, {
        videoId,
        videoUrl: url,
        videoIndex: index,
        totalVideos: total,
    });
}

/**
 * Logs video processing completion
 */
export function logVideoComplete(
    videoId: string,
    commentCount: number,
    index: number,
    total: number
): void {
    logInfo(`Extracted ${commentCount} comments`, {
        videoId,
        videoIndex: index,
        totalVideos: total,
        commentCount,
    });
}

/**
 * Logs video processing failure
 */
export function logVideoFailed(
    videoId: string,
    error: string,
    category: ErrorCategory,
    index: number,
    total: number
): void {
    logCategorizedError(`Failed to extract comments: ${error}`, category, {
        videoId,
        videoIndex: index,
        totalVideos: total,
        errorCategory: category,
    });
}

/**
 * Logs pagination progress
 */
export function logPaginationProgress(
    videoId: string,
    currentCount: number,
    maxComments: number | null
): void {
    const limitInfo = maxComments && maxComments > 0 ? ` / ${maxComments}` : '';
    logDebug(`Fetched ${currentCount}${limitInfo} comments`, { videoId, commentCount: currentCount });
}

/**
 * Logs rate limit detection
 */
export function logRateLimit(videoId: string, retryAttempt: number, delayMs: number): void {
    logWarning(`Rate limited, retrying in ${delayMs}ms (attempt ${retryAttempt})`, {
        videoId,
        errorCategory: 'BLOCKED',
    });
}

/**
 * Logs large volume warning per T039
 */
export function logLargeVolumeWarning(videoId: string, commentsCount: number): void {
    logWarning(
        `Video has ${commentsCount.toLocaleString()} comments. ` +
        `Consider setting maxComments to limit extraction time and costs.`,
        { videoId, commentCount: commentsCount }
    );
}
