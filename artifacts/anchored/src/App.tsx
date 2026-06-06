import { useEffect, ComponentType } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { AnchorsProvider } from "@/lib/anchors-context";
import { BottomNav } from "@/components/BottomNav";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import ResetPassword from "@/pages/reset-password";
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import AnchorsPage from "@/pages/anchors";
import ProofPage from "@/pages/proof";
import ProofReview from "@/pages/proof-review";
import SettingsPage from "@/pages/settings";

const queryClient = new QueryClient();

function LoadingScreen() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: ComponentType }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [loading, user, setLocation]);

  if (loading) return <LoadingScreen />;
  if (!user) return null;
  return <Component />;
}

function Router() {
  const [location] = useLocation();
  const hideNav =
    location === "/" ||
    location === "/onboarding" ||
    location === "/login" ||
    location === "/reset-password";

  return (
    <>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/onboarding">
          <ProtectedRoute component={Onboarding} />
        </Route>
        <Route path="/dashboard">
          <ProtectedRoute component={Dashboard} />
        </Route>
        <Route path="/anchors">
          <ProtectedRoute component={AnchorsPage} />
        </Route>
        <Route path="/proof">
          <ProtectedRoute component={ProofPage} />
        </Route>
        <Route path="/proof/:id">
          <ProtectedRoute component={ProofReview} />
        </Route>
        <Route path="/settings">
          <ProtectedRoute component={SettingsPage} />
        </Route>
        <Route component={NotFound} />
      </Switch>
      {!hideNav && <BottomNav />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AnchorsProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AnchorsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
