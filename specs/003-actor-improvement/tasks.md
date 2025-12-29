# Tasks: Top-Notch Actor Improvement

**Input**: Design documents from `/specs/003-actor-improvement/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, quickstart.md ✓

**Tests**: This feature explicitly requires unit and integration tests (FR-001 through FR-008, SC-001, SC-002).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Testing Infrastructure)

**Purpose**: Project initialization for testing framework and directory structure

- [x] T001 Install Vitest and coverage dependencies: `npm install --save-dev vitest @vitest/coverage-v8`
- [x] T002 Create vitest.config.ts with node environment and coverage settings
- [x] T003 [P] Create tests/ directory structure: tests/fixtures/, tests/unit/, tests/integration/
- [x] T004 [P] Create examples/ directory for input configuration files
- [x] T005 Update package.json with test scripts: "test", "typecheck", "test:e2e"

---

## Phase 2: Foundational (Test Fixtures)

**Purpose**: Create test fixtures that ALL unit tests depend on - MUST be complete before user story implementation

**⚠️ CRITICAL**: No user story work can begin until test fixtures are ready

- [x] T006 [P] Create tests/fixtures/ytInitialData.json with sanitized video page metadata
- [x] T007 [P] Create tests/fixtures/comments-legacy.json with InnerTube API response sample
- [x] T008 [P] Create tests/fixtures/comments-entity.json with frameworkUpdates format response
- [x] T009 [P] Create tests/fixtures/video-page.html with minimal HTML containing ytInitialData

**Checkpoint**: Test fixtures ready - user story implementation can now begin

---

## Phase 3: User Story 1 - First-Time User Success (Priority: P1) 🎯 MVP

**Goal**: Enable new users to immediately test the actor with pre-filled configuration and see results within 60 seconds

**Independent Test**: Run actor with default/pre-filled input and verify comments are returned within 60 seconds

### Implementation for User Story 1

- [x] T010 [US1] Update input_schema.json to add prefill array with Rick Astley video URL to startUrls field
- [x] T011 [US1] Update input_schema.json to add maximum constraint (100000) to maxComments field
- [x] T012 [US1] Create examples/minimal.json with single YouTube URL using defaults

**Checkpoint**: User Story 1 complete - first-time users can now run actor with one click

---

## Phase 4: User Story 2 - Developer Trust Through Quality Assurance (Priority: P1)

**Goal**: Provide comprehensive tests, documentation files, and example configurations to demonstrate quality and maintainability

**Independent Test**: Run `npm test` to verify all tests pass; check CHANGELOG.md, LICENSE, and CONTRIBUTING.md exist and are properly formatted

### Unit Tests for User Story 2

> **NOTE**: Tests validate existing code modules with fixtures from Phase 2

- [ ] T013 [P] [US2] Create tests/unit/url.test.ts covering extractVideoId, validateYouTubeUrl, isValidYouTubeUrl
- [ ] T014 [P] [US2] Create tests/unit/retry.test.ts covering classifyError, shouldRetry, calculateBackoffDelay
- [ ] T015 [P] [US2] Create tests/unit/comments.test.ts covering extractComment, parseCommentsFromResponse, parseVoteCount
- [ ] T016 [P] [US2] Create tests/unit/metadata.test.ts covering extractYtInitialData, extractVideoTitle, extractCommentsContinuationToken

### Integration Test for User Story 2

- [ ] T017 [US2] Create tests/integration/actor.test.ts verifying actor runs successfully with recorded responses

### Documentation Files for User Story 2

- [ ] T018 [P] [US2] Create CHANGELOG.md with version 1.0.0 entry documenting initial release features
- [ ] T019 [P] [US2] Create LICENSE file with MIT License text
- [ ] T020 [P] [US2] Create CONTRIBUTING.md with bug reports, development setup, and PR guidelines

### Example Configuration Files for User Story 2

- [ ] T021 [P] [US2] Create examples/advanced.json with proxies, limits, and sort options
- [ ] T022 [P] [US2] Create examples/multiple-videos.json with 5 video URLs for batch processing

**Checkpoint**: User Story 2 complete - `npm test` passes, all standard open-source files present

---

## Phase 5: User Story 3 - Professional Documentation Experience (Priority: P2)

**Goal**: Add comprehensive README sections for cost estimation, legal compliance, support, and integration guidance

**Independent Test**: Review README for presence of all 7 required sections

### Implementation for User Story 3

- [ ] T023 [US3] Add Legal Disclaimer section to README.md explaining user responsibility for compliance
- [ ] T024 [US3] Add Support/Issues section to README.md with GitHub issues link
- [ ] T025 [US3] Add Cost Estimation table to README.md with example scenarios (quick test, medium batch, large extraction)
- [ ] T026 [US3] Add Concurrency documentation to README.md explaining sequential processing approach
- [ ] T027 [US3] Add Login Limitations section to README.md noting authenticated comments not supported
- [ ] T028 [US3] Add Integrations section to README.md with Make, Zapier, Sheets workflow guidance

**Checkpoint**: User Story 3 complete - README has comprehensive documentation for enterprise evaluation

---

## Phase 6: User Story 4 - Reliable Input Validation (Priority: P2)

**Goal**: Ensure input schema prevents misconfiguration that could lead to runaway costs or failed runs

**Independent Test**: Verify input_schema.json has proper constraints and prefill values

### Implementation for User Story 4

- [ ] T029 [US4] Verify and document maxComments constraint in input_schema.json (min: 0, max: 100000)
- [ ] T030 [US4] Add input validation test cases verifying schema constraints work correctly

**Checkpoint**: User Story 4 complete - input validation prevents user errors

---

## Phase 7: User Story 5 - Marketplace Competitiveness (Priority: P3)

**Goal**: Clearly differentiate this actor from browser-based competitors through README positioning

**Independent Test**: Review README for competitor comparison section and HTTP-first value proposition

### Implementation for User Story 5

- [ ] T031 [US5] Add Competitor Comparison / Why This Actor section to README.md highlighting HTTP-first advantage
- [ ] T032 [US5] Update Features section in README.md to emphasize cost/speed benefits of HTTP approach

**Checkpoint**: User Story 5 complete - marketplace positioning is clear

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and verification across all user stories

- [ ] T033 Run `npm test` and verify 100% pass rate
- [ ] T034 Run `npm run lint` and fix any linting issues
- [ ] T035 Run `npm run typecheck` and fix any type errors
- [ ] T036 Validate examples/*.json files work when run on Apify platform
- [ ] T037 Run quickstart.md verification checklist to confirm all items pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all unit tests
- **User Story 1 (Phase 3)**: Depends on Setup (for directory structure)
- **User Story 2 (Phase 4)**: Depends on Phase 1 (vitest) + Phase 2 (fixtures)
- **User Story 3 (Phase 5)**: No blocking dependencies on other stories
- **User Story 4 (Phase 6)**: Depends on US1 (input schema changes)
- **User Story 5 (Phase 7)**: No blocking dependencies on other stories
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup (Phase 1) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P2)**: No dependencies - can run in parallel with US1/US2
- **User Story 4 (P2)**: Depends on US1 (shares input_schema.json modifications)
- **User Story 5 (P3)**: No dependencies - can run in parallel with others

### Within Each User Story

- Tests (where applicable) written before implementation
- Documentation files can be created in parallel
- All tasks within a story complete before moving to next priority

### Parallel Opportunities

- Phase 2 fixtures (T006-T009) can all run in parallel
- US2 unit tests (T013-T016) can all run in parallel
- US2 documentation files (T018-T020) can all run in parallel
- US2 examples (T021-T022) can run in parallel with tests
- US3 README sections (T023-T028) can run in parallel
- US1, US3, US5 can all be worked on in parallel (different files)

---

## Parallel Example: User Story 2

```bash
# Launch all unit tests together:
Task: "Create tests/unit/url.test.ts"
Task: "Create tests/unit/retry.test.ts"
Task: "Create tests/unit/comments.test.ts"
Task: "Create tests/unit/metadata.test.ts"

