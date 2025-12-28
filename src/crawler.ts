/**
 * YouTube Comments Crawler
 * HTTP-first extraction using InnerTube API
 * Per research.md: got-scraping for HTTP with browser-like fingerprinting
 */

import { gotScraping } from 'got-scraping';
import type { ProxyConfiguration } from 'apify';
import type { CommentOutput, VideoMetadata } from './types/output.js';
import type { CommentsSortBy } from './types/input.js';
import type { ErrorCategory } from './types/run-summary.js';
import {
    extractYtInitialData,
    extractVideoTitle,
    extractCommentsCount,
    extractCommentsContinuationToken,
    areCommentsDisabled,
} from './extractors/metadata.js';
import { parseCommentsFromResponse, parseRepliesFromResponse, validateCommentOutput } from './extractors/comments.js';
import { withRetry, classifyError } from './utils/retry.js';
import { logDebug, logInfo, logWarning, logPaginationProgress, logRateLimit, logLargeVolumeWarning } from './utils/logger.js';

/**
 * InnerTube API key (mweb client key - stable and commonly used)
 * Per research.md: Required for reliable API access
 */
const INNERTUBE_API_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';

/**
 * InnerTube API context for YouTube requests
 * Client version should be updated periodically to match YouTube's web client
 * Per research.md: Updated context with timeZone and utcOffsetMinutes
 */
const INNERTUBE_CONTEXT = {
    client: {
        clientName: 'WEB',
        clientVersion: '2.20250312.04.00',
        hl: 'en',
        gl: 'US',
        timeZone: 'UTC',
        utcOffsetMinutes: 0,
    },
};

/**
 * InnerTube API endpoints
 * Per research.md: API key required as query parameter
 */
const INNERTUBE_API_URL = `https://www.youtube.com/youtubei/v1/next?key=${INNERTUBE_API_KEY}`;
const YOUTUBE_VIDEO_URL = 'https://www.youtube.com/watch';

/**
 * Large comment volume threshold for warning
 * Per T039: warn if video has 100k+ comments and no maxComments limit
 */
const LARGE_VOLUME_THRESHOLD = 100000;

/**
 * Timeout constants for fast response time (T015-T017)
 * Per spec: First batch within 30s, total extraction max 5 minutes
 */
const REQUEST_TIMEOUT_MS = 10000; // 10 seconds per request
const TOTAL_EXTRACTION_TIMEOUT_MS = 300000; // 5 minutes total extraction
const FIRST_BATCH_DEADLINE_MS = 30000; // 30 seconds for first batch

/**
 * Empty response threshold for early termination (T021)
 * Per research.md: abort after 3 consecutive empty pages
 */
const MAX_CONSECUTIVE_EMPTY_PAGES = 3;

/**
 * Options for comment extraction
 */
export interface ExtractCommentsOptions {
    /** Video ID to extract comments from */
    videoId: string;
    /** Normalized video URL */
    videoUrl: string;
    /** Original input URL */
    originalUrl: string;
    /** Maximum comments to extract (0 = unlimited) */
    maxComments: number;
    /** Sort order: "0" = Top, "1" = Newest */
    sortBy: CommentsSortBy;
    /** Proxy configuration */
    proxyConfiguration?: ProxyConfiguration;
    /** Whether to extract replies */
    includeReplies?: boolean;
}

/**
 * Result of comment extraction
 */
export interface ExtractCommentsResult {
    /** Extracted comments */
    comments: CommentOutput[];
    /** Video metadata */
    metadata: VideoMetadata;
    /** Number of comments extracted */
    commentCount: number;
    /** Number of replies extracted */
    replyCount: number;
    /** Whether extraction completed (vs hit limit or error) */
    completed: boolean;
    /** Error if extraction failed */
    error?: string;
    /** Error category if failed */
    errorCategory?: ErrorCategory;
}

/**
 * Custom error for comments being disabled
 */
export class CommentsDisabledError extends Error {
    constructor(videoId: string) {
        super(`Comments disabled for video ${videoId}`);
        this.name = 'CommentsDisabledError';
    }
}

