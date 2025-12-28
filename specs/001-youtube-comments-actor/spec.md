# Feature Specification: YouTube Comments Scraper Actor

**Feature Branch**: `001-youtube-comments-actor`
**Created**: 2025-12-28
**Status**: Draft
**Input**: User description: "Your goal is to create apify actor. The actor is supposed to work like in example_readme.md file."

## Clarifications

### Session 2025-12-28

- Q: When a video has comments disabled, how should the actor respond? → A: Log error with clear message "Comments disabled" and continue processing
- Q: When YouTube rate limits the scraper, how should it respond? → A: Implement exponential backoff with 3 retry attempts, then fail gracefully
- Q: When maxComments is set to zero or a negative number, what should happen? → A: Treat as unlimited extraction (extract all comments) with warning logged
- Q: When a video has 100k+ comments and no maxComments limit is specified, what should happen? → A: Honor maxComments if set; otherwise log warning and extract all

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Extract Comments from Single Video (Priority: P1)

A user provides a YouTube video URL and extracts all publicly available comments including comment text, author information, engagement metrics, and metadata.

**Why this priority**: This is the core functionality of the actor - extracting comment data from YouTube videos. Without this capability, the actor has no value.

**Independent Test**: Can be fully tested by providing a single YouTube video URL with known comments and verifying that all comment fields are extracted correctly, delivering a complete dataset of comments for analysis.

**Acceptance Scenarios**:

1. **Given** a valid YouTube video URL, **When** the user starts the scraper with default settings, **Then** all publicly visible comments are extracted with complete metadata
2. **Given** a YouTube video URL and maxComments limit, **When** the user starts the scraper, **Then** extraction stops after reaching the specified limit
3. **Given** a YouTube video with nested replies, **When** the scraper processes the video, **Then** both top-level comments and replies are extracted with correct parent-child relationships
4. **Given** a YouTube video URL, **When** extraction completes, **Then** the dataset includes comment text, author name, comment ID, video ID, date posted, vote count, reply count, and creator interaction flags

---

### User Story 2 - Batch Process Multiple Videos (Priority: P2)

A user provides multiple YouTube video URLs and processes them all in a single scraping run to collect comments from multiple sources simultaneously.

**Why this priority**: Enables efficient data collection at scale for users analyzing multiple videos, such as competitor monitoring or trend analysis across channels.

**Independent Test**: Can be tested by providing a list of multiple YouTube URLs and verifying that comments from all videos are extracted and properly attributed to their source videos.

**Acceptance Scenarios**:

1. **Given** multiple YouTube video URLs in the input, **When** the scraper runs, **Then** comments from all videos are extracted and stored in a single dataset
2. **Given** a CSV file or Google Sheet with YouTube URLs, **When** the user imports the list, **Then** all URLs are processed sequentially or in parallel
3. **Given** multiple video URLs where some are invalid, **When** the scraper processes the list, **Then** valid videos are processed successfully while invalid ones are logged as errors

---

### User Story 3 - Export Data in Multiple Formats (Priority: P2)

A user completes comment extraction and downloads the results in their preferred format for analysis or integration with other tools.

**Why this priority**: Different use cases require different data formats - analysts may prefer Excel, developers may need JSON, and business users might want CSV for database imports.

**Independent Test**: Can be tested by completing any extraction and verifying that the dataset can be exported successfully in all supported formats with correct data structure preservation.

**Acceptance Scenarios**:

1. **Given** a completed extraction dataset, **When** the user requests JSON export, **Then** the data is provided in valid JSON format with all fields preserved
2. **Given** a completed extraction dataset, **When** the user requests CSV export, **Then** the data is provided as a properly formatted CSV file
3. **Given** a completed extraction dataset, **When** the user requests Excel export, **Then** the data is provided as an Excel file with appropriate column headers
4. **Given** a completed extraction dataset, **When** the user requests XML or HTML export, **Then** the data is provided in the requested format

---

### User Story 4 - Monitor and Analyze Comments (Priority: P3)

