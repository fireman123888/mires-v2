import type { MetadataRoute } from "next";

// Replaces the Cloudflare-managed default /robots.txt with a Next.js-served
// one that explicitly tells crawlers (a) the site is open for indexing,
// (b) which paths to skip (auth + admin + api), and (c) where the sitemap is.
//
// Cloudflare's "AI Content Signals" header is left to be appended at the
// edge by CF — we don't try to fight that here.

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") || "https://mires.top";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/account/",
          "/signin",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/_next/",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
