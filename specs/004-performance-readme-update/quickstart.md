# Quickstart: Performance Optimization & README Update

**Feature**: 004-performance-readme-update
**Date**: 2025-12-29

## Overview

This feature is a configuration and documentation update only. No API changes are introduced.

## Usage Changes

**None** - The actor's input and output schemas remain identical.

## Developer Changes

### Testing Performance Improvement

To verify the performance improvement after implementation:

```bash
# Run the actor with a test video
npx apify run -i '{"startUrls":[{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}],"maxComments":100}'

# Expected: Completes in under 60 seconds for 100 comments
# Compare with branch 002 baseline if available
```

### Verifying Retry Configuration

The new retry defaults in `src/utils/retry.ts`:

```typescript
export const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
    baseDelayMs: 200,    // Was: 1000
    maxDelayMs: 1000,    // Was: 30000
    maxRetries: 1,       // Was: 3
    jitterFactor: 0.5,   // Unchanged
};
```

## Integration Impact

**None** - Downstream integrations are unaffected:
- Output schema unchanged
- Input schema unchanged
- Run summary format unchanged
