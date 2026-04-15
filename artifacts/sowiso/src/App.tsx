import "@/i18n"; // initialise i18next before any component renders
import { Shell } from "./components/layout/Shell";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider, useLanguage, ALL_LOCALES, SupportedLocale } from "@/lib/i18n";
import { ActiveRegionProvider } from "@/lib/active-region";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AccessibilityProvider, useAccessibility } from "@/lib/accessibility";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { useEffect, useRef } from "react";
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
import ReplitCallback from "@/pages/ReplitCallback";

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

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

/**
 * After the user logs in (or on cold start with a stored session) this
 * component applies two server-side preferences:
 *  1. `language_code` — overrides the localStorage locale so the UI matches
 *     the profile the user last saved (cross-device).
 *  2. `birth_year`    — if the user is 55+ and has never manually changed the
 *     font-size, automatically promotes it to "large" for readability.
 */
function UserPreferencesSync() {
  const { isAuthenticated, getAuthHeaders } = useAuth();
  const { locale, setLocale } = useLanguage();
  const { autoApplyAgeFont } = useAccessibility();
  const syncedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      syncedRef.current = null;
      return;
    }

    const authKey = JSON.stringify(getAuthHeaders());
    if (syncedRef.current === authKey) return;
    syncedRef.current = authKey;

    fetch(`${API_BASE}/api/users/profile`, { headers: getAuthHeaders() })
      .then((r) => r.ok ? r.json() : null)
      .catch(() => null)
      .then((profile: { language_code?: string; birth_year?: number } | null) => {
        if (!profile) return;

        if (profile.language_code) {
          const serverLang = profile.language_code;
          const matchedLocale = ALL_LOCALES.find(
            (l) => l === serverLang || l.startsWith(serverLang + "-")
          ) as SupportedLocale | undefined;
          if (matchedLocale && matchedLocale !== locale) {
            setLocale(matchedLocale);
          }
        }

        if (profile.birth_year) {
          const age = new Date().getFullYear() - profile.birth_year;
          if (age >= 55) {
            autoApplyAgeFont("large");
          }
        }
      });
  }, [isAuthenticated, getAuthHeaders, locale, setLocale, autoApplyAgeFont]);

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
        <Route path="/replit-callback" component={ReplitCallback} />
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
            <UserPreferencesSync />
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
