import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "DevDash",
  description: "Developer-first productivity dashboard with privacy-first insights."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="font-sans"
        style={{
          fontFamily: '"Manrope", "Avenir Next", "Segoe UI", sans-serif',
          fontFeatureSettings: '"ss01" on, "cv01" on'
        }}
      >
        {children}
      </body>
    </html>
  );
}
