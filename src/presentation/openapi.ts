import {
  extendZodWithOpenApi,
  OpenAPIRegistry,
  OpenApiGeneratorV31,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);
import {
  costOptionSchema,
  extracurricularTypeSchema,
  listingCategorySchema,
  listingsSortSchema,
} from "../domain/schemas/listings.js";
import { listingStatusSchema } from "../domain/schemas/listingAdmin.js";
import {
  broadcastBodySchema,
  subscribeBodySchema,
} from "../domain/schemas/newsletter.js";
import {
  createTestimonialBodySchema,
  updateTestimonialBodySchema,
} from "../domain/schemas/testimonials.js";
import { listingImageUploadBodySchema } from "../domain/schemas/uploads.js";
import { userRoleSchema } from "../domain/schemas/userAdmin.js";

export function buildOpenApiDocument(): unknown {
  const registry = new OpenAPIRegistry();

  // Shared schemas
  const listingSchema = registry.register(
    "Listing",
    z.object({
      id: z.string(),
      title: z.string(),
      org: z.string(),
      location: z.string(),
      region: z.string(),
      description: z.string(),
      image: z.string(),
      category: listingCategorySchema,
      badge: z.string(),
      footer: z.string(),
      deadline: z.string().optional(),
      type: extracurricularTypeSchema.optional(),
      cost: costOptionSchema.optional(),
      grades: z.array(z.number().int()).optional(),
      tags: z.array(z.string()).optional(),
    }),
  );

  const userSchema = registry.register(
    "User",
    z.object({
      id: z.string(),
      email: z.string(),
      name: z.string().nullable(),
      role: userRoleSchema,
      emailVerified: z.boolean(),
      createdAt: z.string(),
      updatedAt: z.string(),
    }),
  );

  const errorSchema = registry.register(
    "Error",
    z.object({
      error: z.object({
        message: z.string(),
        code: z.string(),
        details: z.unknown().optional(),
      }),
    }),
  );

  const envelope = <T extends z.ZodTypeAny>(name: string, item: T) =>
    registry.register(
      name,
      z.object({
        data: item,
        meta: z
          .object({
            total: z.number().int().optional(),
            limit: z.number().int().optional(),
            offset: z.number().int().optional(),
          })
          .optional(),
      }),
    );

  const listingArrayEnvelope = envelope("ListingsResponse", z.array(listingSchema));
  const listingEnvelope = envelope("ListingResponse", listingSchema);
  const userEnvelope = envelope("UserResponse", userSchema);

  registry.registerComponent("securitySchemes", "bearerAuth", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
  });

  // Public listings
  registry.registerPath({
    method: "get",
    path: "/api/v1/listings",
    summary: "List listings",
    request: {
      query: z.object({
        category: listingCategorySchema.or(z.literal("all")).optional(),
        region: z.string().optional(),
        type: extracurricularTypeSchema.optional(),
        cost: costOptionSchema.optional(),
        grade: z.string().optional(),
        q: z.string().optional(),
        sort: listingsSortSchema.optional(),
        limit: z.string().optional(),
        offset: z.string().optional(),
      }),
    },
    responses: {
      200: { description: "OK", content: { "application/json": { schema: listingArrayEnvelope } } },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/listings/featured",
    summary: "Featured listings",
    responses: {
      200: { description: "OK", content: { "application/json": { schema: listingArrayEnvelope } } },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/listings/trending",
    summary: "Trending listings",
    responses: {
      200: { description: "OK", content: { "application/json": { schema: listingArrayEnvelope } } },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/listings/{id}",
    summary: "Listing detail",
    request: { params: z.object({ id: z.string() }) },
    responses: {
      200: { description: "OK", content: { "application/json": { schema: listingEnvelope } } },
      404: { description: "Not found", content: { "application/json": { schema: errorSchema } } },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/meta",
    summary: "Catalog metadata",
    responses: { 200: { description: "OK" } },
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/meta/counts",
    summary: "Listing counts by category",
    responses: { 200: { description: "OK" } },
  });

  // Auth
  registry.registerPath({
    method: "get",
    path: "/api/v1/auth/me",
    summary: "Current user",
    security: [{ bearerAuth: [] }],
    responses: {
      200: { description: "OK", content: { "application/json": { schema: userEnvelope } } },
      401: { description: "Unauthorized", content: { "application/json": { schema: errorSchema } } },
    },
  });

  // Newsletter
  registry.registerPath({
    method: "post",
    path: "/api/v1/newsletter/subscribe",
    summary: "Subscribe to newsletter",
    request: {
      body: { content: { "application/json": { schema: subscribeBodySchema } } },
    },
    responses: { 200: { description: "OK" } },
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/newsletter/confirm",
    request: { query: z.object({ token: z.string() }) },
    responses: { 200: { description: "OK" } },
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/newsletter/unsubscribe",
    request: { query: z.object({ token: z.string() }) },
    responses: { 200: { description: "OK" } },
  });

  // Testimonials
  registry.registerPath({
    method: "get",
    path: "/api/v1/testimonials",
    summary: "Published testimonials",
    responses: { 200: { description: "OK" } },
  });

  // Me (saved + applications)
  registry.registerPath({
    method: "get",
    path: "/api/v1/me/saved",
    summary: "Saved listings",
    security: [{ bearerAuth: [] }],
    responses: { 200: { description: "OK" } },
  });

  registry.registerPath({
    method: "post",
    path: "/api/v1/me/saved/{listingId}",
    security: [{ bearerAuth: [] }],
    request: { params: z.object({ listingId: z.string() }) },
    responses: { 201: { description: "Created" } },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/v1/me/saved/{listingId}",
    security: [{ bearerAuth: [] }],
    request: { params: z.object({ listingId: z.string() }) },
    responses: { 204: { description: "No content" } },
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/me/applications",
    security: [{ bearerAuth: [] }],
    responses: { 200: { description: "OK" } },
  });

  // Admin (abridged)
  registry.registerPath({
    method: "get",
    path: "/api/v1/admin/listings",
    security: [{ bearerAuth: [] }],
    request: {
      query: z.object({
        status: listingStatusSchema.optional(),
        category: listingCategorySchema.optional(),
        q: z.string().optional(),
        limit: z.string().optional(),
        offset: z.string().optional(),
      }),
    },
    responses: {
      200: { description: "OK", content: { "application/json": { schema: listingArrayEnvelope } } },
      403: { description: "Forbidden", content: { "application/json": { schema: errorSchema } } },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/v1/admin/listings",
    security: [{ bearerAuth: [] }],
    responses: { 201: { description: "Created" } },
  });

  registry.registerPath({
    method: "post",
    path: "/api/v1/admin/listings/{id}/publish",
    security: [{ bearerAuth: [] }],
    request: { params: z.object({ id: z.string() }) },
    responses: { 200: { description: "OK" } },
  });

  registry.registerPath({
    method: "post",
    path: "/api/v1/admin/listings/{id}/unpublish",
    security: [{ bearerAuth: [] }],
    request: { params: z.object({ id: z.string() }) },
    responses: { 200: { description: "OK" } },
  });

  registry.registerPath({
    method: "post",
    path: "/api/v1/admin/uploads/listing-image",
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          "application/json": { schema: listingImageUploadBodySchema },
        },
      },
    },
    responses: { 200: { description: "OK" } },
  });

  registry.registerPath({
    method: "post",
    path: "/api/v1/admin/newsletter/broadcast",
    security: [{ bearerAuth: [] }],
    request: {
      body: { content: { "application/json": { schema: broadcastBodySchema } } },
    },
    responses: { 202: { description: "Accepted" } },
  });

  registry.registerPath({
    method: "post",
    path: "/api/v1/admin/testimonials",
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: { "application/json": { schema: createTestimonialBodySchema } },
      },
    },
    responses: { 201: { description: "Created" } },
  });

  registry.registerPath({
    method: "patch",
    path: "/api/v1/admin/testimonials/{id}",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ id: z.string() }),
      body: {
        content: { "application/json": { schema: updateTestimonialBodySchema } },
      },
    },
    responses: { 200: { description: "OK" } },
  });

  const generator = new OpenApiGeneratorV31(registry.definitions);
  return generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "Kytalist API",
      version: "1.0.0",
      description: "Public + auth + admin API for kytalist.",
    },
    servers: [{ url: "/" }],
  });
}
