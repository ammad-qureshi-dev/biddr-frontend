import path from "node:path";
import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: false,

  // Self-contained server in .next/standalone (used by the Dockerfile); `next start` still works.
  output: "standalone",

  // Pin the project root. Without this, a stray lockfile in a parent directory makes Next infer
  // the wrong workspace root, which breaks dev file-watching and nests the standalone output.
  turbopack: {
    root: path.join(__dirname),
  },

  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
