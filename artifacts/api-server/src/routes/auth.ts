import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { ensureUser } from "../lib/ensure";

const router: IRouter = Router();

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await ensureUser(req.clerkUserId!);
    res.json({
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
