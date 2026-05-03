/**
 * Marketing-facing summaries of the 12 production AI agents.
 *
 * These mirror the IDs/names from `@workspace/agents` but are kept
 * standalone here so the public marketing bundle does not import the
 * server-side agent runner (which pulls in Azure OpenAI). The agents
 * lib remains the source of truth for execution; this file is the
 * source of truth for marketing copy.
 *
 * Keep `id` in sync with `lib/agents/src/agents/*.ts`.
 */

export type RevenuePillar = "capture" | "convert" | "scale";

export type MarketingAgent = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly outcome: string;
  readonly pillar: RevenuePillar;
};

export const MARKETING_AGENTS: readonly MarketingAgent[] = [
  {
    id: "missed-call",
    name: "Missed Call Agent",
    description:
      "Sends an instant SMS reply the moment a call goes unanswered, with a booking link and a follow-up plan so the lead never goes cold.",
    outcome:
      "Outcome: recover the 30–60% of inbound callers who would otherwise hang up at voicemail and never call back.",
    pillar: "capture",
  },
  {
    id: "instant-response",
    name: "Instant Response Agent",
    description:
      "Answers brand-new inbound leads within seconds, qualifies them, and books the next step before a competitor gets there first.",
    outcome:
      "Outcome: a sub-60-second first response on every form, chat, and DM — the single biggest predictor of who wins the deal.",
    pillar: "capture",
  },
  {
    id: "lead-research",
    name: "Lead Research Agent",
    description:
      "Synthesizes everything we know about a lead into a one-page brief — company, role, signals, and the right opening angle.",
    outcome:
      "Outcome: walk into every call already knowing the lead's business, instead of burning the first 10 minutes on discovery.",
    pillar: "capture",
  },
  {
    id: "follow-up",
    name: "Follow-Up Agent",
    description:
      "Designs a multi-touch sequence across SMS, email, and call for every open lead, with channel and timing tuned to the persona.",
    outcome:
      "Outcome: the 7–12 follow-up touches most teams never get around to — done automatically, on the right channel, at the right time.",
    pillar: "convert",
  },
  {
    id: "reactivation",
    name: "Reactivation Agent",
    description:
      "Re-engages cold leads from the past 6–18 months with a personalized win-back, surfacing forgotten pipeline you already paid for.",
    outcome:
      "Outcome: turn a stale CRM into a fresh pipeline of warm replies — without spending another dollar on ads.",
    pillar: "convert",
  },
  {
    id: "proposal",
    name: "Proposal Agent",
    description:
      "Generates structured proposals — scope, deliverables, timeline, investment — in minutes instead of days.",
    outcome:
      "Outcome: send the proposal the same day the prospect asks, while the buying intent is still hot.",
    pillar: "convert",
  },
  {
    id: "business-assistant",
    name: "Business Assistant Agent",
    description:
      "Your conversational COO. Ask it about pipeline, follow-ups due today, revenue leaks to fix, or what to do next.",
    outcome:
      "Outcome: a single place to ask 'what should I work on right now?' and get an answer grounded in your real data.",
    pillar: "convert",
  },
  {
    id: "outbound-sales",
    name: "Outbound Sales Agent",
    description:
      "Builds a target list profile and a 4-step outbound sequence for a defined ICP — ready to launch the same day.",
    outcome:
      "Outcome: a working outbound motion in days, not the 3–6 months it takes to hire and ramp an SDR.",
    pillar: "scale",
  },
  {
    id: "linkedin-outreach",
    name: "LinkedIn Outreach Agent",
    description:
      "Writes a personalized connection request and follow-up DM that actually sounds like you, not a script.",
    outcome:
      "Outcome: open conversations with target buyers on LinkedIn without the cringe of obvious automation.",
    pillar: "scale",
  },
  {
    id: "cold-email",
    name: "Cold Email Agent",
    description:
      "Drafts a tight, personalized cold email — subject, body, and CTA — built around a real signal, not a template.",
    outcome:
      "Outcome: cold emails that earn replies because they reference something real about the prospect, not a {{first_name}} merge.",
    pillar: "scale",
  },
  {
    id: "seo-content",
    name: "SEO Content Agent",
    description:
      "Plans and drafts SEO blog posts: title, meta, outline, opening, internal links — wired to your real revenue topics.",
    outcome:
      "Outcome: a steady drumbeat of search-optimized content that compounds into organic pipeline over time.",
    pillar: "scale",
  },
  {
    id: "revenue-leak",
    name: "Revenue Leak Agent",
    description:
      "Identifies the highest-impact revenue leaks in your business and ranks them by how much money each is costing you per month.",
    outcome:
      "Outcome: a prioritized fix list — usually 3–5 leaks worth five figures a month each — instead of guessing where to focus.",
    pillar: "scale",
  },
] as const;

export const PILLARS: Record<
  RevenuePillar,
  { label: string; tagline: string }
> = {
  capture: {
    label: "Capture Revenue",
    tagline: "Catch every lead the moment it arrives — even at 11pm on Sunday.",
  },
  convert: {
    label: "Convert Revenue",
    tagline:
      "Follow up with everyone, every time, until they buy or say no.",
  },
  scale: {
    label: "Scale Revenue",
    tagline:
      "Generate new pipeline on autopilot across outbound, SEO, and reactivation.",
  },
};

export function agentsByPillar(pillar: RevenuePillar): MarketingAgent[] {
  return MARKETING_AGENTS.filter((a) => a.pillar === pillar);
}
