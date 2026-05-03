import { Router, type IRouter } from "express";
import { GetPublicConfigResponse } from "@workspace/api-zod";
import { getPublicConfig } from "../lib/publicConfig";

const router: IRouter = Router();

router.get("/public", (_req, res) => {
  // Cache briefly so flipping a link in env vars rolls out within ~60s
  // without a redeploy.
  res.setHeader("Cache-Control", "public, max-age=60");
  // Validate against the generated OpenAPI Zod schema before returning, so the
  // server contract is enforced at runtime (matches the pattern used by /health).
  const data = GetPublicConfigResponse.parse(getPublicConfig());
  res.json(data);
});

export default router;
