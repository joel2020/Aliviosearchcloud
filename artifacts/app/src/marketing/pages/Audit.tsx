import { useState } from "react";
import { useLocation } from "wouter";
import { MarketingLayout } from "../components/MarketingLayout";
import { useSeo } from "@/marketing/lib/useSeo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRequestAudit } from "@workspace/api-client-react";
import {
  Sparkles,
  Mail,
  ShieldCheck,
  Clock,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RESPONSE_TIMES = [
  "Under 5 minutes",
  "Within an hour",
  "Same day",
  "Next business day",
  "We miss most leads",
] as const;

const CHANNELS = [
  "Webform",
  "Phone calls",
  "Email",
  "Live chat",
  "Paid ads",
  "Referrals",
  "Mixed",
] as const;

export default function Audit() {
  useSeo({
    title: "Free AI Revenue Leak Audit",
    description:
      "Get a custom AI-generated PDF audit of your business — top revenue leaks, monthly $ impact, and the fixes — emailed to you within an hour. Free, no credit card.",
    path: "/audit",
  });

  const [, setLocation] = useLocation();

  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [industry, setIndustry] = useState("");
  const [monthlyLeads, setMonthlyLeads] = useState("");
  const [averageDealValue, setAverageDealValue] = useState("");
  const [currentResponseTime, setCurrentResponseTime] = useState<string>("");
  const [mainChannel, setMainChannel] = useState<string>("");
  const [biggestPain, setBiggestPain] = useState("");
  const [touched, setTouched] = useState(false);

  const submit = useRequestAudit();

  const trimmedEmail = leadEmail.trim();
  const emailValid = EMAIL_RE.test(trimmedEmail);
  const formValid =
    leadName.trim().length > 0 &&
    emailValid &&
    businessName.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!formValid || submit.isPending) return;

    submit.mutate(
      {
        data: {
          leadName: leadName.trim(),
          leadEmail: trimmedEmail,
          businessName: businessName.trim(),
          websiteUrl: websiteUrl.trim() || null,
          phone: phone.trim() || null,
          industry: industry.trim() || null,
          monthlyLeads: monthlyLeads ? Number(monthlyLeads) : null,
          averageDealValue: averageDealValue ? Number(averageDealValue) : null,
          currentResponseTime: currentResponseTime || null,
          mainChannel: mainChannel || null,
          biggestPain: biggestPain.trim() || null,
          utmSource: new URLSearchParams(window.location.search).get("utm_source") || null,
          utmCampaign: new URLSearchParams(window.location.search).get("utm_campaign") || null,
        },
      },
      {
        onSuccess: (res) => {
          setLocation(res.viewUrl);
        },
      },
    );
  };

  return (
    <MarketingLayout>
      <section className="px-6 pt-24 pb-24 md:pt-32">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground mb-6">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Free · AI-generated · No credit card
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Find the revenue leaking out of your business.
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tell us a few things about your funnel. Our AI auditor will return a branded PDF — top leaks, the dollars they're costing you each month, and the exact fixes — in your inbox within an hour.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-10 items-start">
            <aside className="lg:col-span-2 space-y-6">
              <FeatureCard
                icon={<Clock className="h-5 w-5 text-primary" />}
                title="Delivered in under an hour"
                body="Most audits land in inboxes in under 2 minutes. The 1-hour window is our guarantee."
              />
              <FeatureCard
                icon={<Mail className="h-5 w-5 text-primary" />}
                title="Branded PDF + on-page view"
                body="You get a downloadable Alivio-branded PDF and a private link you can share with your team."
              />
              <FeatureCard
                icon={<ShieldCheck className="h-5 w-5 text-primary" />}
                title="No spam, ever"
                body="One audit email + one short follow-up. We don't sell, share, or trickle-feed your data."
              />
            </aside>

            <form
              onSubmit={handleSubmit}
              className="lg:col-span-3 space-y-5 rounded-2xl border border-border bg-card p-6 md:p-8"
              data-testid="audit-form"
              noValidate
            >
              <Field label="Your name" required>
                <Input
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="Jane Doe"
                  autoComplete="name"
                  data-testid="audit-input-name"
                  aria-invalid={touched && !leadName.trim() ? true : undefined}
                />
              </Field>

              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Work email" required>
                  <Input
                    type="email"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    placeholder="jane@company.com"
                    autoComplete="email"
                    data-testid="audit-input-email"
                    aria-invalid={touched && !emailValid ? true : undefined}
                  />
                </Field>
                <Field label="Phone (optional)">
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555 123 4567"
                    autoComplete="tel"
                    data-testid="audit-input-phone"
                  />
                </Field>
              </div>

              <Field label="Business name" required>
                <Input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Acme Plumbing"
                  data-testid="audit-input-business"
                  aria-invalid={touched && !businessName.trim() ? true : undefined}
                />
              </Field>

              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Website (optional)">
                  <Input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://acmeplumbing.com"
                    data-testid="audit-input-website"
                  />
                </Field>
                <Field label="Industry">
                  <Input
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="Plumbing & HVAC"
                    data-testid="audit-input-industry"
                  />
                </Field>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Monthly leads (rough)">
                  <Input
                    type="number"
                    min={0}
                    value={monthlyLeads}
                    onChange={(e) => setMonthlyLeads(e.target.value)}
                    placeholder="120"
                    data-testid="audit-input-monthly-leads"
                  />
                </Field>
                <Field label="Avg deal value (USD)">
                  <Input
                    type="number"
                    min={0}
                    value={averageDealValue}
                    onChange={(e) => setAverageDealValue(e.target.value)}
                    placeholder="1500"
                    data-testid="audit-input-deal-value"
                  />
                </Field>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Current response time">
                  <Select
                    value={currentResponseTime}
                    onValueChange={setCurrentResponseTime}
                  >
                    <SelectTrigger data-testid="audit-select-response-time">
                      <SelectValue placeholder="How fast do you reply?" />
                    </SelectTrigger>
                    <SelectContent>
                      {RESPONSE_TIMES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Main lead channel">
                  <Select value={mainChannel} onValueChange={setMainChannel}>
                    <SelectTrigger data-testid="audit-select-channel">
                      <SelectValue placeholder="Where do leads come from?" />
                    </SelectTrigger>
                    <SelectContent>
                      {CHANNELS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field label="What's the biggest revenue problem you see right now?">
                <Textarea
                  value={biggestPain}
                  onChange={(e) => setBiggestPain(e.target.value)}
                  placeholder="e.g. We miss 40% of inbound calls during peak hours, and the ones we catch take 24h to follow up on."
                  rows={4}
                  data-testid="audit-input-pain"
                />
              </Field>

              {submit.isError && (
                <div
                  className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
                  role="alert"
                  data-testid="audit-error"
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    Couldn't submit — please double-check your details and try
                    again. If it keeps failing, email us at hello@aliviosearch.com.
                  </span>
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={submit.isPending || (touched && !formValid)}
                data-testid="audit-submit"
              >
                {submit.isPending ? (
                  <>Generating your audit…</>
                ) : (
                  <>
                    Run my free audit <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                By submitting you agree to receive your audit by email. We never
                share your details.
              </p>
            </form>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-primary"> *</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="rounded-lg bg-primary/10 p-2">{icon}</div>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
