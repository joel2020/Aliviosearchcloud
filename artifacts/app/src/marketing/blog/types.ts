import { z } from "zod";

/**
 * Frontmatter schema for blog articles. Validated at module load time so
 * authoring mistakes (missing slug, bad date) blow up the build instead
 * of silently shipping a broken post.
 */
export const blogFrontmatterSchema = z.object({
  title: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be kebab-case"),
  description: z.string().min(1).max(300),
  category: z.string().min(1),
  /** ISO date string (YYYY-MM-DD). */
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tags: z.array(z.string().min(1)).default([]),
  ogImage: z.string().min(1).default("/opengraph.jpg"),
  /** Optional override for the displayed author. Defaults to the team byline. */
  author: z.string().min(1).default("The Alivio Team"),
});

export type BlogFrontmatter = z.infer<typeof blogFrontmatterSchema>;

export type BlogPost = BlogFrontmatter & {
  /** Raw markdown body (frontmatter stripped). */
  readonly body: string;
  /** Estimated reading time in minutes (≥1). */
  readonly readingMinutes: number;
  /** Convenience excerpt for listings (first paragraph or description). */
  readonly excerpt: string;
};
