import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  turbopack: {
    root: process.cwd(),
  },
  images: {
    qualities: [75, 93], // Hero legacy images opt into 93; normal images still default to 75.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      ...(supabaseHostname
        ? [{ protocol: "https" as const, hostname: supabaseHostname, pathname: "/storage/v1/object/public/public-media/**" }]
        : []),
    ],
  },
};

export default nextConfig;
