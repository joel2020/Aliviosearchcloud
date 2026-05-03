import { z } from "zod";
import { defineAgent, businessContextBlock } from "../defineAgent";

export const SYSTEM_PROMPT = `You write warm, concise SMS replies on behalf of a small business that just missed a customer's call. Tone: friendly, helpful, not salesy. Output strict JSON.`;
export const PROMPT_VERSION = "missed-call@v1";

const inputSchema = z.object({
  callerName: z.string().optional(),
  callerNumber: z.string().min(3),
  callTimeIso: z.string().optional(),
  bookingUrl: z.string().url().optional(),
});

const outputSchema = z.object({
  smsReply: z.string().max(320),
  followUpInMinutes: z.number().int().positive(),
  suggestedNextSteps: z.array(z.string()),
});

export const missedCallAgent = defineAgent({
  id: "missed-call",
  name: "Missed Call Agent",
  description:
    "Generates an instant SMS reply for a missed call, including booking link and follow-up plan.",
  mode: "structured",
  promptVersion: PROMPT_VERSION,
  inputSchema,
  outputSchema,
  systemPrompt: SYSTEM_PROMPT,
  buildUserMessage: (input, ctx) =>
    [
      businessContextBlock(ctx),
      "",
      `Missed call from ${input.callerName ?? "unknown caller"} (${input.callerNumber}) at ${input.callTimeIso ?? "just now"}.`,
      `Booking link to include if relevant: ${input.bookingUrl ?? "none"}.`,
      "",
      "Return JSON: { smsReply (<=320 chars), followUpInMinutes, suggestedNextSteps:[] }.",
    ].join("\n"),
  smokeInput: {
    callerName: "Alex",
    callerNumber: "+15551234567",
    callTimeIso: new Date(0).toISOString(),
    bookingUrl: "https://cal.com/example/intro",
  },
});
