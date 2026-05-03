import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  AzureOpenAINotConfiguredError,
  getAzureOpenAIConfig,
} from "@workspace/azure-openai";

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

  // Stripe / Cal / Twilio status reflect actual env presence so this endpoint
  // accurately mirrors deployment state. They will report `configured` as
  // soon as the downstream tasks (Stripe billing, messaging) wire credentials.
  const stripe: StatusValue = process.env["STRIPE_SECRET_KEY"]
    ? "configured"
    : "not_configured";
  const calLink: StatusValue =
    process.env["CAL_LINK"] || process.env["VITE_CAL_LINK"]
      ? "configured"
      : "not_configured";
  const twilio: StatusValue =
    process.env["TWILIO_ACCOUNT_SID"] && process.env["TWILIO_AUTH_TOKEN"]
      ? "configured"
      : "not_configured";
  const whatsapp: StatusValue = process.env["TWILIO_WHATSAPP_FROM"]
    ? "configured"
    : "not_configured";

  res.json({
    api: "ok",
    database,
    ai_provider: aiProvider,
    stripe,
    cal_link: calLink,
    messaging: { twilio, whatsapp },
  });
});

export default router;
