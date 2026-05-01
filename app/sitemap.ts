import type { MetadataRoute } from "next";

// Auto-generated /sitemap.xml. List every public route Google should crawl.
// Excludes: /signin, /signup, /forgot-password, /reset-password (auth flows),
// /admin/*, /account/*, /api/*.
//
// Adjust priority/changeFrequency to hint Google about importance — the
// homepage and high-value tool pages get priority 0.9-1.0, secondary pages
// get 0.7. Keep priorities meaningful (not all 1.0) so Google trusts them.

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") || "https://mires.top";

const PUBLIC_ROUTES: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}> = [
  { path: "/", priority: 1.0, changeFrequency: "daily" },
  { path: "/pricing", priority: 0.8, changeFrequency: "weekly" },
  { path: "/editor", priority: 0.9, changeFrequency: "weekly" },
  { path: "/tools", priority: 0.8, changeFrequency: "weekly" },
  { path: "/icon", priority: 0.8, changeFrequency: "weekly" },
  { path: "/style", priority: 0.8, changeFrequency: "weekly" },
  { path: "/crop", priority: 0.7, changeFrequency: "weekly" },
  { path: "/erase", priority: 0.7, changeFrequency: "weekly" },
  { path: "/optimizer", priority: 0.7, changeFrequency: "weekly" },
  { path: "/video", priority: 0.7, changeFrequency: "weekly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return PUBLIC_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
