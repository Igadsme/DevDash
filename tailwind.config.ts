import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#f4f5f8",
        inkText: "hsl(var(--foreground))",
        canvas: "hsl(var(--background))",
        card: "hsl(var(--card))",
        border: "hsl(var(--border))",
        muted: "hsl(var(--muted-foreground))",
        mutedBg: "hsl(var(--muted))",
        navy: "hsl(var(--primary))",
        amber: "hsl(var(--accent))",
        teal: "hsl(var(--teal))",
        sidebarText: "hsl(var(--sidebar-foreground))",
        sidebarBorder: "hsl(var(--sidebar-border))",
        sidebarActive: "hsl(var(--sidebar-accent))",
        panel: "hsl(var(--card))",
        panelMuted: "hsl(var(--muted))",
        accent: "hsl(var(--accent))",
        accentSoft: "hsl(var(--accent) / .16)",
        warning: "hsl(var(--accent))",
        danger: "hsl(var(--destructive))",
      },
      boxShadow: {
        glow: "0 10px 30px hsl(222 32% 14% / .05)",
      },
      backgroundImage: {
        noise:
          "radial-gradient(circle at 76% 3%, hsl(38 92% 62% / .08), transparent 23rem)",
      },
    },
  },
  plugins: [],
};

export default config;
