/**
 * URL validation and normalization utilities for YouTube URLs
 */

/**
 * Supported YouTube URL patterns
 */
const YOUTUBE_PATTERNS = [
    // Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
    /^https?:\/\/(?:www\.)?youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    // Short URL: https://youtu.be/VIDEO_ID
    /^https?:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})/,
    // Shorts URL: https://www.youtube.com/shorts/VIDEO_ID
    /^https?:\/\/(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    // Embed URL: https://www.youtube.com/embed/VIDEO_ID
    /^https?:\/\/(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
];

/**
 * Result of URL validation
 */
export interface UrlValidationResult {
    isValid: boolean;
    videoId: string | null;
    normalizedUrl: string | null;
    error: string | null;
}

/**
 * Extracts video ID from a YouTube URL
 * @param url - The URL to parse
 * @returns The video ID or null if not found
 */
export function extractVideoId(url: string): string | null {
    for (const pattern of YOUTUBE_PATTERNS) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

/**
 * Validates and normalizes a YouTube URL
 * @param url - The URL to validate
 * @returns Validation result with video ID and normalized URL
 */
export function validateYouTubeUrl(url: string): UrlValidationResult {
    if (!url || typeof url !== 'string') {
        return {
            isValid: false,
            videoId: null,
            normalizedUrl: null,
            error: 'URL is required and must be a string',
        };
    }

    const trimmedUrl = url.trim();

    // Check if it's a YouTube domain at all
    const isYouTubeDomain = /^https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)/i.test(trimmedUrl);
    if (!isYouTubeDomain) {
        return {
            isValid: false,
            videoId: null,
            normalizedUrl: null,
            error: `Invalid YouTube URL: ${trimmedUrl}. Expected format: youtube.com/watch?v=... or youtu.be/...`,
        };
    }

    const videoId = extractVideoId(trimmedUrl);
    if (!videoId) {
        return {
            isValid: false,
            videoId: null,
            normalizedUrl: null,
            error: `Could not extract video ID from URL: ${trimmedUrl}. Expected format: youtube.com/watch?v=VIDEO_ID`,
        };
    }

    // Normalize to canonical format
    const normalizedUrl = `https://www.youtube.com/watch?v=${videoId}`;

    return {
        isValid: true,
        videoId,
        normalizedUrl,
        error: null,
    };
}

/**
 * Checks if a URL is a valid YouTube video URL
 * @param url - The URL to check
 * @returns True if valid YouTube video URL
 */
export function isValidYouTubeUrl(url: string): boolean {
    return validateYouTubeUrl(url).isValid;
}

/**
 * Normalizes a YouTube URL to canonical format
 * @param url - The URL to normalize
 * @returns Normalized URL or null if invalid
 */
export function normalizeYouTubeUrl(url: string): string | null {
    return validateYouTubeUrl(url).normalizedUrl;
}

/**
 * Batch validates multiple URLs
 * @param urls - Array of URLs to validate
 * @returns Object with valid and invalid URLs
 */
export function validateUrls(urls: string[]): {
    valid: Array<{ url: string; videoId: string; normalizedUrl: string }>;
    invalid: Array<{ url: string; error: string }>;
} {
    const valid: Array<{ url: string; videoId: string; normalizedUrl: string }> = [];
    const invalid: Array<{ url: string; error: string }> = [];

    for (const url of urls) {
        const result = validateYouTubeUrl(url);
        if (result.isValid && result.videoId && result.normalizedUrl) {
            valid.push({
                url,
                videoId: result.videoId,
                normalizedUrl: result.normalizedUrl,
            });
        } else {
            invalid.push({
                url,
                error: result.error || 'Unknown validation error',
            });
        }
    }

    return { valid, invalid };
}