A user leverages extracted comment data for various analytical purposes including sentiment analysis, competitor monitoring, trend identification, and community insights.

**Why this priority**: While important for value realization, this is a downstream use case that depends on successful data extraction. Users can perform analysis with their own tools once data is extracted.

**Independent Test**: Can be tested by extracting comments with specific characteristics (e.g., mentions of brands, specific keywords, temporal patterns) and verifying that the extracted data contains all necessary fields for analysis.

**Acceptance Scenarios**:

1. **Given** extracted comments containing brand mentions, **When** the user searches the dataset, **Then** all relevant comments are identifiable with author and timestamp information
2. **Given** extracted comments with vote counts and reply counts, **When** the user analyzes engagement, **Then** metrics are accurate and complete for trend analysis
3. **Given** extracted comments with dates, **When** the user performs temporal analysis, **Then** posting times are accurately captured for trend identification
4. **Given** extracted comments with creator interaction flags, **When** the user filters for creator-liked comments, **Then** all comments marked with creator hearts are identifiable

---

### Edge Cases

- **Comments disabled**: System logs clear error message "Comments disabled" and continues processing other videos in the batch
- **Rate limiting**: System uses exponential backoff strategy with 3 retry attempts before failing gracefully with clear error message
- **Invalid maxComments values**: Zero or negative values are treated as unlimited extraction (all comments extracted) with warning logged
- **Large comment volumes (100k+)**: System honors maxComments limit if set; when unlimited extraction is requested, logs warning about large volume and proceeds with extraction
- What happens when a YouTube video is private or deleted during scraping?
- What happens when the user provides an invalid YouTube URL format?
- How does the system handle comments in non-Latin scripts or with special characters/emojis?
- What happens when a comment is deleted or modified during the scraping process?
- How does the system handle age-restricted videos that require sign-in?
- How does the system handle network interruptions during scraping?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept one or more YouTube video URLs as input
- **FR-002**: System MUST extract comment text from all publicly visible comments on provided videos
- **FR-003**: System MUST capture comment metadata including comment ID (cid), author name, video ID, page URL, and video title
- **FR-004**: System MUST capture engagement metrics including vote count, reply count, and total comments count
- **FR-005**: System MUST identify whether a comment has been liked by the video creator (hasCreatorHeart flag)
- **FR-006**: System MUST identify whether the comment author is the channel owner (authorIsChannelOwner flag)
- **FR-007**: System MUST capture the date when each comment was posted
- **FR-008**: System MUST distinguish between top-level comments and replies, storing reply-to relationships
- **FR-009**: System MUST support limiting the number of comments extracted via a maxComments parameter
- **FR-009a**: System MUST treat maxComments values of zero or negative numbers as unlimited extraction, logging a warning for user awareness
- **FR-009b**: System MUST log warnings when extracting from videos with extremely large comment counts (100k+) without a maxComments limit, then proceed with extraction
- **FR-010**: System MUST accept input in JSON format with startUrls array and maxComments parameter
- **FR-011**: System MUST support importing URLs from CSV files or Google Sheets
- **FR-012**: System MUST store extracted data in a dataset accessible via the Storage tab
- **FR-013**: System MUST support exporting data in JSON, XML, CSV, Excel, and HTML formats
- **FR-014**: System MUST handle multiple video URLs in a single run
- **FR-015**: System MUST provide clear error messages when URLs are invalid or inaccessible
- **FR-015a**: System MUST log errors for videos with disabled comments and continue processing remaining videos in batch operations
- **FR-015b**: System MUST implement exponential backoff retry strategy (3 attempts) when encountering rate limits, then fail gracefully with descriptive error message
- **FR-016**: System MUST respect YouTube's robots.txt and terms of service
- **FR-017**: System MUST NOT extract private user data such as email addresses, gender, or location
- **FR-018**: System MUST only extract publicly visible information that users have chosen to share
- **FR-019**: System MUST complete scraping within predictable time limits: 10,000 comments in under 10 minutes, 300 comments in under 3 minutes (per SC-007, SC-009)
- **FR-020**: System MUST be accessible and usable by non-technical users through the Apify platform interface

