import { MarketingLayout } from "../components/MarketingLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSeo } from "@/marketing/lib/useSeo";
import { CTAButton } from "@/components/CTAButton";
import { Phone, Mail, MessageSquare, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useSubmitContact } from "@workspace/api-client-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Channel = "email" | "sms" | "whatsapp";

export default function Contact() {
  useSeo({
    title: "Contact Us",
    description: "Get in touch with the Alivio team to discuss your AI Revenue Engine.",
    path: "/contact",
  });

  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState<Channel>("email");
  const [message, setMessage] = useState("");
  const [touched, setTouched] = useState(false);

  const submit = useSubmitContact();
  const submitted = submit.isSuccess;

  const trimmedEmail = email.trim();
  const emailValid = EMAIL_RE.test(trimmedEmail);
  const formValid =
    name.trim().length > 0 && emailValid && message.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!formValid || submit.isPending) return;
    submit.mutate({
      data: {
        name: name.trim(),
        businessName: businessName.trim() || null,
        email: trimmedEmail,
        phone: phone.trim() || null,
        preferredChannel: channel,
        message: message.trim(),
        source: "contact-page",
      },
    });
  };

  const reset = () => {
    submit.reset();
    setName("");
    setBusinessName("");
    setEmail("");
    setPhone("");
    setChannel("email");
    setMessage("");
    setTouched(false);
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
                <CTAButton
                  cta="book-call"
                  variant="outline"
                  className="w-full"
                  data-testid="cta-book-call-contact"
                />
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
                <div className="text-center py-16" data-testid="contact-success">
                  <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-6" />
                  <h3 className="text-2xl font-bold mb-4">Message received.</h3>
                  <p className="text-muted-foreground mb-8">We'll get back to you within one business day.</p>
                  <Button variant="outline" onClick={reset}>Send another message</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6" noValidate data-testid="contact-form">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">Name</label>
                      <Input
                        id="name"
                        required
                        className="bg-background"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={submit.isPending}
                        data-testid="input-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="business" className="text-sm font-medium">Business Name</label>
                      <Input
                        id="business"
                        className="bg-background"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        disabled={submit.isPending}
                        data-testid="input-business"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">Email</label>
                      <Input
                        id="email"
                        type="email"
                        required
                        className="bg-background"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => setTouched(true)}
                        disabled={submit.isPending}
                        aria-invalid={touched && !emailValid ? "true" : "false"}
                        data-testid="input-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-sm font-medium">Phone (Optional)</label>
                      <Input
                        id="phone"
                        type="tel"
                        className="bg-background"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={submit.isPending}
                        data-testid="input-phone"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="channel" className="text-sm font-medium">Preferred Contact Channel</label>
                    <select
                      id="channel"
                      value={channel}
                      onChange={(e) => setChannel(e.target.value as Channel)}
                      disabled={submit.isPending}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      data-testid="select-channel"
                    >
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium">Message</label>
                    <Textarea
                      id="message"
                      required
                      rows={5}
                      className="bg-background resize-none"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      disabled={submit.isPending}
                      data-testid="input-message"
                    />
                  </div>

                  {touched && !formValid ? (
                    <p className="inline-flex items-center gap-1.5 text-sm text-destructive" role="alert">
                      <AlertCircle className="h-4 w-4" aria-hidden="true" />
                      Please fill in your name, a valid email, and a message.
                    </p>
                  ) : null}

                  {submit.isError ? (
                    <p className="inline-flex items-center gap-1.5 text-sm text-destructive" role="alert" data-testid="contact-error">
                      <AlertCircle className="h-4 w-4" aria-hidden="true" />
                      Couldn't send your message. Please try again, or email hello@aliviosearch.cloud.
                    </p>
                  ) : null}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={submit.isPending}
                    data-testid="submit-contact"
                  >
                    {submit.isPending ? "Sending…" : "Send Message"}
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
