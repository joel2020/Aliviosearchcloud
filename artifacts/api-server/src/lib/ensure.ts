import { eq } from "drizzle-orm";
import { clerkClient } from "@clerk/express";
import {
  db,
  usersTable,
  businessesTable,
  type User,
  type Business,
} from "@workspace/db";
import { shortId, slugify } from "./ids";

export async function ensureUser(clerkId: string): Promise<User> {
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId))
    .limit(1);
  if (existing[0]) return existing[0];

  const clerkUser = await clerkClient.users.getUser(clerkId);
  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress ??
    `${clerkId}@unknown.local`;
  const fullName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

  const inserted = await db
    .insert(usersTable)
    .values({
      id: shortId("usr"),
      clerkId,
      email,
      fullName,
      avatarUrl: clerkUser.imageUrl ?? null,
    })
    .onConflictDoNothing({ target: usersTable.clerkId })
    .returning();
  if (inserted[0]) return inserted[0];

  // Lost the race — another concurrent request created it. Re-read.
  const reread = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId))
    .limit(1);
  if (!reread[0]) {
    throw new Error("ensureUser: row missing after conflict");
  }
  return reread[0];
}

export async function ensureBusiness(
  userId: string,
  displayName: string,
): Promise<Business> {
  const existing = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.ownerId, userId))
    .limit(1);
  if (existing[0]) return existing[0];

  const baseSlug = slugify(displayName);
  const slug = `${baseSlug}-${shortId("", 4).slice(1)}`;

  const inserted = await db
    .insert(businessesTable)
    .values({
      id: shortId("biz"),
      ownerId: userId,
      name: displayName || "My business",
      slug,
    })
    .onConflictDoNothing({ target: businessesTable.ownerId })
    .returning();
  if (inserted[0]) return inserted[0];

  const reread = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.ownerId, userId))
    .limit(1);
  if (!reread[0]) {
    throw new Error("ensureBusiness: row missing after conflict");
  }
  return reread[0];
}
