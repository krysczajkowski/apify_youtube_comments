# YouTube Comments Scraper - Improvement Plan

## Executive Summary

This document analyzes the YouTube Comments Scraper actor against the "Top-Notch & Popular Actor Checklist" and outlines improvements needed to achieve top-tier status on the Apify marketplace.

**Analysis Date**: 2025-12-29
**Current Version**: 1.0.0
**Overall Assessment**: Good foundation, needs improvements in testing, documentation completeness, and examples

---

## Checklist Analysis Summary

| Section | Pass Rate | Priority |
|---------|-----------|----------|
| 0) Marketplace Fit | 4/7 (57%) | HIGH |
| 1) Repo Hygiene | 6/14 (43%) | HIGH |
| 2) Actor Metadata | 4/4 (100%) | DONE |
| 3) Input Schema & UX | 13/18 (72%) | MEDIUM |
| 4) Core Architecture | 9/11 (82%) | LOW |
| 5) Performance & Cost | 10/12 (83%) | LOW |
| 6) Reliability & Blocking | 13/17 (76%) | MEDIUM |
| 7) Output Design | 9/13 (69%) | MEDIUM |
| 8) Logging & Observability | 5/5 (100%) | DONE |
| 9) Documentation | 14/23 (61%) | HIGH |
| 10) Examples & Templates | 0/6 (0%) | CRITICAL |
| 11) Testing | 0/7 (0%) | CRITICAL |
| 12) Security & Compliance | 3/5 (60%) | MEDIUM |
| 13) Pricing & Cost | 4/7 (57%) | MEDIUM |
| 14) Publishing Checklist | 6/12 (50%) | HIGH |
| 15) Post-Publish | 0/11 (0%) | LOW (post-launch) |
| 16) Top Actor Criteria | 6/9 (67%) | HIGH |

---

## Section-by-Section Analysis

### 0) Marketplace Fit & Differentiation

#### PASSING:
- [x] Category & user intent is clear (YouTube comments extraction)
- [x] Value prop in 1 sentence: "This actor helps data analysts and marketers extract YouTube comments for sentiment analysis, brand monitoring, and competitive research."
- [x] Actor name includes keywords (youtube-comments-scraper)
- [x] Short description is benefit-led

#### FAILING:
- [ ] **Unique value proposition vs competitors** - Not explicitly documented
- [ ] **Top 3 competitor comparison** - Not documented in README
- [ ] **Maintenance plan for target changes** - Not documented

#### IMPROVEMENTS NEEDED:
1. Add competitor comparison section to README
2. Document UVP (faster HTTP-first approach, better error handling, comprehensive run summary)
3. Add maintenance plan/monitoring strategy to documentation

---

### 1) Repo Hygiene & Project Setup

#### PASSING:
- [x] `src/` contains code only
- [x] `src/main.ts` is thin; logic is in modules
- [x] `README.md` exists
- [x] No secrets in repo (enforced by `.gitignore`)
- [x] Dependencies are minimal and pinned
- [x] `npm run build` / `npm run start` work

#### FAILING:
- [ ] **CHANGELOG.md** - Does not exist
- [ ] **LICENSE file** - Uses "MIT" in package.json but no LICENSE file
- [ ] **CONTRIBUTING.md** - Does not exist
- [ ] **examples/ directory** - Does not exist (only `input_json_example.json` at root)
- [ ] **tests/ directory** - Does not exist
- [ ] **Meaningful tests** - No tests (`npm test` just echoes "No tests configured")
- [ ] **npm test** - Placeholder only
- [ ] **Lint/type checks** - ESLint exists but no tsc --noEmit in scripts

#### IMPROVEMENTS NEEDED:
1. Create `CHANGELOG.md` with version history
2. Create `LICENSE` file (MIT)
3. Create `CONTRIBUTING.md` with contribution guidelines
4. Create `examples/` directory with minimal.json and advanced.json
5. Create `tests/` directory with unit and integration tests
6. Implement actual test suite
7. Add `typecheck` script: `"typecheck": "tsc --noEmit"`

---

### 2) Actor Metadata & Apify Packaging

#### PASSING:
- [x] `actor.json` is complete with name, version, category tags
- [x] README linked/present
- [x] `.actor/input_schema.json` exists and matches code
- [x] Default build pipeline produces correct artifacts (dist/)

