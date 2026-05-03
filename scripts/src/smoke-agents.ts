/**
 * Smoke-tests every agent in `agentRegistry` against the live Azure OpenAI
 * deployment. Each agent ships a tiny `smokeInput` (defined in the agent
 * module itself) which is fed through `agent.run()` with a synthetic
 * Business + User context so we never depend on real DB seed data.
 *
 * Exits with code 0 when every agent returns `status: "ok"`, code 1 otherwise.
 *
 *     pnpm --filter @workspace/scripts run smoke-agents
 */
import { agentRegistry } from "@workspace/agents";
import {
  AzureOpenAINotConfiguredError,
  createAzureOpenAIClient,
} from "@workspace/azure-openai";
import type { Business, User } from "@workspace/db";

interface AgentResult {
  id: string;
  name: string;
  status: "ok" | "failed" | "not_configured" | "invalid_input";
  latencyMs: number;
  tokens: number;
  errorMessage?: string;
}

const COLOR_OK = "\x1b[32m";
const COLOR_FAIL = "\x1b[31m";
const COLOR_DIM = "\x1b[90m";
const COLOR_RESET = "\x1b[0m";

const fakeBusiness: Business = {
  id: "biz_smoke",
  ownerUserId: "user_smoke",
  name: "Acme Plumbing & Heating",
  industry: "Home services",
  website: "https://acme.example",
  timezone: "America/New_York",
  createdAt: new Date(),
  updatedAt: new Date(),
} as unknown as Business;

const fakeUser: User = {
  id: "user_smoke",
  clerkId: "clerk_smoke",
  email: "smoke@example.com",
  firstName: "Smoke",
  lastName: "Test",
  createdAt: new Date(),
  updatedAt: new Date(),
} as unknown as User;

const silentLog = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
};

async function main(): Promise<void> {
  let ai;
  try {
    ai = createAzureOpenAIClient();
  } catch (err) {
    if (err instanceof AzureOpenAINotConfiguredError) {
      console.error(
        `${COLOR_FAIL}✗ Azure OpenAI is not configured: ${err.message}${COLOR_RESET}`,
      );
      console.error(
        `\n  Set these in Replit Secrets and rerun:\n    - AZURE_OPENAI_DEPLOYMENT (e.g. gpt-4o-mini)\n    - AZURE_OPENAI_API_VERSION  (e.g. 2024-08-01-preview)\n`,
      );
      process.exit(2);
    }
    throw err;
  }

  const agents = agentRegistry.list();
  console.log(
    `\n${COLOR_DIM}Smoke-testing ${agents.length} agents against deployment "${ai.defaultDeployment}"…${COLOR_RESET}\n`,
  );

  const results: AgentResult[] = [];
  for (const agent of agents) {
    process.stdout.write(
      `  ${agent.id.padEnd(22)} ${COLOR_DIM}→${COLOR_RESET} `,
    );
    const ctx = { business: fakeBusiness, user: fakeUser, ai, log: silentLog };
    const r = await agent.run(agent.smokeInput, ctx);
    const ok = r.status === "ok";
    const latency = r.latencyMs;
    const tokens = r.status === "ok" ? r.tokensUsed : 0;
    results.push({
      id: agent.id,
      name: agent.name,
      status: r.status,
      latencyMs: latency,
      tokens,
      errorMessage: r.status === "ok" ? undefined : r.errorMessage,
    });
    const tag = ok
      ? `${COLOR_OK}PASS${COLOR_RESET}`
      : `${COLOR_FAIL}FAIL${COLOR_RESET}`;
    const meta = `${COLOR_DIM}${latency}ms · ${tokens} tok${COLOR_RESET}`;
    console.log(
      ok
        ? `${tag}  ${meta}`
        : `${tag}  ${meta}  ${COLOR_FAIL}${r.errorMessage?.slice(0, 80)}${COLOR_RESET}`,
    );
  }

  const passed = results.filter((r) => r.status === "ok").length;
  const failed = results.length - passed;
  console.log(
    `\n${passed === results.length ? COLOR_OK : COLOR_FAIL}${passed}/${results.length} agents passed${COLOR_RESET}\n`,
  );

  if (failed > 0) {
    console.log("Failures:");
    for (const r of results.filter((x) => x.status !== "ok")) {
      console.log(`  - ${r.id}: ${r.status} — ${r.errorMessage}`);
    }
    process.exit(1);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(`${COLOR_FAIL}smoke-agents crashed:${COLOR_RESET}`, err);
  process.exit(1);
});