### Key Entities

- **Comment**: Represents a single YouTube comment with attributes including comment text, unique identifier (cid), author information, engagement metrics (votes, replies), creator interaction indicators, posting date, and video context
- **Video**: Represents a YouTube video source with attributes including video ID, URL, title, and total comment count
- **Author**: Represents a comment author with attributes including display name and channel owner status
- **Dataset**: Represents the collection of extracted comments with support for multiple export formats and tabular viewing

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can extract all comments from a YouTube video by providing only the video URL and clicking Start
- **SC-002**: Complete comment extraction (text, author, date, engagement metrics, creator interactions) is achieved with 100% accuracy for all accessible comments
- **SC-003**: Users can successfully export extracted data in all five supported formats (JSON, XML, CSV, Excel, HTML) without data loss
- **SC-004**: Users with no prior data extraction experience can successfully complete their first scraping task in under 5 minutes
- **SC-005**: System successfully handles batch processing of multiple video URLs in a single run
- **SC-006**: Extracted datasets include all required fields for sentiment analysis, competitive monitoring, and trend identification
- **SC-007**: System processes videos with up to 10,000 comments without timeout or performance degradation
- **SC-008**: Error messages clearly communicate issues with invalid URLs, inaccessible videos, or rate limiting
- **SC-009**: Data extraction completes for a video with 300 comments in under 3 minutes
- **SC-010**: 95% of scraping runs complete successfully without manual intervention

## Assumptions

1. **Proxy Requirements**: Users running the actor on Apify platform have access to residential proxies (included in Starter plan or higher) for successful YouTube scraping
2. **Authentication**: The actor operates without requiring YouTube account credentials, accessing only publicly available data
3. **API Limitations**: The scraper goes beyond standard YouTube API limitations to extract all comments rather than being restricted by API quotas
4. **Rate Limiting**: YouTube may impose rate limits on comment extraction; the actor will handle this gracefully with appropriate delays or retry logic
5. **Comment Availability**: Comment extraction is limited to publicly visible comments; private videos, disabled comments, or restricted content cannot be accessed
6. **Platform Integration**: The actor is designed to run on the Apify platform and integrates with Apify's storage, dataset, and export capabilities
7. **Network Stability**: Users have stable internet connections during scraping; network interruptions may require re-running the actor
8. **Data Retention**: Extracted datasets are stored according to Apify platform retention policies
9. **Legal Compliance**: Users are responsible for ensuring they have legitimate reasons for extracting comment data and comply with applicable data protection regulations
10. **Browser Requirements**: The actor may use browser automation or HTTP requests to access YouTube; the specific implementation approach is not defined in requirements

## Dependencies

- **Apify Platform**: The actor runs within the Apify ecosystem and depends on platform services for execution, storage, and data export
- **Residential Proxies**: Successful scraping requires access to residential proxy services to avoid YouTube blocks
- **YouTube Availability**: The actor depends on YouTube's website structure and public API endpoints remaining accessible
- **Third-party Integrations** (Optional): Users may integrate with Make, Zapier, Slack, Airbyte, GitHub, Google Drive via Apify platform integrations

## Out of Scope

- **Private Video Access**: Accessing age-restricted, private, or member-only videos requiring authentication
- **Real-time Comment Monitoring**: Live tracking of new comments as they are posted (actor provides point-in-time extraction)
- **Sentiment Analysis**: Built-in sentiment analysis or comment classification (users can integrate with separate tools)
- **Comment Moderation**: Flagging, hiding, or deleting harmful comments (actor only extracts data)
- **Video Content Extraction**: Downloading video files, transcripts, or subtitles
- **Channel Statistics**: Extracting channel-level metrics, subscriber counts, or video performance data beyond comment counts
- **Historical Comment Tracking**: Detecting changes to comments, deletions, or edits over time
- **User Profile Data**: Extracting commenter profile information, channel details, or subscriber lists
- **Automatic Scheduling**: Built-in scheduled scraping runs (users can configure this via Apify platform features)
