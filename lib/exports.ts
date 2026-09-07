import type { AIBrief } from "@/lib/ai";

export function buildSlackBrief(channel: string, brief: AIBrief) {
  return {
    channel,
    text: `DevDash weekly brief: ${brief.overview}`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "DevDash weekly brief" },
      },
      { type: "section", text: { type: "mrkdwn", text: brief.overview } },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Next actions*\n${brief.nextActions.map((item) => `• ${item}`).join("\n")}`,
        },
      },
    ],
  };
}

export function buildNotionBrief(
  parentPageId: string,
  brief: AIBrief,
  date = new Date(),
) {
  return {
    parent: { type: "page_id", page_id: parentPageId },
    properties: {
      title: {
        type: "title",
        title: [
          {
            type: "text",
            text: {
              content: `DevDash weekly brief — ${date.toISOString().slice(0, 10)}`,
            },
          },
        ],
      },
    },
    children: [
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: brief.overview } }],
        },
      },
      {
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ type: "text", text: { content: "Next actions" } }],
        },
      },
      ...brief.nextActions.map((item) => ({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{ type: "text", text: { content: item } }],
        },
      })),
    ],
  };
}
