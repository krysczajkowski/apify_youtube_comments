# Quickstart: Top-Notch Actor Improvement

**Feature Branch**: `003-actor-improvement`
**Created**: 2025-12-29

This guide provides quick implementation steps for the actor improvement feature.

## Prerequisites

- Node.js 18+
- npm 9+
- Existing codebase checked out on `003-actor-improvement` branch

## Step 1: Install Test Dependencies

```bash
npm install --save-dev vitest @vitest/coverage-v8
```

## Step 2: Create vitest.config.ts

```typescript
// vitest.config.ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/main.ts']
    }
  }
});
```

## Step 3: Create Test Directory Structure

```bash
mkdir -p tests/fixtures tests/unit tests/integration
```

## Step 4: Update package.json Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "test:e2e": "LIVE_TEST=true vitest run tests/e2e --passWithNoTests"
  }
}
```

## Step 5: Create Example Input Files

```bash
mkdir -p examples
```

**examples/minimal.json**:
```json
{
  "startUrls": [
    {
      "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "method": "GET"
    }
  ]
}
```

**examples/advanced.json**:
```json
{
  "startUrls": [
    { "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    { "url": "https://youtu.be/9bZkp7q19f0" }
  ],
  "maxComments": 500,
  "commentsSortBy": "0",
  "proxyConfiguration": {
    "useApifyProxy": true,
    "apifyProxyGroups": ["RESIDENTIAL"]
  }
}
```

**examples/multiple-videos.json**:
```json
{
  "startUrls": [
    { "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    { "url": "https://www.youtube.com/watch?v=9bZkp7q19f0" },
    { "url": "https://www.youtube.com/watch?v=fJ9rUzIMcZQ" },
    { "url": "https://www.youtube.com/watch?v=kJQP7kiw5Fk" },
    { "url": "https://www.youtube.com/watch?v=JGwWNGJdvx8" }
  ],
  "maxComments": 100
}
```

## Step 6: Update Input Schema

In `input_schema.json` (or `.apify/input_schema.json`):

1. Add prefill to startUrls:
```json
"prefill": [
  {
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "method": "GET"
  }
]
```

2. Add maximum to maxComments:
```json
"maximum": 100000
```

## Step 7: Create Documentation Files

**CHANGELOG.md**:
```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-12-29

### Added
- Initial release with HTTP-first comment extraction
- Support for multiple YouTube URL formats (watch, shorts, embed, short links)
- Retry logic with exponential backoff and jitter
- Proxy configuration support with Apify Residential proxies
- Comment sorting by engagement or chronological order
- Reply extraction with parent comment linking
```

**LICENSE**:
```
MIT License

Copyright (c) 2025 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
...
```

**CONTRIBUTING.md**:
```markdown
# Contributing

We welcome contributions! Here's how to get started.

## Bug Reports

1. Check if the issue already exists
2. Create a new issue with:
   - Video URL (if applicable)
   - Input configuration
   - Error message
   - Expected vs actual behavior

## Development Setup

1. Fork and clone the repository
2. Run `npm install`
3. Run `npm test` to verify setup

## Pull Requests

1. Create a feature branch
2. Make your changes
3. Run `npm test && npm run lint`
4. Submit PR with description
```

## Step 8: Write Unit Tests

See data-model.md for test case requirements. Example test file:

**tests/unit/url.test.ts**:
```typescript
import { describe, it, expect } from 'vitest';
import { extractVideoId, validateYouTubeUrl, isValidYouTubeUrl } from '../../src/utils/url.js';

describe('extractVideoId', () => {
  it('should extract video ID from standard watch URL', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('should extract video ID from short URL', () => {
    expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('should return null for invalid URL', () => {
    expect(extractVideoId('https://www.google.com')).toBeNull();
  });
});

describe('validateYouTubeUrl', () => {
  it('should validate and normalize YouTube URLs', () => {
    const result = validateYouTubeUrl('https://youtu.be/dQw4w9WgXcQ');
    expect(result.isValid).toBe(true);
    expect(result.videoId).toBe('dQw4w9WgXcQ');
    expect(result.normalizedUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });

  it('should reject empty input', () => {
    const result = validateYouTubeUrl('');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('required');
  });
});
```

## Step 9: Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- tests/unit/url.test.ts
```

## Verification Checklist

- [ ] `npm test` passes with 100% pass rate
- [ ] At least 4 test files (url, retry, comments, metadata)
- [ ] examples/ contains 3 JSON files
- [ ] CHANGELOG.md exists with 1.0.0 entry
- [ ] LICENSE exists with MIT license
- [ ] CONTRIBUTING.md exists
- [ ] README has 7 new sections (per contracts/readme-sections.json)
- [ ] input_schema.json has prefill and maximum constraints

## Common Issues

### ESM Import Errors
Ensure test files use `.js` extension for imports:
```typescript
// Correct
import { extractVideoId } from '../../src/utils/url.js';

// Wrong
import { extractVideoId } from '../../src/utils/url';
```

### TypeScript Configuration
Add Vitest types to tsconfig.json:
```json
{
  "compilerOptions": {
    "types": ["vitest/globals"]
  }
}
```

### Coverage Not Showing
Ensure coverage provider is installed:
```bash
npm install --save-dev @vitest/coverage-v8
```
