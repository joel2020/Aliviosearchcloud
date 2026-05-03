import { z } from "zod";
import { defineAgent, businessContextBlock } from "../defineAgent";

export const SYSTEM_PROMPT = `You are an SEO editor for a small-business AI revenue platform. Plan content that ranks and converts. Output strict JSON.`;
export const PROMPT_VERSION = "seo-content@v1";

const inputSchema = z.object({
  primaryKeyword: z.string().min(2),
  audience: z.string().optional(),
  intent: z
    .enum(["informational", "commercial", "transactional"])
    .default("informational"),
  desiredWordCount: z.number().int().min(300).max(3500).default(1200),
});

const outputSchema = z.object({
  seoTitle: z.string().max(70),
  metaDescription: z.string().max(170),
  outline: z.array(
    z.object({ heading: z.string(), bullets: z.array(z.string()) }),
  ),
  openingParagraph: z.string(),
  internalLinkIdeas: z.array(z.string()),
});

export const seoContentAgent = defineAgent({
  id: "seo-content",
  name: "SEO Content Agent",
  description:
    "Plans and drafts an SEO blog post: title, meta, outline, opening, internal-link suggestions.",
  mode: "structured",
  promptVersion: PROMPT_VERSION,
  inputSchema,
  outputSchema,
  systemPrompt: SYSTEM_PROMPT,
  buildUserMessage: (input, ctx) =>
    [
      businessContextBlock(ctx),
      "",
      `Primary keyword: ${input.primaryKeyword}`,
      `Audience: ${input.audience ?? "small-business owners"}`,
      `Intent: ${input.intent ?? "informational"}`,
      `Target length: ~${input.desiredWordCount ?? 1200} words`,
      "",
      "Return JSON: { seoTitle, metaDescription, outline:[{heading,bullets:[]}], openingParagraph, internalLinkIdeas:[] }.",
    ].join("\n"),
  smokeInput: {
    primaryKeyword: "missed call revenue recovery",
    audience: "owners of local service businesses",
    intent: "commercial",
    desiredWordCount: 1200,
  },
});
