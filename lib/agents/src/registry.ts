import type { AgentDefinition, AgentSummary } from "./types";
import { ALL_AGENTS } from "./agents/index";
import { allAgentFormFields } from "./formFields";

const byId = new Map<string, AgentDefinition>();
for (const agent of ALL_AGENTS) {
  if (byId.has(agent.id)) {
    throw new Error(`Duplicate agent id in registry: ${agent.id}`);
  }
  byId.set(agent.id, agent as unknown as AgentDefinition);
}

// Form-field metadata parity: every agent should have form fields, and every
// declared form field must correspond to a key in the agent's Zod input
// schema. This guards against drift between `formFields.ts` and the actual
// schemas (which would cause the dynamic UI form to silently submit unknown
// fields).
{
  const fieldMap = allAgentFormFields();
  for (const agent of byId.values()) {
    const fields = fieldMap[agent.id];
    if (!fields) {
      throw new Error(
        `Missing form-field metadata for agent "${agent.id}". Add an entry in lib/agents/src/formFields.ts.`,
      );
    }
    const schemaShape = (
      agent.inputSchema as unknown as { shape?: Record<string, unknown> }
    ).shape;
    if (schemaShape && typeof schemaShape === "object") {
      const known = new Set(Object.keys(schemaShape));
      for (const f of fields) {
        if (!known.has(f.name)) {
          throw new Error(
            `Form field "${f.name}" for agent "${agent.id}" is not present in its Zod input schema.`,
          );
        }
      }
    }
  }
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
