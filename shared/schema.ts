import { pgTable, serial, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const portfolios = pgTable("portfolios", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  state: text("state").notNull(),
});

export const portfolioState = pgTable("portfolio_state", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().default("default"),
  state: jsonb("state").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPortfolioSchema = createInsertSchema(portfolios).omit({ id: true });
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;
export type Portfolio = typeof portfolios.$inferSelect;

export const insertPortfolioStateSchema = createInsertSchema(portfolioState).omit({ id: true, updatedAt: true });
export type InsertPortfolioState = z.infer<typeof insertPortfolioStateSchema>;
export type PortfolioState = typeof portfolioState.$inferSelect;
