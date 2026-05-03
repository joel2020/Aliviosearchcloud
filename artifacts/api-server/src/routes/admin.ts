import { Router, type IRouter } from "express";
import { agentRegistry } from "@workspace/agents";
import { requireAuth } from "../middlewares/requireAuth";
import { requireAdmin } from "../lib/admin";
import { ensureUser, ensureBusiness } from "../lib/ensure";
import { executeAgentRun } from "../lib/executeAgentRun";

const router: IRouter = Router();

function previewOutput(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  try {
    const text = typeof value === "string" ? value : JSON.stringify(value);
    return text.length > 280 ? `${text.slice(0, 280)}…` : text;
  } catch {
    return String(value);
  }
}

router.post(
  "/agents/smoke-test",
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    const log = req.log;
    try {
      const user = await ensureUser(req.clerkUserId!);
      const business = await ensureBusiness(
        user.id,
        "Admin smoke-test workspace",
      );

      const startedAt = new Date();
      const results: Array<{
        id: string;
        name: string;
        status: "pass" | "fail" | "not_configured";
        latencyMs: number;
        error?: string | null;
        preview?: string | null;
      }> = [];

      for (const agent of agentRegistry.list()) {
        const t0 = Date.now();
        try {
          const { run, latencyMs } = await executeAgentRun({
            agent,
            rawInput: agent.smokeInput,
            user,
            business,
            log,
          });
          const status: "pass" | "fail" | "not_configured" =
            run.status === "ok"
              ? "pass"
              : run.status === "not_configured"
                ? "not_configured"
                : "fail";
          results.push({
            id: agent.id,
            name: agent.name,
            status,
            latencyMs,
            error: run.errorMessage ?? null,
            preview: status === "pass" ? previewOutput(run.output) : null,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          log.error(
            { agentId: agent.id, err: message },
            "agent_smoke_test_unexpected_error",
          );
          results.push({
            id: agent.id,
            name: agent.name,
            status: "fail",
            latencyMs: Date.now() - t0,
            error: `Unhandled error: ${message}`,
            preview: null,
          });
        }
      }

      const passed = results.filter((r) => r.status === "pass").length;
      const failed = results.filter((r) => r.status === "fail").length;
      const notConfigured = results.filter(
        (r) => r.status === "not_configured",
      ).length;

      log.info(
        { passed, failed, notConfigured, total: results.length },
        "admin_smoke_test_complete",
      );

      res.json({
        runAt: startedAt.toISOString(),
        passed,
        failed,
        notConfigured,
        results,
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
