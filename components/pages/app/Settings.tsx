"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useApi, patchJson } from "@/lib/hooks";

const sections = ["Account", "Integrations", "Privacy", "Dev Health", "Focus", "Notifications", "AI", "Sharing"];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative w-9 h-5 rounded-full transition-all flex-shrink-0"
      style={{ background: checked ? "#4a8fff" : "#1e1e26" }}
    >
      <div
        className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
        style={{
          background: "#f0f0f2",
          left: checked ? "calc(100% - 18px)" : "2px",
        }}
      />
    </button>
  );
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-4" style={{ borderBottom: "1px solid #1e1e26" }}>
      <div className="flex-1 min-w-0 pr-8">
        <div className="text-sm font-medium" style={{ color: "#f0f0f2" }}>{label}</div>
        {desc && <div className="text-xs mt-0.5" style={{ color: "#6b6b80" }}>{desc}</div>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

export default function Settings() {
  const [activeSection, setActiveSection] = useState("Account");
  const [saved, setSaved] = useState(false);
  const { data, reload } = useApi<{
    user: {
      name?: string | null;
      email?: string | null;
      timezone?: string;
      workHoursStart?: string;
      workHoursEnd?: string;
      afterHoursThreshold?: string;
      preferences?: {
        afterHoursSignal: boolean;
        weekendSignal: boolean;
        churnSignal: boolean;
        meetingsSignal: boolean;
        privacyDevHealth: string;
        privacyFocus: string;
        privacyActivity: string;
        privacyAiSummaries: string;
        privacyPerformance: string;
        aiEnabled: boolean;
        notifyEmail: boolean;
        notifyInApp: boolean;
      };
    };
  }>("/api/settings");
  const user = data?.user;
  const [privacy, setPrivacy] = useState({
    devHealth: true,
    focusPatterns: true,
    activity: true,
    reports: false,
    analytics: false,
  });
  const [health, setHealth] = useState({
    afterHours: true,
    weekend: true,
    churn: true,
    meetings: true,
    threshold: "20:00",
  });
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");

  const persist = async () => {
    await patchJson("/api/settings", {
      name: name || user?.name,
      timezone,
      afterHoursThreshold: health.threshold,
      preferences: {
        afterHoursSignal: health.afterHours,
        weekendSignal: health.weekend,
        churnSignal: health.churn,
        meetingsSignal: health.meetings,
        privacyDevHealth: privacy.devHealth ? "PRIVATE" : "SHAREABLE",
        privacyFocus: privacy.focusPatterns ? "PRIVATE" : "SHAREABLE",
        privacyActivity: privacy.activity ? "PRIVATE" : "SHAREABLE",
        privacyAiSummaries: privacy.reports ? "SHAREABLE" : "PRIVATE",
        privacyPerformance: privacy.analytics ? "SHAREABLE" : "PRIVATE",
      },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    await reload();
  };

  return (
    <div className="p-6 max-w-3xl mx-auto fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1" style={{ color: "#f0f0f2", letterSpacing: "-0.01em" }}>Settings</h1>
      </div>

      <div className="flex gap-6">
        {/* Section nav */}
        <div className="w-40 flex-shrink-0">
          <div className="space-y-0.5">
            {sections.map((s) => (
              <button
                key={s}
                onClick={() => setActiveSection(s)}
                className="w-full text-left px-3 py-2 rounded-md text-sm transition-all"
                style={{
                  background: activeSection === s ? "#1e1e2a" : "transparent",
                  color: activeSection === s ? "#f0f0f2" : "#6b6b80",
                }}
                onMouseEnter={(e) => {
                  if (activeSection !== s)
                    (e.currentTarget as HTMLElement).style.color = "#a0a0b0";
                }}
                onMouseLeave={(e) => {
                  if (activeSection !== s)
                    (e.currentTarget as HTMLElement).style.color = "#6b6b80";
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeSection === "Account" && (
            <div className="rounded-xl overflow-hidden fade-in" style={{ background: "#111116", border: "1px solid #1e1e26" }}>
              <div className="px-5 py-3" style={{ borderBottom: "1px solid #1e1e26" }}>
                <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "#6b6b80" }}>Account</span>
              </div>
              <div className="px-5">
                <SettingRow label="Display name" desc="Shown in reports and AI summaries">
                  <input
                    defaultValue={user?.name || ""}
                    onChange={(e) => setName(e.target.value)}
                    className="px-3 py-1.5 rounded-md text-sm outline-none"
                    style={{ background: "#0c0c10", border: "1px solid #1e1e26", color: "#f0f0f2", width: 160 }}
                  />
                </SettingRow>
                <SettingRow label="Email" desc="Used for report delivery and notifications">
                  <input
                    defaultValue={user?.email || ""}
                    disabled
                    className="px-3 py-1.5 rounded-md text-sm outline-none"
                    style={{ background: "#0c0c10", border: "1px solid #1e1e26", color: "#f0f0f2", width: 200 }}
                  />
                </SettingRow>
                <SettingRow label="Avatar">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                      style={{ background: "#1e1e2a", color: "#4a8fff" }}
                    >
                      { (user?.name || "D").slice(0, 1).toUpperCase() }
                    </div>
                    <button
                      className="text-xs px-2 py-1 rounded"
                      style={{ background: "#1e1e2a", color: "#a0a0b0", border: "1px solid #2a2a35" }}
                    >
                      Change
                    </button>
                  </div>
                </SettingRow>
              </div>
            </div>
          )}

          {activeSection === "Privacy" && (
            <div className="rounded-xl overflow-hidden fade-in" style={{ background: "#111116", border: "1px solid #1e1e26" }}>
              <div className="px-5 py-3" style={{ borderBottom: "1px solid #1e1e26" }}>
                <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "#6b6b80" }}>Privacy controls</span>
              </div>
              <div className="px-5">
                <SettingRow label="Dev Health" desc="After-hours, weekend activity, churn signals">
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: privacy.devHealth ? "#22c55e" : "#6b7280" }}>
                      {privacy.devHealth ? "Private" : "Shared"}
                    </span>
                    <Toggle checked={privacy.devHealth} onChange={(v) => setPrivacy((p) => ({ ...p, devHealth: v }))} />
                  </div>
                </SettingRow>
                <SettingRow label="Focus Patterns" desc="Focus blocks, interruptions, best windows">
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: privacy.focusPatterns ? "#22c55e" : "#6b7280" }}>
                      {privacy.focusPatterns ? "Private" : "Shared"}
                    </span>
                    <Toggle checked={privacy.focusPatterns} onChange={(v) => setPrivacy((p) => ({ ...p, focusPatterns: v }))} />
                  </div>
                </SettingRow>
                <SettingRow label="Engineering Activity" desc="Commits, PRs, reviews, CI activity">
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: privacy.activity ? "#22c55e" : "#6b7280" }}>
                      {privacy.activity ? "Private" : "Shared"}
                    </span>
                    <Toggle checked={privacy.activity} onChange={(v) => setPrivacy((p) => ({ ...p, activity: v }))} />
                  </div>
                </SettingRow>
                <SettingRow label="Reports" desc="Standups, retrospectives, summaries">
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: !privacy.reports ? "#22c55e" : "#f59e0b" }}>
                      {privacy.reports ? "Shareable" : "Private"}
                    </span>
                    <Toggle checked={privacy.reports} onChange={(v) => setPrivacy((p) => ({ ...p, reports: v }))} />
                  </div>
                </SettingRow>
                <SettingRow label="Analytics" desc="Metrics and trend data">
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: !privacy.analytics ? "#22c55e" : "#f59e0b" }}>
                      {privacy.analytics ? "Shareable" : "Private"}
                    </span>
                    <Toggle checked={privacy.analytics} onChange={(v) => setPrivacy((p) => ({ ...p, analytics: v }))} />
                  </div>
                </SettingRow>
              </div>
            </div>
          )}

          {activeSection === "Dev Health" && (
            <div className="rounded-xl overflow-hidden fade-in" style={{ background: "#111116", border: "1px solid #1e1e26" }}>
              <div className="px-5 py-3" style={{ borderBottom: "1px solid #1e1e26" }}>
                <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "#6b6b80" }}>Dev Health signals</span>
              </div>
              <div className="px-5">
                <SettingRow label="After-hours activity" desc="Track commits and PRs after your threshold">
                  <Toggle checked={health.afterHours} onChange={(v) => setHealth((h) => ({ ...h, afterHours: v }))} />
                </SettingRow>
                <SettingRow label="After-hours threshold" desc="Work after this time is flagged">
                  <input
                    value={health.threshold}
                    onChange={(e) => setHealth((h) => ({ ...h, threshold: e.target.value }))}
                    className="px-3 py-1.5 rounded-md text-sm outline-none font-mono"
                    style={{ background: "#0c0c10", border: "1px solid #1e1e26", color: "#f0f0f2", width: 100 }}
                  />
                </SettingRow>
                <SettingRow label="Weekend activity" desc="Track activity on Saturday and Sunday">
                  <Toggle checked={health.weekend} onChange={(v) => setHealth((h) => ({ ...h, weekend: v }))} />
                </SettingRow>
                <SettingRow label="PR churn" desc="Monitor excessive rewrites and force-pushes">
                  <Toggle checked={health.churn} onChange={(v) => setHealth((h) => ({ ...h, churn: v }))} />
                </SettingRow>
                <SettingRow label="Meeting load" desc="Track daily meeting hours from calendar">
                  <Toggle checked={health.meetings} onChange={(v) => setHealth((h) => ({ ...h, meetings: v }))} />
                </SettingRow>
              </div>
            </div>
          )}

          {(activeSection === "Integrations" || activeSection === "AI" || activeSection === "Focus" || activeSection === "Notifications" || activeSection === "Sharing") && (
            <div className="rounded-xl overflow-hidden fade-in" style={{ background: "#111116", border: "1px solid #1e1e26" }}>
              <div className="px-5 py-3" style={{ borderBottom: "1px solid #1e1e26" }}>
                <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "#6b6b80" }}>{activeSection}</span>
              </div>
              <div className="px-5">
                {activeSection === "Integrations" && (
                  <SettingRow label="Manage connections" desc="Source control, CI/CD, calendar, and chat">
                    <a href="/app/integrations" className="text-xs" style={{ color: "#4a8fff" }}>Open Integrations</a>
                  </SettingRow>
                )}
                {activeSection === "AI" && (
                  <SettingRow label="AI features" desc="Assistant, standups, and narratives. Disabled means no data is sent to Gemini.">
                    <Toggle checked={user?.preferences?.aiEnabled !== false} onChange={(v) => patchJson("/api/settings", { preferences: { aiEnabled: v } }).then(() => reload())} />
                  </SettingRow>
                )}
                {activeSection === "Focus" && (
                  <>
                    <SettingRow label="Timezone" desc="Used for after-hours and focus windows">
                      <input defaultValue={user?.timezone || timezone} onChange={(e) => setTimezone(e.target.value)} className="px-3 py-1.5 rounded-md text-sm outline-none" style={{ background: "#0c0c10", border: "1px solid #1e1e26", color: "#f0f0f2", width: 180 }} />
                    </SettingRow>
                    <SettingRow label="Work hours" desc="Preferred deep-work window">
                      <div className="flex gap-2">
                        <input defaultValue={user?.workHoursStart || "09:00"} className="px-2 py-1.5 rounded-md text-sm font-mono" style={{ background: "#0c0c10", border: "1px solid #1e1e26", color: "#f0f0f2", width: 80 }} />
                        <input defaultValue={user?.workHoursEnd || "18:00"} className="px-2 py-1.5 rounded-md text-sm font-mono" style={{ background: "#0c0c10", border: "1px solid #1e1e26", color: "#f0f0f2", width: 80 }} />
                      </div>
                    </SettingRow>
                  </>
                )}
                {activeSection === "Notifications" && (
                  <>
                    <SettingRow label="Email notifications" desc="Standups and failing CI">
                      <Toggle checked={user?.preferences?.notifyEmail !== false} onChange={(v) => patchJson("/api/settings", { preferences: { notifyEmail: v } }).then(() => reload())} />
                    </SettingRow>
                    <SettingRow label="In-app notifications" desc="Bell menu in the top bar">
                      <Toggle checked={user?.preferences?.notifyInApp !== false} onChange={(v) => patchJson("/api/settings", { preferences: { notifyInApp: v } }).then(() => reload())} />
                    </SettingRow>
                  </>
                )}
                {activeSection === "Sharing" && (
                  <SettingRow label="Default sharing" desc="Reports stay private unless you create a share link">
                    <span className="text-xs" style={{ color: "#22c55e" }}>PRIVATE</span>
                  </SettingRow>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => void persist()}
              className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-md transition-all"
              style={{ background: "#4a8fff", color: "#fff" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#3b7ae8")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#4a8fff")}
            >
              <Check size={12} />
              {saved ? "Saved" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
