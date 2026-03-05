import React, { useState, useMemo } from "react";
import { useParams, Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { useInvestment, useDeleteInvestment } from "@/hooks/use-investments";
import { useDeleteTransaction } from "@/hooks/use-transactions";
import { useDeleteDividend } from "@/hooks/use-dividends";
import { useUndo } from "@/context/UndoContext";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { DividendForm } from "@/components/forms/DividendForm";
import { InvestmentForm } from "@/components/forms/InvestmentForm";

import { 
  ArrowLeft, Edit2, Trash2, Plus, ArrowUpRight, ArrowDownRight, 
  DollarSign, Activity, Banknote, Calendar, Info 
} from "lucide-react";
import { format } from "date-fns";

export default function InvestmentDetails() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const investmentId = Number(id);
  
  const { data: investment, isLoading } = useInvestment(investmentId);
  const deleteInvestment = useDeleteInvestment();
  const deleteTransaction = useDeleteTransaction();
  const deleteDividend = useDeleteDividend();
  const { pushAction } = useUndo();

  const [editInvOpen, setEditInvOpen] = useState(false);
  const [txFormOpen, setTxFormOpen] = useState(false);
  const [divFormOpen, setDivFormOpen] = useState(false);
  
  const [editingTx, setEditingTx] = useState<any>(null);
  const [editingDiv, setEditingDiv] = useState<any>(null);

  // Cumulative Dividends Logic (2025 onwards)
  const cumulativeDividends2025 = useMemo(() => {
    if (!investment?.dividends) return 0;
    return investment.dividends
      .filter((d: any) => new Date(d.date).getFullYear() >= 2025)
      .reduce((sum: number, d: any) => sum + Number(d.amount), 0);
  }, [investment]);

  // Holdings calculation
  const totalHoldings = useMemo(() => {
    if (!investment?.transactions) return 0;
    return investment.transactions.reduce((acc: number, tx: any) => {
      const qty = Number(tx.quantity);
      return tx.type === 'buy' ? acc + qty : acc - qty;
    }, 0);
  }, [investment]);

  const handleDeleteInvestment = async () => {
    if (confirm("Are you sure you want to delete this investment? All associated transactions and dividends will be lost.")) {
      await deleteInvestment.mutateAsync(investmentId);
      // Mock undo for demonstration
      pushAction(`Deleted ${investment?.name}`, async () => {
        // In a real app, this would reconstruct the data or call an undo endpoint
        console.log("Simulating restoration of investment");
      });
      setLocation("/");
    }
  };

  const handleDeleteTransaction = async (txId: number) => {
    if (confirm("Delete transaction?")) {
      await deleteTransaction.mutateAsync({ id: txId, investmentId });
      pushAction("Deleted transaction", async () => { console.log("Undo tx"); });
    }
  };

  const handleDeleteDividend = async (divId: number) => {
    if (confirm("Delete dividend record?")) {
      await deleteDividend.mutateAsync({ id: divId, investmentId });
      pushAction("Deleted dividend", async () => { console.log("Undo div"); });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="animate-pulse space-y-8">
          <div className="h-10 w-24 bg-secondary/50 rounded-lg" />
          <div className="h-32 bg-secondary/50 rounded-2xl" />
          <div className="h-64 bg-secondary/50 rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  if (!investment) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-2">Investment Not Found</h2>
          <Link href="/"><Button>Back to Dashboard</Button></Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8 pb-16">
        {/* Navigation & Actions */}
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="rounded-full -ml-4 hover:bg-secondary text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" /> Dashboard
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="rounded-xl" onClick={() => setEditInvOpen(true)}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-xl text-destructive hover:bg-destructive/10 hover:border-destructive/30" onClick={handleDeleteInvestment}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Header Card */}
        <div className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-3xl p-6 sm:p-8 shadow-xl shadow-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
              <div>
                <div className="inline-flex items-center px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold mb-3 tracking-wider">
                  {investment.type?.name || 'Asset'}
                </div>
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-2">{investment.name}</h1>
                <p className="text-primary-foreground/70 font-mono text-lg">{investment.symbol || 'No Symbol'}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-primary-foreground/70 text-sm font-medium mb-1">Current Price</p>
                <div className="text-4xl font-mono font-bold">${Number(investment.currentPrice || 0).toFixed(2)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
              <div>
                <p className="text-primary-foreground/60 text-sm mb-1">Total Holdings</p>
                <p className="font-mono font-bold text-xl">{totalHoldings.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-primary-foreground/60 text-sm mb-1">Value (Est)</p>
                <p className="font-mono font-bold text-xl">${(totalHoldings * Number(investment.currentPrice || 0)).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dividends Highlight Card */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-accent-foreground">
              <Banknote className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Cumulative Dividends <span className="text-xs text-muted-foreground ml-1">(2025+)</span></h3>
              <p className="text-muted-foreground text-sm">Total passive income earned from this asset since 2025.</p>
            </div>
          </div>
          <div className="text-2xl font-mono font-extrabold text-accent-foreground bg-accent/30 px-4 py-2 rounded-xl">
            ${cumulativeDividends2025.toFixed(2)}
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="grid w-full grid-cols-2 p-1 bg-secondary/50 rounded-xl h-12 mb-6">
            <TabsTrigger value="transactions" className="rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Transactions
            </TabsTrigger>
            <TabsTrigger value="dividends" className="rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Dividends
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="transactions" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Transaction History</h3>
              <Button size="sm" onClick={() => { setEditingTx(null); setTxFormOpen(true); }} className="rounded-xl h-9">
                <Plus className="mr-1 h-4 w-4" /> Add
              </Button>
            </div>
            
            <div className="space-y-3">
              <AnimatePresence>
                {investment.transactions?.length === 0 ? (
                  <div className="text-center py-12 border border-dashed rounded-2xl text-muted-foreground">
                    No transactions recorded yet.
                  </div>
                ) : (
                  investment.transactions?.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((tx: any) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                      key={tx.id} 
                      className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'buy' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30'}`}>
                          {tx.type === 'buy' ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-bold capitalize">{tx.type}</p>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="mr-1 h-3 w-3" />
                            {format(new Date(tx.date), "MMM d, yyyy")}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="font-mono font-bold text-lg">{tx.quantity}</p>
                          <p className="text-sm text-muted-foreground">@ ${Number(tx.price).toFixed(2)}</p>
                        </div>
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingTx(tx); setTxFormOpen(true); }} className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground">
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDeleteTransaction(tx.id)} className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </TabsContent>
          
          <TabsContent value="dividends" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Dividend Yields</h3>
              <Button size="sm" onClick={() => { setEditingDiv(null); setDivFormOpen(true); }} className="rounded-xl h-9">
                <Plus className="mr-1 h-4 w-4" /> Add
              </Button>
            </div>
            
            <div className="space-y-3">
              <AnimatePresence>
                {investment.dividends?.length === 0 ? (
                  <div className="text-center py-12 border border-dashed rounded-2xl text-muted-foreground">
                    No dividends recorded yet.
                  </div>
                ) : (
                  investment.dividends?.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((div: any) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                      key={div.id} 
                      className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-accent/50 text-accent-foreground flex items-center justify-center">
                          <DollarSign className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold">Payout</p>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="mr-1 h-3 w-3" />
                            {format(new Date(div.date), "MMM d, yyyy")}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <p className="font-mono font-bold text-xl text-accent-foreground">+${Number(div.amount).toFixed(2)}</p>
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingDiv(div); setDivFormOpen(true); }} className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground">
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDeleteDividend(div.id)} className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <Dialog open={editInvOpen} onOpenChange={setEditInvOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader><DialogTitle>Edit Investment</DialogTitle></DialogHeader>
            <InvestmentForm initialData={investment} onSuccess={() => setEditInvOpen(false)} />
          </DialogContent>
        </Dialog>

        <Dialog open={txFormOpen} onOpenChange={setTxFormOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader><DialogTitle>{editingTx ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle></DialogHeader>
            <TransactionForm investmentId={investmentId} initialData={editingTx} onSuccess={() => setTxFormOpen(false)} />
          </DialogContent>
        </Dialog>

        <Dialog open={divFormOpen} onOpenChange={setDivFormOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader><DialogTitle>{editingDiv ? 'Edit Dividend' : 'Record Dividend'}</DialogTitle></DialogHeader>
            <DividendForm investmentId={investmentId} initialData={editingDiv} onSuccess={() => setDivFormOpen(false)} />
          </DialogContent>
        </Dialog>
        
      </div>
    </AppLayout>
  );
}
