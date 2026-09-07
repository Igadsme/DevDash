import { describe, expect, it } from "vitest";

import { calculateDeveloperHealth } from "@/lib/scoring/health";
import { calculateUrgency } from "@/lib/scoring/urgency";

describe("urgency scoring", () => {
  it("explains and weights actionable risk", () => {
    const result = calculateUrgency(
      {
        ciStatus: "FAILED",
        updatedAt: new Date("2026-01-01T00:00:00Z"),
        isDraft: false,
        hasMergeConflict: true,
        requestedReviewCount: 2,
        changesRequested: true,
        changedLines: 20,
        smallPrThreshold: 150,
      },
      new Date("2026-01-05T00:00:00Z"),
    );
    expect(result.score).toBe(15);
    expect(result.reasons).toContain("CI checks are failing");
    expect(result.reasons).toHaveLength(6);
  });

  it("does not produce negative scores for drafts", () => {
    expect(
      calculateUrgency({
        ciStatus: "SUCCESS",
        updatedAt: new Date(),
        isDraft: true,
        hasMergeConflict: false,
        requestedReviewCount: 0,
        changesRequested: false,
        changedLines: 500,
        smallPrThreshold: 100,
      }).score,
    ).toBe(0);
  });

  it("applies the 24-hour threshold and singular review wording", () => {
    const result = calculateUrgency(
      {
        ciStatus: "RUNNING",
        updatedAt: new Date("2026-01-01T00:00:00Z"),
        isDraft: false,
        hasMergeConflict: false,
        requestedReviewCount: 1,
        changesRequested: false,
        changedLines: 1000,
        smallPrThreshold: 100,
      },
      new Date("2026-01-02T01:00:00Z"),
    );
    expect(result.score).toBe(3);
    expect(result.reasons).toContain("1 review request pending");
  });
});

describe("developer health", () => {
  it("refuses to score insufficient evidence", () => {
    expect(
      calculateDeveloperHealth({
        mergedPullRequests: 1,
        medianLeadTimeHours: 2,
        completedReviews: 0,
        medianReviewTurnaroundHours: null,
        successfulPipelines: 0,
        failedPipelines: 0,
        openPullRequests: 0,
        stalePullRequests: 0,
        completedFocusMinutes: 0,
        contextSwitchEstimate: null,
      }),
    ).toMatchObject({ score: null, confidence: "insufficient" });
  });

  it("returns transparent bounded components", () => {
    const result = calculateDeveloperHealth({
      mergedPullRequests: 3,
      medianLeadTimeHours: 12,
      completedReviews: 3,
      medianReviewTurnaroundHours: 5,
      successfulPipelines: 8,
      failedPipelines: 2,
      openPullRequests: 4,
      stalePullRequests: 1,
      completedFocusMinutes: 300,
      contextSwitchEstimate: 2,
    });
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.components.map((item) => item.key)).toEqual([
      "delivery",
      "review",
      "ci",
      "wip",
      "focus",
    ]);
    expect(result.components.reduce((sum, item) => sum + item.weight, 0)).toBe(
      1,
    );
  });

  it("uses neutral defaults when optional evidence is absent", () => {
    const result = calculateDeveloperHealth({
      mergedPullRequests: 0,
      medianLeadTimeHours: null,
      completedReviews: 0,
      medianReviewTurnaroundHours: null,
      successfulPipelines: 0,
      failedPipelines: 0,
      openPullRequests: 3,
      stalePullRequests: 0,
      completedFocusMinutes: 0,
      contextSwitchEstimate: null,
    });
    expect(
      result.components.find((item) => item.key === "delivery")?.score,
    ).toBe(50);
    expect(result.components.find((item) => item.key === "ci")?.score).toBe(50);
  });
});
