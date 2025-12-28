<!--
Sync Impact Report:
- Version change: [INITIAL] → 1.0.0
- Modified principles: N/A (initial version)
- Added sections: All core principles (I-VII), Quality Standards, Development Workflow, Governance
- Removed sections: N/A
- Templates requiring updates:
  ✅ .specify/templates/plan-template.md (aligned with constitution checks)
  ✅ .specify/templates/spec-template.md (aligned with functional requirements)
  ✅ .specify/templates/tasks-template.md (aligned with task organization principles)
- Follow-up TODOs: None
-->

# YouTube Comments Scraper Constitution

## Core Principles

### I. Reliability-First Architecture

Every feature MUST prioritize reliability over speed of implementation. This means:

- HTTP-first execution with browser fallback (never browser-only unless required)
- Blocking detection and proactive mitigation (proxy rotation, session management, adaptive delays)
- Error classification with tailored retry strategies:
  - Transient errors (timeouts, 5xx) → exponential backoff with jitter
  - Blocked errors (403/429/captcha) → slow down, rotate proxy/session, optional browser fallback
  - Permanent errors (404/invalid input) → no retry, clean failure recording
- Partial success tolerance (one bad URL never kills entire run)
- All failures MUST be logged with actionable hints for users

**Rationale**: Top Apify actors win on reliability. Users tolerate slower runs but not failed runs. A 95%+ success rate on real-world targets is non-negotiable for marketplace success.

### II. Performance & Cost Efficiency

Code MUST be optimized for speed and minimal compute waste:

- Default to HTTP/Cheerio crawler (fast path); use browser sparingly
- When browser is required:
  - Block images/fonts/media by default
  - Avoid unnecessary screenshots
  - Use lower concurrency for browser, higher for HTTP
- Implement proper scaling:
  - Request queue with deduplication and URL canonicalization
  - Adaptive concurrency controls
  - Memory-safe streaming to dataset (no large in-memory arrays)
- Provide predictable cost per result (minimize retries, avoid infinite loops)

**Rationale**: Browser usage is 10-100x more expensive than HTTP. Users evaluate actors on cost per record. Efficient actors get higher adoption and better reviews.

### III. User Experience: Simple First Run

Input design MUST enable users to succeed on first run with minimal configuration:

- Sane defaults: users should only need to provide `startUrls` (or query) and click Start
- Input validation with early, actionable error messages
- Clear field descriptions, examples, and logical grouping
- Expensive features (deep crawl, browser mode, screenshots) behind explicit toggles
- Support multiple input styles: URL list, search mode, optional sitemap

**Rationale**: First-run success determines marketplace conversion. Complex input overwhelms users and drives them to competitors. "Simple by default, powerful when needed" wins adoption.

### IV. Stable Output Schema

Output MUST maintain a consistent, integration-ready JSON schema:

- Required fields in every record:
  - Identifiers: `url`, `finalUrl`, `statusCode`, `fetchedAt`
  - Core data: comment text, author, timestamps, engagement metrics
  - Provenance: `method` (http vs browser), response time
- Write run summary to Key-Value Store:
  - Counts: success/failed/blocked/retried
  - Average timings, throughput
  - Top error categories
  - Recommended settings if block rate is high
- Schema MUST NOT change between versions without explicit migration path

**Rationale**: Downstream automation breaks on schema changes. Integration-ready output enables Zapier/Make workflows, webhooks, and API consumption. Predictability builds trust.

### V. Modular, Testable Code

Code structure MUST support maintainability and rapid iteration:

- Clear separation: crawlers / extractors / utilities
- Single Responsibility Principle for all modules
- Testable components:
  - URL normalization logic
  - Extraction selectors
  - Error classification rules
- No "god functions" - maximum 50 lines per function
- Configuration externalized from logic

**Rationale**: Apify actors require continuous maintenance as targets change. Modular code enables fast fixes. Testability prevents regressions. Top actors ship updates in hours, not weeks.

### VI. Observability & Self-Diagnosis

Actors MUST provide users with actionable insights:

- Structured logging (not console spam):
  - Success rate, block rate, retry rate
  - Median/average response times
  - Items per minute
- Final summary in both logs and Key-Value Store
- Debug mode toggle for detailed logs (off by default)
- Error messages MUST include:
  - Category (BLOCKED/TRANSIENT/PERMANENT)
  - URL and short description
  - Hint on how to fix (e.g., "Enable proxies" or "Lower concurrency")

**Rationale**: Users love actors that tell them exactly what to change. Self-diagnosing actors reduce support requests and negative reviews. Observability enables users to optimize their runs.

### VII. Documentation Excellence

Every actor MUST have comprehensive, user-focused documentation:

- README structure (mandatory sections):
  - What it does (bullets)
  - Use cases (bullets)
  - Quickstart with copy-paste input
  - Input fields explained in plain language
  - Output schema with sample
  - Performance/cost guidance
  - Anti-blocking best practices
  - Troubleshooting (top 5 issues + fixes)
  - Legal/compliance note
- At least 2 working examples:
  - Minimal run (3-10 items)
  - Realistic run (100s-1000s with tuned settings)
- Clear statement of limitations and requirements

**Rationale**: Documentation is marketing. Great docs convert browsers into users. Explicit limitations prevent negative reviews. Examples reduce time-to-first-success.

## Quality Standards

### Anti-Blocking Sophistication

All actors MUST implement:

- Proxy support (Apify Proxy + custom proxies)
- Session rotation when required (cookies/login sessions)
- Detection patterns:
  - Captcha pages
  - HTTP 403/429 spikes
  - Empty responses or JS shells
- Adaptive behavior based on block rate

### Crawl Control

All crawlers MUST implement:

- RequestQueue with deduplication
- Depth and limit controls (`maxRequestsPerCrawl`)
- Deterministic pagination with stop conditions
- Maximum page safeguards to prevent infinite loops
- Polite crawling: rate limiting, concurrency controls, random jitter

### Error Handling

Actors MUST:

- Never throw raw exceptions to users
- Maintain structured error logs
- Optionally create failures dataset for debugging
- Provide error category statistics in run summary

## Development Workflow

### Code Standards

- Maximum function length: 50 lines
- Maximum file length: 300 lines
- Clear naming: functions as verbs, variables as nouns
- Comments only where logic is non-obvious (code should be self-documenting)
- No hardcoded values - use configuration

### Testing Requirements

Testing is OPTIONAL unless explicitly requested in feature specs. When tests are required:

- Test URL normalization logic
- Test extraction selectors against sample HTML
- Test error classification rules
- Test retry logic with mocked failures

### Commit Discipline

- Commit after each logical unit of work
- Clear commit messages following conventional commits format
- No commits with failing code (unless explicitly WIP)

## Governance

### Constitution Authority

This constitution defines the non-negotiable standards for all code in this project. It supersedes all other practices and guidelines.

### Amendments

Amendments to this constitution require:

1. Documentation of the proposed change with rationale
2. Impact analysis on existing code and workflows
3. Migration plan if backward-incompatible
4. Version bump following semantic versioning

### Compliance

All code reviews MUST verify compliance with this constitution. Any deviation MUST be:

- Explicitly justified in code comments or PR description
- Documented in plan.md Complexity Tracking section
- Approved with explanation of why simpler alternatives are insufficient

### Version Control

Constitution changes follow semantic versioning:

- MAJOR: Backward-incompatible governance or principle removal/redefinition
- MINOR: New principle/section added or materially expanded guidance
- PATCH: Clarifications, wording, typo fixes, non-semantic refinements

**Version**: 1.0.0 | **Ratified**: 2025-12-28 | **Last Amended**: 2025-12-28
