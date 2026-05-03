import { z } from "zod";
import type { AgentDefinition } from "./types";

function defineAgent<I extends z.ZodTypeAny, O extends z.ZodTypeAny>(
  spec: AgentDefinition<I, O>,
): AgentDefinition<I, O> {
  return spec;
}

const businessContextBlock = (ctx: { business: { name: string; industry: string | null; description: string | null; websiteUrl: string | null } }) =>
  `Business: ${ctx.business.name}\nIndustry: ${ctx.business.industry ?? "unspecified"}\nWebsite: ${ctx.business.websiteUrl ?? "unspecified"}\nNotes: ${ctx.business.description ?? "none"}`;

// 1. Revenue Leak Agent
export const revenueLeakAgent = defineAgent({
  id: "revenue-leak",
  name: "Revenue Leak Agent",
  description:
    "Identifies the highest-impact revenue leaks in a business' lead lifecycle and prescribes fixes.",
  mode: "structured",
  inputSchema: z.object({
    monthlyLeads: z.number().int().nonnegative().optional(),
    averageDealValue: z.number().nonnegative().optional(),
    closeRate: z.number().min(0).max(1).optional(),
    knownIssues: z.array(z.string()).optional().default([]),
    notes: z.string().max(2000).optional(),
  }),
  outputSchema: z.object({
    leaks: z.array(
      z.object({
        title: z.string(),
        impact: z.enum(["low", "medium", "high"]),
        estimatedMonthlyLossUsd: z.number().nonnegative(),
        evidence: z.string(),
        fix: z.string(),
      }),
    ),
    quickWins: z.array(z.string()),
    summary: z.string(),
  }),
  systemPrompt:
    "You are a revenue operations consultant. Identify concrete revenue leaks based on the supplied business data. Be specific, quantitative, and prescriptive. Output strict JSON matching the schema.",
  buildUserMessage: (input, ctx) =>
    `${businessContextBlock(ctx)}\n\nMonthly leads: ${input.monthlyLeads ?? "unknown"}\nAvg deal value: $${input.averageDealValue ?? "unknown"}\nClose rate: ${input.closeRate ?? "unknown"}\nKnown issues: ${input.knownIssues?.join("; ") || "none"}\nNotes: ${input.notes ?? "none"}\n\nReturn JSON with keys: leaks[{title,impact,estimatedMonthlyLossUsd,evidence,fix}], quickWins[], summary.`,
  smokeInput: {
    monthlyLeads: 120,
    averageDealValue: 1500,
    closeRate: 0.18,
    knownIssues: ["slow follow-up", "voicemails not returned"],
    notes: "Local HVAC company, high inbound, mostly missed-call problem.",
  },
});

// 2. Missed Call Agent
export const missedCallAgent = defineAgent({
  id: "missed-call",
  name: "Missed Call Agent",
  description:
    "Generates an instant SMS reply for a missed call, including booking link and follow-up plan.",
  mode: "structured",
  inputSchema: z.object({
    callerName: z.string().optional(),
    callerNumber: z.string().min(3),
    callTimeIso: z.string().optional(),
    bookingUrl: z.string().url().optional(),
  }),
  outputSchema: z.object({
    smsReply: z.string().max(320),
    followUpInMinutes: z.number().int().positive(),
    suggestedNextSteps: z.array(z.string()),
  }),
  systemPrompt:
    "You write warm, concise SMS replies on behalf of a small business that just missed a customer's call. Tone: friendly, helpful, not salesy. Output strict JSON.",
  buildUserMessage: (input, ctx) =>
    `${businessContextBlock(ctx)}\n\nMissed call from ${input.callerName ?? "unknown caller"} (${input.callerNumber}) at ${input.callTimeIso ?? "just now"}.\nBooking link to include if relevant: ${input.bookingUrl ?? "none"}.\n\nWrite a single SMS reply (<= 320 chars), recommend a follow-up window, and list next steps. Return JSON.`,
  smokeInput: {
    callerName: "Alex",
    callerNumber: "+15551234567",
    callTimeIso: new Date().toISOString(),
    bookingUrl: "https://cal.com/example/intro",
  },
});

