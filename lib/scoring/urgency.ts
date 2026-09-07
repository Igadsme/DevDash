export type UrgencyInput = {
  ciStatus: "FAILED" | "RUNNING" | "SUCCESS" | "UNKNOWN";
  updatedAt: Date;
  isDraft: boolean;
  hasMergeConflict: boolean;
  requestedReviewCount: number;
  changesRequested: boolean;
  changedLines: number;
  smallPrThreshold: number;
};

export function calculateUrgency(input: UrgencyInput, now = new Date()) {
  let score = 0;
  const reasons: string[] = [];
  const ageHours = Math.max(
    0,
    (now.getTime() - input.updatedAt.getTime()) / 3_600_000,
  );
  if (input.ciStatus === "FAILED") {
    score += 4;
    reasons.push("CI checks are failing");
  }
  if (input.hasMergeConflict) {
    score += 3;
    reasons.push("merge conflict detected");
  }
  if (input.changesRequested) {
    score += 3;
    reasons.push("changes were requested");
  }
  if (input.requestedReviewCount > 0) {
    score += 2;
    reasons.push(
      `${input.requestedReviewCount} review request${input.requestedReviewCount === 1 ? "" : "s"} pending`,
    );
  }
  if (ageHours >= 72) {
    score += 2;
    reasons.push("inactive for at least 72 hours");
  } else if (ageHours >= 24) {
    score += 1;
    reasons.push("inactive for at least 24 hours");
  }
  if (!input.isDraft && input.changedLines <= input.smallPrThreshold) {
    score += 1;
    reasons.push("small reviewable change");
  }
  if (input.isDraft) {
    score = Math.max(0, score - 1);
    reasons.push("draft status lowers urgency");
  }
  return { score, reasons, ageHours };
}
