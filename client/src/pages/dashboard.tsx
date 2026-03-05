import { useState, useEffect, useCallback, useRef } from "react";
import { 
  TrendingUp, Building2, Landmark, Bitcoin, History, 
  Wallet, Plus, RefreshCw, BarChart3, ChevronRight, Undo2, Globe
} from "lucide-react";
import logoImg from "@/assets/logo_no_bg.png";
import { usePortfolio, ASSET_COLORS, CRYPTO_COLORS } from "@/hooks/use-portfolio";
import { useSetIndex, useCryptoPrice } from "@/hooks/use-market-data";
import { formatNum, formatPct, ValueDisplay, PctBadge, cn } from "@/components/Formatters";
import { AddTransactionModal } from "@/components/AddTransactionModal";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { motion, AnimatePresence } from "framer-motion";

type Tab = 'summary' | 'stocks' | 'usStocks' | 'funds' | 'bonds' | 'crypto' | 'dividends' | 'history';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{cat: any, tx: any} | null>(null);
  
  const { state, computed, updateCryptoPrice, updateUsStockPrice, updateFxRate, undoLast, canUndo, deleteTransaction, addTransaction } = usePortfolio();
  const { data: setIndex, isLoading: isSetLoading, refetch: refetchSet } = useSetIndex();
  
  const fetchMarketData = useCallback(async () => {
    try {
      const fxRes = await fetch('/api/fx-rate');
      const fxData = await fxRes.json();
      if (fxData.rate) updateFxRate(fxData.rate);

      await Promise.all(computed.usStocks.map(async (s: any) => {
        const res = await fetch(`/api/us-stock/${s.sym}`);
        const data = await res.json();
        if (data.price) updateUsStockPrice(s.sym, data.price);
      }));
    } catch (e) {}
  }, [updateFxRate, updateUsStockPrice, computed.usStocks]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchSet(), fetchMarketData()]);
  }, [refetchSet, fetchMarketData]);

  const { pullProgress, isRefreshing } = usePullToRefresh(handleRefresh);

  // Initial fetch and interval
  useEffect(() => {
    handleRefresh();
    const interval = setInterval(handleRefresh, 60000); // Auto refresh every minute
    return () => clearInterval(interval);
  }, [handleRefresh]);

  // Sync Crypto prices from Bitkub via hook
  const CryptoPriceSyncer = ({ symbol }: { symbol: string }) => {
    const { data } = useCryptoPrice(symbol);
    useEffect(() => {
        if (data?.price) updateCryptoPrice(symbol, data.price);
    }, [data, symbol]);
    return null;
  };

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

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
      {Object.keys(state.cryptoMeta).map(sym => <CryptoPriceSyncer key={sym} symbol={sym} />)}
      
      <div className="flex items-center justify-center overflow-hidden transition-all duration-300 bg-background" style={{ height: `${pullProgress}px`, opacity: pullProgress > 0 ? 1 : 0 }}>
        <RefreshCw className={cn("h-5 w-5 text-primary", isRefreshing && "animate-spin")} />
      </div>

      <header className="bg-card border-b border-border sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h1 className="font-display font-bold text-2xl flex items-center gap-2">MineInvest<img src={logoImg} alt="Logo" className="h-6" /></h1>
              <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">Portfolio Dashboard</p>
            </div>
            <div className="flex gap-2">
              {canUndo && <button onClick={undoLast} className="p-2 text-muted-foreground hover:text-primary"><Undo2 size={20}/></button>}
              <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-primary/20"><Plus size={18}/> เพิ่มรายการ</button>
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
            <div className="bg-card p-8 rounded-3xl border border-border shadow-sm">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">สินทรัพย์รวม</p>
              <div className="flex justify-between items-end">
                <h3 className="text-4xl font-display font-bold">฿{formatNum(computed.grand.mv)}</h3>
                <div className="flex items-center gap-2">
                   <ValueDisplay value={computed.grand.pnl} className="font-bold"/>
                   <PctBadge value={computed.grand.pct}/>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8 pt-6 border-t border-border/50">
                <div><p className="text-[10px] text-muted-foreground uppercase font-bold">หุ้นไทย</p><p className="font-bold">฿{formatNum(computed.s.mv,0)}</p></div>
                <div><p className="text-[10px] text-muted-foreground uppercase font-bold">หุ้นนอก (THB)</p><p className="font-bold">฿{formatNum(computed.us.mv,0)}</p></div>
                <div><p className="text-[10px] text-muted-foreground uppercase font-bold">หุ้นนอก (USD)</p><p className="font-bold">${formatNum(computed.us.mvUsd,2)}</p></div>
                <div><p className="text-[10px] text-muted-foreground uppercase font-bold">กองทุน</p><p className="font-bold">฿{formatNum(computed.f.mv,0)}</p></div>
                <div><p className="text-[10px] text-amber-600 uppercase font-bold">ปันผลรวม</p><p className="font-bold text-amber-600">฿{formatNum(computed.grand.div,0)}</p></div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SummaryCard title="หุ้นไทย" mv={computed.s.mv} pnl={computed.s.pnl} pct={computed.s.pct} icon={TrendingUp} items={computed.stocks} />
                <SummaryCard title="หุ้นต่างประเทศ" mv={computed.us.mv} pnl={computed.us.pnl} pct={computed.us.pct} icon={Globe} items={computed.usStocks} />
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
            <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex justify-between items-center">
                <div>
                    <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">ภาพรวมหุ้นไทย</h2>
                    <p className="text-2xl font-bold">฿{formatNum(computed.s.mv)}</p>
                </div>
                <div className="text-right">
                    <ValueDisplay value={computed.s.pnl} className="font-bold"/>
                    <PctBadge value={computed.s.pct} className="block mt-1 ml-auto"/>
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
            <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex justify-between items-center">
                <div>
                    <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">สรุปปันผลรวม</h2>
                    <p className="text-2xl font-bold text-emerald-600">฿{formatNum(computed.grand.div)}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase font-bold">USD Portion</p>
                    <p className="font-bold text-emerald-600">${formatNum(computed.us.divUsd, 2)}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {[...computed.stocks, ...computed.funds, ...computed.usStocks].filter((x: any) => x.div > 0).map((x: any) => (
                 <div key={x.sym} className="bg-card p-4 rounded-xl border border-border flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="font-bold">{x.sym}</span>
                        <span className="text-[10px] text-muted-foreground">{x.name || x.n}</span>
                    </div>
                    <span className="text-emerald-600 font-bold">฿{formatNum(x.mvThb ? x.div * state.fxRate : x.div)}</span>
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
             <table className="w-full text-sm text-left">
                <thead className="bg-muted text-[10px] uppercase font-bold text-muted-foreground">
                   <tr><th className="px-4 py-3">วันที่</th><th className="px-4 py-3">สินทรัพย์</th><th className="px-4 py-3">ประเภท</th><th className="px-4 py-3 text-right">จำนวน</th><th className="px-4 py-3 text-center">จัดการ</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                   {[...state.stockTx.map(t=>({...t,c:'stock'})),...state.fundTx.map(t=>({...t,c:'fund'})),...state.bondTx.map(t=>({...t,c:'bond'})),...state.cryptoTx.map(t=>({...t,c:'crypto'})),...state.usStockTx.map(t=>({...t,c:'usStock'}))].sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()).map(tx => (
                     <tr key={tx.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">{tx.date}</td>
                        <td className="px-4 py-3 font-bold">{tx.sym}</td>
                        <td className="px-4 py-3"><span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", tx.type==='BUY'?'bg-blue-100 text-blue-700':tx.type==='SELL'?'bg-rose-100 text-rose-700':'bg-emerald-100 text-emerald-700')}>{tx.type}</span></td>
                        <td className="px-4 py-3 text-right">{tx.qty || tx.amount}</td>
                        <td className="px-4 py-3 text-center"><button onClick={()=>deleteTransaction(tx.c as any, tx.id)} className="text-rose-500 text-xs font-bold">ลบ</button></td>
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

function SummaryCard({ title, mv, pnl, pct, icon: Icon, items }: { title: string, mv: number, pnl: number, pct: number, icon: any, items: any[] }) {
    return (
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2"><Icon size={18} className="text-primary"/><span className="font-bold">{title}</span></div>
                <PctBadge value={pct} />
            </div>
            <div className="mb-4">
                <p className="text-xs text-muted-foreground uppercase font-bold">มูลค่าปัจจุบัน</p>
                <p className="text-2xl font-bold">฿{formatNum(mv)}</p>
            </div>
            <div className="flex-1 space-y-2 mt-2 pt-4 border-t border-border/50">
                {items.slice(0, 3).map(item => (
                    <div key={item.sym} className="flex justify-between text-xs">
                        <span className="font-semibold">{item.sym}</span>
                        <span>฿{formatNum(item.mvThb || item.mv, 0)}</span>
                    </div>
                ))}
                {items.length > 3 && <p className="text-[10px] text-muted-foreground italic">... และอีก {items.length - 3} รายการ</p>}
            </div>
        </div>
    );
}
