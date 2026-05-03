import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import {
  usersTable,
  businessesTable,
  assistantChannelConnectionsTable,
} from "./schema";

const { Pool } = pg;

if (!process.env["DATABASE_URL"]) {
  throw new Error("DATABASE_URL must be set to seed the database.");
}

const pool = new Pool({ connectionString: process.env["DATABASE_URL"] });
const db = drizzle(pool, {
  schema: { usersTable, businessesTable, assistantChannelConnectionsTable },
});

const DEMO_USER_ID = "usr_demo_seed_0001";
const DEMO_CLERK_ID = "demo_clerk_seed_user";
const DEMO_BUSINESS_ID = "biz_demo_seed_0001";

async function main() {
  console.log("[seed] Upserting demo user…");
  await db
    .insert(usersTable)
    .values({
      id: DEMO_USER_ID,
      clerkId: DEMO_CLERK_ID,
      email: "demo@aliviosearch.cloud",
      fullName: "Alivio Demo",
      avatarUrl: null,
    })
    .onConflictDoNothing({ target: usersTable.clerkId });

  console.log("[seed] Upserting demo business…");
  await db
    .insert(businessesTable)
    .values({
      id: DEMO_BUSINESS_ID,
      ownerId: DEMO_USER_ID,
      name: "Alivio Demo Co.",
      slug: "alivio-demo-co",
      industry: "SaaS",
      websiteUrl: "https://aliviosearch.cloud",
      description:
        "Demo workspace seeded for local development and integration tests.",
      brandColor: "#22D3EE",
      logoUrl: null,
    })
    .onConflictDoNothing({ target: businessesTable.ownerId });

  const business = (
    await db
      .select()
      .from(businessesTable)
      .where(eq(businessesTable.id, DEMO_BUSINESS_ID))
      .limit(1)
  )[0];

  if (business) {
    console.log("[seed] Upserting demo channel connection…");
    await db
      .insert(assistantChannelConnectionsTable)
      .values({
        id: "acc_demo_seed_web",
        businessId: business.id,
        userId: business.ownerId,
        channel: "web",
        phoneNumber: "+10000000000",
        label: "Website widget",
        isActive: true,
        verified: true,
        config: { theme: "dark" },
      })
      .onConflictDoNothing({ target: assistantChannelConnectionsTable.id });
  }

  await pool.end();
  console.log("[seed] Done.");
}

main().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
