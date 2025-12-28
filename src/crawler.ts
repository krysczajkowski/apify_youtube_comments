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
 * InnerTube API context for YouTube requests
 * Client version should be updated periodically to match YouTube's web client
 */
const INNERTUBE_CONTEXT = {
    client: {
        clientName: 'WEB',
        clientVersion: '2.20251220.00.00',
        hl: 'en',
        gl: 'US',
    },
};

/**
 * InnerTube API endpoints
 */
const INNERTUBE_API_URL = 'https://www.youtube.com/youtubei/v1/next';
const YOUTUBE_VIDEO_URL = 'https://www.youtube.com/watch';

/**
 * Large comment volume threshold for warning
 * Per T039: warn if video has 100k+ comments and no maxComments limit
 */
const LARGE_VOLUME_THRESHOLD = 100000;

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
    proxyConfiguration?: ProxyConfiguration
): Promise<string> {
    const url = `${YOUTUBE_VIDEO_URL}?v=${videoId}`;

    const proxyUrl = proxyConfiguration ? await proxyConfiguration.newUrl() : undefined;

    const response = await gotScraping({
        url,
        proxyUrl,
        responseType: 'text',
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
    proxyConfiguration?: ProxyConfiguration
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
    _sortBy: CommentsSortBy
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
            (error as Error).message
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

    // Apply sort order to token (T019)
    continuationToken = getSortedContinuationToken(continuationToken, sortBy);

    // Step 2: Paginate through comments (T017)
    const replyContinuationTokens = new Map<string, string>();

    while (continuationToken && comments.length < effectiveMaxComments) {
        try {
            const result = await withRetry(() => fetchComments(continuationToken!, proxyConfiguration));

            if (!result.success || !result.data) {
                // Log but continue with what we have
                logWarning(`Failed to fetch comments page: ${result.error?.message}`, { videoId });
                break;
            }

            const parsed = parseCommentsFromResponse(result.data, metadata);

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
                (error as Error).message
            );

            if (category === 'BLOCKED') {
                logRateLimit(videoId, 0, 0);
            }

            logWarning(`Error during pagination: ${(error as Error).message}`, { videoId, errorCategory: category });
            break;
        }
    }

    // Step 3: Extract replies (T018)
    if (includeReplies && comments.length < effectiveMaxComments) {
        for (const [parentCid, replyToken] of replyContinuationTokens) {
            if (comments.length >= effectiveMaxComments) break;

            const parentComment = comments.find((c) => c.cid === parentCid);
            if (!parentComment || parentComment.replyCount === 0) continue;

            let currentReplyToken: string | null = replyToken;

            while (currentReplyToken && comments.length < effectiveMaxComments) {
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
        }
    }

    const completed = !continuationToken || comments.length >= effectiveMaxComments;

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
