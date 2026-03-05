import { pgTable, serial, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// We keep a simple table to satisfy the DB requirement,
// but the app's main state will remain in localStorage like the original for now,
// or we can use this to store the stringified state if needed.
export const portfolios = pgTable("portfolios", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  state: text("state").notNull(),
});

export const insertPortfolioSchema = createInsertSchema(portfolios).omit({ id: true });
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;
export type Portfolio = typeof portfolios.$inferSelect;
