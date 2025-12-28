# Implementation Plan: Fix YouTube Comments API

**Branch**: `002-fix-comments-api` | **Date**: 2025-12-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-fix-comments-api/spec.md`

## Summary

Fix YouTube comments extraction that currently returns no comments and runs excessively long. The issue stems from incorrect InnerTube API interaction - specifically missing API key parameter and potentially incorrect continuation token paths. The fix involves updating the API request structure, adding proper timeout enforcement, and implementing fail-fast validation when responses contain no data.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 18+
**Primary Dependencies**: Apify SDK 3.x, Crawlee 3.x, got-scraping 4.x
**Storage**: Apify Dataset (streaming output)
**Testing**: Not configured (echo "No tests configured")
**Target Platform**: Apify Cloud / Node.js server
**Project Type**: Single project (Apify Actor)
**Performance Goals**: First comment batch within 30 seconds, comments disabled detection within 10 seconds
**Constraints**: Max 5 minutes per video extraction, memory-safe streaming (no large arrays)
**Scale/Scope**: Single video extraction per request, configurable maxComments limit

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Evaluation

| Principle | Requirement | Status | Notes |
|-----------|-------------|--------|-------|
| I. Reliability-First | HTTP-first, error classification, partial success | ✅ PASS | Already implemented in current codebase |
| II. Performance & Cost | HTTP/Cheerio default, memory-safe streaming | ✅ PASS | Using got-scraping, streaming to dataset |
| III. Simple First Run | Sane defaults, only startUrls required | ✅ PASS | Input schema already has good defaults |
| IV. Stable Output Schema | 14-field comment schema, run summary | ✅ PASS | Schema exists in types/output.ts |
| V. Modular Code | Separation: crawler/extractors/utils | ✅ PASS | Code is already well-structured |
| VI. Observability | Structured logging, debug mode | ✅ PASS | Logger module exists |
| VII. Documentation | README with required sections | ⚠️ N/A | Not in scope for this fix |

### Gates Specific to This Feature

| Gate | Requirement | Status |
|------|-------------|--------|
| No browser dependency | Fix must use HTTP-first approach | ✅ PASS |
| Timeout enforcement | Must cap execution time per spec | 🔧 IMPLEMENT |
| Fail-fast validation | Must detect empty responses quickly | 🔧 IMPLEMENT |
| Error categorization | Must classify API errors correctly | ✅ PASS (exists) |

**Gate Result**: ✅ PASS - No violations. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/002-fix-comments-api/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (schema changes)
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── main.ts              # Entry point - Actor initialization
├── crawler.ts           # Core extraction logic (PRIMARY FIX TARGET)
├── extractors/
│   ├── comments.ts      # Comment parsing from API response
│   └── metadata.ts      # ytInitialData parsing (FIX CONTINUATION TOKEN)
├── types/
│   ├── input.ts         # Input schema types
│   ├── output.ts        # Output schema types
│   └── run-summary.ts   # Run statistics types
└── utils/
    ├── logger.ts        # Structured logging
    ├── retry.ts         # Retry with backoff
    └── url.ts           # URL normalization
```

**Structure Decision**: Single project structure. This is a bug fix - no new directories needed. Changes target `src/crawler.ts` (API request structure) and `src/extractors/metadata.ts` (continuation token extraction).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations - this is a targeted bug fix that maintains existing architecture.

---

## Post-Design Constitution Check

*Re-evaluated after Phase 1 design completion.*

### Design Review

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Reliability-First | ✅ PASS | HTTP-only fix, adds timeout enforcement, partial success support |
| II. Performance & Cost | ✅ PASS | No browser usage, adds fail-fast validation |
| III. Simple First Run | ✅ PASS | No input changes required |
| IV. Stable Output Schema | ✅ PASS | No changes to CommentOutput interface |
| V. Modular Code | ✅ PASS | Changes isolated to crawler.ts and metadata.ts |
| VI. Observability | ✅ PASS | Leverages existing logger for timeout warnings |
| VII. Documentation | ⚠️ N/A | Bug fix only, no README changes needed |

### Feature-Specific Gates

| Gate | Status | Evidence |
|------|--------|----------|
| No browser dependency | ✅ PASS | Fix uses got-scraping only |
| Timeout enforcement | ✅ DESIGNED | Per-request (10s), total (5min) timeouts specified |
| Fail-fast validation | ✅ DESIGNED | Empty response detection after 3 pages |
| Error categorization | ✅ PASS | Uses existing retry.ts classification |

**Final Gate Result**: ✅ PASS - Design complies with all constitution principles.

---

## Generated Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Research | [research.md](./research.md) | ✅ Complete |
| Data Model | [data-model.md](./data-model.md) | ✅ Complete |
| API Contract | [contracts/innertube-api.md](./contracts/innertube-api.md) | ✅ Complete |
| Quickstart | [quickstart.md](./quickstart.md) | ✅ Complete |
| Tasks | tasks.md | ⏳ Run `/speckit.tasks` to generate |
