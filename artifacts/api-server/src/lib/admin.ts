import type { RequestHandler } from "express";
import { getAuth } from "@clerk/express";

/**
 * A user is an admin if either:
 * - their Clerk user ID is present in the comma-separated `ADMIN_USER_IDS`
 *   env var, OR
 * - their Clerk session has an org-level role of `admin` / `org:admin`.
 */
export function isAdminUserId(clerkUserId: string): boolean {
  const list = (process.env["ADMIN_USER_IDS"] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.includes(clerkUserId);
}

interface AdminClaims {
  org_role?: string;
  orgRole?: string;
  role?: string;
  metadata?: { role?: string };
}

export function hasClerkAdminRole(
  sessionClaims: AdminClaims | null | undefined,
  orgRole: string | null | undefined,
): boolean {
  if (typeof orgRole === "string" && /(^|:)admin$/.test(orgRole)) return true;
  if (!sessionClaims) return false;
  const candidates = [
    sessionClaims.org_role,
    sessionClaims.orgRole,
    sessionClaims.role,
    sessionClaims.metadata?.role,
  ].filter((v): v is string => typeof v === "string");
  return candidates.some((r) => /(^|:)admin$/.test(r));
}

export const requireAdmin: RequestHandler = (req, res, next) => {
  const clerkUserId = req.clerkUserId;
  if (!clerkUserId) {
    res.status(401).json({ error: "unauthorized", message: "Not signed in" });
    return;
  }
  if (isAdminUserId(clerkUserId)) {
    next();
    return;
  }
  const auth = getAuth(req);
  const claims = (auth?.sessionClaims ?? null) as AdminClaims | null;
  const orgRole = (auth as { orgRole?: string } | null)?.orgRole ?? null;
  if (hasClerkAdminRole(claims, orgRole)) {
    next();
    return;
  }
  res.status(403).json({
    error: "forbidden",
    message:
      "Admin access required. Either grant this user a Clerk org admin role or add their Clerk user ID to ADMIN_USER_IDS.",
  });
};
