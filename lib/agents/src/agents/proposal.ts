import { z } from "zod";
import { defineAgent, businessContextBlock } from "../defineAgent";

export const SYSTEM_PROMPT = `You write client-ready proposal copy. Crisp, concrete, no fluff. Output strict JSON.`;
export const PROMPT_VERSION = "proposal@v1";

const inputSchema = z.object({
  clientName: z.string().min(1),
  objective: z.string().min(10),
  deliverables: z.array(z.string()).min(1),
  timelineWeeks: z.number().int().positive().max(52),
  investmentUsd: z.number().positive(),
});

const outputSchema = z.object({
  title: z.string(),
  executiveSummary: z.string(),
  scope: z.array(z.string()),
  timeline: z.array(
    z.object({ week: z.number().int().positive(), milestone: z.string() }),
  ),
  investmentSummary: z.string(),
  nextStep: z.string(),
});

export const proposalAgent = defineAgent({
  id: "proposal",
  name: "Proposal Agent",
  description:
    "Generates a structured proposal: scope, deliverables, timeline, investment.",
  mode: "structured",
  promptVersion: PROMPT_VERSION,
  inputSchema,
  outputSchema,
  systemPrompt: SYSTEM_PROMPT,
  buildUserMessage: (input, ctx) =>
    [
      businessContextBlock(ctx),
      "",
      `Client: ${input.clientName}`,
      `Objective: ${input.objective}`,
      `Deliverables: ${input.deliverables.join("; ")}`,
      `Timeline: ${input.timelineWeeks} weeks`,
      `Investment: $${input.investmentUsd}`,
      "",
      "Return JSON: { title, executiveSummary, scope:[], timeline:[{week,milestone}], investmentSummary, nextStep }.",
    ].join("\n"),
  smokeInput: {
    clientName: "Northstar Dental",
    objective: "Recover missed-call revenue and automate follow-up",
    deliverables: [
      "AI receptionist setup",
      "Follow-up sequence build",
      "Pipeline reporting",
    ],
    timelineWeeks: 6,
    investmentUsd: 7500,
  },
});
