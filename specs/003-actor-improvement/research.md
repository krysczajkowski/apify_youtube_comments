# Research: Top-Notch Actor Improvement

**Feature Branch**: `003-actor-improvement`
**Created**: 2025-12-29
**Status**: Complete

This document resolves all technical decisions and unknowns identified during planning.

## 1. Testing Framework Selection

### Decision: Vitest

**Rationale**:
- Native ESM support (project uses `"type": "module"`)
- Zero-config TypeScript integration
- Jest-compatible API for familiar syntax
- Built-in coverage with V8 provider
- Faster execution than Jest for ESM projects
- Recommended in spec assumptions

**Alternatives Considered**:
- Jest: Requires additional configuration for ESM, slower startup
- Node.js test runner: Less mature ecosystem, fewer assertion utilities

**Configuration Strategy**:
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,           // Explicit imports for clarity
    environment: 'node',      // Server-side actor, no DOM needed
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/main.ts'] // Entry point, tested via integration
    }
  }
});
```

## 2. Test Fixture Strategy

### Decision: Captured Real Responses (Sanitized)

**Rationale**:
- Per spec clarification: "Captured real responses (sanitized/anonymized)"
- Real responses catch edge cases hand-crafted mocks miss
- Ensures tests remain valid as YouTube API evolves (snapshot can be updated)
- Sanitization removes PII (user emails in comments, tokens)

**Alternatives Considered**:
- Hand-crafted mocks: Easier to maintain but miss edge cases
- Live API calls: Flaky, slow, rate-limited

**Fixture Structure**:
```text
tests/fixtures/
├── ytInitialData.json       # Sanitized page data with continuation token
├── comments-response.json   # InnerTube API response with comments
├── comments-entity.json     # New frameworkUpdates format response
└── video-page.html          # Minimal HTML with ytInitialData embedded
```

**Sanitization Rules**:
1. Replace user emails/names with generic placeholders (`@user1`, `@user2`)
2. Remove/truncate session tokens and cookies
3. Keep video IDs of public, stable videos (e.g., popular music videos)
4. Preserve comment structure and edge cases (K/M suffixes, special chars)

## 3. Test Coverage Requirements

### Decision: Focus on Pure Functions

**Test Priority by Module**:

| Module | Functions to Test | Priority |
|--------|-------------------|----------|
| `utils/url.ts` | `extractVideoId`, `validateYouTubeUrl`, `validateUrls` | P1 |
| `utils/retry.ts` | `classifyError`, `shouldRetry`, `calculateBackoffDelay` | P1 |
| `extractors/comments.ts` | `extractComment`, `parseCommentsFromResponse`, `parseVoteCount` | P1 |
| `extractors/metadata.ts` | `extractYtInitialData`, `extractVideoTitle`, `extractCommentsContinuationToken` | P1 |

**Test Case Categories**:
1. **Happy Path**: Valid inputs produce expected outputs
2. **Edge Cases**: Empty strings, null values, malformed data
3. **Format Variations**: K/M/B suffixes, comma-separated numbers
4. **Error Conditions**: Invalid URLs, missing fields, disabled comments

## 4. Integration Test Strategy

### Decision: Recorded Responses for CI

**Rationale**:
- Per spec: "Recorded responses for CI with optional live e2e script"
- CI stability requires deterministic tests
- Live tests reserved for manual verification

**Implementation**:
```typescript
// tests/integration/actor.test.ts
// Uses MSW (Mock Service Worker) or nock to intercept HTTP
// Loads fixtures from tests/fixtures/
```

**Optional Live Script**:
```json
// package.json
{
  "scripts": {
    "test": "vitest run",
    "test:e2e": "LIVE_TEST=true vitest run tests/e2e"
  }
}
```

## 5. Example Input Files

### Decision: Three Distinct Use Cases

**examples/minimal.json**:
- Single video URL (stable, public video)
- Default settings only
- Purpose: First-time user success (User Story 1)

**examples/advanced.json**:
- Multiple videos
- Custom proxy config
- Sort order, max comments limit
- Purpose: Power user reference (User Story 4)

**examples/multiple-videos.json**:
- 3-5 video URLs
- Batch processing demonstration
- Purpose: Shows scalability

**Stable Video Selection Criteria**:
- Official music videos (rarely removed)
- High view count (> 10M views)
- Comments enabled
- Examples: Rick Astley, popular tutorials

## 6. README Enhancement Sections

### Decision: Seven New Sections

Based on FR-016 through FR-022:

| Section | Purpose | Location |
|---------|---------|----------|
| Legal Disclaimer | User responsibility for compliance | After Features |
| Support/Issues | GitHub issue link | After Limitations |
| Cost Estimation | Example scenarios with CU estimates | New section |
| Concurrency | Explains sequential processing | Technical Details |
| Login Limitations | Authenticated comments not supported | Limitations |
| Integrations | Make, Zapier, Sheets guidance | New section |
| Comparison | HTTP-first vs browser advantage | Features/Introduction |

### Cost Estimation Table Format
```markdown
| Scenario | Videos | Comments/Video | Est. Time | Est. CUs |
|----------|--------|----------------|-----------|----------|
| Quick test | 1 | 100 | ~30s | ~0.1 |
| Medium batch | 10 | 500 | ~5min | ~1 |
| Large extraction | 50 | 1000 | ~30min | ~5-10 |
```

## 7. Input Schema Improvements

### Decision: Prefill and Max Constraint

**FR-023 - Prefill Array**:
```json
{
  "startUrls": {
    "prefill": [
      {
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "method": "GET"
      }
    ]
  }
}
```
- Uses Rick Astley "Never Gonna Give You Up" (stable, comments enabled)

**FR-024 - Maximum Constraint**:
```json
{
  "maxComments": {
    "minimum": 0,
    "maximum": 100000,
    "description": "...Set to 0 for unlimited (max 100k)..."
  }
}
```
- 100,000 as practical upper limit to prevent runaway costs

## 8. Documentation Files

### CHANGELOG.md Format
```markdown
# Changelog

