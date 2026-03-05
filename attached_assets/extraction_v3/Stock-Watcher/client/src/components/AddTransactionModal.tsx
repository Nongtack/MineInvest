import { useState } from 'react';
import { X } from 'lucide-react';
import { TransactionType } from '@/hooks/use-portfolio';
import { format } from 'date-fns';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (asset: 'stock'|'fund'|'crypto'|'bond', tx: any) => void;
  symbols: {
    stock: string[];
    fund: string[];
    crypto: string[];
    bond: string[];
  }
}

export function AddTransactionModal({ isOpen, onClose, onAdd, symbols }: Props) {
  const [assetType, setAssetType] = useState<'stock'|'fund'|'crypto'|'bond'>('stock');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [sym, setSym] = useState('');
  const [type, setType] = useState<TransactionType>('BUY');
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sym) return alert('Symbol is required');
    
    const tx: any = { date, sym: sym.toUpperCase(), type, note };
    
    if (assetType === 'stock' || assetType === 'crypto') {
      tx.qty = parseFloat(qty) || 0;
      tx.price = parseFloat(price) || 0;
    } else if (assetType === 'fund' || assetType === 'bond') {
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
            {(['stock', 'fund', 'bond', 'crypto'] as const).map(t => (
              <button
                key={t}
                type="button"
                className={`flex-1 min-w-[60px] py-2 text-xs font-medium rounded-lg transition-all ${assetType === t ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setAssetType(t)}
              >
                {t === 'stock' ? 'หุ้นไทย' : t === 'fund' ? 'กองทุน' : t === 'bond' ? 'หุ้นกู้' : 'คริปโต'}
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
              <input type="text" list={`${assetType}-list`} value={sym} onChange={e => setSym(e.target.value)} required placeholder="เช่น KTB" className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all uppercase" />
              <datalist id={`${assetType}-list`}>
                {symbols[assetType]?.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">ประเภท</label>
              <select value={type} onChange={e => setType(e.target.value as TransactionType)} className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                <option value="BUY">🟢 ซื้อ (Buy)</option>
                <option value="SELL">🔴 ขาย (Sell)</option>
                <option value="DIVIDEND">🔵 ปันผล (Dividend)</option>
              </select>
            </div>

            {assetType === 'fund' || assetType === 'bond' ? (
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">จำนวนเงิน (บาท)</label>
                <input type="number" step="any" value={amount} onChange={e => setAmount(e.target.value)} required className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
              </div>
            ) : (
              <>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">{type === 'DIVIDEND' ? 'จำนวนหุ้นที่ถือ' : 'จำนวน'}</label>
                  <input type="number" step="any" value={qty} onChange={e => setQty(e.target.value)} required className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">{type === 'DIVIDEND' ? 'ปันผลต่อหุ้น' : 'ราคา'}</label>
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
