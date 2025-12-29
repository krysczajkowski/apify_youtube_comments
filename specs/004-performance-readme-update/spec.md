# Feature Specification: Performance Optimization & README Update

**Feature Branch**: `004-performance-readme-update`
**Created**: 2025-12-29
**Status**: Draft
**Input**: User description: "Right now the actor works well, but it's too slow. At branch 002 it was way quicker. I want you to speed it up. Also consider updating README.md, i see that the output schema is not correct. I also want you to simplify README.md, I don't mean to drasticaly change it, I just want it to be written in a way that is more pleasent to read."

## Problem Analysis

The user reports two distinct issues:

1. **Performance Regression**: The actor is noticeably slower compared to branch 002, despite the core crawler code being unchanged. The likely causes are:
   - Aggressive retry settings: base delay of 1s, exponential backoff up to 30s, with 3 retries
   - Reply extraction adds significant overhead by fetching replies for every comment
   - Sequential processing of each reply thread blocks the main extraction loop

2. **README Documentation Issues**:
   - Output schema documentation may not accurately reflect actual output fields
   - README content could be simplified for better readability

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fast Comment Extraction (Priority: P1)

A user wants to extract comments from a YouTube video and receive results quickly. They expect the actor to match or exceed the performance of branch 002.

**Why this priority**: Speed is critical for user experience and cost efficiency. Slow extraction increases compute unit consumption and frustrates users.

**Independent Test**: Can be tested by running extraction on a video with 100+ comments and measuring time to completion compared to baseline.

**Acceptance Scenarios**:

1. **Given** a video with 100 comments, **When** extraction runs with default settings, **Then** all comments are extracted in under 60 seconds
2. **Given** a video with 500 comments, **When** maxComments=100 is set, **Then** extraction completes in under 30 seconds
3. **Given** a video where the first request succeeds, **When** extraction runs, **Then** no unnecessary delays are introduced between pagination requests

---

### User Story 2 - Accurate Output Documentation (Priority: P1)

A developer integrating the actor's output needs accurate documentation of the output schema to build their data pipeline correctly.

**Why this priority**: Inaccurate documentation causes integration failures and erodes user trust.

**Independent Test**: Can be tested by comparing README output schema against actual `src/types/output.ts` and running the actor to verify actual output matches documentation.

**Acceptance Scenarios**:

1. **Given** the README output schema table, **When** compared to src/types/output.ts, **Then** all fields match exactly
2. **Given** a run's output dataset, **When** compared to README schema, **Then** all documented fields are present with correct types

---

### User Story 3 - Pleasant README Reading Experience (Priority: P2)

A potential user evaluates the actor by reading the README. They want clear, scannable content without excessive verbosity or repetition.

**Why this priority**: README is the first thing users see; a cleaner presentation improves conversion.

**Independent Test**: Can be tested by reviewing README length and structure for redundancy and verbosity.

**Acceptance Scenarios**:

1. **Given** the README, **When** reviewed for redundant content, **Then** no section repeats information already covered elsewhere
2. **Given** the README, **When** read by a new user, **Then** key information (features, usage, output) is findable within 30 seconds

---

### Edge Cases

- What happens when all retry attempts fail? - Return error quickly without excessive delays
- What happens if reply extraction is disabled? - Comments should extract faster
- How does the system handle videos with only a few comments? - Should complete very quickly without any artificial delays

## Requirements *(mandatory)*

### Functional Requirements

**Performance Optimization (CRITICAL)**
- **FR-001**: System MUST reduce retry configuration to: 1 retry, 200ms base delay, 1s max delay (down from 3 retries, 1s base, 30s max)
- **FR-002**: System MUST optimize pagination to proceed immediately after successful requests without artificial delays
- **FR-003**: System MUST keep reply extraction sequential; performance gains will come from reduced retry delays (no architectural change to reply fetching)

**README Accuracy (CRITICAL)**
- **FR-004**: README output schema MUST exactly match the TypeScript interface in src/types/output.ts
- **FR-005**: README sample output MUST reflect a realistic comment object with all documented fields

**README Readability (HIGH)**
- **FR-006**: README MUST keep all existing sections intact (no structural changes)
- **FR-007**: README SHOULD tighten verbose sentences for easier reading while preserving meaning
- **FR-008**: README MUST maintain all essential information (features, usage, input/output schemas, troubleshooting)

### Key Entities

- **Retry Configuration**: Settings controlling delay between failed requests (baseDelay, maxDelay, maxRetries)
- **Output Schema**: TypeScript interface defining comment output structure (CommentOutput in types/output.ts)
- **README Sections**: Performance comparison, features, input/output schemas, troubleshooting

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Extraction of 100 comments completes in under 60 seconds (matching or exceeding branch 002 performance)
- **SC-002**: Time between successful pagination requests is under 100ms (no artificial delays on success)
- **SC-003**: README output schema table matches 100% of fields in src/types/output.ts CommentOutput interface
- **SC-004**: README total length is reduced by at least 10% while retaining all essential information

## Clarifications

### Session 2025-12-29

- Q: What should the new retry configuration be? → A: 1 retry, 200ms base delay, 1s max delay
- Q: What approach for reply extraction optimization? → A: Keep sequential, rely on reduced retry delays for speed
- Q: What level of README simplification is acceptable? → A: Light - fix schema, tighten verbose sentences, keep all sections (goal: more pleasant/easier to read)

## Assumptions

- The retry mechanism is the primary cause of slowdown, not network latency or API rate limits
- README output schema discrepancy is due to documentation drift, not actual code issues
- Users prefer concise documentation over comprehensive but verbose documentation
- Reply extraction may be the secondary contributor to slowdown for videos with many comments
