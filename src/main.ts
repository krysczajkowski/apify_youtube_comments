/**
 * YouTube Comments Scraper Actor - Main Entry Point
 *
 * Extracts comments from YouTube videos using the InnerTube API.
 */

import { Actor, ProxyConfiguration } from 'apify';
import type { ActorInput, ValidatedInput, StartUrl } from './types/input.js';
import { INPUT_DEFAULTS } from './types/input.js';
import type { RunSummary, VideoState, ErrorCategory, ErrorSummary } from './types/run-summary.js';
import { validateYouTubeUrl } from './utils/url.js';
import { logInfo, logError, logWarning, logVideoStart, logVideoFailed, logVideoComplete, logLargeVolumeWarning } from './utils/logger.js';
import { extractComments } from './crawler.js';

/**
 * Large comment volume threshold for warning (T039)
 */
const LARGE_VOLUME_THRESHOLD = 100000;

/**
 * Validates actor input and applies defaults
 */
function validateInput(input: ActorInput): ValidatedInput {
    if (!input.startUrls || !Array.isArray(input.startUrls) || input.startUrls.length === 0) {
        throw new Error('Input validation failed: startUrls is required and must contain at least one URL');
    }

    // Validate sortBy if provided
    if (input.commentsSortBy && input.commentsSortBy !== '0' && input.commentsSortBy !== '1') {
        throw new Error("Invalid commentsSortBy: must be '0' (Top) or '1' (Newest first)");
    }

    return {
        startUrls: input.startUrls,
        maxComments: input.maxComments ?? INPUT_DEFAULTS.maxComments,
        commentsSortBy: input.commentsSortBy ?? INPUT_DEFAULTS.commentsSortBy,
        proxyConfiguration: input.proxyConfiguration ?? INPUT_DEFAULTS.proxyConfiguration,
    };
}

/**
 * Validates all URLs and returns valid/invalid lists
 */
function validateStartUrls(startUrls: StartUrl[]): {
    validUrls: Array<{ originalUrl: string; videoId: string; normalizedUrl: string }>;
    invalidUrls: Array<{ url: string; error: string }>;
} {
    const validUrls: Array<{ originalUrl: string; videoId: string; normalizedUrl: string }> = [];
    const invalidUrls: Array<{ url: string; error: string }> = [];

    for (const startUrl of startUrls) {
        const result = validateYouTubeUrl(startUrl.url);
        if (result.isValid && result.videoId && result.normalizedUrl) {
            validUrls.push({
                originalUrl: startUrl.url,
                videoId: result.videoId,
                normalizedUrl: result.normalizedUrl,
            });
        } else {
            invalidUrls.push({
                url: startUrl.url,
                error: result.error || 'Unknown validation error',
            });
        }
    }

    return { validUrls, invalidUrls };
}

/**
 * Creates proxy configuration from input
 */
async function createProxyConfig(
    proxyConfig: ValidatedInput['proxyConfiguration'],
): Promise<ProxyConfiguration | undefined> {
    if (!proxyConfig.useApifyProxy && !proxyConfig.proxyUrls?.length) {
        return undefined;
    }

    return Actor.createProxyConfiguration({
        useApifyProxy: proxyConfig.useApifyProxy,
        apifyProxyGroups: proxyConfig.apifyProxyGroups,
        apifyProxyCountry: proxyConfig.apifyProxyCountry,
        proxyUrls: proxyConfig.proxyUrls,
    });
}

/**
 * Aggregates errors by category for run summary
 */
function aggregateErrors(videoStates: VideoState[]): ErrorSummary[] {
    const errorMap = new Map<ErrorCategory, { count: number; message: string; urls: string[] }>();

    for (const state of videoStates) {
        if (state.errorCategory && state.errorMessage) {
            const existing = errorMap.get(state.errorCategory);
            if (existing) {
                existing.count++;
                if (existing.urls.length < 3) {
                    existing.urls.push(state.url);
                }
            } else {
                errorMap.set(state.errorCategory, {
                    count: 1,
                    message: state.errorMessage,
                    urls: [state.url],
                });
            }
        }
    }

    return Array.from(errorMap.entries()).map(([category, data]) => ({
        category,
        count: data.count,
        message: data.message,
        urls: data.urls,
    }));
}

