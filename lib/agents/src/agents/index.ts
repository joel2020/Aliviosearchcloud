import type { AgentDefinition } from "../types";
import { revenueLeakAgent } from "./revenueLeak";
import { missedCallAgent } from "./missedCall";
import { instantResponseAgent } from "./instantResponse";
import { followUpAgent } from "./followUp";
import { reactivationAgent } from "./reactivation";
import { outboundSalesAgent } from "./outboundSales";
import { linkedinOutreachAgent } from "./linkedinOutreach";
import { coldEmailAgent } from "./coldEmail";
import { leadResearchAgent } from "./leadResearch";
import { proposalAgent } from "./proposal";
import { seoContentAgent } from "./seoContent";
import { businessAssistantAgent } from "./businessAssistant";

export const ALL_AGENTS: readonly AgentDefinition[] = [
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

export {
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
};
