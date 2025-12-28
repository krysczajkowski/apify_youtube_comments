/**
 * TypeScript types for run summary, matching contracts/run-summary-schema.json
 */

/**
 * Error category classification
 */
export type ErrorCategory = 'BLOCKED' | 'TRANSIENT' | 'PERMANENT';

/**
 * Error summary entry
 */
export interface ErrorSummary {
    /** Error classification */
    category: ErrorCategory;

    /** Number of occurrences */
    count: number;

    /** Representative error message */
    message: string;

    /** Sample URLs that encountered this error */
    urls?: string[];
}

/**
 * Run summary written to Key-Value Store at end of actor run
 */
export interface RunSummary {
    /** ISO timestamp when the run started */
    startedAt: string;

    /** ISO timestamp when the run finished */
    finishedAt: string;

    /** Total number of videos in input */
    totalVideos: number;

    /** Videos with at least some comments extracted */
    successfulVideos: number;

    /** Videos that failed completely */
    failedVideos: number;

    /** Total comments extracted across all videos */
    totalComments: number;

    /** Total replies extracted (subset of totalComments) */
    totalReplies?: number;

    /** Average extraction throughput */
    avgCommentsPerSecond?: number;

    /** Total run duration in seconds */
    durationSeconds: number;

    /** Error summary by category */
    errors?: ErrorSummary[];

    /** Actionable suggestions based on run results */
    recommendations?: string[];
}

/**
 * Video processing status
 */
export type VideoStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'PARTIAL';

/**
 * Per-video tracking state
 */
export interface VideoState {
    url: string;
    videoId: string;
    status: VideoStatus;
    commentsExtracted: number;
    repliesExtracted: number;
    errorCategory?: ErrorCategory;
    errorMessage?: string;
}
