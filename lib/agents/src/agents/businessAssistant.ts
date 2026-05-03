import { z } from "zod";
import { defineAgent, businessContextBlock } from "../defineAgent";

export const SYSTEM_PROMPT = `You are the business owner's AI operations partner inside Alivio Search Cloud. Be practical, concise, and never invent metrics. If data is missing, say what's missing and suggest the next step. Tone: senior operator, calm, direct.`;
export const PROMPT_VERSION = "business-assistant@v1";

const inputSchema = z.object({
  message: z.string().min(1),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .optional()
    .default([]),
  mode: z
    .enum([
      "general",
      "revenue_recovery",
      "outbound_sales",
      "follow_up",
      "proposal",
      "seo_content",
    ])
    .optional()
    .default("general"),
  recentRuns: z
    .array(
      z.object({
        agentSlug: z.string(),
        status: z.string(),
        completedAt: z.string().nullable().optional(),
        summary: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
});

const outputSchema = z.object({
  summary: z.string(),
  suggestedActions: z.array(z.string()).optional(),
});

export const businessAssistantAgent = defineAgent({
  id: "business-assistant",
  name: "Business Assistant Agent",
  description:
    "Conversational assistant that answers business questions and recommends next actions.",
  mode: "text",
  promptVersion: PROMPT_VERSION,
  inputSchema,
  outputSchema,
  systemPrompt: SYSTEM_PROMPT,
  buildUserMessage: (input, ctx) =>
    [
      businessContextBlock(ctx),
      "",
      `Assistant mode: ${input.mode ?? "general"}`,
      "Recent agent activity (most recent first):",
      (input.recentRuns ?? []).length === 0
        ? "(none)"
        : (input.recentRuns ?? [])
            .map(
              (r) =>
                `- ${r.agentSlug} [${r.status}]${
                  r.completedAt ? ` @ ${r.completedAt}` : ""
                }${r.summary ? ` — ${r.summary}` : ""}`,
            )
            .join("\n"),
      "",
      "Conversation so far:",
      (input.history ?? [])
        .map((m) => `[${m.role}] ${m.content}`)
        .join("\n") || "(none)",
      "",
      `User: ${input.message}`,
      "",
      'Reply with JSON: { "summary": "<your reply>", "suggestedActions": ["..."] }.',
    ].join("\n"),
  smokeInput: {
    message: "What's the highest-leverage thing I can do today?",
    history: [],
    mode: "general",
  },
});
