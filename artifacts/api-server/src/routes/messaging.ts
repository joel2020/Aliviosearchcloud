/**
 * Twilio WhatsApp/SMS messaging routes.
 *
 * iMESSAGE NOTE:
 *  iMessage does NOT have a public business API equivalent to Twilio
 *  WhatsApp/SMS. Production iMessage support requires Apple Business
 *  Messages approval (Apple's enterprise messaging program) or routing
 *  through a third-party broker that holds that approval. Until then,
 *  this server intentionally does not expose any iMessage send/receive
 *  surface. The frontend renders an "iMessage coming soon" placeholder.
 */

import { Router, type IRouter } from "express";
import express from "express";
import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import twilio from "twilio";
import {
  db,
  assistantChannelConnectionsTable,
  assistantConversationsTable,
  assistantMessagesTable,
  agentRunsTable,
  type AssistantChannelConnection,
} from "@workspace/db";
import { agentRegistry } from "@workspace/agents";
import {
  CreateMessagingConnectionBody,
  VerifyMessagingConnectionBody,
  VerifyMessagingConnectionParams,
  DeleteMessagingConnectionParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { ensureUser, ensureBusiness } from "../lib/ensure";
import { executeAgentRun } from "../lib/executeAgentRun";
import { shortId } from "../lib/ids";
import { getTwilioConfig, isChannelAvailable } from "../lib/messagingConfig";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

const VERIFICATION_TTL_MS = 10 * 60 * 1000;
const E164_RE = /^\+[1-9]\d{6,14}$/;

function normalizePhone(raw: string): string | null {
  // Accept common pretty-printed formats — "+1 (415) 555-1234" → "+14155551234".
  const stripped = raw.trim().replace(/[\s\-().]/g, "");
  if (!E164_RE.test(stripped)) return null;
  return stripped;
}

// Per-user OTP send rate limit to protect Twilio spend from abuse.
const OTP_LIMIT_PER_HOUR = 10;
const OTP_WINDOW_MS = 60 * 60 * 1000;
const otpBuckets = new Map<string, number[]>();
function consumeOtpToken(userId: string): boolean {
  const now = Date.now();
  const arr = (otpBuckets.get(userId) ?? []).filter(
    (t) => now - t < OTP_WINDOW_MS,
  );
  if (arr.length >= OTP_LIMIT_PER_HOUR) {
    otpBuckets.set(userId, arr);
    return false;
  }
  arr.push(now);
  otpBuckets.set(userId, arr);
  return true;
}

function stripWhatsAppPrefix(raw: string): {
  channel: "whatsapp" | "sms";
  number: string;
} {
  if (raw.startsWith("whatsapp:")) {
    return { channel: "whatsapp", number: raw.slice("whatsapp:".length) };
  }
  return { channel: "sms", number: raw };
}

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function generateOtp(): string {
  // Cryptographically random 6-digit numeric code
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

function serializeConnection(c: AssistantChannelConnection) {
  return {
    id: c.id,
    businessId: c.businessId,
    userId: c.userId,
    channel: c.channel as "whatsapp" | "sms",
    phoneNumber: c.phoneNumber,
    label: c.label,
    verified: c.verified,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Inbound webhook: Twilio posts application/x-www-form-urlencoded.
// Mounted with its own body parser so signature verification works against
// the raw form body Twilio actually signed.
// ────────────────────────────────────────────────────────────────────────────
router.post(
  "/twilio/inbound",
  express.urlencoded({ extended: false }),
  async (req, res) => {
    const log = req.log;
    const cfg = getTwilioConfig();

    // Safe degradation: if Twilio isn't configured, return empty TwiML
    // (200 OK) instead of crashing — Twilio retries on non-2xx.
    if (!cfg) {
      log.warn("twilio inbound: messaging not configured, returning empty TwiML");
      res.type("text/xml").status(200).send("<Response/>");
      return;
    }

    // Signature verification — protect against forged inbound messages.
    // The bypass flag is honored only when NODE_ENV !== "production" so a
    // misconfigured prod env can never accidentally accept unsigned traffic.
    const skipSig =
      process.env["TWILIO_SKIP_SIGNATURE_CHECK"] === "1" &&
      process.env["NODE_ENV"] !== "production";
    if (!skipSig) {
      const signature = req.header("X-Twilio-Signature") ?? "";
      // Prefer PUBLIC_APP_URL (the URL configured in the Twilio console) so
      // signature verification is robust to proxy/header rewriting. Fall back
      // to reconstructing from forwarded headers when not set.
      let url: string;
      if (cfg.publicAppUrl) {
        url = `${cfg.publicAppUrl.replace(/\/+$/, "")}${req.originalUrl}`;
      } else {
        const proto =
          (req.header("x-forwarded-proto") ?? req.protocol) || "https";
        const host = req.header("x-forwarded-host") ?? req.get("host") ?? "";
        url = `${proto}://${host}${req.originalUrl}`;
      }
      const params = (req.body ?? {}) as Record<string, string>;
      const valid = twilio.validateRequest(
        cfg.authToken,
        signature,
        url,
        params,
      );
      if (!valid) {
        log.warn({ url }, "twilio inbound: signature verification failed");
        res.status(403).type("text/xml").send("<Response/>");
        return;
      }
    }

    const body = (req.body ?? {}) as Record<string, string>;
    const fromRaw = body["From"] ?? "";
    const toRaw = body["To"] ?? "";
    const messageBody = (body["Body"] ?? "").trim();
    const { channel, number: fromNumber } = stripWhatsAppPrefix(fromRaw);

    if (!fromNumber || !messageBody) {
      res.type("text/xml").status(200).send("<Response/>");
      return;
    }

    // Lookup verified connection by (channel, phone). One Twilio number per
    // business — route purely by inbound From.
    const conns = await db
      .select()
      .from(assistantChannelConnectionsTable)
      .where(
        and(
          eq(assistantChannelConnectionsTable.channel, channel),
          eq(assistantChannelConnectionsTable.phoneNumber, fromNumber),
          eq(assistantChannelConnectionsTable.verified, true),
        ),
      )
      .limit(1);
    const conn = conns[0];
    if (!conn) {
      log.info({ from: fromNumber, channel }, "twilio inbound: no matching connection");
      const tw = new twilio.twiml.MessagingResponse();
      tw.message(
        "This number isn't connected to an Alivio Business Assistant. Connect it from your dashboard settings.",
      );
      res.type("text/xml").status(200).send(tw.toString());
      return;
    }

    // Find or create a conversation per (business, channel).
    const existingConvs = await db
      .select()
      .from(assistantConversationsTable)
      .where(
        and(
          eq(assistantConversationsTable.businessId, conn.businessId),
          eq(assistantConversationsTable.userId, conn.userId),
          eq(assistantConversationsTable.channel, channel),
        ),
      )
      .orderBy(desc(assistantConversationsTable.updatedAt))
      .limit(1);
    let conv = existingConvs[0];
    if (!conv) {
      const inserted = await db
        .insert(assistantConversationsTable)
        .values({
          id: shortId("conv"),
          businessId: conn.businessId,
          userId: conn.userId,
          title: channel === "whatsapp" ? "WhatsApp" : "SMS",
          channel,
          agentMode: "general",
        })
        .returning();
      conv = inserted[0]!;
    }

    // Persist inbound user message.
    await db.insert(assistantMessagesTable).values({
      id: shortId("msg"),
      conversationId: conv.id,
      userId: conn.userId,
      businessId: conn.businessId,
      channel,
      role: "user",
      content: messageBody,
      agentMode: "general",
      metadata: { from: fromRaw, to: toRaw },
    });

    // Run the Business Assistant.
    const agent = agentRegistry.get("business-assistant");
    let reply = "Sorry — the assistant isn't available right now. Please try again shortly.";
    if (agent) {
      const recentRunRows = await db
        .select()
        .from(agentRunsTable)
        .where(eq(agentRunsTable.businessId, conn.businessId))
        .orderBy(desc(agentRunsTable.startedAt))
        .limit(5);
      const recentRuns = recentRunRows.map((r) => {
        const out = (r.output ?? {}) as { summary?: string };
        return {
          agentSlug: r.agentSlug,
          status: r.status,
          completedAt: r.completedAt ? r.completedAt.toISOString() : null,
          summary:
            typeof out.summary === "string" ? out.summary.slice(0, 240) : "",
        };
      });
      try {
        const user = { id: conn.userId } as Parameters<
          typeof executeAgentRun
        >[0]["user"];
        const business = { id: conn.businessId } as Parameters<
          typeof executeAgentRun
        >[0]["business"];
        const { run } = await executeAgentRun({
          agent,
          rawInput: {
            message: messageBody,
            history: [],
            mode: "general",
            recentRuns,
          },
          user,
          business,
          log,
        });
        if (run.status === "ok") {
          const out = (run.output ?? {}) as { summary?: string };
          if (typeof out.summary === "string" && out.summary.trim()) {
            reply = out.summary.trim();
          }
        } else if (run.status === "not_configured") {
          reply = "The assistant isn't configured yet. Please contact support.";
        }
      } catch (err) {
        log.error({ err }, "twilio inbound: assistant run failed");
      }
    }

    // Persist assistant reply.
    await db.insert(assistantMessagesTable).values({
      id: shortId("msg"),
      conversationId: conv.id,
      userId: conn.userId,
      businessId: conn.businessId,
      channel,
      role: "assistant",
      content: reply,
      agentMode: "general",
      metadata: { via: "twilio" },
    });

    await db
      .update(assistantConversationsTable)
      .set({ updatedAt: new Date() })
      .where(eq(assistantConversationsTable.id, conv.id));

    // Reply via TwiML — Twilio sends this back over the same channel.
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(reply);
    res.type("text/xml").status(200).send(twiml.toString());
  },
);

// ────────────────────────────────────────────────────────────────────────────
// Channel-connection CRUD (authenticated dashboard flows).
// ────────────────────────────────────────────────────────────────────────────

router.get("/connections", requireAuth, async (req, res, next) => {
  try {
    const user = await ensureUser(req.clerkUserId!);
    const business = await ensureBusiness(user.id, "My business");
    const rows = await db
      .select()
      .from(assistantChannelConnectionsTable)
      .where(
        and(
          eq(assistantChannelConnectionsTable.businessId, business.id),
          eq(assistantChannelConnectionsTable.userId, user.id),
        ),
      )
      .orderBy(desc(assistantChannelConnectionsTable.createdAt));
    res.json(
      rows
        .filter((r) => r.channel === "whatsapp" || r.channel === "sms")
        .map(serializeConnection),
    );
  } catch (err) {
    next(err);
  }
});

router.post("/connections", requireAuth, async (req, res, next) => {
  try {
    const body = CreateMessagingConnectionBody.safeParse(req.body ?? {});
    if (!body.success) {
      res.status(400).json({
        error: "invalid_body",
        message: body.error.issues.map((i) => i.message).join(", "),
      });
      return;
    }
    const cfg = getTwilioConfig();
    if (!cfg) {
      res.status(503).json({
        error: "messaging_not_configured",
        message:
          "Messaging is not configured. Twilio credentials are missing on the server.",
      });
      return;
    }
    const channel = body.data.channel;
    if (!isChannelAvailable(channel)) {
      res.status(503).json({
        error: "channel_not_configured",
        message:
          channel === "whatsapp"
            ? "WhatsApp is not configured (TWILIO_WHATSAPP_FROM is missing)."
            : "SMS is not configured (TWILIO_SMS_FROM is missing).",
      });
      return;
    }
    const phoneNumber = normalizePhone(body.data.phoneNumber);
    if (!phoneNumber) {
      res.status(400).json({
        error: "invalid_phone",
        message: "Phone must be in E.164 format, e.g. +14155551234.",
      });
      return;
    }

    const user = await ensureUser(req.clerkUserId!);
    const business = await ensureBusiness(user.id, "My business");

    if (!consumeOtpToken(user.id)) {
      res.status(429).json({
        error: "rate_limited",
        message: `Too many verification attempts. Please wait an hour before requesting more codes (limit ${OTP_LIMIT_PER_HOUR}/hour).`,
      });
      return;
    }

    // Reject if (channel, phone) is already taken (unique idx will also enforce).
    const existing = await db
      .select()
      .from(assistantChannelConnectionsTable)
      .where(
        and(
          eq(assistantChannelConnectionsTable.channel, channel),
          eq(assistantChannelConnectionsTable.phoneNumber, phoneNumber),
        ),
      )
      .limit(1);
    if (existing[0] && existing[0].businessId !== business.id) {
      res.status(409).json({
        error: "phone_taken",
        message: "That phone number is already connected to another workspace.",
      });
      return;
    }

    const code = generateOtp();
    const codeHash = hashCode(code);
    const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);

    let row: AssistantChannelConnection;
    if (existing[0] && existing[0].businessId === business.id) {
      // Re-issue OTP for an existing pending connection
      const updated = await db
        .update(assistantChannelConnectionsTable)
        .set({
          userId: user.id,
          label: body.data.label ?? existing[0].label ?? null,
          verified: false,
          verificationCodeHash: codeHash,
          verificationExpiresAt: expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(assistantChannelConnectionsTable.id, existing[0].id))
        .returning();
      row = updated[0]!;
    } else {
      const inserted = await db
        .insert(assistantChannelConnectionsTable)
        .values({
          id: shortId("acc"),
          businessId: business.id,
          userId: user.id,
          channel,
          phoneNumber,
          label: body.data.label ?? null,
          isActive: true,
          verified: false,
          verificationCodeHash: codeHash,
          verificationExpiresAt: expiresAt,
          config: {},
        })
        .returning();
      row = inserted[0]!;
    }

    // Send OTP via Twilio.
    try {
      const client = twilio(cfg.accountSid, cfg.authToken);
      const from =
        channel === "whatsapp"
          ? `whatsapp:${cfg.whatsappFrom}`
          : (cfg.smsFrom as string);
      const to =
        channel === "whatsapp" ? `whatsapp:${phoneNumber}` : phoneNumber;
      await client.messages.create({
        from,
        to,
        body: `Your Alivio verification code is ${code}. It expires in 10 minutes.`,
      });
    } catch (err) {
      req.log.error({ err }, "twilio: failed to send verification OTP");
      res.status(502).json({
        error: "send_failed",
        message:
          "Couldn't send the verification code. Double-check the phone number and try again.",
      });
      return;
    }

    res.json(serializeConnection(row));
  } catch (err) {
    next(err);
  }
});

router.post("/connections/:id/verify", requireAuth, async (req, res, next) => {
  try {
    const params = VerifyMessagingConnectionParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({
        error: "invalid_params",
        message: params.error.issues.map((i) => i.message).join(", "),
      });
      return;
    }
    const id = params.data.id;
    const body = VerifyMessagingConnectionBody.safeParse(req.body ?? {});
    if (!body.success) {
      res.status(400).json({
        error: "invalid_body",
        message: body.error.issues.map((i) => i.message).join(", "),
      });
      return;
    }
    const code = body.data.code.trim();
    if (!/^\d{6}$/.test(code)) {
      res.status(400).json({
        error: "invalid_code",
        message: "Enter the 6-digit code we sent you.",
      });
      return;
    }

    const user = await ensureUser(req.clerkUserId!);
    const business = await ensureBusiness(user.id, "My business");
    const rows = await db
      .select()
      .from(assistantChannelConnectionsTable)
      .where(
        and(
          eq(assistantChannelConnectionsTable.id, id),
          eq(assistantChannelConnectionsTable.businessId, business.id),
          eq(assistantChannelConnectionsTable.userId, user.id),
        ),
      )
      .limit(1);
    const row = rows[0];
    if (!row) {
      res.status(404).json({
        error: "not_found",
        message: "Connection not found.",
      });
      return;
    }
    if (row.verified) {
      res.json(serializeConnection(row));
      return;
    }
    if (
      !row.verificationCodeHash ||
      !row.verificationExpiresAt ||
      row.verificationExpiresAt.getTime() < Date.now()
    ) {
      res.status(400).json({
        error: "code_expired",
        message: "That code expired. Request a new one.",
      });
      return;
    }
    const expected = Buffer.from(row.verificationCodeHash, "hex");
    const got = Buffer.from(hashCode(code), "hex");
    const ok =
      expected.length === got.length && crypto.timingSafeEqual(expected, got);
    if (!ok) {
      res.status(400).json({
        error: "wrong_code",
        message: "That code didn't match. Try again.",
      });
      return;
    }

    const updated = await db
      .update(assistantChannelConnectionsTable)
      .set({
        verified: true,
        verificationCodeHash: null,
        verificationExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(assistantChannelConnectionsTable.id, row.id))
      .returning();
    res.json(serializeConnection(updated[0]!));
  } catch (err) {
    next(err);
  }
});

router.delete("/connections/:id", requireAuth, async (req, res, next) => {
  try {
    const params = DeleteMessagingConnectionParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({
        error: "invalid_params",
        message: params.error.issues.map((i) => i.message).join(", "),
      });
      return;
    }
    const id = params.data.id;
    const user = await ensureUser(req.clerkUserId!);
    const business = await ensureBusiness(user.id, "My business");
    const deleted = await db
      .delete(assistantChannelConnectionsTable)
      .where(
        and(
          eq(assistantChannelConnectionsTable.id, id),
          eq(assistantChannelConnectionsTable.businessId, business.id),
          eq(assistantChannelConnectionsTable.userId, user.id),
        ),
      )
      .returning({ id: assistantChannelConnectionsTable.id });
    if (!deleted[0]) {
      res.status(404).json({ error: "not_found", message: "Connection not found." });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
