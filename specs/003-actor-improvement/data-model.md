# Data Model: Top-Notch Actor Improvement

**Feature Branch**: `003-actor-improvement`
**Created**: 2025-12-29
**Status**: Complete

This feature focuses on testing infrastructure and documentation, not new data entities. This document describes the test fixture schemas and example input structures.

## Test Fixtures

This feature introduces test fixtures that match existing API response formats. No new production data models are added.

### Fixture: ytInitialData

**Purpose**: Test metadata extraction from video page

**Schema** (relevant fields for testing):
```typescript
interface YtInitialDataFixture {
  // Video metadata path
  contents: {
    twoColumnWatchNextResults: {
      results: {
        results: {
          contents: Array<{
            videoPrimaryInfoRenderer?: {
              title: { runs: Array<{ text: string }> };
            };
            itemSectionRenderer?: {
              contents: Array<{
                commentsEntryPointHeaderRenderer?: {
                  commentCount: { simpleText: string };
                };
                continuationItemRenderer?: {
                  continuationEndpoint: {
                    continuationCommand: { token: string };
                  };
                };
              }>;
            };
          }>;
        };
      };
    };
  };

  // Comments panel path
  engagementPanels: Array<{
    engagementPanelSectionListRenderer: {
      panelIdentifier: string;  // 'comment-item-section'
      content: {
        sectionListRenderer: {
          contents: Array<{
            itemSectionRenderer?: {
              contents: Array<{
                continuationItemRenderer?: {
                  continuationEndpoint: {
                    continuationCommand: { token: string };
                  };
                };
              }>;
            };
          }>;
        };
      };
    };
  }>;
}
```

### Fixture: Comments API Response (Legacy)

**Purpose**: Test comment parsing from InnerTube API

**Schema**:
```typescript
interface CommentsResponseFixture {
  onResponseReceivedEndpoints: Array<{
    reloadContinuationItemsCommand?: {
      continuationItems: Array<{
        commentThreadRenderer?: {
          comment: {
            commentRenderer: {
              commentId: string;
              contentText: { runs?: Array<{ text: string }>; simpleText?: string };
              authorText: { simpleText?: string };
              voteCount: { simpleText?: string };
              replyCount: number;
              authorIsChannelOwner: boolean;
              publishedTimeText: { runs?: Array<{ text: string }> };
              actionButtons?: {
                commentActionButtonsRenderer?: {
                  creatorHeart?: Record<string, unknown>;
                };
              };
            };
          };
          replies?: {
            commentRepliesRenderer?: {
              contents?: Array<{
                continuationItemRenderer?: {
                  continuationEndpoint?: {
                    continuationCommand?: { token: string };
                  };
                };
              }>;
            };
          };
        };
        continuationItemRenderer?: {
          continuationEndpoint?: {
            continuationCommand?: { token: string };
          };
        };
      }>;
    };
    appendContinuationItemsAction?: {
      continuationItems: Array</* same structure */>;
    };
  }>;
}
```

### Fixture: Comments API Response (Entity Format)

**Purpose**: Test new frameworkUpdates parsing

**Schema**:
```typescript
interface CommentsEntityFixture {
  frameworkUpdates: {
    entityBatchUpdate: {
      mutations: Array<{
        payload: {
          commentEntityPayload: {
            properties?: {
              commentId: string;
              content?: { content: string };
              publishedTime?: string;
            };
            author?: {
              displayName: string;
              channelId?: string;
              isCreator?: boolean;
            };
            toolbar?: {
              likeCountA11y?: string;  // "123 likes"
              replyCount?: string;
            };
            engagement?: {
              likeCount?: number;
            };
          };
        };
      }>;
    };
  };
}
```

## Example Input Files

### Entity: Minimal Input

**File**: `examples/minimal.json`

**Schema**:
```typescript
interface MinimalInput {
  startUrls: Array<{
    url: string;
    method?: 'GET';
  }>;
}
```

**Example**:
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

**Validation Rules**:
- `startUrls` must have at least 1 item
- `url` must match YouTube video URL pattern
- All other fields use defaults

### Entity: Advanced Input

**File**: `examples/advanced.json`

**Schema**:
```typescript
interface AdvancedInput {
  startUrls: Array<{ url: string; method?: string }>;
  maxComments: number;
  commentsSortBy: '0' | '1';
  proxyConfiguration: {
    useApifyProxy: boolean;
    apifyProxyGroups: string[];
  };
}
```

**Example**:
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

**Validation Rules**:
- `maxComments`: 0-100000 (per research.md)
- `commentsSortBy`: must be "0" or "1"
- `proxyConfiguration.apifyProxyGroups`: valid Apify proxy groups

### Entity: Multiple Videos Input

**File**: `examples/multiple-videos.json`

**Schema**: Same as AdvancedInput

**Example**:
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

**Validation Rules**:
- Same as above
- Demonstrates batch processing capability

## Documentation Entities

### Entity: CHANGELOG Entry

**Schema**:
```typescript
interface ChangelogEntry {
  version: string;       // semver: "1.0.0"
  date: string;          // ISO date: "2025-12-29"
  sections: {
    added?: string[];
    changed?: string[];
    fixed?: string[];
    deprecated?: string[];
    removed?: string[];
    security?: string[];
  };
}
```

### Entity: Cost Estimate

**Schema** (for README table):
```typescript
interface CostEstimate {
  scenario: string;      // "Quick test", "Medium batch", etc.
  videos: number;        // Number of videos
  commentsPerVideo: number;
  estimatedTime: string; // "~30s", "~5min"
  estimatedCUs: string;  // "~0.1", "~1-2"
}
```

## Existing Types (No Changes)

The following production types remain unchanged:

- `CommentOutput` (src/types/output.ts) - 14 required fields
- `VideoMetadata` (src/types/output.ts) - Video context
- `ActorInput` (src/types/input.ts) - Input schema
- `ValidatedInput` (src/types/input.ts) - Validated input with defaults

## Test Data Requirements

### URL Validation Test Cases

| Input | Expected videoId | Expected isValid |
|-------|------------------|------------------|
| `https://www.youtube.com/watch?v=dQw4w9WgXcQ` | `dQw4w9WgXcQ` | true |
| `https://youtu.be/dQw4w9WgXcQ` | `dQw4w9WgXcQ` | true |
| `https://www.youtube.com/shorts/dQw4w9WgXcQ` | `dQw4w9WgXcQ` | true |
| `https://www.youtube.com/embed/dQw4w9WgXcQ` | `dQw4w9WgXcQ` | true |
| `https://youtube.com/watch?v=dQw4w9WgXcQ` | `dQw4w9WgXcQ` | true |
| `http://www.youtube.com/watch?v=dQw4w9WgXcQ` | `dQw4w9WgXcQ` | true |
| `https://www.google.com` | null | false |
| `https://www.youtube.com/` | null | false |
| `invalid-url` | null | false |
| `""` | null | false |

### Error Classification Test Cases

| Status Code | Message | Expected Category |
|-------------|---------|-------------------|
| 404 | - | PERMANENT |
| 403 | - | BLOCKED |
| 429 | - | BLOCKED |
| 500 | - | TRANSIENT |
| 503 | - | TRANSIENT |
| null | "comments disabled" | PERMANENT |
| null | "captcha detected" | BLOCKED |
| null | "timeout" | TRANSIENT |

### Vote Count Parsing Test Cases

| Input | Expected Output |
|-------|-----------------|
| "1.2K" | 1200 |
| "234" | 234 |
| "1,234" | 1234 |
| "1.5M" | 1500000 |
| "2B" | 2000000000 |
| "" | 0 |
| null | 0 |
