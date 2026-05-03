import { useState, useEffect } from "react";
import {
  useGetCurrentBusiness,
  useUpdateCurrentBusiness,
  getGetCurrentBusinessQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

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
    </div>
  );
}
