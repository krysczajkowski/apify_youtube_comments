# Research: Fix YouTube Comments API

**Feature**: 002-fix-comments-api
**Date**: 2025-12-28

## Executive Summary

The current implementation fails to retrieve comments due to:
1. Missing API key parameter in requests
2. Outdated client version string
3. Incorrect continuation token extraction paths for newer YouTube response format
4. No timeout enforcement causing infinite loops

This research identifies the correct InnerTube API structure and response parsing requirements.

---

## 1. API Key Requirement

### Decision
Add optional API key as query parameter: `?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8`

### Rationale
- Each YouTube client has an assigned API key, but the endpoint doesn't strictly validate which key is used
- Keys don't rotate frequently, making hardcoding acceptable
- The mweb API key (`AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8`) is commonly used and stable
- YouTube.js library works without API keys in many cases, but having one increases reliability

### Alternatives Considered
- **No API key**: Works sometimes but may cause intermittent failures
- **Dynamic extraction**: More robust but adds complexity (scrape from YouTube HTML)
- **Different key**: `AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w` also documented as valid

---

## 2. API Endpoint

### Decision
Continue using `/youtubei/v1/next` endpoint

### Rationale
- `/youtubei/v1/next` is correct for loading continuation content including comments
- Documentation confirms: use `next` when videoId is provided, `browse` for channels/playlists
- Full URL: `https://www.youtube.com/youtubei/v1/next?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8`

### Alternatives Considered
- `/youtubei/v1/browse`: For channel/playlist pages, not video comments
- `/youtubei/v1/comment/get_comments`: Does not exist as separate endpoint

---

## 3. Client Version

### Decision
Update `clientVersion` from `2.20251220.00.00` to `2.20250312.04.00`

### Rationale
- Based on yt-dlp's current implementation (most actively maintained YouTube client)
- Version format: `2.YYYYMMDD.XX.XX`
- Outdated versions may be flagged and rejected by YouTube

### Client Configuration

| Parameter | Value |
|-----------|-------|
| clientName | `WEB` |
| clientVersion | `2.20250312.04.00` |
| hl | `en` |
| gl | `US` |
| timeZone | `UTC` |
| utcOffsetMinutes | `0` |

### Alternatives Considered
- ANDROID client: Works but requires different parameters
- Dynamic extraction: Parse from YouTube HTML (more complex)

---

## 4. Request Payload Structure

### Decision
Use two-step process with correct JSON structure

### Step 1: Initial Load (with videoId)
```json
{
  "context": {
    "client": {
      "clientName": "WEB",
      "clientVersion": "2.20250312.04.00",
      "hl": "en",
      "gl": "US",
      "timeZone": "UTC",
      "utcOffsetMinutes": 0
    }
  },
  "videoId": "VIDEO_ID"
}
```

### Step 2: Pagination (with continuation token)
```json
{
  "context": {
    "client": {
      "clientName": "WEB",
      "clientVersion": "2.20250312.04.00",
      "hl": "en",
      "gl": "US",
      "timeZone": "UTC",
      "utcOffsetMinutes": 0
    }
  },
  "continuation": "TOKEN"
}
```

### Required Headers
```
Content-Type: application/json
Accept: */*
Origin: https://www.youtube.com
Referer: https://www.youtube.com/
User-Agent: <browser-like UA>
```

### Rationale
- Two-step process documented in multiple libraries
- First request with videoId returns engagement panels with comment continuation tokens
- Subsequent requests use continuation tokens for actual comments

---

## 5. Continuation Token Extraction

### Decision
Support both legacy path and engagement panels path

### Current Code Issue
The current code searches for continuation tokens in:
```
contents.twoColumnWatchNextResults.results.results.contents[]
  .itemSectionRenderer.contents[].continuationItemRenderer
```

This path may not contain comment tokens in all cases.

### Primary Path (Engagement Panels)
```
engagementPanels[].engagementPanelSectionListRenderer
  .content.sectionListRenderer.contents[]
  .itemSectionRenderer.contents[].continuationItemRenderer
  .continuationEndpoint.continuationCommand.token
```