// 3. Instant Response Agent
export const instantResponseAgent = defineAgent({
  id: "instant-response",
  name: "Instant Response Agent",
  description:
    "Crafts the first-touch reply to a brand-new lead within seconds — qualifying and booking.",
  mode: "structured",
  inputSchema: z.object({
    channel: z.enum(["webform", "email", "sms", "whatsapp", "chat"]),
    leadName: z.string().optional(),
    leadMessage: z.string().min(1),
    leadEmail: z.string().email().optional(),
    bookingUrl: z.string().url().optional(),
  }),
  outputSchema: z.object({
    reply: z.string(),
    qualifyingQuestions: z.array(z.string()).max(4),
    suggestedBooking: z.boolean(),
  }),
  systemPrompt:
    "You are the first responder for inbound leads. Reply within seconds: acknowledge, qualify with at most 2 short questions, and offer a booking link when appropriate. Match the channel's tone. Output strict JSON.",
  buildUserMessage: (input, ctx) =>
    `${businessContextBlock(ctx)}\n\nChannel: ${input.channel}\nLead: ${input.leadName ?? "unknown"} (${input.leadEmail ?? "no email"})\nMessage: """${input.leadMessage}"""\nBooking link: ${input.bookingUrl ?? "none"}\n\nReturn JSON: reply, qualifyingQuestions[], suggestedBooking.`,
  smokeInput: {
    channel: "webform",
    leadName: "Jordan",
    leadMessage: "Hi — I need a quote for replacing my furnace next week.",
    leadEmail: "jordan@example.com",
  },
});

// 4. Follow-Up Agent
export const followUpAgent = defineAgent({
  id: "follow-up",
  name: "Follow-Up Agent",
  description:
    "Designs a multi-touch follow-up sequence for an open lead, with channel and timing.",
  mode: "structured",
  inputSchema: z.object({
    leadName: z.string().optional(),
    daysSinceLastTouch: z.number().int().nonnegative(),
    lastChannel: z.enum(["email", "sms", "call", "whatsapp"]).optional(),
    leadStage: z
      .enum(["new", "contacted", "qualified", "proposal_sent", "negotiation"])
      .default("contacted"),
    notes: z.string().optional(),
  }),
  outputSchema: z.object({
    sequence: z.array(
      z.object({
        offsetDays: z.number().int().nonnegative(),
        channel: z.enum(["email", "sms", "call", "whatsapp"]),
        subject: z.string().optional(),
        body: z.string(),
      }),
    ),
    rationale: z.string(),
  }),
  systemPrompt:
    "You design pragmatic follow-up sequences for small-business sales. Always vary channel, keep messages short and human, and stop after 5 touches. Output strict JSON.",
  buildUserMessage: (input, ctx) =>
    `${businessContextBlock(ctx)}\n\nLead: ${input.leadName ?? "unknown"} | stage: ${input.leadStage} | ${input.daysSinceLastTouch}d since last touch (${input.lastChannel ?? "unknown channel"}).\nNotes: ${input.notes ?? "none"}\n\nReturn JSON: sequence[{offsetDays,channel,subject?,body}], rationale.`,
  smokeInput: {
    leadName: "Pat",
    daysSinceLastTouch: 4,
    lastChannel: "email",
    leadStage: "qualified",
    notes: "Asked about pricing tiers, hasn't replied to first quote.",
  },
});

// 5. Reactivation Agent
export const reactivationAgent = defineAgent({
  id: "reactivation",
  name: "Reactivation Agent",
  description:
    "Re-engages cold leads from past months with a personalized win-back message.",
  mode: "structured",
  inputSchema: z.object({
    leadName: z.string().optional(),
    monthsCold: z.number().int().nonnegative(),
    pastInterest: z.string().optional(),
    newOfferSummary: z.string().optional(),
  }),
  outputSchema: z.object({
    subject: z.string(),
    email: z.string(),
    smsVariant: z.string().max(320),
  }),
  systemPrompt:
    "You write win-back outreach to cold leads. Acknowledge the gap, lead with new value, ask one clear question. Tone: human and short. Output strict JSON.",
  buildUserMessage: (input, ctx) =>
    `${businessContextBlock(ctx)}\n\nLead: ${input.leadName ?? "unknown"} | cold for ${input.monthsCold} months.\nPast interest: ${input.pastInterest ?? "unknown"}\nNew offer: ${input.newOfferSummary ?? "n/a"}\n\nReturn JSON: subject, email, smsVariant (<= 320 chars).`,
  smokeInput: {
    leadName: "Riley",
    monthsCold: 6,
    pastInterest: "asked about our annual plan but ghosted",
    newOfferSummary: "We just launched a no-setup-fee onboarding for Q2.",
  },
});

// 6. Outbound Sales Agent
export const outboundSalesAgent = defineAgent({
  id: "outbound-sales",
  name: "Outbound Sales Agent",
  description:
    "Builds a target list profile and a 4-step outbound sequence for a defined ICP.",
  mode: "structured",
  inputSchema: z.object({
    icpDescription: z.string().min(10),
    valueProp: z.string().min(10),
    desiredOutcome: z.string().optional().default("book a discovery call"),
  }),
  outputSchema: z.object({
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
  }),
  systemPrompt:
    "You design outbound sales sequences for B2B small businesses. Always 4 steps, mixed channels, short messages, one CTA each. Output strict JSON.",
  buildUserMessage: (input, ctx) =>
    `${businessContextBlock(ctx)}\n\nICP: ${input.icpDescription}\nValue prop: ${input.valueProp}\nGoal: ${input.desiredOutcome}\n\nReturn JSON: icpRefined, sequence[{step,channel,offsetDays,subject?,body}].`,
  smokeInput: {
    icpDescription: "20-100 employee dental practices in Texas",
    valueProp:
      "We recover 20% of missed-call revenue with an AI receptionist that books appointments 24/7.",
    desiredOutcome: "book a 15-min demo",
  },
});

