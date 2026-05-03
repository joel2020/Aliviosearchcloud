import { type ComponentProps } from "react";
import { Link } from "wouter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type AnchorProps = ComponentProps<"a">;

function isInternalHref(href: string | undefined): href is string {
  return !!href && href.startsWith("/") && !href.startsWith("//");
}

/**
 * Markdown renderer for blog post bodies.
 *
 * Internal links (starting with `/`) become wouter `<Link>` so navigation
 * stays inside the SPA. External links open in a new tab with proper
 * rel attributes. Tailwind Typography handles the prose styling.
 */
export function BlogMarkdown({ children }: { children: string }) {
  return (
    <div className="prose prose-invert dark:prose-invert max-w-none prose-headings:tracking-tight prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-primary prose-blockquote:text-foreground prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none">
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
    </div>
  );
}
