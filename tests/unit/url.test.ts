/**
 * Unit tests for src/utils/url.ts
 * Per data-model.md: URL Validation Test Cases
 */

import { describe, it, expect } from 'vitest';
import {
    extractVideoId,
    validateYouTubeUrl,
    isValidYouTubeUrl,
    normalizeYouTubeUrl,
    validateUrls,
} from '../../src/utils/url.js';

describe('extractVideoId', () => {
    it('should extract video ID from standard watch URL', () => {
        expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from watch URL without www', () => {
        expect(extractVideoId('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from HTTP watch URL', () => {
        expect(extractVideoId('http://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from short URL (youtu.be)', () => {
        expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from shorts URL', () => {
        expect(extractVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from embed URL', () => {
        expect(extractVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from URL with additional query parameters', () => {
        expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30')).toBe('dQw4w9WgXcQ');
    });

    it('should return null for non-YouTube URL', () => {
        expect(extractVideoId('https://www.google.com')).toBeNull();
    });

    it('should return null for YouTube homepage', () => {
        expect(extractVideoId('https://www.youtube.com/')).toBeNull();
    });

    it('should return null for invalid URL', () => {
        expect(extractVideoId('invalid-url')).toBeNull();
    });

    it('should return null for empty string', () => {
        expect(extractVideoId('')).toBeNull();
    });

    it('should return null for YouTube channel URL', () => {
        expect(extractVideoId('https://www.youtube.com/channel/UCuAXFkgsw1L7xaCfnd5JJOw')).toBeNull();
    });

    it('should return null for YouTube playlist URL without video', () => {
        expect(extractVideoId('https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf')).toBeNull();
    });
});

describe('validateYouTubeUrl', () => {
    it('should validate and normalize standard watch URL', () => {
        const result = validateYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        expect(result.isValid).toBe(true);
        expect(result.videoId).toBe('dQw4w9WgXcQ');
        expect(result.normalizedUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        expect(result.error).toBeNull();
    });

    it('should validate and normalize short URL to canonical format', () => {
        const result = validateYouTubeUrl('https://youtu.be/dQw4w9WgXcQ');
        expect(result.isValid).toBe(true);
        expect(result.videoId).toBe('dQw4w9WgXcQ');
        expect(result.normalizedUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        expect(result.error).toBeNull();
    });

    it('should validate and normalize shorts URL to canonical format', () => {
        const result = validateYouTubeUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ');
        expect(result.isValid).toBe(true);
        expect(result.videoId).toBe('dQw4w9WgXcQ');
        expect(result.normalizedUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    });

    it('should validate and normalize embed URL to canonical format', () => {
        const result = validateYouTubeUrl('https://www.youtube.com/embed/dQw4w9WgXcQ');
        expect(result.isValid).toBe(true);
        expect(result.videoId).toBe('dQw4w9WgXcQ');
        expect(result.normalizedUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    });

    it('should reject empty input', () => {
        const result = validateYouTubeUrl('');
        expect(result.isValid).toBe(false);
        expect(result.videoId).toBeNull();
        expect(result.normalizedUrl).toBeNull();
        expect(result.error).toContain('required');
    });

    it('should reject non-string input', () => {
        // @ts-expect-error Testing invalid input type
        const result = validateYouTubeUrl(null);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('required');
    });

    it('should reject non-YouTube domain', () => {
        const result = validateYouTubeUrl('https://www.google.com/watch?v=dQw4w9WgXcQ');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Invalid YouTube URL');
    });

    it('should reject YouTube URL without video ID', () => {
        const result = validateYouTubeUrl('https://www.youtube.com/');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Could not extract video ID');
    });

    it('should trim whitespace from URL', () => {
        const result = validateYouTubeUrl('  https://www.youtube.com/watch?v=dQw4w9WgXcQ  ');
        expect(result.isValid).toBe(true);
        expect(result.videoId).toBe('dQw4w9WgXcQ');
    });
});

describe('isValidYouTubeUrl', () => {
    it('should return true for valid YouTube watch URL', () => {
        expect(isValidYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
    });

    it('should return true for valid short URL', () => {
        expect(isValidYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
    });

    it('should return true for valid shorts URL', () => {
        expect(isValidYouTubeUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe(true);
    });

    it('should return true for valid embed URL', () => {
        expect(isValidYouTubeUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(true);
    });

    it('should return false for non-YouTube URL', () => {
        expect(isValidYouTubeUrl('https://www.google.com')).toBe(false);
    });

    it('should return false for YouTube homepage', () => {
        expect(isValidYouTubeUrl('https://www.youtube.com/')).toBe(false);
    });

    it('should return false for invalid URL', () => {
        expect(isValidYouTubeUrl('invalid-url')).toBe(false);
    });

    it('should return false for empty string', () => {
        expect(isValidYouTubeUrl('')).toBe(false);
    });
});

describe('normalizeYouTubeUrl', () => {
    it('should normalize short URL to canonical format', () => {
        expect(normalizeYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    });

    it('should normalize shorts URL to canonical format', () => {
        expect(normalizeYouTubeUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    });

    it('should normalize embed URL to canonical format', () => {
        expect(normalizeYouTubeUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    });

    it('should return null for invalid URL', () => {
        expect(normalizeYouTubeUrl('invalid-url')).toBeNull();
    });
});

describe('validateUrls', () => {
    it('should separate valid and invalid URLs', () => {
        const urls = [
            'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'https://youtu.be/9bZkp7q19f0',
            'invalid-url',
            'https://www.google.com',
        ];

        const result = validateUrls(urls);

        expect(result.valid).toHaveLength(2);
        expect(result.invalid).toHaveLength(2);
    });

    it('should return valid URLs with videoId and normalizedUrl', () => {
        const urls = ['https://youtu.be/dQw4w9WgXcQ'];
        const result = validateUrls(urls);

        expect(result.valid[0]).toEqual({
            url: 'https://youtu.be/dQw4w9WgXcQ',
            videoId: 'dQw4w9WgXcQ',
            normalizedUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        });
    });

    it('should return invalid URLs with error messages', () => {
        const urls = ['invalid-url'];
        const result = validateUrls(urls);

        expect(result.invalid[0].url).toBe('invalid-url');
        expect(result.invalid[0].error).toBeTruthy();
    });

    it('should handle empty array', () => {
        const result = validateUrls([]);
        expect(result.valid).toHaveLength(0);
        expect(result.invalid).toHaveLength(0);
    });

    it('should handle all valid URLs', () => {
        const urls = [
            'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'https://youtu.be/9bZkp7q19f0',
        ];

        const result = validateUrls(urls);
        expect(result.valid).toHaveLength(2);
        expect(result.invalid).toHaveLength(0);
    });

    it('should handle all invalid URLs', () => {
        const urls = [
            'invalid-url',
            'https://www.google.com',
        ];

        const result = validateUrls(urls);
        expect(result.valid).toHaveLength(0);
        expect(result.invalid).toHaveLength(2);
    });
});
