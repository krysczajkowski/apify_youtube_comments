# Data Model: Fix YouTube Comments API

**Feature**: 002-fix-comments-api
**Date**: 2025-12-28

## Overview

This document describes the data structures involved in the YouTube comments API fix. The existing output schema remains unchanged; this fix focuses on internal data structures for correct API interaction.

---

## 1. InnerTube API Context (Updated)

### Entity: `InnerTubeContext`

The client context structure sent with each API request.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| clientName | string | Yes | Client identifier (`"WEB"`) |
| clientVersion | string | Yes | Current client version (`"2.20250312.04.00"`) |
| hl | string | Yes | Language code (`"en"`) |
| gl | string | Yes | Country code (`"US"`) |
| timeZone | string | Yes | **NEW** Timezone (`"UTC"`) |
| utcOffsetMinutes | number | Yes | **NEW** UTC offset (`0`) |

### Changes from Current Implementation
- Added `timeZone` field
- Added `utcOffsetMinutes` field
- Updated `clientVersion` value

### TypeScript Definition
```typescript
interface InnerTubeClientContext {
  clientName: 'WEB';
  clientVersion: string;
  hl: string;
  gl: string;
  timeZone: string;
  utcOffsetMinutes: number;
}

interface InnerTubeContext {
  client: InnerTubeClientContext;
}
```

---

## 2. API Request Payload

### Entity: `InnerTubeRequest`

Request body sent to the InnerTube API.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| context | InnerTubeContext | Yes | Client context |
| videoId | string | Conditional | Video ID (for initial request) |
| continuation | string | Conditional | Continuation token (for pagination) |

### Validation Rules
- Either `videoId` or `continuation` must be present, never both
- `context` is always required

### TypeScript Definition
```typescript
type InnerTubeRequest =
  | { context: InnerTubeContext; videoId: string }
  | { context: InnerTubeContext; continuation: string };
```

---

## 3. API Response Structure

### Entity: `InnerTubeResponse`

Top-level response from the InnerTube API.

| Field | Type | Description |
|-------|------|-------------|
| engagementPanels | EngagementPanel[] | Panels including comments section |
| onResponseReceivedEndpoints | ResponseEndpoint[] | Contains comment data |
| frameworkUpdates | FrameworkUpdates | New-format comment entities |

### Entity: `EngagementPanel`

Panel containing comments or other engagement features.

| Field | Type | Description |
|-------|------|-------------|
| engagementPanelSectionListRenderer | object | Panel content wrapper |
| engagementPanelSectionListRenderer.panelIdentifier | string | Panel type identifier |
| engagementPanelSectionListRenderer.header | object | Panel header with title |
| engagementPanelSectionListRenderer.content | object | Panel content |

### Panel Identification
- Comments panel: `panelIdentifier === "comment-item-section"`
- OR: Header text contains "Comments"

---

## 4. Continuation Token Extraction Paths

### Primary Path (Engagement Panels)
```
engagementPanels[]
  .engagementPanelSectionListRenderer
  .content
  .sectionListRenderer
  .contents[]
  .itemSectionRenderer
  .contents[]
  .continuationItemRenderer
  .continuationEndpoint
  .continuationCommand
  .token
```

### Legacy Path (Results Section)
```
contents
  .twoColumnWatchNextResults
  .results
  .results
  .contents[]
  .itemSectionRenderer
  .contents[]
  .continuationItemRenderer
  .continuationEndpoint
  .continuationCommand
  .token
```

### Extraction Priority
1. Try engagement panels first (newer format)
2. Fall back to legacy path
3. Return null if neither found

---

## 5. Comment Data Structures

### Entity: `CommentRenderer` (Legacy Format)

| Field | Type | Description |
|-------|------|-------------|
| commentId | string | Unique comment ID |
| authorText | TextObject | Author display name |
| contentText | TextObject | Comment body |
| publishedTimeText | TextObject | Relative timestamp |
| voteCount | TextObject | Like count |
| replyCount | number | Number of replies |
| authorIsChannelOwner | boolean | Is video creator |
| actionButtons | object | Contains creator heart |

### Entity: `CommentEntityPayload` (New Format)

| Field | Type | Description |
|-------|------|-------------|
| properties.commentId | string | Unique comment ID |
| properties.content.content | string | Comment body |
| properties.publishedTime | string | Relative timestamp |
| author.displayName | string | Author name |
| author.channelId | string | Author channel ID |
| toolbar.likeCountA11y | string | Like count (accessibility text) |

### Entity: `TextObject`

YouTube's text container format.

| Field | Type | Description |
|-------|------|-------------|
| simpleText | string | Plain text value |
| runs | TextRun[] | Rich text segments |

### Entity: `TextRun`

| Field | Type | Description |
|-------|------|-------------|
| text | string | Text content |

---

## 6. Sort Order Tokens

### Entity: `SortMenu`

Location of sort-specific continuation tokens.

```
commentsHeaderRenderer
  .sortMenu
  .sortFilterSubMenuRenderer
  .subMenuItems[]
  .serviceEndpoint
  .continuationCommand
  .token
```

### Sort Mapping
| Index | Sort Order |
|-------|------------|
| 0 | Top comments (default) |
| 1 | Newest first |

---

## 7. Output Schema (Unchanged)

The existing `CommentOutput` interface remains unchanged:

```typescript
interface CommentOutput {
  cid: string;
  comment: string;
  author: string;
  videoId: string;
  pageUrl: string;
  title: string;
  commentsCount: number;
  voteCount: number;
  replyCount: number;
  authorIsChannelOwner: boolean;
  hasCreatorHeart: boolean;
  type: 'comment' | 'reply';
  replyToCid: string | null;
  date: string;
}
```

No changes required to output schema - this is a bug fix, not a feature addition.

---

## State Transitions

### Extraction State Machine

```
INITIAL → FETCHING_PAGE → PAGE_LOADED → EXTRACTING_COMMENTS → COMPLETE
                ↓              ↓                ↓
            ERROR_FETCH   ERROR_PARSE      ERROR_API
                                              ↓
                                        PARTIAL_SUCCESS
```

### State Descriptions

| State | Description |
|-------|-------------|
| INITIAL | Starting extraction |
| FETCHING_PAGE | Loading video page HTML |
| PAGE_LOADED | ytInitialData extracted |
| EXTRACTING_COMMENTS | Paginating through comments |
| COMPLETE | All comments extracted or limit reached |
| ERROR_FETCH | Failed to load video page |
| ERROR_PARSE | Failed to parse ytInitialData |
| ERROR_API | InnerTube API call failed |
| PARTIAL_SUCCESS | Some comments extracted before error |

---

## Validation Rules

### Request Validation
1. Video ID must be 11 characters
2. Continuation token must be non-empty string
3. Context must have all required fields

### Response Validation
1. `onResponseReceivedEndpoints` must be array
2. Each comment must have `commentId`
3. Each comment must have `contentText` or `properties.content.content`
4. Empty response after 3 consecutive pages triggers early termination

### Timeout Rules
1. Per-request timeout: 10 seconds
2. Page fetch timeout: 15 seconds
3. Total extraction timeout: 5 minutes (300 seconds)
4. First batch deadline: 30 seconds from start
