import type { Express } from "express";
import { createServer, type Server } from "http";
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
        'User-Agent': 'Mozilla/5.0'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const price = parsed?.chart?.result?.[0]?.meta?.regularMarketPrice;
          if (price) resolve(price);
          else reject(new Error("Could not parse price"));
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function fetchFromBitkub(symbol: string): Promise<number> {
    return new Promise((resolve, reject) => {
        https.get('https://api.bitkub.com/api/market/ticker', (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    const pair = `THB_${symbol}`;
                    const price = parsed[pair]?.last;
                    if (price) resolve(price);
                    else reject(new Error("Could not parse bitkub price"));
                } catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

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

  app.get("/api/us-stock/:symbol", async (req, res) => {
    try {
      const price = await fetchFromYahoo(req.params.symbol);
      res.json({ price });
    } catch (e) {
      res.status(404).json({ message: "Not found" });
    }
  });

  app.get("/api/crypto/:symbol", async (req, res) => {
    try {
        const price = await fetchFromBitkub(req.params.symbol);
        res.json({ price });
    } catch (e) {
        res.status(404).json({ message: "Not found on Bitkub" });
    }
  });

  return httpServer;
}
