import { useState, useEffect, useCallback, useRef } from "react";
import { 
  TrendingUp, Building2, Landmark, Bitcoin, History, 
  Wallet, Plus, RefreshCw, BarChart3, ChevronRight, Undo2, Globe
} from "lucide-react";
import logoImg from "@/assets/logo_no_bg.png";
import { usePortfolio, ASSET_COLORS, CRYPTO_COLORS } from "@/hooks/use-portfolio";
import { useSetIndex, useCryptoPrices } from "@/hooks/use-market-data";
import { formatNum, formatPct, ValueDisplay, PctBadge, cn } from "@/components/Formatters";
import { AddTransactionModal } from "@/components/AddTransactionModal";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { motion, AnimatePresence } from "framer-motion";

type Tab = 'summary' | 'stocks' | 'usStocks' | 'funds' | 'bonds' | 'crypto' | 'dividends' | 'history';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{cat: any, tx: any} | null>(null);
  
  const { 
    state, computed, 
    updateCryptoPrice, updateUsStockPrice, updateStockPrice, updateFundPrice, updateFxRate, 
    undoLast, canUndo, deleteTransaction, addTransaction, addDividendIfMissing
  } = usePortfolio();
  
  const { data: setIndex, isLoading: isSetLoading, refetch: refetchSet } = useSetIndex();
  const { data: cryptoPrices, refetch: refetchCrypto } = useCryptoPrices();
  
  const fetchMarketData = useCallback(async () => {
    try {
      const fxRes = await fetch('/api/fx-rate');
      const fxData = await fxRes.json();
      if (fxData.rate) updateFxRate(fxData.rate);

      await Promise.all(computed.stocks.map(async (s: any) => {
        try {
          const res = await fetch(`/api/stock/${s.sym}`);
          const data = await res.json();
          if (data.price) updateStockPrice(s.sym, data.price);
          
          // Fetch 2025 Dividends for Thai Stocks (Auto-sync)
          const dRes = await fetch(`/api/stock/${s.sym}/dividends`);
          const dData = await dRes.json();
          dData.forEach((d: any) => {
            addDividendIfMissing('stock', {
              id: Date.now() + Math.random(),
              date: d.date,
              sym: s.sym,
              type: 'DIVIDEND',
              qty: s.sh,
              price: d.amount,
              note: `Auto-sync (${d.amount}/หุ้น)`
            });
          });
        } catch(e) {}
      }));

      // Fetch US Stock Prices & Dividends (Auto-sync)
      await Promise.all(computed.usStocks.map(async (s: any) => {
        try {
          const res = await fetch(`/api/us-stock/${s.sym}`);
          const data = await res.json();
          if (data.price) updateUsStockPrice(s.sym, data.price);

          // US Stock Dividends sync if API supported (Placeholder/Future)
        } catch (e) {}
      }));

      // Fetch Fund Prices Only (No Auto-dividend for funds as requested)
      await Promise.all(computed.funds.map(async (f: any) => {
        try {
          const res = await fetch(`/api/fund/${f.sym}`);
          const data = await res.json();
          if (data.price) updateFundPrice(f.sym, data.price);
        } catch (e) {}
      }));
      
    } catch (e) {}
  }, [updateFxRate, updateUsStockPrice, updateStockPrice, updateFundPrice, computed.usStocks, computed.stocks, computed.funds, addDividendIfMissing]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchSet(), refetchCrypto(), fetchMarketData()]);
  }, [refetchSet, refetchCrypto, fetchMarketData]);

  const { pullProgress, isRefreshing } = usePullToRefresh(handleRefresh);

  useEffect(() => {
    if (cryptoPrices) {
        Object.keys(state.cryptoMeta).forEach(sym => {
            if (cryptoPrices[sym]) updateCryptoPrice(sym, cryptoPrices[sym]);
        });
    }
  }, [cryptoPrices, updateCryptoPrice, state.cryptoMeta]);

  useEffect(() => {
    handleRefresh();
    const interval = setInterval(handleRefresh, 10000); // อัปเดตทุก 10 วินาที เพื่อความเป็น Real-time
    return () => clearInterval(interval);
  }, [handleRefresh]);

  const tabs: { id: Tab, label: string, icon: any }[] = [
    { id: 'summary', label: 'ภาพรวม', icon: BarChart3 },
    { id: 'stocks', label: 'หุ้นไทย', icon: TrendingUp },
    { id: 'usStocks', label: 'หุ้นนอก', icon: Globe },
    { id: 'funds', label: 'กองทุน', icon: Building2 },
    { id: 'bonds', label: 'หุ้นกู้', icon: Landmark },
    { id: 'crypto', label: 'คริปโต', icon: Bitcoin },
    { id: 'dividends', label: 'ปันผลสะสม', icon: Landmark },
    { id: 'history', label: 'ประวัติ', icon: History },
  ];

  const allSymbols = {
    stock: Object.keys(state.stockMeta),
    fund: Object.keys(state.fundMeta),
    crypto: Object.keys(state.cryptoMeta),
    bond: state.bonds.map(b => b.s),
    usStock: Object.keys(state.usStockMeta)
  };

  const [selectedYear, setSelectedYear] = useState<string>('2025');
  const [selectedCat, setSelectedCat] = useState<string>('all');

  const allDividends = [
    ...state.stockTx.filter(t => t.type === 'DIVIDEND').map(t => ({ ...t, cat: 'stock', displaySym: t.sym, displayAmt: (t.qty || 0) * (t.price || 0) })),
    ...state.fundTx.filter(t => t.type === 'DIVIDEND').map(t => ({ ...t, cat: 'fund', displaySym: t.sym, displayAmt: t.amount || 0 })),
    ...state.cryptoTx.filter(t => t.type === 'DIVIDEND').map(t => ({ ...t, cat: 'crypto', displaySym: t.sym, displayAmt: (t.qty || 0) * (t.price || 0) })),
    ...state.usStockTx.filter(t => t.type === 'DIVIDEND').map(t => ({ ...t, cat: 'usStock', displaySym: t.sym, displayAmt: (t.qty || 0) * (t.price || 0) * state.fxRate, isUsd: true, usdAmt: (t.qty || 0) * (t.price || 0) })),
    ...state.bondTx.filter(t => t.type === 'DIVIDEND').map(t => ({ ...t, cat: 'bond', displaySym: t.sym, displayAmt: t.amount || 0 })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const availableYears = Array.from(new Set(allDividends.map(d => d.date.substring(0, 4))));
  
  // Years from 2026 (2569) to 2030 (2573)
  const futureYears = ["2026", "2027", "2028", "2029", "2030"];
  
  const years = Array.from(new Set([...availableYears, ...futureYears]))
    .sort((a, b) => b.localeCompare(a));
  
  // Set default year to current year if available
  useEffect(() => {
    const currentYear = new Date().getFullYear().toString();
    if (years.includes(currentYear) && selectedYear === '2025' && currentYear !== '2025') {
        setSelectedYear(currentYear);
    }
  }, [years]);

  const filteredDividends = allDividends.filter(d => 
    d.date.startsWith(selectedYear) && 
    (selectedCat === 'all' || d.cat === selectedCat)
  );
  const yearTotal = filteredDividends.reduce((s, d) => s + d.displayAmt, 0);

  const catNames: Record<string, string> = {
    all: 'ทั้งหมด',
    stock: 'หุ้นไทย',
    fund: 'กองทุน',
    crypto: 'คริปโต',
    usStock: 'หุ้นนอก',
    bond: 'ตราสารหนี้'
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
      <div className="flex items-center justify-center overflow-hidden transition-all duration-300 bg-background" style={{ height: `${pullProgress}px`, opacity: pullProgress > 0 ? 1 : 0 }}>
        <RefreshCw className={cn("h-5 w-5 text-primary", isRefreshing && "animate-spin")} />
      </div>

      <header className="bg-card border-b border-border sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex justify-between items-end mb-4 gap-2">
            <div className="min-w-0">
              <h1 className="font-display font-bold text-xl sm:text-2xl flex items-center gap-2 truncate">
                MineInvest
                <img src={logoImg} alt="Logo" className="h-5 sm:h-6 shrink-0" />
              </h1>
              <p className="text-muted-foreground text-[8px] sm:text-[10px] uppercase font-bold tracking-widest truncate">Portfolio Dashboard</p>
            </div>
            <div className="flex gap-1 sm:gap-2 shrink-0">
              {canUndo && <button onClick={undoLast} className="p-1.5 sm:p-2 text-muted-foreground hover:text-primary"><Undo2 size={18}/></button>}
              <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="bg-primary text-primary-foreground px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold shadow-lg shadow-primary/20"><Plus size={16}/> <span className="hidden xs:inline">เพิ่มรายการ</span><span className="xs:hidden">เพิ่ม</span></button>
            </div>
          </div>
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all", activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
                <tab.icon size={16}/> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 pb-24">
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <div className="bg-card p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-border shadow-sm">
              <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 sm:mb-2">สินทรัพย์รวม</p>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
                <h3 className="text-3xl sm:text-4xl font-display font-bold truncate">฿{formatNum(computed.grand.mv)}</h3>
                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-1">
                   <div className="flex items-center gap-1.5 sm:gap-2">
                     <ValueDisplay value={computed.grand.pnl} className="font-bold text-sm sm:text-base"/>
                     <PctBadge value={computed.grand.pct} className="scale-90 sm:scale-100"/>
                   </div>
                   <div className="text-[8px] sm:text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                     {isRefreshing || isSetLoading ? <RefreshCw size={8} className="animate-spin" /> : <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500" />}
                     Real-time Linked
                   </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-border/50">
                <div className="min-w-0"><p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase font-bold truncate">หุ้นไทย</p><p className="font-bold text-sm sm:text-base truncate">฿{formatNum(computed.s.mv,0)}</p></div>
                <div className="min-w-0"><p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase font-bold truncate">หุ้นนอก (THB)</p><p className="font-bold text-sm sm:text-base truncate">฿{formatNum(computed.us.mv,0)}</p></div>
                <div className="min-w-0"><p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase font-bold truncate">หุ้นนอก (USD)</p><p className="font-bold text-sm sm:text-base truncate">${formatNum(computed.us.mvUsd,2)}</p></div>
                <div className="min-w-0"><p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase font-bold truncate">กองทุน</p><p className="font-bold text-sm sm:text-base truncate">฿{formatNum(computed.f.mv,0)}</p></div>
                <div className="min-w-0"><p className="text-[8px] sm:text-[10px] text-amber-600 uppercase font-bold truncate">ปันผลรวม</p><p className="font-bold text-sm sm:text-base text-amber-600 truncate">฿{formatNum(computed.grand.divPaid,0)}</p></div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <SummaryCard title="หุ้นไทย" mv={computed.s.mv} pnl={computed.s.pnl} pct={computed.s.pct} icon={TrendingUp} items={computed.stocks} setIndex={setIndex} isSetLoading={isSetLoading} />
                <SummaryCard title="หุ้นต่างประเทศ" mv={computed.us.mv} pnl={computed.us.pnl} pct={computed.us.pct} icon={Globe} items={computed.usStocks} mvUsd={computed.us.mvUsd} pnlUsd={computed.us.pnlUsd} />
                <SummaryCard title="กองทุนรวม" mv={computed.f.mv} pnl={computed.f.pnl} pct={computed.f.pct} icon={Building2} items={computed.funds} />
                <SummaryCard title="คริปโต" mv={computed.c.mv} pnl={computed.c.pnl} pct={computed.c.pct} icon={Bitcoin} items={computed.crypto} />
            </div>
          </div>
        )}

        {activeTab === 'usStocks' && (
          <div className="space-y-6">
            <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">ภาพรวมหุ้นต่างประเทศ</h2>
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <p className="text-xs text-muted-foreground">มูลค่ารวม (THB)</p>
                        <p className="text-2xl font-bold">฿{formatNum(computed.us.mv)}</p>
                        <ValueDisplay value={computed.us.pnl} className="text-sm font-bold"/>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">มูลค่ารวม (USD)</p>
                        <p className="text-2xl font-bold">${formatNum(computed.us.mvUsd, 2)}</p>
                        <ValueDisplay value={computed.us.pnlUsd} prefix="$" className="text-sm font-bold"/>
                    </div>
                </div>
            </div>

            <div className="grid gap-3">
              {computed.usStocks.map((u: any) => (
                <div key={u.sym} className="bg-card p-4 rounded-xl border border-border flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2"><span className="font-bold text-lg">{u.sym}</span><span className="text-xs text-muted-foreground">{u.name}</span></div>
                    <p className="text-xs text-muted-foreground">{formatNum(u.qty,3)} shares @ ${formatNum(u.avg)} | ปันผล: ${formatNum(u.div)}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">฿{formatNum(u.mvThb,0)}</div>
                    <div className="text-[10px] text-muted-foreground">${formatNum(u.mvUsd,2)}</div>
                    <PctBadge value={u.pct} className="mt-1 scale-90 origin-right"/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'stocks' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 bg-card p-6 rounded-3xl border border-border shadow-sm flex justify-between items-center">
                  <div>
                      <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">ภาพรวมหุ้นไทย</h2>
                      <p className="text-2xl font-bold">฿{formatNum(computed.s.mv)}</p>
                  </div>
                  <div className="text-right">
                      <ValueDisplay value={computed.s.pnl} className="font-bold"/>
                      <PctBadge value={computed.s.pct} className="block mt-1 ml-auto"/>
                  </div>
              </div>
              <div className="flex-1 bg-card p-6 rounded-3xl border border-border shadow-sm flex justify-between items-center">
                  <div>
                      <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">SET INDEX</h2>
                      <p className="text-2xl font-bold">{isSetLoading ? "..." : formatNum(setIndex?.price || 0, 2)}</p>
                  </div>
                  <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">SET.OR.TH (via Yahoo)</p>
                      <p className="text-[10px] text-muted-foreground">{setIndex?.time ? new Date(setIndex.time).toLocaleTimeString() : ""}</p>
                  </div>
              </div>
            </div>
            <div className="grid gap-3">
              {computed.stocks.map((h: any) => (
                <div key={h.sym} className="bg-card p-4 rounded-xl border border-border flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2"><span className="font-bold text-lg">{h.sym}</span><span className="text-xs text-muted-foreground">{h.name}</span></div>
                    <p className="text-xs text-muted-foreground">{formatNum(h.sh,0)} หุ้น @ ฿{formatNum(h.avg)} | ปันผล: ฿{formatNum(h.div)}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">฿{formatNum(h.mv,0)}</div>
                    <PctBadge value={h.pct} className="mt-1 scale-90 origin-right"/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'funds' && (
          <div className="space-y-6">
            <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex justify-between items-center">
                <div>
                    <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">ภาพรวมกองทุนรวม</h2>
                    <p className="text-2xl font-bold">฿{formatNum(computed.f.mv)}</p>
                </div>
                <div className="text-right">
                    <ValueDisplay value={computed.f.pnl} className="font-bold"/>
                    <PctBadge value={computed.f.pct} className="block mt-1 ml-auto"/>
                </div>
            </div>
            <div className="grid gap-3">
              {computed.funds.map((f: any) => (
                <div key={f.sym} className="bg-card p-4 rounded-xl border border-border flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2"><span className="font-bold text-lg">{f.sym}</span><span className="text-[10px] px-2 py-0.5 rounded-full bg-muted">{f.cat}</span></div>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{f.n}</p>
                    <p className="text-xs text-muted-foreground mt-1">ทุน: ฿{formatNum(f.iv,0)} | ปันผล: ฿{formatNum(f.div,0)}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">฿{formatNum(f.cur,0)}</div>
                    <PctBadge value={f.pct} className="mt-1 scale-90 origin-right"/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'crypto' && (
          <div className="space-y-6">
            <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex justify-between items-center">
                <div>
                    <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">ภาพรวมคริปโต</h2>
                    <p className="text-2xl font-bold">฿{formatNum(computed.c.mv)}</p>
                </div>
                <div className="text-right">
                    <ValueDisplay value={computed.c.pnl} className="font-bold"/>
                    <PctBadge value={computed.c.pct} className="block mt-1 ml-auto"/>
                </div>
            </div>
            <div className="grid gap-3">
              {computed.crypto.map((c: any) => (
                <div key={c.sym} className="bg-card p-4 rounded-xl border border-border flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-inner" style={{backgroundColor: CRYPTO_COLORS[c.sym] || '#ccc'}}>
                      {c.sym.substring(0,3)}
                    </div>
                    <div>
                      <div className="font-display font-bold text-lg">{c.sym}</div>
                      <div className="text-xs text-muted-foreground">{formatNum(c.qty, 6)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">฿{formatNum(c.mv, 0)}</div>
                    {c.hasCost && <PctBadge value={c.pct} className="mt-1 scale-90 origin-right" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'bonds' && (
          <div className="space-y-6">
            <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex justify-between items-center">
                <div>
                    <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">ภาพรวมหุ้นกู้</h2>
                    <p className="text-2xl font-bold">฿{formatNum(computed.b.mv)}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">ดอกเบี้ยคาดการณ์</p>
                    <p className="font-bold text-emerald-600">฿{formatNum(computed.b.ai)}</p>
                </div>
            </div>
            <div className="grid gap-4">
              {state.bonds.map((b: any) => (
                <div key={b.s} className="bg-card rounded-2xl p-6 border border-border">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{b.s}</h3>
                      <p className="text-sm text-muted-foreground">{b.n}</p>
                    </div>
                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">{b.rate}%</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-muted-foreground text-xs uppercase font-bold">หน้าตั๋ว</p><p className="font-bold">฿{formatNum(b.face, 0)}</p></div>
                    <div><p className="text-muted-foreground text-xs uppercase font-bold">วันครบกำหนด</p><p className="font-bold">{b.mat}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'dividends' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="flex-1 bg-card p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-border shadow-sm flex items-center justify-between">
                <h2 className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-widest truncate mr-2">เลือกปีที่ต้องการดู</h2>
                <div className="flex items-center gap-1 sm:gap-2">
                  <button 
                    onClick={() => {
                      const idx = years.indexOf(selectedYear);
                      if (idx < years.length - 1) setSelectedYear(years[idx + 1]);
                    }}
                    className="p-1.5 sm:p-2 hover:bg-muted rounded-full transition-colors disabled:opacity-30"
                    disabled={years.indexOf(selectedYear) === years.length - 1}
                  >
                    <ChevronRight className="rotate-180" size={18} />
                  </button>
                  <span className="font-bold text-base sm:text-lg min-w-[60px] sm:min-w-[80px] text-center">
                    {parseInt(selectedYear) + 543}
                  </span>
                  <button 
                    onClick={() => {
                      const idx = years.indexOf(selectedYear);
                      if (idx > 0) setSelectedYear(years[idx - 1]);
                    }}
                    className="p-1.5 sm:p-2 hover:bg-muted rounded-full transition-colors disabled:opacity-30"
                    disabled={years.indexOf(selectedYear) <= 0}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                <div className="relative group w-full">
                  <select 
                    value={selectedCat}
                    onChange={(e) => setSelectedCat(e.target.value)}
                    className="w-full appearance-none bg-card p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-border shadow-sm font-bold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {Object.entries(catNames).map(([id, label]) => (
                      <option key={id} value={id}>{label}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                    <ChevronRight className="rotate-90" size={16} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-border shadow-sm">
                  <h2 className="text-[10px] sm:text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">ยอดปันผลปี {parseInt(selectedYear) + 543} (Paid)</h2>
                  <p className="text-2xl sm:text-3xl font-bold text-emerald-600">฿{formatNum(yearTotal)}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">ยอดรวมเงินปันผลที่ได้รับแล้วเฉพาะในปีที่เลือก</p>
              </div>
              <div className="bg-card p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-border shadow-sm">
                  <h2 className="text-[10px] sm:text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">ส่วนที่เป็น USD ({parseInt(selectedYear) + 543})</h2>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-600">${formatNum(filteredDividends.filter(d => d.isUsd).reduce((s, d) => s + (d.usdAmt || 0), 0), 2)}</p>
              </div>
              <div className="bg-card p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-border shadow-sm bg-primary/5">
                  <h2 className="text-[10px] sm:text-sm font-bold text-primary uppercase tracking-widest mb-1">ปันผลสะสมทั้งหมด</h2>
                  <p className="text-2xl sm:text-3xl font-bold text-primary">฿{formatNum(computed.grand.divPaid)}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">ยอดปันผลรวมทุกปีตั้งแต่เริ่มลงทุน</p>
              </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-[10px] sm:text-sm font-bold text-muted-foreground uppercase tracking-widest">รายการปันผลปี {parseInt(selectedYear) + 543}</h3>
                <div className="bg-card rounded-xl sm:rounded-2xl border border-border overflow-hidden overflow-x-auto no-scrollbar">
                    <table className="w-full text-xs sm:text-sm text-left min-w-[300px]">
                        <thead className="bg-muted text-[8px] sm:text-[10px] uppercase font-bold text-muted-foreground">
                            <tr><th className="px-3 sm:px-4 py-3">วันที่</th><th className="px-3 sm:px-4 py-3">สินทรัพย์</th><th className="px-3 sm:px-4 py-3 text-right">จำนวนเงิน</th></tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredDividends.map(div => (
                                <tr key={div.id} className="hover:bg-muted/30">
                                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap">{div.date}</td>
                                    <td className="px-3 sm:px-4 py-3 font-bold truncate max-w-[100px]">{div.displaySym}</td>
                                    <td className="px-3 sm:px-4 py-3 text-right font-bold text-emerald-600">฿{formatNum(div.displayAmt)} {div.isUsd && <span className="text-[8px] sm:text-[10px] text-muted-foreground block sm:inline sm:ml-1">(${formatNum(div.usdAmt, 2)})</span>}</td>
                                </tr>
                            ))}
                            {filteredDividends.length === 0 && (
                              <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground italic">ไม่มีข้อมูลการปันผลในปีนี้</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-card rounded-xl sm:rounded-2xl border border-border overflow-hidden overflow-x-auto no-scrollbar">
             <table className="w-full text-xs sm:text-sm text-left min-w-[500px]">
                <thead className="bg-muted text-[8px] sm:text-[10px] uppercase font-bold text-muted-foreground">
                   <tr><th className="px-3 sm:px-4 py-3">วันที่</th><th className="px-3 sm:px-4 py-3">สินทรัพย์</th><th className="px-3 sm:px-4 py-3">ประเภท</th><th className="px-3 sm:px-4 py-3 text-right">จำนวน</th><th className="px-3 sm:px-4 py-3 text-center">จัดการ</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                   {[...state.stockTx.map(t=>({...t,c:'stock'})),...state.fundTx.map(t=>({...t,c:'fund'})),...state.bondTx.map(t=>({...t,c:'bond'})),...state.cryptoTx.map(t=>({...t,c:'crypto'})),...state.usStockTx.map(t=>({...t,c:'usStock'}))].sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()).map(tx => (
                     <tr key={tx.id} className="hover:bg-muted/30">
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap">{tx.date}</td>
                        <td className="px-3 sm:px-4 py-3 font-bold">{tx.sym}</td>
                        <td className="px-3 sm:px-4 py-3"><span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", tx.type==='BUY'?'bg-blue-100 text-blue-700':tx.type==='SELL'?'bg-rose-100 text-rose-700':'bg-emerald-100 text-emerald-700')}>{tx.type}</span></td>
                        <td className="px-3 sm:px-4 py-3 text-right font-bold">฿{formatNum(tx.amount || ((tx.qty || 0) * (tx.price || 0)))}</td>
                        <td className="px-3 sm:px-4 py-3 text-center"><button onClick={()=>deleteTransaction(tx.c as any, tx.id)} className="text-rose-500 text-xs font-bold hover:bg-rose-50 px-2 py-1 rounded">ลบ</button></td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}
      </main>

      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingItem(null); }} 
        onAdd={(cat, tx) => {
          if (editingItem) deleteTransaction(editingItem.cat, editingItem.tx.id);
          addTransaction(cat as any, tx);
        }}
        symbols={allSymbols}
        initialData={editingItem}
      />
    </div>
  );
}

function SummaryCard({ title, mv, pnl, pct, icon: Icon, items, setIndex, isSetLoading, mvUsd, pnlUsd }: { title: string, mv: number, pnl: number, pct: number, icon: any, items: any[], setIndex?: any, isSetLoading?: boolean, mvUsd?: number, pnlUsd?: number }) {
    return (
        <div className="bg-card p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-border shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0"><Icon size={16} className="text-primary shrink-0"/><span className="font-bold text-sm sm:text-base truncate">{title}</span></div>
                <PctBadge value={pct} className="scale-90 origin-right" />
            </div>
            
            <div className="mb-3 sm:mb-4">
                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase font-bold">มูลค่าปัจจุบัน</p>
                <p className="text-xl sm:text-2xl font-bold truncate">฿{formatNum(mv)}</p>
                {mvUsd !== undefined && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 truncate">${formatNum(mvUsd, 2)} (USD)</p>
                )}
            </div>

            {setIndex && (
              <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-muted/50 rounded-lg sm:rounded-xl border border-border/50">
                <div className="flex justify-between items-center gap-2">
                  <div className="min-w-0">
                    <p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase font-bold truncate">SET INDEX</p>
                    <p className="text-base sm:text-lg font-bold truncate">{isSetLoading ? "..." : formatNum(setIndex.price, 2)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase font-bold">SET.OR.TH</p>
                    <p className="text-[7px] sm:text-[8px] text-muted-foreground">{setIndex.time ? new Date(setIndex.time).toLocaleTimeString() : ""}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 space-y-1.5 sm:space-y-2 mt-2 pt-3 sm:pt-4 border-t border-border/50">
                {items.slice(0, 3).map(item => (
                    <div key={item.sym} className="flex justify-between text-[10px] sm:text-xs gap-2">
                        <span className="font-semibold truncate">{item.sym}</span>
                        <span className="shrink-0">฿{formatNum(item.mvThb || item.mv, 0)}</span>
                    </div>
                ))}
                {items.length > 3 && <p className="text-[8px] sm:text-[10px] text-muted-foreground italic mt-1">... และอีก {items.length - 3} รายการ</p>}
            </div>
        </div>
    );
}
