import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile"
import DemoVerifierPage from "@/pages/demo-verifier";
import DemoUserPage from "@/pages/demo-user";
import { AuthProvider } from "@/context/authcontext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/profile" component={Profile} />
      <Route path="/demo/verifier" component={DemoVerifierPage} />
      <Route path="/demo/user" component={DemoUserPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
        <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
        </AuthProvider>
  );
}

export default App;