## [1.0.0] - 2025-12-29

### Added
- Initial release with HTTP-first comment extraction
- Support for multiple YouTube URL formats
- Retry logic with exponential backoff
- Proxy configuration support
```

### LICENSE
- MIT License (already specified in package.json)
- Standard MIT text with year 2025 and copyright holder

### CONTRIBUTING.md Structure
1. Code of Conduct reference
2. Bug report process (GitHub Issues)
3. Feature request process
4. Pull request guidelines
5. Development setup instructions
6. Testing requirements

## 9. Package.json Scripts

### Decision: Three Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "test:e2e": "LIVE_TEST=true vitest run tests/e2e --passWithNoTests"
  }
}
```

**Dependencies to Add**:
```json
{
  "devDependencies": {
    "vitest": "^2.0.0",
    "@vitest/coverage-v8": "^2.0.0"
  }
}
```

## 10. Test Organization

### Decision: Unit Tests with Fixtures

**File Structure**:
```text
tests/
├── fixtures/
│   ├── ytInitialData.json
│   ├── comments-legacy.json
│   ├── comments-entity.json
│   └── video-page.html
├── unit/
│   ├── url.test.ts
│   ├── retry.test.ts
│   ├── comments.test.ts
│   └── metadata.test.ts
└── integration/
    └── actor.test.ts
```

**Naming Conventions**:
- Test files: `[module].test.ts`
- Test suites: `describe('[FunctionName]', ...)`
- Test cases: `it('should [expected behavior] when [condition]', ...)`

## References

- [Vitest Configuration Guide](https://vitest.dev/config/)
- [Apify Actor Testing Documentation](https://docs.apify.com/platform/actors/development/automated-tests)
- [TypeScript Test Fixtures Best Practices](https://www.webdevtutor.net/blog/typescript-test-fixtures)
- [Snapshot Testing Guide](https://blog.seancoughlin.me/mastering-snapshot-testing-with-vite-vitest-or-jest-in-typescript)
