# Feature Specification: Fix YouTube Comments API

**Feature Branch**: `002-fix-comments-api`
**Created**: 2025-12-28
**Status**: Draft
**Input**: User description: "The code doesn't work. API doesn't return any comments and also it works way too long. For some videos it scraped youtube comments for over a couple minutes and still returned no comments. Fix it. Code should work and work fast."

## Problem Analysis

The current implementation has two critical issues:

1. **API Returns No Comments**: The InnerTube API calls are not returning comment data for videos that have comments enabled
2. **Excessive Processing Time**: The scraper runs for minutes without yielding results, wasting resources and providing poor user experience

### Root Causes Identified

After analyzing the codebase:

1. **Incorrect API Endpoint Usage**: The current implementation uses `/youtubei/v1/next` endpoint but may not be sending the correct payload structure that YouTube expects for comments
2. **Missing API Key**: The InnerTube API typically requires an API key parameter even for unauthenticated requests
3. **Continuation Token Extraction Issues**: The path to extract continuation tokens from `ytInitialData` may be incorrect or YouTube may have changed their response structure
4. **No Timeout Enforcement**: Pagination loops continue indefinitely without proper timeout handling
5. **No Progress Validation**: The code doesn't fail fast when API responses contain no data

## User Scenarios & Testing

### User Story 1 - Extract Comments Successfully (Priority: P1)

A user provides a YouTube video URL and receives the video's comments within a reasonable time.

**Why this priority**: This is the core functionality - if comments cannot be extracted, the entire actor is useless.

**Independent Test**: Can be fully tested by providing a known video URL with comments and verifying comments are returned.

**Acceptance Scenarios**:

1. **Given** a YouTube video URL with public comments, **When** the scraper runs, **Then** comments are returned in the output dataset within 30 seconds for the first batch
2. **Given** a YouTube video URL, **When** comments are extracted, **Then** each comment includes author, text, vote count, and publish date
3. **Given** a video with 100+ comments, **When** maxComments is set to 50, **Then** exactly 50 comments are returned (not more, not less)

---

### User Story 2 - Fast Response Time (Priority: P1)

A user receives feedback quickly whether a video has comments or not, without waiting minutes for timeouts.

**Why this priority**: Poor performance makes the tool unusable in practice, even if it technically works.

**Independent Test**: Can be tested by timing the scraper execution and verifying it meets time constraints.

**Acceptance Scenarios**:

1. **Given** any YouTube video URL, **When** the scraper starts, **Then** the user sees the first comment output or an error within 30 seconds
2. **Given** a video with comments disabled, **When** the scraper runs, **Then** it reports "comments disabled" within 10 seconds
3. **Given** an invalid or non-existent video URL, **When** the scraper runs, **Then** it reports failure within 10 seconds

---

### User Story 3 - Reliable Error Reporting (Priority: P2)

A user receives clear error messages when extraction fails, allowing them to understand and potentially fix the issue.

**Why this priority**: Without clear errors, users cannot distinguish between bugs, blocked requests, or videos with disabled comments.

**Independent Test**: Can be tested by providing various failure scenarios and verifying appropriate error messages.

**Acceptance Scenarios**:

1. **Given** a video with disabled comments, **When** extraction runs, **Then** the error message clearly indicates "Comments are disabled for this video"
2. **Given** YouTube returns a rate limit response, **When** extraction runs, **Then** the error indicates rate limiting and suggests using proxies
3. **Given** a network timeout, **When** extraction runs, **Then** the error indicates a timeout occurred with retry suggestion

---

### Edge Cases

- What happens when YouTube changes their API response structure? - Fail gracefully with descriptive error
- How does the system handle videos with millions of comments? - Respect maxComments limit, implement pagination timeout
- What happens when a video exists but has 0 comments? - Return empty array quickly (not error)
- How does the system handle shorts vs regular videos? - Both should work identically
- What happens if the continuation token becomes invalid mid-pagination? - Stop pagination, return collected comments as partial success

## Requirements

### Functional Requirements

- **FR-001**: System MUST extract comments from YouTube videos that have public comments enabled
- **FR-002**: System MUST return the first batch of comments within 30 seconds of starting extraction
- **FR-003**: System MUST respect the maxComments limit and stop extraction once the limit is reached
- **FR-004**: System MUST detect and report when comments are disabled within 10 seconds
- **FR-005**: System MUST include timeout handling to prevent infinite loops or hung requests
- **FR-006**: System MUST validate API responses contain expected data before continuing pagination
- **FR-007**: System MUST use the correct InnerTube API payload structure including required API key
- **FR-008**: System MUST extract continuation tokens correctly from current YouTube page structure
- **FR-009**: System MUST handle both regular videos and YouTube Shorts
- **FR-010**: System MUST return partial results if extraction fails mid-pagination

### Key Entities

- **Comment**: Text content, author name, vote count, reply count, publish date, comment ID, parent comment ID (for replies)
- **Video Metadata**: Video ID, title, total comments count, URL
- **Extraction State**: Current progress, extracted count, continuation token, elapsed time

## Success Criteria

### Measurable Outcomes

- **SC-001**: 95% of videos with public comments successfully return at least some comments
- **SC-002**: First comment batch returned within 30 seconds for any video
- **SC-003**: Videos with disabled comments detected within 10 seconds
- **SC-004**: Invalid URLs rejected within 5 seconds
- **SC-005**: Maximum single video extraction time capped at 5 minutes (with maxComments set)
- **SC-006**: Memory usage stays constant regardless of video comment count (streaming output)

## Assumptions

- YouTube's InnerTube API remains accessible for unauthenticated requests
- The current got-scraping library with browser-like fingerprinting is sufficient to avoid basic bot detection
- Proxy configuration, when provided, will help mitigate rate limiting
- YouTube's web client version and API structure may need periodic updates as YouTube evolves
