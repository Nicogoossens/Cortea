import { Shell } from "./components/layout/Shell";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider, useLanguage } from "@/lib/i18n";
import { ActiveRegionProvider } from "@/lib/active-region";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AccessibilityProvider } from "@/lib/accessibility";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { useEffect } from "react";
import RegionDetectionBanner from "@/components/RegionDetectionBanner";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Welcome from "@/pages/Welcome";
import Atelier from "@/pages/Atelier";
import Scenario from "@/pages/Scenario";
import Counsel from "@/pages/Counsel";
import Compass from "@/pages/Compass";
import CompassRegion from "@/pages/CompassRegion";
import Profile from "@/pages/Profile";
import Register from "@/pages/Register";
import SignIn from "@/pages/SignIn";
import EmailVerify from "@/pages/EmailVerify";
import Onboarding from "@/pages/Onboarding";
import Admin from "@/pages/Admin";
import Membership from "@/pages/Membership";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppWithRegion({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();
  return (
    <ActiveRegionProvider language={language}>
      {children}
    </ActiveRegionProvider>
  );
}

/** Keeps the api-client-react auth token in sync with the auth context. */
function AuthTokenSync() {
  const { sessionToken } = useAuth();
  useEffect(() => {
    setAuthTokenGetter(() => sessionToken);
  }, [sessionToken]);
  return null;
}

function HomeRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Home /> : <Welcome />;
}

function Router() {
  return (
    <Shell>
      <Switch>
        <Route path="/" component={HomeRoute} />
        <Route path="/atelier" component={Atelier} />
        <Route path="/atelier/:id" component={Scenario} />
        <Route path="/counsel" component={Counsel} />
        <Route path="/compass" component={Compass} />
        <Route path="/compass/:code" component={CompassRegion} />
        <Route path="/profile" component={Profile} />
        <Route path="/register" component={Register} />
        <Route path="/signin" component={SignIn} />
        <Route path="/verify-email" component={EmailVerify} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/admin" component={Admin} />
        <Route path="/membership" component={Membership} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthTokenSync />
        <AccessibilityProvider>
          <LanguageProvider>
            <AppWithRegion>
              <TooltipProvider>
                <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                  <Router />
                </WouterRouter>
                <RegionDetectionBanner />
                <Toaster />
              </TooltipProvider>
            </AppWithRegion>
          </LanguageProvider>
        </AccessibilityProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
