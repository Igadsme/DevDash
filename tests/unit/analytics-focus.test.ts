import { describe, expect, it } from "vitest";

import {
  buildNarrativeSummary,
  calculateEstimatedContextSwitches,
  parseCustomRange,
  summarizeEvents,
} from "@/lib/analytics";
import { focusSecondsRemaining } from "@/lib/focus";

describe("analytics", () => {
  const events = [
    {
      type: "COMMIT",
      occurredAt: new Date("2026-01-01T09:00:00Z"),
      repositoryId: "one",
    },
    {
      type: "REVIEW_COMPLETED",
      occurredAt: new Date("2026-01-01T10:00:00Z"),
      repositoryId: "two",
    },
    {
      type: "TASK_COMPLETED",
      occurredAt: new Date("2026-01-01T13:00:00Z"),
      repositoryId: "two",
    },
  ];

  it("summarizes only recorded events", () => {
    expect(summarizeEvents(events)).toMatchObject({
      commits: 1,
      reviewed: 1,
      tasksCompleted: 1,
    });
    expect(buildNarrativeSummary(events)).toContain("1 commits");
  });

  it("calculates switches and the strongest positive-duration window", () => {
    const result = calculateEstimatedContextSwitches(events, 15);
    expect(result.switches).toBe(1);
    expect(result.estimatedMinutesLost).toBe(15);
    expect(result.strongestWindow?.label).toBe("two");
    expect(result.disclaimer).toContain("Estimated");
  });

  it("validates custom date ranges", () => {
    expect(parseCustomRange("2026-01-01", "2026-01-02").from).toBeInstanceOf(
      Date,
    );
    expect(() => parseCustomRange("2026-02-02", "2026-01-01")).toThrow(
      "Invalid date range",
    );
  });
});

describe("focus clock", () => {
  const startedAt = new Date("2026-01-01T10:00:00Z");
  it("accounts for accumulated and active pauses", () => {
    const now = new Date("2026-01-01T10:10:00Z").getTime();
    expect(
      focusSecondsRemaining(
        {
          status: "RUNNING",
          startedAt,
          pausedAt: null,
          accumulatedPauseSeconds: 60,
          plannedMinutes: 25,
        },
        now,
      ),
    ).toBe(960);
    expect(
      focusSecondsRemaining(
        {
          status: "PAUSED",
          startedAt,
          pausedAt: new Date("2026-01-01T10:08:00Z"),
          accumulatedPauseSeconds: 0,
          plannedMinutes: 25,
        },
        now,
      ),
    ).toBe(1020);
  });

  it("never returns a negative value", () => {
    expect(
      focusSecondsRemaining(
        {
          status: "RUNNING",
          startedAt,
          pausedAt: null,
          accumulatedPauseSeconds: 0,
          plannedMinutes: 5,
        },
        new Date("2026-01-01T11:00:00Z").getTime(),
      ),
    ).toBe(0);
  });
});
