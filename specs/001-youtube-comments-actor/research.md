# Research: YouTube Comments Scraper Actor

**Branch**: `001-youtube-comments-actor` | **Date**: 2025-12-28

## Research Tasks Completed

1. YouTube Comment API vs Web Scraping
2. YouTube InnerTube API architecture
3. Apify SDK HTTP-first patterns
4. Rate limiting and backoff strategies
5. Comment pagination mechanisms
6. Reply extraction approach

---

## Decision 1: Data Extraction Method

### Decision: InnerTube API (Web Scraping)

### Rationale
- Project spec explicitly requires going "beyond standard YouTube API limitations"
- Official YouTube Data API v3 has severe quota limits: 10,000 units/day, ~1 unit per 20 comments
- At max efficiency, official API supports only ~200,000 comments/day total
- InnerTube API provides access to all publicly visible comments without quota restrictions
- Aligns with existing YouTube Comments Scraper behavior described in example_readme.md

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| YouTube Data API v3 | 10,000 unit/day quota insufficient for bulk extraction; cannot support videos with 100k+ comments |
| Third-party APIs | External dependency costs; potential rate limits; data freshness concerns |
| Browser-based scraping | 10-100x more expensive; unnecessary since InnerTube provides JSON directly |

---

## Decision 2: Technical Architecture

### Decision: HTTP-first with got-scraping

### Rationale
- Constitution Principle I mandates "HTTP-first execution with browser fallback"
- Constitution Principle II states "Browser usage is 10-100x more expensive than HTTP"
- YouTube's InnerTube API returns structured JSON - no JavaScript rendering required
- `got-scraping` provides browser-like fingerprinting without browser overhead
- Apify SDK integration is seamless

### Implementation Approach

```typescript
// HTTP client setup
import { gotScraping } from 'got-scraping';

const response = await gotScraping({
  url: 'https://www.youtube.com/youtubei/v1/next',
  method: 'POST',
  proxyUrl: await proxyConfiguration.newUrl(),
  json: {
    context: { client: { clientName: 'WEB', clientVersion: '2.20251220.00.00' } },
    continuation: token
  },
  responseType: 'json'
});
```

### Browser Fallback Triggers (if needed)
- Empty responses or JS shell detection
- Captcha challenges
- Repeated 403/429 after proxy rotation

---

## Decision 3: Rate Limiting Strategy

### Decision: Exponential backoff with jitter, 3 retries max

### Rationale
- Spec FR-015b requires "exponential backoff retry strategy (3 attempts)"
- Jitter prevents thundering herd problem when multiple requests back off simultaneously
- Constitution requires error classification for tailored retry behavior

### Error Classification

| Error Type | HTTP Codes | Retry Strategy |
|------------|------------|----------------|
| Transient | 500, 502, 503, 504, timeout | Exponential backoff + jitter |
| Blocked | 403, 429, captcha | Slow down + rotate proxy/session |
| Permanent | 404, invalid URL, comments disabled | No retry; log and continue |

### Backoff Parameters

- Base delay: 1000ms
- Max delay: 30000ms
- Max retries: 3
- Jitter: 50% variance (delay * 0.5-1.5)

---

## Decision 4: Comment Pagination

### Decision: Continuation token pattern

### Rationale
- Only reliable method for YouTube's dynamic comment ordering
- Tokens encode current position and sort order (Top/Newest)
- Standard pattern used by YouTube.js and other extraction tools

### Pagination Flow

1. **Initial**: Fetch video page HTML, extract `ytInitialData` JSON
2. **Extract token**: Find comments section continuation token
3. **Fetch comments**: POST to `/youtubei/v1/next` with continuation
4. **Parse response**: Extract comments + next continuation token
5. **Repeat**: Until no continuation token or maxComments reached

### Token Sources

- Initial: `ytInitialData.contents.twoColumnWatchNextResults.results.results.contents[].itemSectionRenderer`
- Subsequent: `response.onResponseReceivedEndpoints[].appendContinuationItemsAction.continuationItems[].continuationItemRenderer`

---

## Decision 5: Reply Extraction

### Decision: Nested continuation with parent linking

### Rationale
- Replies use separate continuation tokens from top-level comments
- Parent-child relationships required by spec FR-008
- Reply count available in comment metadata for estimation

### Implementation Approach

1. Extract top-level comment with `commentThreadRenderer`
2. Check `replies.commentRepliesRenderer` for reply continuation
3. Fetch replies using same `/next` endpoint
4. Set `replyToCid` field to link reply to parent comment
5. Set `type: 'reply'` to distinguish from top-level comments

---

## Decision 6: Proxy Configuration

### Decision: Residential proxies required, Apify Proxy integration

### Rationale
- YouTube blocks datacenter IPs aggressively
- Spec Assumption 1 states users have residential proxy access (Starter plan+)
- Apify Proxy provides residential pool via `groups: ['RESIDENTIAL']`

### Configuration

```typescript
const proxyConfiguration = await Actor.createProxyConfiguration({
  groups: ['RESIDENTIAL'],
  countryCode: 'US'  // Optional: target specific region
});
```

---

## Decision 7: Sort Order Support

### Decision: Support both "Top comments" and "Newest first"

### Rationale
- Input example shows `commentsSortBy` parameter with values "0" and "1"
- Different continuation tokens generated based on sort order
- Users may need either chronological or engagement-based ordering

### Sort Values

| Value | Meaning |
|-------|---------|
| `"0"` | Top comments (engagement-based) |
| `"1"` | Newest first (chronological) |

---

## Technical Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| `apify` | ^3.0.0 | Actor SDK, dataset, KV store |
| `crawlee` | ^3.0.0 | Request queue, autoscaling |
| `got-scraping` | ^4.0.0 | HTTP client with fingerprinting |
| `zod` | ^3.0.0 | Input validation (optional) |

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| YouTube API structure changes | Medium | Version InnerTube client; monitor for breaking changes |
| Aggressive rate limiting | Medium | Residential proxies; adaptive delays; session rotation |
| Captcha challenges | Low | Proxy rotation; optional browser fallback |
| Comment data schema changes | Low | Defensive parsing with fallbacks |

---

## Open Questions (None - All Resolved)

All NEEDS CLARIFICATION items from Technical Context have been resolved through research.
