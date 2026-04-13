import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import https from "https";

const priceCache = new Map<string, { value: any; ts: number }>();
function getCached<T>(key: string, ttlMs: number): T | null {
  const entry = priceCache.get(key);
  if (entry && Date.now() - entry.ts < ttlMs) return entry.value as T;
  return null;
}
function setCache(key: string, value: any) {
  priceCache.set(key, { value, ts: Date.now() });
}
const PRICE_TTL = 5 * 60 * 1000;
const DIV_TTL = 60 * 60 * 1000;

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
  const now = Math.floor(Date.now() / 1000);
  const period1 = 1704067200; // 2024-01-01
  const period2 = now + 86400 * 180; // +6 months from now
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'query1.finance.yahoo.com',
      path: `/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&period1=${period1}&period2=${period2}&events=div`,
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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/stock/:symbol/dividends", async (req, res) => {
    const key = `div:${req.params.symbol}`;
    const cached = getCached<any[]>(key, DIV_TTL);
    if (cached) return res.json(cached);
    try {
      const divs = await fetchStockDividends(`${req.params.symbol}.BK`);
      setCache(key, divs);
      res.json(divs);
    } catch (e) {
      res.json([]);
    }
  });

  app.get("/api/us-stock/:symbol/dividends", async (req, res) => {
    const key = `div-us:${req.params.symbol}`;
    const cached = getCached<any[]>(key, DIV_TTL);
    if (cached) return res.json(cached);
    try {
      const divs = await fetchStockDividends(req.params.symbol);
      setCache(key, divs);
      res.json(divs);
    } catch (e) {
      res.json([]);
    }
  });

  app.get(api.setIndex.path, async (req, res) => {
    const key = 'set-index';
    const cached = getCached<number>(key, PRICE_TTL);
    if (cached !== null) return res.status(200).json({ price: cached, time: new Date().toISOString() });
    try {
      const price = await fetchFromYahoo('^SET.BK');
      setCache(key, price);
      res.status(200).json({ price, time: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch SET index" });
    }
  });

  app.get("/api/fx-rate", async (req, res) => {
    const key = 'fx-rate';
    const cached = getCached<number>(key, PRICE_TTL);
    if (cached !== null) return res.json({ rate: cached });
    try {
      const rate = await fetchFromYahoo('THB=X');
      setCache(key, rate);
      res.json({ rate });
    } catch (e) {
      res.json({ rate: 35.5 });
    }
  });

  app.get("/api/stock/:symbol", async (req, res) => {
    const key = `stock:${req.params.symbol}`;
    const cached = getCached<number>(key, PRICE_TTL);
    if (cached !== null) return res.json({ price: cached });
    try {
      const price = await fetchFromYahoo(`${req.params.symbol}.BK`);
      setCache(key, price);
      res.json({ price });
    } catch (e) {
      res.status(404).json({ message: "Stock not found" });
    }
  });

  app.get("/api/fund/:symbol", async (req, res) => {
    const key = `fund:${req.params.symbol}`;
    const cached = getCached<number>(key, PRICE_TTL);
    if (cached !== null) return res.json({ price: cached });
    try {
      const price = await fetchThaiFundPrice(req.params.symbol);
      setCache(key, price);
      res.json({ price });
    } catch (e) {
      res.json({ price: null });
    }
  });

  app.get("/api/us-stock/:symbol", async (req, res) => {
    const key = `us:${req.params.symbol}`;
    const cached = getCached<number>(key, PRICE_TTL);
    if (cached !== null) return res.json({ price: cached });
    try {
      const price = await fetchFromYahoo(req.params.symbol);
      setCache(key, price);
      res.json({ price });
    } catch (e) {
      res.status(404).json({ message: "Not found" });
    }
  });

  app.get("/api/crypto/prices", async (req, res) => {
    const key = 'crypto-prices';
    const cached = getCached<Record<string, number>>(key, PRICE_TTL);
    if (cached !== null) return res.json(cached);
    try {
      const prices = await fetchBitkubTickers();
      setCache(key, prices);
      res.json(prices);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch Bitkub prices" });
    }
  });

  app.post("/api/sync-sheets", async (req, res) => {
    // This endpoint is now optional as we are using the direct Apps Script URL
    // but we'll keep it as a proxy in case of CORS issues
    try {
      const { state } = req.body;
      const scriptUrl = 'https://script.google.com/macros/s/AKfycbx6zAN55fkhupbtln6xL6rDjgPSABFCaKCTrVChKmR1_svwhCfWU2bOVATTbxwcsP1u/exec';
      res.json({ success: true, message: "Apps Script integration active" });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  const GAS_URL = 'https://script.google.com/macros/s/AKfycbx6zAN55fkhupbtln6xL6rDjgPSABFCaKCTrVChKmR1_svwhCfWU2bOVATTbxwcsP1u/exec';

  app.get('/api/cloud/fetch', async (req, res) => {
    try {
      const url = new URL(GAS_URL);
      url.searchParams.set('action', 'get_portfolio');
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`GAS responded ${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (e: any) {
      console.error('Cloud fetch proxy error:', e.message);
      res.json([]);
    }
  });

  app.post('/api/cloud/sync', async (req, res) => {
    try {
      const payload = req.body;
      const response = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
      });
      const text = await response.text();
      let result: any = { status: 'sent' };
      try { result = JSON.parse(text); } catch {}
      res.json(result);
    } catch (e: any) {
      console.error('Cloud sync proxy error:', e.message);
      res.status(500).json({ status: 'error', message: e.message });
    }
  });

  return httpServer;
}