# Launch all documentation files together:
Task: "Create CHANGELOG.md"
Task: "Create LICENSE"
Task: "Create CONTRIBUTING.md"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup (vitest, directories)
2. Complete Phase 2: Foundational (test fixtures)
3. Complete Phase 3: User Story 1 (prefill, examples/minimal.json)
4. Complete Phase 4: User Story 2 (tests, documentation, examples)
5. **STOP and VALIDATE**: Run `npm test`, verify all tests pass
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Test infrastructure ready
2. Add User Story 1 → First-time users can succeed (MVP!)
3. Add User Story 2 → Quality assurance visible to developers
4. Add User Story 3 → Professional documentation complete
5. Add User Story 4 → Input validation hardened
6. Add User Story 5 → Marketplace positioning clear
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:
1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 + User Story 4 (input_schema.json work)
   - Developer B: User Story 2 (tests and documentation)
   - Developer C: User Story 3 + User Story 5 (README sections)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests pass after each test file creation
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Summary

- **Total Tasks**: 37
- **Tasks by User Story**:
  - Setup (Phase 1): 5 tasks
  - Foundational (Phase 2): 4 tasks
  - User Story 1 (P1): 3 tasks
  - User Story 2 (P1): 10 tasks
  - User Story 3 (P2): 6 tasks
  - User Story 4 (P2): 2 tasks
  - User Story 5 (P3): 2 tasks
  - Polish (Phase 8): 5 tasks
- **Parallel Opportunities**: 18 tasks marked [P]
- **Suggested MVP Scope**: User Stories 1 & 2 (22 tasks including Setup/Foundational)
