# Research: Performance Optimization & README Update

**Feature**: 004-performance-readme-update
**Date**: 2025-12-29

## Research Questions

### RQ-001: What is the current retry configuration causing performance issues?

**Decision**: Current configuration in `src/utils/retry.ts` uses aggressive settings:
- `baseDelayMs: 1000` (1 second)
- `maxDelayMs: 30000` (30 seconds)
- `maxRetries: 3`
- `jitterFactor: 0.5`

**Impact Analysis**:
- On first retry: 1000ms * 2^0 = 1000ms (±500ms jitter) = 500-1500ms delay
- On second retry: 1000ms * 2^1 = 2000ms (±1000ms jitter) = 1000-3000ms delay
- On third retry: 1000ms * 2^2 = 4000ms (±2000ms jitter) = 2000-6000ms delay
- **Worst case for 3 retries**: Up to 10.5 seconds per failed request

**Rationale**: These aggressive settings were likely inherited from generic web scraping best practices, but YouTube's API is more tolerant and fast. Most transient failures resolve quickly, so shorter delays are appropriate.

### RQ-002: What retry settings should replace the current configuration?

**Decision**: New configuration per spec clarifications:
- `baseDelayMs: 200` (200 milliseconds)
- `maxDelayMs: 1000` (1 second)
- `maxRetries: 1`
- `jitterFactor: 0.5` (keep same)

**Impact Analysis**:
- On first retry: 200ms * 2^0 = 200ms (±100ms jitter) = 100-300ms delay
- **Worst case for 1 retry**: 300ms delay
- **Improvement**: 35x faster worst-case retry scenario

**Rationale**:
1. YouTube's internal API typically responds quickly
2. Transient errors that don't resolve in 200ms are unlikely to resolve in 1s
3. Single retry catches transient network glitches without excessive delays
4. Users prefer fast failures over slow retries when extraction fails

**Alternatives Considered**:
- **0 retries**: Rejected - would fail on transient network issues that resolve immediately
- **2 retries**: Rejected - diminishing returns; if 1 retry fails, the issue is likely not transient

### RQ-003: Does the README output schema match src/types/output.ts?

**Decision**: README output schema MATCHES the TypeScript interface exactly.

**Verification**:

| TypeScript Field | Type in output.ts | README Field | README Type | Match? |
|------------------|-------------------|--------------|-------------|--------|
| `cid` | string | `cid` | string | ✅ |
| `comment` | string | `comment` | string | ✅ |
| `author` | string | `author` | string | ✅ |
| `videoId` | string | `videoId` | string | ✅ |
| `pageUrl` | string | `pageUrl` | string | ✅ |
| `title` | string | `title` | string | ✅ |
| `commentsCount` | number | `commentsCount` | integer | ✅ |
| `voteCount` | number | `voteCount` | integer | ✅ |
| `replyCount` | number | `replyCount` | integer | ✅ |
| `authorIsChannelOwner` | boolean | `authorIsChannelOwner` | boolean | ✅ |
| `hasCreatorHeart` | boolean | `hasCreatorHeart` | boolean | ✅ |
| `type` | CommentType | `type` | string | ✅ |
| `replyToCid` | string \| null | `replyToCid` | string/null | ✅ |
| `date` | string | `date` | string | ✅ |

**Rationale**: All 14 fields match. The README uses "integer" instead of "number" which is actually more accurate for JSON schema semantics (TypeScript's number can represent integers).

### RQ-004: What README readability improvements are needed?

**Decision**: Light improvements only - no structural changes.

**Analysis of current README**:
- Total length: ~320 lines
- Structure: Well-organized with clear sections
- No major redundancy identified
- Some verbose sections identified for tightening

**Identified Improvements**:
1. **"Why Not Use Browser-Based Scrapers?"** section (lines 14-22) - slightly verbose, can be tightened
2. **Proxy Configuration section** - describes options clearly, minor wordiness
3. **Troubleshooting table** - good, no changes needed
4. **Performance comparison table** - accurate, no changes needed

**Rationale**: User requested "light" simplification for "more pleasant reading." The README is already well-structured; only minor word tightening is appropriate.

**Alternatives Considered**:
- **Major restructure**: Rejected - user explicitly said "not drastically change it"
- **Remove sections**: Rejected - user wants all essential info retained

## Summary

| Research Question | Resolution |
|-------------------|------------|
| RQ-001: Current retry config | Identified: 1s base, 30s max, 3 retries |
| RQ-002: New retry config | 200ms base, 1s max, 1 retry |
| RQ-003: README schema accuracy | MATCHES - all 14 fields verified |
| RQ-004: README improvements | Light tightening only, keep structure |

## Implementation Impact

**Files to modify**:
1. `src/utils/retry.ts` - Update `DEFAULT_RETRY_OPTIONS` constant (4 lines changed)
2. `README.md` - Minor readability edits to verbose sections

**Risk Assessment**: LOW
- Retry config change is isolated to one constant
- README changes are cosmetic
- No architectural changes
- No API/output changes
