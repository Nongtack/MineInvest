import { pgTable, text, serial, integer, timestamp, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const investmentTypes = pgTable("investment_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  symbol: text("symbol"),
  typeId: integer("type_id").notNull(),
  currentPrice: numeric("current_price").default('0'),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  investmentId: integer("investment_id").notNull(),
  type: text("type").notNull(), // 'buy' or 'sell'
  quantity: numeric("quantity").notNull(),
  price: numeric("price").notNull(),
  date: timestamp("date").defaultNow(),
});

export const dividends = pgTable("dividends", {
  id: serial("id").primaryKey(),
  investmentId: integer("investment_id").notNull(),
  amount: numeric("amount").notNull(),
  date: timestamp("date").defaultNow(),
});

// Relations
export const investmentsRelations = relations(investments, ({ one, many }) => ({
  type: one(investmentTypes, {
    fields: [investments.typeId],
    references: [investmentTypes.id],
  }),
  transactions: many(transactions),
  dividends: many(dividends),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  investment: one(investments, {
    fields: [transactions.investmentId],
    references: [investments.id],
  }),
}));

export const dividendsRelations = relations(dividends, ({ one }) => ({
  investment: one(investments, {
    fields: [dividends.investmentId],
    references: [investments.id],
  }),
}));

export const insertInvestmentTypeSchema = createInsertSchema(investmentTypes).omit({ id: true });
export const insertInvestmentSchema = createInsertSchema(investments).omit({ id: true, currentPrice: true, updatedAt: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true });
export const insertDividendSchema = createInsertSchema(dividends).omit({ id: true });

export type InvestmentType = typeof investmentTypes.$inferSelect;
export type InsertInvestmentType = z.infer<typeof insertInvestmentTypeSchema>;

export type Investment = typeof investments.$inferSelect;
export type InsertInvestment = z.infer<typeof insertInvestmentSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Dividend = typeof dividends.$inferSelect;
export type InsertDividend = z.infer<typeof insertDividendSchema>;

export type CreateInvestmentTypeRequest = InsertInvestmentType;
export type CreateInvestmentRequest = InsertInvestment;
export type UpdateInvestmentRequest = Partial<InsertInvestment>;
export type CreateTransactionRequest = InsertTransaction;
export type CreateDividendRequest = InsertDividend;
export type UpdateDividendRequest = Partial<InsertDividend>;

export type InvestmentResponse = Investment & { 
  type?: InvestmentType; 
  dividends?: Dividend[]; 
  transactions?: Transaction[]; 
};
