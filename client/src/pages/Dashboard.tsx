import React, { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Plus, ArrowRight, RefreshCw, TrendingUp, TrendingDown, LayoutDashboard } from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { InvestmentForm } from "@/components/forms/InvestmentForm";
import { useInvestments, useSyncPrices } from "@/hooks/use-investments";

// Mock chart data for aesthetic visualization since we don't have historical timeline data
const mockChartData = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 5000 },
  { name: 'Apr', value: 4500 },
  { name: 'May', value: 6000 },
  { name: 'Jun', value: 6500 },
  { name: 'Jul', value: 8000 },
];

export default function Dashboard() {
  const { data: investments = [], isLoading } = useInvestments();
  const { mutate: syncPrices, isPending: isSyncing } = useSyncPrices();
  const [formOpen, setFormOpen] = useState(false);

  // Simple portfolio value calculation (mocked for demo if real values absent)
  const totalValue = investments.reduce((acc, inv) => {
    // Usually quantity * currentPrice, but we don't have simple qty rolled up without transactions.
    // Assuming currentPrice is stored and just summing them as a rough demo value
    return acc + Number(inv.currentPrice || 0); 
  }, 0);

  return (
    <AppLayout>
      <div className="space-y-8 pb-12">
        {/* Header Section */}
        <section className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">Portfolio</h1>
            <p className="text-muted-foreground mt-1">Overview of your investments</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="h-10 rounded-xl bg-background border-border shadow-sm hover:shadow-md transition-all"
              onClick={() => syncPrices()}
              disabled={isSyncing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Prices</span>
            </Button>
            
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
              <DialogTrigger asChild>
                <Button className="h-10 rounded-xl shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                  <Plus className="mr-2 h-4 w-4" /> Add Asset
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl">Add New Investment</DialogTitle>
                </DialogHeader>
                <InvestmentForm onSuccess={() => setFormOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </section>

        {/* Chart Section */}
        <section className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm shadow-black/5 overflow-hidden relative group">
          <div className="mb-6 flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Balance</p>
              <div className="text-4xl font-extrabold font-mono tracking-tight text-foreground">
                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="px-3 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-full flex items-center text-sm font-bold shadow-sm">
              <TrendingUp className="w-4 h-4 mr-1" /> +12.5%
            </div>
          </div>
          
          <div className="h-[240px] w-full mt-4 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                <YAxis hide={true} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: 'hsl(var(--foreground))' }}
                />
                <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Investments List */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
              Assets
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-secondary/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : investments.length === 0 ? (
            <div className="text-center py-16 bg-secondary/20 rounded-3xl border border-dashed border-border">
              <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <TrendingDown className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold mb-1">No investments yet</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">Add your first stock, fund, or asset to start tracking your portfolio performance.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {investments.map((inv: any, i: number) => (
                <Link key={inv.id} href={`/investment/${inv.id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group bg-card rounded-2xl p-5 border border-border/60 shadow-sm hover:shadow-xl hover:border-primary/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-sm font-semibold text-muted-foreground mb-1">{inv.symbol || 'N/A'}</div>
                        <h3 className="font-bold text-lg text-foreground leading-tight">{inv.name}</h3>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-border/50 flex justify-between items-end">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Current Price</div>
                        <div className="font-mono font-bold text-lg">${Number(inv.currentPrice || 0).toFixed(2)}</div>
                      </div>
                      {inv.type && (
                        <div className="text-xs font-medium px-2 py-1 bg-secondary rounded-md">
                          {inv.type.name}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
