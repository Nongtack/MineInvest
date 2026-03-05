import { useState, useEffect, useCallback } from "react";
import { 
  TrendingUp, Building2, Landmark, Bitcoin, History, 
  Wallet, Plus, RefreshCw, BarChart3, ChevronRight, Undo2 
} from "lucide-react";
import logoImg from "@/assets/logo_no_bg.png";
import { usePortfolio, ASSET_COLORS, CRYPTO_COLORS } from "@/hooks/use-portfolio";
import { useSetIndex, useCryptoPrices } from "@/hooks/use-market-data";
import { formatNum, formatPct, ValueDisplay, PctBadge, cn } from "@/components/Formatters";
import { AddTransactionModal } from "@/components/AddTransactionModal";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { motion, AnimatePresence } from "framer-motion";

type Tab = 'summary' | 'stocks' | 'funds' | 'bonds' | 'crypto' | 'dividends' | 'history';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{cat: 'stock'|'fund'|'bond'|'crypto', tx: any} | null>(null);
  
  const { state, computed, updateCryptoPrices, updateStockPrice, updateFundPrice, addTransaction, deleteTransaction, undoLast, canUndo } = usePortfolio();
  const { data: setIndex, isLoading: isSetLoading, refetch: refetchSet } = useSetIndex();
  
  const cgids = Object.values(state.cryptoMeta).map(m => m.cgid).filter(Boolean);
  const { data: cryptoPrices, isSuccess: isCryptoSuccess, refetch: refetchCrypto } = useCryptoPrices(cgids);

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchSet(), refetchCrypto()]);
  }, [refetchSet, refetchCrypto]);

  const { pullProgress, isRefreshing } = usePullToRefresh(handleRefresh);

  useEffect(() => {
    if (isCryptoSuccess && cryptoPrices) {
      updateCryptoPrices(cryptoPrices);
    }
  }, [isCryptoSuccess, cryptoPrices, updateCryptoPrices]);

  useEffect(() => {
    const interval = setInterval(() => {
      refetchSet();
      refetchCrypto();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetchSet, refetchCrypto]);

  const allSymbols = {
    stock: Object.keys(state.stockMeta),
    fund: Object.keys(state.fundMeta),
    crypto: Object.keys(state.cryptoMeta),
    bond: state.bonds.map(b => b.s)
  };

  const tabs: { id: Tab, label: string, icon: any }[] = [
    { id: 'summary', label: 'ภาพรวม', icon: BarChart3 },
    { id: 'stocks', label: 'หุ้นไทย', icon: TrendingUp },
    { id: 'funds', label: 'กองทุน', icon: Building2 },
    { id: 'bonds', label: 'หุ้นกู้', icon: Landmark },
    { id: 'crypto', label: 'คริปโต', icon: Bitcoin },
    { id: 'dividends', label: 'ปันผลสะสม', icon: Landmark },
    { id: 'history', label: 'ประวัติ', icon: History },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
      <div 
        className="flex items-center justify-center overflow-hidden transition-all duration-300 bg-background border-b border-border/50"
        style={{ height: `${pullProgress}px`, opacity: pullProgress > 0 ? 1 : 0 }}
      >
        <RefreshCw className={cn("h-5 w-5 text-primary", isRefreshing && "animate-spin")} />
      </div>

      <header className="bg-card border-b border-border sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h1 className="font-display font-bold text-2xl tracking-tight text-foreground flex items-center gap-2">
                MineInvest
                <img src={logoImg} alt="Logo" className="h-6 w-auto" />
              </h1>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider flex items-center gap-2">
                Portfolio Dashboard
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">LIVE</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              {canUndo && (
                <button 
                  onClick={undoLast}
                  className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-full transition-all"
                  title="ย้อนกลับ"
                >
                  <Undo2 size={20} />
                </button>
              )}
              <button 
                onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
                className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl flex items-center gap-2 font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98]"
              >
                <Plus size={18} strokeWidth={2.5} />
                <span className="hidden sm:inline">เพิ่มรายการ</span>
              </button>
            </div>
          </div>
          
          <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap",
                  activeTab === tab.id 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {activeTab === 'summary' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card p-6 rounded-3xl border border-border shadow-sm hover:shadow-md transition-all group">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Wallet size={14} className="text-primary" /> มูลค่าพอร์ตปัจจุบัน
                </p>
                <h3 className="text-3xl font-display font-bold tracking-tight">฿{formatNum(computed.grand.mv)}</h3>
                <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">กำไร/ขาดทุนสะสม</span>
                  <ValueDisplay value={computed.grand.pnl} className="font-bold text-sm" />
                </div>
              </div>
              <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">เงินต้นทั้งหมด</p>
                <h3 className="text-2xl font-display font-bold">฿{formatNum(computed.grand.cost)}</h3>
              </div>
              <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">SET INDEX</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-display font-bold">{isSetLoading ? '...' : formatNum(setIndex?.price || 0)}</h3>
                  <RefreshCw size={12} className={cn("text-muted-foreground", isSetLoading && "animate-spin")} />
                </div>
              </div>
              <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">ปันผลรวม</p>
                <h3 className="text-2xl font-display font-bold text-emerald-600">฿{formatNum(computed.grand.div)}</h3>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dividends' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="flex justify-between items-center mb-6 px-2">
              <div>
                <h2 className="text-2xl font-display font-bold">ปันผลสะสม (2025+)</h2>
                <p className="text-sm text-muted-foreground">สรุปรายได้จากเงินปันผลทุกสินทรัพย์</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-emerald-600">฿{formatNum(
                  [...state.stockTx, ...state.fundTx, ...state.bondTx, ...state.cryptoTx]
                    .filter(t => t.type === 'DIVIDEND' && new Date(t.date).getFullYear() >= 2025)
                    .reduce((sum, t) => sum + (t.amount || ((t.qty || 0) * (t.price || 0))), 0)
                )}</p>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm p-8 text-center">
              <Landmark size={48} className="mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                รายการปันผลจะถูกดึงมาจากประวัติการทำรายการของคุณอัตโนมัติ<br/>
                โดยเน้นรายการตั้งแต่ปี 2025 เป็นต้นไป
              </p>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden animate-in fade-in duration-300">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
              <h2 className="font-display font-bold text-lg">ประวัติรายการ</h2>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                แสดงรายการล่าสุด
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground text-left">
                    <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">วันที่</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">สินทรัพย์</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">ประเภท</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-right">จำนวน</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-right">ราคา/เงินรวม</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {[...state.stockTx.map(t => ({...t, category: 'stock'})), 
                    ...state.fundTx.map(t => ({...t, category: 'fund'})),
                    ...state.bondTx.map(t => ({...t, category: 'bond'})),
                    ...state.cryptoTx.map(t => ({...t, category: 'crypto'}))]
                    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 50)
                    .map((tx, idx) => (
                    <tr key={`${tx.category}-${tx.id}`} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-6 py-4 font-medium text-muted-foreground">{tx.date}</td>
                      <td className="px-6 py-4 font-bold text-foreground tracking-tight">{tx.sym}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          tx.type === 'BUY' ? "bg-emerald-100 text-emerald-700" : 
                          tx.type === 'SELL' ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                        )}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {tx.qty ? formatNum(tx.qty, 4) : '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-bold">
                        ฿{formatNum(tx.amount || ((tx.qty || 0) * (tx.price || 0)))}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => { setEditingItem({cat: tx.category as any, tx}); setIsModalOpen(true); }}
                            className="text-muted-foreground hover:text-primary transition-colors text-xs"
                          >
                            แก้ไข
                          </button>
                          <button 
                            onClick={() => { if(confirm('ต้องการลบรายการนี้?')) deleteTransaction(tx.category as any, tx.id); }}
                            className="text-muted-foreground hover:text-negative transition-colors text-xs"
                          >
                            ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingItem(null); }} 
        onAdd={(cat, tx) => {
          if (editingItem) deleteTransaction(editingItem.cat, editingItem.tx.id);
          addTransaction(cat, tx);
        }}
        symbols={allSymbols}
        initialData={editingItem}
      />
    </div>
  );
}
