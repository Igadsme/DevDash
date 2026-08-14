import { Check, ArrowLeft, Zap, GitBranch } from "lucide-react";

interface Props {
  onNavigate: (page: string) => void;
}

const plans = [
  {
    name: "Solo",
    price: "$0",
    period: "/month",
    tagline: "For individual developers",
    highlight: false,
    badge: null,
    features: [
      "GitHub integration",
      "7-day activity history",
      "Basic focus tracking",
      "Weekly summary",
      "What Needs Me",
      "Activity timeline",
    ],
    cta: "Start free",
    ctaAction: "signup",
  },
  {
    name: "Pro",
    price: "$12",
    period: "/month",
    tagline: "For serious developers",
    highlight: true,
    badge: "Most popular",
    features: [
      "All integrations",
      "Unlimited history",
      "AI assistant",
      "AI-generated reports",
      "Advanced analytics",
      "Dev Health insights",
      "Focus intelligence",
      "Export summaries",
      "Priority support",
    ],
    cta: "Start with GitHub",
    ctaAction: "connect",
  },
  {
    name: "Team",
    price: "$8",
    period: "/user/month",
    tagline: "For engineering teams",
    highlight: false,
    badge: null,
    features: [
      "Everything in Pro",
      "Team analytics",
      "Shared reports",
      "Manager dashboard",
      "SSO / SAML",
      "API access",
      "Audit log",
      "Dedicated support",
    ],
    cta: "Contact sales",
    ctaAction: "landing",
  },
];

const faq = [
  {
    q: "Is my data private by default?",
    a: "Yes. Dev Health, Focus Patterns, and Engineering Activity are all private by default. You control what's shared and with whom. Nothing is visible to managers without your explicit consent.",
  },
  {
    q: "Does DevDash sell my engineering data?",
    a: "No. Your data is used only to power your own dashboard. We don't sell, share, or train models on your activity without consent.",
  },
  {
    q: "What data does GitHub integration access?",
    a: "DevDash reads your commits, pull requests, reviews, issues, and CI run status. It does not access private repository contents, secrets, or credentials.",
  },
  {
    q: "Can I try Pro before paying?",
    a: "Yes — Pro comes with a 14-day free trial. No credit card required to start.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel anytime from your account settings. You keep access until the end of the billing period.",
  },
];

