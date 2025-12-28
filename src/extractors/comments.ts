/**
 * Comment data extraction from InnerTube API responses
 * Per data-model.md: parse commentRenderer to output schema fields
 */

import type { CommentOutput, CommentType, VideoMetadata } from '../types/output.js';

/**
 * Raw comment renderer from InnerTube API
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

        if (isNaN(num)) return 0;

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
    return isNaN(directNum) ? 0 : directNum;
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
    parentCid: string | null = null
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
    replies?: CommentThreadRenderer['replies']
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
 * Parses comments from InnerTube API response
 * @param response - Raw API response
 * @param metadata - Video metadata for context
 * @returns Parsed comments and continuation info
 */
export function parseCommentsFromResponse(
    response: Record<string, unknown>,
    metadata: VideoMetadata
): ParseCommentsResult {
    const comments: CommentOutput[] = [];
    let nextContinuationToken: string | null = null;
    const replyContinuationTokens = new Map<string, string>();

    try {
        // Extract from onResponseReceivedEndpoints
        const endpoints = response.onResponseReceivedEndpoints as Array<Record<string, unknown>> | undefined;

        if (!endpoints) {
            return { comments, nextContinuationToken, replyContinuationTokens };
        }

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
    onContinuationToken: (token: string) => void
): void {
    for (const item of items) {
        // Comment thread
        const commentThread = item.commentThreadRenderer as CommentThreadRenderer;
        if (commentThread?.comment?.commentRenderer) {
            const comment = extractComment(
                commentThread.comment.commentRenderer as CommentRenderer,
                metadata,
                'comment',
                null
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
    parentCid: string
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
