import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import https from "https";

async function fetchSetIndex(): Promise<number> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'query1.finance.yahoo.com',
      path: '/v8/finance/chart/%5ESET.BK',
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
          if (price) {
            resolve(price);
          } else {
            reject(new Error("Could not parse price from response"));
          }
        } catch (e) { 
          reject(e); 
        }
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
      const price = await fetchSetIndex();
      res.status(200).json({ price, time: new Date().toISOString() });
    } catch (error) {
      console.error("Error fetching SET index:", error);
      res.status(500).json({ message: "Failed to fetch SET index" });
    }
  });

  return httpServer;
}
