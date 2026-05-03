import { useEffect } from "react";
import { Link, Redirect } from "wouter";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import { MarketingLayout } from "../components/MarketingLayout";
import { useSeo } from "@/marketing/lib/useSeo";
import { CTAButton } from "@/components/CTAButton";
import { Badge } from "@/components/ui/badge";
import { BlogMarkdown } from "@/marketing/blog/BlogMarkdown";
import { NewsletterSignup } from "../components/NewsletterSignup";
import {
  getPostBySlug,
  getSiblingPosts,
} from "@/marketing/blog/loader";
import { basePath } from "@/lib/clerkAppearance";
import type { BlogPost } from "@/marketing/blog/types";

const STRUCTURED_DATA_SCRIPT_ID = "blog-jsonld";

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function injectJsonLd(post: BlogPost, canonical: string, ogImage: string) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    image: ogImage,
    url: canonical,
    author: { "@type": "Organization", name: post.author },
    publisher: {
      "@type": "Organization",
      name: "Alivio Search Cloud",
      logo: {
        "@type": "ImageObject",
        url: `${
          typeof window !== "undefined" ? window.location.origin : ""
        }${basePath}/logo.svg`,
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    keywords: post.tags.join(", "),
    articleSection: post.category,
  };
  let el = document.getElementById(
    STRUCTURED_DATA_SCRIPT_ID,
  ) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.id = STRUCTURED_DATA_SCRIPT_ID;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function removeJsonLd() {
  const el = document.getElementById(STRUCTURED_DATA_SCRIPT_ID);
  if (el) el.remove();
}

function PostHeader({ post }: { post: BlogPost }) {
  return (
    <header className="mx-auto max-w-3xl">
      <Link
        href="/blog"
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        data-testid="blog-back-link"
      >
        <ArrowLeft className="h-4 w-4" /> All articles
      </Link>
      <Badge variant="secondary" className="mb-4 font-medium">
        {post.category}
      </Badge>
      <h1 className="mb-6 text-balance text-3xl font-bold tracking-tight md:text-5xl">
        {post.title}
      </h1>
      <p className="mb-8 text-lg text-muted-foreground">{post.description}</p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-border/60 py-4 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{post.author}</span>
        <span className="flex items-center gap-2">
          <Calendar className="h-4 w-4" aria-hidden="true" />
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
        </span>
        <span className="flex items-center gap-2">
          <Clock className="h-4 w-4" aria-hidden="true" />
          {post.readingMinutes} min read
        </span>
      </div>
    </header>
  );
}

function FooterCta() {
  return (
    <section
      className="border-t border-border/40 bg-card/30 px-6 py-20"
      aria-labelledby="post-cta-heading"
    >
      <div className="mx-auto max-w-3xl text-center">
        <h2
          id="post-cta-heading"
          className="mb-4 text-3xl font-bold tracking-tight md:text-4xl"
        >
          Ready to plug your revenue leaks?
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
          The free Revenue Audit pinpoints exactly where leads, calls, and
          quotes are slipping past your business — and which AI agents would
          recover them fastest.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <CTAButton
            cta="audit"
            size="lg"
            className="h-12 px-8 text-base font-bold"
            data-testid="cta-audit-post-footer"
          />
          <CTAButton
            cta="book-call"
            size="lg"
            variant="outline"
            className="h-12 px-8 text-base font-bold"
            data-testid="cta-book-call-post-footer"
          />
        </div>
      </div>
    </section>
  );
}

function SiblingPosts({ siblings }: { siblings: readonly BlogPost[] }) {
  if (siblings.length === 0) return null;
  return (
    <aside
      className="border-t border-border/40 px-6 py-16"
      aria-labelledby="related-posts-heading"
    >
      <div className="mx-auto max-w-5xl">
        <h2
          id="related-posts-heading"
          className="mb-8 text-2xl font-bold tracking-tight"
        >
          Keep reading
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {siblings.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-2xl border border-border bg-background p-6 transition-colors hover:border-primary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              data-testid={`related-post-${post.slug}`}
            >
              <Badge variant="secondary" className="mb-3">
                {post.category}
              </Badge>
              <h3 className="mb-2 text-lg font-semibold tracking-tight transition-colors group-hover:text-primary">
                {post.title}
              </h3>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {post.excerpt}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}

export default function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = getPostBySlug(params.slug);
  // Always call hooks in the same order — useSeo runs even for the
  // not-found case so the meta updates are consistent.
  useSeo({
    title: post ? post.title : "Article not found",
    description: post
      ? post.description
      : "The article you're looking for could not be found.",
    path: `/blog/${params.slug}`,
    ogImage: post?.ogImage,
  });

  useEffect(() => {
    if (!post) {
      removeJsonLd();
      return;
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const canonical = `${origin}${basePath}/blog/${post.slug}`;
    const ogImage = post.ogImage.startsWith("http")
      ? post.ogImage
      : `${origin}${basePath}${post.ogImage}`;
    injectJsonLd(post, canonical, ogImage);
    return () => removeJsonLd();
  }, [post]);

  if (!post) {
    return <Redirect to="/blog" />;
  }

  const siblings = getSiblingPosts(post.slug, 3);

  return (
    <MarketingLayout>
      <article className="px-6 pt-20 pb-16 md:pt-28">
        <PostHeader post={post} />
        <div className="mx-auto mt-12 max-w-3xl">
          <BlogMarkdown>{post.body}</BlogMarkdown>
        </div>
      </article>
      <section
        className="border-t border-border/40 px-6 py-16"
        aria-labelledby="post-newsletter-heading"
      >
        <h2 id="post-newsletter-heading" className="sr-only">
          Subscribe to the Revenue Engine newsletter
        </h2>
        <NewsletterSignup
          source="blog-post-footer"
          testIdPrefix="newsletter-post-footer"
        />
      </section>
      <SiblingPosts siblings={siblings} />
      <FooterCta />
    </MarketingLayout>
  );
}
