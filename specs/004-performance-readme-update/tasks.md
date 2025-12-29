# Tasks: Performance Optimization & README Update

**Input**: Design documents from `/specs/004-performance-readme-update/`
**Prerequisites**: plan.md (required), spec.md (required), research.md

**Tests**: Not requested in specification. Test tasks excluded.

**Organization**: Tasks are grouped by user story for independent implementation. This feature has minimal scope (2 files, configuration + documentation only).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No setup required - existing project, no new dependencies

*This phase is empty. The project is already set up and no new dependencies are needed.*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No foundational tasks required - changes are isolated to existing files

*This phase is empty. No shared infrastructure changes are needed before user stories.*

---

## Phase 3: User Story 1 - Fast Comment Extraction (Priority: P1) 🎯 MVP

**Goal**: Reduce retry delays to restore performance matching branch 002 (100 comments in <60 seconds)

**Independent Test**: Run `npx apify run -i '{"startUrls":[{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}],"maxComments":100}'` and verify completion in under 60 seconds

### Implementation for User Story 1

- [x] T001 [US1] Update DEFAULT_RETRY_OPTIONS in src/utils/retry.ts: change baseDelayMs from 1000 to 200
- [x] T002 [US1] Update DEFAULT_RETRY_OPTIONS in src/utils/retry.ts: change maxDelayMs from 30000 to 1000
- [x] T003 [US1] Update DEFAULT_RETRY_OPTIONS in src/utils/retry.ts: change maxRetries from 3 to 1

**Checkpoint**: At this point, User Story 1 (performance optimization) should be complete. Verify by running extraction on a 100-comment video.

---

## Phase 4: User Story 2 - Accurate Output Documentation (Priority: P1)

**Goal**: Ensure README output schema exactly matches src/types/output.ts

**Independent Test**: Compare README output schema table against CommentOutput interface in src/types/output.ts

### Implementation for User Story 2

- [x] T004 [US2] Verify README.md output schema table matches src/types/output.ts CommentOutput interface (per research.md RQ-003, already matches - document verification)

**Checkpoint**: Output schema documentation verified accurate. No changes needed per research findings.

---

## Phase 5: User Story 3 - Pleasant README Reading Experience (Priority: P2)

**Goal**: Light readability improvements to README without structural changes

**Independent Test**: Review README for verbose sections and confirm all essential info remains intact

### Implementation for User Story 3

- [ ] T005 [P] [US3] Tighten "Why Not Use Browser-Based Scrapers?" section in README.md (lines 14-22) for conciseness
- [ ] T006 [P] [US3] Review and tighten Proxy Configuration section in README.md for minor wordiness
- [ ] T007 [US3] Final pass: verify README retains all sections and essential information per FR-006, FR-008

**Checkpoint**: README readability improved. All sections intact.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all changes

- [ ] T008 Run npm run lint and npm run build to verify no regressions in src/utils/retry.ts
- [ ] T009 Run quickstart.md validation: execute `npx apify run -i '{"startUrls":[{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}],"maxComments":100}'` and confirm <60s completion

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Empty - no setup needed
- **Foundational (Phase 2)**: Empty - no foundational work needed
- **User Story 1 (Phase 3)**: Can start immediately - isolated to src/utils/retry.ts
- **User Story 2 (Phase 4)**: Can start immediately - isolated to README.md (verification only)
- **User Story 3 (Phase 5)**: Can start immediately - isolated to README.md
- **Polish (Phase 6)**: Depends on User Stories 1, 2, 3 completion

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies - standalone changes to retry.ts
- **User Story 2 (P1)**: No dependencies - verification task only
- **User Story 3 (P2)**: No dependencies on US1/US2 - README edits independent of code changes

### Within Each User Story

- T001, T002, T003 modify same file (retry.ts) - execute sequentially
- T005, T006 modify same file (README.md) but different sections - can be parallelized
- T007 depends on T005, T006 completion (final verification)

### Parallel Opportunities

```text
User Stories can run in parallel:
┌─────────────────────┐   ┌─────────────────────┐
│ US1: src/utils/     │   │ US2 & US3: README   │
│ retry.ts changes    │   │ verification/edits  │
│ T001 → T002 → T003  │   │ T004, T005, T006    │
└─────────────────────┘   └─────────────────────┘
              ↓                     ↓
         ┌────────────────────────────┐
         │ Phase 6: Polish (T008, T009) │
         └────────────────────────────┘
```

---

## Parallel Example: All User Stories

```bash
# These can run simultaneously (different files):
# Developer/Agent A:
Task: T001, T002, T003 (retry.ts - sequential within US1)

# Developer/Agent B:
Task: T004 (README verification)
Task: T005 (README section edit)
Task: T006 (README section edit)
Task: T007 (README final verification)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 3: User Story 1 (T001-T003)
2. **STOP and VALIDATE**: Run performance test, confirm <60s for 100 comments
3. Deploy/demo if ready - performance improvement delivered

### Full Delivery

1. Complete User Story 1 (performance) → Test
2. Complete User Story 2 (schema verification) → Confirm
3. Complete User Story 3 (README readability) → Review
4. Complete Polish phase → Final validation
5. Feature complete

---

## Notes

- Total tasks: 9
- User Story 1: 3 tasks (performance - P1)
- User Story 2: 1 task (verification - P1)
- User Story 3: 3 tasks (readability - P2)
- Polish: 2 tasks
- Parallel opportunities: US1 and US2+US3 can run simultaneously (different files)
- MVP scope: User Story 1 only (3 tasks)
- Risk: LOW - all changes isolated, no architectural impact