/**
 * Custom error for rate limiting
 */
export class RateLimitError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number = 429) {
        super(message);
        this.name = 'RateLimitError';
        this.statusCode = statusCode;
    }
}

/**
 * Fetches video page and extracts initial data
 * @param videoId - YouTube video ID
 * @param proxyConfiguration - Optional proxy config
 * @returns HTML content of video page
 */
async function fetchVideoPage(
    videoId: string,
    proxyConfiguration?: ProxyConfiguration,
): Promise<string> {
    const url = `${YOUTUBE_VIDEO_URL}?v=${videoId}`;

    const proxyUrl = proxyConfiguration ? await proxyConfiguration.newUrl() : undefined;

    const response = await gotScraping({
        url,
        proxyUrl,
        responseType: 'text',
        timeout: {
            request: REQUEST_TIMEOUT_MS,
        },
        headers: {
            'Accept-Language': 'en-US,en;q=0.9',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
    });

    if (response.statusCode === 429 || response.statusCode === 403) {
        throw new RateLimitError(`Rate limited: ${response.statusCode}`, response.statusCode);
    }

    if (response.statusCode !== 200) {
        const error = new Error(`Failed to fetch video page: ${response.statusCode}`) as Error & { statusCode: number };
        error.statusCode = response.statusCode;
        throw error;
    }

    return response.body;
}

/**
 * Fetches comments using InnerTube API
 * @param continuationToken - Continuation token for pagination
 * @param proxyConfiguration - Optional proxy config
 * @returns Parsed API response
 */
async function fetchComments(
    continuationToken: string,
    proxyConfiguration?: ProxyConfiguration,
): Promise<Record<string, unknown>> {
    const proxyUrl = proxyConfiguration ? await proxyConfiguration.newUrl() : undefined;

    const response = await gotScraping({
        url: INNERTUBE_API_URL,
        method: 'POST',
        proxyUrl,
        json: {
            context: INNERTUBE_CONTEXT,
            continuation: continuationToken,
        },
        responseType: 'json',
        timeout: {
            request: REQUEST_TIMEOUT_MS,
        },
        headers: {
            'Content-Type': 'application/json',
            Origin: 'https://www.youtube.com',
            Referer: 'https://www.youtube.com/',
        },
    });

    if (response.statusCode === 429 || response.statusCode === 403) {
        throw new RateLimitError(`Rate limited: ${response.statusCode}`, response.statusCode);
    }

    if (response.statusCode !== 200) {
        const error = new Error(`InnerTube API error: ${response.statusCode}`) as Error & { statusCode: number };
        error.statusCode = response.statusCode;
        throw error;
    }

    return response.body as Record<string, unknown>;
}

/**
 * Modifies continuation token for different sort orders
 * Sort tokens are encoded in the continuation - we need to request the right initial token
 * This is a simplified approach; in practice, sort order is often set when getting initial page
 */
function getSortedContinuationToken(
    token: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _sortBy: CommentsSortBy,
): string {
    // The sort order is typically embedded in the initial page load based on URL params
    // For now, we return the token as-is; YouTube's default behavior applies
    return token;
}

/**
 * Extracts all comments from a YouTube video
 * Implements T015-T023: InnerTube API, pagination, replies, sort order, error handling
 */
export async function extractComments(options: ExtractCommentsOptions): Promise<ExtractCommentsResult> {
    const {
        videoId,
        videoUrl,
        originalUrl,
        maxComments,
        sortBy,
        proxyConfiguration,
        includeReplies = true,
    } = options;

    const comments: CommentOutput[] = [];
    let replyCount = 0;
    const effectiveMaxComments = maxComments > 0 ? maxComments : Number.MAX_SAFE_INTEGER;
    const isUnlimited = maxComments <= 0;

    logDebug(`Starting extraction for ${videoId}`, { videoId });

    // Step 1: Fetch video page and extract initial data (T016)
    let html: string;
    try {
        const result = await withRetry(() => fetchVideoPage(videoId, proxyConfiguration));
        if (!result.success || !result.data) {
            return {
                comments: [],
                metadata: createEmptyMetadata(videoId, originalUrl),
                commentCount: 0,
                replyCount: 0,
                completed: false,
                error: result.error?.message || 'Failed to fetch video page',
                errorCategory: result.category || 'TRANSIENT',
            };
        }
        html = result.data;
    } catch (error) {
        const category = classifyError(
            (error as { statusCode?: number }).statusCode ?? null,
            (error as Error).message,
        );
        return {
            comments: [],
            metadata: createEmptyMetadata(videoId, originalUrl),
            commentCount: 0,
            replyCount: 0,
            completed: false,
            error: (error as Error).message,
            errorCategory: category,
        };
    }

    // Parse ytInitialData
    const ytInitialData = extractYtInitialData(html);
    if (!ytInitialData) {
        return {
            comments: [],
            metadata: createEmptyMetadata(videoId, originalUrl),
            commentCount: 0,
            replyCount: 0,
            completed: false,
            error: 'Failed to extract ytInitialData from video page',
            errorCategory: 'PERMANENT',
        };
    }

    // Check if comments are disabled (T022)
    if (areCommentsDisabled(ytInitialData)) {
        return {
            comments: [],
            metadata: createEmptyMetadata(videoId, originalUrl),
            commentCount: 0,
            replyCount: 0,
            completed: true,
            error: `Comments disabled for video ${videoId}`,
            errorCategory: 'PERMANENT',
        };
    }

    // Extract metadata
    const title = extractVideoTitle(ytInitialData);
    const commentsCount = extractCommentsCount(ytInitialData);
    let continuationToken = extractCommentsContinuationToken(ytInitialData);

    const metadata: VideoMetadata = {
        videoId,
        url: originalUrl,
        finalUrl: videoUrl,
        title,
        commentsCount,
    };

    // Warn about large volumes if unlimited (T039 - partially implemented here)
    if (commentsCount && commentsCount >= LARGE_VOLUME_THRESHOLD && isUnlimited) {
        logLargeVolumeWarning(videoId, commentsCount);
    }

    if (!continuationToken) {
        logInfo(`No comments found or comments section not available`, { videoId });
        return {
            comments: [],
            metadata,
            commentCount: 0,
            replyCount: 0,
            completed: true,
        };
    }

    // Apply sort order to token
    continuationToken = getSortedContinuationToken(continuationToken, sortBy);

    // Step 2: Paginate through comments with timeout enforcement (T019-T022)
    const replyContinuationTokens = new Map<string, string>();
    const extractionStartTime = Date.now(); // T019: Track extraction start
    let consecutiveEmptyPages = 0; // T021: Track empty responses
    let timedOut = false; // T022: Track timeout status
    let firstBatchReceived = false; // Track first batch for deadline

    while (continuationToken && comments.length < effectiveMaxComments) {
        // T020: Check total timeout at start of each iteration
        const elapsedMs = Date.now() - extractionStartTime;
        if (elapsedMs >= TOTAL_EXTRACTION_TIMEOUT_MS) {
            logWarning(`Total extraction timeout (${TOTAL_EXTRACTION_TIMEOUT_MS}ms) reached after ${comments.length} comments`, { videoId });
            timedOut = true;
            break;
        }

        // Check first batch deadline (only before first comments arrive)
        if (!firstBatchReceived && elapsedMs >= FIRST_BATCH_DEADLINE_MS) {
            logWarning(`First batch deadline (${FIRST_BATCH_DEADLINE_MS}ms) exceeded`, { videoId });
            timedOut = true;
            break;
        }

        try {
            const result = await withRetry(() => fetchComments(continuationToken!, proxyConfiguration));

            if (!result.success || !result.data) {
                // Log but continue with what we have
                logWarning(`Failed to fetch comments page: ${result.error?.message}`, { videoId });
                break;
            }

            const parsed = parseCommentsFromResponse(result.data, metadata);
            const newCommentsCount = parsed.comments.length;

            // T021: Track consecutive empty pages
            if (newCommentsCount === 0) {
                consecutiveEmptyPages++;
                if (consecutiveEmptyPages >= MAX_CONSECUTIVE_EMPTY_PAGES) {
                    logWarning(`${MAX_CONSECUTIVE_EMPTY_PAGES} consecutive empty pages - aborting pagination`, { videoId });
                    break;
                }
            } else {
                consecutiveEmptyPages = 0; // Reset counter on successful page
                firstBatchReceived = true; // Mark first batch received
            }

            // Add valid comments
            for (const comment of parsed.comments) {
                if (comments.length >= effectiveMaxComments) break;
                if (validateCommentOutput(comment)) {
                    comments.push(comment);
                }
            }

            // Collect reply tokens for later
            for (const [cid, token] of parsed.replyContinuationTokens) {
                replyContinuationTokens.set(cid, token);
            }

            logPaginationProgress(videoId, comments.length, maxComments || null);

            continuationToken = parsed.nextContinuationToken;
        } catch (error) {
            const category = classifyError(
                (error as { statusCode?: number }).statusCode ?? null,
                (error as Error).message,
            );

            if (category === 'BLOCKED') {
                logRateLimit(videoId, 0, 0);
            }

            logWarning(`Error during pagination: ${(error as Error).message}`, { videoId, errorCategory: category });
            break;
        }
    }

    // Step 3: Extract replies with timeout enforcement
    if (includeReplies && comments.length < effectiveMaxComments && !timedOut) {
        for (const [parentCid, replyToken] of replyContinuationTokens) {
            if (comments.length >= effectiveMaxComments) break;

            // Check timeout before processing each parent's replies
            const elapsedMs = Date.now() - extractionStartTime;
            if (elapsedMs >= TOTAL_EXTRACTION_TIMEOUT_MS) {
                logWarning(`Total extraction timeout reached during reply extraction`, { videoId });
                timedOut = true;
                break;
            }

            const parentComment = comments.find((c) => c.cid === parentCid);
            if (!parentComment || parentComment.replyCount === 0) continue;

            let currentReplyToken: string | null = replyToken;

            while (currentReplyToken && comments.length < effectiveMaxComments) {
                // Check timeout at each reply page
                const replyElapsedMs = Date.now() - extractionStartTime;
                if (replyElapsedMs >= TOTAL_EXTRACTION_TIMEOUT_MS) {
                    logWarning(`Total extraction timeout reached during reply pagination`, { videoId });
                    timedOut = true;
                    break;
                }

                try {
                    const result = await withRetry(() => fetchComments(currentReplyToken!, proxyConfiguration));

                    if (!result.success || !result.data) {
                        break;
                    }

                    const parsed = parseRepliesFromResponse(result.data, metadata, parentCid);

                    for (const reply of parsed.replies) {
                        if (comments.length >= effectiveMaxComments) break;
                        if (validateCommentOutput(reply)) {
                            comments.push(reply);
                            replyCount++;
                        }
                    }

                    currentReplyToken = parsed.nextContinuationToken;
                } catch (error) {
                    logDebug(`Error fetching replies: ${(error as Error).message}`, { videoId });
                    break;
                }
            }

            if (timedOut) break;
        }
    }

    // T022: Return partial results - completed is false if timed out or more pages exist
    const completed = !timedOut && (!continuationToken || comments.length >= effectiveMaxComments);

    // Log if returning partial results due to timeout
    if (timedOut && comments.length > 0) {
        logWarning(`Returning ${comments.length} partial results due to timeout`, { videoId });
    }

    return {
        comments,
        metadata,
        commentCount: comments.length,
        replyCount,
        completed,
    };
}

/**
 * Creates empty metadata for error cases
 */
function createEmptyMetadata(videoId: string, originalUrl: string): VideoMetadata {
    return {
        videoId,
        url: originalUrl,
        finalUrl: `https://www.youtube.com/watch?v=${videoId}`,
        title: '',
        commentsCount: null,
    };
}
