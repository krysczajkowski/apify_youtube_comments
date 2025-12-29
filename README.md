# YouTube Comments Scraper

Extract comments from YouTube videos with full metadata including engagement metrics, creator interactions, and reply threading.

## Why Choose This Actor?

### HTTP-First Approach
Unlike browser-based scrapers, this actor uses direct HTTP requests:

- **10-100x faster** than browser automation
- **Significantly lower cost** per comment extracted
- **More reliable** with fewer failures from page rendering issues

### Why Not Browser-Based Scrapers?

Browser automation consumes 20-100x more compute units, adds rendering latency, and fails frequently due to crashes and memory leaks. This actor uses direct HTTP requests instead.

### Performance Comparison

| Metric | This Actor (HTTP) | Browser-Based |
|--------|-------------------|---------------|
| Speed | ~100 comments/sec | ~5-10 comments/sec |
| Cost (CU/1000 comments) | ~0.05 | ~1-5 |
| Success Rate | 95%+ | 70-85% |
| Memory Usage | Low (~128MB) | High (~1GB+) |
| Concurrent Videos | Efficient | Resource-intensive |

## Features

**Performance & Cost Efficiency**
- **HTTP-first architecture** - No browser overhead, minimal compute costs
- **10-100x faster** than browser-based alternatives
- **~95% lower cost** per comment extracted

**Data Extraction**
- Extract all publicly visible comments from YouTube videos
- Support for multiple video URLs in a single run
- Reply extraction with parent comment linking
- Engagement metrics (votes, reply counts)
- Creator interaction detection (hearts, channel owner comments)
- Multiple sort options (Top comments, Newest first)

**Reliability & Export**
- Built-in rate limiting with exponential backoff
- Residential proxy support for reliable extraction
- Export to JSON, CSV, Excel, XML, HTML via Apify platform

## Legal Disclaimer

This actor is provided for educational and legitimate business purposes only. Users are solely responsible for:

- Complying with YouTube's Terms of Service
- Ensuring their use case complies with applicable data protection laws (GDPR, CCPA, etc.)
- Obtaining necessary consents for processing personal data
- Not using extracted data for harassment, spam, or illegal purposes

The actor only extracts publicly available comment data. However, comments may contain personal information. Handle extracted data responsibly.

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

## Cost Estimation

Running this actor consumes Apify platform compute units (CUs). Here are some example scenarios:

| Scenario | Videos | Comments/Video | Est. Time | Est. CUs |
|----------|--------|----------------|-----------|----------|
| Quick test | 1 | 100 | ~30s | ~0.1 |
| Medium batch | 10 | 500 | ~5min | ~1-2 |
| Large extraction | 50 | 1000 | ~30min | ~5-10 |

**Cost factors:**
- HTTP-first approach uses minimal resources
- Residential proxies required (included in Starter plan)
- Memory usage scales with comment count per request

## Integrations

This actor integrates with popular automation platforms:

### Make (Integromat)
Use the Apify module to trigger runs and process results.

### Zapier
Connect via the Apify app to automate workflows.

### Google Sheets
Export results directly to Google Sheets using Apify's built-in integration.

### Webhooks
Receive notifications when runs complete via webhook triggers.

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

### Concurrency

Videos are processed sequentially to minimize detection risk and maintain reliable sessions. For large batches, split URLs across multiple runs.

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

### Login Limitations

This actor operates without authentication, which means:

- Only publicly visible comments are extracted
- Member-only or subscriber-only comments are not accessible
- Age-restricted video comments require manual verification

## Support & Issues

If you encounter any problems or have suggestions:

- **Bug Reports**: [Create an issue](https://github.com/apify/youtube-comments-scraper/issues) with steps to reproduce
- **Feature Requests**: Open an issue describing the desired functionality
- **Questions**: Check existing issues or create a new one

Please include the video URL (if applicable) and any error messages when reporting bugs.

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