/**
 * Generates recommendations based on run results
 */
function generateRecommendations(videoStates: VideoState[], errors: ErrorSummary[]): string[] {
    const recommendations: string[] = [];

    // Check for high block rate
    const blockedErrors = errors.find((e) => e.category === 'BLOCKED');
    if (blockedErrors && blockedErrors.count > 0) {
        const totalVideos = videoStates.length;
        const blockRate = blockedErrors.count / totalVideos;
        if (blockRate > 0.2) {
            recommendations.push('Consider using residential proxies for better success rate');
        }
        if (blockRate > 0.5) {
            recommendations.push('High block rate detected. Try reducing concurrency or adding delays');
        }
    }

    // Check for transient errors
    const transientErrors = errors.find((e) => e.category === 'TRANSIENT');
    if (transientErrors && transientErrors.count > 2) {
        recommendations.push('Multiple transient errors occurred. YouTube may be experiencing issues');
    }

    return recommendations;
}

/**
 * Main Actor entry point
 */
// eslint-disable-next-line @typescript-eslint/no-floating-promises
Actor.main(async () => {
    const startTime = new Date();
    logInfo('YouTube Comments Scraper starting');

    // Get and validate input
    const rawInput = await Actor.getInput<ActorInput>();
    if (!rawInput) {
        throw new Error('No input provided');
    }

    const input = validateInput(rawInput);
    logInfo(`Processing ${input.startUrls.length} URL(s) with maxComments=${input.maxComments || 'unlimited'}`);

    // Validate URLs upfront
    const { validUrls, invalidUrls } = validateStartUrls(input.startUrls);

    // Log invalid URLs
    for (const invalid of invalidUrls) {
        logError(`Invalid URL skipped: ${invalid.url}`, new Error(invalid.error));
    }

    if (validUrls.length === 0) {
        throw new Error('No valid YouTube URLs found in input');
    }

    logInfo(`Found ${validUrls.length} valid URL(s), ${invalidUrls.length} invalid`);

    // Create proxy configuration
    const proxyConfiguration = await createProxyConfig(input.proxyConfiguration);
    if (proxyConfiguration) {
        logInfo('Proxy configuration initialized');
    } else {
        logWarning('No proxy configuration - requests may be blocked');
    }

    // Initialize video states
    const videoStates: VideoState[] = validUrls.map((url) => ({
        url: url.originalUrl,
        videoId: url.videoId,
        status: 'PENDING',
        commentsExtracted: 0,
        repliesExtracted: 0,
    }));

    // Add invalid URLs as failed states
    for (const invalid of invalidUrls) {
        videoStates.push({
            url: invalid.url,
            videoId: 'unknown',
            status: 'FAILED',
            commentsExtracted: 0,
            repliesExtracted: 0,
            errorCategory: 'PERMANENT',
            errorMessage: invalid.error,
        });
    }

    // Process each video (T020: Integration with crawler)
    for (let i = 0; i < validUrls.length; i++) {
        const urlInfo = validUrls[i];
        const state = videoStates[i];

        logVideoStart(urlInfo.videoId, urlInfo.normalizedUrl, i, validUrls.length);
        state.status = 'PROCESSING';

        try {
            // T021: maxComments limit enforcement
            // Value of 0 means unlimited extraction
            const effectiveMaxComments = input.maxComments;

            // T039: Warn about large volumes before extraction starts (if we knew the count)
            // The crawler will also warn during extraction

            // Extract comments using the crawler
            const result = await extractComments({
                videoId: urlInfo.videoId,
                videoUrl: urlInfo.normalizedUrl,
                originalUrl: urlInfo.originalUrl,
                maxComments: effectiveMaxComments,
                sortBy: input.commentsSortBy,
                proxyConfiguration,
                includeReplies: true,
            });

            // Handle extraction result
            if (result.error) {
                if (result.errorCategory === 'PERMANENT') {
                    // Permanent error (comments disabled, video not found, etc.)
                    state.status = 'FAILED';
                    state.errorMessage = result.error;
                    state.errorCategory = result.errorCategory;
                    logVideoFailed(urlInfo.videoId, result.error, result.errorCategory, i, validUrls.length);
                } else if (result.comments.length > 0) {
                    // Partial success - got some comments before error
                    state.status = 'PARTIAL';
                    state.commentsExtracted = result.commentCount;
                    state.repliesExtracted = result.replyCount;
                    state.errorMessage = result.error;
                    state.errorCategory = result.errorCategory;

                    // Push partial results to dataset
                    await Actor.pushData(result.comments);
                    logWarning(`Partial extraction: ${result.commentCount} comments before error`, {
                        videoId: urlInfo.videoId,
                        commentCount: result.commentCount,
                    });
                } else {
                    // Failed with no comments
                    state.status = 'FAILED';
                    state.errorMessage = result.error;
                    state.errorCategory = result.errorCategory || 'TRANSIENT';
                    logVideoFailed(urlInfo.videoId, result.error, state.errorCategory, i, validUrls.length);
                }
            } else {
                // Successful extraction
                state.status = 'SUCCESS';
                state.commentsExtracted = result.commentCount;
                state.repliesExtracted = result.replyCount;

                // Push comments to dataset
                if (result.comments.length > 0) {
                    await Actor.pushData(result.comments);
                }

                logVideoComplete(urlInfo.videoId, result.commentCount, i, validUrls.length);

                // T039: Log warning for large video volumes if unlimited extraction
                if (
                    result.metadata.commentsCount
                    && result.metadata.commentsCount >= LARGE_VOLUME_THRESHOLD
                    && input.maxComments <= 0
                ) {
                    logLargeVolumeWarning(urlInfo.videoId, result.metadata.commentsCount);
                }
            }
        } catch (error) {
            state.status = 'FAILED';
            state.errorMessage = error instanceof Error ? error.message : String(error);
            state.errorCategory = 'TRANSIENT';
            logVideoFailed(urlInfo.videoId, state.errorMessage, state.errorCategory, i, validUrls.length);
        }
    }

    // Calculate run summary
    const endTime = new Date();
    const durationSeconds = (endTime.getTime() - startTime.getTime()) / 1000;

    const successfulVideos = videoStates.filter((s) => s.status === 'SUCCESS' || s.status === 'PARTIAL').length;
    const failedVideos = videoStates.filter((s) => s.status === 'FAILED').length;
    const totalComments = videoStates.reduce((sum, s) => sum + s.commentsExtracted, 0);
    const totalReplies = videoStates.reduce((sum, s) => sum + s.repliesExtracted, 0);

    const errors = aggregateErrors(videoStates);
    const recommendations = generateRecommendations(videoStates, errors);

    const runSummary: RunSummary = {
        startedAt: startTime.toISOString(),
        finishedAt: endTime.toISOString(),
        totalVideos: videoStates.length,
        successfulVideos,
        failedVideos,
        totalComments,
        totalReplies,
        avgCommentsPerSecond: durationSeconds > 0 ? totalComments / durationSeconds : 0,
        durationSeconds,
        errors: errors.length > 0 ? errors : undefined,
        recommendations: recommendations.length > 0 ? recommendations : undefined,
    };

    // Save run summary to Key-Value Store
    await Actor.setValue('RUN_SUMMARY', runSummary);

    logInfo(`Run complete: ${successfulVideos}/${videoStates.length} videos, ${totalComments} comments in ${durationSeconds.toFixed(1)}s`);

    if (recommendations.length > 0) {
        for (const rec of recommendations) {
            logWarning(`Recommendation: ${rec}`);
        }
    }
});
