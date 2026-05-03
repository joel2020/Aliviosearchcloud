import type { RequestHandler } from "express";
import { getAuth } from "@clerk/express";

/**
 * Admin authorization is intentionally narrow. A user is admin if either:
 *   1. their Clerk user ID is listed in the comma-separated `ADMIN_USER_IDS`
 *      env allowlist, OR
 *   2. their active Clerk session has an org role of `admin` / `org:admin`
 *      (Clerk's `auth.orgRole`, which is only populated when the user is
 *      acting inside an organization context).
 *
 * We deliberately do NOT trust generic claims like `sessionClaims.role` or
 * `sessionClaims.metadata.role`, because those can be set from public/user
 * metadata and would create a privilege-escalation path.
 */
export function isAdminUserId(clerkUserId: string): boolean {
  const list = (process.env["ADMIN_USER_IDS"] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.includes(clerkUserId);
}

export function isClerkOrgAdminRole(
  orgRole: string | null | undefined,
): boolean {
  if (typeof orgRole !== "string") return false;
  return /(^|:)admin$/.test(orgRole);
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
  const auth = getAuth(req) as { orgRole?: string | null } | null;
  if (isClerkOrgAdminRole(auth?.orgRole ?? null)) {
    next();
    return;
  }
  res.status(403).json({
    error: "forbidden",
    message:
      "Admin access required. Either grant this user a Clerk org admin role or add their Clerk user ID to ADMIN_USER_IDS.",
  });
};
