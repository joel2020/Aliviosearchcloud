import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import businessesRouter from "./businesses";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/businesses", businessesRouter);

export default router;
