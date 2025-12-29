# Feature Specification: Top-Notch Actor Improvement

**Feature Branch**: `003-actor-improvement`
**Created**: 2025-12-29
**Status**: Draft
**Input**: User description: "Transform Apify actor to top-notch quality by implementing improvements from improvement_plan.md based on the Top-Notch Actor Checklist"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - First-Time User Success (Priority: P1)

A new user discovers the YouTube Comments Scraper on Apify marketplace. They want to quickly test the actor to see if it works for their use case. They click "Try for free", see a pre-filled example URL in the input form, and click Run. Within seconds, they receive real YouTube comments in their dataset.

**Why this priority**: First-time user experience is the #1 driver of adoption. If users can't succeed immediately, they leave and never return.

**Independent Test**: Can be fully tested by running the actor with default/pre-filled input and verifying comments are returned within 60 seconds.

**Acceptance Scenarios**:

1. **Given** a new user on the actor page, **When** they click "Try for free" and see the input form, **Then** they see a pre-filled example YouTube URL ready to run
2. **Given** a pre-filled input configuration, **When** the user clicks "Start", **Then** the actor completes successfully and returns comments within 60 seconds
3. **Given** a completed run, **When** the user views the dataset, **Then** they see well-formatted comment data with clear field names

---

### User Story 2 - Developer Trust Through Quality Assurance (Priority: P1)

A developer evaluating the actor wants assurance that it's well-maintained and reliable. They check the repository and find comprehensive tests, clear documentation files (CHANGELOG, LICENSE, CONTRIBUTING), and working example configurations they can copy-paste.

**Why this priority**: Developers choose actors based on perceived quality and maintainability. Missing tests and documentation signal abandoned or amateur projects.

**Independent Test**: Can be tested by running `npm test` and verifying all tests pass, and by checking that CHANGELOG.md, LICENSE, and CONTRIBUTING.md exist and are properly formatted.

**Acceptance Scenarios**:

1. **Given** a developer reviewing the repository, **When** they run `npm test`, **Then** all unit and integration tests pass successfully
2. **Given** a developer looking at repo files, **When** they check for standard open-source files, **Then** they find CHANGELOG.md, LICENSE, and CONTRIBUTING.md
3. **Given** a developer wanting to test the actor, **When** they look in the examples/ directory, **Then** they find minimal.json, advanced.json, and multiple-videos.json ready to use

---

### User Story 3 - Professional Documentation Experience (Priority: P2)

A marketing analyst evaluates the actor for their company. They read the README to understand capabilities, limitations, cost implications, and legal considerations. They find comprehensive documentation including cost estimation, legal disclaimer, support channels, and integration guidance.

**Why this priority**: Enterprise users need complete documentation to make purchasing decisions and ensure compliance.

**Independent Test**: Can be tested by reviewing README for presence of all required sections: cost estimation, legal disclaimer, support/issues link, and integration workflow guidance.

**Acceptance Scenarios**:

1. **Given** a potential user reading the README, **When** they look for cost information, **Then** they find a cost estimation table with example scenarios
2. **Given** a compliance-conscious user, **When** they look for legal information, **Then** they find a clear legal disclaimer about user responsibility
3. **Given** a user needing help, **When** they look for support options, **Then** they find clear instructions on where to report issues
4. **Given** a user wanting to integrate the actor, **When** they look for integration guidance, **Then** they find notes on Make/Zapier/Sheets workflows

---

### User Story 4 - Reliable Input Validation (Priority: P2)

A power user configures the actor with various input combinations. The input schema provides clear constraints (maxComments has a maximum limit), preventing misconfiguration that could lead to runaway costs or failed runs.

**Why this priority**: Input validation prevents user errors, reduces support burden, and protects users from unexpected costs.

**Independent Test**: Can be tested by verifying input_schema.json has proper constraints and prefill values.

**Acceptance Scenarios**:

1. **Given** a user configuring maxComments, **When** they try to enter an unreasonably high value, **Then** the input schema rejects values above the maximum limit
2. **Given** a new user, **When** they open the input form, **Then** the startUrls field shows a pre-filled example URL

---

### User Story 5 - Marketplace Competitiveness (Priority: P3)

A user comparing YouTube comment scrapers on Apify marketplace sees this actor's clear differentiation: HTTP-first approach (faster and cheaper than browser-based competitors), comprehensive error handling, and detailed run summaries. The README explicitly highlights these advantages.

**Why this priority**: Competitive positioning drives marketplace discovery and conversion.

**Independent Test**: Can be tested by reviewing README for competitor comparison section and unique value proposition statement.

**Acceptance Scenarios**:

1. **Given** a user comparing actors, **When** they read the README, **Then** they find a section explaining what makes this actor better than alternatives
2. **Given** a user evaluating features, **When** they look at the feature list, **Then** they see HTTP-first approach highlighted as a cost/speed advantage