#### ALL ITEMS PASS - NO IMPROVEMENTS NEEDED

---

### 3) Input Schema & User UX

#### PASSING:
- [x] First run success with minimal required fields (just startUrls)
- [x] Every input field has human-readable title
- [x] Every input field has clear description
- [x] Every input field has sensible defaults
- [x] Fields are grouped logically
- [x] Expensive features are opt-in
- [x] Supports startUrls editor (Apify standard)
- [x] Input validation catches errors early with actionable messages
- [x] Default concurrency is safe (sequential processing)
- [x] Default max requests prevents runaway (maxComments default)
- [x] Default timeouts prevent infinite hangs (30s first batch, 5min total)
- [x] Default retries prevent expensive loops (max 3)
- [x] Provides example input in README

#### FAILING:
- [ ] **Constraints (min/max/allowed values)** - maxComments has min:0 but no max
- [ ] **Example input pre-filled in actor UI** - `prefill: []` is empty in input_schema.json
- [ ] **urls[] array alternative** - Only supports startUrls format
- [ ] **Search mode (query parameters)** - Not supported
- [ ] **"Auto" mode for key tradeoffs** - No browser fallback mode

#### IMPROVEMENTS NEEDED:
1. Add maximum constraint for maxComments (e.g., max: 1000000)
2. Pre-fill example URL in input_schema.json:
   ```json
   "prefill": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}]
   ```
3. Consider adding `urls` array alternative input field
4. Consider adding search/channel mode in future version
5. Consider "auto" browser fallback mode for blocking scenarios

---

### 4) Core Architecture & Code Quality

#### PASSING:
- [x] Code is modular (input, crawler, extractors, utils)
- [x] Input parsing/config module exists (`types/input.ts`)
- [x] Crawler module exists (`crawler.ts`)
- [x] Extraction/parsing modules exist (`extractors/`)
- [x] Utilities exist (`utils/`)
- [x] Single responsibility per module
- [x] No "god function" in main
- [x] Configuration is centralized (constants at top of files)
- [x] Clear type definitions for Input, Output, and errors

#### FAILING:
- [ ] **Persistence/output module** - Output logic is inline in main.ts (Actor.pushData)
- [ ] **All non-trivial behavior documented** - Some complex logic lacks "why" comments

#### IMPROVEMENTS NEEDED:
1. Consider extracting output persistence to separate module
2. Add more "why" comments to complex extraction logic

---

### 5) Performance & Cost Efficiency

#### PASSING:
- [x] Uses HTTP/got-scraping as default (no browser)
- [x] Browser is NOT used (pure HTTP approach)
- [x] Concurrency is configurable (currently sequential, safe)
- [x] Uses request queue with dedupe equivalent (continuation tokens)
- [x] Implements `maxRequestsPerCrawl` equivalent (maxComments)
- [x] Optional max depth/pagination cap (maxComments)
- [x] No huge arrays in RAM (streaming to dataset)
- [x] Streams writes to dataset incrementally
- [x] No duplicate fetches
- [x] Parsing is minimal (only requested fields)

#### FAILING:
- [ ] **Uses compression/headers properly** - No explicit Accept-Encoding header for compression
- [ ] **Concurrency documented** - Sequential processing not clearly documented

#### IMPROVEMENTS NEEDED:
1. Add `Accept-Encoding: gzip, deflate` header to requests
2. Document concurrency behavior in README (sequential processing)
3. Consider adding `concurrency` input option for advanced users

---

### 6) Reliability, Blocking, and Failure Handling

#### PASSING:
- [x] Supports Apify Proxy configuration + custom proxies
- [x] Proxy is recommended and integrated
- [x] Session rotation via proxy configuration
- [x] Errors are classified (TRANSIENT/BLOCKED/PERMANENT)
- [x] Retry strategy with exponential backoff + jitter
- [x] Max retry count (3 retries)
- [x] Avoids infinite retry loops
- [x] BLOCKED triggers mitigation (log actionable message)
- [x] Run completes with partial success; failures recorded
- [x] Output is validated (validateCommentOutput)
- [x] Detects soft failures (empty results due to layout change)
- [x] Includes statusCode/fetch info for debugging