export default function Pricing({ onNavigate }: Props) {
  return (
    <div style={{ background: "#0a0a0c", minHeight: "100vh", color: "#f0f0f2" }}>
      {/* Nav */}
      <nav
        className="sticky top-0 z-40 flex items-center justify-between px-8"
        style={{ height: 56, background: "rgba(10,10,12,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid #1e1e26" }}
      >
        <button
          onClick={() => onNavigate("landing")}
          className="flex items-center gap-2"
        >
          <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "#4a8fff" }}>
            <span className="text-white text-xs font-bold">D</span>
          </div>
          <span className="font-semibold tracking-tight">DevDash</span>
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate("signin")}
            className="text-sm transition-all"
            style={{ color: "#6b6b80" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#f0f0f2")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#6b6b80")}
          >
            Sign In
          </button>
          <button
            onClick={() => onNavigate("signup")}
            className="px-3.5 py-1.5 rounded-md text-sm font-medium"
            style={{ background: "#4a8fff", color: "#fff" }}
          >
            Get Started
          </button>
        </div>
      </nav>

      <div className="px-6 md:px-12 max-w-5xl mx-auto py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: "#f0f0f2", letterSpacing: "-0.02em" }}>
            Simple, transparent pricing.
          </h1>
          <p className="text-base" style={{ color: "#6b6b80" }}>
            Start free. Upgrade when you need more. No surprise bills.
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-5 mb-20">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="rounded-xl p-6 flex flex-col relative"
              style={{
                background: plan.highlight ? "#0d1a2d" : "#111116",
                border: `1px solid ${plan.highlight ? "#1a3050" : "#1e1e26"}`,
                boxShadow: plan.highlight ? "0 0 40px rgba(74,143,255,0.08)" : "none",
              }}
            >
              {plan.badge && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: "#4a8fff", color: "#fff" }}
                >
                  {plan.badge}
                </div>
              )}
              <div className="mb-6">
                <div className="text-sm font-semibold mb-0.5" style={{ color: plan.highlight ? "#4a8fff" : "#a0a0b0" }}>
                  {plan.name}
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold" style={{ color: "#f0f0f2" }}>{plan.price}</span>
                  <span className="text-sm" style={{ color: "#6b6b80" }}>{plan.period}</span>
                </div>
                <div className="text-xs" style={{ color: "#6b6b80" }}>{plan.tagline}</div>
              </div>

              <div className="flex-1 space-y-2 mb-6">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm">
                    <Check size={13} style={{ color: plan.highlight ? "#4a8fff" : "#22c55e", flexShrink: 0 }} />
                    <span style={{ color: "#a0a0b0" }}>{f}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => onNavigate(plan.ctaAction)}
                className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: plan.highlight ? "#4a8fff" : "#1e1e2a",
                  color: plan.highlight ? "#fff" : "#a0a0b0",
                  border: plan.highlight ? "none" : "1px solid #2a2a35",
                }}
                onMouseEnter={(e) => {
                  if (!plan.highlight) (e.currentTarget as HTMLElement).style.color = "#f0f0f2";
                  if (plan.highlight) (e.currentTarget as HTMLElement).style.background = "#3b7ae8";
                }}
                onMouseLeave={(e) => {
                  if (!plan.highlight) (e.currentTarget as HTMLElement).style.color = "#a0a0b0";
                  if (plan.highlight) (e.currentTarget as HTMLElement).style.background = "#4a8fff";
                }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Feature comparison note */}
        <div
          className="flex items-center gap-3 px-5 py-4 rounded-xl mb-20"
          style={{ background: "#111116", border: "1px solid #1e1e26" }}
        >
          <GitBranch size={15} style={{ color: "#22c55e", flexShrink: 0 }} />
          <div className="text-sm" style={{ color: "#8b8b9a" }}>
            All plans include private-by-default Dev Health, Focus Patterns, and Engineering Activity.
            No plan ever gives managers access without your explicit consent.
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold mb-6 text-center" style={{ color: "#f0f0f2", letterSpacing: "-0.01em" }}>
            Frequently asked questions
          </h2>
          <div className="space-y-2">
            {faq.map((item) => (
              <div
                key={item.q}
                className="rounded-xl p-5"
                style={{ background: "#111116", border: "1px solid #1e1e26" }}
              >
                <div className="text-sm font-semibold mb-2" style={{ color: "#f0f0f2" }}>{item.q}</div>
                <div className="text-sm leading-relaxed" style={{ color: "#6b6b80" }}>{item.a}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center mt-20">
          <h2 className="text-2xl font-bold mb-3" style={{ color: "#f0f0f2", letterSpacing: "-0.01em" }}>
            Ready to understand your work?
          </h2>
          <p className="text-sm mb-6" style={{ color: "#6b6b80" }}>
            Connect GitHub and get your first Week in Code summary in minutes.
          </p>
          <button
            onClick={() => onNavigate("connect")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all"
            style={{ background: "#4a8fff", color: "#fff" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#3b7ae8")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#4a8fff")}
          >
            <Zap size={14} />
            Start free — no credit card
          </button>
        </div>
      </div>

      <footer className="px-8 py-6" style={{ borderTop: "1px solid #1e1e26" }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: "#4a8fff" }}>
              <span className="text-white font-bold" style={{ fontSize: 8 }}>D</span>
            </div>
            <span className="text-sm font-semibold">DevDash</span>
          </div>
          <div className="text-xs" style={{ color: "#6b6b80" }}>© 2026 DevDash. Built for developers.</div>
        </div>
      </footer>
    </div>
  );
}
