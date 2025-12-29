/**
 * Integration tests for the YouTube Comments Scraper Actor
 * Per research.md: Uses recorded responses for CI stability
 *
 * These tests verify the complete flow from input validation
 * through comment extraction using fixture data.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Import modules to test
import { validateYouTubeUrl, validateUrls } from '../../src/utils/url.js';
import { extractVideoMetadata } from '../../src/extractors/metadata.js';
import { parseCommentsFromResponse } from '../../src/extractors/comments.js';
import type { VideoMetadata } from '../../src/types/output.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load all fixtures
const videoPageHtml = readFileSync(join(__dirname, '../fixtures/video-page.html'), 'utf-8');
const legacyResponse = JSON.parse(
    readFileSync(join(__dirname, '../fixtures/comments-legacy.json'), 'utf-8'),
);
const entityResponse = JSON.parse(
    readFileSync(join(__dirname, '../fixtures/comments-entity.json'), 'utf-8'),
);

describe('Actor Integration - Complete Flow', () => {
    describe('Input Validation Flow', () => {
        it('should validate and normalize a batch of mixed URLs', () => {
            const urls = [
                'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'https://youtu.be/9bZkp7q19f0',
                'https://www.youtube.com/shorts/abcdefghijk',
                'invalid-url',
                'https://www.google.com',
            ];

            const result = validateUrls(urls);

            expect(result.valid).toHaveLength(3);
            expect(result.invalid).toHaveLength(2);

            // Verify normalization
            expect(result.valid[0].normalizedUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
            expect(result.valid[1].normalizedUrl).toBe('https://www.youtube.com/watch?v=9bZkp7q19f0');
            expect(result.valid[2].normalizedUrl).toBe('https://www.youtube.com/watch?v=abcdefghijk');
        });

        it('should handle empty URL array gracefully', () => {
            const result = validateUrls([]);
            expect(result.valid).toHaveLength(0);
            expect(result.invalid).toHaveLength(0);
        });
    });

    describe('Metadata Extraction Flow', () => {
        it('should extract complete metadata from video page', () => {
            const result = extractVideoMetadata(
                videoPageHtml,
                'dQw4w9WgXcQ',
                'https://youtu.be/dQw4w9WgXcQ',
            );

            expect(result).not.toBeNull();
            expect(result!.metadata).toMatchObject({
                videoId: 'dQw4w9WgXcQ',
                title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)',
                finalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            });
            expect(result!.continuationToken).toBeTruthy();
        });

        it('should extract comment count from metadata', () => {
            const result = extractVideoMetadata(
                videoPageHtml,
                'dQw4w9WgXcQ',
                'https://youtu.be/dQw4w9WgXcQ',
            );

            // "3.2M" = 3,200,000
            expect(result!.metadata.commentsCount).toBe(3200000);
        });
    });

    describe('Comment Extraction Flow', () => {
        const testMetadata: VideoMetadata = {
            videoId: 'dQw4w9WgXcQ',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            finalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)',
            commentsCount: 3200000,
        };

        it('should parse comments from legacy API response', () => {
            const result = parseCommentsFromResponse(legacyResponse, testMetadata);

            expect(result.comments.length).toBeGreaterThanOrEqual(5);
            expect(result.nextContinuationToken).toBeTruthy();

            // Verify comment structure
            const firstComment = result.comments[0];
            expect(firstComment).toMatchObject({
                videoId: 'dQw4w9WgXcQ',
                pageUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)',
            });
            expect(firstComment.cid).toBeTruthy();
            expect(firstComment.author).toBeTruthy();
            expect(typeof firstComment.voteCount).toBe('number');
            expect(typeof firstComment.replyCount).toBe('number');
        });

        it('should parse comments from entity format API response', () => {
            const result = parseCommentsFromResponse(entityResponse, testMetadata);

            // Should find both legacy and entity format comments
            expect(result.comments.length).toBeGreaterThanOrEqual(5);

            // Find entity format comment
            const entityComment = result.comments.find((c) => c.cid === 'UgzEntityPayload1XYZ');
            expect(entityComment).toBeDefined();
            expect(entityComment!.comment).toBe('This comment uses the new entity payload format!');
        });

        it('should track reply continuation tokens', () => {
            const result = parseCommentsFromResponse(legacyResponse, testMetadata);

            expect(result.replyContinuationTokens.size).toBeGreaterThan(0);

            // Comments with replies should have continuation tokens
            const commentWithReplies = result.comments.find((c) => c.replyCount > 0);
            if (commentWithReplies) {
                expect(result.replyContinuationTokens.has(commentWithReplies.cid)).toBe(true);
            }
        });
    });

    describe('End-to-End Flow Simulation', () => {
        it('should complete full flow: URL validation -> metadata -> comments', () => {
            // Step 1: Validate URL
            const urlResult = validateYouTubeUrl('https://youtu.be/dQw4w9WgXcQ');
            expect(urlResult.isValid).toBe(true);
            expect(urlResult.videoId).toBe('dQw4w9WgXcQ');

            // Step 2: Extract metadata from video page
            const metadataResult = extractVideoMetadata(
                videoPageHtml,
                urlResult.videoId!,
                'https://youtu.be/dQw4w9WgXcQ',
            );
            expect(metadataResult).not.toBeNull();
            expect(metadataResult!.continuationToken).toBeTruthy();

            // Step 3: Parse comments from API response
            const commentsResult = parseCommentsFromResponse(
                legacyResponse,
                metadataResult!.metadata,
            );
            expect(commentsResult.comments.length).toBeGreaterThan(0);

            // Step 4: Verify output format matches schema
            for (const comment of commentsResult.comments) {
                expect(comment).toHaveProperty('cid');
                expect(comment).toHaveProperty('comment');
                expect(comment).toHaveProperty('author');
                expect(comment).toHaveProperty('videoId');
                expect(comment).toHaveProperty('pageUrl');
                expect(comment).toHaveProperty('title');
                expect(comment).toHaveProperty('commentsCount');
                expect(comment).toHaveProperty('voteCount');
                expect(comment).toHaveProperty('replyCount');
                expect(comment).toHaveProperty('authorIsChannelOwner');
                expect(comment).toHaveProperty('hasCreatorHeart');
                expect(comment).toHaveProperty('type');
                expect(comment).toHaveProperty('replyToCid');
                expect(comment).toHaveProperty('date');
            }
        });

        it('should handle multiple videos in sequence', () => {
            const urls = [
                'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'https://youtu.be/9bZkp7q19f0',
            ];

            const results = urls.map((url) => {
                const validation = validateYouTubeUrl(url);
                return {
                    url,
                    isValid: validation.isValid,
                    videoId: validation.videoId,
                    normalizedUrl: validation.normalizedUrl,
                };
            });

            expect(results).toHaveLength(2);
            expect(results.every((r) => r.isValid)).toBe(true);
            expect(results[0].videoId).toBe('dQw4w9WgXcQ');
            expect(results[1].videoId).toBe('9bZkp7q19f0');
        });
    });

    describe('Error Handling Flow', () => {
        it('should gracefully handle empty API response', () => {
            const emptyResponse = {};
            const testMetadata: VideoMetadata = {
                videoId: 'test',
                url: 'https://www.youtube.com/watch?v=test',
                finalUrl: 'https://www.youtube.com/watch?v=test',
                title: 'Test',
                commentsCount: null,
            };

            const result = parseCommentsFromResponse(emptyResponse, testMetadata);

            expect(result.comments).toHaveLength(0);
            expect(result.nextContinuationToken).toBeNull();
        });

        it('should gracefully handle malformed API response', () => {
            const malformedResponse = {
                onResponseReceivedEndpoints: 'not an array',
            };
            const testMetadata: VideoMetadata = {
                videoId: 'test',
                url: 'https://www.youtube.com/watch?v=test',
                finalUrl: 'https://www.youtube.com/watch?v=test',
                title: 'Test',
                commentsCount: null,
            };

            const result = parseCommentsFromResponse(malformedResponse, testMetadata);

            expect(result.comments).toHaveLength(0);
        });

        it('should return null for invalid HTML in metadata extraction', () => {
            const result = extractVideoMetadata(
                '<html>no ytInitialData here</html>',
                'test',
                'https://youtube.com/watch?v=test',
            );

            expect(result).toBeNull();
        });
    });

    describe('Data Quality Verification', () => {
        it('should extract correct vote counts from fixture data', () => {
            const testMetadata: VideoMetadata = {
                videoId: 'dQw4w9WgXcQ',
                url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                finalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                title: 'Test',
                commentsCount: null,
            };

            const result = parseCommentsFromResponse(legacyResponse, testMetadata);

            // Per fixture: "1.2K" = 1200
            const comment1200 = result.comments.find((c) => c.cid === 'UgzTest1CommentId123');
            expect(comment1200?.voteCount).toBe(1200);

            // Per fixture: "234"
            const comment234 = result.comments.find((c) => c.cid === 'UgzTest2CommentId456');
            expect(comment234?.voteCount).toBe(234);

            // Per fixture: "2.5M" = 2500000
            const commentMillion = result.comments.find((c) => c.cid === 'UgzTest5MillionLikes');
            expect(commentMillion?.voteCount).toBe(2500000);
        });

        it('should correctly identify channel owner comments', () => {
            const testMetadata: VideoMetadata = {
                videoId: 'dQw4w9WgXcQ',
                url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                finalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                title: 'Test',
                commentsCount: null,
            };

            const result = parseCommentsFromResponse(legacyResponse, testMetadata);

            const ownerComment = result.comments.find((c) => c.authorIsChannelOwner === true);
            expect(ownerComment).toBeDefined();
            expect(ownerComment?.author).toBe('Rick Astley');
        });

        it('should correctly detect creator hearts', () => {
            const testMetadata: VideoMetadata = {
                videoId: 'dQw4w9WgXcQ',
                url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                finalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                title: 'Test',
                commentsCount: null,
            };

            const result = parseCommentsFromResponse(legacyResponse, testMetadata);

            const heartedComment = result.comments.find((c) => c.hasCreatorHeart === true);
            expect(heartedComment).toBeDefined();
            expect(heartedComment?.cid).toBe('UgzTest2CommentId456');
        });
    });
});
