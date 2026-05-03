import { Link } from "wouter";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/40 bg-background/50 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent text-background font-bold shadow-lg">
                A
              </div>
              <span className="text-lg font-semibold tracking-tight text-foreground">Alivio</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs text-balance">
              The AI Revenue Engine that captures, converts, and scales pipeline for modern businesses.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/agents" className="hover:text-foreground transition-colors">Agents</Link></li>
              <li><Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-foreground transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
              <li>
                <a
                  href="mailto:hello@aliviosearch.cloud"
                  className="hover:text-foreground transition-colors"
                >
                  hello@aliviosearch.cloud
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col md:flex-row items-center justify-between border-t border-border/40 pt-8 text-xs text-muted-foreground gap-3">
          <p>© {new Date().getFullYear()} Alivio Search Cloud. All rights reserved.</p>
          <p className="text-center md:text-right">
            Built in NYC · Powered by 12 AI agents working 24/7
          </p>
        </div>
      </div>
    </footer>
  );
}
