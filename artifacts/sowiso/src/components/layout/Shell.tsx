import { Link, useLocation } from "wouter";
import { BookOpen, Compass, Shield, User, Menu, X, Landmark, UserPlus, LogIn, LogOut, Crown, Settings2, Scan, Ear, Navigation2, Users, ShieldCheck, MapPin, Layers, ShirtIcon, FileText, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ContextBar } from "@/components/context-bar";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useRegistrationStatus } from "@/hooks/useRegistrationStatus";
import { useGetProfile } from "@workspace/api-client-react";
import { useActiveRegion, FlagEmoji } from "@/lib/active-region";

const NAVIGATOR_KEY = "sowiso_navigator_trips";

function getNavigatorAlertCount(isAmbassador: boolean): number {
  if (!isAmbassador) return 0;
  try {
    const stored = localStorage.getItem(NAVIGATOR_KEY);
    if (!stored) return 0;
    const trips = JSON.parse(stored) as { id: string; regionCode: string; departureDate: string }[];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return trips.filter((trip) => {
      const target = new Date(trip.departureDate);
      target.setHours(0, 0, 0, 0);
      const days = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return days <= 7 && days > -14;
    }).length;
  } catch {
    return 0;
  }
}

export function Shell({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  const { t } = useLanguage();
  const { isAuthenticated, isAdmin, userName, logout } = useAuth();
  const { registration_open: registrationOpen } = useRegistrationStatus();
  const { activeRegion } = useActiveRegion();
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);

  const isAmbassador = isAuthenticated;
  const navigatorAlertCount = getNavigatorAlertCount(isAmbassador);
  const [companionUnread, setCompanionUnread] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) { setCompanionUnread(0); return; }
    let cancelled = false;
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    async function fetchUnread() {
      try {
        const res = await fetch(`${base}/api/companion/messages/unread-count`, { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json() as { unread: number };
        if (!cancelled) setCompanionUnread(data.unread ?? 0);
      } catch {
        // ignore
      }
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    const onRead = () => setCompanionUnread(0);
    window.addEventListener("companion-messages-read", onRead);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("companion-messages-read", onRead);
    };
  }, [isAuthenticated, location]);

  const allNavigation = [
    { key: "nav.dashboard",   href: "/",            icon: Landmark, authOnly: true  },
    { key: "nav.atelier",     href: "/atelier",     icon: BookOpen },
    { key: "nav.counsel",     href: "/counsel",     icon: Shield   },
    { key: "nav.compass",     href: "/compass",     icon: Compass  },
    { key: "nav.use_cases",    href: "/use-cases",   icon: MapPin,      adminOnly: true       },
    { key: "nav.mirror",       href: "/mirror",       icon: Scan,        adminOnly: true       },
    { key: "nav.sensory",      href: "/sensory",      icon: Ear,         adminOnly: true       },
    { key: "nav.navigator",    href: "/navigator",    icon: Navigation2, ambassadorOnly: true  },
    { key: "nav.inner_circle", href: "/inner-circle", icon: Users,       ambassadorOnly: true  },
    { key: "nav.wardrobe",     href: "/wardrobe",     icon: ShirtIcon,   adminOnly: true       },
    { key: "nav.privacy",      href: "/privacy",      icon: ShieldCheck, authOnly: true        },
    { key: "nav.companion",    href: "/companion",    icon: MessageSquare, adminOnly: true     },
    { key: "nav.profile",      href: "/profile",      icon: User,        authOnly: true        },
    { key: "nav.membership",  href: "/membership",  icon: Crown    },
  ];

  const navigation = allNavigation.filter((item) => {
    if ("adminOnly" in item && item.adminOnly && !isAdmin) return false;
    if ("authOnly" in item && item.authOnly && !isAuthenticated) return false;
    return true;
  });

  const { data: profile } = useGetProfile();
  const currentTier = (profile?.subscription_tier ?? "guest") as string;
  const isPremium = currentTier === "student" || currentTier === "traveller" || currentTier === "ambassador";
  const showUpgradePill = (href: string) => href === "/membership" && !isPremium;

  // Optimised for the dark sidebar/header background — bright text on
  // semi-transparent tinted backgrounds with a clear border.
  const tierBadgeClasses: Record<string, string> = {
    guest:      "bg-stone-400/20 text-stone-200 border-stone-300/40",
    basic:      "bg-sky-400/25 text-sky-200 border-sky-300/50",
    student:    "bg-emerald-400/25 text-emerald-200 border-emerald-300/50",
    traveller:  "bg-amber-500/25 text-amber-200 border-amber-300/60",
    ambassador: "bg-yellow-300/30 text-yellow-100 border-yellow-200/70",
    elite:      "bg-fuchsia-400/30 text-fuchsia-100 border-fuchsia-300/60",
  };
  const tierBadgeLabel = currentTier.toUpperCase();
  const tierBadgeClass = tierBadgeClasses[currentTier] ?? tierBadgeClasses.guest;
  const tierBadgeAria = `${t("nav.tier_label" as Parameters<typeof t>[0]) || "Tier"}: ${tierBadgeLabel}`;
  const TierBadge = ({ className = "" }: { className?: string }) => (
    <span
      data-testid="badge-current-tier"
      aria-label={tierBadgeAria}
      title={tierBadgeAria}
      className={`inline-flex items-center text-[9px] font-mono uppercase tracking-widest rounded-[2px] border px-1.5 py-0.5 leading-none ${tierBadgeClass} ${className}`}
    >
      {tierBadgeLabel}
    </span>
  );

  const MAIN_CONTENT_ID = "main-content";

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">

      <a
        href={`#${MAIN_CONTENT_ID}`}
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-sm focus:font-medium"
      >
        {t("nav.skip_to_content")}
      </a>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-sidebar text-sidebar-foreground">
        <Link href="/">
          <span className="flex items-center gap-2 font-serif text-xl tracking-wide text-sidebar-primary cursor-pointer" aria-label={t("app.name")}>
            {t("app.name")}
            <span className="opacity-70" aria-hidden="true">
              <FlagEmoji code={activeRegion} size="sm" />
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <TierBadge />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-nav"
          aria-label={isMobileMenuOpen ? t("nav.menu_close") : t("nav.menu_open")}
          className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
        </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          id="mobile-nav"
          className="md:hidden fixed inset-0 top-[65px] bg-sidebar z-50 p-4 overflow-y-auto overscroll-contain animate-in fade-in slide-in-from-top-4"
        >
          <nav aria-label={t("nav.aria_label")} className="space-y-2">
            {navigation.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              const isGolden = item.href === "/membership" || ("ambassadorOnly" in item && item.ambassadorOnly);
              const showBadge = item.href === "/navigator" && navigatorAlertCount > 0;
              const showCompanionBadge = item.href === "/companion" && companionUnread > 0;
              return (
                <Link key={item.key} href={item.href}>
                  <div
                    role="link"
                    tabIndex={0}
                    onClick={() => setIsMobileMenuOpen(false)}
                    onKeyDown={(e) => { if (e.key === "Enter") setIsMobileMenuOpen(false); }}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-3 px-4 py-3 rounded-sm transition-colors cursor-pointer ${
                      isGolden
                        ? "text-amber-600/80 hover:bg-amber-500/10"
                        : isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                    <span className="font-medium">{t(item.key as Parameters<typeof t>[0])}</span>
                    {showBadge && (
                      <span className="ml-auto text-[10px] font-mono bg-amber-500/20 text-amber-700 rounded-full px-1.5 py-0.5 leading-none" aria-label={`${navigatorAlertCount} active`}>
                        {navigatorAlertCount}
                      </span>
                    )}
                    {showCompanionBadge && (
                      <span className="ml-auto text-[10px] font-mono bg-primary/20 text-primary rounded-full px-1.5 py-0.5 leading-none" aria-label={`${companionUnread} unread notes`}>
                        {companionUnread}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
            {isAdmin && (
              <Link href="/admin">
                <div
                  role="link"
                  tabIndex={0}
                  onClick={() => setIsMobileMenuOpen(false)}
                  onKeyDown={(e) => { if (e.key === "Enter") setIsMobileMenuOpen(false); }}
                  aria-current={location === "/admin" ? "page" : undefined}
                  className={`flex items-center gap-3 px-4 py-3 rounded-sm transition-colors cursor-pointer ${
                    location === "/admin"
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <Settings2 className="h-5 w-5" aria-hidden="true" />
                  <span className="font-medium">{t("nav.admin")}</span>
                </div>
              </Link>
            )}

            <div className="pt-4 border-t border-sidebar-border/50 space-y-2">
              {isAuthenticated ? (
                <button
                  onClick={() => { setIsMobileMenuOpen(false); setShowSignOutDialog(true); }}
                  className="flex items-center gap-3 px-4 py-3 rounded-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/30 transition-colors w-full"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span className="text-sm font-medium">{t("common.sign_out")}</span>
                </button>
              ) : (
                <>
                  <Link href="/signin">
                    <div onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors cursor-pointer">
                      <LogIn className="h-4 w-4" aria-hidden="true" />
                      <span className="text-sm font-medium">{t("signin.title")}</span>
                    </div>
                  </Link>
                  {registrationOpen && (
                    <Link href="/register">
                      <div onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors cursor-pointer">
                        <UserPlus className="h-4 w-4" aria-hidden="true" />
                        <span className="text-sm font-medium">{t("register.title")}</span>
                      </div>
                    </Link>
                  )}
                </>
              )}
            </div>
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border sticky top-0 h-screen"
        aria-label="Application sidebar"
      >
        <div className="p-8 flex flex-col items-center gap-3 border-b border-sidebar-border/50">
          <Link href="/">
            <span className="font-serif text-3xl tracking-widest text-sidebar-primary uppercase cursor-pointer hover:opacity-80 transition-opacity">
              {t("app.name")}
            </span>
          </Link>
          <TierBadge />
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto" aria-label={t("nav.aria_label")}>
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            const isGolden = item.href === "/membership" || ("ambassadorOnly" in item && item.ambassadorOnly);
            const showBadge = item.href === "/navigator" && navigatorAlertCount > 0;
            const showCompanionBadge = item.href === "/companion" && companionUnread > 0;
            return (
              <Link key={item.key} href={item.href} className="block">
                <div
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 px-4 py-3 rounded-sm transition-all duration-200 ${
                    isGolden
                      ? isActive
                        ? "bg-amber-500/15 text-amber-700 translate-x-2"
                        : "text-amber-600/70 hover:bg-amber-500/10 hover:text-amber-700 hover:translate-x-1"
                      : isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground translate-x-2"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground hover:translate-x-1"
                  }`}
                >
                  <item.icon className="h-5 w-5 opacity-70" aria-hidden="true" />
                  <span className="font-medium tracking-wide">{t(item.key as Parameters<typeof t>[0])}</span>
                  {showBadge && (
                    <span className="ml-auto text-[10px] font-mono bg-amber-500/20 text-amber-700 rounded-full px-1.5 py-0.5 leading-none" aria-label={`${navigatorAlertCount} active`}>
                      {navigatorAlertCount}
                    </span>
                  )}
                  {showCompanionBadge && (
                    <span className="ml-auto text-[10px] font-mono bg-primary/20 text-primary rounded-full px-1.5 py-0.5 leading-none" aria-label={`${companionUnread} unread notes`}>
                      {companionUnread}
                    </span>
                  )}
                  {showUpgradePill(item.href) && (
                    <span
                      data-testid="badge-nav-upgrade"
                      className="ml-auto text-[9px] font-mono uppercase tracking-widest bg-amber-500/20 text-amber-700 rounded-[2px] border border-amber-500/30 px-1.5 py-0.5 leading-none"
                    >
                      {t("nav.upgrade_pill")}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
          {isAdmin && (
            <Link href="/admin" className="block">
              <div
                aria-current={location === "/admin" ? "page" : undefined}
                className={`flex items-center gap-3 px-4 py-3 rounded-sm transition-all duration-200 ${
                  location === "/admin"
                    ? "bg-sidebar-accent text-sidebar-accent-foreground translate-x-2"
                    : "text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground hover:translate-x-1"
                }`}
              >
                <Settings2 className="h-5 w-5 opacity-70" aria-hidden="true" />
                <span className="font-medium tracking-wide">{t("nav.admin")}</span>
              </div>
            </Link>
          )}
        </nav>

        <div className="p-6 border-t border-sidebar-border/50 space-y-2">
          {isAuthenticated ? (
            <>
              {userName && (
                <p className="text-xs text-sidebar-foreground/60 font-mono px-3 truncate">
                  {userName}
                </p>
              )}
              <button
                onClick={() => setShowSignOutDialog(true)}
                className="flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-sm text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/30 transition-colors cursor-pointer w-full"
              >
                <LogOut className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                <span className="font-mono tracking-wide">{t("common.sign_out")}</span>
              </button>
            </>
          ) : (
            <>
              <Link href="/signin" className="block">
                <div className="flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-sm text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 transition-colors cursor-pointer">
                  <LogIn className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                  <span className="font-mono tracking-wide">{t("signin.title")}</span>
                </div>
              </Link>
              {registrationOpen && (
                <Link href="/register" className="block">
                  <div className="flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-sm text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/30 transition-colors cursor-pointer">
                    <UserPlus className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                    <span className="font-mono tracking-wide">{t("register.title")}</span>
                  </div>
                </Link>
              )}
            </>
          )}
          <Link href="/privacy-policy" className="block">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm text-sidebar-foreground/30 hover:text-sidebar-foreground/60 hover:bg-sidebar-accent/20 transition-colors cursor-pointer">
              <FileText className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
              <span className="font-mono text-[10px] tracking-wide uppercase">{t("legal.privacy_policy")}</span>
            </div>
          </Link>
          <div className="text-xs text-sidebar-foreground/40 text-center font-mono uppercase tracking-widest pt-1">
            {t("app.established")}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        id={MAIN_CONTENT_ID}
        className="flex-1 flex flex-col min-w-0 max-w-full relative"
        tabIndex={-1}
      >
        <ContextBar />
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" aria-hidden="true" />
        <div className="flex-1 p-6 md:p-12 lg:p-16 max-w-6xl mx-auto w-full z-10">
          {children}
        </div>
      </main>

      <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.sign_out_confirm_title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("common.sign_out_confirm_desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { logout(); navigate("/"); }}
            >
              {t("common.sign_out_confirm_action")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
