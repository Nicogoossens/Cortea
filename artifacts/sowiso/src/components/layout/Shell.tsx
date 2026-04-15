import { Link, useLocation } from "wouter";
import { BookOpen, Compass, Shield, User, Menu, X, Landmark, UserPlus, LogIn, LogOut, Crown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ContextBar } from "@/components/context-bar";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useLanguage();
  const { isAuthenticated, userName, logout } = useAuth();

  const navigation = [
    { key: "nav.dashboard", href: "/",           icon: Landmark },
    { key: "nav.atelier",   href: "/atelier",    icon: BookOpen },
    { key: "nav.counsel",   href: "/counsel",    icon: Shield   },
    { key: "nav.compass",   href: "/compass",    icon: Compass  },
    { key: "nav.profile",   href: "/profile",    icon: User     },
    { key: "nav.membership",href: "/membership", icon: Crown    },
  ];

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
        <span className="font-serif text-xl tracking-wide text-sidebar-primary" aria-label={t("app.name")}>
          {t("app.name")}
        </span>
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

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          id="mobile-nav"
          className="md:hidden fixed inset-0 top-[65px] bg-sidebar z-50 p-4 animate-in fade-in slide-in-from-top-4"
        >
          <nav aria-label={t("nav.aria_label")} className="space-y-2">
            {navigation.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              const isMembership = item.href === "/membership";
              return (
                <Link key={item.key} href={item.href}>
                  <div
                    role="link"
                    tabIndex={0}
                    onClick={() => setIsMobileMenuOpen(false)}
                    onKeyDown={(e) => { if (e.key === "Enter") setIsMobileMenuOpen(false); }}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-3 px-4 py-3 rounded-sm transition-colors cursor-pointer ${
                      isMembership
                        ? "text-amber-600/80 hover:bg-amber-500/10"
                        : isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                    <span className="font-medium">{t(item.key as Parameters<typeof t>[0])}</span>
                  </div>
                </Link>
              );
            })}

            <div className="pt-4 border-t border-sidebar-border/50 space-y-2">
              {isAuthenticated ? (
                <button
                  onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                  className="flex items-center gap-3 px-4 py-3 rounded-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/30 transition-colors w-full"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              ) : (
                <>
                  <Link href="/signin">
                    <div onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors cursor-pointer">
                      <LogIn className="h-4 w-4" aria-hidden="true" />
                      <span className="text-sm font-medium">{t("signin.title")}</span>
                    </div>
                  </Link>
                  <Link href="/register">
                    <div onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors cursor-pointer">
                      <UserPlus className="h-4 w-4" aria-hidden="true" />
                      <span className="text-sm font-medium">{t("register.title")}</span>
                    </div>
                  </Link>
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
        <div className="p-8 flex items-center justify-center border-b border-sidebar-border/50">
          <span className="font-serif text-3xl tracking-widest text-sidebar-primary uppercase">
            {t("app.name")}
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto" aria-label={t("nav.aria_label")}>
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            const isMembership = item.href === "/membership";
            return (
              <Link key={item.key} href={item.href} className="block">
                <div
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 px-4 py-3 rounded-sm transition-all duration-200 ${
                    isMembership
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
                </div>
              </Link>
            );
          })}
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
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 rounded-sm text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/30 transition-colors cursor-pointer w-full"
              >
                <LogOut className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                <span className="font-mono tracking-wide">Sign Out</span>
              </button>
            </>
          ) : (
            <>
              <Link href="/signin" className="block">
                <div className="flex items-center gap-2 px-3 py-2 rounded-sm text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 transition-colors cursor-pointer">
                  <LogIn className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                  <span className="font-mono tracking-wide">{t("signin.title")}</span>
                </div>
              </Link>
              <Link href="/register" className="block">
                <div className="flex items-center gap-2 px-3 py-2 rounded-sm text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/30 transition-colors cursor-pointer">
                  <UserPlus className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                  <span className="font-mono tracking-wide">{t("register.title")}</span>
                </div>
              </Link>
            </>
          )}
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
    </div>
  );
}
