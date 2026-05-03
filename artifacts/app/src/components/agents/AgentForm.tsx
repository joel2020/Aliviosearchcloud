import { useMemo, useState } from "react";
import type { AgentInputField } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface AgentFormProps {
  fields: readonly AgentInputField[];
  submitLabel?: string;
  isSubmitting?: boolean;
  onSubmit: (input: Record<string, unknown>) => void;
}

type FormState = Record<string, string>;

function defaultFor(field: AgentInputField): string {
  if (field.defaultValue == null) return "";
  if (Array.isArray(field.defaultValue)) {
    return field.defaultValue.join("\n");
  }
  return String(field.defaultValue);
}

function buildInitial(fields: readonly AgentInputField[]): FormState {
  const out: FormState = {};
  for (const f of fields) out[f.name] = defaultFor(f);
  return out;
}

type CoerceResult =
  | { ok: true; value: unknown }
  | { ok: false; reason: string };

const NUMERIC_RE = /^-?\d+(\.\d+)?$/;
const INT_RE = /^-?\d+$/;

function coerce(field: AgentInputField, raw: string): CoerceResult {
  const trimmed = raw.trim();
  if (trimmed === "") return { ok: true, value: undefined };
  switch (field.type) {
    case "integer": {
      if (!INT_RE.test(trimmed)) return { ok: false, reason: "Must be a whole number" };
      const n = Number(trimmed);
      if (!Number.isFinite(n)) return { ok: false, reason: "Invalid number" };
      return { ok: true, value: n };
    }
    case "number": {
      if (!NUMERIC_RE.test(trimmed)) return { ok: false, reason: "Must be a number" };
      const n = Number(trimmed);
      if (!Number.isFinite(n)) return { ok: false, reason: "Invalid number" };
      return { ok: true, value: n };
    }
    case "string-array": {
      const arr = trimmed
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      return { ok: true, value: arr };
    }
    case "enum":
    case "string":
    case "textarea":
    default:
      return { ok: true, value: trimmed };
  }
}

function validateConstraints(field: AgentInputField, value: unknown): string | null {
  if (value === undefined) return null;
  if (typeof value === "number") {
    if (typeof field.min === "number" && value < field.min) {
      return `Must be ≥ ${field.min}`;
    }
    if (typeof field.max === "number" && value > field.max) {
      return `Must be ≤ ${field.max}`;
    }
  }
  if (
    field.type === "enum" &&
    field.options &&
    typeof value === "string" &&
    !field.options.includes(value)
  ) {
    return "Choose a valid option";
  }
  return null;
}

export function AgentForm({
  fields,
  submitLabel = "Run agent",
  isSubmitting,
  onSubmit,
}: AgentFormProps) {
  const initial = useMemo(() => buildInitial(fields), [fields]);
  const [state, setState] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function update(name: string, value: string) {
    setState((s) => ({ ...s, [name]: value }));
    if (errors[name]) {
      setErrors((e) => {
        const next = { ...e };
        delete next[name];
        return next;
      });
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const input: Record<string, unknown> = {};
    for (const f of fields) {
      const raw = state[f.name] ?? "";
      const result = coerce(f, raw);
      if (!result.ok) {
        errs[f.name] = result.reason;
        continue;
      }
      const value = result.value;
      if (
        f.required &&
        (value === undefined || (Array.isArray(value) && value.length === 0))
      ) {
        errs[f.name] = "Required";
        continue;
      }
      const constraintErr = validateConstraints(f, value);
      if (constraintErr) {
        errs[f.name] = constraintErr;
        continue;
      }
      if (value !== undefined) input[f.name] = value;
    }
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    onSubmit(input);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" data-testid="agent-form">
      {fields.map((field) => {
        const id = `field-${field.name}`;
        const value = state[field.name] ?? "";
        const err = errors[field.name];
        return (
          <div key={field.name} className="space-y-1.5">
            <Label htmlFor={id} className="flex items-center gap-2">
              <span>{field.label}</span>
              {field.required ? (
                <span className="text-[10px] uppercase tracking-wide text-destructive/80">
                  Required
                </span>
              ) : (
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Optional
                </span>
              )}
            </Label>

            {field.type === "textarea" || field.type === "string-array" ? (
              <Textarea
                id={id}
                value={value}
                placeholder={
                  field.placeholder ??
                  (field.type === "string-array" ? "One item per line" : "")
                }
                rows={field.type === "string-array" ? 4 : 5}
                onChange={(e) => update(field.name, e.target.value)}
                data-testid={`input-${field.name}`}
              />
            ) : field.type === "enum" ? (
              <Select
                value={value}
                onValueChange={(v) => update(field.name, v)}
              >
                <SelectTrigger
                  id={id}
                  data-testid={`input-${field.name}`}
                  className="w-full"
                >
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {(field.options ?? []).map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={id}
                value={value}
                type={
                  field.type === "integer" || field.type === "number"
                    ? "number"
                    : "text"
                }
                inputMode={
                  field.type === "integer"
                    ? "numeric"
                    : field.type === "number"
                      ? "decimal"
                      : undefined
                }
                step={
                  field.step ??
                  (field.type === "integer"
                    ? 1
                    : field.type === "number"
                      ? "any"
                      : undefined) ??
                  undefined
                }
                min={field.min ?? undefined}
                max={field.max ?? undefined}
                placeholder={field.placeholder ?? undefined}
                onChange={(e) => update(field.name, e.target.value)}
                data-testid={`input-${field.name}`}
              />
            )}

            {field.description ? (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            ) : null}
            {err ? (
              <p className="text-xs text-destructive" data-testid={`error-${field.name}`}>
                {err}
              </p>
            ) : null}
          </div>
        );
      })}

      <div className="pt-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          data-testid="button-run-agent"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Running…
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}
