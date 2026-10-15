import path from "node:path";
import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// The browser calls the API through this app at /api/*, and Next proxies it to the gateway.
// Keeping the gateway same-origin makes the auth cookie first-party: frontend and gateway live on
// different onrender.com subdomains, which browsers treat as separate sites (third-party cookies).
// Rewrites are fixed at build time, so the gateway URL is a build-time variable.
const apiGatewayUrl = (process.env.API_GATEWAY_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL)?.replace(/\/+$/, "");

if (!apiGatewayUrl) {
  throw new Error(
    "API_GATEWAY_URL is not set. Local dev reads it from .env.development; production builds " +
      "need it in the build environment (CI variable, Docker build arg, or .env.production.local). " +
      "See .env.example.",
  );
}

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

  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiGatewayUrl}/:path*` }];
  },
};

export default nextConfig;
