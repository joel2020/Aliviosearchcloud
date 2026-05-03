import { Link } from "wouter";
import { CTAButton } from "@/components/CTAButton";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/40 bg-background/50 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
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
              <li>
                <CTAButton
                  cta="install"
                  variant="link"
                  label="Install Engine"
                  className="h-auto p-0 text-sm font-normal text-muted-foreground hover:text-foreground hover:no-underline"
                  data-testid="cta-install-footer"
                />
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-foreground transition-colors">About</Link></li>
              <li><Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
              <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><span className="hover:text-foreground transition-colors cursor-pointer">Privacy Policy</span></li>
              <li><span className="hover:text-foreground transition-colors cursor-pointer">Terms of Service</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col md:flex-row items-center justify-between border-t border-border/40 pt-8 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Alivio Search Cloud. All rights reserved.</p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <span className="cursor-pointer hover:text-foreground transition-colors">Twitter</span>
            <span className="cursor-pointer hover:text-foreground transition-colors">LinkedIn</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
