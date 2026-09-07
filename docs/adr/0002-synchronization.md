# ADR 0002: Database-backed synchronization

Status: accepted.

Pages query normalized PostgreSQL records and never crawl providers while rendering. Manual actions, a protected scheduler, and verified webhooks enqueue jobs. Jobs retain cursors/watermarks, retry transient failures with bounded exponential backoff and jitter, isolate provider errors, and preserve last-known-good records.
