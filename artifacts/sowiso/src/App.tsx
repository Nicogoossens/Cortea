import "@/i18n"; // initialise i18next before any component renders
import { Shell } from "./components/layout/Shell";
import { LandingLayout } from "./components/layout/LandingLayout";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider, useLanguage, ALL_LOCALES, SupportedLocale } from "@/lib/i18n";
import { ActiveRegionProvider } from "@/lib/active-region";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AccessibilityProvider, useAccessibility } from "@/lib/accessibility";
import { PrivacyProvider } from "@/lib/privacy";
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
import CompassCluster from "@/pages/CompassCluster";
import Situations from "@/pages/Situations";
import Profile from "@/pages/Profile";
import Register from "@/pages/Register";
import SignIn from "@/pages/SignIn";
import EmailVerify from "@/pages/EmailVerify";
import Onboarding from "@/pages/Onboarding";
import Admin from "@/pages/Admin";
import Membership from "@/pages/Membership";
import ReplitCallback from "@/pages/ReplitCallback";
import Mirror from "@/pages/Mirror";

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
 *  2. `age_group`     — server-side Noble Score age estimation (primary: birth_year;
 *     fallback: Noble Score ≥600 Ambassador tier). If the group is "senior_elder"
 *     or "established_practitioner" and the user has never manually changed their
 *     font-size, it is automatically promoted to "large" for readability.
 */

/** Age groups that warrant automatic large-font promotion. */
const AGE_FONT_GROUPS = new Set(["senior_elder", "established_practitioner"]);

function UserPreferencesSync() {
  const { isAuthenticated, getAuthHeaders, login } = useAuth();
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
      .then((profile: { language_code?: string; age_group?: string; is_admin?: boolean; id?: string; full_name?: string } | null) => {
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

        if (profile.age_group && AGE_FONT_GROUPS.has(profile.age_group)) {
          autoApplyAgeFont("large");
        }

        if (profile.is_admin !== undefined) {
          login(profile.id ?? "", { isAdmin: profile.is_admin });
        }
      });
  }, [isAuthenticated, getAuthHeaders, locale, setLocale, autoApplyAgeFont, login]);

  return null;
}

function AppRouter() {
  const { isAuthenticated } = useAuth();

  return (
    <Switch>
      {/*
        These routes are auth-state-agnostic: they must NOT remount when
        isAuthenticated changes mid-flow (e.g. email verification).
        Placing them here — before the auth-conditional block — means the
        same component instance stays mounted regardless of auth state.
      */}
      <Route path="/verify-email">
        <Shell>
          <EmailVerify />
        </Shell>
      </Route>
      <Route path="/onboarding">
        <Shell>
          <Onboarding />
        </Shell>
      </Route>
      <Route path="/replit-callback">
        <Shell>
          <ReplitCallback />
        </Shell>
      </Route>

      {/* Auth routes — always sidebar-free */}
      <Route path="/register">
        <LandingLayout>
          <Register />
        </LandingLayout>
      </Route>
      <Route path="/signin">
        <LandingLayout>
          <SignIn />
        </LandingLayout>
      </Route>

      {/* Auth-conditional routing */}
      <Route>
        {!isAuthenticated ? (
          <Switch>
            <Route path="/" component={Welcome} />
            <Route>
              <Shell>
                <Switch>
                  <Route path="/atelier" component={Atelier} />
                  <Route path="/atelier/:id" component={Scenario} />
                  <Route path="/compass" component={Compass} />
                  <Route path="/compass/cluster/:id" component={CompassCluster} />
                  <Route path="/compass/:code" component={CompassRegion} />
                  <Route path="/counsel" component={Counsel} />
                  <Route path="/situations" component={Situations} />
                  <Route path="/mirror" component={Mirror} />
                  <Route path="/membership" component={Membership} />
                  <Route component={NotFound} />
                </Switch>
              </Shell>
            </Route>
          </Switch>
        ) : (
          <Shell>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/atelier" component={Atelier} />
              <Route path="/atelier/:id" component={Scenario} />
              <Route path="/counsel" component={Counsel} />
              <Route path="/compass" component={Compass} />
              <Route path="/compass/cluster/:id" component={CompassCluster} />
              <Route path="/compass/:code" component={CompassRegion} />
              <Route path="/situations" component={Situations} />
              <Route path="/profile" component={Profile} />
              <Route path="/admin" component={Admin} />
              <Route path="/membership" component={Membership} />
              <Route path="/mirror" component={Mirror} />
              <Route component={NotFound} />
            </Switch>
          </Shell>
        )}
      </Route>
    </Switch>
  );
}

function Router() {
  return <AppRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthTokenSync />
        <PrivacyProvider>
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
        </PrivacyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
