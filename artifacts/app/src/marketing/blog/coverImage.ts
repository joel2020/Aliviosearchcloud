import type { BlogPost } from "./types";

const RESPONSIVE_WIDTHS = [480, 800, 1200] as const;

export type CoverImage = {
  src: string;
  srcSet?: string;
  sizes?: string;
};

/**
 * Resolve the cover image for a blog post into a `<img>`-friendly shape.
 *
 * Articles that ship with a generated `/blog/<slug>.webp` get a responsive
 * srcset built from the pre-generated 480/800/1200-wide variants. Anything
 * else (e.g. the legacy `/opengraph.jpg` fallback) renders as a single src.
 */
export function getCoverImage(
  post: Pick<BlogPost, "ogImage" | "slug">,
  sizes = "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw",
): CoverImage {
  const og = post.ogImage;
  const match = og.match(/^(\/blog\/[a-z0-9-]+)\.webp$/i);
  if (!match) return { src: og };
  const base = match[1];
  const srcSet = RESPONSIVE_WIDTHS.map((w) => `${base}-${w}.webp ${w}w`).join(
    ", ",
  );
  return { src: `${base}-1200.webp`, srcSet, sizes };
}
