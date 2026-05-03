import { z } from "zod";
import { defineAgent, businessContextBlock } from "../defineAgent";

export const SYSTEM_PROMPT = `You design pragmatic follow-up sequences for small-business sales. Always vary channel, keep messages short and human, and stop after 5 touches. Output strict JSON.`;
export const PROMPT_VERSION = "follow-up@v1";

const inputSchema = z.object({
  leadName: z.string().optional(),
  daysSinceLastTouch: z.number().int().nonnegative(),
  lastChannel: z.enum(["email", "sms", "call", "whatsapp"]).optional(),
  leadStage: z
    .enum(["new", "contacted", "qualified", "proposal_sent", "negotiation"])
    .default("contacted"),
  notes: z.string().optional(),
});

const outputSchema = z.object({
  sequence: z.array(
    z.object({
      offsetDays: z.number().int().nonnegative(),
      channel: z.enum(["email", "sms", "call", "whatsapp"]),
      subject: z.string().optional(),
      body: z.string(),
    }),
  ),
  rationale: z.string(),
});

export const followUpAgent = defineAgent({
  id: "follow-up",
  name: "Follow-Up Agent",
  description:
    "Designs a multi-touch follow-up sequence for an open lead, with channel and timing.",
  mode: "structured",
  promptVersion: PROMPT_VERSION,
  inputSchema,
  outputSchema,
  systemPrompt: SYSTEM_PROMPT,
  buildUserMessage: (input, ctx) =>
    [
      businessContextBlock(ctx),
      "",
      `Lead: ${input.leadName ?? "unknown"} | stage: ${input.leadStage} | ${input.daysSinceLastTouch}d since last touch (${input.lastChannel ?? "unknown channel"}).`,
      `Notes: ${input.notes ?? "none"}`,
      "",
      "Return JSON: { sequence:[{offsetDays,channel,subject?,body}], rationale }.",
    ].join("\n"),
  smokeInput: {
    leadName: "Pat",
    daysSinceLastTouch: 4,
    lastChannel: "email",
    leadStage: "qualified",
    notes: "Asked about pricing tiers, hasn't replied to first quote.",
  },
});
