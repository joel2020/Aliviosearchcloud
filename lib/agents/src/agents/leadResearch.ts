import { z } from "zod";
import { defineAgent, businessContextBlock } from "../defineAgent";

export const SYSTEM_PROMPT = `You build concise sales research briefs. Stay grounded in the supplied data — never invent specific facts about real companies. Output strict JSON.`;
export const PROMPT_VERSION = "lead-research@v1";

const inputSchema = z.object({
  name: z.string().min(1),
  company: z.string().optional(),
  title: z.string().optional(),
  publicNotes: z.string().optional(),
  knownNeeds: z.array(z.string()).optional(),
});

const outputSchema = z.object({
  summary: z.string(),
  likelyPainPoints: z.array(z.string()),
  talkingPoints: z.array(z.string()),
  riskFlags: z.array(z.string()),
});

export const leadResearchAgent = defineAgent({
  id: "lead-research",
  name: "Lead Research Agent",
  description:
    "Synthesizes everything we know about a lead into a one-page research brief.",
  mode: "structured",
  promptVersion: PROMPT_VERSION,
  inputSchema,
  outputSchema,
  systemPrompt: SYSTEM_PROMPT,
  buildUserMessage: (input, ctx) =>
    [
      businessContextBlock(ctx),
      "",
      `Lead: ${input.name}${input.title ? `, ${input.title}` : ""}${input.company ? ` @ ${input.company}` : ""}`,
      `Public notes: ${input.publicNotes ?? "none"}`,
      `Known needs: ${input.knownNeeds?.join("; ") || "unknown"}`,
      "",
      "Return JSON: { summary, likelyPainPoints:[], talkingPoints:[], riskFlags:[] }.",
    ].join("\n"),
  smokeInput: {
    name: "Taylor Kim",
    company: "Sunset Roofing Co.",
    title: "Owner",
    publicNotes: "Family-owned, ~30 employees, growing into commercial roofs.",
    knownNeeds: ["lead follow-up speed", "after-hours coverage"],
  },
});
