# Implementation Plan: Top-Notch Actor Improvement

**Branch**: `003-actor-improvement` | **Date**: 2025-12-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-actor-improvement/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Transform the YouTube Comments Scraper Apify actor to top-notch quality by implementing comprehensive testing infrastructure (unit tests for URL, retry, comments, and metadata modules), example configurations, standard documentation files (CHANGELOG, LICENSE, CONTRIBUTING), README enhancements, and input schema improvements.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 18+
**Primary Dependencies**: Apify SDK 3.x, Crawlee 3.x, got-scraping 4.x, Vitest (new)
**Storage**: Apify Dataset (streaming output), Key-Value Store
**Testing**: Vitest (to be added per spec assumption)
**Target Platform**: Apify Cloud (Node.js 18+ runtime)
**Project Type**: Single project (Apify Actor)
**Performance Goals**: 95%+ success rate, <60s first-time user success
**Constraints**: Memory-safe streaming, no large in-memory arrays
**Scale/Scope**: Single actor with 4 extractors, 2 utility modules, 1 crawler

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Reliability-First | ✅ PASS | Feature adds tests; no changes to core HTTP/retry logic |
| II. Performance & Cost | ✅ PASS | No browser additions; tests use recorded responses |
| III. Simple First Run | ✅ PASS | Adds prefilled examples for immediate success |
| IV. Stable Output Schema | ✅ PASS | No schema changes; feature is documentation/testing only |
| V. Modular, Testable Code | ✅ PASS | Adds tests for existing modular components |
| VI. Observability | ✅ PASS | No observability changes required |
| VII. Documentation Excellence | ✅ PASS | Feature is primarily documentation enhancement |

**Gate Result**: ✅ ALL GATES PASS - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/003-actor-improvement/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Existing source structure
src/
├── main.ts              # Actor entry point
├── crawler.ts           # HTTP-based comment crawler
├── extractors/
│   ├── comments.ts      # Comment extraction from InnerTube API
│   └── metadata.ts      # Video metadata extraction from ytInitialData
├── types/
│   ├── input.ts         # Actor input schema types
│   ├── output.ts        # Comment output types
│   └── run-summary.ts   # Run statistics types
└── utils/
    ├── logger.ts        # Logging utilities
    ├── retry.ts         # Retry logic with backoff
    └── url.ts           # URL validation and normalization

# New directories for this feature
tests/
├── fixtures/            # Captured API responses (sanitized)
│   ├── comments-api-response.json
│   ├── metadata-response.json
│   └── video-page.html
├── unit/
│   ├── url.test.ts      # URL validation tests
│   ├── retry.test.ts    # Error classification tests
│   ├── comments.test.ts # Comment extraction tests
│   └── metadata.test.ts # Metadata extraction tests
└── integration/
    └── actor.test.ts    # End-to-end actor test (recorded)

examples/
├── minimal.json         # Single URL, defaults
├── advanced.json        # Proxies, limits, sort options
└── multiple-videos.json # Batch processing
```

**Structure Decision**: Single project (Apify Actor). Uses existing `src/` structure, adds `tests/` directory with unit and integration subdirectories per FR-001/FR-006, adds `examples/` directory per FR-009.

## Complexity Tracking

> No constitution violations. All principles pass.

## Post-Design Constitution Re-Check

*Re-evaluated after Phase 1 design completion.*

| Principle | Status | Post-Design Notes |
|-----------|--------|-------------------|
| I. Reliability-First | ✅ PASS | Tests validate existing reliability logic; no regressions |
| II. Performance & Cost | ✅ PASS | Vitest is lightweight; recorded fixtures avoid live API calls |
| III. Simple First Run | ✅ PASS | Prefill URL (Rick Astley) is stable, comments-enabled video |
| IV. Stable Output Schema | ✅ PASS | Only test fixtures model existing schema; no changes |
| V. Modular, Testable Code | ✅ PASS | 4 test files match 4 pure-function modules per constitution |
| VI. Observability | ✅ PASS | No changes to logging/summary; documentation only |
| VII. Documentation Excellence | ✅ PASS | 7 new README sections + CHANGELOG/LICENSE/CONTRIBUTING |

**Final Gate Result**: ✅ ALL GATES PASS - Ready for task generation
