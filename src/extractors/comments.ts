/**
 * Comment data extraction from InnerTube API responses
 * Per data-model.md: parse commentRenderer to output schema fields
 */

import type { CommentOutput, CommentType, VideoMetadata } from '../types/output.js';

/**
 * Raw comment renderer from InnerTube API (legacy format)
 */
interface CommentRenderer {
    commentId?: string;
    contentText?: {
        runs?: Array<{ text: string }>;
        simpleText?: string;
    };
    authorText?: {
        simpleText?: string;
        runs?: Array<{ text: string }>;
    };
    voteCount?: {
        simpleText?: string;
        runs?: Array<{ text: string }>;
    };
    replyCount?: number;
    authorIsChannelOwner?: boolean;
    actionButtons?: {
        commentActionButtonsRenderer?: {
            creatorHeart?: Record<string, unknown>;
        };
    };
    publishedTimeText?: {
        runs?: Array<{ text: string }>;
        simpleText?: string;
    };
}

/**
 * T012: New commentEntityPayload format from InnerTube API
 * Per research.md: YouTube is transitioning to entity-based payloads (May 2024 yt-dlp fix)
 */
interface CommentEntityPayload {
    properties?: {
        commentId?: string;
        content?: {
            content?: string;
        };
        publishedTime?: string;
    };
    author?: {
        displayName?: string;
        channelId?: string;
        isCreator?: boolean;
    };
    toolbar?: {
        likeCountA11y?: string;
        likeCountLiked?: string;
        replyCount?: string;
    };
    engagement?: {
        likeCount?: number;
    };
}

/**
 * Comment thread structure from InnerTube
 */
interface CommentThreadRenderer {
    comment?: {
        commentRenderer?: CommentRenderer;
    };
    replies?: {
        commentRepliesRenderer?: {
            contents?: Array<{
                continuationItemRenderer?: {
                    continuationEndpoint?: {
                        continuationCommand?: {
                            token?: string;
                        };
                    };
                };
            }>;
        };
    };
}

/**
 * Extracts comment text from contentText structure
 */
function extractCommentText(contentText?: CommentRenderer['contentText']): string {
    if (!contentText) return '';

    // Try runs array first (more common)
    if (contentText.runs) {
        return contentText.runs.map((run) => run.text).join('');
    }

    // Fallback to simpleText
    if (contentText.simpleText) {
        return contentText.simpleText;
    }

    return '';
}

/**
 * Extracts author name from authorText structure
 */
function extractAuthorName(authorText?: CommentRenderer['authorText']): string {
    if (!authorText) return '';

    if (authorText.simpleText) {
        return authorText.simpleText;
    }

    if (authorText.runs) {
        return authorText.runs.map((run) => run.text).join('');
    }

    return '';
}

/**
 * Parses vote count from various formats
 * Examples: "1.2K", "234", "1,234"
 */
