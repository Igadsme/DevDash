export type FocusClock = {
  status: string;
  startedAt: Date | string;
  pausedAt: Date | string | null;
  accumulatedPauseSeconds: number;
  plannedMinutes: number;
};

export function focusSecondsRemaining(
  session: FocusClock | null,
  now = Date.now(),
) {
  if (!session) return 25 * 60;
  const startedAt = new Date(session.startedAt).getTime();
  const pausedSeconds =
    session.status === "PAUSED" && session.pausedAt
      ? Math.max(
          0,
          Math.floor((now - new Date(session.pausedAt).getTime()) / 1_000),
        )
      : 0;
  const elapsed = Math.max(
    0,
    Math.floor((now - startedAt) / 1_000) -
      session.accumulatedPauseSeconds -
      pausedSeconds,
  );
  return Math.max(0, session.plannedMinutes * 60 - elapsed);
}
