/**
 * Video metadata extraction from ytInitialData
 * Per data-model.md: extract videoId, title, commentsCount from ytInitialData
 */

import type { VideoMetadata } from '../types/output.js';

/**
 * Extracts ytInitialData JSON from video page HTML
 * @param html - Raw HTML from the video page
 * @returns Parsed ytInitialData object or null if not found
 */
export function extractYtInitialData(html: string): Record<string, unknown> | null {
    // ytInitialData is embedded as a script variable in the page
    const patterns = [
        /var\s+ytInitialData\s*=\s*({.+?});\s*<\/script>/s,
        /window\["ytInitialData"\]\s*=\s*({.+?});\s*<\/script>/s,
        /ytInitialData\s*=\s*({.+?});\s*(?:var|<\/script>)/s,
    ];

    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
            try {
                return JSON.parse(match[1]) as Record<string, unknown>;
            } catch {
                // Try next pattern
            }
        }
    }

    return null;
}

/**
 * Extracts video title from ytInitialData
 */
export function extractVideoTitle(ytInitialData: Record<string, unknown>): string {
    try {
        // Path: contents.twoColumnWatchNextResults.results.results.contents[0].videoPrimaryInfoRenderer.title.runs[0].text
        const contents = (ytInitialData as Record<string, unknown>).contents as Record<string, unknown>;
        const twoColumn = contents?.twoColumnWatchNextResults as Record<string, unknown>;
        const results = twoColumn?.results as Record<string, unknown>;
        const resultsInner = results?.results as Record<string, unknown>;
        const contentsArray = resultsInner?.contents as Array<Record<string, unknown>>;

        if (contentsArray) {
            for (const item of contentsArray) {
                const primaryInfo = item?.videoPrimaryInfoRenderer as Record<string, unknown>;
                if (primaryInfo) {
                    const title = primaryInfo.title as Record<string, unknown>;
                    const runs = title?.runs as Array<{ text: string }>;
                    if (runs && runs[0]?.text) {
                        return runs[0].text;
                    }
                }
            }
        }

        // Fallback: try videoDetails
        const videoDetails = ytInitialData.videoDetails as Record<string, unknown>;
        if (videoDetails?.title) {
            return videoDetails.title as string;
        }

        // Fallback: try playerOverlays
        const playerOverlays = ytInitialData.playerOverlays as Record<string, unknown>;
        const playerOverlayRenderer = playerOverlays?.playerOverlayRenderer as Record<string, unknown>;
        const videoInfo = playerOverlayRenderer?.videoInfo as Record<string, unknown>;
        const runs = videoInfo?.runs as Array<{ text: string }>;
        if (runs && runs[0]?.text) {
            return runs[0].text;
        }
    } catch {
        // Return empty string on any error
    }

    return '';
}

/**
 * Extracts comment count from ytInitialData
 * Returns the count or null if not available
 */
export function extractCommentsCount(ytInitialData: Record<string, unknown>): number | null {
    try {
        // Path: contents.twoColumnWatchNextResults.results.results.contents[]
        //   .itemSectionRenderer.contents[].commentsEntryPointHeaderRenderer.commentCount.simpleText
        // or: engagementPanels[].engagementPanelSectionListRenderer.header
        //   .engagementPanelTitleHeaderRenderer.contextualInfo.runs[0].text
        const contents = (ytInitialData as Record<string, unknown>).contents as Record<string, unknown>;
        const twoColumn = contents?.twoColumnWatchNextResults as Record<string, unknown>;
        const results = twoColumn?.results as Record<string, unknown>;
        const resultsInner = results?.results as Record<string, unknown>;
        const contentsArray = resultsInner?.contents as Array<Record<string, unknown>>;

        if (contentsArray) {
            for (const item of contentsArray) {
                // Try itemSectionRenderer for comment count
                const itemSection = item?.itemSectionRenderer as Record<string, unknown>;
                if (itemSection) {
                    const sectionContents = itemSection.contents as Array<Record<string, unknown>>;
                    if (sectionContents) {
                        for (const content of sectionContents) {
                            const entryPoint = content?.commentsEntryPointHeaderRenderer as Record<string, unknown>;
                            if (entryPoint) {
                                const commentCount = entryPoint.commentCount as Record<string, unknown>;
                                if (commentCount?.simpleText) {
                                    return parseCommentCount(commentCount.simpleText as string);
                                }
                            }
                        }
                    }
                }
            }
        }

        // Try engagement panels
        const engagementPanels = ytInitialData.engagementPanels as Array<Record<string, unknown>>;
        if (engagementPanels) {
            for (const panel of engagementPanels) {
                const sectionList = panel?.engagementPanelSectionListRenderer as Record<string, unknown>;
                const header = sectionList?.header as Record<string, unknown>;
                const titleHeader = header?.engagementPanelTitleHeaderRenderer as Record<string, unknown>;
                const contextualInfo = titleHeader?.contextualInfo as Record<string, unknown>;
                const runs = contextualInfo?.runs as Array<{ text: string }>;
                if (runs && runs[0]?.text) {
                    const count = parseCommentCount(runs[0].text);
                    if (count !== null) {
                        return count;
                    }
                }
            }
        }
    } catch {
        // Return null on any error
    }

    return null;
}

/**
 * Parses a comment count string like "1,234 Comments" or "1.2K" into a number
 */
