import { z } from "zod";
import { defineAgent, businessContextBlock } from "../defineAgent";

export const SYSTEM_PROMPT = `You are a revenue operations consultant. Identify concrete revenue leaks based on the supplied business data. Be specific, quantitative, and prescriptive. Output strict JSON matching the schema.`;

export const PROMPT_VERSION = "revenue-leak@v1";

const inputSchema = z.object({
  monthlyLeads: z.number().int().nonnegative().optional(),
  averageDealValue: z.number().nonnegative().optional(),
  closeRate: z.number().min(0).max(1).optional(),
  knownIssues: z.array(z.string()).optional().default([]),
  notes: z.string().max(2000).optional(),
});

const outputSchema = z.object({
  leaks: z.array(
    z.object({
      title: z.string(),
      impact: z.enum(["low", "medium", "high"]),
      estimatedMonthlyLossUsd: z.number().nonnegative(),
      evidence: z.string(),
      fix: z.string(),
    }),
  ),
  quickWins: z.array(z.string()),
  summary: z.string(),
});

export const revenueLeakAgent = defineAgent({
  id: "revenue-leak",
  name: "Revenue Leak Agent",
  description:
    "Identifies the highest-impact revenue leaks in a business' lead lifecycle and prescribes fixes.",
  mode: "structured",
  promptVersion: PROMPT_VERSION,
  inputSchema,
  outputSchema,
  systemPrompt: SYSTEM_PROMPT,
  buildUserMessage: (input, ctx) =>
    [
      businessContextBlock(ctx),
      "",
      `Monthly leads: ${input.monthlyLeads ?? "unknown"}`,
      `Avg deal value: $${input.averageDealValue ?? "unknown"}`,
      `Close rate: ${input.closeRate ?? "unknown"}`,
      `Known issues: ${input.knownIssues?.join("; ") || "none"}`,
      `Notes: ${input.notes ?? "none"}`,
      "",
      "Return JSON: { leaks:[{title,impact,estimatedMonthlyLossUsd,evidence,fix}], quickWins:[], summary }.",
    ].join("\n"),
  smokeInput: {
    monthlyLeads: 120,
    averageDealValue: 1500,
    closeRate: 0.18,
    knownIssues: ["slow follow-up", "voicemails not returned"],
    notes: "Local HVAC company, high inbound, mostly missed-call problem.",
  },
});
