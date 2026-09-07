# Contributing

1. Open an issue describing the behavior or design change.
2. Create a focused branch and keep migrations immutable after review.
3. Never commit credentials, exported user data, or provider payloads.
4. Add tests for behavior and authorization boundaries.
5. Run formatting, lint, type checks, unit/integration tests, Prisma validation, the production build, and the dependency audit.
6. Complete the pull-request template and call out database, privacy, security, and accessibility impact.

Provider tests must use deterministic mock responses. Do not use personal access tokens in fixtures or CI.
