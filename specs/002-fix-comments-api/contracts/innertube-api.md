# InnerTube API Contract

**Feature**: 002-fix-comments-api
**Date**: 2025-12-28

## Overview

This document defines the contract for YouTube's InnerTube API used to fetch comments. This is an internal API contract (not a public contract we expose).

---

## Endpoint

```
POST https://www.youtube.com/youtubei/v1/next?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8
```

### Parameters
| Parameter | Location | Required | Value |
|-----------|----------|----------|-------|
| key | Query string | Recommended | `AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8` |

---

## Request Headers

| Header | Value | Required |
|--------|-------|----------|
| Content-Type | `application/json` | Yes |
| Accept | `*/*` | Yes |
| Origin | `https://www.youtube.com` | Yes |
| Referer | `https://www.youtube.com/` | Yes |
| User-Agent | Browser-like UA string | Yes |
| Accept-Language | `en-US,en;q=0.9` | Recommended |

---

## Request Body

### Initial Request (Get Continuation Token)

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
  "videoId": "dQw4w9WgXcQ"
}
```

### Pagination Request (Fetch Comments)

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
  "continuation": "Eg0SC2RRdzR3OVdnWGNRGAYygwEaUBIaVWd5..."
}
```

---

## Response

### Success (200 OK)

#### Initial Request Response

Contains engagement panels with comment continuation tokens:

```json
{
  "engagementPanels": [
    {
      "engagementPanelSectionListRenderer": {
        "panelIdentifier": "comment-item-section",
        "header": {
          "engagementPanelTitleHeaderRenderer": {
            "title": { "runs": [{ "text": "Comments" }] },
            "contextualInfo": { "runs": [{ "text": "1,234" }] }
          }
        },
        "content": {
          "sectionListRenderer": {
            "contents": [
              {
                "itemSectionRenderer": {
                  "contents": [
                    {
                      "continuationItemRenderer": {
                        "continuationEndpoint": {
                          "continuationCommand": {
                            "token": "CONTINUATION_TOKEN"
                          }
                        }
                      }
                    }
                  ]
                }
              }
            ]
          }
        }
      }
    }
  ]
}
```

#### Comments Response

Contains actual comment data:

```json
{
  "onResponseReceivedEndpoints": [
    {
      "reloadContinuationItemsCommand": {
        "targetId": "comments-section",
        "continuationItems": [
          {
            "commentsHeaderRenderer": {
              "countText": { "runs": [{ "text": "1,234 Comments" }] },
              "sortMenu": {
                "sortFilterSubMenuRenderer": {
                  "subMenuItems": [
                    {
                      "title": "Top comments",
                      "serviceEndpoint": {
                        "continuationCommand": { "token": "TOP_SORT_TOKEN" }
                      }
                    },
                    {
                      "title": "Newest first",
                      "serviceEndpoint": {
                        "continuationCommand": { "token": "NEWEST_SORT_TOKEN" }
                      }
                    }
                  ]
                }
              }
            }
          },
          {
            "commentThreadRenderer": {
              "comment": {
                "commentRenderer": {
                  "commentId": "UgxAbCdEfGhIjKlMnOp",
                  "authorText": { "simpleText": "@username" },
                  "contentText": { "runs": [{ "text": "Comment text here" }] },
                  "publishedTimeText": { "runs": [{ "text": "2 days ago" }] },
                  "voteCount": { "simpleText": "123" },
                  "replyCount": 5,
                  "authorIsChannelOwner": false,
                  "actionButtons": {
                    "commentActionButtonsRenderer": {
                      "creatorHeart": null
                    }
                  }
                }
              },
              "replies": {
                "commentRepliesRenderer": {
                  "contents": [
                    {
                      "continuationItemRenderer": {
                        "continuationEndpoint": {
                          "continuationCommand": { "token": "REPLIES_TOKEN" }
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          {
            "continuationItemRenderer": {
              "continuationEndpoint": {
                "continuationCommand": { "token": "NEXT_PAGE_TOKEN" }
              }
            }
          }
        ]
      }
    }
  ],
  "frameworkUpdates": {
    "entityBatchUpdate": {
      "mutations": [
        {
          "payload": {
            "commentEntityPayload": {
              "properties": {
                "commentId": "UgxAbCdEfGhIjKlMnOp",
                "content": { "content": "Comment text here" },
                "publishedTime": "2 days ago"
              },
              "author": {
                "displayName": "@username",
                "channelId": "UCabcdefghijk"
              },
              "toolbar": {
                "likeCountA11y": "123 likes"
              }
            }
          }
        }
      ]
    }
  }
}
```

### Error Responses

| Status | Condition | Body |
|--------|-----------|------|
| 403 | Bot detected / Access denied | Error JSON |
| 429 | Rate limited | Error JSON |
| 400 | Invalid request | Error JSON |
| 500 | Server error | Error JSON |

---

## Rate Limits

| Metric | Limit | Recovery |
|--------|-------|----------|
| Requests per second | ~2-5 | Exponential backoff |
| Requests per IP/minute | ~30-60 | Proxy rotation |
| Consecutive fast requests | ~10 | Add random delay |

---

## Timeouts

| Operation | Timeout |
|-----------|---------|
| Connection | 10 seconds |
| Response | 30 seconds |
| Total extraction | 5 minutes |

---

## Retry Strategy

| Error Type | Retry | Backoff |
|------------|-------|---------|
| 5xx | Yes | Exponential (1s, 2s, 4s) |
| 429 | Yes | Longer delay (5s, 10s, 20s) |
| 403 | Limited | Rotate proxy, then fail |
| 400 | No | Permanent failure |
| Timeout | Yes | Standard exponential |
