import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Investment Types
  app.get(api.investmentTypes.list.path, async (req, res) => {
    const types = await storage.getInvestmentTypes();
    res.json(types);
  });

  app.post(api.investmentTypes.create.path, async (req, res) => {
    try {
      const input = api.investmentTypes.create.input.parse(req.body);
      const type = await storage.createInvestmentType(input);
      res.status(201).json(type);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  // Investments
  app.get(api.investments.list.path, async (req, res) => {
    const items = await storage.getInvestments();
    res.json(items);
  });

  app.get(api.investments.get.path, async (req, res) => {
    const item = await storage.getInvestment(Number(req.params.id));
    if (!item) return res.status(404).json({ message: 'Investment not found' });
    res.json(item);
  });

  app.post(api.investments.create.path, async (req, res) => {
    try {
      const input = api.investments.create.input.parse(req.body);
      const item = await storage.createInvestment(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.put(api.investments.update.path, async (req, res) => {
    try {
      const input = api.investments.update.input.parse(req.body);
      const item = await storage.updateInvestment(Number(req.params.id), input);
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.delete(api.investments.delete.path, async (req, res) => {
    await storage.deleteInvestment(Number(req.params.id));
    res.status(204).end();
  });

  app.post(api.investments.syncPrices.path, async (req, res) => {
    // Mocking real market prices update by randomizing slightly
    const invs = await storage.getInvestments();
    for (const inv of invs) {
      if (inv.currentPrice) {
        const price = parseFloat(inv.currentPrice);
        const newPrice = price * (1 + (Math.random() * 0.1 - 0.05)); // +/- 5%
        await storage.updateInvestment(inv.id, { currentPrice: newPrice.toFixed(2) });
      }
    }
    res.json({ message: 'Prices synced' });
  });

  // Dividends
  app.get(api.dividends.list.path, async (req, res) => {
    const items = await storage.getDividends();
    res.json(items);
  });

  app.post(api.dividends.create.path, async (req, res) => {
    try {
      const input = api.dividends.create.input.parse({
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : undefined
      });
      const item = await storage.createDividend(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.put(api.dividends.update.path, async (req, res) => {
    try {
      const input = api.dividends.update.input.parse({
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : undefined
      });
      const item = await storage.updateDividend(Number(req.params.id), input);
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.delete(api.dividends.delete.path, async (req, res) => {
    await storage.deleteDividend(Number(req.params.id));
    res.status(204).end();
  });

  // Transactions
  app.get(api.transactions.list.path, async (req, res) => {
    const items = await storage.getTransactions();
    res.json(items);
  });

  app.post(api.transactions.create.path, async (req, res) => {
    try {
      const input = api.transactions.create.input.parse({
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : undefined
      });
      const item = await storage.createTransaction(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.put(api.transactions.update.path, async (req, res) => {
    try {
      const input = api.transactions.update.input.parse({
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : undefined
      });
      const item = await storage.updateTransaction(Number(req.params.id), input);
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.delete(api.transactions.delete.path, async (req, res) => {
    await storage.deleteTransaction(Number(req.params.id));
    res.status(204).end();
  });

  // Seed DB after registering routes if needed
  seedDatabase().catch(console.error);

  return httpServer;
}

async function seedDatabase() {
  const types = await storage.getInvestmentTypes();
  if (types.length === 0) {
    const type1 = await storage.createInvestmentType({ name: 'Stock' });
    const type2 = await storage.createInvestmentType({ name: 'Mutual Fund' });
    const type3 = await storage.createInvestmentType({ name: 'Crypto' });

    const inv1 = await storage.createInvestment({ name: 'Apple Inc.', symbol: 'AAPL', typeId: type1.id, currentPrice: '150.00' });
    const inv2 = await storage.createInvestment({ name: 'Bitcoin', symbol: 'BTC', typeId: type3.id, currentPrice: '60000.00' });

    await storage.createTransaction({ investmentId: inv1.id, type: 'buy', quantity: '10', price: '140.00', date: new Date('2025-01-10') });
    await storage.createDividend({ investmentId: inv1.id, amount: '5.50', date: new Date('2025-02-15') });
  }
}
