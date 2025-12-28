# YouTube Comments Scraper

Extract comments from YouTube videos with full metadata including engagement metrics, creator interactions, and reply threading.

## Features

- Extract all publicly visible comments from YouTube videos
- Support for multiple video URLs in a single run
- Reply extraction with parent comment linking
- Engagement metrics (votes, reply counts)
- Creator interaction detection (hearts, channel owner comments)
- Multiple sort options (Top comments, Newest first)
- Export to JSON, CSV, Excel, XML, HTML via Apify platform
- Built-in rate limiting with exponential backoff
- Residential proxy support for reliable extraction

## Quick Start

### Minimal Input

```json
{
  "startUrls": [
    { "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
  ]
}
```

Click **Start** and the actor will extract all comments from the video.

### Multiple Videos with Limit

```json
{
  "startUrls": [
    { "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    { "url": "https://www.youtube.com/watch?v=9bZkp7q19f0" },
    { "url": "https://youtu.be/kJQP7kiw5Fk" }
  ],
  "maxComments": 500,
  "commentsSortBy": "0"
}
```

## Input Schema

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `startUrls` | array | Yes | - | Array of YouTube video URLs to scrape |
| `maxComments` | integer | No | 0 (unlimited) | Maximum comments per video. Set to 0 for all comments |
| `commentsSortBy` | string | No | "1" | Sort order: "0" = Top comments, "1" = Newest first |
| `proxyConfiguration` | object | No | Residential | Proxy settings for requests |

### Supported URL Formats

- Standard: `https://www.youtube.com/watch?v=VIDEO_ID`
- Short: `https://youtu.be/VIDEO_ID`
- Shorts: `https://www.youtube.com/shorts/VIDEO_ID`

## Output Schema

Each comment in the dataset contains:

| Field | Type | Description |
|-------|------|-------------|
| `cid` | string | Unique comment identifier |
| `comment` | string | The comment text content |
| `author` | string | Comment author display name (e.g., @username) |
| `videoId` | string | YouTube video identifier (11 characters) |
| `pageUrl` | string | Full URL to the YouTube video |
| `title` | string | Title of the YouTube video |
| `commentsCount` | integer | Total number of comments on the video |
| `voteCount` | integer | Number of likes on this comment |
| `replyCount` | integer | Number of replies to this comment |
| `authorIsChannelOwner` | boolean | True if the comment author is the video creator |
| `hasCreatorHeart` | boolean | True if the video creator liked this comment |
| `type` | string | "comment" for top-level, "reply" for replies |
| `replyToCid` | string/null | Parent comment ID for replies, null for top-level comments |
| `date` | string | When the comment was posted (e.g., "2 days ago") |

### Sample Output

```json
{
  "cid": "UgxRn0_LUxzRP2MybPR4AaABAg",
  "comment": "This is up there with their best songs.",
  "author": "@Nonie_Jay",
  "videoId": "bJTjJtRPqYE",
  "pageUrl": "https://www.youtube.com/watch?v=bJTjJtRPqYE",
  "title": "Halestorm - Unapologetic [Official Audio]",
  "commentsCount": 171,
  "voteCount": 2,
  "replyCount": 0,
  "authorIsChannelOwner": false,
  "hasCreatorHeart": false,
  "type": "comment",
  "replyToCid": null,
  "date": "2 days ago"
}
```

## Run Summary

After each run, a summary is saved to the Key-Value Store under the key `RUN_SUMMARY`:

```json
{
  "startedAt": "2025-12-28T10:00:00.000Z",
  "finishedAt": "2025-12-28T10:02:30.000Z",
  "totalVideos": 3,
  "successfulVideos": 2,
  "failedVideos": 1,
  "totalComments": 450,
  "totalReplies": 87,
  "avgCommentsPerSecond": 3.0,
  "durationSeconds": 150,
  "errors": [
    {
      "category": "PERMANENT",
      "count": 1,
      "message": "Comments disabled for video",
      "urls": ["https://www.youtube.com/watch?v=abc123"]
    }
  ],
  "recommendations": []
}
```

## Proxy Configuration

For reliable extraction, residential proxies are recommended:

```json
{
  "proxyConfiguration": {
    "useApifyProxy": true,
    "apifyProxyGroups": ["RESIDENTIAL"]
  }
}
```

### Options

| Setting | Description |
|---------|-------------|
| `useApifyProxy` | Enable Apify proxy (recommended) |
| `apifyProxyGroups` | Proxy groups: `RESIDENTIAL`, `DATACENTER` |
| `apifyProxyCountry` | Specific country code (e.g., "US") |
| `proxyUrls` | Custom proxy URLs (array of strings) |

## Performance Tips

| Scenario | Recommendation |
|----------|----------------|
| Quick test | Set `maxComments: 10` to verify setup |
| Large extraction (10k+ comments) | Use residential proxies (default) |
| Multiple videos | Keep under 50 URLs per run for reliability |
| Cost optimization | Set reasonable `maxComments` limits |

## Troubleshooting

| Issue | Possible Cause | Solution |
|-------|----------------|----------|
| No comments extracted | Video has comments disabled | Check video settings on YouTube |
| Rate limiting errors | Too many requests | Actor handles automatically with backoff |
| Invalid URL error | Incorrect URL format | Use supported URL formats above |
| Slow extraction | Video has many comments | Set `maxComments` limit to speed up |
| BLOCKED errors | IP blocked by YouTube | Use residential proxies |
| Partial results | Transient error during extraction | Re-run the actor |

## Error Categories

The actor classifies errors into three categories:

- **PERMANENT**: Cannot be resolved (comments disabled, video not found)
- **TRANSIENT**: Temporary issues (network errors, timeouts)
- **BLOCKED**: Access denied (rate limits, IP blocks)

## Use Cases

- **Sentiment Analysis**: Analyze comment text and engagement for brand monitoring
- **Competitive Research**: Compare comment volumes and engagement across channels
- **Trend Identification**: Track popular topics through comment analysis
- **Community Management**: Export comments for moderation workflows
- **Content Strategy**: Identify high-engagement content patterns

## Limitations

- Only extracts publicly visible comments
- Cannot access comments on private or age-restricted videos
- YouTube may rate-limit requests (handled automatically)
- Comment dates are in relative format ("2 days ago")

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run locally
npm start

# Run with Apify CLI
apify run
```

## License

ISC
