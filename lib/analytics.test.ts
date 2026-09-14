import { describe, expect, it } from "vitest";

import { buildFocusInsights, summarizeEvents } from "./analytics";

function event(type: string, timestamp: string, repo = "acme/app") {
  return {
    id: `${type}-${timestamp}`,
    userId: "user",
    sourceId: `${type}-${timestamp}`,
    type,
    timestamp: new Date(timestamp),
    repo,
    metadata: {}
  };
}

describe("analytics helpers", () => {
  it("counts built work without double-counting merged pull requests", () => {
    expect(summarizeEvents([
      event("COMMIT", "2026-01-01T09:00:00Z"),
      event("PR_OPENED", "2026-01-01T10:00:00Z"),
      event("PR_MERGED", "2026-01-01T11:00:00Z")
    ])).toMatchObject({ built: 2, commits: 1 });
  });

  it("does not mutate the calculated windows while selecting the strongest focus window", () => {
    const events = [
      event("COMMIT", "2026-01-01T09:00:00Z", "acme/one"),
      event("COMMIT", "2026-01-01T10:00:00Z", "acme/two"),
      event("COMMIT", "2026-01-01T12:00:00Z", "acme/three")
    ];
    const result = buildFocusInsights(events, { focusMinutes: 20 });
    expect(result.interruptionCount).toBe(2);
    expect(result.strongestFocusWindow).toBe("acme/two:COMMIT");
  });
});
