import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import businessesRouter from "./businesses";
import agentsRouter from "./agents";
import agentRunsRouter from "./agentRuns";
import statusRouter from "./status";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/status", statusRouter);
router.use("/auth", authRouter);
router.use("/businesses", businessesRouter);
router.use("/agents", agentsRouter);
router.use("/agent-runs", agentRunsRouter);
router.use("/admin", adminRouter);

export default router;
