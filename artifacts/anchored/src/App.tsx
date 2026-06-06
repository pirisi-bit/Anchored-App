import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnchorsProvider } from "@/lib/anchors-context";
import { BottomNav } from "@/components/BottomNav";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import AnchorsPage from "@/pages/anchors";
import ProofPage from "@/pages/proof";
import ProofReview from "@/pages/proof-review";
import SettingsPage from "@/pages/settings";

const queryClient = new QueryClient();

function Router() {
  const [location] = useLocation();
  const hideNav = location === "/" || location === "/onboarding";

  return (
    <>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/anchors" component={AnchorsPage} />
        <Route path="/proof" component={ProofPage} />
        <Route path="/proof/:id" component={ProofReview} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
      {!hideNav && <BottomNav />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AnchorsProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AnchorsProvider>
    </QueryClientProvider>
  );
}

export default App;
