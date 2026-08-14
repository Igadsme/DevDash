import { prisma } from "@/lib/prisma";
import { relativeTime } from "@/lib/dates";

export type ActionItem = {
  id: string;
  priority: "critical" | "high" | "medium" | "low";
  type: "ci" | "pr" | "issue" | "review";
  title: string;
  repo: string;
  age: string;
  context: string;
  action: string;
  url?: string | null;
  timestamp: string;
  score: number;
};

function ageHours(date: Date) {
  return (Date.now() - date.getTime()) / 36e5;
}

function priorityFromScore(score: number): ActionItem["priority"] {
  if (score >= 90) return "critical";
  if (score >= 60) return "high";
  if (score >= 35) return "medium";
  return "low";
}

export async function getWhatNeedsMe(userId: string): Promise<ActionItem[]> {
  const [prs, issues, runs, reviews] = await Promise.all([
    prisma.pullRequest.findMany({
      where: { userId },
      include: { repo: true, reviews: true },
      orderBy: { updatedAtSrc: "desc" },
      take: 80,
    }),
    prisma.issue.findMany({
      where: { userId, state: "open" },
      include: { repo: true },
      take: 50,
    }),
    prisma.cICDRun.findMany({
      where: { userId, conclusion: { in: ["failure", "failed"] } },
      include: { repo: true },
      orderBy: { startedAt: "desc" },
      take: 20,
    }),
    prisma.pullRequestReview.findMany({
      where: { userId },
      include: { pullRequest: { include: { repo: true } } },
      orderBy: { submittedAt: "desc" },
      take: 40,
    }),
  ]);

  const items: ActionItem[] = [];

  for (const run of runs) {
    const ts = run.startedAt || run.createdAt;
    let score = 100 + Math.min(ageHours(ts), 48);
    if (run.branch === "main" || run.branch === "master") score += 20;
    items.push({
      id: `ci-${run.id}`,
      priority: priorityFromScore(score),
      type: "ci",
      title: "CI pipeline failing",
      repo: run.repo?.name || "unknown",
      age: relativeTime(ts),
      context: `${run.name}${run.branch ? ` on ${run.branch}` : ""}`,
      action: "View",
      url: run.url,
      timestamp: ts.toISOString(),
      score,
    });
  }

  for (const pr of prs) {
    if (pr.state !== "open" || pr.merged) continue;
    const ts = pr.updatedAtSrc || pr.openedAt;
    if (pr.reviewState === "review_requested" && !pr.isAuthor) {
      const score = 70 + Math.min(ageHours(ts), 72) * 0.4;
      items.push({
        id: `pr-review-${pr.id}`,
        priority: priorityFromScore(score),
        type: "pr",
        title: "PR waiting for your review",
        repo: pr.repo?.name || "unknown",
        age: relativeTime(ts),
        context: `${pr.title} · #${pr.number}`,
        action: "Review",
        url: pr.url,
        timestamp: ts.toISOString(),
        score,
      });
    }
    if (pr.isAuthor) {
      const requested = pr.reviews.some((r) => r.state === "CHANGES_REQUESTED");
      if (requested) {
        const score = 75 + Math.min(ageHours(ts), 72) * 0.3;
        items.push({
          id: `pr-changes-${pr.id}`,
          priority: priorityFromScore(score),
          type: "pr",
          title: "Your PR has changes requested",
          repo: pr.repo?.name || "unknown",
          age: relativeTime(ts),
          context: `${pr.title} · #${pr.number}`,
          action: "View",
          url: pr.url,
          timestamp: ts.toISOString(),
          score,
        });
      } else {
        const score = 42 + Math.min(ageHours(ts), 240) * 0.12;
        items.push({
          id: `pr-open-${pr.id}`,
          priority: priorityFromScore(score),
          type: "pr",
          title: pr.draft ? "Your draft PR is still open" : "Your PR is still open",
          repo: pr.repo?.name || "unknown",
          age: relativeTime(ts),
          context: `${pr.title} · #${pr.number}`,
          action: "View",
          url: pr.url,
          timestamp: ts.toISOString(),
          score,
        });
      }
    }
  }

  for (const issue of issues) {
    const ts = issue.openedAt;
    if (issue.milestoneDue) {
      const hoursLeft = (issue.milestoneDue.getTime() - Date.now()) / 36e5;
      if (hoursLeft < 72) {
        const score = 55 + Math.max(0, 48 - hoursLeft);
        items.push({
          id: `issue-due-${issue.id}`,
          priority: priorityFromScore(score),
          type: "issue",
          title: "Issue approaching deadline",
          repo: issue.repo?.name || "unknown",
          age: hoursLeft > 0 ? `Due in ${Math.ceil(hoursLeft / 24)} days` : "Overdue",
          context: `#${issue.number} — ${issue.title}`,
          action: "Open",
          url: issue.url,
          timestamp: ts.toISOString(),
          score,
        });
      }
    }
    if (issue.isAssigned && ageHours(ts) > 72) {
      const score = 30 + Math.min(ageHours(ts) / 24, 20);
      items.push({
        id: `issue-stale-${issue.id}`,
        priority: priorityFromScore(score),
        type: "issue",
        title: "Assigned issue — no updates",
        repo: issue.repo?.name || "unknown",
        age: relativeTime(ts),
        context: `#${issue.number} — ${issue.title}`,
        action: "Open",
        url: issue.url,
        timestamp: ts.toISOString(),
        score,
      });
    }
  }

  for (const review of reviews) {
    const age = ageHours(review.submittedAt);
    if (age > 48 && review.pullRequest.state === "open") {
      const score = 40 + Math.min(age / 12, 20);
      items.push({
        id: `review-stale-${review.id}`,
        priority: priorityFromScore(score),
        type: "review",
        title: "Stale review — no activity in 48h",
        repo: review.pullRequest.repo?.name || "unknown",
        age: relativeTime(review.submittedAt),
        context: `PR #${review.pullRequest.number} — ${review.pullRequest.title}`,
        action: "Review",
        url: review.pullRequest.url,
        timestamp: review.submittedAt.toISOString(),
        score,
      });
    }
  }

  const seen = new Set<string>();
  return items
    .sort((a, b) => b.score - a.score)
    .filter((item) => {
      const key = `${item.type}-${item.repo}-${item.title}-${item.context}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 40);
}
