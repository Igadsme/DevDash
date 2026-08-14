"use client";

export function SkeletonLine({ width = "100%", height = 12 }: { width?: string | number; height?: number }) {
  return (
    <div
      className="skeleton rounded"
      style={{ width, height }}
    />
  );
}

export function SkeletonCard({ height = 80 }: { height?: number }) {
  return (
    <div
      className="rounded-xl p-4 space-y-2"
      style={{ background: "#111116", border: "1px solid #1e1e26", height }}
    >
      <SkeletonLine width="60%" height={10} />
      <SkeletonLine width="40%" height={20} />
      <SkeletonLine width="80%" height={8} />
    </div>
  );
}

export function OverviewSkeleton() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <SkeletonLine width={200} height={28} />
        <div className="mt-2"><SkeletonLine width={280} height={14} /></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl overflow-hidden" style={{ background: "#111116", border: "1px solid #1e1e26" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid #1e1e26" }}>
              <SkeletonLine width={160} height={16} />
            </div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: "1px solid #1e1e26" }}>
                <div className="w-1 h-8 rounded-full skeleton" />
                <div className="flex-1 space-y-1.5">
                  <SkeletonLine width="50%" height={12} />
                  <SkeletonLine width="35%" height={10} />
                </div>
                <SkeletonLine width={60} height={28} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} height={90} />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <SkeletonCard height={160} />
          <SkeletonCard height={140} />
          <SkeletonCard height={120} />
        </div>
      </div>
    </div>
  );
}
