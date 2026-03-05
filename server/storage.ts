import { db } from "./db";
import { portfolios, type Portfolio, type InsertPortfolio } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getPortfolios(): Promise<Portfolio[]>;
  createPortfolio(portfolio: InsertPortfolio): Promise<Portfolio>;
}

export class DatabaseStorage implements IStorage {
  async getPortfolios(): Promise<Portfolio[]> {
    return await db.select().from(portfolios);
  }

  async createPortfolio(insertPortfolio: InsertPortfolio): Promise<Portfolio> {
    const [portfolio] = await db.insert(portfolios).values(insertPortfolio).returning();
    return portfolio;
  }
}

export const storage = new DatabaseStorage();
