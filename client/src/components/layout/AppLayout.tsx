import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { LineChart, Undo2, History, TrendingUp, RefreshCw } from "lucide-react";
import { useUndo } from "@/context/UndoContext";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { actions, undoLast } = useUndo();
  const queryClient = useQueryClient();
  const [isRefreshingGlobal, setIsRefreshingGlobal] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshingGlobal(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setIsRefreshingGlobal(false), 500); // Visual delay
  };

  const { pullProgress, isRefreshing } = usePullToRefresh(handleRefresh);

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      
      {/* Pull to refresh visual indicator */}
      <div 
        className="pull-to-refresh-indicator"
        style={{ 
          height: `${pullProgress}px`, 
          opacity: pullProgress > 0 ? 1 : 0 
        }}
      >
        <motion.div 
          animate={{ rotate: isRefreshing ? 360 : pullProgress * 2 }} 
          transition={{ repeat: isRefreshing ? Infinity : 0, duration: 1, ease: "linear" }}
        >
          <RefreshCw className="h-6 w-6 text-primary" />
        </motion.div>
      </div>

      <header className="sticky top-0 z-40 glass-panel">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer transition-transform hover:-translate-y-0.5 active:translate-y-0">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
              <TrendingUp className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">StockWatcher</span>
          </Link>

          <div className="flex items-center gap-2">
            <AnimatePresence>
              {actions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={undoLast}
                    className="gap-2 rounded-full h-9 border-primary/20 hover:bg-primary/5 shadow-sm"
                  >
                    <Undo2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Undo</span>
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 relative hover:bg-secondary">
                  <History className="h-5 w-5 text-muted-foreground" />
                  {actions.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary border-2 border-background" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Recent Actions</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {actions.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">No recent actions</p>
                  ) : (
                    actions.map((action, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={action.id} 
                        className="p-3 rounded-xl bg-secondary/50 border border-border flex justify-between items-center"
                      >
                        <div className="text-sm font-medium pr-4">{action.description}</div>
                        {i === 0 && (
                          <Button size="sm" variant="ghost" className="h-8 rounded-lg" onClick={undoLast}>
                            Undo
                          </Button>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <motion.div
          key={location}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={isRefreshingGlobal ? "opacity-50 pointer-events-none transition-opacity" : ""}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
