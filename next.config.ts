import type { NextConfig } from "next";

process.env.MASTRA_TELEMETRY_DISABLED ??= "1";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@mastra/core", "ollama-ai-provider-v2"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
