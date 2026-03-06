import { db } from "./db";
import { portfolios, portfolioState, type Portfolio, type InsertPortfolio } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  getPortfolios(): Promise<Portfolio[]>;
  createPortfolio(portfolio: InsertPortfolio): Promise<Portfolio>;
  getPortfolioState(userId: string): Promise<any | null>;
  savePortfolioState(userId: string, state: any): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getPortfolios(): Promise<Portfolio[]> {
    return await db.select().from(portfolios);
  }

  async createPortfolio(insertPortfolio: InsertPortfolio): Promise<Portfolio> {
    const [portfolio] = await db.insert(portfolios).values(insertPortfolio).returning();
    return portfolio;
  }

  async getPortfolioState(userId: string = "default"): Promise<any | null> {
    const rows = await db.select().from(portfolioState).where(eq(portfolioState.userId, userId));
    if (rows.length === 0) return null;
    return rows[0].state;
  }

  async savePortfolioState(userId: string = "default", state: any): Promise<void> {
    await db
      .insert(portfolioState)
      .values({ userId, state })
      .onConflictDoUpdate({
        target: portfolioState.userId,
        set: { state, updatedAt: sql`NOW()` },
      });
  }
}

export const storage = new DatabaseStorage();
