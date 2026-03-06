import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import https from "https";

async function fetchFromYahoo(symbol: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'query1.finance.yahoo.com',
      path: `/v8/finance/chart/${encodeURIComponent(symbol)}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const price = parsed?.chart?.result?.[0]?.meta?.regularMarketPrice;
          if (price !== undefined) resolve(price);
          else reject(new Error(`Could not parse price for ${symbol}`));
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function fetchThaiFundPrice(symbol: string): Promise<number> {
  // Simple fallback for Thai Funds as scraping settrade/finnomena is complex without proper API
  // In a real app, we'd use a dedicated Thai Fund API. 
  // For this project, we'll try to fetch from Yahoo if available (some funds are listed) 
  // or return the current price.
  try {
    return await fetchFromYahoo(`${symbol}.BK`);
  } catch (e) {
    throw e;
  }
}

async function fetchBitkubTickers(): Promise<Record<string, number>> {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.bitkub.com',
            path: '/api/market/ticker',
            method: 'GET',
            headers: { 'User-Agent': 'MineInvest/1.0' }
        };
        https.get(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    const prices: Record<string, number> = {};
                    for (const [pair, info] of Object.entries(parsed)) {
                        if (pair.startsWith('THB_')) {
                            const sym = pair.replace('THB_', '');
                            prices[sym] = (info as any).last;
                        }
                    }
                    resolve(prices);
                } catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}

async function fetchStockDividends(symbol: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'query1.finance.yahoo.com',
      path: `/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&period1=1735689600&period2=1767225599&events=div`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const dividends = parsed?.chart?.result?.[0]?.events?.dividends;
          if (!dividends) return resolve([]);
          const list = Object.values(dividends).map((d: any) => ({
            date: new Date(d.date * 1000).toISOString().split('T')[0],
            amount: d.amount
          }));
          resolve(list);
        } catch (e) { resolve([]); }
      });
    }).on('error', () => resolve([]));
  });
}

export async function registerApiRoutes(app: Express): Promise<void> {
  app.get("/api/stock/:symbol/dividends", async (req, res) => {
    try {
      const divs = await fetchStockDividends(`${req.params.symbol}.BK`);
      res.json(divs);
    } catch (e) {
      res.json([]);
    }
  });

  app.get(api.setIndex.path, async (req, res) => {
    try {
      const price = await fetchFromYahoo('^SET.BK');
      res.status(200).json({ price, time: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch SET index" });
    }
  });

  app.get("/api/fx-rate", async (req, res) => {
    try {
      const rate = await fetchFromYahoo('THB=X');
      res.json({ rate });
    } catch (e) {
      res.json({ rate: 35.5 }); // Fallback
    }
  });

  app.get("/api/stock/:symbol", async (req, res) => {
    try {
      const price = await fetchFromYahoo(`${req.params.symbol}.BK`);
      res.json({ price });
    } catch (e) {
      res.status(404).json({ message: "Stock not found" });
    }
  });

  app.get("/api/fund/:symbol", async (req, res) => {
    try {
      const price = await fetchThaiFundPrice(req.params.symbol);
      res.json({ price });
    } catch (e) {
      res.status(404).json({ message: "Fund not found" });
    }
  });

  app.get("/api/us-stock/:symbol", async (req, res) => {
    try {
      const price = await fetchFromYahoo(req.params.symbol);
      res.json({ price });
    } catch (e) {
      res.status(404).json({ message: "Not found" });
    }
  });

  app.get("/api/crypto/prices", async (req, res) => {
    try {
        const prices = await fetchBitkubTickers();
        res.json(prices);
    } catch (e) {
        res.status(500).json({ message: "Failed to fetch Bitkub prices" });
    }
  });

  app.get("/api/portfolio-state", async (req, res) => {
    try {
      const state = await storage.getPortfolioState("default");
      if (!state) return res.json({ state: null });
      res.json({ state });
    } catch (e) {
      console.error("Error loading portfolio state:", e);
      res.status(500).json({ message: "Failed to load portfolio state" });
    }
  });

  app.post("/api/portfolio-state", async (req, res) => {
    try {
      const { state } = req.body;
      if (!state) return res.status(400).json({ message: "state is required" });
      await storage.savePortfolioState("default", state);
      res.json({ ok: true });
    } catch (e) {
      console.error("Error saving portfolio state:", e);
      res.status(500).json({ message: "Failed to save portfolio state" });
    }
  });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await registerApiRoutes(app);
  return httpServer;
}
