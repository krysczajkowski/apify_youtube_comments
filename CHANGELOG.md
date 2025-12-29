# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-29

### Added
- Initial release with HTTP-first comment extraction
- Support for multiple YouTube URL formats (watch, shorts, embed, short links)
- Retry logic with exponential backoff and jitter (base 1000ms, max 30000ms, 3 retries)
- Proxy configuration support with Apify Residential proxies
- Comment sorting by engagement (Top comments) or chronological order (Newest first)
- Reply extraction with parent comment linking
- Creator interaction detection (channel owner comments, creator hearts)
- Run summary with statistics saved to Key-Value Store
- Error categorization (PERMANENT, TRANSIENT, BLOCKED) with actionable recommendations
- Comprehensive output schema with 14 fields per comment
- Input validation with prefilled example URL
- Maximum comments limit (0-100,000) to prevent runaway costs
- Support for both legacy InnerTube API format and new frameworkUpdates entity format
- Streaming output to Apify Dataset for memory efficiency
- Unit tests for URL validation, retry logic, comment extraction, and metadata parsing
- Integration tests verifying complete extraction flow
