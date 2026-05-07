import "@/i18n"; // initialise i18next before any component renders
import { Shell } from "./components/layout/Shell";
import { LandingLayout } from "./components/layout/LandingLayout";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLanguage } from "@/lib/i18n";
import { LanguageProvider } from "@/lib/language-provider";
import { ActiveRegionProvider } from "@/lib/active-region";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AccessibilityProvider } from "@/lib/accessibility";
import { PrivacyProvider } from "@/lib/privacy";
import { useEffect, useRef } from "react";
import { UserPreferencesSync } from "@/components/UserPreferencesSync";
import { HelmetProvider } from "react-helmet-async";
import { captureUtmParams } from "@/lib/utm";
import { captureReferralCode, getStoredReferralCode, clearStoredReferralCode } from "@/lib/referral-capture";
import RegionDetectionBanner from "@/components/RegionDetectionBanner";
import PaymentFailedBanner from "@/components/PaymentFailedBanner";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import TestModeToggle from "@/components/TestModeToggle";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Welcome from "@/pages/Welcome";
import Atelier from "@/pages/Atelier";
import Scenario from "@/pages/Scenario";
import Counsel from "@/pages/Counsel";
import Compass from "@/pages/Compass";
import CompassRegion from "@/pages/CompassRegion";
import CompassCluster from "@/pages/CompassCluster";
import Profile from "@/pages/Profile";
import CountryVotes from "@/pages/CountryVotes";
import Register from "@/pages/Register";
import SignIn from "@/pages/SignIn";
import EmailVerify from "@/pages/EmailVerify";
import Onboarding from "@/pages/Onboarding";
import Admin from "@/pages/Admin";
import Membership from "@/pages/Membership";
import OAuthCallback from "@/pages/OAuthCallback";
import Mirror from "@/pages/Mirror";
import Sensory from "@/pages/Sensory";
import Navigator from "@/pages/Navigator";
import InnerCircle from "@/pages/InnerCircle";
import Privacy from "@/pages/Privacy";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import UseCases from "@/pages/UseCases";
import BehaviorSkillDetail from "@/pages/BehaviorSkillDetail";
import Guides from "@/pages/Guides";
import Wardrobe from "@/pages/Wardrobe";
import InviteLanding from "@/pages/InviteLanding";
import Companion from "@/pages/Companion";
import RoleplayScenario from "@/pages/RoleplayScenario";
import ResetPassword from "@/pages/ResetPassword";
import { CultureLanding, CulturesIndex } from "@/pages/Cultures";
import Waitlist from "@/pages/Waitlist";
import AdminWaitlist from "@/pages/AdminWaitlist";

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

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

/** Redirects legacy /situations URLs to /counsel, preserving query params. */
function SituationsRedirect() {
  const [, navigate] = useLocation();
  useEffect(() => {
    const params = window.location.search;
    navigate(`/counsel${params}`);
  }, [navigate]);
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
      <Route path="/oauth-callback">
        <Shell>
          <OAuthCallback />
        </Shell>
      </Route>

      {/* Auth routes — always sidebar-free */}
      <Route path="/register">
        <LandingLayout>
          <Register />
        </LandingLayout>
      </Route>
      <Route path="/signin">
        <LandingLayout authLink="register">
          <SignIn />
        </LandingLayout>
      </Route>
      <Route path="/reset-password">
        <LandingLayout>
          <ResetPassword />
        </LandingLayout>
      </Route>

      {/* Invite landing — accessible without auth */}
      <Route path="/invite/:token">
        <InviteLanding />
      </Route>

      {/* Public SEO landing pages — auth-agnostic, server-rendered for organic acquisition */}
      <Route path="/cultures" component={CulturesIndex} />
      <Route path="/cultures/:slug" component={CultureLanding} />

      {/* Public waitlist landing — accessible without auth, no shell */}
      <Route path="/waitlist">
        <Waitlist />
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
                  <Route path="/atelier/roleplay/:id" component={RoleplayScenario} />
                  <Route path="/compass" component={Compass} />
                  <Route path="/compass/cluster/:id" component={CompassCluster} />
                  <Route path="/compass/:code" component={CompassRegion} />
                  <Route path="/counsel" component={Counsel} />
                  <Route path="/counsel/skills/:id" component={BehaviorSkillDetail} />
                  <Route path="/situations" component={SituationsRedirect} />
                  <Route path="/use-cases" component={UseCases} />
                  <Route path="/mirror" component={Mirror} />
                  <Route path="/sensory" component={Sensory} />
                  <Route path="/navigator" component={Navigator} />
                  <Route path="/inner-circle" component={InnerCircle} />
                  <Route path="/privacy" component={Privacy} />
                  <Route path="/privacy-policy" component={PrivacyPolicyPage} />
                  <Route path="/membership" component={Membership} />
                  <Route path="/guides" component={Guides} />
                  <Route path="/wardrobe" component={Wardrobe} />
                  <Route path="/profile" component={Profile} />
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
              <Route path="/atelier/roleplay/:id" component={RoleplayScenario} />
              <Route path="/atelier/:id" component={Scenario} />
              <Route path="/counsel" component={Counsel} />
              <Route path="/counsel/skills/:id" component={BehaviorSkillDetail} />
              <Route path="/compass" component={Compass} />
              <Route path="/compass/cluster/:id" component={CompassCluster} />
              <Route path="/compass/:code" component={CompassRegion} />
              <Route path="/situations" component={SituationsRedirect} />
              <Route path="/use-cases" component={UseCases} />
              <Route path="/profile" component={Profile} />
              <Route path="/votes" component={CountryVotes} />
              <Route path="/wardrobe" component={Wardrobe} />
              <Route path="/companion" component={Companion} />
              <Route path="/admin/waitlist" component={AdminWaitlist} />
              <Route path="/admin" component={Admin} />
              <Route path="/membership" component={Membership} />
              <Route path="/mirror" component={Mirror} />
              <Route path="/sensory" component={Sensory} />
              <Route path="/navigator" component={Navigator} />
              <Route path="/inner-circle" component={InnerCircle} />
              <Route path="/privacy" component={Privacy} />
              <Route path="/guides" component={Guides} />
              <Route path="/privacy-policy" component={PrivacyPolicyPage} />
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

function UtmCapture() {
  useEffect(() => {
    captureUtmParams();
    captureReferralCode();
  }, []);
  return null;
}

/**
 * On first authenticated session after a `?ref=` visit, posts the captured
 * referral code to the server so it is associated with the user before they
 * convert to paid. Idempotent on the server side.
 */
function ReferralAttach() {
  const { isAuthenticated, userId } = useAuth();
  const sentForRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isAuthenticated || !userId) return;
    const code = getStoredReferralCode();
    if (!code) return;
    if (sentForRef.current === userId) return;
    sentForRef.current = userId;
    fetch(`${API_BASE}/api/referrals/attach`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .then(() => clearStoredReferralCode())
      .catch(() => { /* keep code, retry next session */ });
  }, [isAuthenticated, userId]);
  return null;
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <PrivacyProvider>
          <AccessibilityProvider>
            <LanguageProvider>
              <UtmCapture />
              <ReferralAttach />
              <UserPreferencesSync />
              <AppWithRegion>
                <TooltipProvider>
                  <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                    <Router />
                  </WouterRouter>
                  <RegionDetectionBanner />
                  <PaymentFailedBanner />
                  <CookieConsentBanner />
                  <TestModeToggle />
                  <Toaster />
                </TooltipProvider>
              </AppWithRegion>
            </LanguageProvider>
          </AccessibilityProvider>
          </PrivacyProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
