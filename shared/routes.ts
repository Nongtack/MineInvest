import { z } from 'zod';

export const errorSchemas = {
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  setIndex: {
    method: 'GET' as const,
    path: '/api/set-index' as const,
    responses: {
      200: z.object({
        price: z.number(),
        time: z.string(),
      }),
      500: errorSchemas.internal,
    },
  },
  fxRate: {
    method: 'GET' as const,
    path: '/api/fx-rate' as const,
    responses: {
      200: z.object({
        rate: z.number(),
      }),
    },
  },
  usStockPrice: {
    method: 'GET' as const,
    path: '/api/us-stock/:symbol' as const,
    responses: {
      200: z.object({
        price: z.number(),
      }),
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
