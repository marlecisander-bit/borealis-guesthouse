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
    // Preview images load directly from the exact CSP object allowlist; the
    // unrestricted optimizer route remains blocked. Normal production is unchanged.
    unoptimized: process.env.BOREALIS_READONLY_PREVIEW === "1" && process.env.NEXT_PUBLIC_BOREALIS_READONLY_PREVIEW === "1",
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
