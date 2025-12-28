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
import { logInfo, logError, logWarning, logVideoStart, logVideoFailed } from './utils/logger.js';

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
    proxyConfig: ValidatedInput['proxyConfiguration']
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

    // Process each video
    // TODO: Implement actual comment extraction in crawler.ts (Phase 3)
    for (let i = 0; i < validUrls.length; i++) {
        const urlInfo = validUrls[i];
        const state = videoStates[i];

        logVideoStart(urlInfo.videoId, urlInfo.normalizedUrl, i, validUrls.length);
        state.status = 'PROCESSING';

        try {
            // TODO: Call crawler to extract comments
            // const comments = await extractComments(urlInfo, input, proxyConfiguration);
            // await Actor.pushData(comments);
            // state.commentsExtracted = comments.length;
            // state.status = 'SUCCESS';

            // Placeholder: Mark as success for skeleton
            state.status = 'SUCCESS';
            logInfo(`Completed processing (skeleton mode)`, { videoId: urlInfo.videoId });
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
