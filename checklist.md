# Apify “Top-Notch & Popular” Actor Checklist (End-to-End)

Use this checklist to audit an existing actor and produce a punch-list for improvements.  
Goal: match the quality traits of the most adopted marketplace actors: reliability, speed/cost efficiency, usability, clear docs, predictable behavior, and active maintenance.

---

## 0) Marketplace Fit & Differentiation (Before touching code)

- [ ] **Category & user intent** is crystal clear (what problem, for whom, why now).
- [ ] You can answer in 1 sentence: **“This actor helps X do Y by Z.”**
- [ ] You have a **unique value proposition** vs top competitors in your category (pick 1–2):
  - [ ] higher reliability / fewer blocks
  - [ ] faster throughput / lower cost per result
  - [ ] deeper fields / better completeness
  - [ ] easier input / better defaults
  - [ ] better integration workflow (exports/webhooks/examples)
- [ ] Actor name includes the most searched keywords (platform + “scraper/extractor/monitor” etc.).
- [ ] Short description is benefit-led (not implementation-led).
- [ ] You’ve identified the top 3 competitor actors and explicitly list what you do better.
- [ ] You have a realistic **maintenance plan** for target changes (weekly+ monitoring for fragile sites).

---

## 1) Repo Hygiene & Project Setup (First line of code)

### Structure & clarity
- [ ] Clean, predictable repo structure:
  - [ ] `src/` contains code only (no random scripts mixed in).
  - [ ] `src/main.(ts|js|py)` is thin; logic is in modules (extractors/utils/crawlers/services).
  - [ ] `README.md`, `CHANGELOG.md`, `LICENSE`, `CONTRIBUTING.md` exist.
  - [ ] `examples/` includes working input examples.
  - [ ] `tests/` exists with meaningful tests (unit + smoke/integration).
- [ ] No secrets in repo (API keys, cookies, tokens) — enforced by `.gitignore`.
- [ ] Dependencies are minimal and pinned; no unused deps.

### Tooling
- [ ] Build & run scripts exist and work:
  - [ ] `npm run build` / `npm run start` (or Python equivalent)
  - [ ] `npm test`
- [ ] Lint/type checks exist (TS: `tsc --noEmit`, ESLint minimal).
- [ ] Actor uses supported, stable libraries (Crawlee/Apify SDK or solid Python stack).

---

## 2) Actor Metadata & Apify Packaging

- [ ] `apify.json` / actor settings are complete:
  - [ ] correct name, version, category tags
  - [ ] readme linked / present
  - [ ] minimal required permissions only
- [ ] `.actor/INPUT_SCHEMA.json` exists and matches actual code input parsing.
- [ ] Default build pipeline produces correct runtime artifacts (dist/ if TS).
- [ ] Runtime environment tested on Apify platform (not only locally).

---

## 3) Input Schema & User UX (This drives adoption)

### Inputs: simplicity first
- [ ] **First run success**: user can run with minimal required fields (ideally one).
- [ ] Every input field has:
  - [ ] human-readable title
  - [ ] clear description (what, why, examples)
  - [ ] sensible default (where applicable)
  - [ ] constraints (min/max/allowed values)
- [ ] Fields are grouped logically (basic vs advanced).
- [ ] Expensive or risky features are **opt-in** (e.g., deep crawl, full HTML, screenshots, browser mode).
- [ ] Provide **example input** pre-filled in the actor UI (not only in README).

### Flexibility
- [ ] Actor supports multiple input styles (as relevant):
  - [ ] `startUrls` editor (Apify standard)
  - [ ] `urls[]` array alternative
  - [ ] search mode (query parameters) if applicable
  - [ ] optional sitemap ingestion if relevant
- [ ] Input validation catches errors early with actionable messages.
- [ ] “Auto” mode exists for key tradeoffs (e.g., `useBrowser: auto`) and is well-defined.

### Safety defaults (prevent user pain)
- [ ] Default concurrency is safe for typical targets (no immediate blocks).
- [ ] Default max requests prevents accidental runaway crawls.
- [ ] Default timeouts prevent infinite hangs.
- [ ] Default retries prevent expensive loops.

---

## 4) Core Architecture & Code Quality

- [ ] Code is modular:
  - [ ] input parsing/config module
  - [ ] crawler module(s)
  - [ ] extraction/parsing module(s)
  - [ ] persistence/output module
  - [ ] utilities: URL normalization, logging, errors, stats
- [ ] Single responsibility per module; functions are testable.
- [ ] No “god function” in `main`.
- [ ] Configuration is centralized (no magic numbers spread around).
- [ ] Clear type definitions (TS interfaces / Python dataclasses) for:
  - [ ] Input config
  - [ ] Output item schema
  - [ ] Internal error categories
- [ ] All non-trivial behavior documented with comments (why, not what).

---

## 5) Performance & Cost Efficiency (Top actors win here)

