# Tasks: Fix YouTube Comments API

**Input**: Design documents from `/specs/002-fix-comments-api/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/innertube-api.md

**Tests**: Not requested in specification (echo "No tests configured")

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Preparation and validation before making changes

- [X] T001 Verify current codebase compiles with `npm run build`
- [X] T002 Review current implementation in src/crawler.ts for API request structure
- [X] T003 [P] Review current implementation in src/extractors/metadata.ts for continuation token extraction

---

## Phase 2: Foundational (API Configuration)

**Purpose**: Core API configuration fixes that MUST be complete before user story fixes can work

**⚠️ CRITICAL**: These fixes are prerequisites for all user stories - incorrect API parameters will cause all stories to fail

- [X] T004 Add API key constant to src/crawler.ts: `const INNERTUBE_API_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8'`
- [X] T005 Update INNERTUBE_API_URL to include API key query parameter in src/crawler.ts
- [X] T006 Update clientVersion to `2.20250312.04.00` in INNERTUBE_CONTEXT in src/crawler.ts
- [X] T007 Add timeZone: 'UTC' field to client context in src/crawler.ts
- [X] T008 Add utcOffsetMinutes: 0 field to client context in src/crawler.ts

**Checkpoint**: API configuration complete - user story implementation can now begin

---

## Phase 3: User Story 1 - Extract Comments Successfully (Priority: P1) 🎯 MVP

**Goal**: Fix the core comment extraction so comments are returned for videos with public comments

**Independent Test**: Run `npm run build && npx apify run --input='{"startUrls":["https://www.youtube.com/watch?v=dQw4w9WgXcQ"],"maxComments":10}'` and verify comments are returned

### Implementation for User Story 1

- [X] T009 [US1] Add engagement panels continuation token extraction function in src/extractors/metadata.ts that searches engagementPanels array for panelIdentifier "comment-item-section"
- [X] T010 [US1] Add helper to traverse engagement panel structure to find continuationItemRenderer.continuationEndpoint.continuationCommand.token in src/extractors/metadata.ts
- [X] T011 [US1] Update extractCommentsContinuationToken to try engagement panels first, then fall back to legacy path in src/extractors/metadata.ts
- [X] T012 [US1] Add support for commentEntityPayload format parsing (new format) alongside existing commentRenderer in src/extractors/comments.ts
- [X] T013 [US1] Add helper function to extract vote count from toolbar.likeCountA11y in new format in src/extractors/comments.ts
- [X] T014 [US1] Update comment extraction to check frameworkUpdates.entityBatchUpdate.mutations for new format in src/extractors/comments.ts

**Checkpoint**: At this point, comments should be successfully extracted from videos with public comments

---

## Phase 4: User Story 2 - Fast Response Time (Priority: P1)

**Goal**: Ensure users receive feedback quickly (first batch within 30s, disabled detection within 10s)

**Independent Test**: Time the execution - first comment output or error should appear within 30 seconds

### Implementation for User Story 2

- [X] T015 [US2] Add per-request timeout constant (10 seconds) in src/crawler.ts
- [X] T016 [US2] Add total extraction timeout constant (5 minutes / 300000ms) in src/crawler.ts
- [X] T017 [US2] Add first batch deadline constant (30 seconds) in src/crawler.ts
- [X] T018 [US2] Implement request timeout option in got-scraping calls in src/crawler.ts
- [X] T019 [US2] Add extraction start timestamp tracking in pagination loop in src/crawler.ts
- [X] T020 [US2] Add total timeout check at start of each pagination iteration in src/crawler.ts
- [X] T021 [US2] Add empty response counter and abort after 3 consecutive empty pages in src/crawler.ts
- [X] T022 [US2] Return partial results when timeout occurs instead of throwing error in src/crawler.ts

**Checkpoint**: Extraction now respects timeouts and returns results quickly

---

## Phase 5: User Story 3 - Reliable Error Reporting (Priority: P2)

**Goal**: Provide clear, actionable error messages for different failure scenarios

**Independent Test**: Test with disabled comments video, invalid URL, and rate limit scenario to verify appropriate error messages

### Implementation for User Story 3

- [X] T023 [US3] Add "comments disabled" detection when no comment continuation token found in initial response in src/extractors/metadata.ts
- [X] T024 [US3] Return specific error message "Comments are disabled for this video" when detected in src/crawler.ts
- [X] T025 [US3] Add rate limit (429) detection with message "Rate limited - consider using proxies" in src/crawler.ts
- [X] T026 [US3] Add network timeout error message with retry suggestion in src/crawler.ts
- [X] T027 [US3] Log structured warnings when partial results are returned due to timeout in src/crawler.ts

**Checkpoint**: Error messages are now clear and actionable for all failure scenarios

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [X] T028 Run quickstart.md verification checklist
- [X] T029 [P] Run npm run build to verify no compilation errors
- [X] T030 [P] Run npm run lint to verify no linting issues
- [X] T031 Manual test: Video with public comments returns comments within 30 seconds
- [X] T032 Manual test: Video with disabled comments reports error within 10 seconds
- [X] T033 Manual test: maxComments limit is respected

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational - core extraction fix
- **User Story 2 (Phase 4)**: Depends on Foundational - can run in parallel with US1
- **User Story 3 (Phase 5)**: Depends on Foundational - can run in parallel with US1 and US2
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Independent of US1
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Independent of US1 and US2

### Within Each User Story

- Models/types before services
- Core implementation before integration
- Each task should be completable independently

### Parallel Opportunities

**Phase 1 (Setup):**
```
T002 (review crawler.ts) || T003 (review metadata.ts)
```

**Phase 3-5 (User Stories) - Can all run in parallel after Phase 2:**
```
User Story 1 (T009-T014) || User Story 2 (T015-T022) || User Story 3 (T023-T027)
```

**Phase 6 (Polish):**
```
T029 (build) || T030 (lint)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational API fixes
3. Complete Phase 3: User Story 1 (Extract Comments)
4. **STOP and VALIDATE**: Test with `npx apify run` - comments should be returned
5. If working, can deploy as initial fix

### Full Fix (All Stories)

1. Complete Setup + Foundational
2. Complete User Story 1 → Validate extraction works
3. Complete User Story 2 → Validate timeouts work
4. Complete User Story 3 → Validate error messages
5. Complete Polish → Final verification

### Files Modified Summary

| File | Changes |
|------|---------|
| `src/crawler.ts` | API key, context fields, timeouts, error handling |
| `src/extractors/metadata.ts` | Continuation token extraction paths, disabled detection |
| `src/extractors/comments.ts` | New commentEntityPayload format support |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- This is a bug fix - no new files are created
- Changes are isolated to 3 existing files
- Total task count: 33
- Estimated MVP scope: T001-T014 (14 tasks)
