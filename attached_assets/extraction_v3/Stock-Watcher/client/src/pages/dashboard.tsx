import { useState, useEffect } from "react";
import { 
  TrendingUp, Building2, Landmark, Bitcoin, History, 
  Wallet, Plus, RefreshCw, BarChart3, ChevronRight 
} from "lucide-react";
import logoImg from "@/assets/logo_no_bg.png";
import { usePortfolio, ASSET_COLORS, CRYPTO_COLORS } from "@/hooks/use-portfolio";
import { useSetIndex, useCryptoPrices } from "@/hooks/use-market-data";
import { formatNum, formatPct, ValueDisplay, PctBadge, cn } from "@/components/Formatters";
import { AddTransactionModal } from "@/components/AddTransactionModal";

type Tab = 'summary' | 'stocks' | 'funds' | 'bonds' | 'crypto' | 'history';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { state, computed, updateCryptoPrices, updateStockPrice, updateFundPrice, addTransaction, deleteTransaction } = usePortfolio();
  const { data: setIndex, isLoading: isSetLoading, refetch: refetchSet } = useSetIndex();
  
  // Extract cgids for crypto
  const cgids = Object.values(state.cryptoMeta).map(m => m.cgid).filter(Boolean);
  const { data: cryptoPrices, isSuccess: isCryptoSuccess, refetch: refetchCrypto } = useCryptoPrices(cgids);

  // Auto-refresh interval (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      refetchSet();
      refetchCrypto();
    }, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [refetchSet, refetchCrypto]);

  useEffect(() => {
    if (isCryptoSuccess && cryptoPrices) {
      updateCryptoPrices(cryptoPrices);
    }
  }, [isCryptoSuccess, cryptoPrices]);

  const tabs: { id: Tab, label: string, icon: any }[] = [
    { id: 'summary', label: 'ภาพรวม', icon: BarChart3 },
    { id: 'stocks', label: 'หุ้นไทย', icon: TrendingUp },
    { id: 'funds', label: 'กองทุน', icon: Building2 },
    { id: 'bonds', label: 'หุ้นกู้', icon: Landmark },
    { id: 'crypto', label: 'คริปโต', icon: Bitcoin },
    { id: 'history', label: 'ประวัติ', icon: History },
  ];

  const symbols = {
    stock: Object.keys(state.stockMeta),
    fund: Object.keys(state.fundMeta),
    crypto: Object.keys(state.cryptoMeta),
    bond: state.bonds.map(b => b.s)
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
      {/* HEADER */}
      <header className="bg-card border-b border-border sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h1 className="font-display font-bold text-2xl tracking-tight text-foreground flex items-center gap-2">
                <img src={logoImg} alt="Mine Invest Logo" className="w-10 h-10 object-contain" />
                Mine<span className="text-primary">Invest</span>
              </h1>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  SET Index 
                  {isSetLoading ? (
                    <span className="animate-pulse bg-muted rounded w-12 h-4 inline-block ml-1"></span>
                  ) : (
                    <span className="font-semibold text-foreground ml-1">{formatNum(setIndex?.price || 1380.50)}</span>
                  )}
                </span>
              </div>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-primary text-primary-foreground p-2 md:px-4 md:py-2 rounded-xl font-medium shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              <Plus size={18} />
              <span className="hidden md:inline">เพิ่มรายการ</span>
            </button>
          </div>

          {/* TABS */}
          <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1 -mb-4">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap",
                    isActive 
                      ? "border-primary text-primary" 
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-t-lg"
                  )}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:px-6 lg:px-8 py-8">
        
        {/* SUMMARY TAB */}
        {activeTab === 'summary' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Grand Total Card */}
            <div className="bg-card rounded-3xl p-6 md:p-8 shadow-sm border border-border relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/3"></div>
              
              <p className="text-sm font-semibold tracking-wider text-muted-foreground uppercase mb-2 relative z-10">สินทรัพย์รวม</p>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
                <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight">
                  ฿{formatNum(computed.grand.mv)}
                </h2>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <ValueDisplay value={computed.grand.pnl} decimals={0} className="text-xl font-bold block" />
                  </div>
                  <PctBadge value={computed.grand.pct} className="text-lg px-3 py-1.5" />
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4 pt-6 border-t border-border/50 relative z-10">
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><TrendingUp size={12}/> หุ้นไทย</p>
                  <p className="font-semibold">฿{formatNum(computed.s.mv, 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Building2 size={12}/> กองทุน</p>
                  <p className="font-semibold">฿{formatNum(computed.f.mv, 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Landmark size={12}/> หุ้นกู้</p>
                  <p className="font-semibold">฿{formatNum(computed.b.mv, 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Bitcoin size={12}/> คริปโต</p>
                  <p className="font-semibold">฿{formatNum(computed.c.mv, 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1 text-amber-600">ประมาณการปันผล</p>
                  <p className="font-semibold text-amber-600">฿{formatNum(computed.grand.div, 0)}</p>
                </div>
              </div>
            </div>

            {/* Allocation Bar */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              <h3 className="font-display font-semibold mb-4">สัดส่วนสินทรัพย์</h3>
              
              <div className="h-3 w-full rounded-full overflow-hidden flex gap-0.5 mb-6 bg-muted">
                {computed.s.mv > 0 && <div style={{width: `${(computed.s.mv/computed.grand.mv)*100}%`}} className="bg-blue-500 h-full transition-all duration-1000"></div>}
                {computed.f.mv > 0 && <div style={{width: `${(computed.f.mv/computed.grand.mv)*100}%`}} className="bg-emerald-500 h-full transition-all duration-1000"></div>}
                {computed.b.mv > 0 && <div style={{width: `${(computed.b.mv/computed.grand.mv)*100}%`}} className="bg-orange-500 h-full transition-all duration-1000"></div>}
                {computed.c.mv > 0 && <div style={{width: `${(computed.c.mv/computed.grand.mv)*100}%`}} className="bg-amber-500 h-full transition-all duration-1000"></div>}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { l: "หุ้นไทย", v: computed.s.mv, c: "bg-blue-500" },
                  { l: "กองทุน", v: computed.f.mv, c: "bg-emerald-500" },
                  { l: "หุ้นกู้", v: computed.b.mv, c: "bg-orange-500" },
                  { l: "คริปโต", v: computed.c.mv, c: "bg-amber-500" }
                ].filter(x => x.v > 0).map(item => (
                  <div key={item.l} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.c}`}></div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">{item.l}</p>
                      <p className="text-sm font-semibold">{formatNum((item.v/computed.grand.mv)*100, 1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STOCKS TAB */}
        {activeTab === 'stocks' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6 px-2">
              <div>
                <h2 className="text-2xl font-display font-bold">หุ้นไทย</h2>
                <p className="text-sm text-muted-foreground">{computed.stocks.length} รายการ</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">฿{formatNum(computed.s.mv)}</p>
                <ValueDisplay value={computed.s.pnl} className="text-sm font-medium" />
              </div>
            </div>

            <div className="grid gap-3">
              {computed.stocks.map(h => (
                <div key={h.sym} className="bg-card rounded-xl p-4 border border-border shadow-sm hover:shadow-md transition-shadow group flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-display font-bold text-lg">{h.sym}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[150px] md:max-w-xs">{h.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatNum(h.sh, 0)} หุ้น @ ฿{formatNum(h.avg)}
                    </div>
                  </div>
                  <div className="text-right mr-6">
                    <div className="font-semibold">฿{formatNum(h.cur)}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">ราคาตลาด</div>
                  </div>
                  <div className="text-right w-28">
                    <div className="font-bold">฿{formatNum(h.mv, 0)}</div>
                    <PctBadge value={h.pct} className="mt-1" />
                  </div>
                </div>
              ))}
              {computed.stocks.length === 0 && <EmptyState icon={TrendingUp} label="ไม่พบข้อมูลหุ้น" />}
            </div>
          </div>
        )}

        {/* FUNDS TAB */}
        {activeTab === 'funds' && (
          <div className="space-y-4 animate-in fade-in duration-300">
             <div className="flex justify-between items-center mb-6 px-2">
              <div>
                <h2 className="text-2xl font-display font-bold">กองทุนรวม</h2>
                <p className="text-sm text-muted-foreground">{computed.funds.length} รายการ</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">฿{formatNum(computed.f.mv)}</p>
                <ValueDisplay value={computed.f.pnl} className="text-sm font-medium" />
              </div>
            </div>

            <div className="grid gap-3">
              {computed.funds.map(f => (
                <div key={f.sym} className="bg-card rounded-xl p-4 border border-border shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-display font-bold text-lg truncate">{f.sym}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap" style={{backgroundColor: `${ASSET_COLORS[f.cat] || '#888'}22`, color: ASSET_COLORS[f.cat] || '#888'}}>
                        {f.cat}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{f.n}</p>
                    <p className="text-xs text-muted-foreground mt-1">เงินลงทุน: ฿{formatNum(f.iv, 0)}</p>
                  </div>
                  <div className="text-right w-28 shrink-0">
                    <div className="font-bold">฿{formatNum(f.cur, 0)}</div>
                    <PctBadge value={f.pct} className="mt-1" />
                  </div>
                </div>
              ))}
              {computed.funds.length === 0 && <EmptyState icon={Building2} label="ไม่พบข้อมูลกองทุน" />}
            </div>
          </div>
        )}

        {/* BONDS TAB */}
        {activeTab === 'bonds' && (
          <div className="space-y-4 animate-in fade-in duration-300">
             <div className="flex justify-between items-center mb-6 px-2">
              <div>
                <h2 className="text-2xl font-display font-bold">หุ้นกู้</h2>
                <p className="text-sm text-muted-foreground">{state.bonds.length} รายการ</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">฿{formatNum(computed.b.mv)}</p>
                <div className="text-sm text-amber-600 font-medium">ดอกเบี้ยรับ: ฿{formatNum(computed.b.ai, 0)}/ปี</div>
              </div>
            </div>

            <div className="grid gap-4">
              {state.bonds.map(b => (
                <div key={b.s} className="bg-card rounded-2xl p-6 border border-border shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-display font-bold text-lg">{b.s}</h3>
                      <p className="text-sm text-muted-foreground">{b.n}</p>
                    </div>
                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">
                      {b.rate}%
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs uppercase font-semibold">มูลค่าหน้าตั๋ว</p>
                      <p className="font-bold">฿{formatNum(b.face, 0)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase font-semibold">จำนวน</p>
                      <p className="font-bold">{b.units} หน่วย</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase font-semibold">วันครบกำหนด</p>
                      <p className="font-bold">{b.mat}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase font-semibold">จ่ายดอกเบี้ยครั้งถัดไป</p>
                      <p className="font-bold">{b.next}</p>
                    </div>
                  </div>
                </div>
              ))}
              {state.bonds.length === 0 && <EmptyState icon={Landmark} label="ไม่พบข้อมูลหุ้นกู้" />}
            </div>
          </div>
        )}

        {/* CRYPTO TAB */}
        {activeTab === 'crypto' && (
          <div className="space-y-4 animate-in fade-in duration-300">
             <div className="flex justify-between items-center mb-6 px-2">
              <div>
                <h2 className="text-2xl font-display font-bold">คริปโตเคอร์เรนซี</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  {computed.crypto.length} รายการ
                  <button className="text-primary hover:bg-primary/10 p-1 rounded transition-colors" onClick={() => updateCryptoPrices(cryptoPrices || {})}>
                    <RefreshCw size={12} className={!isCryptoSuccess ? 'animate-spin' : ''} />
                  </button>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">฿{formatNum(computed.c.mv)}</p>
                <ValueDisplay value={computed.c.pnl} className="text-sm font-medium" />
              </div>
            </div>

            <div className="grid gap-3">
              {computed.crypto.map(c => (
                <div key={c.sym} className="bg-card rounded-xl p-4 border border-border shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-inner" style={{backgroundColor: CRYPTO_COLORS[c.sym] || '#ccc'}}>
                      {c.sym.substring(0,3)}
                    </div>
                    <div>
                      <div className="font-display font-bold text-lg">{c.sym}</div>
                      <div className="text-xs text-muted-foreground">{formatNum(c.qty, 6)}</div>
                    </div>
                  </div>
                  
                  <div className="text-right mr-6 hidden sm:block">
                    <div className="font-medium">฿{formatNum(c.cur)}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">ราคาปัจจุบัน</div>
                  </div>

                  <div className="text-right w-28">
                    <div className="font-bold">฿{formatNum(c.mv, 0)}</div>
                    {c.hasCost && <PctBadge value={c.pct} className="mt-1" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="space-y-4 animate-in fade-in duration-300">
             <h2 className="text-2xl font-display font-bold mb-6 px-2">ประวัติการทำรายการ</h2>
             
             <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground text-xs uppercase font-semibold">
                      <tr>
                        <th className="px-4 py-3">วันที่</th>
                        <th className="px-4 py-3">สินทรัพย์</th>
                        <th className="px-4 py-3">ประเภท</th>
                        <th className="px-4 py-3 text-right">รายละเอียด</th>
                        <th className="px-4 py-3 text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {/* Combine all TXs, sort by date desc */}
                      {[
                        ...state.stockTx.map(t => ({...t, category: 'stock'})),
                        ...state.fundTx.map(t => ({...t, category: 'fund'})),
                        ...state.bondTx.map(t => ({...t, category: 'bond'})),
                        ...state.cryptoTx.map(t => ({...t, category: 'crypto'}))
                      ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((tx, i) => (
                        <tr key={`${tx.category}-${tx.id}`} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{tx.date}</td>
                          <td className="px-4 py-3 font-semibold">{tx.sym}</td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "px-2 py-1 rounded text-[10px] font-bold",
                              tx.type === 'BUY' ? "bg-blue-100 text-blue-700" :
                              tx.type === 'SELL' ? "bg-rose-100 text-rose-700" :
                              "bg-emerald-100 text-emerald-700"
                            )}>
                              {tx.type === 'BUY' ? 'ซื้อ' : tx.type === 'SELL' ? 'ขาย' : 'ปันผล'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {tx.category === 'fund' || tx.category === 'bond' ? (
                              <span>฿{formatNum(tx.amount || 0)}</span>
                            ) : (
                              <span className="text-muted-foreground">
                                {tx.qty} @ ฿{formatNum(tx.price || 0)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button 
                              onClick={() => {
                                if(confirm('ต้องการลบรายการนี้ใช่หรือไม่?')) 
                                  deleteTransaction(tx.category as any, tx.id);
                              }}
                              className="text-muted-foreground hover:text-negative transition-colors text-xs"
                            >
                              ลบ
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
          </div>
        )}

      </main>

      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={addTransaction}
        symbols={symbols}
      />
    </div>
  );
}

function EmptyState({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <div className="bg-card border border-dashed border-border rounded-2xl p-12 flex flex-col items-center justify-center text-muted-foreground">
      <Icon size={48} className="opacity-20 mb-4" />
      <p className="font-medium">{label}</p>
    </div>
  )
}