// 7. LinkedIn Outreach Agent
export const linkedinOutreachAgent = defineAgent({
  id: "linkedin-outreach",
  name: "LinkedIn Outreach Agent",
  description:
    "Writes a personalized LinkedIn connection request and a follow-up DM.",
  mode: "structured",
  inputSchema: z.object({
    prospectName: z.string().min(1),
    prospectTitle: z.string().optional(),
    prospectCompany: z.string().optional(),
    hook: z.string().optional(),
    valueProp: z.string().min(10),
  }),
  outputSchema: z.object({
    connectionNote: z.string().max(280),
    followUpDm: z.string().max(900),
  }),
  systemPrompt:
    "You write LinkedIn outreach that does not feel automated. Connection note <= 280 chars. Follow-up <= 900 chars. No emoji. No 'I hope this finds you well'. Output strict JSON.",
  buildUserMessage: (input, ctx) =>
    `${businessContextBlock(ctx)}\n\nProspect: ${input.prospectName}${input.prospectTitle ? `, ${input.prospectTitle}` : ""}${input.prospectCompany ? ` @ ${input.prospectCompany}` : ""}\nHook: ${input.hook ?? "none"}\nValue prop: ${input.valueProp}\n\nReturn JSON: connectionNote, followUpDm.`,
  smokeInput: {
    prospectName: "Sam Chen",
    prospectTitle: "Owner",
    prospectCompany: "BrightSmile Dental",
    hook: "Posted last week about hiring more front-desk staff",
    valueProp: "AI receptionist that captures every missed call.",
  },
});

// 8. Cold Email Agent
export const coldEmailAgent = defineAgent({
  id: "cold-email",
  name: "Cold Email Agent",
  description: "Writes a tight, personalized cold email with subject and CTA.",
  mode: "structured",
  inputSchema: z.object({
    prospectName: z.string().optional(),
    prospectCompany: z.string().optional(),
    painPoint: z.string().min(5),
    valueProp: z.string().min(10),
    cta: z.string().optional().default("15-minute call this week"),
  }),
  outputSchema: z.object({
    subject: z.string().max(80),
    body: z.string(),
    pSAlternative: z.string().optional(),
  }),
  systemPrompt:
    "You write cold emails that get replies. Subject <= 80 chars, body <= 130 words, one clear CTA, no fluff openers. Output strict JSON.",
  buildUserMessage: (input, ctx) =>
    `${businessContextBlock(ctx)}\n\nProspect: ${input.prospectName ?? "unknown"} @ ${input.prospectCompany ?? "unknown"}\nPain: ${input.painPoint}\nValue prop: ${input.valueProp}\nCTA: ${input.cta}\n\nReturn JSON: subject, body, pSAlternative?.`,
  smokeInput: {
    prospectName: "Morgan",
    prospectCompany: "Acme Plumbing",
    painPoint: "Missing 30+ calls/week during peak hours",
    valueProp: "AI receptionist that books jobs while you're on a wrench",
  },
});

// 9. Lead Research Agent
export const leadResearchAgent = defineAgent({
  id: "lead-research",
  name: "Lead Research Agent",
  description:
    "Synthesizes everything we know about a lead into a one-page research brief.",
  mode: "structured",
  inputSchema: z.object({
    name: z.string().min(1),
    company: z.string().optional(),
    title: z.string().optional(),
    publicNotes: z.string().optional(),
    knownNeeds: z.array(z.string()).optional(),
  }),
  outputSchema: z.object({
    summary: z.string(),
    likelyPainPoints: z.array(z.string()),
    talkingPoints: z.array(z.string()),
    riskFlags: z.array(z.string()),
  }),
  systemPrompt:
    "You build concise sales research briefs. Stay grounded in the supplied data — never invent specific facts about real companies. Output strict JSON.",
  buildUserMessage: (input, ctx) =>
    `${businessContextBlock(ctx)}\n\nLead: ${input.name}${input.title ? `, ${input.title}` : ""}${input.company ? ` @ ${input.company}` : ""}\nPublic notes: ${input.publicNotes ?? "none"}\nKnown needs: ${input.knownNeeds?.join("; ") || "unknown"}\n\nReturn JSON: summary, likelyPainPoints[], talkingPoints[], riskFlags[].`,
  smokeInput: {
    name: "Taylor Kim",
    company: "Sunset Roofing Co.",
    title: "Owner",
    publicNotes: "Family-owned, ~30 employees, growing into commercial roofs.",
    knownNeeds: ["lead follow-up speed", "after-hours coverage"],
  },
});

