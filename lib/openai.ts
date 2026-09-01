import type { Event, User } from "@prisma/client";
import OpenAI from "openai";

import { summarizeEvents } from "@/lib/analytics";

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function buildFallbackSummary(events: Event[]) {
  const summary = summarizeEvents(events);
  const repos = [...new Set(events.map((event) => event.repo))];

  return [
    `You moved work forward in ${repos.length} repositories this week.`,
    `${summary.built} shipping events were recorded, including ${summary.commits} commits and opened or merged pull requests.`,
    `${summary.reviewed} review events were completed, while ${summary.blocked} CI failures and ${summary.issues} assigned issues still need attention.`
  ].join(" ");
}

export async function generateWeeklySummary(events: Event[], user: Pick<User, "aiEnabled">) {
  if (!user.aiEnabled || events.length === 0) {
    return buildFallbackSummary(events);
  }

  if (!client) {
    return buildFallbackSummary(events);
  }

  const compactEvents = events.map((event) => ({
    type: event.type,
    timestamp: event.timestamp.toISOString(),
    repo: event.repo,
    metadata: event.metadata
  }));

  try {
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: [{
            type: "input_text",
            text: "Write a concise weekly engineering summary grounded only in the provided event data. Cover what was built, what was reviewed, and what was blocked. Do not invent work."
          }]
        },
        {
          role: "user",
          content: [{ type: "input_text", text: JSON.stringify(compactEvents) }]
        }
      ]
    });

    return response.output_text || buildFallbackSummary(events);
  } catch (error) {
    console.error("OpenAI summary generation failed; using the local summary.", error);
    return buildFallbackSummary(events);
  }
}
