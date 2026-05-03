import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
} from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

const allowedOrigins = (process.env["CORS_ALLOWED_ORIGINS"] ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const replitDomains = (process.env["REPLIT_DOMAINS"] ?? "")
  .split(",")
  .map((d) => d.trim())
  .filter(Boolean)
  .map((d) => `https://${d}`);
const corsAllowlist = new Set([
  ...allowedOrigins,
  ...replitDomains,
  ...(process.env["REPLIT_DEV_DOMAIN"]
    ? [`https://${process.env["REPLIT_DEV_DOMAIN"]}`]
    : []),
]);

app.use(
  cors({
    credentials: true,
    origin(origin, cb) {
      // Same-origin / curl / server-to-server have no Origin header.
      if (!origin) return cb(null, true);
      if (corsAllowlist.has(origin)) return cb(null, true);
      return cb(null, false);
    },
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  clerkMiddleware({
    publishableKey: process.env["CLERK_PUBLISHABLE_KEY"],
    secretKey: process.env["CLERK_SECRET_KEY"],
  }),
);

app.use("/api", router);

export default app;