### Fast-path strategy
- [ ] Uses **HTTP/cheerio** (or requests/bs4) as default where possible.
- [ ] Browser (Playwright/Puppeteer/Selenium) is used only when necessary or explicitly requested.
- [ ] If browser is used:
  - [ ] blocks images/fonts/media by default
  - [ ] avoids heavy waits (no “sleep 10s” patterns)
  - [ ] uses reasonable navigation timeout and waitUntil strategy
  - [ ] disables unnecessary features (trace/video) unless debug enabled

### Concurrency & scaling
- [ ] Concurrency is configurable and documented.
- [ ] Uses request queue with dedupe (or equivalent).
- [ ] Implements hard limits:
  - [ ] `maxRequestsPerCrawl`
  - [ ] optional max depth / pagination cap
- [ ] Avoids memory blow-ups:
  - [ ] no huge arrays in RAM for URLs/results
  - [ ] streams writes to dataset incrementally

### Efficiency checks
- [ ] No duplicate fetches of the same URL unless explicitly requested.
- [ ] Uses compression/headers properly (when HTTP).
- [ ] Parsing is minimal: extract only requested fields unless “deep mode”.

---

## 6) Reliability, Blocking, and Failure Handling (The #1 adoption driver)

### Proxy & sessions
- [ ] Supports Apify Proxy configuration + custom proxies.
- [ ] Proxy is recommended and integrated for block-prone targets.
- [ ] Session management exists where needed:
  - [ ] rotating sessions
  - [ ] cookie input (if site requires login) with clear docs
  - [ ] safe rate limits to reduce account bans

### Error classification & retries
- [ ] Errors are classified:
  - [ ] TRANSIENT (timeouts, 5xx)
  - [ ] BLOCKED (403/429/captcha/empty-js-shell)
  - [ ] PERMANENT (404/invalid input)
- [ ] Retry strategy matches category:
  - [ ] exponential backoff + jitter
  - [ ] max retry count
  - [ ] avoids infinite retry loops
- [ ] BLOCKED triggers mitigation:
  - [ ] slow down concurrency
  - [ ] rotate proxy/session
  - [ ] optional fallback to browser (if auto mode)
- [ ] Run completes with partial success; failures are recorded.

### Data correctness
- [ ] Output is validated (required fields present).
- [ ] Detects and logs “soft failures” (e.g., empty results due to layout change).
- [ ] Includes statusCode/fetch info for debugging.

---

## 7) Output Design & Integration Readiness

### Stable output schema
- [ ] Output JSON schema is consistent across runs and versions.
- [ ] Each dataset item includes (as relevant):
  - [ ] `url`, `finalUrl`
  - [ ] `statusCode`
  - [ ] `fetchedAt` timestamp
  - [ ] main extracted fields (documented)
  - [ ] `meta` fields (optional, documented)
  - [ ] provenance: `method` (http/browser), timings (optional)
- [ ] Output fields are documented with an example in README.

### Run summary & diagnostics
- [ ] Writes a run summary to KV store (e.g., `RUN_SUMMARY`):
  - [ ] counts: succeeded/failed/blocked/retried
  - [ ] avg/median response times
  - [ ] throughput estimate
  - [ ] top error reasons + suggested fixes
- [ ] (Optional but strong) writes failed URLs to a “failures” dataset or logs them clearly.

### Export formats
- [ ] Output is “flat enough” for CSV/Excel export (nested fields limited or documented).
- [ ] Provides guidance for exports and downstream tools (Make/Zapier/Sheets).

---

## 8) Logging & Observability (Users trust actors that explain themselves)

- [ ] Logging is not noisy by default.
- [ ] `debug` mode increases verbosity significantly.
- [ ] Logs are structured where possible (include url, status, category).
- [ ] Clear start/end logs with configuration summary (redacting secrets).
- [ ] Warnings include “what to do next” (proxy, lower concurrency, etc.).

---

## 9) Documentation: Marketplace-Grade README (Conversion + retention)

### Required sections
- [ ] **What it does** (3–6 bullet points).
- [ ] **Who it’s for / use cases** (lead gen, monitoring, RAG, etc.).
- [ ] **Quickstart** with copy-paste input example.
- [ ] **Inputs** explained (basic + advanced), with tips.
- [ ] **Outputs**: sample dataset item JSON + field meanings.
- [ ] **Performance & cost tips**: how to run cheap and fast.
- [ ] **Anti-blocking guidance**:
  - [ ] when to use proxy
  - [ ] safe concurrency recommendations
  - [ ] login/cookie notes (if relevant)
- [ ] **Troubleshooting**: top 5–10 common failures and fixes.
- [ ] **Limitations**: what it doesn’t do.
- [ ] **Changelog / versioning policy**.
- [ ] **Support**: where users report issues.
- [ ] **Legal/compliance** note (user responsibility).

