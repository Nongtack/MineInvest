const https = require('https');

const GAS_URL = 'https://script.google.com/macros/s/AKfycbx6zAN55fkhupbtln6xL6rDjgPSABFCaKCTrVChKmR1_svwhCfWU2bOVATTbxwcsP1u/exec';

const CGID_TO_SYM = {
  "cardano":"ADA","bitkub-coin":"KUB","six-network":"SIX","bitcoin":"BTC",
  "ripple":"XRP","gala":"GALA","jfin-coin":"JFIN","polkadot":"DOT",
  "terra-luna-classic":"LUNA","ethereum":"ETH","sushi":"SUSHI","status":"SNT"
};
const CGIDS = Object.keys(CGID_TO_SYM).join(',');

async function fetchCoinGecko() {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${CGIDS}&vs_currencies=thb`,
      { headers: { 'User-Agent': 'MineInvest/1.0' }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return {};
    const data = await res.json();
    const prices = {};
    for (const [cgid, info] of Object.entries(data)) {
      const sym = CGID_TO_SYM[cgid];
      if (sym && info.thb) prices[sym] = info.thb;
    }
    return prices;
  } catch { return {}; }
}

function fetchFromYahoo(symbol) {
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
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const price = parsed?.chart?.result?.[0]?.meta?.regularMarketPrice;
          if (price !== undefined) resolve(price);
          else reject(new Error(`No price for ${symbol}`));
        } catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function fetchBitkub() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.bitkub.com',
      path: '/api/market/ticker',
      method: 'GET',
      headers: { 'User-Agent': 'MineInvest/1.0' },
      timeout: 8000
    };
    const req = https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const prices = {};
          for (const [pair, info] of Object.entries(parsed)) {
            if (pair.startsWith('THB_')) {
              prices[pair.replace('THB_', '')] = info.last;
            }
          }
          resolve(prices);
        } catch(e) { resolve({}); }
      });
    });
    req.on('error', () => resolve({}));
    req.on('timeout', () => { req.destroy(); resolve({}); });
  });
}

function fetchDividends(symbol) {
  const now = Math.floor(Date.now() / 1000);
  const period1 = now - 86400 * 60; // 60 days ago
  const period2 = now + 86400 * 180; // +6 months from now
  return new Promise((resolve) => {
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
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const dividends = parsed?.chart?.result?.[0]?.events?.dividends;
          if (!dividends) return resolve([]);
          const list = Object.values(dividends).map(d => {
            // Add 12h to avoid UTC midnight → prev-day shift for Bangkok (UTC+7) stocks
            const ts = (d.date + 43200) * 1000;
            return { date: new Date(ts).toISOString().split('T')[0], amount: d.amount };
          });
          resolve(list);
        } catch(e) { resolve([]); }
      });
    }).on('error', () => resolve([]));
  });
}

async function gasGet(action) {
  const url = `${GAS_URL}?action=${encodeURIComponent(action)}`;
  const res = await fetch(url, {
    method: 'GET',
    redirect: 'follow',
    headers: { 'User-Agent': 'MineInvest/1.0' }
  });
  if (!res.ok) throw new Error(`GAS GET responded ${res.status}`);
  return res.json();
}

async function gasPost(payload) {
  const res = await fetch(GAS_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { status: 'sent' }; }
}

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  const rawPath = event.path || '';
  const path = rawPath
    .replace('/.netlify/functions/api', '')
    .replace('/api', '');

  try {
    // GET /cloud/fetch — proxy to Google Apps Script
    if (path === '/cloud/fetch' && event.httpMethod === 'GET') {
      try {
        const data = await gasGet('get_portfolio');
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(data) };
      } catch(e) {
        console.error('Cloud fetch error:', e.message);
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify([]) };
      }
    }

    // POST /cloud/sync — proxy to Google Apps Script
    if (path === '/cloud/sync' && event.httpMethod === 'POST') {
      try {
        const payload = JSON.parse(event.body || '{}');
        const result = await gasPost(payload);
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(result) };
      } catch(e) {
        console.error('Cloud sync error:', e.message);
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ status: 'error', message: e.message }) };
      }
    }

    // GET /set-index
    if (path === '/set-index') {
      const price = await fetchFromYahoo('^SET.BK');
      return {
        statusCode: 200, headers: CORS_HEADERS,
        body: JSON.stringify({ price, time: new Date().toISOString() })
      };
    }

    // GET /fx-rate
    if (path === '/fx-rate') {
      try {
        const rate = await fetchFromYahoo('THB=X');
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ rate }) };
      } catch {
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ rate: 35.5 }) };
      }
    }

    // GET /crypto/prices — try Bitkub first, fallback to CoinGecko
    if (path === '/crypto/prices') {
      let prices = await fetchBitkub();
      if (Object.keys(prices).length === 0) {
        prices = await fetchCoinGecko();
      }
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(prices) };
    }

    // GET /stock/:symbol/dividends
    const divMatch = path.match(/^\/stock\/([^/]+)\/dividends$/);
    if (divMatch) {
      const divs = await fetchDividends(`${decodeURIComponent(divMatch[1])}.BK`);
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(divs) };
    }

    // GET /us-stock/:symbol/dividends
    const usDivMatch = path.match(/^\/us-stock\/([^/]+)\/dividends$/);
    if (usDivMatch) {
      const divs = await fetchDividends(decodeURIComponent(usDivMatch[1]));
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(divs) };
    }

    // GET /stock/:symbol
    const stockMatch = path.match(/^\/stock\/([^/]+)$/);
    if (stockMatch) {
      try {
        const price = await fetchFromYahoo(`${decodeURIComponent(stockMatch[1])}.BK`);
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ price }) };
      } catch {
        return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ message: 'Stock not found' }) };
      }
    }

    // GET /fund/:symbol
    const fundMatch = path.match(/^\/fund\/([^/]+)$/);
    if (fundMatch) {
      try {
        const price = await fetchFromYahoo(`${decodeURIComponent(fundMatch[1])}.BK`);
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ price }) };
      } catch {
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ price: null }) };
      }
    }

    // GET /us-stock/:symbol
    const usMatch = path.match(/^\/us-stock\/([^/]+)$/);
    if (usMatch) {
      try {
        const price = await fetchFromYahoo(decodeURIComponent(usMatch[1]));
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ price }) };
      } catch {
        return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ message: 'Not found' }) };
      }
    }

    return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ message: 'Route not found' }) };

  } catch(e) {
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ message: e.message }) };
  }
};
