/**
 * Backwards-compatible facade for the homepage blog preview block.
 *
 * The real blog data lives in `@/marketing/blog/loader` (markdown files
 * under `content/blog/` parsed with Zod-validated frontmatter). This
 * module exists so existing imports from Home.tsx keep working without
 * a churn-y rename.
 */

import { ALL_BLOG_POSTS, latestBlogPosts } from "@/marketing/blog/loader";
import type { BlogPost } from "@/marketing/blog/types";

export type MarketingBlogPost = {
  readonly slug: string;
  readonly title: string;
  readonly excerpt: string;
  readonly publishedAt: string;
  readonly readingMinutes: number;
  readonly category: string;
};

function toPreview(post: BlogPost): MarketingBlogPost {
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    publishedAt: post.publishedAt,
    readingMinutes: post.readingMinutes,
    category: post.category,
  };
}

export const MARKETING_BLOG_POSTS: readonly MarketingBlogPost[] =
  ALL_BLOG_POSTS.map(toPreview);

export function latestPosts(limit = 3): readonly MarketingBlogPost[] {
  return latestBlogPosts(limit).map(toPreview);
}
