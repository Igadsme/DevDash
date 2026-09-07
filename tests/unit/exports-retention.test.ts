import { describe, expect, it } from "vitest";

import { buildNotionBrief, buildSlackBrief } from "@/lib/exports";
import { retentionCutoff } from "@/lib/retention-policy";

const brief = {
  overview: "Two pull requests merged.",
  completed: ["Merged two pull requests"],
  reviews: [],
  blockers: [],
  nextActions: ["Review the release"],
};

describe("export contracts", () => {
  it("builds Slack Block Kit with an accessible fallback", () => {
    const payload = buildSlackBrief("C123", brief);
    expect(payload.channel).toBe("C123");
    expect(payload.text).toContain(brief.overview);
    expect(payload.blocks).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "header" })]),
    );
  });

  it("builds a Notion page under the explicitly selected parent", () => {
    const payload = buildNotionBrief(
      "page-id",
      brief,
      new Date("2026-01-02T00:00:00Z"),
    );
    expect(payload.parent).toEqual({ type: "page_id", page_id: "page-id" });
    expect(payload.properties.title.title[0]?.text.content).toContain(
      "2026-01-02",
    );
    expect(
      payload.children.some((item) => item.type === "bulleted_list_item"),
    ).toBe(true);
  });
});

describe("retention cutoff", () => {
  it("clamps retention to supported bounds", () => {
    const now = new Date("2026-02-01T00:00:00Z");
    expect(retentionCutoff(1, now).toISOString()).toBe(
      "2026-01-25T00:00:00.000Z",
    );
    expect(retentionCutoff(10_000, now).getUTCFullYear()).toBe(2016);
  });
});