### Identifying Comments Panel
Look for panel with:
- `panelIdentifier: "comment-item-section"`
- OR header containing "Comments" text

### Rationale
- YouTube has shifted comment tokens to engagement panels
- Legacy path still works for some videos
- Must support both for maximum compatibility

---

## 6. Response Parsing (Comments Data)

### Decision
Support both `commentRenderer` (legacy) and `commentEntityPayload` (new) formats

### Legacy Format (commentRenderer)
```
onResponseReceivedEndpoints[].reloadContinuationItemsCommand
  .continuationItems[].commentThreadRenderer.comment.commentRenderer
```

Fields:
- `commentId`
- `authorText.simpleText`
- `contentText.runs[].text`
- `publishedTimeText.runs[].text`
- `voteCount.simpleText`
- `replyCount`
- `authorIsChannelOwner`

### New Format (commentEntityPayload)
```
frameworkUpdates.entityBatchUpdate.mutations[]
  .payload.commentEntityPayload
```

Fields:
- `properties.commentId`
- `properties.content.content`
- `properties.publishedTime`
- `author.displayName`
- `author.channelId`
- `toolbar.likeCountA11y`

### Rationale
- YouTube is transitioning to entity-based payloads (May 2024 yt-dlp fix)
- Both formats may be present in responses
- New format may have richer data

### Alternatives Considered
- Only legacy format: May miss data in newer responses
- Only new format: May miss data in legacy responses

---

## 7. Timeout and Performance

### Decision
Implement configurable timeouts at multiple levels

### Per-Request Timeout
- API calls: 10 seconds max
- Page fetch: 15 seconds max

### Pagination Timeout
- Total extraction: 5 minutes max (configurable)
- First batch deadline: 30 seconds from start

### Empty Response Handling
- If 3 consecutive pages return 0 comments, abort pagination
- Log warning and return partial results

### Rationale
- Per spec: first batch within 30 seconds
- Per spec: max 5 minutes total extraction
- Fail-fast prevents resource waste

---

## 8. Sort Order Implementation

### Decision
Extract sort-specific continuation tokens from commentsHeaderRenderer

### Sort Options
- Top comments (default): First token in sort menu
- Newest first: Second token in sort menu

### Token Location
```
commentsHeaderRenderer.sortMenu.sortFilterSubMenuRenderer
  .subMenuItems[].serviceEndpoint.continuationCommand.token
```

### Rationale
- Sort order is embedded in continuation token
- Must fetch correct token based on user preference
- Cannot modify existing token to change sort

---

## Implementation Priorities

### P0 - Critical (Fix API Calls)
1. Add API key to request URL
2. Update client version
3. Add `timeZone` and `utcOffsetMinutes` to context

### P1 - High (Fix Token Extraction)
1. Update continuation token extraction to check engagement panels
2. Identify correct panel by `panelIdentifier` or header text

### P2 - Medium (Improve Parsing)
1. Add support for `commentEntityPayload` format
2. Fall back to legacy format if entity payload missing

### P3 - Low (Timeout Enforcement)
1. Add per-request timeouts
2. Add total extraction timeout
3. Add empty response detection

---

## Sources

- [YouTube.js - JavaScript InnerTube Client](https://github.com/LuanRT/YouTube.js)
- [yt-dlp YouTube Extractor](https://github.com/yt-dlp/yt-dlp)
- [tombulled/innertube Issue #60](https://github.com/tombulled/innertube/issues/60)
- [yt-dlp Comments Fix (May 2024)](https://github.com/yt-dlp/yt-dlp/commit/8e15177b4113c355989881e4e030f695a9b59c3a)
- [YouTube Internal Clients Research](https://github.com/zerodytrash/YouTube-Internal-Clients)
- [Reverse-Engineering YouTube](https://tyrrrz.me/blog/reverse-engineering-youtube-revisited)
