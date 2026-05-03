import { Fragment, type ComponentProps, type ReactNode } from "react";
import { Link } from "wouter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { RevenueLeakCalculator } from "@/marketing/components/RevenueLeakCalculator";

type AnchorProps = ComponentProps<"a">;

function isInternalHref(href: string | undefined): href is string {
  return !!href && href.startsWith("/") && !href.startsWith("//");
}

/**
 * Custom inline components that can be embedded inside a markdown blog
 * post via a `:::component-name:::` directive on its own line. Each entry
 * receives the slug of the post it's rendering inside so test ids and
 * analytics events stay distinguishable.
 */
const INLINE_COMPONENTS: Record<
  string,
  (slug: string, index: number) => ReactNode
> = {
  "revenue-calculator": (slug, index) => (
    <RevenueLeakCalculator
      testIdPrefix={`revenue-calculator-${slug}-${index}`}
    />
  ),
};

const DIRECTIVE_RE = /^:::([a-z0-9-]+):::\s*$/;

type Segment =
  | { kind: "markdown"; content: string }
  | { kind: "component"; name: string; index: number };

function splitMarkdownSegments(source: string): Segment[] {
  const lines = source.split(/\r?\n/);
  const segments: Segment[] = [];
  let buffer: string[] = [];
  let componentIndex = 0;

  const flush = () => {
    if (buffer.length === 0) return;
    const content = buffer.join("\n").trim();
    if (content.length > 0) segments.push({ kind: "markdown", content });
    buffer = [];
  };

  for (const line of lines) {
    const match = line.match(DIRECTIVE_RE);
    if (match && INLINE_COMPONENTS[match[1]]) {
      flush();
      segments.push({ kind: "component", name: match[1], index: componentIndex++ });
      continue;
    }
    buffer.push(line);
  }
  flush();
  return segments;
}

function MarkdownChunk({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a({ href, children, ...rest }: AnchorProps) {
          if (isInternalHref(href)) {
            return (
              <Link href={href} className="text-primary hover:underline">
                {children}
              </Link>
            );
          }
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              {...rest}
            >
              {children}
            </a>
          );
        },
      }}
    >
      {children}
    </ReactMarkdown>
  );
}

/**
 * Markdown renderer for blog post bodies.
 *
 * Internal links (starting with `/`) become wouter `<Link>` so navigation
 * stays inside the SPA. External links open in a new tab with proper
 * rel attributes. Tailwind Typography handles the prose styling.
 *
 * Custom React components can be embedded by writing a directive on its
 * own line in the markdown, e.g. `:::revenue-calculator:::`. See
 * `INLINE_COMPONENTS` for the supported names.
 */
export function BlogMarkdown({
  children,
  slug = "post",
}: {
  children: string;
  slug?: string;
}) {
  const segments = splitMarkdownSegments(children);
  return (
    <div className="prose prose-invert dark:prose-invert max-w-none prose-headings:tracking-tight prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-primary prose-blockquote:text-foreground prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none">
      {segments.map((segment, i) => {
        if (segment.kind === "markdown") {
          return (
            <MarkdownChunk key={`md-${i}`}>{segment.content}</MarkdownChunk>
          );
        }
        const renderer = INLINE_COMPONENTS[segment.name];
        return (
          <Fragment key={`cmp-${segment.name}-${segment.index}`}>
            {renderer(slug, segment.index)}
          </Fragment>
        );
      })}
    </div>
  );
}
