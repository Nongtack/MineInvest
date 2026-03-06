import { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";

const INIT_STOCKS = [
  { s: "AMA", n: "อมตะ คอร์ปอเรชั่น", sh: 3000, ac: 4.33, cp: 4.16 },
  { s: "AP", n: "เอพี (ไทยแลนด์)", sh: 1400, ac: 10.72, cp: 8.20 },
  { s: "BCH", n: "โรงพยาบาลบางกอก เชน", sh: 400, ac: 14.17, cp: 9.75 },
  { s: "BDMS", n: "กรุงเทพดุสิตเวชการ", sh: 200, ac: 24.64, cp: 19.40 },
  { s: "CBG", n: "คาราบาวกรุ๊ป", sh: 500, ac: 45.08, cp: 38.50 },
  { s: "CPF", n: "เจริญโภคภัณฑ์อาหาร", sh: 900, ac: 20.13, cp: 19.30 },
  { s: "CPNREIT", n: "กองทรัสต์ CPN รีเทล โกรท", sh: 2500, ac: 11.52, cp: 11.50 },
  { s: "KTB", n: "กรุงไทย", sh: 600, ac: 16.33, cp: 32.75 },
  { s: "LH", n: "แลนด์ แอนด์ เฮ้าส์", sh: 6940, ac: 7.02, cp: 3.74 },
  { s: "M-CHAI", n: "มาสเตอร์ชัย อินดัสเทรียล", sh: 200, ac: 26.54, cp: 18.90 },
  { s: "SIRI", n: "แสนสิริ", sh: 10100, ac: 1.67, cp: 1.43 },
  { s: "TTB", n: "ทหารไทยธนชาต", sh: 5300, ac: 1.96, cp: 2.20 },
];

const INIT_US_STOCKS = [
  { s: "AAPL", n: "Apple Inc.", qty: 0.217, cost: 56.48 },
  { s: "GOOGL", n: "Alphabet Inc.", qty: 0.248, cost: 74.61 },
  { s: "JEPQ", n: "JPMorgan Nasdaq ETF", qty: 2.796, cost: 161.16 },
  { s: "JPM", n: "JPMorgan Chase", qty: 0.172, cost: 50.49 },
  { s: "SPAXX", n: "Fidelity Govt Money Market", qty: 3.09, cost: 3.09 },
  { s: "TSLA", n: "Tesla, Inc.", qty: 0.162, cost: 65.69 },
  { s: "VOO", n: "Vanguard S&P 500 ETF", qty: 0.407, cost: 255.11 },
  { s: "VXUS", n: "Vanguard Intl Stock ETF", qty: 5.245, cost: 412.88 },
];

const INIT_FUNDS = [
  { s: "K-GARMF", n: "กสิกร Global Allocation RMF", cat: "ผสม", iv: 3500.00, cv: 4487.65, units: 242.9673, avgNav: 14.4052 },
  { s: "K-EQD-A(D)", n: "กสิกร Equity Dividend หุ้นไทย", cat: "หุ้นไทย", iv: 2132.81, cv: 2235.34, units: 159.5244, avgNav: 13.3698 },
  { s: "K-INDIA-A(D)", n: "กสิกร India Equity", cat: "หุ้นต่างประเทศ", iv: 14000.00, cv: 11893.69, units: 1141.2102, avgNav: 12.2677 },
  { s: "K-US500X-A(A)", n: "กสิกร US500X พาสซีฟ-A", cat: "หุ้นต่างประเทศ", iv: 50110.37, cv: 50309.11, units: 3489.7623, avgNav: 14.3593 },
  { s: "K-USA-A(D)", n: "กสิกร USA Equity", cat: "หุ้นต่างประเทศ", iv: 15000.00, cv: 13014.81, units: 1156.9442, avgNav: 12.9652 },
  { s: "K-USXNDQ-A(D)", n: "กสิกร US NASDAQ-100", cat: "หุ้นต่างประเทศ", iv: 42000.00, cv: 47914.35, units: 1794.5720, avgNav: 23.4039 },
  { s: "K-GOLD-A(A)", n: "กสิกร Gold-A สะสมมูลค่า", cat: "สินทรัพย์ทางเลือก", iv: 13000.00, cv: 13124.89, units: 480.1339, avgNav: 27.0758 },
];

const INIT_BONDS = [
  { s: "BCP26NB", n: "หุ้นกู้บางจาก คอร์ปอเรชั่น ครั้งที่ 1/2566", units: 50, par: 1000, face: 50000, rate: 3.45, mat: "2 พ.ย. 2569", next: "5 พ.ค. 2569" },
];

const INIT_CRYPTO = [
  { s: "ADA", n: "Cardano", cgid: "cardano", qty: 355.9100437, seedPx: 8.65 },
  { s: "KUB", n: "Bitkub Coin", cgid: "bitkub-coin", qty: 73.02870991, seedPx: 30.39 },
  { s: "SIX", n: "SIX Network", cgid: "six-network", qty: 7247.96845735, seedPx: 0.2886 },
  { s: "BTC", n: "Bitcoin", cgid: "bitcoin", qty: 0.00059248, seedPx: 2294096 },
  { s: "XRP", n: "Ripple", cgid: "ripple", qty: 26.95073822, seedPx: 44.90 },
  { s: "GALA", n: "Gala", cgid: "gala", qty: 8272.51639989, seedPx: 0.1131 },
  { s: "JFIN", n: "JFIN Coin", cgid: "jfin-coin", qty: 275.98319327, seedPx: 2.060 },
  { s: "DOT", n: "Polkadot", cgid: "polkadot", qty: 9.92728959, seedPx: 48.45 },
  { s: "LUNA", n: "Terra Classic", cgid: "terra-luna", qty: 211027.27102101, seedPx: 0.001396 },
  { s: "ETH", n: "Ethereum", cgid: "ethereum", qty: 0.00101785, seedPx: 67191 },
  { s: "SUSHI", n: "SushiSwap", cgid: "sushi", qty: 8.05467914, seedPx: 6.533 },
  { s: "SNT", n: "Status", cgid: "status", qty: 38.05862068, seedPx: 0.3151 },
];

const INIT_FUND_DIVS = [];

export const ASSET_COLORS: Record<string, string> = {
  "ผสม": "#a78bfa", "หุ้นไทย": "#60a5fa", "หุ้นต่างประเทศ": "#34d399", "สินทรัพย์ทางเลือก": "#fbbf24", "ตราสารหนี้": "#f97316", "ตลาดเงิน": "#94a3b8", "อื่นๆ": "#c8d6e5"
};

export const CRYPTO_COLORS: Record<string, string> = {
  BTC: "#f7931a", ETH: "#627eea", ADA: "#0033ad", XRP: "#00aae4", KUB: "#1ba27a", SIX: "#5b6af5", GALA: "#7f5af0", JFIN: "#e63946", DOT: "#e6007a", LUNA: "#172852", SUSHI: "#fa52a0", SNT: "#9b5de5"
};

export type TransactionType = 'BUY' | 'SELL' | 'DIVIDEND';
export interface Transaction {
  id: number;
  date: string;
  sym: string;
  type: TransactionType;
  qty?: number;
  price?: number;
  amount?: number;
  note?: string;
}

export interface PortfolioState {
  stockPx: Record<string, number>;
  fundPx: Record<string, number>;
  cryptoPx: Record<string, number>;
  usStockPx: Record<string, number>;
  stockMeta: Record<string, string>;
  fundMeta: Record<string, { n: string, cat: string, units: number, avgNav: number }>;
  cryptoMeta: Record<string, { n: string, cgid: string }>;
  usStockMeta: Record<string, string>;
  bonds: any[];
  stockTx: Transaction[];
  fundTx: Transaction[];
  bondTx: Transaction[];
  cryptoTx: Transaction[];
  usStockTx: Transaction[];
  fxRate: number;
  deletedTxKeys: string[];
  deletedSigs: string[];
}

const defaultState: PortfolioState = {
  stockPx: Object.fromEntries(INIT_STOCKS.map(h => [h.s, h.cp])),
  fundPx: Object.fromEntries(INIT_FUNDS.map(f => [f.s, f.cv])),
  cryptoPx: Object.fromEntries(INIT_CRYPTO.map(c => [c.s, c.seedPx])),
  usStockPx: Object.fromEntries(INIT_US_STOCKS.map(s => [s.s, s.cost / s.qty])),
  stockMeta: Object.fromEntries(INIT_STOCKS.map(h => [h.s, h.n])),
  fundMeta: Object.fromEntries(INIT_FUNDS.map(f => [f.s, { n: f.n, cat: f.cat, units: f.units, avgNav: f.avgNav }])),
  cryptoMeta: Object.fromEntries(INIT_CRYPTO.map(c => [c.s, { n: c.n, cgid: c.cgid }])),
  usStockMeta: Object.fromEntries(INIT_US_STOCKS.map(s => [s.s, s.n])),
  bonds: INIT_BONDS.map(b => ({ ...b })),
  stockTx: INIT_STOCKS.map((h, i) => ({ id: i + 1, date: '2024-01-01', sym: h.s, type: 'BUY', qty: h.sh, price: h.ac, note: 'Initial Data' })),
  fundTx: [
    ...INIT_FUNDS.map((f, i) => ({ id: 100 + i, date: '2024-01-01', sym: f.s, type: 'BUY', qty: f.units, price: f.avgNav, amount: f.iv, note: 'Initial Data' })),
    ...INIT_FUND_DIVS.map((d, i) => ({ ...d, id: 1000 + i }))
  ],
  bondTx: INIT_BONDS.map((b, i) => ({ id: 200 + i, date: '2024-01-01', sym: b.s, type: 'BUY', amount: b.face, note: 'Initial Data' })),
  cryptoTx: INIT_CRYPTO.map((c, i) => ({ id: 300 + i, date: '2024-01-01', sym: c.s, type: 'BUY', qty: c.qty, price: c.seedPx, note: 'Initial Data' })),
  usStockTx: INIT_US_STOCKS.map((s, i) => ({ id: 400 + i, date: '2024-01-01', sym: s.s, type: 'BUY', qty: s.qty, price: s.cost / s.qty, note: 'Initial Data' })),
  fxRate: 35.5,
  deletedTxKeys: [],
  deletedSigs: [],
};

const STORAGE_KEY = 'mine_invest_react_state';

export const txKey = (t: any) => `${t.sym}-${t.date}-${t.type}-${t.qty || 0}-${t.price || 0}-${t.amount || 0}`;
export const txSig = (t: any) => `${t.sym}|${t.date}|${t.type}|${Number(t.qty || 0)}|${Number(t.price || 0)}`;

function mergeInitialData(saved: PortfolioState): PortfolioState {
  const deletedSet = new Set(saved.deletedTxKeys || []);
  const deletedSigSet = new Set(saved.deletedSigs || []);
  const mergeTx = (defaults: Transaction[], extras: Transaction[]) => {
    const map = new Map(
      defaults
        .filter(t => !deletedSet.has(txKey(t)) && !deletedSigSet.has(txSig(t)))
        .map(t => [txKey(t), t])
    );
    extras
      .filter(t => !deletedSet.has(txKey(t)) && !deletedSigSet.has(txSig(t)))
      .forEach(t => { if (!map.has(txKey(t))) map.set(txKey(t), t); });
    return Array.from(map.values());
  };
  return {
    ...defaultState,
    ...saved,
    deletedTxKeys: saved.deletedTxKeys || [],
    deletedSigs: saved.deletedSigs || [],
    stockTx: mergeTx(defaultState.stockTx, saved.stockTx || []),
    fundTx: mergeTx(defaultState.fundTx, saved.fundTx || []),
    bondTx: mergeTx(defaultState.bondTx, saved.bondTx || []),
    cryptoTx: mergeTx(defaultState.cryptoTx, saved.cryptoTx || []),
    usStockTx: mergeTx(defaultState.usStockTx, saved.usStockTx || []),
    stockPx: { ...defaultState.stockPx, ...saved.stockPx },
    fundPx: { ...defaultState.fundPx, ...saved.fundPx },
    cryptoPx: { ...defaultState.cryptoPx, ...saved.cryptoPx },
    usStockPx: { ...defaultState.usStockPx, ...saved.usStockPx },
    stockMeta: { ...defaultState.stockMeta, ...saved.stockMeta },
    fundMeta: { ...defaultState.fundMeta, ...saved.fundMeta },
    cryptoMeta: { ...defaultState.cryptoMeta, ...saved.cryptoMeta },
    usStockMeta: { ...defaultState.usStockMeta, ...saved.usStockMeta },
    bonds: (saved.bonds && saved.bonds.length > 0) ? saved.bonds : defaultState.bonds,
  };
}

export function usePortfolio() {
  const { toast } = useToast();
  const [state, setState] = useState<PortfolioState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return mergeInitialData(parsed);
      }
    } catch (e) { console.error(e); }
    return defaultState;
  });

  const [history, setHistory] = useState<PortfolioState[]>([]);

  const syncToCloud = useCallback(async (data: any, isTransaction = false, assetType?: string) => {
    try {
      const scriptUrl = 'https://script.google.com/macros/s/AKfycbx6zAN55fkhupbtln6xL6rDjgPSABFCaKCTrVChKmR1_svwhCfWU2bOVATTbxwcsP1u/exec';
      let payload: any = data;
      if (isTransaction) {
        payload = {
          sync_type: 'TRANSACTION',
          asset_type: assetType || 'stock',
          id: data.id || Date.now(),
          date: data.date || '',
          symbol: data.sym || '',
          type: data.type || '',
          price: Number(data.price || 0),
          qty: Number(data.qty || 0),
          amount: Number(data.amount || 0),
          note: data.note || ''
        };
        // Calculate amount if missing
        if (!payload.amount && payload.qty && payload.price) {
          payload.amount = payload.qty * payload.price;
        }
      }

      console.log("Syncing to cloud...", payload);
      
      // Use text/plain to avoid CORS preflight
      fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      }).catch(err => console.warn("Background sync warning (normal for no-cors):", err));
      
      console.log("Cloud sync request dispatched");
      
      if (isTransaction && !String(data.type || '').startsWith('DELETE_')) {
        toast({ title: "บันทึกข้อมูลแล้ว", description: `รายการ ${data.sym || ''} ถูกบันทึกและกำลังซิงค์ไปที่ Cloud` });
      }
    } catch (e) { 
      console.error('Cloud Sync Error:', e);
      toast({ title: "Cloud Sync ล้มเหลว", description: "ไม่สามารถส่งข้อมูลไปที่ Sheet ได้", variant: "destructive" });
    }
  }, [toast]);

  const fetchFromCloud = useCallback(async () => {
    try {
      console.log('Fetching from cloud...');
      const scriptUrl = 'https://script.google.com/macros/s/AKfycbx6zAN55fkhupbtln6xL6rDjgPSABFCaKCTrVChKmR1_svwhCfWU2bOVATTbxwcsP1u/exec';
      const res = await fetch(`${scriptUrl}?action=get_portfolio`);
      if (!res.ok) throw new Error('Cloud fetch failed');
      
      const cloudData = await res.json();
      console.log('Cloud data received:', cloudData?.length, 'rows');
      
      if (cloudData && Array.isArray(cloudData) && cloudData.length > 1) {
        const allRows = cloudData.slice(1).map((row: any, idx: number) => ({
          id: Date.now() + idx + Math.floor(Math.random() * 1000),
          date: row[1] ? row[1].toString().split('T')[0] : '',
          sym: row[2] ? row[2].toString().toUpperCase() : '',
          type: row[3] || 'BUY',
          price: parseFloat(row[4]) || 0,
          qty: parseFloat(row[5]) || 0,
          amount: parseFloat(row[6]) || 0,
          note: row[7] || '',
          asset: (row[8] || 'stock').toLowerCase()
        })).filter(tx => tx.sym && tx.type);

        const cloudDeleteRows = allRows.filter(t => t.type.startsWith('DELETE_'));

        // Robust signature for matching
        const getMatchSig = (t: any, overrideType?: string) =>
          `${t.sym}|${t.date}|${overrideType ?? t.type}|${Number(t.qty || 0).toFixed(4)}|${Number(t.price || 0).toFixed(4)}`;

        const deletedCloudSigs = new Set<string>();
        cloudDeleteRows.forEach(t => {
          deletedCloudSigs.add(getMatchSig(t, t.type.replace('DELETE_', '')));
        });

        const validCloudRows = allRows.filter(t => {
          if (t.type.startsWith('DELETE_')) return false;
          return !deletedCloudSigs.has(getMatchSig(t));
        });

        setState(prev => {
          const newDeletedSigs = new Set(prev.deletedSigs || []);
          const newDeletedKeys = new Set(prev.deletedTxKeys || []);

          cloudDeleteRows.forEach(dr => {
            const originalType = dr.type.replace('DELETE_', '');
            newDeletedSigs.add(getMatchSig(dr, originalType));
          });

          const allLocalTx = [
            ...(prev.stockTx || []), ...(prev.fundTx || []), ...(prev.cryptoTx || []),
            ...(prev.usStockTx || []), ...(prev.bondTx || [])
          ];
          
          cloudDeleteRows.forEach(dr => {
            const originalType = dr.type.replace('DELETE_', '');
            const drSig = getMatchSig(dr, originalType);
            allLocalTx.forEach(lt => {
              if (getMatchSig(lt) === drSig) {
                newDeletedKeys.add(txKey(lt));
              }
            });
          });

          const isDeleted = (t: any) => {
            if (newDeletedKeys.has(txKey(t))) return true;
            return newDeletedSigs.has(getMatchSig(t));
          };

          const merge = (local: any[], cloud: any[]) => {
            const safeLocal = Array.isArray(local) ? local : [];
            const filteredLocal = safeLocal.filter(t => !isDeleted(t));
            const localSigs = new Set(filteredLocal.map(t => getMatchSig(t)));
            const newFromCloud = cloud.filter(t => !localSigs.has(getMatchSig(t)) && !isDeleted(t));
            // Always sort by date for consistency
            return [...filteredLocal, ...newFromCloud].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          };

          const next = {
            ...prev,
            deletedTxKeys: Array.from(newDeletedKeys),
            deletedSigs: Array.from(newDeletedSigs),
            stockTx: merge(prev.stockTx || [], validCloudRows.filter(t => t.asset === 'stock')),
            fundTx: merge(prev.fundTx || [], validCloudRows.filter(t => t.asset === 'fund')),
            cryptoTx: merge(prev.cryptoTx || [], validCloudRows.filter(t => t.asset === 'crypto')),
            usStockTx: merge(prev.usStockTx || [], validCloudRows.filter(t => t.asset === 'usstock')),
            bondTx: merge(prev.bondTx || [], validCloudRows.filter(t => t.asset === 'bond')),
          };
          
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          return next;
        });
      }
    } catch (e) { 
      console.error('Fetch from cloud failed', e);
    }
  }, []);

  useEffect(() => { fetchFromCloud(); }, [fetchFromCloud]);
  useEffect(() => {
    const saveState = () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    };
    saveState();
  }, [state]);

  const updateState = useCallback((updater: (prev: PortfolioState) => PortfolioState) => {
    setState(prev => {
      const next = updater(prev);
      setHistory(h => [prev, ...h].slice(0, 20));
      // Immediate save on update to be safe
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [setHistory]);

  const undoLast = useCallback(() => {
    if (history.length === 0) return;
    const [prev, ...rest] = history;
    setState(prev);
    setHistory(rest);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prev));
    toast({ title: "ย้อนกลับสำเร็จ", description: "กู้คืนข้อมูลล่าสุดเรียบร้อย" });
  }, [history, toast]);

  const canUndo = history.length > 0;

  const computed = useMemo(() => {
    const sMap: Record<string, any> = {};
    state.stockTx.forEach(tx => {
      if (!sMap[tx.sym]) sMap[tx.sym] = { sym: tx.sym, sh: 0, cost: 0, div: 0, divList: [] };
      const h = sMap[tx.sym];
      if (tx.type === 'BUY') { h.cost += (tx.qty || 0) * (tx.price || 0); h.sh += (tx.qty || 0); }
      else if (tx.type === 'SELL') { const a = h.sh > 0 ? h.cost / h.sh : 0; h.cost -= a * (tx.qty || 0); h.sh -= (tx.qty || 0); }
      else if (tx.type === 'DIVIDEND') { 
        const d = tx.amount || ((tx.qty || 0) * (tx.price || 0));
        h.div += d; 
        h.divList.push({ date: tx.date, amt: d, note: tx.note }); 
      }
    });
    const stocks = Object.values(sMap).filter(h => h.sh > 0).map(h => {
      const avg = h.sh > 0 ? h.cost / h.sh : 0;
      const cur = state.stockPx[h.sym] || avg;
      const mv = h.sh * cur, cb = h.sh * avg, pnl = mv - cb, pct = cb > 0 ? (pnl / cb) * 100 : 0;
      return { ...h, name: state.stockMeta[h.sym] || '', avg, cur, mv, cb, pnl, pct };
    }).sort((a, b) => a.sym.localeCompare(b.sym));

    const fMap: Record<string, any> = {};
    state.fundTx.forEach(tx => {
      if (!fMap[tx.sym]) fMap[tx.sym] = { sym: tx.sym, iv: 0, div: 0, divList: [] };
      const f = fMap[tx.sym];
      if (tx.type === 'BUY') f.iv += (tx.amount || (tx.qty || 0) * (tx.price || 0));
      else if (tx.type === 'SELL') f.iv -= (tx.amount || (tx.qty || 0) * (tx.price || 0));
      else if (tx.type === 'DIVIDEND') { 
        const d = tx.amount || ((tx.qty || 0) * (tx.price || 0));
        f.div += d; 
        f.divList.push({ date: tx.date, amt: d, note: tx.note }); 
      }
    });
    const funds = Object.values(fMap).filter(f => f.iv > 0 || f.div > 0).map(f => {
      const cur = state.fundPx[f.sym] || f.iv, pnl = cur - f.iv, pct = f.iv > 0 ? (pnl / f.iv) * 100 : 0;
      const meta = state.fundMeta[f.sym] || { n: f.sym, cat: 'อื่นๆ', units: 0, avgNav: 0 };
      return { ...f, ...meta, cur, pnl, pct };
    }).sort((a, b) => a.sym.localeCompare(b.sym));

    const cMap: Record<string, any> = {};
    (state.cryptoTx || []).forEach(tx => {
      if (!cMap[tx.sym]) cMap[tx.sym] = { sym: tx.sym, qty: 0, cost: 0, hasCost: false, div: 0 };
      const c = cMap[tx.sym];
      if (tx.type === 'BUY') {
        if ((tx.price || 0) > 0) { c.cost += (tx.qty || 0) * (tx.price || 0); c.hasCost = true; }
        c.qty += (tx.qty || 0);
      }
      else if (tx.type === 'SELL') { const a = c.qty > 0 ? c.cost / c.qty : 0; c.cost -= a * (tx.qty || 0); c.qty -= (tx.qty || 0); }
      else if (tx.type === 'DIVIDEND') { c.div += (tx.qty || 0) * (tx.price || 0); }
    });
    const crypto = Object.values(cMap).filter(c => c.qty > 0).map(c => {
      const avg = c.qty > 0 && c.hasCost ? c.cost / c.qty : 0;
      const cur = state.cryptoPx[c.sym] || 0;
      const mv = c.qty * cur, cb = c.hasCost ? c.qty * avg : 0, pnl = c.hasCost ? mv - cb : 0, pct = cb > 0 ? (pnl / cb) * 100 : 0;
      const meta = state.cryptoMeta[c.sym] || { n: c.sym, cgid: '' };
      return { ...c, ...meta, avg, cur, mv, cb, pnl, pct };
    }).sort((a, b) => b.mv - a.mv);

    const usMap: Record<string, any> = {};
    (state.usStockTx || []).forEach(tx => {
      if (!usMap[tx.sym]) usMap[tx.sym] = { sym: tx.sym, qty: 0, cost: 0, div: 0, divList: [] };
      const u = usMap[tx.sym];
      if (tx.type === 'BUY') { u.cost += (tx.qty || 0) * (tx.price || 0); u.qty += (tx.qty || 0); }
      else if (tx.type === 'SELL') { const a = u.qty > 0 ? u.cost / u.qty : 0; u.cost -= a * (tx.qty || 0); u.qty -= (tx.qty || 0); }
      else if (tx.type === 'DIVIDEND') { 
        const d = tx.amount || ((tx.qty || 0) * (tx.price || 0));
        u.div += d; 
        u.divList.push({ date: tx.date, amt: d, note: tx.note }); 
      }
    });
    const usStocks = Object.values(usMap).filter(u => u.qty > 0).map(u => {
      const avg = u.qty > 0 ? u.cost / u.qty : 0;
      const cur = state.usStockPx[u.sym] || avg;
      const mvUsd = u.qty * cur, cbUsd = u.qty * avg, pnlUsd = mvUsd - cbUsd, pct = cbUsd > 0 ? (pnlUsd / cbUsd) * 100 : 0;
      const mvThb = mvUsd * state.fxRate, cbThb = cbUsd * state.fxRate, pnlThb = mvThb - cbThb;
      return { ...u, name: state.usStockMeta[u.sym] || '', avg, cur, mvUsd, cbUsd, pnlUsd, mvThb, cbThb, pnlThb, pct };
    }).sort((a, b) => b.mvUsd - a.mvUsd);

    const bMv = (state.bonds || []).reduce((s, b) => s + b.face, 0);
    const bAi = (state.bonds || []).reduce((s, b) => s + (b.face * b.rate / 100), 0);
    const bDiv = (state.bondTx || []).filter(tx => tx.type === 'DIVIDEND').reduce((s, tx) => s + (tx.amount || 0), 0);

    const sMv = stocks.reduce((s, h) => s + h.mv, 0), sCost = stocks.reduce((s, h) => s + h.cb, 0), sDiv = stocks.reduce((s, h) => s + h.div, 0);
    const sPnl = sMv - sCost, sPct = sCost > 0 ? (sPnl / sCost) * 100 : 0;
    
    const fMv = funds.reduce((s, f) => s + (f.cur || 0), 0), fCost = funds.reduce((s, f) => s + (f.iv || 0), 0), fDiv = funds.reduce((s, f) => s + (f.div || 0), 0);
    const fPnl = fMv - fCost, fPct = fCost > 0 ? (fPnl / fCost) * 100 : 0;
    
    const cMv = crypto.reduce((s, c) => s + c.mv, 0), cCost = crypto.filter(c => c.hasCost).reduce((s, c) => s + c.cb, 0), cDiv = crypto.reduce((s, c) => s + c.div, 0);
    const cPnl = crypto.filter(c => c.hasCost).reduce((s, c) => s + c.pnl, 0), cPct = cCost > 0 ? (cPnl / cCost) * 100 : 0;

    const usMvThb = usStocks.reduce((s, u) => s + u.mvThb, 0), usCostThb = usStocks.reduce((s, u) => s + u.cbThb, 0), usDivThb = usStocks.reduce((s, u) => s + (u.div * state.fxRate), 0);
    const usPnlThb = usMvThb - usCostThb, usPct = usCostThb > 0 ? (usPnlThb / usCostThb) * 100 : 0;
    const usMvUsd = usStocks.reduce((s, u) => s + u.mvUsd, 0), usPnlUsd = usStocks.reduce((s, u) => s + u.pnlUsd, 0), usDivUsd = usStocks.reduce((s, u) => s + u.div, 0);
    const usCostUsd = usStocks.reduce((s, u) => s + u.cbUsd, 0);
    
    const totalPaidDiv = sDiv + fDiv + bDiv + cDiv + usDivThb;
    const grandMv = sMv + fMv + bMv + cMv + usMvThb, grandCost = sCost + fCost + bMv + cCost + usCostThb;
    const grandPnl = sPnl + fPnl + cPnl + usPnlThb, grandPct = grandCost > 0 ? (grandPnl / grandCost) * 100 : 0;

    return {
      stocks, funds, crypto, usStocks,
      s: { mv: sMv, cost: sCost, pnl: sPnl, pct: sPct, div: sDiv },
      f: { mv: fMv, cost: fCost, pnl: fPnl, pct: fPct, div: fDiv },
      b: { mv: bMv, ai: bAi, count: (state.bonds || []).length, div: bDiv },
      c: { mv: cMv, cost: cCost, pnl: cPnl, pct: cPct, div: cDiv },
      us: { mv: usMvThb, cost: usCostThb, pnl: usPnlThb, pct: usPct, div: usDivThb, mvUsd: usMvUsd, costUsd: usCostUsd, pnlUsd: usPnlUsd, divUsd: usDivUsd },
      grand: { mv: grandMv, cost: grandCost, pnl: grandPnl, pct: grandPct, divPaid: totalPaidDiv, divExp: bAi }
    };
  }, [state]);

  const updateCryptoPrice = useCallback((sym: string, price: number) => {
    updateState(prev => ({ ...prev, cryptoPx: { ...prev.cryptoPx, [sym]: price } }));
  }, [updateState]);

  const updateStockPrice = useCallback((sym: string, price: number) => {
    updateState(prev => ({ ...prev, stockPx: { ...prev.stockPx, [sym]: price } }));
  }, [updateState]);

  const updateFundPrice = useCallback((sym: string, price: number) => {
    updateState(prev => ({ ...prev, fundPx: { ...prev.fundPx, [sym]: price } }));
  }, [updateState]);

  const updateUsStockPrice = useCallback((sym: string, price: number) => {
    updateState(prev => ({ ...prev, usStockPx: { ...prev.usStockPx, [sym]: price } }));
  }, [updateState]);

  const updateFxRate = useCallback((rate: number) => {
    updateState(prev => ({ ...prev, fxRate: rate }));
  }, [updateState]);

  const addTransaction = useCallback((asset: 'stock' | 'fund' | 'bond' | 'crypto' | 'usStock', tx: Omit<Transaction, 'id'>) => {
    const fullId = Date.now() + Math.floor(Math.random() * 1000);
    const fullTx = { ...tx, id: fullId };
    updateState(prev => {
      const next = { ...prev };
      if (asset === 'stock') next.stockTx = [...(prev.stockTx || []), fullTx];
      else if (asset === 'fund') next.fundTx = [...(prev.fundTx || []), fullTx];
      else if (asset === 'bond') next.bondTx = [...(prev.bondTx || []), fullTx];
      else if (asset === 'crypto') next.cryptoTx = [...(prev.cryptoTx || []), fullTx];
      else if (asset === 'usStock') next.usStockTx = [...(prev.usStockTx || []), fullTx];
      return next;
    });
    syncToCloud(fullTx, true, asset);
  }, [updateState, syncToCloud]);

  const addDividendIfMissing = useCallback((asset: 'stock' | 'fund' | 'bond' | 'crypto' | 'usStock', tx: Omit<Transaction, 'id'>) => {
    let addedTx: Transaction | null = null;
    updateState(prev => {
      const txList: Transaction[] = asset === 'stock' ? (prev.stockTx || [])
        : asset === 'fund' ? (prev.fundTx || [])
        : asset === 'bond' ? (prev.bondTx || [])
        : asset === 'crypto' ? (prev.cryptoTx || [])
        : (prev.usStockTx || []);
      const already = txList.some(t => t.type === 'DIVIDEND' && t.sym === tx.sym && t.date === tx.date);
      if (already) return prev;
      const fullId = Date.now() + Math.floor(Math.random() * 9999);
      addedTx = { ...tx, id: fullId } as Transaction;
      const next = { ...prev };
      if (asset === 'stock') next.stockTx = [...(prev.stockTx || []), addedTx];
      else if (asset === 'fund') next.fundTx = [...(prev.fundTx || []), addedTx];
      else if (asset === 'bond') next.bondTx = [...(prev.bondTx || []), addedTx];
      else if (asset === 'crypto') next.cryptoTx = [...(prev.cryptoTx || []), addedTx];
      else if (asset === 'usStock') next.usStockTx = [...(prev.usStockTx || []), addedTx];
      return next;
    });
    if (addedTx) {
      syncToCloud(addedTx, true, asset);
    }
  }, [updateState, syncToCloud]);

  const deleteTransaction = useCallback((asset: 'stock' | 'fund' | 'bond' | 'crypto' | 'usStock', id: number) => {
    let deletedTx: Transaction | undefined;
    updateState(prev => {
      const next = { ...prev };
      const txs = asset === 'stock' ? (prev.stockTx || [])
        : asset === 'fund' ? (prev.fundTx || [])
        : asset === 'bond' ? (prev.bondTx || [])
        : asset === 'crypto' ? (prev.cryptoTx || [])
        : (prev.usStockTx || []);
      
      deletedTx = txs.find(t => t.id === id);
      const filtered = txs.filter(t => t.id !== id);
      
      if (asset === 'stock') next.stockTx = filtered;
      else if (asset === 'fund') next.fundTx = filtered;
      else if (asset === 'bond') next.bondTx = filtered;
      else if (asset === 'crypto') next.cryptoTx = filtered;
      else if (asset === 'usStock') next.usStockTx = filtered;
      
      if (deletedTx) {
        const key = txKey(deletedTx);
        const sig = txSig(deletedTx);
        const existingKeys = prev.deletedTxKeys || [];
        const existingSigs = prev.deletedSigs || [];
        if (!existingKeys.includes(key)) next.deletedTxKeys = [...existingKeys, key];
        if (!existingSigs.includes(sig)) next.deletedSigs = [...existingSigs, sig];
      }
      return next;
    });
    if (deletedTx) {
      syncToCloud({ ...deletedTx, type: 'DELETE_' + deletedTx.type }, true, asset);
    }
  }, [updateState, syncToCloud]);

  const exportData = useCallback(() => {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mine_invest_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "ส่งออกข้อมูลสำเร็จ", description: "ไฟล์สำรองถูกบันทึกเรียบร้อย" });
  }, [state, toast]);

  const importData = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        updateState(() => data);
        toast({ title: "นำเข้าข้อมูลสำเร็จ", description: "พอร์ตโฟลิโอถูกอัปเดตแล้ว" });
      } catch (err) {
        toast({ title: "นำเข้าข้อมูลล้มเหลว", description: "ไฟล์ไม่ถูกต้อง", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  }, [updateState, toast]);

  return {
    state, computed, canUndo,
    undoLast, addTransaction, addDividendIfMissing, deleteTransaction,
    updateStockPrice, updateFundPrice, updateCryptoPrice, updateUsStockPrice, updateFxRate,
    exportData, importData, fetchFromCloud, syncToCloud
  };
}
