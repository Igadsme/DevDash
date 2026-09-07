import { describe, expect, it, vi } from "vitest";

import { BitbucketAdapter } from "@/lib/providers/bitbucket";
import { GitHubAdapter } from "@/lib/providers/github";
import { GitLabAdapter } from "@/lib/providers/gitlab";
import {
  ProviderHttpError,
  requestJson,
  withRetry,
} from "@/lib/providers/http";

function response(
  body: unknown,
  headers: Record<string, string> = {},
  status = 200,
) {
  return Promise.resolve(
    new Response(JSON.stringify(body), { status, headers }),
  );
}

describe("provider adapters", () => {
  it("maps GitHub repositories and follows Link pagination", async () => {
    const fetcher = vi.fn(() =>
      response(
        {
          repositories: [
            {
              id: 7,
              name: "app",
              full_name: "acme/app",
              description: null,
              html_url: "https://github.com/acme/app",
              default_branch: "main",
              language: "TypeScript",
              private: true,
              fork: false,
              archived: false,
              pushed_at: "2026-01-01T00:00:00Z",
              owner: { id: 2 },
            },
          ],
        },
        {
          link: '<https://api.github.com/installation/repositories?page=2>; rel="next"',
          "x-ratelimit-remaining": "4999",
          "x-ratelimit-reset": "1767225600",
        },
      ),
    );
    const page = await new GitHubAdapter("token", fetcher).listRepositories({
      path: "repositories",
    });
    expect(page.items[0]).toMatchObject({
      providerId: "7",
      fullName: "acme/app",
      isPrivate: true,
    });
    expect(page.nextCursor).toContain("page=2");
    expect(page.rateLimit.remaining).toBe(4999);
  });

  it("maps repository-scoped GitHub pull requests and workflows", async () => {
    const pull = {
      id: 10,
      number: 4,
      title: "Ship",
      html_url: "https://github.com/acme/app/pull/4",
      state: "open",
      draft: false,
      merged_at: null,
      closed_at: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-02T00:00:00Z",
      user: { login: "dev" },
      head: { ref: "feature", sha: "abc" },
      base: { ref: "main" },
      requested_reviewers: [{ login: "reviewer" }],
    };
    const run = {
      id: 12,
      name: "CI",
      html_url: "https://github.com/acme/app/actions/runs/12",
      status: "completed",
      conclusion: "success",
      head_branch: "main",
      head_sha: "abc",
      run_started_at: "2026-01-02T00:00:00Z",
      updated_at: "2026-01-02T00:01:00Z",
      repository: { id: 7 },
    };
    const fetcher = vi.fn((url: string) =>
      url.includes("pulls")
        ? response([pull])
        : response({ workflow_runs: [run] }),
    );
    const adapter = new GitHubAdapter("token", fetcher);
    expect(
      (await adapter.listPullRequests({ path: "7:acme/app" })).items[0],
    ).toMatchObject({ repositoryProviderId: "7", state: "OPEN" });
    expect(
      (await adapter.listPipelines({ path: "7:acme/app" })).items[0],
    ).toMatchObject({ repositoryProviderId: "7", status: "SUCCESS" });
  });

  it("normalizes GitHub issues, commits, and completed reviews", async () => {
    const fetcher = vi.fn((url: string) => {
      if (url.includes("/issues"))
        return response([
          {
            id: 20,
            number: 3,
            title: "Bug",
            body: "Details",
            html_url: "https://github.com/issue",
            state: "open",
            user: { login: "reporter" },
            assignees: [{ login: "owner" }],
            labels: [{ name: "bug" }],
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-02T00:00:00Z",
            closed_at: null,
          },
          {
            id: 21,
            number: 4,
            title: "PR masquerading as issue",
            body: null,
            html_url: "https://github.com/pull",
            state: "open",
            user: null,
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-02T00:00:00Z",
            closed_at: null,
            pull_request: {},
          },
        ]);
      if (url.includes("/commits"))
        return response([
          {
            sha: "abcdef123",
            html_url: "https://github.com/commit",
            commit: {
              message: "Title\nBody",
              author: { name: "Dev", date: "2026-01-02T00:00:00Z" },
            },
            author: { login: "dev" },
          },
        ]);
      return response([
        {
          id: 30,
          user: { login: "reviewer" },
          state: "APPROVED",
          body: "LGTM",
          submitted_at: "2026-01-03T00:00:00Z",
        },
      ]);
    });
    const adapter = new GitHubAdapter("token", fetcher);
    expect(
      (await adapter.listIssues({ path: "7:acme/app" })).items,
    ).toHaveLength(1);
    expect(
      (await adapter.listCommits({ path: "7:acme/app" })).items[0],
    ).toMatchObject({ title: "Title", authorLogin: "dev" });
    expect(
      (await adapter.listReviews({ path: "7:acme/app:10:4" })).items[0],
    ).toMatchObject({ repositoryProviderId: "7", state: "APPROVED" });
  });

  it("combines GitHub commit statuses and Checks API results", async () => {
    const fetcher = vi.fn((url: string) =>
      url.includes("check-runs")
        ? response({
            check_runs: [
              {
                id: 2,
                name: "unit",
                html_url: "https://github.com/check",
                status: "completed",
                conclusion: "success",
                started_at: "2026-01-01T00:00:00Z",
                completed_at: "2026-01-01T00:01:00Z",
              },
            ],
          })
        : response({
            state: "failure",
            statuses: [
              {
                id: 1,
                context: "deploy",
                state: "failure",
                target_url: "https://github.com/status",
                description: "Failed",
                created_at: "2026-01-01T00:00:00Z",
                updated_at: "2026-01-01T00:01:00Z",
              },
            ],
          }),
    );
    const result = await new GitHubAdapter("token", fetcher).getCommitChecks({
      path: "7:acme/app:abc",
    });
    expect(result.status).toBe("FAILED");
    expect(result.jobs.map((job) => job.providerId)).toEqual([
      "status-1",
      "check-2",
    ]);
  });

  it("maps GitLab data and x-next-page pagination", async () => {
    const fetcher = vi.fn((url: string) =>
      url.includes("/projects?")
        ? response(
            [
              {
                id: 3,
                name: "api",
                path_with_namespace: "team/api",
                description: null,
                web_url: "https://gitlab.com/team/api",
                default_branch: "main",
                visibility: "public",
                archived: false,
                last_activity_at: "2026-01-01T00:00:00Z",
                namespace: { id: 8 },
              },
            ],
            { "x-next-page": "2" },
          )
        : url.includes("merge_requests")
          ? response([
              {
                id: 5,
                iid: 2,
                project_id: 3,
                title: "MR",
                web_url: "https://gitlab.com/mr",
                state: "opened",
                draft: false,
                author: { username: "dev" },
                source_branch: "x",
                target_branch: "main",
                sha: "a",
                created_at: "2026-01-01T00:00:00Z",
                updated_at: "2026-01-02T00:00:00Z",
                merged_at: null,
                closed_at: null,
              },
            ])
          : response([
              {
                id: 9,
                project_id: 3,
                web_url: "https://gitlab.com/p",
                status: "failed",
                ref: "main",
                sha: "a",
                created_at: "2026-01-01T00:00:00Z",
                updated_at: "2026-01-02T00:00:00Z",
              },
            ]),
    );
    const adapter = new GitLabAdapter("token", fetcher);
    expect(
      (await adapter.listRepositories({ path: "repositories" })).nextCursor,
    ).toContain("page=2");
    expect(
      (await adapter.listPullRequests({ path: "3:team/api" })).items[0]?.state,
    ).toBe("OPEN");
    expect(
      (await adapter.listPipelines({ path: "3:team/api" })).items[0]?.status,
    ).toBe("FAILED");
  });

  it("normalizes GitLab issues, commits, and approvals", async () => {
    const fetcher = vi.fn((url: string) =>
      url.includes("/issues")
        ? response([
            {
              id: 14,
              iid: 2,
              project_id: 3,
              title: "Issue",
              description: null,
              web_url: "https://gitlab.com/issue",
              state: "opened",
              created_at: "2026-01-01T00:00:00Z",
              updated_at: "2026-01-02T00:00:00Z",
              closed_at: null,
            },
          ])
        : url.includes("/commits")
          ? response([
              {
                id: "sha",
                short_id: "sha",
                title: "Commit",
                message: "Commit",
                web_url: "https://gitlab.com/commit",
                author_name: "Dev",
                authored_date: "2026-01-02T00:00:00Z",
              },
            ])
          : response({
              approved_by: [{ user: { id: 9, username: "reviewer" } }],
            }),
    );
    const adapter = new GitLabAdapter("token", fetcher);
    expect(
      (await adapter.listIssues({ path: "3:team/api" })).items[0]?.state,
    ).toBe("OPEN");
    expect(
      (await adapter.listCommits({ path: "3:team/api" })).items[0]?.sha,
    ).toBe("sha");
    expect(
      (await adapter.listReviews({ path: "3:team/api:5:2" })).items[0]
        ?.reviewerLogin,
    ).toBe("reviewer");
  });

  it("maps Bitbucket pages and repository context", async () => {
    const fetcher = vi.fn((url: string) =>
      url.includes("pullrequests")
        ? response({
            values: [
              {
                id: 4,
                title: "PR",
                links: { html: { href: "https://bitbucket.org/pr" } },
                state: "OPEN",
                author: { display_name: "dev" },
                source: {
                  branch: { name: "x" },
                  commit: { hash: "a" },
                  repository: { uuid: "repo" },
                },
                destination: { branch: { name: "main" } },
                created_on: "2026-01-01T00:00:00Z",
                updated_on: "2026-01-02T00:00:00Z",
              },
            ],
            next: "https://next",
          })
        : url.includes("pipelines")
          ? response({
              values: [
                {
                  uuid: "run",
                  build_number: 2,
                  repository: { uuid: "repo" },
                  state: { name: "COMPLETED", result: { name: "SUCCESSFUL" } },
                  created_on: "2026-01-01T00:00:00Z",
                  completed_on: "2026-01-01T00:01:00Z",
                  links: { html: { href: "https://bitbucket.org/run" } },
                },
              ],
            })
          : response({
              values: [
                {
                  uuid: "repo",
                  name: "web",
                  full_name: "team/web",
                  links: { html: { href: "https://bitbucket.org/team/web" } },
                  is_private: false,
                  updated_on: "2026-01-01T00:00:00Z",
                  workspace: { uuid: "workspace" },
                },
              ],
            }),
    );
    const adapter = new BitbucketAdapter("token", fetcher);
    expect(
      (await adapter.listRepositories({ path: "repositories" })).items[0]
        ?.fullName,
    ).toBe("team/web");
    expect(
      (await adapter.listPullRequests({ path: "repo:team/web" })).nextCursor,
    ).toBe("https://next");
    expect(
      (await adapter.listPipelines({ path: "repo:team/web" })).items[0]?.status,
    ).toBe("SUCCESS");
  });

  it("normalizes Bitbucket issues, commits, and approvals", async () => {
    const fetcher = vi.fn((url: string) =>
      url.includes("/issues")
        ? response({
            values: [
              {
                id: 2,
                title: "Issue",
                content: { raw: "Details" },
                links: { html: { href: "https://bitbucket.org/issue" } },
                state: "new",
                reporter: { display_name: "Reporter" },
                created_on: "2026-01-01T00:00:00Z",
                updated_on: "2026-01-02T00:00:00Z",
              },
            ],
          })
        : url.includes("/commits")
          ? response({
              values: [
                {
                  hash: "sha",
                  message: "Title\nBody",
                  links: { html: { href: "https://bitbucket.org/commit" } },
                  author: { user: { display_name: "Dev", nickname: "dev" } },
                  date: "2026-01-02T00:00:00Z",
                },
              ],
            })
          : response({
              values: [
                {
                  approval: {
                    user: { uuid: "user", display_name: "Reviewer" },
                    date: "2026-01-03T00:00:00Z",
                  },
                },
              ],
            }),
    );
    const adapter = new BitbucketAdapter("token", fetcher);
    expect(
      (await adapter.listIssues({ path: "repo:team/web" })).items[0]?.state,
    ).toBe("OPEN");
    expect(
      (await adapter.listCommits({ path: "repo:team/web" })).items[0]?.title,
    ).toBe("Title");
    expect(
      (await adapter.listReviews({ path: "repo:team/web:4:4" })).items[0]
        ?.state,
    ).toBe("APPROVED");
  });
});

describe("provider HTTP behavior", () => {
  it("classifies authorization and rate-limit failures without leaking bodies", async () => {
    await expect(
      requestJson(
        () => response({ token: "secret" }, {}, 401),
        "https://provider.test",
        {},
      ),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED", status: 401 });
    await expect(
      requestJson(
        () =>
          response(
            {},
            { "x-ratelimit-remaining": "0", "x-ratelimit-reset": "1767225600" },
            403,
          ),
        "https://provider.test",
        {},
      ),
    ).rejects.toMatchObject({ code: "RATE_LIMITED", status: 403 });
  });

  it("retries transient failures and stops on authorization failures", async () => {
    vi.useFakeTimers();
    let attempts = 0;
    const operation = vi.fn(async () => {
      attempts += 1;
      if (attempts < 3) throw new Error("temporary");
      return "ok";
    });
    const promise = withRetry(operation, 4, () => 0);
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe("ok");
    await expect(
      withRetry(async () => {
        throw new ProviderHttpError("no", 401, "UNAUTHORIZED");
      }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    vi.useRealTimers();
  });
});
