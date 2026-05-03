import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  AzureOpenAINotConfiguredError,
  getAzureOpenAIConfig,
} from "@workspace/azure-openai";
import { getPublicConfig } from "../lib/publicConfig";
import { getMessagingPublicStatus } from "../lib/messagingConfig";

const router: IRouter = Router();

type StatusValue = "ok" | "configured" | "not_configured" | "error";

router.get("/", async (req, res) => {
  const log = req.log;

  let database: StatusValue = "not_configured";
  if (process.env["DATABASE_URL"]) {
    try {
      await db.execute(sql`select 1 as ok`);
      database = "ok";
    } catch (err) {
      log.error({ err }, "status: database probe failed");
      database = "error";
    }
  }

  let aiProvider: StatusValue = "not_configured";
  try {
    getAzureOpenAIConfig();
    aiProvider = "configured";
  } catch (err) {
    if (!(err instanceof AzureOpenAINotConfiguredError)) {
      log.error({ err }, "status: ai probe errored");
      aiProvider = "error";
    }
  }

  // Stripe / Cal status come from the same source of truth as
  // /api/config/public so the dashboard and the customer-facing CTAs cannot
  // disagree.
  const publicConfig = getPublicConfig();
  const stripe: StatusValue = publicConfig.status.stripe;
  const calLink: StatusValue = publicConfig.status.cal;
  // Messaging status comes from the same source of truth as the messaging
  // routes so the dashboard, /api/status, and the actual webhook cannot
  // disagree about whether Twilio is configured.
  const messaging = getMessagingPublicStatus();

  res.json({
    api: "ok",
    database,
    ai_provider: aiProvider,
    stripe,
    cal_link: calLink,
    messaging: {
      twilio: messaging.twilio satisfies StatusValue,
      whatsapp: messaging.whatsapp satisfies StatusValue,
      sms: messaging.sms satisfies StatusValue,
    },
  });
});

export default router;
