YouTube Comments Scraper is a data extraction tool created for scraping comments from YouTube that goes beyond the standard YouTube API. As soon as you provide a video URL, you will be able to extract:

*   **All comments** from chosen YouTube videos
*   **Comment text**, author name, **date posted**, vote count, reply count
*   Whether it **has been liked** by the video’s creator
*   **Total comment count**

*   **Monitor competitors’ comments** to see mentions of your brand
*   Find **current trends** and **opinions** shared by commenters
*   **Analyze comments** to find potential for expansion
*   Use extracted data for **sentiment analysis**
*   **Identify harmful** or **illegal** comments
*   Get **quick insight** into what your community is doing and he opinions they hold

YouTube Comments Scraper is designed to be user-friendly, even for those who have never extracted data from YouTube before. Here’s how you can use YouTube Comment Scraper to extract YouTube comment data:

1.  Create an Apify account
2.  Open YouTube Comments Scraper
3.  Add one or more YouTube video URLs to scrape comments
4.  Click the “Start” button and wait for the data to be extracted
5.  Download your data in JSON, XML, CSV, Excel, or HTML

For more information, watch our short video tutorial.

⬇️ Input example[](#input-example)
----------------------------------

The input for YouTube Comments Scraper should be a **YouTube video URL.** You can add as many URLs as you want, or even import a CSV file or Google Sheet with a prepared list of URLs.

![YouTube Comments Scraper input](https://console.apify.com/actors/p7UMdpQnjKmmpR21D/)

Once you’ve entered the URL, you can choose how many results you would like to extract and then click “Start.” Click on the input tab for a full explanation of an input example in JSON.

```

{
    "maxComments": 300,
    "startUrls": [
        {
            "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "method": "GET"
        }
    ]
}
```


⬆️ Output sample[](#output-sample)
----------------------------------

The scraped YouTube comments will be shown as a dataset which you can find in the **Storage** tab. Note that the output is organized as a table for viewing convenience, but it doesn’t show **all the fields**:

![YouTube Comments Scraper output](https://console.apify.com/actors/p7UMdpQnjKmmpR21D/)

You can preview all the fields and choose in which format to download the YouTube comments you’ve extracted: JSON, Excel, HTML table, CSV, or XML. Here below is the same dataset in JSON:

```

{
    "comment": "This is up there with their best songs.",
    "cid": "UgxRn0_LUxzRP2MybPR4AaABAg",
    "author": "@Nonie_Jay",
    "videoId": "bJTjJtRPqYE",
    "pageUrl": "<https://www.youtube.com/watch?v=bJTjJtRPqYE>",
    "commentsCount": 171,
    "replyCount": 0,
    "voteCount": 2,
    "authorIsChannelOwner": false,
    "hasCreatorHeart": false,
    "type": "comment",
    "replyToCid": null,
    "title": "Halestorm - Unapologetic [Official Audio]"
  },
```


Want to try other YouTube APIs and scrapers?[](#want-to-try-other-youtube-apis-and-scrapers)
--------------------------------------------------------------------------------------------

If you want to extract specific YouTube data, you can use one of the specialized scrapers below, each built particularly for the relevant YouTube data scraping case, whether it's shorts, comments, or channels:

*   ▶️ YouTube Scraper
*   🏎 Fast YouTube Channel Scraper
*   ▶️ YouTube Shorts Scraper
*   📽️ YouTube Video Scraper by Hashtag

If you need to download scraped YouTube videos, you can use YouTube Video Downloader.

You can also combine YouTube data with that from other social networks using any of the following scrapers:

*   TikTok scrapers
*   Instagram scrapers
*   Facebook scrapers
*   Or try our other social media scrapers.

Furthermore, you can use the power of AI agents to do multiple tasks at one. For example, our Comments Analyzer Agent can perform sentiment analysis of YouTube videos, or you could try our Influencer Discovery Agent for lead generation on TikTok videos.

Integrating YouTube Shorts Scraper with other apps[](#integrating-youtube-shorts-scraper-with-other-apps)
---------------------------------------------------------------------------------------------------------

YouTube Scraper can be connected with almost any cloud service or web app thanks to integrations on the Apify platform. These include Make, Zapier, Slack, Airbyte, GitHub, Google Drive, and plenty more.

Alternatively, you can use webhooks to carry out an action whenever an event occurs, e.g. get a notification whenever YouTube Scraper successfully finishes a run, or initiate a new process, like ordering your data.

FAQ[](#faq)
-----------

Our YouTube scrapers are ethical and **do not extract any private user data, such as email addresses, gender, or location**. They only extract what the user has chosen to share publicly. However, you should be aware that your **results could contain personal data.** You should not scrape personal data unless you have a legitimate reason to do so.

If you're unsure whether your reason is legitimate, consult your lawyers. You can also read our blog post on the legality of web scraping and ethical scraping.

If you run the scraper on the Apify platform, for successful YouTube scraping you will need residential proxies which are included in Apify's **monthly Starter plan**.

For more details about how our pricing works, platform credits, proxies, and usage, see the platform pricing page.

Yes. You can do so using Apify API which will enable you to manage, schedule, and run any Apify Actors, including this one. The API also lets you access any datasets, monitor Actor performance, fetch results, create and update versions, and more. To access the API using Node.js, use the `apify-client` NPM package. To access the API using Python for scraping YouTube comments, use the `apify-client` PyPi package.

Check out the Apify API reference docs for full details or click on the API tab for code examples.

### Can I use YouTube Scraper through an MCP Server?[](#can-i-use-youtube-scraper-through-an-mcp-server)

With Apify API, you can use almost any Actor in conjunction with an MCP server. You can connect to the MCP server using clients like ClaudeDesktop and LibreChat, or even build your own. Read all about how you can set up Apify Actors with MCP.

For YouTube Scraper, go to the MCP tab and then go through the following steps:

1.  Start a Server-Sent Events (SSE) session to receive a `sessionId`
2.  Send API messages using that `sessionId` to trigger the scraper
3.  The message starts the Amazon ASINs Scraper with the provided input
4.  The response should be: `Accepted`

### Your feedback[](#your-feedback)

We’re always working on improving the performance of our Actors. So if you’ve got any technical feedback for YouTube Comment Scraper or simply found a bug, please create an issue on the Actor’s Issues tab.