import { z } from 'zod';
import { insertRumorSchema, insertEvidenceSchema, rumors, evidence, auditLog } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  rumors: {
    list: {
      method: 'GET' as const,
      path: '/api/rumors',
      responses: {
        200: z.array(z.custom<typeof rumors.$inferSelect & { evidenceCount: number }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/rumors/:id',
      responses: {
        200: z.custom<typeof rumors.$inferSelect & { evidence: (typeof evidence.$inferSelect & { helpfulVotes: number, misleadingVotes: number })[], history: typeof auditLog.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/rumors',
      input: insertRumorSchema,
      responses: {
        201: z.custom<typeof rumors.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
  evidence: {
    create: {
      method: 'POST' as const,
      path: '/api/rumors/:id/evidence',
      input: insertEvidenceSchema.omit({ rumorId: true }),
      responses: {
        201: z.custom<typeof evidence.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    vote: {
      method: 'POST' as const,
      path: '/api/evidence/:id/vote',
      input: z.object({
        isHelpful: z.boolean(),
      }),
      responses: {
        200: z.object({ 
          success: z.boolean(), 
          newTrustScore: z.number().optional(),
          newStatus: z.string().optional()
        }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
