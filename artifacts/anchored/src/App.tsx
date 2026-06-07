import { useState, useEffect, ComponentType } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { AnchorsProvider, useAnchors } from "@/lib/anchors-context";
import { LangProvider } from "@/lib/lang-context";
import { BottomNav } from "@/components/BottomNav";
import { TutorialOverlay } from "@/components/TutorialOverlay";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import ResetPassword from "@/pages/reset-password";
import Privacy from "@/pages/privacy";
import Support from "@/pages/support";
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

// Entry gate for "/": logged-out users see the marketing landing; returning
// users (who already have anchors) go straight to the dashboard; brand-new
// users go to onboarding to set up their first anchors.
function Index() {
  const { user, loading } = useAuth();
  const { anchors, loading: anchorsLoading } = useAnchors();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (loading || !user || anchorsLoading) return;
    setLocation(anchors.length > 0 ? "/dashboard" : "/onboarding", {
      replace: true,
    });
  }, [loading, user, anchorsLoading, anchors.length, setLocation]);

  if (loading) return <LoadingScreen />;
  if (!user) return <Home />;
  return <LoadingScreen />;
}

function Router() {
  const [location] = useLocation();
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("anchored-tutorial-seen");
    if (!seen) setShowTutorial(true);

    const handler = () => setShowTutorial(true);
    window.addEventListener("show-tutorial", handler);
    return () => window.removeEventListener("show-tutorial", handler);
  }, []);

  const hideNav =
    location === "/" ||
    location === "/onboarding" ||
    location === "/login" ||
    location === "/reset-password" ||
    location === "/privacy" ||
    location === "/support";

  return (
    <>
      <Switch>
        <Route path="/" component={Index} />
        <Route path="/login" component={Login} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/support" component={Support} />
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
      {!hideNav && (
        <button
          onClick={() => setShowTutorial(true)}
          aria-label="Open tutorial"
          title="Tutorial"
          className="fixed right-0 top-[62%] z-40 -translate-y-1/2 translate-x-5 hover:translate-x-0 transition-transform duration-300 ease-out w-11 h-11 rounded-full bg-violet-500 hover:bg-violet-600 shadow-lg text-white flex items-center justify-center text-xl font-bold select-none"
        >
          ?
        </button>
      )}
      <TutorialOverlay
        open={showTutorial}
        onClose={() => {
          localStorage.setItem("anchored-tutorial-seen", "1");
          setShowTutorial(false);
        }}
      />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LangProvider>
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
      </LangProvider>
    </QueryClientProvider>
  );
}

export default App;
