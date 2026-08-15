import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { daysAgo, startOfMonth, startOfWeek } from "@/lib/dates";
import { getWhatNeedsMe } from "@/lib/engines/actions";
import { computeDevHealth } from "@/lib/engines/health";
import { computeFocus } from "@/lib/engines/focus";
import { computeMetrics, computeWeekTimeline } from "@/lib/engines/metrics";

function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenerativeAI(key);
}

const MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-3.5-flash",
].filter((name, index, all): name is string => Boolean(name) && all.indexOf(name) === index);

export async function buildAiContext(userId: string, intent: string) {
  const since = /month|quarter|sprint/i.test(intent) ? startOfMonth() : daysAgo(7);
  const [events, metrics, actions, health, focus, week] = await Promise.all([
    prisma.activityEvent.findMany({
      where: { userId, timestamp: { gte: since } },
      orderBy: { timestamp: "desc" },
      take: 80,
      select: {
        type: true,
        title: true,
        description: true,
        repository: true,
        timestamp: true,
      },
    }),
    computeMetrics(userId, 7),
    getWhatNeedsMe(userId),
    computeDevHealth(userId),
    computeFocus(userId),
    computeWeekTimeline(userId),
  ]);

  return {
    metrics,
    actions: actions.slice(0, 8).map((a) => ({
      type: a.type,
      title: a.title,
      repo: a.repo,
      priority: a.priority,
      context: a.context,
    })),
    events: events.map((e) => ({
      type: e.type,
      title: e.title,
      description: e.description,
      repository: e.repository,
      at: e.timestamp.toISOString(),
    })),
    themes: week.themes,
    health: health.map((h) => ({ signal: h.signal, value: h.value, headline: h.headline })),
    focus: {
      total: focus.totalFocusMin,
      windows: focus.windows,
      note: focus.note,
    },
  };
}

function sourcesFromContext(context: Awaited<ReturnType<typeof buildAiContext>>) {
  const sources: string[] = [];
  if (context.metrics.commits) sources.push(`${context.metrics.commits} commits`);
  if (context.metrics.prs) sources.push(`${context.metrics.prs} PRs`);
  if (context.metrics.reviews) sources.push(`${context.metrics.reviews} reviews`);
  if (context.metrics.ciFailures) sources.push(`${context.metrics.ciFailures} CI failures`);
  for (const action of context.actions.slice(0, 3)) {
    sources.push(action.context);
  }
  return sources.slice(0, 6);
}

export async function generateGroundedText(userId: string, prompt: string, kind = "assistant") {
  const prefs = await prisma.userPreference.findUnique({ where: { userId } });
  if (prefs && prefs.aiEnabled === false) {
    return {
      content: "AI features are disabled in your settings. You can enable them under Settings → AI.",
      sources: [] as string[],
    };
  }

  const context = await buildAiContext(userId, prompt);
  const sources = sourcesFromContext(context);
  const client = getClient();

  const system = `You are DevDash, a personal engineering assistant.
Only use the structured context provided. Never invent commits, PRs, reviews, issues, or accomplishments.
If the context is empty, say you need a GitHub sync before answering.
Do not mention being a language model.
Do not diagnose burnout or medical conditions.
Keep a calm, developer-first tone.
Format with short paragraphs and optional markdown bold.`;

  if (client) {
    const promptText = `${system}\n\nUser question (${kind}): ${prompt}\n\nStructured context (JSON):\n${JSON.stringify(context)}`;
    for (const modelName of MODEL_CANDIDATES) {
      try {
        const result = await client.getGenerativeModel({ model: modelName }).generateContent(promptText);
        const text = result.response.text();
        if (text?.trim()) {
          return { content: text, sources };
        }
      } catch (error) {
        console.error(`[gemini] ${modelName} failed:`, error instanceof Error ? error.message : error);
      }
    }
  }

  return {
    content: fallbackFromContext(prompt, context, kind),
    sources,
  };
}

function fallbackFromContext(
  prompt: string,
  context: Awaited<ReturnType<typeof buildAiContext>>,
  kind: string,
) {
  if (!context.events.length) {
    return "I don't have enough synced engineering activity yet. Connect GitHub and run a sync, then ask again. I won't invent work.";
  }
  if (kind === "standup") {
    const yesterday = context.events.slice(0, 4).map((e) => `- ${e.title} (${e.repository || "repo"})`).join("\n");
    const blockers = context.actions.slice(0, 3).map((a) => `- ${a.title}: ${a.context}`).join("\n");
    return `**Yesterday:**\n${yesterday || "- No recorded activity"}\n\n**Today:**\n- Continue work from the open items in What Needs Me.\n\n**Blockers:**\n${blockers || "- None visible in synced data"}`;
  }
  const themes = context.themes.map((t) => t.name).join(", ") || "your connected repositories";
  return `Based on synced activity: ${context.metrics.commits} commits, ${context.metrics.prs} PRs, ${context.metrics.reviews} reviews. Themes: ${themes}. ${context.actions[0] ? `Top priority: ${context.actions[0].title} (${context.actions[0].repo}).` : ""} Configure GEMINI_API_KEY for richer narrative language. Prompt was: ${prompt}`;
}

export async function generateStandup(userId: string) {
  return generateGroundedText(
    userId,
    "Generate a daily standup with Yesterday, Today, and Blockers. Use only actual activity.",
    "standup",
  );
}

export async function generateRetrospective(userId: string) {
  return generateGroundedText(
    userId,
    "Generate a sprint retrospective with accomplishments, themes, challenges, blockers, review activity, CI issues, focus patterns, and suggested improvements. Ground every fact in the data.",
    "retrospective",
  );
}

export async function generateImpact(userId: string) {
  return generateGroundedText(
    userId,
    "Generate a personal engineering impact summary as concise resume/performance-review bullets. Never claim work that is not in the data. This is private to the developer.",
    "impact",
  );
}

export async function generateWeekNarrative(userId: string) {
  const week = await computeWeekTimeline(userId, startOfWeek());
  return generateGroundedText(
    userId,
    `Write a Week in Code narrative from ${week.weekStart.toDateString()} to ${week.weekEnd.toDateString()}. Group related work. Do not invent accomplishments.`,
    "week",
  );
}
