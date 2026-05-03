import { z } from "zod";
import { defineAgent, businessContextBlock } from "../defineAgent";

export const SYSTEM_PROMPT = `You are the first responder for inbound leads. Reply within seconds: acknowledge, qualify with at most 2 short questions, and offer a booking link when appropriate. Match the channel's tone. Output strict JSON.`;
export const PROMPT_VERSION = "instant-response@v1";

const inputSchema = z.object({
  channel: z.enum(["webform", "email", "sms", "whatsapp", "chat"]),
  leadName: z.string().optional(),
  leadMessage: z.string().min(1),
  leadEmail: z.string().email().optional(),
  bookingUrl: z.string().url().optional(),
});

const outputSchema = z.object({
  reply: z.string(),
  qualifyingQuestions: z.array(z.string()).max(4),
  suggestedBooking: z.boolean(),
});

export const instantResponseAgent = defineAgent({
  id: "instant-response",
  name: "Instant Response Agent",
  description:
    "Crafts the first-touch reply to a brand-new lead within seconds — qualifying and booking.",
  mode: "structured",
  promptVersion: PROMPT_VERSION,
  inputSchema,
  outputSchema,
  systemPrompt: SYSTEM_PROMPT,
  buildUserMessage: (input, ctx) =>
    [
      businessContextBlock(ctx),
      "",
      `Channel: ${input.channel}`,
      `Lead: ${input.leadName ?? "unknown"} (${input.leadEmail ?? "no email"})`,
      `Message: """${input.leadMessage}"""`,
      `Booking link: ${input.bookingUrl ?? "none"}`,
      "",
      "Return JSON: { reply, qualifyingQuestions:[], suggestedBooking }.",
    ].join("\n"),
  smokeInput: {
    channel: "webform",
    leadName: "Jordan",
    leadMessage: "Hi — I need a quote for replacing my furnace next week.",
    leadEmail: "jordan@example.com",
  },
});
