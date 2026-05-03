import { Router, type IRouter } from "express";
import { getPublicConfig } from "../lib/publicConfig";

const router: IRouter = Router();

router.get("/public", (_req, res) => {
  // Cache briefly so flipping a link in env vars rolls out within ~60s
  // without a redeploy.
  res.setHeader("Cache-Control", "public, max-age=60");
  res.json(getPublicConfig());
});

export default router;
