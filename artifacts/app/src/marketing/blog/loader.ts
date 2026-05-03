import { parseMarkdown } from "./frontmatter";
import { blogFrontmatterSchema, type BlogPost } from "./types";

/**
 * Load every markdown file under content/blog/ at build time via Vite's
 * `import.meta.glob`. Frontmatter is validated with Zod; invalid posts
 * throw immediately so we can't ship a broken article.
 */
const RAW_POSTS = import.meta.glob<string>(
  "../../../content/blog/*.md",
  { query: "?raw", import: "default", eager: true },
);

const WORDS_PER_MINUTE = 220;

function calculateReadingMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

function deriveExcerpt(body: string, fallback: string): string {
  const paragraph = body
    .split(/\r?\n\r?\n/)
    .map((p) => p.trim())
    .find((p) => p.length > 0 && !p.startsWith("#"));
  if (!paragraph) return fallback;
  // Strip simple markdown markers for a clean excerpt.
  const stripped = paragraph
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  return stripped.length > 220 ? `${stripped.slice(0, 217).trimEnd()}…` : stripped;
}

function loadAllPosts(): BlogPost[] {
  const posts: BlogPost[] = [];
  for (const [path, raw] of Object.entries(RAW_POSTS)) {
    const { data, body } = parseMarkdown(raw);
    const result = blogFrontmatterSchema.safeParse(data);
    if (!result.success) {
      throw new Error(
        `Invalid blog frontmatter in ${path}: ${result.error.message}`,
      );
    }
    posts.push({
      ...result.data,
      body: body.trim(),
      readingMinutes: calculateReadingMinutes(body),
      excerpt: deriveExcerpt(body, result.data.description),
    });
  }
  // Fail loudly if two articles share a slug.
  const seen = new Set<string>();
  for (const post of posts) {
    if (seen.has(post.slug)) {
      throw new Error(`Duplicate blog slug: ${post.slug}`);
    }
    seen.add(post.slug);
  }
  // Newest first.
  posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return posts;
}

export const ALL_BLOG_POSTS: readonly BlogPost[] = Object.freeze(loadAllPosts());

export function getPostBySlug(slug: string): BlogPost | undefined {
  return ALL_BLOG_POSTS.find((p) => p.slug === slug);
}

export function latestBlogPosts(limit = 3): readonly BlogPost[] {
  return ALL_BLOG_POSTS.slice(0, limit);
}

export function getAllCategories(): readonly string[] {
  const set = new Set<string>();
  for (const p of ALL_BLOG_POSTS) set.add(p.category);
  return [...set].sort((a, b) => a.localeCompare(b));
}

/**
 * Sibling posts: same category first, then fall back to most recent
 * (excluding the current one). Always returns up to `limit` items.
 */
export function getSiblingPosts(slug: string, limit = 2): readonly BlogPost[] {
  const current = getPostBySlug(slug);
  if (!current) return [];
  const siblings = ALL_BLOG_POSTS.filter(
    (p) => p.slug !== slug && p.category === current.category,
  );
  for (const post of ALL_BLOG_POSTS) {
    if (siblings.length >= limit) break;
    if (post.slug === slug) continue;
    if (!siblings.includes(post)) siblings.push(post);
  }
  return siblings.slice(0, limit);
}
