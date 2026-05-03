import { promises as fs } from "node:fs";
import path from "node:path";
import type { Plugin, ViteDevServer } from "vite";

/**
 * Vite plugin that generates the public RSS feed and the sitemap from the
 * markdown files under `content/blog/`. Runs as middleware in dev (so the
 * URLs are live without rebuilding) and writes static files into the build
 * output for production.
 *
 * The blog loader on the client side uses Vite's `import.meta.glob`. This
 * plugin re-reads the same files on the Node side so the published feed
 * never drifts from what the SPA shows.
 */

type BlogMeta = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  category: string;
};

const FRONTMATTER_BLOCK = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function stripQuotes(raw: string): string {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseFrontmatter(source: string): Record<string, string> {
  const match = FRONTMATTER_BLOCK.exec(source);
  if (!match) return {};
  const data: Record<string, string> = {};
  for (const rawLine of (match[1] ?? "").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!key) continue;
    // Skip arrays for the feed — we only need scalar fields.
    if (value.startsWith("[")) continue;
    data[key] = stripQuotes(value);
  }
  return data;
}

async function readPosts(contentDir: string): Promise<BlogMeta[]> {
  const entries = await fs.readdir(contentDir).catch(() => [] as string[]);
  const posts: BlogMeta[] = [];
  for (const name of entries) {
    if (!name.endsWith(".md")) continue;
    const raw = await fs.readFile(path.join(contentDir, name), "utf8");
    const fm = parseFrontmatter(raw);
    if (!fm.slug || !fm.title || !fm.publishedAt) continue;
    posts.push({
      slug: fm.slug,
      title: fm.title,
      description: fm.description ?? "",
      publishedAt: fm.publishedAt,
      category: fm.category ?? "",
    });
  }
  posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return posts;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildRss(posts: BlogMeta[], siteUrl: string): string {
  const lastBuild = new Date().toUTCString();
  const items = posts
    .map((p) => {
      const url = `${siteUrl}/blog/${p.slug}`;
      const pubDate = new Date(`${p.publishedAt}T12:00:00Z`).toUTCString();
      return [
        "    <item>",
        `      <title>${escapeXml(p.title)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
        `      <pubDate>${pubDate}</pubDate>`,
        `      <category>${escapeXml(p.category)}</category>`,
        `      <description>${escapeXml(p.description)}</description>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    "    <title>Alivio Search Cloud — Revenue Engine Blog</title>",
    `    <link>${escapeXml(siteUrl)}/blog</link>`,
    "    <description>Playbooks on revenue recovery, lead follow-up, outbound sales, and AI agents for small business.</description>",
    "    <language>en-us</language>",
    `    <lastBuildDate>${lastBuild}</lastBuildDate>`,
    `    <atom:link href="${escapeXml(siteUrl)}/blog/rss.xml" rel="self" type="application/rss+xml" />`,
    items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}

function buildSitemap(posts: BlogMeta[], siteUrl: string): string {
  const staticUrls = [
    { loc: "/", changefreq: "weekly", priority: "1.0" },
    { loc: "/pricing", changefreq: "monthly", priority: "0.9" },
    { loc: "/agents", changefreq: "monthly", priority: "0.9" },
    { loc: "/about", changefreq: "monthly", priority: "0.6" },
    { loc: "/contact", changefreq: "monthly", priority: "0.6" },
    { loc: "/blog", changefreq: "weekly", priority: "0.8" },
  ];
  const blogUrls = posts.map((p) => ({
    loc: `/blog/${p.slug}`,
    lastmod: p.publishedAt,
    changefreq: "monthly",
    priority: "0.7",
  }));
  const all = [
    ...staticUrls.map((u) => ({ ...u, lastmod: undefined as string | undefined })),
    ...blogUrls,
  ];
  const body = all
    .map((u) =>
      [
        "  <url>",
        `    <loc>${escapeXml(siteUrl)}${u.loc}</loc>`,
        u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>` : null,
        `    <changefreq>${u.changefreq}</changefreq>`,
        `    <priority>${u.priority}</priority>`,
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n");
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    body,
    "</urlset>",
    "",
  ].join("\n");
}

export type BlogFeedsPluginOptions = {
  /** Absolute path to the directory containing markdown posts. */
  contentDir: string;
  /** Public site origin used for absolute URLs (no trailing slash). */
  siteUrl: string;
  /** Output directory for the production build. */
  outDir: string;
  /**
   * Base path the artifact is mounted at, e.g. `/` or `/portal/`.
   * Used both for matching dev/preview middleware requests and for
   * building absolute URLs in RSS + sitemap so subpath deployments
   * stay consistent.
   */
  basePath?: string;
};

function normalizeBasePath(raw: string | undefined): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "/") return "";
  const withLeading = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeading.endsWith("/") ? withLeading.slice(0, -1) : withLeading;
}

export function blogFeedsPlugin(options: BlogFeedsPluginOptions): Plugin {
  const { contentDir, siteUrl, outDir } = options;
  const basePath = normalizeBasePath(options.basePath);
  const rssRoute = `${basePath}/blog/rss.xml`;
  const sitemapRoute = `${basePath}/sitemap.xml`;
  const urlPrefix = `${siteUrl}${basePath}`;

  function matches(reqUrl: string, route: string): boolean {
    return (
      reqUrl === route ||
      reqUrl.startsWith(`${route}?`) ||
      reqUrl.startsWith(`${route}#`)
    );
  }

  function attachMiddleware(server: ViteDevServer) {
    server.middlewares.use(async (req, res, next) => {
      const url = req.url ?? "";
      const isRss = matches(url, rssRoute);
      const isSitemap = matches(url, sitemapRoute);
      if (!isRss && !isSitemap) return next();
      try {
        const posts = await readPosts(contentDir);
        const body = isRss
          ? buildRss(posts, urlPrefix)
          : buildSitemap(posts, urlPrefix);
        res.setHeader("Content-Type", "application/xml; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache");
        res.end(body);
      } catch (err) {
        next(err as Error);
      }
    });
  }

  return {
    name: "alivio:blog-feeds",
    configureServer(server) {
      attachMiddleware(server);
    },
    configurePreviewServer(server) {
      attachMiddleware(server as unknown as ViteDevServer);
    },
    async closeBundle() {
      const posts = await readPosts(contentDir);
      const rss = buildRss(posts, urlPrefix);
      const sitemap = buildSitemap(posts, urlPrefix);
      await fs.mkdir(path.join(outDir, "blog"), { recursive: true });
      await fs.writeFile(path.join(outDir, "blog", "rss.xml"), rss, "utf8");
      // Overwrite the static sitemap.xml that public/ copies, so blog
      // URLs are always present.
      await fs.writeFile(path.join(outDir, "sitemap.xml"), sitemap, "utf8");
    },
  };
}