#### FAILING:
- [ ] **Cookie input for login** - Not supported (only public comments)
- [ ] **Safe rate limits to reduce account bans** - No rate limiting between requests
- [ ] **Slow down concurrency on BLOCKED** - No dynamic concurrency adjustment
- [ ] **Optional fallback to browser** - No browser fallback

#### IMPROVEMENTS NEEDED:
1. Add configurable delay between requests (e.g., `requestDelay: 0-5000ms`)
2. Consider adding cookie/session support for future authenticated access
3. Consider browser fallback mode for heavily blocked scenarios
4. Add dynamic rate limiting on 429 responses

---

### 7) Output Design & Integration Readiness

#### PASSING:
- [x] Output JSON schema is consistent across runs
- [x] Each item includes `url` (pageUrl)
- [x] Each item includes `fetchedAt` equivalent (via run summary)
- [x] Main extracted fields documented
- [x] Output fields documented in README with example
- [x] Writes run summary to KV store (`RUN_SUMMARY`)
- [x] Counts: succeeded/failed
- [x] Top error reasons + suggested fixes
- [x] Output is flat enough for CSV/Excel export

#### FAILING:
- [ ] **`finalUrl` in each item** - Only in metadata, not in each comment
- [ ] **`statusCode` in each item** - Not included per comment
- [ ] **`method` (http/browser) provenance** - Not included
- [ ] **avg/median response times** - Only avgCommentsPerSecond, not response times
- [ ] **Throughput estimate** - avgCommentsPerSecond exists, could be clearer
- [ ] **Failed URLs dataset** - Failures only in run summary, not separate dataset
- [ ] **Export guidance** - No Make/Zapier/Sheets workflow notes

#### IMPROVEMENTS NEEDED:
1. Consider adding `method: 'http'` to output for future browser support
2. Add avg/median response time to run summary
3. Consider writing failed URLs to a separate "failures" dataset
4. Add integration workflow guidance to README (Make, Zapier, Sheets)

---

### 8) Logging & Observability

#### PASSING:
- [x] Logging is not noisy by default
- [x] Debug mode available via logDebug (though not user-configurable)
- [x] Logs are structured (include url, status, category)
- [x] Clear start/end logs with configuration summary
- [x] Warnings include "what to do next" (proxy recommendations)

#### ALL ITEMS PASS - Minor improvement:
- Add user-configurable `debug: boolean` input option

---

### 9) Documentation: Marketplace-Grade README

#### PASSING:
- [x] What it does (Features section)
- [x] Who it's for / use cases (Use Cases section)
- [x] Quickstart with copy-paste example
- [x] Inputs explained (basic + advanced)
- [x] Outputs: sample dataset item JSON + field meanings
- [x] Performance & cost tips
- [x] Anti-blocking guidance (proxy section)
- [x] When to use proxy
- [x] Troubleshooting section
- [x] Limitations section
- [x] No "TODO" or placeholder text
- [x] README matches actual input fields and behavior
- [x] At least 2 input examples (minimal and advanced)

#### FAILING:
- [ ] **Safe concurrency recommendations** - Not explicitly documented
- [ ] **Login/cookie notes** - Not documented
- [ ] **Changelog / versioning policy** - No changelog in README
- [ ] **Support: where users report issues** - Not documented
- [ ] **Legal/compliance note** - No user responsibility note
- [ ] **Steps written for non-developers** - Could be clearer for UI clicks
- [ ] **Run summary structure in README** - Exists but could be expanded

#### IMPROVEMENTS NEEDED:
1. Add "Concurrency & Rate Limiting" section explaining sequential processing
2. Add "Support & Issues" section with GitHub link
3. Add "Legal Disclaimer" section about scraping responsibility
4. Add "Changelog" section or link to CHANGELOG.md
5. Improve non-developer guidance for Apify UI usage
6. Document that login/authenticated comments are not supported

---

### 10) Examples & Templates - CRITICAL

#### FAILING:
- [ ] **`examples/minimal.json`** - Does not exist
- [ ] **`examples/advanced.json`** - Does not exist (with proxies, limits)
- [ ] **Site-specific examples** - Does not exist
- [ ] **Example outputs shown in README** - Partial (one example only)

#### IMPROVEMENTS NEEDED (HIGH PRIORITY):
1. Create `examples/` directory
2. Create `examples/minimal.json`:
   ```json
   {
     "startUrls": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}]
   }
   ```