export function parseCommentCount(countStr: string): number | null {
    if (!countStr) return null;

    // Remove "Comments" text and whitespace
    const cleaned = countStr.replace(/comments?/i, '').trim();

    // Handle K/M/B suffixes
    const suffixMatch = cleaned.match(/^([\d,.]+)\s*([KMB])?$/i);
    if (suffixMatch) {
        const numStr = suffixMatch[1].replace(/,/g, '');
        const num = parseFloat(numStr);
        const suffix = suffixMatch[2]?.toUpperCase();

        if (Number.isNaN(num)) return null;

        switch (suffix) {
            case 'K':
                return Math.round(num * 1000);
            case 'M':
                return Math.round(num * 1000000);
            case 'B':
                return Math.round(num * 1000000000);
            default:
                return Math.round(num);
        }
    }

    // Try direct parse
    const directNum = parseInt(cleaned.replace(/,/g, ''), 10);
    return Number.isNaN(directNum) ? null : directNum;
}

/**
 * Extracts the initial comments continuation token from ytInitialData
 * This token is used to fetch the first batch of comments
 */
export function extractCommentsContinuationToken(ytInitialData: Record<string, unknown>): string | null {
    try {
        // Path: contents.twoColumnWatchNextResults.results.results.contents[]
        //   .itemSectionRenderer.contents[].continuationItemRenderer
        //   .continuationEndpoint.continuationCommand.token
        const contents = (ytInitialData as Record<string, unknown>).contents as Record<string, unknown>;
        const twoColumn = contents?.twoColumnWatchNextResults as Record<string, unknown>;
        const results = twoColumn?.results as Record<string, unknown>;
        const resultsInner = results?.results as Record<string, unknown>;
        const contentsArray = resultsInner?.contents as Array<Record<string, unknown>>;

        if (contentsArray) {
            for (const item of contentsArray) {
                const itemSection = item?.itemSectionRenderer as Record<string, unknown>;
                if (itemSection) {
                    const sectionContents = itemSection.contents as Array<Record<string, unknown>>;
                    if (sectionContents) {
                        for (const content of sectionContents) {
                            const continuation = content?.continuationItemRenderer as Record<string, unknown>;
                            if (continuation) {
                                const endpoint = continuation.continuationEndpoint as Record<string, unknown>;
                                const command = endpoint?.continuationCommand as Record<string, unknown>;
                                if (command?.token) {
                                    return command.token as string;
                                }
                            }
                        }
                    }
                }
            }
        }

        // Also check engagement panels for continuation
        const engagementPanels = ytInitialData.engagementPanels as Array<Record<string, unknown>>;
        if (engagementPanels) {
            for (const panel of engagementPanels) {
                const sectionList = panel?.engagementPanelSectionListRenderer as Record<string, unknown>;
                const content = sectionList?.content as Record<string, unknown>;
                const sectionListRenderer = content?.sectionListRenderer as Record<string, unknown>;
                const sectionContents = sectionListRenderer?.contents as Array<Record<string, unknown>>;

                if (sectionContents) {
                    for (const section of sectionContents) {
                        const itemSection = section?.itemSectionRenderer as Record<string, unknown>;
                        if (itemSection) {
                            const innerContents = itemSection.contents as Array<Record<string, unknown>>;
                            if (innerContents) {
                                for (const innerItem of innerContents) {
                                    const continuation = innerItem?.continuationItemRenderer as Record<string, unknown>;
                                    if (continuation) {
                                        const endpoint = continuation.continuationEndpoint as Record<string, unknown>;
                                        const command = endpoint?.continuationCommand as Record<string, unknown>;
                                        if (command?.token) {
                                            return command.token as string;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    } catch {
        // Return null on any error
    }

    return null;
}

/**
 * Extracts complete video metadata from HTML
 * @param html - Raw HTML from video page
 * @param videoId - Known video ID
 * @param originalUrl - Original input URL
 * @returns VideoMetadata object
 */
export function extractVideoMetadata(
    html: string,
    videoId: string,
    originalUrl: string,
): { metadata: VideoMetadata; continuationToken: string | null } | null {
    const ytInitialData = extractYtInitialData(html);
    if (!ytInitialData) {
        return null;
    }

    const title = extractVideoTitle(ytInitialData);
    const commentsCount = extractCommentsCount(ytInitialData);
    const continuationToken = extractCommentsContinuationToken(ytInitialData);

    return {
        metadata: {
            videoId,
            url: originalUrl,
            finalUrl: `https://www.youtube.com/watch?v=${videoId}`,
            title,
            commentsCount,
        },
        continuationToken,
    };
}

/**
 * Detects if comments are disabled for a video
 * @param ytInitialData - Parsed ytInitialData
 * @returns true if comments are disabled
 */
export function areCommentsDisabled(ytInitialData: Record<string, unknown>): boolean {
    try {
        // Check for "Comments are turned off" message
        const contents = (ytInitialData as Record<string, unknown>).contents as Record<string, unknown>;
        const twoColumn = contents?.twoColumnWatchNextResults as Record<string, unknown>;
        const results = twoColumn?.results as Record<string, unknown>;
        const resultsInner = results?.results as Record<string, unknown>;
        const contentsArray = resultsInner?.contents as Array<Record<string, unknown>>;

        if (contentsArray) {
            for (const item of contentsArray) {
                const itemSection = item?.itemSectionRenderer as Record<string, unknown>;
                if (itemSection) {
                    const sectionContents = itemSection.contents as Array<Record<string, unknown>>;
                    if (sectionContents) {
                        for (const content of sectionContents) {
                            const messageRenderer = content?.messageRenderer as Record<string, unknown>;
                            if (messageRenderer) {
                                const text = messageRenderer.text as Record<string, unknown>;
                                const runs = text?.runs as Array<{ text: string }>;
                                if (runs) {
                                    const message = runs.map((r) => r.text).join('').toLowerCase();
                                    if (
                                        message.includes('comments are turned off')
                                        || message.includes('comments disabled')
                                        || message.includes('comments have been disabled')
                                    ) {
                                        return true;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    } catch {
        // Return false on error - assume comments might be available
    }

    return false;
}
