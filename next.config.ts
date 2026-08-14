import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname),
  eslint: {
    dirs: ["app", "components", "lib"],
  },
};

export default nextConfig;
