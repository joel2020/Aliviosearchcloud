import { z } from "zod";
import { defineAgent, businessContextBlock } from "../defineAgent";

export const SYSTEM_PROMPT = `You write win-back outreach to cold leads. Acknowledge the gap, lead with new value, ask one clear question. Tone: human and short. Output strict JSON.`;
export const PROMPT_VERSION = "reactivation@v1";

const inputSchema = z.object({
  leadName: z.string().optional(),
  monthsCold: z.number().int().nonnegative(),
  pastInterest: z.string().optional(),
  newOfferSummary: z.string().optional(),
});

const outputSchema = z.object({
  subject: z.string(),
  email: z.string(),
  smsVariant: z.string().max(320),
});

export const reactivationAgent = defineAgent({
  id: "reactivation",
  name: "Reactivation Agent",
  description:
    "Re-engages cold leads from past months with a personalized win-back message.",
  mode: "structured",
  promptVersion: PROMPT_VERSION,
  inputSchema,
  outputSchema,
  systemPrompt: SYSTEM_PROMPT,
  buildUserMessage: (input, ctx) =>
    [
      businessContextBlock(ctx),
      "",
      `Lead: ${input.leadName ?? "unknown"} | cold for ${input.monthsCold} months.`,
      `Past interest: ${input.pastInterest ?? "unknown"}`,
      `New offer: ${input.newOfferSummary ?? "n/a"}`,
      "",
      "Return JSON: { subject, email, smsVariant (<=320 chars) }.",
    ].join("\n"),
  smokeInput: {
    leadName: "Riley",
    monthsCold: 6,
    pastInterest: "asked about our annual plan but ghosted",
    newOfferSummary: "We just launched a no-setup-fee onboarding for Q2.",
  },
});
