# Data Model: YouTube Comments Scraper Actor

**Branch**: `001-youtube-comments-actor` | **Date**: 2025-12-28

## Entity Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        ActorInput                           │
│  startUrls[], maxComments, commentsSortBy, proxyConfig      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         Video                                │
│  videoId, url, title, commentsCount                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Comment                               │
│  cid, text, author, voteCount, replyCount, hasCreatorHeart  │
│  authorIsChannelOwner, date, type, replyToCid               │
└─────────────────────────────────────────────────────────────┘
```

---

## Entity: ActorInput

The input configuration provided by the user to control the scraping behavior.

### Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `startUrls` | `StartUrl[]` | Yes | - | Array of YouTube video URLs to scrape |
| `maxComments` | `number` | No | `Infinity` | Maximum comments to extract per video |
| `commentsSortBy` | `"0" \| "1"` | No | `"1"` | Sort order: "0" = Top comments, "1" = Newest first |
| `proxyConfiguration` | `ProxyConfig` | No | Apify default | Proxy settings for requests |

### Nested Type: StartUrl

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | `string` | Yes | Valid YouTube video URL |
| `method` | `string` | No | HTTP method (always "GET" for URLs) |

### Validation Rules

1. `startUrls` must contain at least one valid YouTube URL
2. Valid URL patterns:
   - `https://www.youtube.com/watch?v={videoId}`
   - `https://youtube.com/watch?v={videoId}`
   - `https://youtu.be/{videoId}`
   - `https://www.youtube.com/shorts/{videoId}`
3. `maxComments` ≤ 0 treated as unlimited (with warning logged)
4. `commentsSortBy` must be "0" or "1"

---

## Entity: Video

Represents a YouTube video from which comments are extracted.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `videoId` | `string` | YouTube video identifier (11 characters) |
| `url` | `string` | Original input URL |
| `finalUrl` | `string` | Canonical URL after normalization |
| `title` | `string` | Video title |
| `commentsCount` | `number \| null` | Total comment count (if available) |

### Derivation

- Extracted from video page `ytInitialData` JSON
- `videoId` parsed from URL or page metadata
- `title` from `videoDetails.title`
- `commentsCount` from engagement panel (may be approximate)

---

## Entity: Comment

Represents a single YouTube comment (top-level or reply).

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `cid` | `string` | Yes | Unique comment identifier |
| `comment` | `string` | Yes | Comment text content |
| `author` | `string` | Yes | Author display name (e.g., "@username") |
| `videoId` | `string` | Yes | Video identifier this comment belongs to |
| `pageUrl` | `string` | Yes | Video URL |
| `title` | `string` | Yes | Video title |
| `commentsCount` | `number` | Yes | Total comments on the video |
| `voteCount` | `number` | Yes | Like count for this comment |
| `replyCount` | `number` | Yes | Number of replies to this comment |
| `authorIsChannelOwner` | `boolean` | Yes | Whether author is the video creator |
| `hasCreatorHeart` | `boolean` | Yes | Whether creator liked this comment |
| `type` | `"comment" \| "reply"` | Yes | Top-level comment or reply |
| `replyToCid` | `string \| null` | Yes | Parent comment ID (null for top-level) |
| `date` | `string` | Yes | Posted date (relative, e.g., "2 days ago") |

### Output Schema (matches example_readme.md)

```json
{
  "comment": "This is up there with their best songs.",
  "cid": "UgxRn0_LUxzRP2MybPR4AaABAg",
  "author": "@Nonie_Jay",
  "videoId": "bJTjJtRPqYE",
  "pageUrl": "https://www.youtube.com/watch?v=bJTjJtRPqYE",
  "commentsCount": 171,
  "replyCount": 0,
  "voteCount": 2,
  "authorIsChannelOwner": false,
  "hasCreatorHeart": false,
  "type": "comment",
  "replyToCid": null,
  "title": "Halestorm - Unapologetic [Official Audio]"
}
```

### Data Extraction Mapping (InnerTube → Output)

| Output Field | InnerTube Path |
|--------------|----------------|
| `cid` | `commentRenderer.commentId` |
| `comment` | `commentRenderer.contentText.runs[].text` (joined) |
| `author` | `commentRenderer.authorText.simpleText` |
| `voteCount` | `commentRenderer.voteCount.simpleText` (parsed) |
| `replyCount` | `commentRenderer.replyCount` |
| `authorIsChannelOwner` | `commentRenderer.authorIsChannelOwner` |
| `hasCreatorHeart` | `commentRenderer.actionButtons.commentActionButtonsRenderer.creatorHeart` exists |
| `date` | `commentRenderer.publishedTimeText.runs[0].text` |

---

## Entity: RunSummary

Written to Key-Value Store at end of run for observability (Constitution Principle VI).

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `startedAt` | `string` | ISO timestamp of run start |
| `finishedAt` | `string` | ISO timestamp of run end |
| `totalVideos` | `number` | Number of videos processed |
| `successfulVideos` | `number` | Videos with comments extracted |
| `failedVideos` | `number` | Videos that failed completely |
| `totalComments` | `number` | Total comments extracted |
| `avgCommentsPerSecond` | `number` | Throughput metric |
| `errors` | `ErrorSummary[]` | Top errors by category |
| `recommendations` | `string[]` | Suggestions if block rate high |

### Nested Type: ErrorSummary

| Field | Type | Description |
|-------|------|-------------|
| `category` | `string` | BLOCKED, TRANSIENT, PERMANENT |
| `count` | `number` | Occurrences |
| `example` | `string` | Sample URL and message |

---

## State Transitions

### Video Processing States

```
PENDING → PROCESSING → SUCCESS
                    → FAILED (with error category)
                    → PARTIAL (some comments, then failed)
```

### Comment Extraction States

```
FETCHING → EXTRACTED → PUSHED_TO_DATASET
                    → SKIPPED (duplicate, deleted)
```

---

## Validation Rules Summary

### Input Validation (Early Fail)

| Rule | Error Message |
|------|---------------|
| No startUrls provided | "Input validation failed: startUrls is required and must contain at least one URL" |
| Invalid YouTube URL | "Invalid YouTube URL: {url}. Expected format: youtube.com/watch?v=... or youtu.be/..." |
| Invalid sortBy value | "Invalid commentsSortBy: must be '0' (Top) or '1' (Newest first)" |

### Runtime Validation (Continue Processing)

| Condition | Behavior |
|-----------|----------|
| Video not found (404) | Log error, skip to next video |
| Comments disabled | Log "Comments disabled for {videoId}", skip |
| Private/age-restricted | Log error, skip to next video |
| Rate limited (429) | Exponential backoff, retry up to 3 times |

---

## Data Privacy Compliance

Per spec requirements FR-017 and FR-018:

- **Extracted**: Only publicly visible comment data
- **NOT Extracted**: Email addresses, gender, location, private profile data
- **Logged to User**: Privacy compliance statement in README
