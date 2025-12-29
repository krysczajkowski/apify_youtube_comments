/**
 * Unit tests for input validation and schema constraints
 * Per FR-023/FR-024: Input schema improvements for reliable validation
 */

import { describe, it, expect } from 'vitest';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load input schema
const schemaPath = join(__dirname, '../../.actor/input_schema.json');
const inputSchema = JSON.parse(readFileSync(schemaPath, 'utf-8'));

// Initialize AJV validator
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(inputSchema);

describe('Input Schema Validation', () => {
    describe('startUrls field', () => {
        it('should require startUrls array', () => {
            const input = {};
            const valid = validate(input);
            expect(valid).toBe(false);
            expect(validate.errors).toBeDefined();
            expect(validate.errors!.some((e) => e.instancePath === '' && e.keyword === 'required')).toBe(true);
        });

        it('should accept valid YouTube URL', () => {
            const input = {
                startUrls: [{ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }],
            };
            const valid = validate(input);
            expect(valid).toBe(true);
        });

        it('should accept YouTube short URL', () => {
            const input = {
                startUrls: [{ url: 'https://youtu.be/dQw4w9WgXcQ' }],
            };
            const valid = validate(input);
            expect(valid).toBe(true);
        });

        it('should accept YouTube shorts URL', () => {
            const input = {
                startUrls: [{ url: 'https://www.youtube.com/shorts/dQw4w9WgXcQ' }],
            };
            const valid = validate(input);
            expect(valid).toBe(true);
        });

        it('should have prefill value with Rick Astley video', () => {
            expect(inputSchema.properties.startUrls.prefill).toBeDefined();
            expect(inputSchema.properties.startUrls.prefill).toHaveLength(1);
            expect(inputSchema.properties.startUrls.prefill[0].url).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        });

        it('should accept multiple URLs', () => {
            const input = {
                startUrls: [
                    { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
                    { url: 'https://youtu.be/9bZkp7q19f0' },
                    { url: 'https://www.youtube.com/shorts/abc123def45' },
                ],
            };
            const valid = validate(input);
            expect(valid).toBe(true);
        });
    });

    describe('maxComments field', () => {
        it('should have minimum constraint of 0', () => {
            expect(inputSchema.properties.maxComments.minimum).toBe(0);
        });

        it('should have maximum constraint of 100000', () => {
            expect(inputSchema.properties.maxComments.maximum).toBe(100000);
        });

        it('should default to 0 (unlimited)', () => {
            expect(inputSchema.properties.maxComments.default).toBe(0);
        });

        it('should accept valid maxComments within range', () => {
            const input = {
                startUrls: [{ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }],
                maxComments: 500,
            };
            const valid = validate(input);
            expect(valid).toBe(true);
        });

        it('should accept maxComments of 0', () => {
            const input = {
                startUrls: [{ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }],
                maxComments: 0,
            };
            const valid = validate(input);
            expect(valid).toBe(true);
        });

        it('should accept maxComments of 100000', () => {
            const input = {
                startUrls: [{ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }],
                maxComments: 100000,
            };
            const valid = validate(input);
            expect(valid).toBe(true);
        });

        it('should reject maxComments below minimum', () => {
            const input = {
                startUrls: [{ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }],
                maxComments: -1,
            };
            const valid = validate(input);
            expect(valid).toBe(false);
            expect(validate.errors!.some((e) => e.keyword === 'minimum')).toBe(true);
        });

        it('should reject maxComments above maximum', () => {
            const input = {
                startUrls: [{ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }],
                maxComments: 100001,
            };
            const valid = validate(input);
            expect(valid).toBe(false);
            expect(validate.errors!.some((e) => e.keyword === 'maximum')).toBe(true);
        });

        it('should reject non-integer maxComments', () => {
            const input = {
                startUrls: [{ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }],
                maxComments: 500.5,
            };
            const valid = validate(input);
            expect(valid).toBe(false);
        });
    });

    describe('commentsSortBy field', () => {
        it('should accept "0" for top comments', () => {
            const input = {
                startUrls: [{ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }],
                commentsSortBy: '0',
            };
            const valid = validate(input);
            expect(valid).toBe(true);
        });

        it('should accept "1" for newest first', () => {
            const input = {
                startUrls: [{ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }],
                commentsSortBy: '1',
            };
            const valid = validate(input);
            expect(valid).toBe(true);
        });

        it('should default to "1"', () => {
            expect(inputSchema.properties.commentsSortBy.default).toBe('1');
        });

        it('should reject invalid sort values', () => {
            const input = {
                startUrls: [{ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }],
                commentsSortBy: '2',
            };
            const valid = validate(input);
            expect(valid).toBe(false);
            expect(validate.errors!.some((e) => e.keyword === 'enum')).toBe(true);
        });

        it('should have enum titles for "Top comments" and "Newest first"', () => {
            expect(inputSchema.properties.commentsSortBy.enumTitles).toContain('Top comments (by engagement)');
            expect(inputSchema.properties.commentsSortBy.enumTitles).toContain('Newest first (chronological)');
        });
    });

    describe('proxyConfiguration field', () => {
        it('should have residential proxy as default', () => {
            expect(inputSchema.properties.proxyConfiguration.default.useApifyProxy).toBe(true);
            expect(inputSchema.properties.proxyConfiguration.default.apifyProxyGroups).toContain('RESIDENTIAL');
        });

        it('should accept custom proxy configuration', () => {
            const input = {
                startUrls: [{ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }],
                proxyConfiguration: {
                    useApifyProxy: true,
                    apifyProxyGroups: ['DATACENTER'],
                },
            };
            const valid = validate(input);
            expect(valid).toBe(true);
        });
    });

    describe('schema metadata', () => {
        it('should have valid JSON schema version', () => {
            expect(inputSchema.$schema).toBe('http://json-schema.org/draft-07/schema#');
        });

        it('should have title', () => {
            expect(inputSchema.title).toBe('YouTube Comments Scraper Input');
        });

        it('should have description', () => {
            expect(inputSchema.description).toBeDefined();
        });

        it('should declare startUrls as required', () => {
            expect(inputSchema.required).toContain('startUrls');
        });
    });

    describe('edge cases', () => {
        it('should accept empty optional fields', () => {
            const input = {
                startUrls: [{ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }],
            };
            const valid = validate(input);
            expect(valid).toBe(true);
        });

        it('should accept all fields at once', () => {
            const input = {
                startUrls: [
                    { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
                    { url: 'https://youtu.be/9bZkp7q19f0' },
                ],
                maxComments: 500,
                commentsSortBy: '0',
                proxyConfiguration: {
                    useApifyProxy: true,
                    apifyProxyGroups: ['RESIDENTIAL'],
                },
            };
            const valid = validate(input);
            expect(valid).toBe(true);
        });
    });
});
