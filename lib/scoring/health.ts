export type HealthSignals = {
  mergedPullRequests: number;
  medianLeadTimeHours: number | null;
  completedReviews: number;
  medianReviewTurnaroundHours: number | null;
  successfulPipelines: number;
  failedPipelines: number;
  openPullRequests: number;
  stalePullRequests: number;
  completedFocusMinutes: number;
  contextSwitchEstimate: number | null;
};

export type HealthComponent = {
  key: string;
  label: string;
  score: number;
  weight: number;
  explanation: string;
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateDeveloperHealth(signals: HealthSignals) {
  const evidenceCount =
    signals.mergedPullRequests +
    signals.completedReviews +
    signals.successfulPipelines +
    signals.failedPipelines +
    signals.openPullRequests;
  if (evidenceCount < 3)
    return {
      score: null,
      confidence: "insufficient" as const,
      components: [] as HealthComponent[],
      explanation:
        "At least three delivery, review, pipeline, or work-in-progress observations are required.",
    };
  const pipelineTotal = signals.successfulPipelines + signals.failedPipelines;
  const pipelineRate = pipelineTotal
    ? signals.successfulPipelines / pipelineTotal
    : 0.5;
  const staleRate = signals.openPullRequests
    ? signals.stalePullRequests / signals.openPullRequests
    : 0;
  const components: HealthComponent[] = [
    {
      key: "delivery",
      label: "Delivery flow",
      score: clamp(
        signals.medianLeadTimeHours === null
          ? 50
          : 100 - signals.medianLeadTimeHours * 1.5,
      ),
      weight: 0.25,
      explanation:
        "Based on lead time to merge; commit volume is intentionally excluded.",
    },
    {
      key: "review",
      label: "Review responsiveness",
      score: clamp(
        signals.medianReviewTurnaroundHours === null
          ? 50
          : 100 - signals.medianReviewTurnaroundHours * 2,
      ),
      weight: 0.2,
      explanation: "Based on median review turnaround.",
    },
    {
      key: "ci",
      label: "CI stability",
      score: clamp(pipelineRate * 100),
      weight: 0.25,
      explanation: `Based on ${pipelineTotal} completed pipeline runs.`,
    },
    {
      key: "wip",
      label: "Work in progress",
      score: clamp(100 - staleRate * 100),
      weight: 0.15,
      explanation: "Based on the share of open pull requests that are stale.",
    },
    {
      key: "focus",
      label: "Focus signal",
      score: clamp(
        signals.completedFocusMinutes / 3 +
          50 -
          (signals.contextSwitchEstimate ?? 0) * 3,
      ),
      weight: 0.15,
      explanation:
        "Uses recorded focus sessions and an explicitly estimated context-switch count.",
    },
  ];
  const score = clamp(
    components.reduce(
      (total, component) => total + component.score * component.weight,
      0,
    ),
  );
  return {
    score,
    confidence: evidenceCount >= 10 ? ("high" as const) : ("limited" as const),
    components,
    explanation:
      "A transparent operational signal, not an individual productivity judgment.",
  };
}
