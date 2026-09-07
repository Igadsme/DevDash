import { TaskManager } from "@/components/task-manager";
import { SiteShell } from "@/components/site-shell";
import { requireUser } from "@/lib/data";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export default async function TasksPage() {
  const user = await requireUser();
  const [tasks, repositories, pullRequests, issues] = await Promise.all([
    prisma.task.findMany({
      where: { userId: user.id },
      orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
    }),
    prisma.repository.findMany({
      where: { userId: user.id },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.pullRequest.findMany({
      where: { userId: user.id, state: "OPEN" },
      select: {
        id: true,
        repositoryId: true,
        number: true,
        title: true,
        url: true,
        repository: { select: { fullName: true } },
      },
      orderBy: { providerUpdatedAt: "desc" },
      take: 100,
    }),
    prisma.issue.findMany({
      where: { userId: user.id, state: "OPEN" },
      select: {
        id: true,
        repositoryId: true,
        number: true,
        title: true,
        url: true,
        repository: { select: { fullName: true } },
      },
      orderBy: { providerUpdatedAt: "desc" },
      take: 100,
    }),
  ]);
  return (
    <SiteShell user={user}>
      <div className="space-y-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[.18em] text-teal">
            Personal planning
          </p>
          <h1 className="mt-2 text-3xl font-extrabold">Tasks</h1>
          <p className="mt-2 text-sm text-muted">
            Create and track private work linked to repositories.
          </p>
        </div>
        <TaskManager
          initialTasks={tasks}
          repositories={repositories}
          pullRequests={pullRequests}
          issues={issues}
        />
      </div>
    </SiteShell>
  );
}
