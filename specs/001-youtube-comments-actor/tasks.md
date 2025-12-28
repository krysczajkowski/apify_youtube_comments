# Tasks: YouTube Comments Scraper Actor

**Input**: Design documents from `/specs/001-youtube-comments-actor/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: OPTIONAL per constitution - not included unless requested.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and Apify Actor structure

- [x] T001 Create project structure with src/, src/extractors/, src/utils/, src/types/, .actor/ directories
- [x] T002 Initialize Node.js project with package.json (apify ^3.0.0, crawlee ^3.0.0, got-scraping ^4.0.0, typescript ^5.0.0)
- [x] T003 [P] Create tsconfig.json with strict TypeScript configuration for Node.js 18+
- [x] T004 [P] Copy input schema to .actor/input_schema.json from contracts/input-schema.json
- [x] T005 [P] Create .actor/actor.json with Actor configuration (name, version, build settings)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Define TypeScript input types in src/types/input.ts matching contracts/input-schema.json
- [x] T007 [P] Define TypeScript output types in src/types/output.ts matching contracts/output-schema.json
- [x] T008 [P] Define TypeScript run summary types in src/types/run-summary.ts matching contracts/run-summary-schema.json
- [x] T009 Create URL validation and normalization utilities in src/utils/url.ts (YouTube URL patterns: watch?v=, youtu.be/, shorts/)
- [x] T010 [P] Create exponential backoff retry logic in src/utils/retry.ts (base 1000ms, max 30000ms, 3 retries, jitter)
- [x] T011 [P] Create structured logging utilities in src/utils/logger.ts (log levels, error categorization: BLOCKED/TRANSIENT/PERMANENT)
- [x] T012 Create Actor entry point skeleton in src/main.ts (input validation, proxy config, orchestration structure)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Extract Comments from Single Video (Priority: P1)

**Goal**: Extract all publicly visible comments from a single YouTube video with complete metadata

**Independent Test**: Provide a single YouTube video URL, verify all comment fields are extracted correctly with correct data types

### Implementation for User Story 1

- [x] T013 [US1] Create video metadata extractor in src/extractors/metadata.ts (extract videoId, title, commentsCount from ytInitialData)
- [x] T014 [US1] Create comment data extractor in src/extractors/comments.ts (parse commentRenderer to output schema fields)
- [x] T015 [US1] Implement InnerTube API client in src/crawler.ts (got-scraping POST to /youtubei/v1/next with context)
- [x] T016 [US1] Implement initial page fetch in src/crawler.ts (GET video page, extract ytInitialData, find comments continuation token)
- [x] T017 [US1] Implement comment pagination in src/crawler.ts (follow continuation tokens until exhausted or maxComments reached)
- [x] T018 [US1] Implement reply extraction in src/crawler.ts (nested continuation tokens with parent linking via replyToCid)
- [x] T019 [US1] Implement sort order support in src/crawler.ts (commentsSortBy "0" = Top, "1" = Newest)
- [x] T020 [US1] Integrate crawler with main.ts (single video processing, push comments to dataset)
- [x] T021 [US1] Add maxComments limit enforcement in src/main.ts (stop extraction when limit reached, warn if <=0 means unlimited)
- [x] T022 [US1] Add error handling for comments disabled in src/crawler.ts (detect and log "Comments disabled" as PERMANENT error)
- [x] T023 [US1] Add rate limit handling in src/crawler.ts (detect 429/403, trigger exponential backoff from retry.ts)

**Checkpoint**: Single video comment extraction fully functional and testable

---

## Phase 4: User Story 2 - Batch Process Multiple Videos (Priority: P2)

**Goal**: Process multiple YouTube video URLs in a single scraping run

**Independent Test**: Provide a list of 3+ YouTube URLs (including one invalid), verify all valid videos are processed and invalid ones logged as errors

### Implementation for User Story 2

- [x] T024 [US2] Implement batch URL processing loop in src/main.ts (iterate startUrls array, process each video)
- [x] T025 [US2] Add per-video error isolation in src/main.ts (continue processing remaining videos when one fails)
- [x] T026 [US2] Add invalid URL detection in src/utils/url.ts (reject non-YouTube URLs, log as PERMANENT error)
- [x] T027 [US2] Add video-level status tracking in src/main.ts (track PENDING/PROCESSING/SUCCESS/FAILED per video)
- [x] T028 [US2] Update logging for batch context in src/utils/logger.ts (include video index, URL in log messages)

**Checkpoint**: Batch processing of multiple videos functional and testable

---

## Phase 5: User Story 3 - Export Data in Multiple Formats (Priority: P2)

**Goal**: Enable users to download extracted data in JSON, CSV, Excel, XML, HTML formats

**Independent Test**: Complete any extraction and verify dataset exports work in all formats via Apify Storage tab

**Note**: Export functionality (JSON, CSV, Excel, XML, HTML) is provided automatically by Apify platform via the Storage tab. No actor implementation required - the actor only needs to push correctly-structured records to the dataset. Tasks T029/T030 verify schema compliance to ensure all export formats work correctly.

### Implementation for User Story 3

- [x] T029 [US3] Verify output schema compliance in src/extractors/comments.ts (all 14 required fields present with correct types)
- [x] T030 [US3] Add null/undefined handling in src/extractors/comments.ts (ensure no missing required fields in dataset output)

**Checkpoint**: Dataset output compatible with all Apify export formats

---

## Phase 6: User Story 4 - Monitor and Analyze Comments (Priority: P3)

**Goal**: Ensure extracted data contains all fields needed for sentiment analysis, competitive monitoring, and trend identification

**Independent Test**: Extract comments and verify all analysis-relevant fields (date, voteCount, replyCount, authorIsChannelOwner, hasCreatorHeart) are present and accurate

**Note**: Analysis is downstream user activity. Actor ensures data completeness for analysis tools.

### Implementation for User Story 4

- [x] T031 [US4] Verify date field extraction accuracy in src/extractors/comments.ts (relative format "2 days ago" preserved)
- [x] T032 [US4] Verify engagement metrics extraction in src/extractors/comments.ts (voteCount, replyCount parsed correctly from InnerTube response)
- [x] T033 [US4] Verify creator interaction flags in src/extractors/comments.ts (hasCreatorHeart detection from actionButtons, authorIsChannelOwner from commentRenderer)

**Checkpoint**: All analysis-relevant fields extracted accurately

---

## Phase 7: Observability & Polish

**Purpose**: Run summary, documentation, and cross-cutting improvements

- [x] T034 Implement run summary generation in src/main.ts (collect stats: totalVideos, successfulVideos, failedVideos, totalComments, durationSeconds)
- [x] T035 Write run summary to Key-Value Store in src/main.ts (key: "RUN_SUMMARY", format per contracts/run-summary-schema.json)
- [x] T036 [P] Add error categorization to run summary in src/main.ts (aggregate BLOCKED/TRANSIENT/PERMANENT errors with counts and sample URLs)
- [x] T037 [P] Add recommendations to run summary in src/main.ts (e.g., "Consider using residential proxies" if high BLOCKED count)
- [x] T038 Create README.md with quickstart, input/output documentation, troubleshooting guide
- [x] T039 [P] Add warning for large comment volumes in src/main.ts (log warning if video has 100k+ comments and no maxComments limit)
- [x] T040 Run quickstart.md validation (test minimal input example works end-to-end)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational - Core extraction logic
- **User Story 2 (Phase 4)**: Depends on US1 completion - Builds on single video extraction
- **User Story 3 (Phase 5)**: Depends on US1 completion - Output schema verification
- **User Story 4 (Phase 6)**: Depends on US1 completion - Field accuracy verification
- **Polish (Phase 7)**: Depends on US1, US2 completion

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Depends on US1 (reuses crawler.ts) - Adds batch loop around single video processing
- **User Story 3 (P2)**: Can start after US1 - Only verifies output schema compliance
- **User Story 4 (P3)**: Can start after US1 - Only verifies field extraction accuracy

### Within Each User Story

- Types before utilities
- Utilities before extractors
- Extractors before crawler
- Crawler before main.ts integration
- Core implementation before error handling

### Parallel Opportunities

**Phase 1 (Setup)**:
```bash
# After T001, T002 complete:
Task T003: tsconfig.json
Task T004: .actor/input_schema.json
Task T005: .actor/actor.json
```

**Phase 2 (Foundational)**:
```bash
# After T006 completes:
Task T007: output types
Task T008: run summary types
# After T009 completes:
Task T010: retry logic
Task T011: logger utilities
```

**Phase 3 (User Story 1)**:
```bash
# T013 and T014 can run in parallel (different files):
Task T013: metadata extractor
Task T014: comments extractor
```

**Phase 7 (Polish)**:
```bash
# After T035 completes:
Task T036: error categorization
Task T037: recommendations
Task T039: large volume warning
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test single video extraction independently
5. Deploy/demo if ready - users can extract comments from single videos

### Incremental Delivery

1. Setup + Foundational -> Foundation ready
2. User Story 1 -> Test single video -> Deploy (MVP!)
3. User Story 2 -> Test batch processing -> Deploy
4. User Story 3 + 4 -> Verify output quality -> Deploy
5. Polish -> Add observability -> Final release

### Task Count Summary

| Phase | Task Count | Parallel Opportunities |
|-------|------------|----------------------|
| Phase 1: Setup | 5 | 3 tasks parallel |
| Phase 2: Foundational | 7 | 4 tasks parallel |
| Phase 3: US1 | 11 | 2 tasks parallel |
| Phase 4: US2 | 5 | 0 (sequential) |
| Phase 5: US3 | 2 | 0 (sequential) |
| Phase 6: US4 | 3 | 0 (sequential) |
| Phase 7: Polish | 7 | 3 tasks parallel |
| **Total** | **40** | ~12 parallel opportunities |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
