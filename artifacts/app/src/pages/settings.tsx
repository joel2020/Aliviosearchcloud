import { useState, useEffect } from "react";
import {
  useGetCurrentBusiness,
  useUpdateCurrentBusiness,
  getGetCurrentBusinessQueryKey,
  useListMessagingConnections,
  useCreateMessagingConnection,
  useVerifyMessagingConnection,
  useDeleteMessagingConnection,
  getListMessagingConnectionsQueryKey,
  useGetStatus,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageCircle, Smartphone, Trash2, Apple } from "lucide-react";

type Channel = "whatsapp" | "sms";

function MessagingSection() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: status } = useGetStatus();
  const { data: connections, isLoading } = useListMessagingConnections();

  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [label, setLabel] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [code, setCode] = useState("");

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: getListMessagingConnectionsQueryKey() });

  const create = useCreateMessagingConnection({
    mutation: {
      onSuccess: async (row) => {
        await invalidate();
        setPendingId(row.id);
        setCode("");
        toast({
          title: "Code sent",
          description: `We sent a 6-digit code to ${row.phoneNumber} via ${row.channel === "whatsapp" ? "WhatsApp" : "SMS"}.`,
        });
      },
      onError: (err) =>
        toast({
          title: "Couldn't send code",
          description: err instanceof Error ? err.message : "Unknown error",
          variant: "destructive",
        }),
    },
  });

  const verify = useVerifyMessagingConnection({
    mutation: {
      onSuccess: async () => {
        await invalidate();
        setPendingId(null);
        setCode("");
        setPhoneNumber("");
        setLabel("");
        toast({
          title: "Connected",
          description: "Your channel is verified and live.",
        });
      },
      onError: (err) =>
        toast({
          title: "Verification failed",
          description: err instanceof Error ? err.message : "Unknown error",
          variant: "destructive",
        }),
    },
  });

  const remove = useDeleteMessagingConnection({
    mutation: {
      onSuccess: async () => {
        await invalidate();
        toast({ title: "Disconnected" });
      },
      onError: (err) =>
        toast({
          title: "Couldn't disconnect",
          description: err instanceof Error ? err.message : "Unknown error",
          variant: "destructive",
        }),
    },
  });

  const messaging = status?.messaging;
  const twilioConfigured = messaging?.twilio === "configured";
  const whatsappConfigured = messaging?.whatsapp === "configured";
  const smsConfigured = messaging?.sms === "configured";

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">
          Connect WhatsApp / SMS Assistant
        </h2>
        <p className="text-sm text-muted-foreground">
          Let customers message your AI Business Assistant from their phone.
        </p>
      </div>

      {!twilioConfigured && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="pt-6 text-sm">
            <strong>Messaging not configured.</strong> Twilio credentials are
            missing on the server, so connecting a phone is disabled. Ask your
            admin to add <code>TWILIO_ACCOUNT_SID</code>,{" "}
            <code>TWILIO_AUTH_TOKEN</code>, and a sending number (
            <code>TWILIO_WHATSAPP_FROM</code> or <code>TWILIO_SMS_FROM</code>).
          </CardContent>
        </Card>
      )}

      <Card className="border-border/70 bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-4 w-4" /> Add a phone number
          </CardTitle>
          <CardDescription>
            We&rsquo;ll text you a 6-digit code to verify ownership.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {pendingId ? (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="otp">Verification code</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="123456"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() =>
                    verify.mutate({ id: pendingId, data: { code } })
                  }
                  disabled={verify.isPending || code.length !== 6}
                >
                  {verify.isPending ? "Verifying…" : "Verify"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setPendingId(null);
                    setCode("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Channel</Label>
                <Select
                  value={channel}
                  onValueChange={(v) => setChannel(v as Channel)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="whatsapp"
                      disabled={!whatsappConfigured}
                    >
                      WhatsApp{!whatsappConfigured && " — not configured"}
                    </SelectItem>
                    <SelectItem value="sms" disabled={!smsConfigured}>
                      SMS{!smsConfigured && " — not configured"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone number (E.164)</Label>
                <Input
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+14155551234"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="label">Label (optional)</Label>
                <Input
                  id="label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Owner mobile"
                />
              </div>
              <Button
                onClick={() =>
                  create.mutate({
                    data: {
                      channel,
                      phoneNumber,
                      label: label || null,
                    },
                  })
                }
                disabled={
                  create.isPending ||
                  !twilioConfigured ||
                  !phoneNumber.trim() ||
                  (channel === "whatsapp" && !whatsappConfigured) ||
                  (channel === "sms" && !smsConfigured)
                }
              >
                {create.isPending ? "Sending code…" : "Send verification code"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-base">Connected channels</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !connections || connections.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No channels connected yet.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {connections.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    {c.channel === "whatsapp" ? (
                      <MessageCircle className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Smartphone className="h-4 w-4 text-sky-500" />
                    )}
                    <div>
                      <div className="font-medium">{c.phoneNumber}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.channel === "whatsapp" ? "WhatsApp" : "SMS"}
                        {c.label ? ` · ${c.label}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.verified ? (
                      <Badge variant="secondary">Verified</Badge>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => remove.mutate({ id: c.id })}
                      disabled={remove.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Disconnect</span>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-dashed border-border/70 bg-muted/30 opacity-80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Apple className="h-4 w-4" /> iMessage
            <Badge variant="outline">Coming soon</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          WhatsApp and SMS are available first. iMessage support will require
          Apple Business Messages approval and will be added later.
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  const { data: biz } = useGetCurrentBusiness();
  const qc = useQueryClient();
  const { toast } = useToast();
  const update = useUpdateCurrentBusiness({
    mutation: {
      onSuccess: async () => {
        await qc.invalidateQueries({
          queryKey: getGetCurrentBusinessQueryKey(),
        });
        toast({ title: "Saved", description: "Workspace updated." });
      },
      onError: (err) =>
        toast({
          title: "Couldn't save",
          description: err instanceof Error ? err.message : "Unknown error",
          variant: "destructive",
        }),
    },
  });

  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (biz) {
      setName(biz.name ?? "");
      setIndustry(biz.industry ?? "");
      setWebsiteUrl(biz.websiteUrl ?? "");
      setDescription(biz.description ?? "");
    }
  }, [biz]);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Settings
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Workspace details
        </h1>
      </div>

      <Card className="border-border/70 bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-base">Business profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-2">
            <Label htmlFor="name">Business name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Co."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="SaaS, Hospitality, Healthcare…"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="desc">Short description</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="What does your business do?"
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() =>
                update.mutate({
                  data: { name, industry, websiteUrl, description },
                })
              }
              disabled={update.isPending}
            >
              {update.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <MessagingSection />
    </div>
  );
}
