import { z } from 'zod';
import { 
  insertInvestmentTypeSchema, 
  insertInvestmentSchema, 
  insertTransactionSchema, 
  insertDividendSchema, 
  investments, 
  investmentTypes, 
  transactions, 
  dividends 
} from './schema';

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
};

export const api = {
  investmentTypes: {
    list: {
      method: 'GET' as const,
      path: '/api/investment-types' as const,
      responses: {
        200: z.array(z.custom<typeof investmentTypes.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/investment-types' as const,
      input: insertInvestmentTypeSchema,
      responses: {
        201: z.custom<typeof investmentTypes.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  investments: {
    list: {
      method: 'GET' as const,
      path: '/api/investments' as const,
      responses: {
        200: z.array(z.any()), // Array of InvestmentResponse
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/investments/:id' as const,
      responses: {
        200: z.any(), // InvestmentResponse
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/investments' as const,
      input: insertInvestmentSchema.extend({
        typeId: z.coerce.number(),
      }),
      responses: {
        201: z.custom<typeof investments.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/investments/:id' as const,
      input: insertInvestmentSchema.partial().extend({
        typeId: z.coerce.number().optional(),
      }),
      responses: {
        200: z.custom<typeof investments.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/investments/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    syncPrices: {
      method: 'POST' as const,
      path: '/api/investments/sync-prices' as const,
      responses: {
        200: z.object({ message: z.string() }),
      },
    }
  },
  dividends: {
    list: {
      method: 'GET' as const,
      path: '/api/dividends' as const,
      responses: {
        200: z.array(z.custom<typeof dividends.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/dividends' as const,
      input: insertDividendSchema.extend({
        investmentId: z.coerce.number(),
        amount: z.coerce.string(),
        date: z.coerce.date().optional(),
      }),
      responses: {
        201: z.custom<typeof dividends.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/dividends/:id' as const,
      input: insertDividendSchema.partial().extend({
        investmentId: z.coerce.number().optional(),
        amount: z.coerce.string().optional(),
        date: z.coerce.date().optional(),
      }),
      responses: {
        200: z.custom<typeof dividends.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/dividends/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  transactions: {
    list: {
      method: 'GET' as const,
      path: '/api/transactions' as const,
      responses: {
        200: z.array(z.custom<typeof transactions.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/transactions' as const,
      input: insertTransactionSchema.extend({
        investmentId: z.coerce.number(),
        quantity: z.coerce.string(),
        price: z.coerce.string(),
        date: z.coerce.date().optional(),
      }),
      responses: {
        201: z.custom<typeof transactions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/transactions/:id' as const,
      input: insertTransactionSchema.partial().extend({
        investmentId: z.coerce.number().optional(),
        quantity: z.coerce.string().optional(),
        price: z.coerce.string().optional(),
        date: z.coerce.date().optional(),
      }),
      responses: {
        200: z.custom<typeof transactions.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/transactions/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    }
  }
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
