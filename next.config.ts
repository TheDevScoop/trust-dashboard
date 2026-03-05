import type { NextConfig } from "next";

const isStaticExport = process.env.STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  ...(isStaticExport && {
    output: "export",
    basePath: "/trust-dashboard",
  }),
  images: {
    unoptimized: true,
    remotePatterns: [
      { hostname: "avatars.githubusercontent.com" },
    ],
  },
};

export default nextConfig;
