import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UndoProvider } from "./context/UndoContext";

import Dashboard from "./pages/Dashboard";
import InvestmentDetails from "./pages/InvestmentDetails";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard}/>
      <Route path="/investment/:id" component={InvestmentDetails}/>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <UndoProvider>
          <Toaster />
          <Router />
        </UndoProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
