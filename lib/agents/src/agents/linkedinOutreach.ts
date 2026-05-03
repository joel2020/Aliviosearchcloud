import { z } from "zod";
import { defineAgent, businessContextBlock } from "../defineAgent";

export const SYSTEM_PROMPT = `You write LinkedIn outreach that does not feel automated. Connection note <= 280 chars. Follow-up <= 900 chars. No emoji. No "I hope this finds you well". Output strict JSON.`;
export const PROMPT_VERSION = "linkedin-outreach@v1";

const inputSchema = z.object({
  prospectName: z.string().min(1),
  prospectTitle: z.string().optional(),
  prospectCompany: z.string().optional(),
  hook: z.string().optional(),
  valueProp: z.string().min(10),
});

const outputSchema = z.object({
  connectionNote: z.string().max(280),
  followUpDm: z.string().max(900),
});

export const linkedinOutreachAgent = defineAgent({
  id: "linkedin-outreach",
  name: "LinkedIn Outreach Agent",
  description:
    "Writes a personalized LinkedIn connection request and a follow-up DM.",
  mode: "structured",
  promptVersion: PROMPT_VERSION,
  inputSchema,
  outputSchema,
  systemPrompt: SYSTEM_PROMPT,
  buildUserMessage: (input, ctx) =>
    [
      businessContextBlock(ctx),
      "",
      `Prospect: ${input.prospectName}${input.prospectTitle ? `, ${input.prospectTitle}` : ""}${input.prospectCompany ? ` @ ${input.prospectCompany}` : ""}`,
      `Hook: ${input.hook ?? "none"}`,
      `Value prop: ${input.valueProp}`,
      "",
      "Return JSON: { connectionNote, followUpDm }.",
    ].join("\n"),
  smokeInput: {
    prospectName: "Sam Chen",
    prospectTitle: "Owner",
    prospectCompany: "BrightSmile Dental",
    hook: "Posted last week about hiring more front-desk staff",
    valueProp: "AI receptionist that captures every missed call.",
  },
});