---

### Edge Cases

- What happens when maxComments is set to 0? (Should return all available comments up to system limit)
- What happens when example input files reference unavailable videos? (Tests should use stable, known-good video URLs)
- What happens when a user submits invalid JSON as input? (Input validation should provide clear error message)
- How does the actor handle rate limiting during tests? (Tests should mock external calls to avoid flakiness)

## Requirements *(mandatory)*

### Functional Requirements

**Testing Infrastructure (CRITICAL)**
- **FR-001**: Repository MUST contain a tests/ directory with unit tests
- **FR-002**: Unit tests MUST cover URL validation and normalization (utils/url.ts)
- **FR-003**: Unit tests MUST cover error classification logic (utils/retry.ts)
- **FR-004**: Unit tests MUST cover comment extraction parsing with fixtures (extractors/comments.ts)
- **FR-005**: Unit tests MUST cover metadata extraction with fixtures (extractors/metadata.ts)
- **FR-006**: Integration test MUST verify actor runs successfully against a known video
- **FR-007**: Test fixtures MUST include sample HTML/JSON response snapshots
- **FR-008**: npm test script MUST run all tests and return proper exit codes

**Examples Directory (CRITICAL)**
- **FR-009**: Repository MUST contain examples/ directory
- **FR-010**: examples/minimal.json MUST contain valid minimal configuration with single URL
- **FR-011**: examples/advanced.json MUST contain configuration with proxies, limits, and sort options
- **FR-012**: examples/multiple-videos.json MUST contain configuration for batch processing

**Standard Documentation Files (HIGH)**
- **FR-013**: Repository MUST contain CHANGELOG.md with version history
- **FR-014**: Repository MUST contain LICENSE file (MIT)
- **FR-015**: Repository MUST contain CONTRIBUTING.md with contribution guidelines

**README Enhancements (HIGH)**
- **FR-016**: README MUST include legal disclaimer section about user responsibility
- **FR-017**: README MUST include support/issues section with GitHub link
- **FR-018**: README MUST include cost estimation table with example scenarios
- **FR-019**: README MUST include concurrency documentation explaining sequential processing
- **FR-020**: README MUST include section about login/authenticated comments not being supported
- **FR-021**: README MUST include integration workflow guidance (Make, Zapier, Sheets)
- **FR-022**: README MUST include competitor comparison or unique value proposition section

**Input Schema Improvements (HIGH)**
- **FR-023**: input_schema.json MUST have prefill array with example YouTube URL
- **FR-024**: input_schema.json MUST have maximum constraint for maxComments field

**Package.json Scripts (MEDIUM)**
- **FR-025**: package.json MUST have working "test" script running the test suite (uses recorded responses for CI stability)
- **FR-026**: package.json MUST have "typecheck" script: "tsc --noEmit"
- **FR-027**: package.json SHOULD have optional "test:e2e" script for live API verification (not run in CI)

### Key Entities

- **Test Suite**: Collection of automated tests validating actor functionality including URL handling, error classification, and extraction logic
- **Example Configuration**: JSON files demonstrating valid actor input for different use cases (minimal, advanced, batch)
- **Documentation Set**: CHANGELOG, LICENSE, and CONTRIBUTING files following open-source standards

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Running `npm test` executes all tests and reports 100% pass rate
- **SC-002**: Test coverage includes at least 4 test files covering URL, retry, comments, and metadata modules
- **SC-003**: examples/ directory contains at least 3 valid, runnable JSON input files
- **SC-004**: All example input files work when used to run the actor on Apify platform
- **SC-005**: CHANGELOG.md documents at least current version (1.0.0) with release notes
- **SC-006**: README contains all 7 new/enhanced sections specified in requirements
- **SC-007**: input_schema.json prefill array contains at least one valid YouTube URL
- **SC-008**: input_schema.json maxComments field has both min and max constraints
- **SC-009**: Actor passes all 9 items in "Top Actor" Acceptance Criteria (Section 16 of checklist)
- **SC-010**: Checklist pass rate improves from current ~65% average to 90%+ across all sections

## Clarifications

### Session 2025-12-29

- Q: Should test fixtures use captured real responses or hand-crafted mock data? → A: Captured real responses (sanitized/anonymized)
- Q: Should integration tests use live API calls or recorded responses? → A: Recorded responses for CI with optional live e2e script

## Assumptions

- Tests will use Vitest as the test framework (recommended in improvement plan)
- Test fixtures will use captured real YouTube API/HTML responses (sanitized/anonymized) rather than hand-crafted mocks, ensuring realistic test coverage while maintaining stability
- Example YouTube URLs will use publicly available, stable videos unlikely to be removed
- MIT License is appropriate as already specified in package.json
- Current version 1.0.0 will be the first entry in CHANGELOG.md
