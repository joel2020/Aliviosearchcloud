import type { Request, Response, NextFunction, RequestHandler } from "express";
import { getAuth } from "@clerk/express";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      clerkUserId?: string;
    }
  }
}

export const requireAuth: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const auth = getAuth(req);
  const userId =
    (auth?.sessionClaims as { userId?: string } | undefined)?.userId ??
    auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "unauthorized", message: "Not signed in" });
    return;
  }
  req.clerkUserId = userId;
  next();
};
