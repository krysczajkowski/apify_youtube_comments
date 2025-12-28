# Implementation Plan: YouTube Comments Scraper Actor

**Branch**: `001-youtube-comments-actor` | **Date**: 2025-12-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-youtube-comments-actor/spec.md`

## Summary

Build an Apify Actor that extracts all publicly visible YouTube comments from provided video URLs. The actor will use HTTP-first approach with browser fallback for reliability, implement exponential backoff for rate limiting, and output structured comment data (text, author, engagement metrics, creator interactions) in Apify's standard dataset format.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 18+
**Primary Dependencies**: Apify SDK 3.x, Crawlee 3.x (HTTP/Cheerio crawler with browser fallback)
**Storage**: Apify Dataset (platform-provided), Key-Value Store for run summaries
**Testing**: OPTIONAL per constitution (not required for this feature)
**Target Platform**: Apify Platform (Node.js runtime with residential proxy support)
**Project Type**: Single project (Apify Actor)
**Performance Goals**: 300 comments in <3 minutes (SC-009), 10,000 comments without degradation (SC-007), 95% success rate (SC-010)
**Constraints**: Must support residential proxies, exponential backoff (3 retries), memory-safe streaming to dataset
**Scale/Scope**: Single actor, supports batch processing of multiple video URLs

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Gate (Phase 0)

| Principle | Requirement | Status |
|-----------|-------------|--------|
| I. Reliability-First | HTTP-first with browser fallback, error classification, partial success tolerance | PLANNED |
| II. Performance & Cost | HTTP/Cheerio default, memory-safe streaming, adaptive concurrency | PLANNED |
| III. Simple First Run | Users only need `startUrls` + click Start | PLANNED |
| IV. Stable Output Schema | Consistent JSON with identifiers, core data, provenance | PLANNED |
| V. Modular Code | Crawlers/extractors/utilities separation, <50 lines per function | PLANNED |
| VI. Observability | Structured logging, run summary to KV store, actionable error hints | PLANNED |
| VII. Documentation | README with quickstart, input/output docs, troubleshooting | PLANNED |

### Quality Standards Alignment

| Standard | Implementation Approach |
|----------|------------------------|
| Anti-Blocking | Proxy support, session rotation, captcha detection, adaptive behavior |
| Crawl Control | RequestQueue with dedupe, maxComments limit, pagination stop conditions |
| Error Handling | Structured error logs, failure dataset option, error category statistics |

### Initial Assessment: **PASS** - All requirements can be satisfied by planned architecture

## Project Structure

### Documentation (this feature)

```text
specs/001-youtube-comments-actor/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Apify Actor Structure
src/
├── main.ts              # Actor entry point, input handling, orchestration
├── crawler.ts           # HTTP crawler with browser fallback logic
├── extractors/
│   ├── comments.ts      # Comment extraction from YouTube API responses
│   └── metadata.ts      # Video metadata extraction
├── utils/
│   ├── url.ts           # URL validation, normalization, canonicalization
│   ├── retry.ts         # Exponential backoff, error classification
│   └── logger.ts        # Structured logging utilities
└── types/
    ├── input.ts         # Input schema TypeScript types
    └── output.ts        # Output schema TypeScript types

# Root configuration files
.actor/
├── actor.json           # Apify Actor configuration
└── input_schema.json    # Input schema for Apify Console UI

package.json             # Dependencies and scripts
tsconfig.json            # TypeScript configuration
README.md                # Actor documentation (mandatory)
```

**Structure Decision**: Single Apify Actor project following standard Apify SDK conventions. Modular separation between crawler logic, extractors, and utilities per Constitution Principle V.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations identified. Architecture follows all principles:
- Single project structure (no unnecessary complexity)
- HTTP-first approach (no browser-only implementation)
- Standard Apify patterns (no custom frameworks)

---

## Post-Design Constitution Check (Phase 1 Complete)

### Principle Verification

| Principle | Design Artifact | Compliance |
|-----------|-----------------|------------|
| I. Reliability-First | research.md: InnerTube API with got-scraping, exponential backoff (3 retries), error classification | **PASS** |
| II. Performance & Cost | research.md: HTTP-only (no browser), got-scraping client, streaming to dataset | **PASS** |
| III. Simple First Run | contracts/input-schema.json: Only `startUrls` required, sane defaults | **PASS** |
| IV. Stable Output Schema | contracts/output-schema.json: 14 fields matching example_readme.md exactly | **PASS** |
| V. Modular Code | plan.md Project Structure: extractors/, utils/, types/ separation | **PASS** |
| VI. Observability | contracts/run-summary-schema.json: Error categories, recommendations, metrics | **PASS** |
| VII. Documentation | quickstart.md: Copy-paste examples, troubleshooting table | **PASS** |

### Quality Standards Verification

| Standard | Evidence | Status |
|----------|----------|--------|
| Anti-Blocking | Residential proxies default, session rotation planned | **PASS** |
| Crawl Control | maxComments limit, continuation token pagination | **PASS** |
| Error Handling | BLOCKED/TRANSIENT/PERMANENT classification in research.md | **PASS** |

### Final Assessment: **PASS** - Design artifacts align with all constitution principles

---

## Generated Artifacts

| Artifact | Path | Description |
|----------|------|-------------|
| Research | `specs/001-youtube-comments-actor/research.md` | Technical decisions and rationale |
| Data Model | `specs/001-youtube-comments-actor/data-model.md` | Entity definitions and relationships |
| Input Schema | `specs/001-youtube-comments-actor/contracts/input-schema.json` | Apify Console input configuration |
| Output Schema | `specs/001-youtube-comments-actor/contracts/output-schema.json` | Comment data structure |
| Run Summary Schema | `specs/001-youtube-comments-actor/contracts/run-summary-schema.json` | Observability output |
| Quickstart | `specs/001-youtube-comments-actor/quickstart.md` | User onboarding guide |
| Agent Context | `CLAUDE.md` | Updated with project tech stack |
