# Implementation Plan: Performance Optimization & README Update

**Branch**: `004-performance-readme-update` | **Date**: 2025-12-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-performance-readme-update/spec.md`

## Summary

This feature addresses two issues: (1) performance regression caused by aggressive retry settings (1s base delay, 30s max, 3 retries) that should be reduced to 200ms base, 1s max, 1 retry; and (2) README documentation that needs output schema verification against `src/types/output.ts` and light readability improvements while keeping all sections intact.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 18+
**Primary Dependencies**: Apify SDK 3.x, Crawlee 3.x, got-scraping 4.x
**Storage**: Apify Dataset (streaming output), Key-Value Store
**Testing**: Vitest
**Target Platform**: Apify Cloud (Linux)
**Project Type**: Single project (Apify Actor)
**Performance Goals**: Extract 100 comments in under 60 seconds; pagination requests proceed without artificial delays on success
**Constraints**: No architectural changes to reply extraction (stay sequential); README must keep all existing sections
**Scale/Scope**: Single actor with comment extraction; ~300 line README

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Reliability-First | ✅ PASS | Maintaining retry mechanism; just reducing aggressive delays |
| II. Performance & Cost | ✅ PASS | Core goal - reducing unnecessary delays improves cost efficiency |
| III. User Experience | ✅ PASS | No input changes required |
| IV. Stable Output Schema | ✅ PASS | No output schema changes; only documentation alignment |
| V. Modular, Testable Code | ✅ PASS | Changes isolated to retry.ts defaults and README.md |
| VI. Observability | ✅ PASS | Logging unchanged |
| VII. Documentation Excellence | ✅ PASS | README improvements align with this principle |

**Pre-design Gate**: PASSED - No constitution violations.

### Post-Design Re-check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Reliability-First | ✅ PASS | Retry mechanism preserved; faster failure detection |
| II. Performance & Cost | ✅ PASS | 35x faster worst-case retry scenario |
| III. User Experience | ✅ PASS | No user-facing changes beyond speed improvement |
| IV. Stable Output Schema | ✅ PASS | Schema verified matching; no changes |
| V. Modular, Testable Code | ✅ PASS | Single constant change; no architectural impact |
| VI. Observability | ✅ PASS | Existing logging unchanged |
| VII. Documentation Excellence | ✅ PASS | README accuracy verified; readability improved |

**Post-design Gate**: PASSED - Design complies with constitution.

## Project Structure

### Documentation (this feature)

```text
specs/004-performance-readme-update/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (N/A - no data model changes)
├── quickstart.md        # Phase 1 output (N/A - no API changes)
├── contracts/           # Phase 1 output (N/A - no contract changes)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── utils/
│   └── retry.ts        # PRIMARY: Update DEFAULT_RETRY_OPTIONS
├── types/
│   └── output.ts       # REFERENCE: Verify README matches this
└── ...

README.md               # PRIMARY: Output schema + readability updates
```

**Structure Decision**: Single project structure. Changes limited to `src/utils/retry.ts` (retry configuration) and `README.md` (documentation). No new files or structural changes needed.

## Complexity Tracking

> No constitution violations requiring justification. This is a minimal-change feature focused on configuration tuning and documentation.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
