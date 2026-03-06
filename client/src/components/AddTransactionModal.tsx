import { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { TransactionType } from '@/hooks/use-portfolio';
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (asset: 'stock'|'fund'|'crypto'|'bond'|'usStock', tx: any) => void;
  symbols: {
    stock: string[];
    fund: string[];
    crypto: string[];
    bond: string[];
    usStock: string[];
  };
  initialData?: { cat: 'stock'|'fund'|'crypto'|'bond'|'usStock', tx: any } | null;
}

export function AddTransactionModal({ isOpen, onClose, onAdd, symbols, initialData }: Props) {
  const [assetType, setAssetType] = useState<'stock'|'fund'|'crypto'|'bond'|'usStock'>('stock');
  const [date, setDate] = useState(todayStr());
  const [sym, setSym] = useState('');
  const [type, setType] = useState<TransactionType>('BUY');
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (initialData && isOpen) {
      const { cat, tx } = initialData;
      setAssetType(cat);
      setSym(tx.sym);
      setType(tx.type);
      setDate(tx.date);
      setQty(tx.qty?.toString() || '');
      setPrice(tx.price?.toString() || '');
      setAmount(tx.amount?.toString() || '');
      setNote(tx.note || '');
    } else if (isOpen) {
      setSym('');
      setQty('');
      setPrice('');
      setAmount('');
      setNote('');
      setDate(todayStr());
      setType('BUY');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sym) return alert('Symbol is required');
    
    const tx: any = { date, sym: sym.toUpperCase(), type, note };
    
    if (assetType === 'stock' || assetType === 'crypto' || assetType === 'usStock' || assetType === 'fund') {
      if (assetType === 'fund' && type === 'DIVIDEND') {
        tx.amount = parseFloat(amount) || 0;
        tx.qty = parseFloat(qty) || 0;
        tx.price = parseFloat(price) || 0;
      } else {
        tx.qty = parseFloat(qty) || 0;
        tx.price = parseFloat(price) || 0;
      }
    } else if (assetType === 'bond') {
      tx.amount = parseFloat(amount) || 0;
    }
    
    onAdd(assetType, tx);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="font-display font-bold text-lg">เพิ่มรายการบันทึก</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex bg-muted p-1 rounded-xl overflow-x-auto no-scrollbar">
            {(['stock', 'usStock', 'fund', 'bond', 'crypto'] as const).map(t => (
              <button
                key={t}
                type="button"
                className={`flex-1 min-w-[60px] py-2 text-xs font-medium rounded-lg transition-all ${assetType === t ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setAssetType(t)}
              >
                {t === 'stock' ? 'หุ้นไทย' : t === 'fund' ? 'กองทุน' : t === 'bond' ? 'หุ้นกู้' : t === 'crypto' ? 'คริปโต' : 'หุ้นนอก'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">วันที่</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
            </div>
            
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">ชื่อย่อ</label>
              <div className="relative group/select">
                <input 
                  type="text" 
                  list={`${assetType}-list`} 
                  value={sym} 
                  onChange={e => setSym(e.target.value)} 
                  required 
                  placeholder="พิมพ์ชื่อใหม่ได้ที่นี่" 
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all uppercase pr-8" 
                />
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
              <datalist id={`${assetType}-list`}>
                {symbols[assetType]?.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">ประเภท</label>
              <div className="relative group/select">
                <select value={type} onChange={e => setType(e.target.value as TransactionType)} className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none pr-8">
                  <option value="BUY">🟢 ซื้อ (Buy)</option>
                  <option value="SELL">🔴 ขาย (Sell)</option>
                  <option value="DIVIDEND">🔵 ปันผล (Dividend)</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {assetType === 'bond' || (assetType === 'fund' && type === 'DIVIDEND') ? (
              <>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">จำนวนเงิน (บาท)</label>
                  <input type="number" step="any" value={amount} onChange={e => setAmount(e.target.value)} required className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                </div>
                {assetType === 'fund' && type === 'DIVIDEND' && (
                  <>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">จำนวนหน่วยที่ถือ (ไม่บังคับ)</label>
                      <input type="number" step="any" value={qty} onChange={e => setQty(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">ปันผลต่อหน่วย (ไม่บังคับ)</label>
                      <input type="number" step="any" value={price} onChange={e => setPrice(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">{type === 'DIVIDEND' ? 'จำนวนหุ้น/หน่วยที่ถือ' : 'จำนวน'}</label>
                  <input type="number" step="any" value={qty} onChange={e => setQty(e.target.value)} required className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">{type === 'DIVIDEND' ? 'ปันผลต่อหน่วย' : 'ราคา/NAV'}</label>
                  <input type="number" step="any" value={price} onChange={e => setPrice(e.target.value)} required className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                </div>
              </>
            )}

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">บันทึกเพิ่มเติม (ไม่บังคับ)</label>
              <input type="text" value={note} onChange={e => setNote(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl font-medium text-foreground bg-muted hover:bg-muted/80 transition-colors">
              ยกเลิก
            </button>
            <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl font-medium text-primary-foreground bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
              บันทึกรายการ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
