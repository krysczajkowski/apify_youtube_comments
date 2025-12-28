/**
 * TypeScript types for Actor output, matching contracts/output-schema.json
 */

/**
 * Comment type discriminator
 */
export type CommentType = 'comment' | 'reply';

/**
 * Output schema for a single YouTube comment
 */
export interface CommentOutput {
    /** Unique comment identifier */
    cid: string;

    /** The comment text content */
    comment: string;

    /** Comment author display name (e.g., @username) */
    author: string;

    /** YouTube video identifier (11 characters) */
    videoId: string;

    /** Full URL to the YouTube video */
    pageUrl: string;

    /** Title of the YouTube video */
    title: string;

    /** Total number of comments on the video */
    commentsCount: number;

    /** Number of likes on this comment */
    voteCount: number;

    /** Number of replies to this comment */
    replyCount: number;

    /** True if the comment author is the video creator */
    authorIsChannelOwner: boolean;

    /** True if the video creator liked this comment */
    hasCreatorHeart: boolean;

    /** Whether this is a top-level comment or a reply */
    type: CommentType;

    /** Parent comment ID for replies, null for top-level comments */
    replyToCid: string | null;

    /** When the comment was posted (relative format, e.g., '2 days ago') */
    date: string;
}

/**
 * Video metadata extracted from the page
 */
export interface VideoMetadata {
    /** YouTube video identifier */
    videoId: string;

    /** Original input URL */
    url: string;

    /** Canonical URL after normalization */
    finalUrl: string;

    /** Video title */
    title: string;

    /** Total comment count (if available) */
    commentsCount: number | null;
}
