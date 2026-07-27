import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output ships only the traced server + its needed files
  // (a few MB) instead of the whole node_modules (~191MB), cutting deploy
  // upload/startup time dramatically.
  output: "standalone",
  serverExternalPackages: ["better-sqlite3"],
  // File tracing can miss better-sqlite3's dynamically-loaded native .node
  // binary; force-include the whole package so the standalone bundle works.
  outputFileTracingIncludes: {
    "*": ["./node_modules/better-sqlite3/**"],
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
