import { z } from "zod";
import { defineAgent, businessContextBlock } from "../defineAgent";

export const SYSTEM_PROMPT = `You write cold emails that get replies. Subject <= 80 chars, body <= 130 words, one clear CTA, no fluff openers. Output strict JSON.`;
export const PROMPT_VERSION = "cold-email@v1";

const inputSchema = z.object({
  prospectName: z.string().optional(),
  prospectCompany: z.string().optional(),
  painPoint: z.string().min(5),
  valueProp: z.string().min(10),
  cta: z.string().optional().default("15-minute call this week"),
});

const outputSchema = z.object({
  subject: z.string().max(80),
  body: z.string(),
  pSAlternative: z.string().optional(),
});

export const coldEmailAgent = defineAgent({
  id: "cold-email",
  name: "Cold Email Agent",
  description: "Writes a tight, personalized cold email with subject and CTA.",
  mode: "structured",
  promptVersion: PROMPT_VERSION,
  inputSchema,
  outputSchema,
  systemPrompt: SYSTEM_PROMPT,
  buildUserMessage: (input, ctx) =>
    [
      businessContextBlock(ctx),
      "",
      `Prospect: ${input.prospectName ?? "unknown"} @ ${input.prospectCompany ?? "unknown"}`,
      `Pain: ${input.painPoint}`,
      `Value prop: ${input.valueProp}`,
      `CTA: ${input.cta ?? "15-minute call this week"}`,
      "",
      "Return JSON: { subject, body, pSAlternative? }.",
    ].join("\n"),
  smokeInput: {
    prospectName: "Morgan",
    prospectCompany: "Acme Plumbing",
    painPoint: "Missing 30+ calls/week during peak hours",
    valueProp: "AI receptionist that books jobs while you're on a wrench",
  },
});
