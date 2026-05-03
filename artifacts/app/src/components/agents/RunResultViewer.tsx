import { useState } from "react";
import type { AgentRun } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, Copy } from "lucide-react";
import { statusTone } from "@/lib/agentMeta";

interface RunResultViewerProps {
  run: AgentRun;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
          toast({ title: "Copied", description: label });
        } catch {
          toast({
            title: "Copy failed",
            description: "Clipboard not available.",
            variant: "destructive",
          });
        }
      }}
      data-testid={`button-copy-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      <span>{copied ? "Copied" : label}</span>
    </Button>
  );
}

function StructuredField({
  fieldKey,
  value,
}: {
  fieldKey: string;
  value: unknown;
}) {
  if (value == null) return null;

  if (typeof value === "string") {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {fieldKey}
          </h3>
          <CopyButton value={value} label={fieldKey} />
        </div>
        <p className="whitespace-pre-wrap rounded-md border border-border/60 bg-background/40 p-3 text-sm leading-relaxed">
          {value}
        </p>
      </div>
    );
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return (
      <div className="space-y-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {fieldKey}
        </h3>
        <div className="text-sm font-medium">{String(value)}</div>
      </div>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    const allStrings = value.every((v) => typeof v === "string");
    if (allStrings) {
      return (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {fieldKey}
          </h3>
          <ul className="space-y-1.5">
            {value.map((v, i) => (
              <li
                key={i}
                className="rounded-md border border-border/60 bg-background/40 px-3 py-2 text-sm"
              >
                {v as string}
              </li>
            ))}
          </ul>
        </div>
      );
    }
    return (
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {fieldKey}
        </h3>
        <div className="space-y-3">
          {value.map((v, i) => (
            <div
              key={i}
              className="rounded-md border border-border/60 bg-background/40 p-3"
            >
              {isPlainObject(v) ? (
                <div className="space-y-2">
                  {Object.entries(v).map(([k, sub]) => (
                    <div key={k} className="grid gap-0.5">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {k}
                      </span>
                      <span className="whitespace-pre-wrap text-sm">
                        {typeof sub === "string"
                          ? sub
                          : JSON.stringify(sub, null, 2)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <pre className="overflow-x-auto text-xs">
                  {JSON.stringify(v, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isPlainObject(value)) {
    return (
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {fieldKey}
        </h3>
        <div className="rounded-md border border-border/60 bg-background/40 p-3 space-y-2">
          {Object.entries(value).map(([k, sub]) => (
            <StructuredField key={k} fieldKey={k} value={sub} />
          ))}
        </div>
      </div>
    );
  }

  return null;
}

export function RunResultViewer({ run }: RunResultViewerProps) {
  const tone = statusTone(run.status);
  const output = run.output ?? null;
  const json = JSON.stringify(output ?? {}, null, 2);
  const inputJson = JSON.stringify(run.input ?? {}, null, 2);

  return (
    <Card className="border-border/70 bg-card/60 backdrop-blur" data-testid="card-run-result">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">Result</CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className={tone.className}>
              {tone.label}
            </Badge>
            <span>
              {run.tokensUsed ? `${run.tokensUsed} tokens` : "0 tokens"}
            </span>
          </div>
        </div>
        <CopyButton value={json} label="Copy JSON" />
      </CardHeader>
      <CardContent>
        {run.status !== "ok" ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <div className="font-medium">Run did not complete.</div>
            {run.errorMessage ? (
              <p className="mt-1 whitespace-pre-wrap">{run.errorMessage}</p>
            ) : null}
          </div>
        ) : (
          <Tabs defaultValue="structured">
            <TabsList>
              <TabsTrigger value="structured" data-testid="tab-structured">
                Structured
              </TabsTrigger>
              <TabsTrigger value="json" data-testid="tab-json">
                JSON
              </TabsTrigger>
              <TabsTrigger value="input" data-testid="tab-input">
                Input
              </TabsTrigger>
            </TabsList>
            <TabsContent value="structured" className="mt-4 space-y-5">
              {output && Object.keys(output).length > 0 ? (
                Object.entries(output).map(([k, v]) => (
                  <StructuredField key={k} fieldKey={k} value={v} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No structured output returned.
                </p>
              )}
            </TabsContent>
            <TabsContent value="json" className="mt-4">
              <pre
                className="max-h-[480px] overflow-auto rounded-md border border-border/60 bg-background/60 p-4 text-xs leading-relaxed"
                data-testid="pre-json"
              >
                {json}
              </pre>
            </TabsContent>
            <TabsContent value="input" className="mt-4">
              <pre className="max-h-[480px] overflow-auto rounded-md border border-border/60 bg-background/60 p-4 text-xs leading-relaxed">
                {inputJson}
              </pre>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
