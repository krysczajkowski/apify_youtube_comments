# Quickstart: YouTube Comments Scraper

Get started extracting YouTube comments in under 5 minutes.

## Minimal Input (Copy & Paste)

```json
{
  "startUrls": [
    {
      "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    }
  ]
}
```

That's it! Click **Start** and wait for results.

---

## Step-by-Step Guide

### 1. Open the Actor

Navigate to YouTube Comments Scraper in the Apify Console.

### 2. Add Video URLs

In the **Direct video URLs** field, enter one or more YouTube video URLs:
- Click the input field
- Paste your YouTube URL(s)
- Or click "Import from CSV/Google Sheets" for bulk URLs

Supported URL formats:
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/shorts/VIDEO_ID`

### 3. (Optional) Set Comment Limit

Set **Maximum comments** to limit extraction:
- `0` or empty = extract all comments
- `100` = stop after 100 comments per video

### 4. (Optional) Choose Sort Order

Select **Sorting order**:
- **Top comments** - Most liked/engaged comments first
- **Newest first** - Most recent comments first (default)

### 5. Click Start

Click the **Start** button. The actor will:
1. Load each video page
2. Extract comments with all metadata
3. Save results to the dataset

### 6. Download Results

When complete, go to the **Storage** tab and:
- View data in table format
- Export as JSON, CSV, Excel, XML, or HTML

---

## Example Inputs

### Single Video (Minimal)

```json
{
  "startUrls": [
    { "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
  ]
}
```

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

### Full Configuration

```json
{
  "startUrls": [
    { "url": "https://www.youtube.com/watch?v=xObhZ0Ga7EQ" }
  ],
  "maxComments": 1000,
  "commentsSortBy": "1",
  "proxyConfiguration": {
    "useApifyProxy": true,
    "apifyProxyGroups": ["RESIDENTIAL"]
  }
}
```

---

## Sample Output

Each comment in your dataset looks like this:

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

---

## Performance Tips

| Scenario | Recommendation |
|----------|----------------|
| **Quick test** | Set `maxComments: 10` to verify setup |
| **Large extraction (10k+ comments)** | Use residential proxies (default) |
| **Multiple videos** | Keep under 50 URLs per run for reliability |
| **Cost optimization** | Set reasonable `maxComments` limits |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **No comments extracted** | Check if video has comments enabled |
| **Rate limiting errors** | Actor handles automatically with backoff |
| **Invalid URL error** | Ensure URL is a valid YouTube video link |
| **Slow extraction** | Normal for videos with many comments; set `maxComments` to speed up |

---

## Next Steps

- Read the full [README](../../README.md) for advanced configuration
- Check [output schema](./contracts/output-schema.json) for field details
- Use Apify API for programmatic access
