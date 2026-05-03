import { MarketingLayout } from "../components/MarketingLayout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSeo } from "@/marketing/lib/useSeo";
import { CTA_BOOK_CALL } from "@/marketing/lib/ctas";
import { Phone, Mail, MessageSquare, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function Contact() {
  useSeo({
    title: "Contact Us | Alivio Search Cloud",
    description: "Get in touch with the Alivio team to discuss your AI Revenue Engine.",
    path: "/contact",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted");
    setSubmitted(true);
  };

  return (
    <MarketingLayout>
      <section className="px-6 pt-24 pb-24 md:pt-32">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Get in touch</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you need technical support, sales inquiries, or just want to chat about revenue automation.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-12 items-start">
            <div className="lg:col-span-2 space-y-8">
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Phone className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-semibold">Sales</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Discuss custom implementations and high-volume needs.</p>
                <Link href={CTA_BOOK_CALL.href}>
                  <Button variant="outline" className="w-full">{CTA_BOOK_CALL.label}</Button>
                </Link>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                    <Mail className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-semibold">Support</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Current customers needing technical assistance.</p>
                <a href="mailto:hello@aliviosearch.cloud" className="text-sm font-medium hover:text-accent transition-colors">
                  hello@aliviosearch.cloud
                </a>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-chart-3/10 text-chart-3 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-semibold">WhatsApp</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-2">Talk to our automated assistant directly.</p>
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
                  Coming soon — Twilio integration pending
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 rounded-2xl border border-border/50 bg-card/50 p-8 md:p-10 backdrop-blur-sm">
              {submitted ? (
                <div className="text-center py-16">
                  <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-6" />
                  <h3 className="text-2xl font-bold mb-4">Message received.</h3>
                  <p className="text-muted-foreground mb-8">We'll get back to you shortly. Our agents are already on it.</p>
                  <Button variant="outline" onClick={() => setSubmitted(false)}>Send another message</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">Name</label>
                      <Input id="name" required className="bg-background" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="business" className="text-sm font-medium">Business Name</label>
                      <Input id="business" required className="bg-background" />
                    </div>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">Email</label>
                      <Input id="email" type="email" required className="bg-background" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-sm font-medium">Phone (Optional)</label>
                      <Input id="phone" type="tel" className="bg-background" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="channel" className="text-sm font-medium">Preferred Contact Channel</label>
                    <select id="channel" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                      <option value="web">Email</option>
                      <option value="sms">SMS</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium">Message</label>
                    <Textarea id="message" required rows={5} className="bg-background resize-none" />
                  </div>

                  <Button type="submit" size="lg" className="w-full">
                    Send Message
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
