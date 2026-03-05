import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { toast } from "@/hooks/use-toast";

export interface Action {
  id: string;
  description: string;
  undoFn: () => Promise<void>;
  timestamp: number;
}

interface UndoContextType {
  actions: Action[];
  pushAction: (description: string, undoFn: () => Promise<void>) => void;
  undoLast: () => Promise<void>;
  clearActions: () => void;
}

const UndoContext = createContext<UndoContextType | undefined>(undefined);

export function UndoProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<Action[]>([]);

  const pushAction = useCallback((description: string, undoFn: () => Promise<void>) => {
    const newAction: Action = {
      id: Math.random().toString(36).substring(7),
      description,
      undoFn,
      timestamp: Date.now(),
    };
    
    setActions(prev => {
      const updated = [newAction, ...prev];
      // Keep only last 20 actions
      return updated.slice(0, 20);
    });

    toast({
      title: description,
      description: "Action recorded. You can undo this if needed.",
    });
  }, []);

  const undoLast = useCallback(async () => {
    if (actions.length === 0) return;
    
    const actionToUndo = actions[0];
    try {
      await actionToUndo.undoFn();
      setActions(prev => prev.slice(1));
      toast({
        title: "Action Undone",
        description: `Successfully undid: ${actionToUndo.description}`,
      });
    } catch (err) {
      toast({
        title: "Failed to undo",
        description: "An error occurred while trying to undo.",
        variant: "destructive"
      });
    }
  }, [actions]);

  const clearActions = useCallback(() => {
    setActions([]);
  }, []);

  return (
    <UndoContext.Provider value={{ actions, pushAction, undoLast, clearActions }}>
      {children}
    </UndoContext.Provider>
  );
}

export function useUndo() {
  const context = useContext(UndoContext);
  if (!context) {
    throw new Error("useUndo must be used within an UndoProvider");
  }
  return context;
}
