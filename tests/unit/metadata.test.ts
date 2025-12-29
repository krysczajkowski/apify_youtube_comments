/**
 * Unit tests for src/extractors/metadata.ts
 * Per data-model.md: YtInitialData extraction and metadata parsing
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
    extractYtInitialData,
    extractVideoTitle,
    extractCommentsCount,
    extractCommentsContinuationToken,
    parseCommentCount,
    areCommentsDisabled,
    detectCommentsDisabledNoToken,
    extractVideoMetadata,
} from '../../src/extractors/metadata.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load fixtures
const ytInitialDataFixture = JSON.parse(
    readFileSync(join(__dirname, '../fixtures/ytInitialData.json'), 'utf-8'),
);
const videoPageHtml = readFileSync(join(__dirname, '../fixtures/video-page.html'), 'utf-8');

describe('extractYtInitialData', () => {
    it('should extract ytInitialData from video page HTML', () => {
        const data = extractYtInitialData(videoPageHtml);

        expect(data).not.toBeNull();
        expect(data!.videoDetails).toBeDefined();
    });

    it('should parse video details correctly', () => {
        const data = extractYtInitialData(videoPageHtml);

        const videoDetails = data!.videoDetails as Record<string, unknown>;
        expect(videoDetails.videoId).toBe('dQw4w9WgXcQ');
        expect(videoDetails.title).toBe('Rick Astley - Never Gonna Give You Up (Official Music Video)');
    });

    it('should return null for HTML without ytInitialData', () => {
        const html = '<html><head></head><body>No data here</body></html>';
        expect(extractYtInitialData(html)).toBeNull();
    });

    it('should return null for empty HTML', () => {
        expect(extractYtInitialData('')).toBeNull();
    });

    it('should handle malformed JSON gracefully', () => {
        const html = '<script>var ytInitialData = {invalid json};</script>';
        expect(extractYtInitialData(html)).toBeNull();
    });

    it('should extract from window["ytInitialData"] format', () => {
        const html = `<script>window["ytInitialData"] = {"test": "data"};</script>`;
        const data = extractYtInitialData(html);
        expect(data).toEqual({ test: 'data' });
    });
});

describe('extractVideoTitle', () => {
    it('should extract title from videoPrimaryInfoRenderer', () => {
        const title = extractVideoTitle(ytInitialDataFixture);
        expect(title).toBe('Rick Astley - Never Gonna Give You Up (Official Music Video)');
    });

    it('should fallback to videoDetails.title', () => {
        const data = {
            videoDetails: {
                title: 'Fallback Title',
            },
        };
        expect(extractVideoTitle(data)).toBe('Fallback Title');
    });

    it('should return empty string for missing title', () => {
        expect(extractVideoTitle({})).toBe('');
    });

    it('should return empty string for malformed data', () => {
        const data = {
            contents: {
                twoColumnWatchNextResults: null,
            },
        };
        expect(extractVideoTitle(data)).toBe('');
    });
});

describe('extractCommentsCount', () => {
    it('should extract comment count from commentsEntryPointHeaderRenderer', () => {
        const count = extractCommentsCount(ytInitialDataFixture);
        // "3.2M" = 3,200,000
        expect(count).toBe(3200000);
    });

    it('should extract count from engagement panels', () => {
        const data = {
            engagementPanels: [
                {
                    engagementPanelSectionListRenderer: {
                        header: {
                            engagementPanelTitleHeaderRenderer: {
                                contextualInfo: {
                                    runs: [{ text: '1,234 Comments' }],
                                },
                            },
                        },
                    },
                },
            ],
        };
        expect(extractCommentsCount(data)).toBe(1234);
    });

    it('should return null for missing comment count', () => {
        expect(extractCommentsCount({})).toBeNull();
    });
});

describe('parseCommentCount', () => {
    it('should parse plain number', () => {
        expect(parseCommentCount('234')).toBe(234);
    });

    it('should parse number with commas', () => {
        expect(parseCommentCount('1,234')).toBe(1234);
    });

    it('should parse K suffix', () => {
        expect(parseCommentCount('1.2K')).toBe(1200);
    });

    it('should parse M suffix', () => {
        expect(parseCommentCount('1.5M')).toBe(1500000);
    });

    it('should parse B suffix', () => {
        expect(parseCommentCount('2B')).toBe(2000000000);
    });

    it('should parse with "Comments" text', () => {
        expect(parseCommentCount('1,234 Comments')).toBe(1234);
    });

    it('should parse with "Comment" text (singular)', () => {
        expect(parseCommentCount('1 Comment')).toBe(1);
    });

    it('should return null for empty string', () => {
        expect(parseCommentCount('')).toBeNull();
    });

    it('should return null for null input', () => {
        // @ts-expect-error Testing null input
        expect(parseCommentCount(null)).toBeNull();
    });

    it('should handle whitespace', () => {
        expect(parseCommentCount('  100  ')).toBe(100);
    });

    it('should parse K with no decimal', () => {
        expect(parseCommentCount('45K')).toBe(45000);
    });

    it('should parse case-insensitive suffixes', () => {
        expect(parseCommentCount('1.5k')).toBe(1500);
        expect(parseCommentCount('2m')).toBe(2000000);
    });
});

describe('extractCommentsContinuationToken', () => {
    it('should extract token from engagement panels (newer format)', () => {
        const token = extractCommentsContinuationToken(ytInitialDataFixture);
        expect(token).toBeTruthy();
        expect(token).toContain('Eg0SC2RRdzR3OVdnWGNR');
    });

    it('should extract token from legacy path', () => {
        // Data with only legacy format
        const legacyData = {
            contents: {
                twoColumnWatchNextResults: {
                    results: {
                        results: {
                            contents: [
                                {
                                    itemSectionRenderer: {
                                        contents: [
                                            {
                                                continuationItemRenderer: {
                                                    continuationEndpoint: {
                                                        continuationCommand: {
                                                            token: 'legacy_token_123',
                                                        },
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                },
                            ],
                        },
                    },
                },
            },
        };

        expect(extractCommentsContinuationToken(legacyData)).toBe('legacy_token_123');
    });

    it('should prefer engagement panels over legacy path', () => {
        const data = {
            ...ytInitialDataFixture,
            contents: {
                twoColumnWatchNextResults: {
                    results: {
                        results: {
                            contents: [
                                {
                                    itemSectionRenderer: {
                                        contents: [
                                            {
                                                continuationItemRenderer: {
                                                    continuationEndpoint: {
                                                        continuationCommand: {
                                                            token: 'legacy_should_not_be_used',
                                                        },
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                },
                            ],
                        },
                    },
                },
            },
        };

        // Should get token from engagement panels, not legacy path
        const token = extractCommentsContinuationToken(data);
        expect(token).not.toBe('legacy_should_not_be_used');
    });

    it('should return null for missing token', () => {
        expect(extractCommentsContinuationToken({})).toBeNull();
    });

    it('should return null for malformed data', () => {
        const data = {
            engagementPanels: 'not an array',
        };
        expect(extractCommentsContinuationToken(data)).toBeNull();
    });
});

describe('areCommentsDisabled', () => {
    it('should detect "Comments are turned off" message', () => {
        const data = {
            contents: {
                twoColumnWatchNextResults: {
                    results: {
                        results: {
                            contents: [
                                {
                                    itemSectionRenderer: {
                                        contents: [
                                            {
                                                messageRenderer: {
                                                    text: {
                                                        runs: [{ text: 'Comments are turned off.' }],
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                },
                            ],
                        },
                    },
                },
            },
        };

        expect(areCommentsDisabled(data)).toBe(true);
    });

    it('should detect "comments disabled" message', () => {
        const data = {
            contents: {
                twoColumnWatchNextResults: {
                    results: {
                        results: {
                            contents: [
                                {
                                    itemSectionRenderer: {
                                        contents: [
                                            {
                                                messageRenderer: {
                                                    text: {
                                                        runs: [{ text: 'Comments disabled for this video' }],
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                },
                            ],
                        },
                    },
                },
            },
        };

        expect(areCommentsDisabled(data)).toBe(true);
    });

    it('should return false for video with comments enabled', () => {
        expect(areCommentsDisabled(ytInitialDataFixture)).toBe(false);
    });

    it('should return false for empty data', () => {
        expect(areCommentsDisabled({})).toBe(false);
    });
});

describe('detectCommentsDisabledNoToken', () => {
    it('should return true if explicit disabled message found', () => {
        const data = {
            contents: {
                twoColumnWatchNextResults: {
                    results: {
                        results: {
                            contents: [
                                {
                                    itemSectionRenderer: {
                                        contents: [
                                            {
                                                messageRenderer: {
                                                    text: {
                                                        runs: [{ text: 'Comments are turned off.' }],
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                },
                            ],
                        },
                    },
                },
            },
        };

        expect(detectCommentsDisabledNoToken(data)).toBe(true);
    });

    it('should return true if engagement panels exist but no comments panel', () => {
        const data = {
            engagementPanels: [
                {
                    engagementPanelSectionListRenderer: {
                        panelIdentifier: 'engagement-panel-structured-description',
                        header: {
                            engagementPanelTitleHeaderRenderer: {
                                title: { runs: [{ text: 'Description' }] },
                            },
                        },
                    },
                },
            ],
        };

        expect(detectCommentsDisabledNoToken(data)).toBe(true);
    });

    it('should return false if comments panel exists', () => {
        expect(detectCommentsDisabledNoToken(ytInitialDataFixture)).toBe(false);
    });

    it('should return false for empty data', () => {
        expect(detectCommentsDisabledNoToken({})).toBe(false);
    });
});

describe('extractVideoMetadata', () => {
    it('should extract complete metadata from HTML', () => {
        const result = extractVideoMetadata(
            videoPageHtml,
            'dQw4w9WgXcQ',
            'https://youtu.be/dQw4w9WgXcQ',
        );

        expect(result).not.toBeNull();
        expect(result!.metadata.videoId).toBe('dQw4w9WgXcQ');
        expect(result!.metadata.title).toBe('Rick Astley - Never Gonna Give You Up (Official Music Video)');
        expect(result!.metadata.url).toBe('https://youtu.be/dQw4w9WgXcQ');
        expect(result!.metadata.finalUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        expect(result!.continuationToken).toBeTruthy();
    });

    it('should return null for invalid HTML', () => {
        const result = extractVideoMetadata(
            '<html>no data</html>',
            'abc123',
            'https://youtube.com/watch?v=abc123',
        );

        expect(result).toBeNull();
    });

    it('should include commentsCount in metadata', () => {
        const result = extractVideoMetadata(
            videoPageHtml,
            'dQw4w9WgXcQ',
            'https://youtu.be/dQw4w9WgXcQ',
        );

        // "3.2M" = 3,200,000
        expect(result!.metadata.commentsCount).toBe(3200000);
    });
});
