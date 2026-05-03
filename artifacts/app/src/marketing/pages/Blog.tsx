import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Search } from "lucide-react";
import { MarketingLayout } from "../components/MarketingLayout";
import { useSeo } from "@/marketing/lib/useSeo";
import { CTAButton } from "@/components/CTAButton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ALL_BLOG_POSTS,
  getAllCategories,
} from "@/marketing/blog/loader";
import type { BlogPost } from "@/marketing/blog/types";

const ALL_CATEGORIES = "All";

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background transition-colors hover:border-primary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      data-testid={`blog-card-${post.slug}`}
    >
      <div className="flex-1 p-6">
        <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="font-medium">
            {post.category}
          </Badge>
          <span>·</span>
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          <span>·</span>
          <span>{post.readingMinutes} min read</span>
        </div>
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
          {post.title}
        </h2>
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {post.excerpt}
        </p>
      </div>
      <div className="border-t border-border/40 px-6 py-4 text-sm font-medium text-primary">
        Read article →
      </div>
    </Link>
  );
}

export default function Blog() {
  useSeo({
    title: "Blog · Revenue, Lead Follow-Up & AI Operations",
    description:
      "Practical playbooks on recovering missed revenue, capturing every lead, and scaling small businesses with an AI Revenue Engine.",
    path: "/blog",
  });

  const categories = useMemo(
    () => [ALL_CATEGORIES, ...getAllCategories()],
    [],
  );
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORIES);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return ALL_BLOG_POSTS.filter((post) => {
      const categoryMatch =
        activeCategory === ALL_CATEGORIES || post.category === activeCategory;
      if (!categoryMatch) return false;
      if (!needle) return true;
      const haystack = `${post.title} ${post.description} ${post.tags.join(" ")} ${post.category}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [activeCategory, query]);

  return (
    <MarketingLayout>
      {/* Hero + top CTA */}
      <section className="px-6 pt-24 pb-12 md:pt-32">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-wider text-primary">
            The Revenue Engine Blog
          </p>
          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
            Playbooks for capturing every lead and scaling revenue
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
            Real tactics on missed-call recovery, speed-to-lead automation,
            outbound sales, and the AI agents that power Alivio.
          </p>
          <CTAButton
            cta="audit"
            size="lg"
            className="h-14 px-8 text-base font-bold shadow-xl"
            data-testid="cta-audit-blog-top"
          />
        </div>
      </section>

      {/* Filter bar */}
      <section className="px-6 pb-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div
              role="group"
              aria-label="Filter posts by category"
              className="flex flex-wrap gap-2"
            >
              {categories.map((cat) => {
                const active = cat === activeCategory;
                return (
                  <button
                    key={cat}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setActiveCategory(cat)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    }`}
                    data-testid={`blog-chip-${cat.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
            <div className="relative w-full md:w-72">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search articles…"
                aria-label="Search blog posts"
                className="pl-9"
                data-testid="blog-search"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-7xl">
          {filtered.length === 0 ? (
            <div className="mx-auto max-w-md rounded-2xl border border-border bg-card/40 p-10 text-center">
              <h3 className="mb-2 text-lg font-semibold">No matching articles</h3>
              <p className="text-sm text-muted-foreground">
                Try a different search term or category.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-border/40 bg-card/30 px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            See what revenue you're actually losing
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
            The free Revenue Audit shows how many leads slip past your business
            every month — and exactly which AI agents would close the gap.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <CTAButton
              cta="audit"
              size="lg"
              className="h-12 px-8 text-base font-bold"
              data-testid="cta-audit-blog-bottom"
            />
            <CTAButton
              cta="book-call"
              size="lg"
              variant="outline"
              className="h-12 px-8 text-base font-bold"
              data-testid="cta-book-call-blog-bottom"
            />
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
