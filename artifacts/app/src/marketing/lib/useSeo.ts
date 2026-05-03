import { useEffect } from "react";
import { basePath } from "@/lib/clerkAppearance";

export type SeoOptions = {
  /** Page-specific title. The site name is appended automatically. */
  title: string;
  /** Page-specific meta description (150–160 chars recommended). */
  description: string;
  /** Path within the site, leading slash. e.g. "/about". */
  path: string;
  /** Optional override for the OpenGraph image. Defaults to /opengraph.jpg. */
  ogImage?: string;
  /** When true, emits `<meta name="robots" content="noindex,follow">`. Use for 404, thank-you, gated, or low-value pages. */
  noIndex?: boolean;
};

const SITE_NAME = "Alivio Search Cloud";

function setMeta(
  selector: string,
  attr: "name" | "property",
  key: string,
  value: string,
): void {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

function setLink(rel: string, href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function originSafe(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

/**
 * Per-route SEO: title, description, canonical, OpenGraph, Twitter card.
 * Safe to call from any marketing page on every render — only updates on
 * change. Falls back to static meta in `index.html` when JS hasn't run yet
 * (relevant for crawlers that don't execute JS — see sitemap.xml).
 */
export function useSeo({ title, description, path, ogImage, noIndex }: SeoOptions): void {
  useEffect(() => {
    const origin = originSafe();
    const cleanBase = basePath || "";
    const fullPath = `${cleanBase}${path}`.replace(/\/+$/, "") || "/";
    const canonical = origin ? `${origin}${fullPath}` : fullPath;
    // Always emit absolute OG image URLs — some social crawlers
    // (notably older Facebook/LinkedIn fetchers) refuse to resolve
    // relative paths.
    const rawOg = ogImage ?? "/opengraph.jpg";
    const isAbsolute = /^https?:\/\//i.test(rawOg);
    const ogPath = rawOg.startsWith("/") ? rawOg : `/${rawOg}`;
    const og = isAbsolute
      ? rawOg
      : origin
      ? `${origin}${cleanBase}${ogPath}`
      : `${cleanBase}${ogPath}`;

    const fullTitle = `${title} · ${SITE_NAME}`;
    document.title = fullTitle;

    setMeta('meta[name="description"]', "name", "description", description);
    setLink("canonical", canonical);

    setMeta('meta[property="og:title"]', "property", "og:title", fullTitle);
    setMeta(
      'meta[property="og:description"]',
      "property",
      "og:description",
      description,
    );
    setMeta('meta[property="og:url"]', "property", "og:url", canonical);
    setMeta('meta[property="og:type"]', "property", "og:type", "website");
    setMeta('meta[property="og:image"]', "property", "og:image", og);
    setMeta(
      'meta[property="og:site_name"]',
      "property",
      "og:site_name",
      SITE_NAME,
    );

    setMeta(
      'meta[name="twitter:card"]',
      "name",
      "twitter:card",
      "summary_large_image",
    );
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", fullTitle);
    setMeta(
      'meta[name="twitter:description"]',
      "name",
      "twitter:description",
      description,
    );
    setMeta('meta[name="twitter:image"]', "name", "twitter:image", og);

    setMeta(
      'meta[name="robots"]',
      "name",
      "robots",
      noIndex ? "noindex,follow" : "index,follow",
    );
  }, [title, description, path, ogImage, noIndex]);
}
