/**
 * Unit tests for src/extractors/comments.ts
 * Per data-model.md: Vote Count Parsing Test Cases
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
    extractComment,
    parseCommentsFromResponse,
    extractReplyContinuationToken,
    validateCommentOutput,
    sanitizeCommentOutput,
} from '../../src/extractors/comments.js';
import type { VideoMetadata } from '../../src/types/output.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load fixtures
const legacyResponse = JSON.parse(
    readFileSync(join(__dirname, '../fixtures/comments-legacy.json'), 'utf-8'),
);
const entityResponse = JSON.parse(
    readFileSync(join(__dirname, '../fixtures/comments-entity.json'), 'utf-8'),
);

// Test metadata
const testMetadata: VideoMetadata = {
    videoId: 'dQw4w9WgXcQ',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    finalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)',
    commentsCount: 3200000,
};

describe('extractComment', () => {
    it('should extract comment from commentRenderer with runs format', () => {
        const renderer = {
            commentId: 'test123',
            contentText: {
                runs: [{ text: 'This is a test comment' }],
            },
            authorText: {
                simpleText: '@test_user',
            },
            voteCount: {
                simpleText: '100',
            },
            replyCount: 5,
            authorIsChannelOwner: false,
            publishedTimeText: {
                runs: [{ text: '2 days ago' }],
            },
        };

        const comment = extractComment(renderer, testMetadata);

        expect(comment).not.toBeNull();
        expect(comment!.cid).toBe('test123');
        expect(comment!.comment).toBe('This is a test comment');
        expect(comment!.author).toBe('@test_user');
        expect(comment!.voteCount).toBe(100);
        expect(comment!.replyCount).toBe(5);
        expect(comment!.authorIsChannelOwner).toBe(false);
        expect(comment!.type).toBe('comment');
        expect(comment!.replyToCid).toBeNull();
        expect(comment!.date).toBe('2 days ago');
    });

    it('should extract comment from commentRenderer with simpleText format', () => {
        const renderer = {
            commentId: 'test456',
            contentText: {
                simpleText: 'Simple text comment',
            },
            authorText: {
                simpleText: '@another_user',
            },
            voteCount: {
                simpleText: '50',
            },
            replyCount: 0,
            authorIsChannelOwner: true,
            publishedTimeText: {
                simpleText: '1 week ago',
            },
        };

        const comment = extractComment(renderer, testMetadata);

        expect(comment).not.toBeNull();
        expect(comment!.comment).toBe('Simple text comment');
        expect(comment!.authorIsChannelOwner).toBe(true);
        expect(comment!.date).toBe('1 week ago');
    });

    it('should detect creator heart', () => {
        const renderer = {
            commentId: 'hearted123',
            contentText: { runs: [{ text: 'Loved this!' }] },
            authorText: { simpleText: '@fan' },
            actionButtons: {
                commentActionButtonsRenderer: {
                    creatorHeart: { exists: true },
                },
            },
        };

        const comment = extractComment(renderer, testMetadata);
        expect(comment!.hasCreatorHeart).toBe(true);
    });

    it('should return null for missing commentId', () => {
        const renderer = {
            contentText: { runs: [{ text: 'No ID' }] },
            authorText: { simpleText: '@user' },
        };

        const comment = extractComment(renderer, testMetadata);
        expect(comment).toBeNull();
    });

    it('should return null for missing author', () => {
        const renderer = {
            commentId: 'noauthor123',
            contentText: { runs: [{ text: 'No author' }] },
        };

        const comment = extractComment(renderer, testMetadata);
        expect(comment).toBeNull();
    });

    it('should handle reply type', () => {
        const renderer = {
            commentId: 'reply123',
            contentText: { runs: [{ text: 'This is a reply' }] },
            authorText: { simpleText: '@replier' },
        };

        const comment = extractComment(renderer, testMetadata, 'reply', 'parent123');

        expect(comment).not.toBeNull();
        expect(comment!.type).toBe('reply');
        expect(comment!.replyToCid).toBe('parent123');
    });

    it('should include video metadata in output', () => {
        const renderer = {
            commentId: 'meta123',
            contentText: { runs: [{ text: 'Test' }] },
            authorText: { simpleText: '@user' },
        };

        const comment = extractComment(renderer, testMetadata);

        expect(comment!.videoId).toBe('dQw4w9WgXcQ');
        expect(comment!.pageUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        expect(comment!.title).toBe('Rick Astley - Never Gonna Give You Up (Official Music Video)');
        expect(comment!.commentsCount).toBe(3200000);
    });
});

describe('parseCommentsFromResponse - Vote Count Parsing', () => {
    // Per data-model.md: Vote Count Parsing Test Cases
    it('should parse K suffix (1.2K = 1200)', () => {
        const result = parseCommentsFromResponse(legacyResponse, testMetadata);
        const comment = result.comments.find((c) => c.cid === 'UgzTest1CommentId123');
        expect(comment?.voteCount).toBe(1200);
    });

    it('should parse plain number (234)', () => {
        const result = parseCommentsFromResponse(legacyResponse, testMetadata);
        const comment = result.comments.find((c) => c.cid === 'UgzTest2CommentId456');
        expect(comment?.voteCount).toBe(234);
    });

    it('should parse K suffix with larger number (45K = 45000)', () => {
        const result = parseCommentsFromResponse(legacyResponse, testMetadata);
        const comment = result.comments.find((c) => c.cid === 'UgzTest3OwnerComment789');
        expect(comment?.voteCount).toBe(45000);
    });

    it('should parse zero vote count', () => {
        const result = parseCommentsFromResponse(legacyResponse, testMetadata);
        const comment = result.comments.find((c) => c.cid === 'UgzTest4NoReplies000');
        expect(comment?.voteCount).toBe(0);
    });

    it('should parse M suffix (2.5M = 2500000)', () => {
        const result = parseCommentsFromResponse(legacyResponse, testMetadata);
        const comment = result.comments.find((c) => c.cid === 'UgzTest5MillionLikes');
        expect(comment?.voteCount).toBe(2500000);
    });
});

describe('parseCommentsFromResponse - Legacy Format', () => {
    it('should extract comments from reloadContinuationItemsCommand', () => {
        const result = parseCommentsFromResponse(legacyResponse, testMetadata);

        expect(result.comments.length).toBeGreaterThanOrEqual(5);
    });

    it('should extract continuation token', () => {
        const result = parseCommentsFromResponse(legacyResponse, testMetadata);

        expect(result.nextContinuationToken).toBeTruthy();
        expect(result.nextContinuationToken).toContain('Eg0SC2RRdzR3OVdnWGNR');
    });

    it('should extract reply continuation tokens', () => {
        const result = parseCommentsFromResponse(legacyResponse, testMetadata);

        // Comments with replies should have continuation tokens
        expect(result.replyContinuationTokens.size).toBeGreaterThan(0);
        expect(result.replyContinuationTokens.has('UgzTest1CommentId123')).toBe(true);
    });

    it('should detect channel owner comments', () => {
        const result = parseCommentsFromResponse(legacyResponse, testMetadata);
        const ownerComment = result.comments.find((c) => c.cid === 'UgzTest3OwnerComment789');

        expect(ownerComment?.authorIsChannelOwner).toBe(true);
        expect(ownerComment?.author).toBe('Rick Astley');
    });

    it('should detect creator heart', () => {
        const result = parseCommentsFromResponse(legacyResponse, testMetadata);
        const heartedComment = result.comments.find((c) => c.cid === 'UgzTest2CommentId456');

        expect(heartedComment?.hasCreatorHeart).toBe(true);
    });
});

describe('parseCommentsFromResponse - Entity Format (frameworkUpdates)', () => {
    it('should extract comments from frameworkUpdates.entityBatchUpdate.mutations', () => {
        const result = parseCommentsFromResponse(entityResponse, testMetadata);

        // Should find entity format comments
        const entityComment = result.comments.find((c) => c.cid === 'UgzEntityPayload1XYZ');
        expect(entityComment).toBeDefined();
        expect(entityComment?.comment).toBe('This comment uses the new entity payload format!');
        expect(entityComment?.author).toBe('@entity_format_user');
    });

    it('should parse vote count from likeCountA11y in entity format', () => {
        const result = parseCommentsFromResponse(entityResponse, testMetadata);

        // 500 likes
        const comment500 = result.comments.find((c) => c.cid === 'UgzEntityPayload1XYZ');
        expect(comment500?.voteCount).toBe(500);

        // 2.5K likes
        const commentK = result.comments.find((c) => c.cid === 'UgzEntityPayload2ABC');
        expect(commentK?.voteCount).toBe(2500);

        // 100K likes
        const comment100K = result.comments.find((c) => c.cid === 'UgzEntityPayload3Creator');
        expect(comment100K?.voteCount).toBe(100000);

        // 1.5M likes
        const commentM = result.comments.find((c) => c.cid === 'UgzEntityPayload5Million');
        expect(commentM?.voteCount).toBe(1500000);
    });

    it('should handle "No likes" in entity format', () => {
        const result = parseCommentsFromResponse(entityResponse, testMetadata);
        const noLikesComment = result.comments.find((c) => c.cid === 'UgzEntityPayload4NoLikes');

        // Should fall back to engagement.likeCount which is 0
        expect(noLikesComment?.voteCount).toBe(0);
    });

    it('should detect creator in entity format', () => {
        const result = parseCommentsFromResponse(entityResponse, testMetadata);
        const creatorComment = result.comments.find((c) => c.cid === 'UgzEntityPayload3Creator');

        expect(creatorComment?.authorIsChannelOwner).toBe(true);
        expect(creatorComment?.author).toBe('Rick Astley');
    });

    it('should not duplicate comments between legacy and entity formats', () => {
        const result = parseCommentsFromResponse(entityResponse, testMetadata);

        // Legacy format comment should appear only once
        const legacyComments = result.comments.filter((c) => c.cid === 'UgzEntity1CommentABC');
        expect(legacyComments.length).toBe(1);
    });
});

describe('extractReplyContinuationToken', () => {
    it('should extract token from replies structure', () => {
        const replies = {
            commentRepliesRenderer: {
                contents: [
                    {
                        continuationItemRenderer: {
                            continuationEndpoint: {
                                continuationCommand: {
                                    token: 'reply_token_123',
                                },
                            },
                        },
                    },
                ],
            },
        };

        const token = extractReplyContinuationToken(replies);
        expect(token).toBe('reply_token_123');
    });

    it('should return null for undefined replies', () => {
        expect(extractReplyContinuationToken(undefined)).toBeNull();
    });

    it('should return null for empty contents', () => {
        const replies = {
            commentRepliesRenderer: {
                contents: [],
            },
        };

        expect(extractReplyContinuationToken(replies)).toBeNull();
    });
});

describe('validateCommentOutput', () => {
    it('should validate a complete comment output', () => {
        const comment = {
            cid: 'test123',
            comment: 'Test comment',
            author: '@user',
            videoId: 'dQw4w9WgXcQ',
            pageUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            title: 'Test Video',
            commentsCount: 100,
            voteCount: 10,
            replyCount: 5,
            authorIsChannelOwner: false,
            hasCreatorHeart: false,
            type: 'comment' as const,
            replyToCid: null,
            date: '2 days ago',
        };

        expect(validateCommentOutput(comment)).toBe(true);
    });

    it('should reject comment with missing cid', () => {
        const comment = {
            cid: '',
            comment: 'Test',
            author: '@user',
            videoId: 'abc',
            pageUrl: 'https://youtube.com/watch?v=abc',
            title: 'Test',
            commentsCount: 0,
            voteCount: 0,
            replyCount: 0,
            authorIsChannelOwner: false,
            hasCreatorHeart: false,
            type: 'comment' as const,
            replyToCid: null,
            date: '',
        };

        expect(validateCommentOutput(comment)).toBe(false);
    });

    it('should reject comment with missing author', () => {
        const comment = {
            cid: 'test123',
            comment: 'Test',
            author: '',
            videoId: 'abc',
            pageUrl: 'https://youtube.com/watch?v=abc',
            title: 'Test',
            commentsCount: 0,
            voteCount: 0,
            replyCount: 0,
            authorIsChannelOwner: false,
            hasCreatorHeart: false,
            type: 'comment' as const,
            replyToCid: null,
            date: '',
        };

        expect(validateCommentOutput(comment)).toBe(false);
    });

    it('should validate reply type with replyToCid', () => {
        const comment = {
            cid: 'reply123',
            comment: 'This is a reply',
            author: '@replier',
            videoId: 'dQw4w9WgXcQ',
            pageUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            title: 'Test Video',
            commentsCount: 100,
            voteCount: 5,
            replyCount: 0,
            authorIsChannelOwner: false,
            hasCreatorHeart: false,
            type: 'reply' as const,
            replyToCid: 'parent123',
            date: '1 hour ago',
        };

        expect(validateCommentOutput(comment)).toBe(true);
    });
});

describe('sanitizeCommentOutput', () => {
    it('should apply defaults to missing optional fields', () => {
        const partial = {
            cid: 'test123',
            author: '@user',
            videoId: 'abc',
            pageUrl: 'https://youtube.com/watch?v=abc',
        };

        const sanitized = sanitizeCommentOutput(partial);

        expect(sanitized).not.toBeNull();
        expect(sanitized!.comment).toBe('');
        expect(sanitized!.title).toBe('');
        expect(sanitized!.commentsCount).toBe(0);
        expect(sanitized!.voteCount).toBe(0);
        expect(sanitized!.replyCount).toBe(0);
        expect(sanitized!.authorIsChannelOwner).toBe(false);
        expect(sanitized!.hasCreatorHeart).toBe(false);
        expect(sanitized!.type).toBe('comment');
        expect(sanitized!.replyToCid).toBeNull();
        expect(sanitized!.date).toBe('');
    });

    it('should return null for missing required fields', () => {
        expect(sanitizeCommentOutput({ cid: 'test' })).toBeNull();
        expect(sanitizeCommentOutput({ author: '@user' })).toBeNull();
        expect(sanitizeCommentOutput({ videoId: 'abc' })).toBeNull();
        expect(sanitizeCommentOutput({ pageUrl: 'https://example.com' })).toBeNull();
    });

    it('should preserve provided values', () => {
        const partial = {
            cid: 'test123',
            comment: 'Hello',
            author: '@user',
            videoId: 'abc',
            pageUrl: 'https://youtube.com/watch?v=abc',
            title: 'My Video',
            voteCount: 42,
        };

        const sanitized = sanitizeCommentOutput(partial);

        expect(sanitized!.comment).toBe('Hello');
        expect(sanitized!.title).toBe('My Video');
        expect(sanitized!.voteCount).toBe(42);
    });
});