### Quality bar
- [ ] No “TODO”, no placeholder text.
- [ ] Steps are written for non-developers (Apify UI clicks + API notes).
- [ ] At least 2 input examples: minimal and advanced.
- [ ] README matches actual input fields and behavior (no drift).

---

## 10) Examples & Templates (Huge adoption booster)

- [ ] `examples/minimal.json` works today.
- [ ] `examples/advanced.json` demonstrates:
  - [ ] proxies
  - [ ] tuned concurrency
  - [ ] advanced extraction
  - [ ] crawl limits
- [ ] If site-specific: examples for each main mode (search, listing, detail).
- [ ] Example outputs shown in README (sanitized).

---

## 11) Testing & Quality Gates (Prevents negative reviews)

### Automated tests
- [ ] Unit tests cover:
  - [ ] URL normalization/canonicalization
  - [ ] error classification logic
  - [ ] extraction parsing with fixtures (HTML snapshots)
- [ ] Smoke/integration test:
  - [ ] runs actor against a stable target or local fixture server
  - [ ] asserts dataset contains expected fields
- [ ] Tests run without secrets.

### Regression protection
- [ ] For fragile targets, include selector fixtures and fallback logic tests.
- [ ] Add a “health check” run configuration for periodic manual verification.

---

## 12) Security & Compliance

- [ ] No secrets are logged.
- [ ] Sensitive inputs (cookies/tokens) are marked as secrets in schema where possible.
- [ ] Clear warning about scraping terms and privacy.
- [ ] Respect robots/ToS guidance in docs where applicable (without legal advice).
- [ ] Avoid collecting unnecessary personal data; document what’s collected.

---

## 13) Pricing & Cost Communication (Even if free)

- [ ] Users can estimate cost drivers:
  - [ ] browser vs http mode
  - [ ] max pages/requests
  - [ ] concurrency
  - [ ] proxy usage
- [ ] Expensive options are opt-in and clearly labeled.
- [ ] If monetized:
  - [ ] pricing is transparent
  - [ ] aligns with value (don’t overcharge for low-quality output)
  - [ ] avoids surprising costs (no hidden multipliers)

---

## 14) Publishing Checklist (Store listing quality)

### Store listing
- [ ] Title is keyword-rich and specific.
- [ ] One-line description communicates benefit + scope.
- [ ] Full description includes:
  - [ ] what it extracts
  - [ ] typical use cases
  - [ ] key differentiators
- [ ] Category tags are correct.
- [ ] Icon/logo is clear and professional.
- [ ] Screenshots/GIF (optional but strong) show:
  - [ ] input config
  - [ ] output dataset
  - [ ] run summary / logs

### Release readiness
- [ ] Version bumped.
- [ ] CHANGELOG updated with meaningful entries.
- [ ] Example inputs verified on Apify platform.
- [ ] Actor permissions minimal.
- [ ] README verified on store page rendering.

---

## 15) Post-Publish: Growth, Support, and Continuous Improvement

### Support responsiveness
- [ ] Issues/questions answered quickly (goal: <48h).
- [ ] Common issues become README troubleshooting entries.
- [ ] User requests tracked and prioritized.

### Maintenance cadence
- [ ] Monitor target changes (alerts or periodic runs).
- [ ] Patch quickly when breakage occurs.
- [ ] Keep output schema backward compatible or versioned.

### Review & rating strategy
- [ ] Encourage satisfied users to leave a review (in README/support replies).
- [ ] Respond professionally to negative reviews with fixes and guidance.
- [ ] Track “failure reasons” and reduce them in future versions.

### Adoption flywheel
- [ ] Create a short tutorial blog post / guide (even in README) for a common workflow.
- [ ] Add integration snippets:
  - [ ] API run example
  - [ ] webhook example
  - [ ] Make/Zapier/Sheets workflow notes
- [ ] If relevant, publish companion actors or utilities (e.g., enrichment step).

---

## 16) “Top Actor” Acceptance Criteria (Hard pass/fail)

Your actor is “top-tier ready” only if all are true:
- [ ] A new user can succeed within 3 minutes using only the README + default input example.
- [ ] The actor tolerates partial failures and still completes runs.
- [ ] Blocked/429 behavior is handled (or clearly documented with recommended settings).
- [ ] Default mode is cost-efficient and avoids browser unless necessary.
- [ ] Output schema is stable and documented with an example.
- [ ] Run summary includes actionable diagnostics.
- [ ] Tests exist and pass.
- [ ] Docs match code behavior exactly.
- [ ] You can maintain it (you have monitoring + a patch plan).

---

## 17) What an LLM should do with this checklist (instruction)

When analyzing the actor:
1) Map each checklist section to concrete files/locations in the repo.
2) Identify missing items and propose minimal diffs.
3) Implement improvements in priority order:
   - Reliability/anti-blocking
   - Performance/cost
   - Input UX
   - Output stability + run summary
   - Docs/examples/tests
4) Re-run tests and a smoke run on Apify platform.
5) Produce a final report: what changed + which checklist items now pass.

---
