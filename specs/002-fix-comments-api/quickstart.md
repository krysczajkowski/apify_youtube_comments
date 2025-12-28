# Quickstart: Fix YouTube Comments API

**Feature**: 002-fix-comments-api
**Date**: 2025-12-28

## Problem Summary

The YouTube comments scraper fails to extract comments and runs excessively long due to:
1. Missing/incorrect InnerTube API parameters
2. Outdated client version
3. Incorrect continuation token extraction paths
4. No timeout enforcement

## Fix Summary

This is a targeted bug fix affecting 2 files:
- `src/crawler.ts` - API request structure
- `src/extractors/metadata.ts` - Continuation token extraction

## Key Changes

### 1. Update InnerTube Context (crawler.ts)

**Before:**
```typescript
const INNERTUBE_CONTEXT = {
  client: {
    clientName: 'WEB',
    clientVersion: '2.20251220.00.00',
    hl: 'en',
    gl: 'US',
  },
};
```

**After:**
```typescript
const INNERTUBE_CONTEXT = {
  client: {
    clientName: 'WEB',
    clientVersion: '2.20250312.04.00',
    hl: 'en',
    gl: 'US',
    timeZone: 'UTC',
    utcOffsetMinutes: 0,
  },
};
```

### 2. Add API Key (crawler.ts)

**Before:**
```typescript
const INNERTUBE_API_URL = 'https://www.youtube.com/youtubei/v1/next';
```

**After:**
```typescript
const INNERTUBE_API_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
const INNERTUBE_API_URL = `https://www.youtube.com/youtubei/v1/next?key=${INNERTUBE_API_KEY}`;
```

### 3. Fix Continuation Token Extraction (metadata.ts)

Update `extractCommentsContinuationToken` to:
1. First check engagement panels for `panelIdentifier: "comment-item-section"`
2. Fall back to legacy path in results section
3. Handle both token locations

### 4. Add Timeout Enforcement (crawler.ts)

Add configurable timeouts:
- Per-request: 10 seconds
- Total extraction: 5 minutes (300,000ms)
- First batch deadline: 30 seconds

## Testing

After implementing fixes, test with:

```bash
# Quick test with one video
npm run build && npx apify run --input='{"startUrls":["https://www.youtube.com/watch?v=dQw4w9WgXcQ"],"maxComments":10}'
```

### Expected Results
- First comments returned within 30 seconds
- No infinite loops
- Clear error messages for disabled comments
- Partial results returned on timeout

## Files Modified

| File | Changes |
|------|---------|
| `src/crawler.ts` | Update context, add API key, add timeouts |
| `src/extractors/metadata.ts` | Fix continuation token extraction |

## Verification Checklist

- [X] Comments returned for video with public comments
- [X] "Comments disabled" detected within 10 seconds
- [X] Extraction completes within 5 minutes
- [X] maxComments limit respected
- [X] No infinite loops on empty responses
