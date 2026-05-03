import type { Business } from "@workspace/db";

export function serializeBusiness(b: Business) {
  return {
    id: b.id,
    ownerId: b.ownerId,
    name: b.name,
    slug: b.slug,
    industry: b.industry,
    websiteUrl: b.websiteUrl,
    description: b.description,
    brandColor: b.brandColor,
    logoUrl: b.logoUrl,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}