3. Create `examples/advanced.json`:
   ```json
   {
     "startUrls": [
       {"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"},
       {"url": "https://www.youtube.com/watch?v=9bZkp7q19f0"}
     ],
     "maxComments": 500,
     "commentsSortBy": "0",
     "proxyConfiguration": {
       "useApifyProxy": true,
       "apifyProxyGroups": ["RESIDENTIAL"]
     }
   }
   ```
4. Create `examples/multiple-videos.json` for batch processing example
5. Add more output examples to README (reply example, channel owner example)

---

### 11) Testing & Quality Gates - CRITICAL

#### FAILING:
- [ ] **Unit tests for URL normalization** - No tests
- [ ] **Unit tests for error classification** - No tests
- [ ] **Unit tests for extraction parsing with fixtures** - No tests
- [ ] **Smoke/integration test** - No tests
- [ ] **Tests run without secrets** - No tests exist
- [ ] **Selector fixtures and fallback logic tests** - No tests
- [ ] **Health check run configuration** - Not documented

#### IMPROVEMENTS NEEDED (HIGH PRIORITY):
1. Create `tests/` directory structure:
   ```
   tests/
   ├── unit/
   │   ├── url.test.ts
   │   ├── retry.test.ts
   │   ├── comments.test.ts
   │   └── metadata.test.ts
   ├── fixtures/
   │   ├── sample-html.html
   │   └── sample-api-response.json
   └── integration/
       └── smoke.test.ts
   ```
2. Install test framework (vitest or jest)
3. Write unit tests for:
   - `utils/url.ts` - URL validation and normalization
   - `utils/retry.ts` - Error classification logic
   - `extractors/comments.ts` - Comment parsing with fixtures
   - `extractors/metadata.ts` - Metadata extraction with fixtures
4. Write smoke test that runs against a known video
5. Add test fixtures with HTML snapshots
6. Update package.json test script
7. Add "Health Check" input example for periodic verification

---

### 12) Security & Compliance

#### PASSING:
- [x] No secrets are logged
- [x] Sensitive inputs marked as secrets (proxyConfiguration uses proxy editor)
- [x] Avoid collecting unnecessary personal data

#### FAILING:
- [ ] **Clear warning about scraping terms/privacy** - Not in README
- [ ] **Respect robots/ToS guidance** - Not documented

#### IMPROVEMENTS NEEDED:
1. Add legal disclaimer section to README:
   ```markdown
   ## Legal Notice

   This actor extracts publicly available data from YouTube. Users are responsible
   for ensuring their use complies with YouTube's Terms of Service and applicable
   laws. This tool is intended for legitimate purposes such as research, sentiment
   analysis, and brand monitoring.
   ```
2. Document that only public comments are extracted

---

### 13) Pricing & Cost Communication

#### PASSING:
- [x] Users can estimate cost (maxComments limit, proxy usage documented)
- [x] Browser mode not used (cost-efficient)
- [x] Max pages/requests controllable
- [x] Proxy usage documented

#### FAILING:
- [ ] **Cost drivers clearly documented** - Could be clearer
- [ ] **Concurrency cost impact** - Not documented
- [ ] **Expensive options clearly labeled** - Proxy groups could be labeled

#### IMPROVEMENTS NEEDED:
1. Add "Cost Estimation" section to README:
   ```markdown
   ## Cost Estimation

   | Scenario | Estimated Cost |
   |----------|----------------|
   | 100 comments, no proxy | ~$0.01 |
   | 1,000 comments, residential proxy | ~$0.05 |
   | 10,000 comments, residential proxy | ~$0.25 |
   ```
2. Label residential proxies as "more expensive but more reliable"

---

### 14) Publishing Checklist

#### PASSING:
- [x] Title is keyword-rich
- [x] One-line description communicates benefit
- [x] Full description includes what it extracts
- [x] Category tags are correct (assumed)
- [x] Version bumped (1.0)
- [x] Example inputs verified locally

#### FAILING:
- [ ] **Full description - use cases** - Could be expanded
- [ ] **Full description - key differentiators** - Not listed
- [ ] **Icon/logo** - Not checked (no icon file in repo)
- [ ] **Screenshots/GIF** - Not present
- [ ] **CHANGELOG updated** - No CHANGELOG exists
- [ ] **README verified on store page** - Not verified

