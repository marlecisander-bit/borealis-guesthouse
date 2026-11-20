import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  // Public, build-time provenance for verifying the exact hosted release.
  env: {
    BOREALIS_RELEASE_SHA: process.env.COMMIT_REF || "",
    BOREALIS_DEPLOY_ID: process.env.DEPLOY_ID || "",
  },
  async headers() {
    return [{
      source: "/fonts/cormorant-garamond-ae1ccee3fa8d.woff2",
      headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    }, {
      source: "/booking/confirmation/:path*",
      headers: [
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "Cache-Control", value: "private, no-store" },
        { key: "X-Robots-Tag", value: "noindex, nofollow" },
      ],
    }, ...["/admin/:path*", "/api/admin/:path*"].map(source => ({
      source,
      headers: [
        { key: "Cache-Control", value: "private, no-store" },
        { key: "X-Robots-Tag", value: "noindex, nofollow" },
      ],
    })), {
      source: "/team/accept",
      headers: [
        { key: "Cache-Control", value: "private, no-store" },
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "X-Robots-Tag", value: "noindex, nofollow" },
      ],
    }, ...["/", "/rooms", "/gallery"].map(source => ({
      source,
      has: [{ type: "query" as const, key: "preview" }],
      headers: [
        { key: "Cache-Control", value: "private, no-store" },
        { key: "X-Robots-Tag", value: "noindex, nofollow" },
      ],
    }))];
  },
  distDir: process.env.NEXT_DIST_DIR || ".next",
  turbopack: {
    root: process.cwd(),
  },
  images: {
    // Preview images load directly from the exact CSP object allowlist; the
    // unrestricted optimizer route remains blocked. Normal production is unchanged.
    unoptimized: process.env.BOREALIS_READONLY_PREVIEW === "1" && process.env.NEXT_PUBLIC_BOREALIS_READONLY_PREVIEW === "1",
    qualities: [75, 85, 93], // Homepage photos use 85; other images default to 75.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      ...(supabaseHostname
        ? [{ protocol: "https" as const, hostname: supabaseHostname, pathname: "/storage/v1/object/public/public-media/**" }]
        : []),
    ],
  },
};

export default nextConfig;
