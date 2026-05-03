import type { AgentDefinition, AgentSummary } from "./types";
import { ALL_AGENTS } from "./agents/index";

const byId = new Map<string, AgentDefinition>();
for (const agent of ALL_AGENTS) {
  if (byId.has(agent.id)) {
    throw new Error(`Duplicate agent id in registry: ${agent.id}`);
  }
  byId.set(agent.id, agent as unknown as AgentDefinition);
}

export const agentRegistry = {
  list(): AgentDefinition[] {
    return Array.from(byId.values());
  },
  get(id: string): AgentDefinition | undefined {
    return byId.get(id);
  },
  has(id: string): boolean {
    return byId.has(id);
  },
  summaries(): AgentSummary[] {
    return Array.from(byId.values()).map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      mode: a.mode,
    }));
  },
};
