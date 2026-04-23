import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/authcontext";
import { ErrorBoundary } from "@/components/error-boundary";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import OnboardingPage from "@/pages/onboarding";
import VerifyPage from "@/pages/verify";

function ProtectedPage({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      const redirect = encodeURIComponent(window.location.pathname + window.location.search);
      setLocation(`/auth?redirect=${redirect}`);
    }
  }, [loading, user, setLocation]);

  if (loading || !user) {
    return <div className="min-h-screen bg-background" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/dashboard" component={() => <ProtectedPage component={Dashboard} />} />
      <Route path="/profile" component={() => <ProtectedPage component={Profile} />} />
      <Route path="/onboarding" component={() => <ProtectedPage component={OnboardingPage} />} />
      <Route path="/verify" component={() => <ProtectedPage component={VerifyPage} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
