# ADR 0003: Minimize and isolate private data

Status: accepted.

All persisted records have an owner relationship and application queries enforce it. Long-lived provider credentials use authenticated encryption. AI is opt-in and receives minimized activity fields; users can exclude private repositories. Public health endpoints disclose no credential configuration. Retention and cascade deletion bound stored data lifetime.
