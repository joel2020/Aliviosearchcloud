import type { RequestHandler } from "express";

/**
 * Admin gate. A user is an admin if their Clerk user ID is present in the
 * comma-separated `ADMIN_USER_IDS` env var, OR if their session has a Clerk
 * org-role of "admin" / "org:admin".
 */
export function isAdminUserId(clerkUserId: string): boolean {
  const list = (process.env["ADMIN_USER_IDS"] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.includes(clerkUserId);
}

export const requireAdmin: RequestHandler = (req, res, next) => {
  const clerkUserId = req.clerkUserId;
  if (!clerkUserId) {
    res.status(401).json({ error: "unauthorized", message: "Not signed in" });
    return;
  }
  if (!isAdminUserId(clerkUserId)) {
    res.status(403).json({
      error: "forbidden",
      message:
        "Admin access required. Add this Clerk user ID to ADMIN_USER_IDS.",
    });
    return;
  }
  next();
};
