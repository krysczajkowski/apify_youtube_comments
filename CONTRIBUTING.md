# Contributing to YouTube Comments Scraper

Thank you for your interest in contributing to the YouTube Comments Scraper! This document provides guidelines for contributing to this project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## Bug Reports

If you encounter a bug, please create an issue with the following information:

1. **Video URL** (if applicable): The YouTube URL that caused the issue
2. **Input configuration**: The JSON input you used
3. **Error message**: The complete error message or unexpected behavior
4. **Expected vs actual behavior**: What you expected to happen vs what actually happened
5. **Run ID** (if on Apify platform): The actor run ID for investigation

### Example Bug Report

```markdown
**Video URL**: https://www.youtube.com/watch?v=example123

**Input**:
```json
{
  "startUrls": [{"url": "https://www.youtube.com/watch?v=example123"}],
  "maxComments": 100
}
```

**Error**: Comments extraction failed with BLOCKED error

**Expected**: Extract 100 comments from the video
**Actual**: Received 403 Forbidden after 5 comments
```

## Feature Requests

For feature requests, please open an issue describing:

1. **Use case**: What problem are you trying to solve?
2. **Proposed solution**: How would you like to solve it?
3. **Alternatives considered**: Other approaches you've thought about
4. **Priority**: How important is this feature for your use case?

## Development Setup

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/youtube-comments-scraper.git
cd youtube-comments-scraper

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test
```

### Project Structure

```
src/
├── main.ts              # Actor entry point
├── crawler.ts           # HTTP-based comment crawler
├── extractors/
│   ├── comments.ts      # Comment extraction from InnerTube API
│   └── metadata.ts      # Video metadata extraction
├── types/               # TypeScript type definitions
└── utils/               # Utility functions

tests/
├── fixtures/            # Test fixture data
├── unit/                # Unit tests
└── integration/         # Integration tests
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- tests/unit/url.test.ts

# Run tests in watch mode
npx vitest
```

### Code Quality

Before submitting a pull request, ensure your code:

1. Passes all tests: `npm test`
2. Passes linting: `npm run lint`
3. Passes type checking: `npm run typecheck`

## Pull Request Guidelines

### Before Submitting

1. Create a feature branch from `main`
2. Make your changes with clear, focused commits
3. Write tests for new functionality
4. Update documentation if needed
5. Run the full test suite: `npm test && npm run lint && npm run typecheck`

### PR Description

Please include:

1. **Summary**: Brief description of what the PR does
2. **Test plan**: How you tested the changes
3. **Related issues**: Link to any related issues

### Example PR Description

```markdown
## Summary
- Add support for YouTube Music URLs
- Handle edge case where comments are loading slowly

## Test plan
- Added unit tests for new URL patterns
- Tested manually with 5 YouTube Music URLs
- Verified existing tests still pass

## Related issues
Fixes #123
```

### Review Process

1. At least one maintainer will review your PR
2. Address any feedback or requested changes
3. Once approved, a maintainer will merge your PR

## Code Style

- Use TypeScript with strict type checking
- Follow existing patterns in the codebase
- Keep functions small and focused
- Add JSDoc comments for public APIs
- Use meaningful variable and function names

## Questions?

If you have questions about contributing, feel free to open an issue with the "question" label.
