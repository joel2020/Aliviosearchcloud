import { Router, type IRouter } from "express";
import { agentRegistry } from "@workspace/agents";
import { RunAgentParams, RunAgentBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { ensureUser, ensureBusiness } from "../lib/ensure";
import { serializeAgentRun } from "../lib/agentRunStore";
import { executeAgentRun } from "../lib/executeAgentRun";

const router: IRouter = Router();

router.get("/", requireAuth, (_req, res) => {
  res.json(agentRegistry.summaries());
});

router.post("/:id/run", requireAuth, async (req, res, next) => {
  try {
    const params = RunAgentParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({
        error: "invalid_params",
        message: params.error.issues.map((i) => i.message).join(", "),
      });
      return;
    }
    const body = RunAgentBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({
        error: "invalid_body",
        message: body.error.issues.map((i) => i.message).join(", "),
      });
      return;
    }
    const id = params.data.id;
    const agent = agentRegistry.get(id);
    if (!agent) {
      res
        .status(404)
        .json({ error: "agent_not_found", message: `Unknown agent id: ${id}` });
      return;
    }
    const user = await ensureUser(req.clerkUserId!);
    const business = await ensureBusiness(user.id, "My business");

    const { run } = await executeAgentRun({
      agent,
      rawInput: body.data.input,
      user,
      business,
      log: req.log,
    });
    res.json(serializeAgentRun(run));
  } catch (err) {
    next(err);
  }
});

export default router;