// 10. Proposal Agent
export const proposalAgent = defineAgent({
  id: "proposal",
  name: "Proposal Agent",
  description:
    "Generates a structured proposal: scope, deliverables, timeline, investment.",
  mode: "structured",
  inputSchema: z.object({
    clientName: z.string().min(1),
    objective: z.string().min(10),
    deliverables: z.array(z.string()).min(1),
    timelineWeeks: z.number().int().positive().max(52),
    investmentUsd: z.number().positive(),
  }),
  outputSchema: z.object({
    title: z.string(),
    executiveSummary: z.string(),
    scope: z.array(z.string()),
    timeline: z.array(
      z.object({ week: z.number().int().positive(), milestone: z.string() }),
    ),
    investmentSummary: z.string(),
    nextStep: z.string(),
  }),
  systemPrompt:
    "You write client-ready proposal copy. Crisp, concrete, no fluff. Output strict JSON.",
  buildUserMessage: (input, ctx) =>
    `${businessContextBlock(ctx)}\n\nClient: ${input.clientName}\nObjective: ${input.objective}\nDeliverables: ${input.deliverables.join("; ")}\nTimeline: ${input.timelineWeeks} weeks\nInvestment: $${input.investmentUsd}\n\nReturn JSON: title, executiveSummary, scope[], timeline[{week,milestone}], investmentSummary, nextStep.`,
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

// 11. SEO Content Agent
export const seoContentAgent = defineAgent({
  id: "seo-content",
  name: "SEO Content Agent",
  description:
    "Plans and drafts an SEO blog post: title, meta, outline, opening, internal-link suggestions.",
  mode: "structured",
  inputSchema: z.object({
    primaryKeyword: z.string().min(2),
    audience: z.string().optional(),
    intent: z.enum(["informational", "commercial", "transactional"]).default("informational"),
    desiredWordCount: z.number().int().min(300).max(3500).default(1200),
  }),
  outputSchema: z.object({
    seoTitle: z.string().max(70),
    metaDescription: z.string().max(170),
    outline: z.array(
      z.object({ heading: z.string(), bullets: z.array(z.string()) }),
    ),
    openingParagraph: z.string(),
    internalLinkIdeas: z.array(z.string()),
  }),
  systemPrompt:
    "You are an SEO editor for a small-business AI revenue platform. Plan content that ranks and converts. Output strict JSON.",
  buildUserMessage: (input, ctx) =>
    `${businessContextBlock(ctx)}\n\nPrimary keyword: ${input.primaryKeyword}\nAudience: ${input.audience ?? "small-business owners"}\nIntent: ${input.intent}\nTarget length: ~${input.desiredWordCount} words\n\nReturn JSON: seoTitle, metaDescription, outline[{heading,bullets[]}], openingParagraph, internalLinkIdeas[].`,
  smokeInput: {
    primaryKeyword: "missed call revenue recovery",
    audience: "owners of local service businesses",
    intent: "commercial",
    desiredWordCount: 1200,
  },
});

// 12. Business Assistant Agent
export const businessAssistantAgent = defineAgent({
  id: "business-assistant",
  name: "Business Assistant Agent",
  description:
    "Conversational assistant that answers business questions and recommends next actions.",
  mode: "text",
  inputSchema: z.object({
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
  }),
  outputSchema: z.object({
    summary: z.string(),
    suggestedActions: z.array(z.string()).optional(),
  }),
  systemPrompt:
    "You are the business owner's AI operations partner inside Alivio Search Cloud. Be practical, concise, and never invent metrics. If data is missing, say what's missing and suggest the next step. Tone: senior operator, calm, direct.",
  buildUserMessage: (input, ctx) =>
    `${businessContextBlock(ctx)}\n\nAssistant mode: ${input.mode}\nConversation so far:\n${(input.history ?? [])
      .map((m) => `[${m.role}] ${m.content}`)
      .join("\n") || "(none)"}\n\nUser: ${input.message}\n\nReply with a JSON object: {"summary": "<your reply>", "suggestedActions": ["..."]}.`,
  smokeInput: {
    message: "What's the highest-leverage thing I can do today?",
    history: [],
    mode: "general",
  },
});

export const ALL_AGENTS = [
  revenueLeakAgent,
  missedCallAgent,
  instantResponseAgent,
  followUpAgent,
  reactivationAgent,
  outboundSalesAgent,
  linkedinOutreachAgent,
  coldEmailAgent,
  leadResearchAgent,
  proposalAgent,
  seoContentAgent,
  businessAssistantAgent,
] as const;