function parseVoteCount(voteCount?: CommentRenderer['voteCount']): number {
    if (!voteCount) return 0;

    const text = voteCount.simpleText || voteCount.runs?.map((r) => r.text).join('') || '';
    if (!text) return 0;

    const cleaned = text.trim();

    // Handle K/M suffixes
    const suffixMatch = cleaned.match(/^([\d,.]+)\s*([KMB])?$/i);
    if (suffixMatch) {
        const numStr = suffixMatch[1].replace(/,/g, '');
        const num = parseFloat(numStr);
        const suffix = suffixMatch[2]?.toUpperCase();

        if (Number.isNaN(num)) return 0;

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
    return Number.isNaN(directNum) ? 0 : directNum;
}

/**
 * Extracts publish date from publishedTimeText
 */
function extractPublishDate(publishedTimeText?: CommentRenderer['publishedTimeText']): string {
    if (!publishedTimeText) return '';

    if (publishedTimeText.runs && publishedTimeText.runs[0]) {
        return publishedTimeText.runs[0].text;
    }

    if (publishedTimeText.simpleText) {
        return publishedTimeText.simpleText;
    }

    return '';
}

/**
 * Checks if creator has hearted this comment
 */
function hasCreatorHeart(actionButtons?: CommentRenderer['actionButtons']): boolean {
    return !!actionButtons?.commentActionButtonsRenderer?.creatorHeart;
}

/**
 * T013: Extracts vote count from toolbar.likeCountA11y in new format
 * Per research.md: likeCountA11y contains text like "123 likes"
 * Per data-model.md: Parse accessibility text to extract numeric count
 */
function parseVoteCountFromA11y(a11yText?: string): number {
    if (!a11yText) return 0;

    // Pattern: "123 likes", "1.2K likes", "No likes", etc.
    const match = a11yText.match(/([\d,.]+[KMB]?)\s*like/i);
    if (match) {
        const cleaned = match[1].trim();

        // Handle K/M/B suffixes
        const suffixMatch = cleaned.match(/^([\d,.]+)\s*([KMB])?$/i);
        if (suffixMatch) {
            const numStr = suffixMatch[1].replace(/,/g, '');
            const num = parseFloat(numStr);
            const suffix = suffixMatch[2]?.toUpperCase();

            if (Number.isNaN(num)) return 0;

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
    }

    // Try extracting just numbers if no "like" pattern found
    const numbersOnly = a11yText.replace(/[^0-9KMB,.]/gi, '').trim();
    if (numbersOnly) {
        const suffixMatch = numbersOnly.match(/^([\d,.]+)\s*([KMB])?$/i);
        if (suffixMatch) {
            const numStr = suffixMatch[1].replace(/,/g, '');
            const num = parseFloat(numStr);
            const suffix = suffixMatch[2]?.toUpperCase();

            if (!Number.isNaN(num)) {
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
        }
    }

    return 0;
}

/**
 * T012: Extracts a comment from new commentEntityPayload format
 * Per research.md: New format has properties.commentId, properties.content.content, author.displayName, etc.
 */
function extractCommentFromEntityPayload(
    payload: CommentEntityPayload,
    metadata: VideoMetadata,
    type: CommentType = 'comment',
    parentCid: string | null = null,
): CommentOutput | null {
    const cid = payload.properties?.commentId;
    if (!cid) return null;

    const comment = payload.properties?.content?.content ?? '';
    const author = payload.author?.displayName ?? '';

    // Both comment text and author are required
    if (!author) return null;

    // Parse vote count from toolbar.likeCountA11y (T013)
    const voteCount = parseVoteCountFromA11y(payload.toolbar?.likeCountA11y)
        || (payload.engagement?.likeCount ?? 0);

    // Parse reply count from toolbar
    const replyCountStr = payload.toolbar?.replyCount ?? '0';
    const replyCount = parseInt(replyCountStr.replace(/,/g, ''), 10) || 0;

    return {
        cid,
        comment,
        author,
        videoId: metadata.videoId,
        pageUrl: metadata.finalUrl,
        title: metadata.title,
        commentsCount: metadata.commentsCount ?? 0,
        voteCount,
        replyCount,
        authorIsChannelOwner: payload.author?.isCreator ?? false,
        hasCreatorHeart: false, // Not available in entity payload format
        type,
        replyToCid: parentCid,
        date: payload.properties?.publishedTime ?? '',
    };
}

/**
 * Extracts a single comment from commentRenderer
 * @param renderer - Raw commentRenderer object
 * @param metadata - Video metadata for context
 * @param type - Whether this is a top-level comment or reply
 * @param parentCid - Parent comment ID for replies
 * @returns Parsed CommentOutput or null if invalid
 */
export function extractComment(
    renderer: CommentRenderer,
    metadata: VideoMetadata,
    type: CommentType = 'comment',
    parentCid: string | null = null,
): CommentOutput | null {
    const cid = renderer.commentId;
    if (!cid) return null;

    const comment = extractCommentText(renderer.contentText);
    const author = extractAuthorName(renderer.authorText);

    // Both comment text and author are required
    if (!comment || !author) return null;

    return {
        cid,
        comment,
        author,
        videoId: metadata.videoId,
        pageUrl: metadata.finalUrl,
        title: metadata.title,
        commentsCount: metadata.commentsCount ?? 0,
        voteCount: parseVoteCount(renderer.voteCount),
        replyCount: renderer.replyCount ?? 0,
        authorIsChannelOwner: renderer.authorIsChannelOwner ?? false,
        hasCreatorHeart: hasCreatorHeart(renderer.actionButtons),
        type,
        replyToCid: parentCid,
        date: extractPublishDate(renderer.publishedTimeText),
    };
}

/**
 * Extracts reply continuation token from comment thread
 */
export function extractReplyContinuationToken(
    replies?: CommentThreadRenderer['replies'],
): string | null {
    if (!replies?.commentRepliesRenderer?.contents) return null;

    for (const content of replies.commentRepliesRenderer.contents) {
        const token = content?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
        if (token) return token;
    }

    return null;
}

/**
 * Result of parsing comments from API response
 */
export interface ParseCommentsResult {
    /** Extracted comments */
    comments: CommentOutput[];
    /** Continuation token for next page, null if no more */
    nextContinuationToken: string | null;
    /** Reply continuation tokens keyed by parent comment ID */
    replyContinuationTokens: Map<string, string>;
}

/**
 * T014: Extracts comments from frameworkUpdates.entityBatchUpdate.mutations
 * Per research.md: New format stores comments in entityBatchUpdate.mutations[].payload.commentEntityPayload
 */
function extractFromFrameworkUpdates(
    response: Record<string, unknown>,
    metadata: VideoMetadata,
    existingIds: Set<string>,
): CommentOutput[] {
    const comments: CommentOutput[] = [];

    try {
        const frameworkUpdates = response.frameworkUpdates as Record<string, unknown>;
        const entityBatchUpdate = frameworkUpdates?.entityBatchUpdate as Record<string, unknown>;
        const mutations = entityBatchUpdate?.mutations as Array<Record<string, unknown>>;

        if (!mutations || !Array.isArray(mutations)) {
            return comments;
        }

        for (const mutation of mutations) {
            const payload = mutation?.payload as Record<string, unknown>;
            const commentEntity = payload?.commentEntityPayload as CommentEntityPayload;

            if (commentEntity?.properties?.commentId) {
                // Skip if we already have this comment from legacy format
                if (existingIds.has(commentEntity.properties.commentId)) {
                    continue;
                }

                const comment = extractCommentFromEntityPayload(commentEntity, metadata, 'comment', null);
                if (comment) {
                    comments.push(comment);
                    existingIds.add(comment.cid);
                }
            }
        }
    } catch {
        // Return what we have on error
    }

    return comments;
}

/**
 * Parses comments from InnerTube API response
 * Per T014: Check both legacy format and frameworkUpdates.entityBatchUpdate.mutations
 * @param response - Raw API response
 * @param metadata - Video metadata for context
 * @returns Parsed comments and continuation info
 */
export function parseCommentsFromResponse(
    response: Record<string, unknown>,
    metadata: VideoMetadata,
): ParseCommentsResult {
    const comments: CommentOutput[] = [];
    let nextContinuationToken: string | null = null;
    const replyContinuationTokens = new Map<string, string>();
    const seenIds = new Set<string>();

    try {
        // Extract from onResponseReceivedEndpoints (legacy format)
        const endpoints = response.onResponseReceivedEndpoints as Array<Record<string, unknown>> | undefined;

        if (endpoints) {
            for (const endpoint of endpoints) {
                // Try reloadContinuationItemsCommand (for initial load)
                const reloadCommand = endpoint.reloadContinuationItemsCommand as Record<string, unknown>;
                if (reloadCommand?.continuationItems) {
                    const items = reloadCommand.continuationItems as Array<Record<string, unknown>>;
                    processCommentItems(items, metadata, comments, replyContinuationTokens, (token) => {
                        nextContinuationToken = token;
                    });
                }

                // Try appendContinuationItemsAction (for pagination)
                const appendAction = endpoint.appendContinuationItemsAction as Record<string, unknown>;
                if (appendAction?.continuationItems) {
                    const items = appendAction.continuationItems as Array<Record<string, unknown>>;
                    processCommentItems(items, metadata, comments, replyContinuationTokens, (token) => {
                        nextContinuationToken = token;
                    });
                }
            }
        }

        // Track IDs we already have
        for (const comment of comments) {
            seenIds.add(comment.cid);
        }

        // T014: Also check frameworkUpdates for new format (may have additional/richer data)
        const entityComments = extractFromFrameworkUpdates(response, metadata, seenIds);
        comments.push(...entityComments);
    } catch {
        // Return what we have on error
    }

    return { comments, nextContinuationToken, replyContinuationTokens };
}

/**
 * Processes comment items array from API response
 */
function processCommentItems(
    items: Array<Record<string, unknown>>,
    metadata: VideoMetadata,
    comments: CommentOutput[],
    replyContinuationTokens: Map<string, string>,
    onContinuationToken: (token: string) => void,
): void {
    for (const item of items) {
        // Comment thread
        const commentThread = item.commentThreadRenderer as CommentThreadRenderer;
        if (commentThread?.comment?.commentRenderer) {
            const comment = extractComment(
                commentThread.comment.commentRenderer as CommentRenderer,
                metadata,
                'comment',
                null,
            );
            if (comment) {
                comments.push(comment);

                // Check for reply continuation
                const replyToken = extractReplyContinuationToken(commentThread.replies);
                if (replyToken && comment.replyCount > 0) {
                    replyContinuationTokens.set(comment.cid, replyToken);
                }
            }
        }

        // Continuation item (for next page)
        const continuation = item.continuationItemRenderer as Record<string, unknown>;
        if (continuation) {
            const endpoint = continuation.continuationEndpoint as Record<string, unknown>;
            const command = endpoint?.continuationCommand as Record<string, unknown>;
            const token = command?.token as string;
            if (token) {
                onContinuationToken(token);
            }

            // Also check button path
            const button = continuation.button as Record<string, unknown>;
            const buttonRenderer = button?.buttonRenderer as Record<string, unknown>;
            const buttonCommand = buttonRenderer?.command as Record<string, unknown>;
            const buttonContinuation = buttonCommand?.continuationCommand as Record<string, unknown>;
            const buttonToken = buttonContinuation?.token as string;
            if (buttonToken) {
                onContinuationToken(buttonToken);
            }
        }
    }
}

/**
 * Parses replies from InnerTube API response
 * @param response - Raw API response
 * @param metadata - Video metadata for context
 * @param parentCid - Parent comment ID
 * @returns Parsed replies and continuation info
 */
export function parseRepliesFromResponse(
    response: Record<string, unknown>,
    metadata: VideoMetadata,
    parentCid: string,
): { replies: CommentOutput[]; nextContinuationToken: string | null } {
    const replies: CommentOutput[] = [];
    let nextContinuationToken: string | null = null;

    try {
        const endpoints = response.onResponseReceivedEndpoints as Array<Record<string, unknown>> | undefined;

        if (!endpoints) {
            return { replies, nextContinuationToken };
        }

        for (const endpoint of endpoints) {
            // Try appendContinuationItemsAction
            const appendAction = endpoint.appendContinuationItemsAction as Record<string, unknown>;
            if (appendAction?.continuationItems) {
                const items = appendAction.continuationItems as Array<Record<string, unknown>>;

                for (const item of items) {
                    // Reply comment
                    const commentRenderer = item.commentRenderer as CommentRenderer;
                    if (commentRenderer) {
                        const reply = extractComment(commentRenderer, metadata, 'reply', parentCid);
                        if (reply) {
                            replies.push(reply);
                        }
                    }

                    // Continuation for more replies
                    const continuation = item.continuationItemRenderer as Record<string, unknown>;
                    if (continuation) {
                        const ep = continuation.continuationEndpoint as Record<string, unknown>;
                        const cmd = ep?.continuationCommand as Record<string, unknown>;
                        const token = cmd?.token as string;
                        if (token) {
                            nextContinuationToken = token;
                        }

                        // Button path
                        const button = continuation.button as Record<string, unknown>;
                        const buttonRenderer = button?.buttonRenderer as Record<string, unknown>;
                        const buttonCommand = buttonRenderer?.command as Record<string, unknown>;
                        const buttonContinuation = buttonCommand?.continuationCommand as Record<string, unknown>;
                        const buttonToken = buttonContinuation?.token as string;
                        if (buttonToken) {
                            nextContinuationToken = buttonToken;
                        }
                    }
                }
            }
        }
    } catch {
        // Return what we have on error
    }

    return { replies, nextContinuationToken };
}

/**
 * Validates that a comment output has all required fields with correct types
 * Per T029/T030: Verify output schema compliance
 */
export function validateCommentOutput(comment: CommentOutput): boolean {
    // Check all 14 required fields exist and have correct types
    if (typeof comment.cid !== 'string' || !comment.cid) return false;
    if (typeof comment.comment !== 'string') return false;
    if (typeof comment.author !== 'string' || !comment.author) return false;
    if (typeof comment.videoId !== 'string' || !comment.videoId) return false;
    if (typeof comment.pageUrl !== 'string' || !comment.pageUrl) return false;
    if (typeof comment.title !== 'string') return false;
    if (typeof comment.commentsCount !== 'number') return false;
    if (typeof comment.voteCount !== 'number') return false;
    if (typeof comment.replyCount !== 'number') return false;
    if (typeof comment.authorIsChannelOwner !== 'boolean') return false;
    if (typeof comment.hasCreatorHeart !== 'boolean') return false;
    if (comment.type !== 'comment' && comment.type !== 'reply') return false;
    if (comment.replyToCid !== null && typeof comment.replyToCid !== 'string') return false;
    if (typeof comment.date !== 'string') return false;

    return true;
}

/**
 * Ensures comment output has no missing required fields
 * Applies defaults where safe to do so
 * Per T030: null/undefined handling
 */
export function sanitizeCommentOutput(comment: Partial<CommentOutput>): CommentOutput | null {
    // Required fields that cannot be defaulted
    if (!comment.cid || !comment.author || !comment.videoId || !comment.pageUrl) {
        return null;
    }

    return {
        cid: comment.cid,
        comment: comment.comment ?? '',
        author: comment.author,
        videoId: comment.videoId,
        pageUrl: comment.pageUrl,
        title: comment.title ?? '',
        commentsCount: comment.commentsCount ?? 0,
        voteCount: comment.voteCount ?? 0,
        replyCount: comment.replyCount ?? 0,
        authorIsChannelOwner: comment.authorIsChannelOwner ?? false,
        hasCreatorHeart: comment.hasCreatorHeart ?? false,
        type: comment.type ?? 'comment',
        replyToCid: comment.replyToCid ?? null,
        date: comment.date ?? '',
    };
}
