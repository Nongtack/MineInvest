import { db } from "./db";
import { eq } from "drizzle-orm";
import {
  investments, investmentTypes, transactions, dividends,
  type Investment, type InvestmentType, type Transaction, type Dividend,
  type InsertInvestment, type InsertInvestmentType, type InsertTransaction, type InsertDividend,
  type InvestmentResponse
} from "@shared/schema";

export interface IStorage {
  // Investment Types
  getInvestmentTypes(): Promise<InvestmentType[]>;
  createInvestmentType(type: InsertInvestmentType): Promise<InvestmentType>;

  // Investments
  getInvestments(): Promise<InvestmentResponse[]>;
  getInvestment(id: number): Promise<InvestmentResponse | undefined>;
  createInvestment(investment: InsertInvestment & { typeId: number }): Promise<Investment>;
  updateInvestment(id: number, updates: Partial<InsertInvestment> & { typeId?: number }): Promise<Investment>;
  deleteInvestment(id: number): Promise<void>;

  // Transactions
  getTransactions(): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction & { investmentId: number, quantity: string, price: string, date?: Date }): Promise<Transaction>;
  updateTransaction(id: number, updates: Partial<InsertTransaction> & { investmentId?: number, quantity?: string, price?: string, date?: Date }): Promise<Transaction>;
  deleteTransaction(id: number): Promise<void>;

  // Dividends
  getDividends(): Promise<Dividend[]>;
  createDividend(dividend: InsertDividend & { investmentId: number, amount: string, date?: Date }): Promise<Dividend>;
  updateDividend(id: number, updates: Partial<InsertDividend> & { investmentId?: number, amount?: string, date?: Date }): Promise<Dividend>;
  deleteDividend(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Investment Types
  async getInvestmentTypes(): Promise<InvestmentType[]> {
    return await db.select().from(investmentTypes);
  }

  async createInvestmentType(type: InsertInvestmentType): Promise<InvestmentType> {
    const [newType] = await db.insert(investmentTypes).values(type).returning();
    return newType;
  }

  // Investments
  async getInvestments(): Promise<InvestmentResponse[]> {
    const invs = await db.select().from(investments);
    const types = await db.select().from(investmentTypes);
    const divs = await db.select().from(dividends);
    const trans = await db.select().from(transactions);

    return invs.map(inv => ({
      ...inv,
      type: types.find(t => t.id === inv.typeId),
      dividends: divs.filter(d => d.investmentId === inv.id),
      transactions: trans.filter(t => t.investmentId === inv.id),
    }));
  }

  async getInvestment(id: number): Promise<InvestmentResponse | undefined> {
    const [inv] = await db.select().from(investments).where(eq(investments.id, id));
    if (!inv) return undefined;

    const [type] = await db.select().from(investmentTypes).where(eq(investmentTypes.id, inv.typeId));
    const divs = await db.select().from(dividends).where(eq(dividends.investmentId, id));
    const trans = await db.select().from(transactions).where(eq(transactions.investmentId, id));

    return {
      ...inv,
      type,
      dividends: divs,
      transactions: trans,
    };
  }

  async createInvestment(investment: InsertInvestment & { typeId: number }): Promise<Investment> {
    const [newInv] = await db.insert(investments).values(investment).returning();
    return newInv;
  }

  async updateInvestment(id: number, updates: Partial<InsertInvestment> & { typeId?: number }): Promise<Investment> {
    const [updated] = await db.update(investments).set(updates).where(eq(investments.id, id)).returning();
    return updated;
  }

  async deleteInvestment(id: number): Promise<void> {
    // Delete related records first
    await db.delete(transactions).where(eq(transactions.investmentId, id));
    await db.delete(dividends).where(eq(dividends.investmentId, id));
    await db.delete(investments).where(eq(investments.id, id));
  }

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions);
  }

  async createTransaction(transaction: InsertTransaction & { investmentId: number, quantity: string, price: string, date?: Date }): Promise<Transaction> {
    const [newTrans] = await db.insert(transactions).values({
      ...transaction,
      date: transaction.date || new Date()
    }).returning();
    return newTrans;
  }

  async updateTransaction(id: number, updates: Partial<InsertTransaction> & { investmentId?: number, quantity?: string, price?: string, date?: Date }): Promise<Transaction> {
    const [updated] = await db.update(transactions).set(updates).where(eq(transactions.id, id)).returning();
    return updated;
  }

  async deleteTransaction(id: number): Promise<void> {
    await db.delete(transactions).where(eq(transactions.id, id));
  }

  // Dividends
  async getDividends(): Promise<Dividend[]> {
    return await db.select().from(dividends);
  }

  async createDividend(dividend: InsertDividend & { investmentId: number, amount: string, date?: Date }): Promise<Dividend> {
    const [newDiv] = await db.insert(dividends).values({
      ...dividend,
      date: dividend.date || new Date()
    }).returning();
    return newDiv;
  }

  async updateDividend(id: number, updates: Partial<InsertDividend> & { investmentId?: number, amount?: string, date?: Date }): Promise<Dividend> {
    const [updated] = await db.update(dividends).set(updates).where(eq(dividends.id, id)).returning();
    return updated;
  }

  async deleteDividend(id: number): Promise<void> {
    await db.delete(dividends).where(eq(dividends.id, id));
  }
}

export const storage = new DatabaseStorage();