#### IMPROVEMENTS NEEDED:
1. Create/update icon for actor
2. Create screenshots showing:
   - Input configuration
   - Output dataset
   - Run summary/logs
3. Create CHANGELOG.md
4. Verify README renders correctly on Apify store
5. Add key differentiators to actor description

---

### 15) Post-Publish: Growth, Support, and Continuous Improvement

**Note**: These are post-launch activities. Document them for future reference.

#### FUTURE ITEMS:
- [ ] Quick issue response (<48h target)
- [ ] FAQ entries from common issues
- [ ] User request tracking
- [ ] Target change monitoring
- [ ] Quick patch process
- [ ] Backward-compatible schema
- [ ] Review encouragement
- [ ] Negative review response
- [ ] Failure reason tracking
- [ ] Tutorial/guide creation
- [ ] Integration snippets (API, webhook, Make/Zapier)

---

### 16) "Top Actor" Acceptance Criteria

#### PASSING:
- [x] New user can succeed within 3 minutes (minimal input works)
- [x] Actor tolerates partial failures and completes runs
- [x] Blocked/429 handled (documented with recommendations)
- [x] Default mode is cost-efficient (HTTP only)
- [x] Output schema is stable and documented
- [x] Run summary includes actionable diagnostics

#### FAILING:
- [ ] **Tests exist and pass** - No tests exist
- [ ] **Docs match code behavior exactly** - Minor gaps (concurrency not documented)
- [ ] **Maintenance monitoring + patch plan** - Not documented

#### IMPROVEMENTS NEEDED:
1. Implement test suite
2. Document maintenance monitoring plan
3. Ensure all behavior is documented

---

## Priority Improvement Tasks

### CRITICAL (Must Fix Before Publishing)

1. **Create Test Suite**
   - Set up test framework (vitest recommended)
   - Write unit tests for URL validation, error classification, extractors
   - Create HTML fixtures for extraction tests
   - Write smoke test

2. **Create Examples Directory**
   - `examples/minimal.json`
   - `examples/advanced.json`
   - `examples/multiple-videos.json`

### HIGH PRIORITY

3. **Create Required Documentation Files**
   - `CHANGELOG.md`
   - `LICENSE` (MIT)
   - `CONTRIBUTING.md`

4. **Enhance README**
   - Add legal disclaimer
   - Add support/issues section
   - Add competitor comparison
   - Add concurrency documentation
   - Add cost estimation table

5. **Improve Input Schema**
   - Pre-fill example URL
   - Add max constraint for maxComments

### MEDIUM PRIORITY

6. **Publishing Assets**
   - Create/verify icon
   - Create screenshots

7. **Output Improvements**
   - Add method provenance field
   - Consider failed URLs dataset
   - Add response time metrics to run summary

8. **Performance Improvements**
   - Add compression headers
   - Add configurable request delay
   - Document concurrency behavior

### LOW PRIORITY (Post-Launch)

9. **Future Features**
   - Browser fallback mode
   - Search/channel mode
   - Cookie/session support
   - Dynamic rate limiting

10. **Post-Publish Setup**
    - Monitoring alerts
    - Issue response process
    - Review encouragement

---

## Implementation Order

1. **Phase 1: Testing & Examples** (Blocks publishing)
   - Create tests/
   - Create examples/
   - Add test command to package.json

2. **Phase 2: Documentation** (Required for quality)
   - CHANGELOG.md
   - LICENSE
   - README enhancements

3. **Phase 3: Input/Output Polish**
   - Pre-fill example
   - Add max constraint
   - Add method field

4. **Phase 4: Publishing**
   - Verify on Apify platform
   - Create screenshots
   - Final README review

5. **Phase 5: Post-Launch**
   - Monitor for issues
   - Set up alerts
   - Iterate based on feedback

---

## Conclusion

The YouTube Comments Scraper has a solid foundation with good architecture, proper error handling, and a functional HTTP-first approach. The main gaps are:

1. **No tests** - Critical blocker for quality assurance
2. **No examples directory** - Important for user adoption
3. **Missing standard files** - CHANGELOG, LICENSE, CONTRIBUTING
4. **Documentation gaps** - Legal, support, cost estimation

Addressing the CRITICAL and HIGH priority items will bring this actor to top-tier marketplace quality. The estimated effort is 4-8 hours of focused development.
