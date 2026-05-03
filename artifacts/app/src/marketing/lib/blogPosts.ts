/**
 * Marketing blog posts shown in the homepage preview block.
 *
 * Empty by design until the dedicated blog task lands. The marketing
 * homepage gracefully renders an empty state when this is empty and
 * a 3-card preview when posts are present.
 */

export type MarketingBlogPost = {
  readonly slug: string;
  readonly title: string;
  readonly excerpt: string;
  readonly publishedAt: string;
  readonly readingMinutes: number;
};

export const MARKETING_BLOG_POSTS: readonly MarketingBlogPost[] = [];

export function latestPosts(limit = 3): readonly MarketingBlogPost[] {
  return [...MARKETING_BLOG_POSTS]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit);
}
