import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const report = await prisma.sharedReport.findUnique({ where: { token } });
  const unavailable = !report || report.revoked || report.visibility === "PRIVATE";
  const summary = report?.summaryId
    ? await prisma.generatedSummary.findUnique({ where: { id: report.summaryId } })
    : null;

  return (
    <div style={{ background: "#0a0a0c", minHeight: "100vh", color: "#f0f0f2" }} className="px-6 py-16">
      <div className="max-w-2xl mx-auto rounded-xl p-8" style={{ background: "#111116", border: "1px solid #1e1e26" }}>
        {unavailable ? (
          <p className="text-sm" style={{ color: "#6b6b80" }}>This report is private or has been revoked.</p>
        ) : (
          <>
            <div className="text-xs mb-2" style={{ color: "#4a8fff" }}>{report.visibility}</div>
            <h1 className="text-xl font-bold mb-4">{summary?.title || "Shared report"}</h1>
            <pre className="text-sm whitespace-pre-wrap" style={{ color: "#a0a0b0" }}>{summary?.content}</pre>
          </>
        )}
      </div>
    </div>
  );
}
