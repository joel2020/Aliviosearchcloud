import { z } from "zod";
import { defineAgent, businessContextBlock } from "../defineAgent";

export const SYSTEM_PROMPT = `You design outbound sales sequences for B2B small businesses. Always 4 steps, mixed channels, short messages, one CTA each. Output strict JSON.`;
export const PROMPT_VERSION = "outbound-sales@v1";

const inputSchema = z.object({
  icpDescription: z.string().min(10),
  valueProp: z.string().min(10),
  desiredOutcome: z.string().optional().default("book a discovery call"),
});

const outputSchema = z.object({
  icpRefined: z.string(),
  sequence: z.array(
    z.object({
      step: z.number().int().positive(),
      channel: z.enum(["email", "linkedin", "call", "sms"]),
      offsetDays: z.number().int().nonnegative(),
      subject: z.string().optional(),
      body: z.string(),
    }),
  ),
});

export const outboundSalesAgent = defineAgent({
  id: "outbound-sales",
  name: "Outbound Sales Agent",
  description:
    "Builds a target list profile and a 4-step outbound sequence for a defined ICP.",
  mode: "structured",
  promptVersion: PROMPT_VERSION,
  inputSchema,
  outputSchema,
  systemPrompt: SYSTEM_PROMPT,
  buildUserMessage: (input, ctx) =>
    [
      businessContextBlock(ctx),
      "",
      `ICP: ${input.icpDescription}`,
      `Value prop: ${input.valueProp}`,
      `Goal: ${input.desiredOutcome ?? "book a discovery call"}`,
      "",
      "Return JSON: { icpRefined, sequence:[{step,channel,offsetDays,subject?,body}] }.",
    ].join("\n"),
  smokeInput: {
    icpDescription: "20-100 employee dental practices in Texas",
    valueProp:
      "We recover 20% of missed-call revenue with an AI receptionist that books appointments 24/7.",
    desiredOutcome: "book a 15-min demo",
  },
});
