import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/pricing", "/privacy", "/terms", "/signin", "/signup"],
      disallow: ["/app/", "/onboarding", "/api/", "/share/"],
    },
  };
}
