import { useState, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { useAdminFetch } from "@/lib/useAdminFetch";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Link } from "wouter";
import {
  Shield, Lock, Search, Loader2, AlertTriangle, Mail, ArrowRight,
  Users, BarChart3, TrendingUp, Database, Briefcase, Cpu, KeyRound, Languages, Vote, Upload,
} from "lucide-react";

import { UserRow } from "./UserRow";
import { ContentTab } from "./ContentTab";
import { CCProtocolsTab } from "./CCProtocolsTab";
import { TranslationHealthTab } from "./TranslationHealthTab";
import { OnboardingFunnelTab } from "./OnboardingFunnelTab";
import { UseCasesTab } from "./UseCasesTab";
import { AttributionTab } from "./AttributionTab";
import { CountryVotesTab } from "./CountryVotesTab";
import { CounselSeedsTab } from "./CounselSeedsTab";
import { IntegrationsPanel } from "./IntegrationsPanel";
import { ImportTab } from "./ImportTab";
import type { AdminTab, AdminUser } from "./types";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Admin() {
  usePageTitle("Admin");
  const { t } = useLanguage();
  const { isAuthenticated, isAdmin } = useAuth();
  const adminFetch = useAdminFetch();
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const authHeaders: Record<string, string> = {};

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [waitlistCounts, setWaitlistCounts] = useState<{ claimed: number; total: number } | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    adminFetch(`${API_BASE}/api/admin/waitlist`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { founderClaimed: number; founderTotal: number } | null) => {
        if (!cancelled && d) setWaitlistCounts({ claimed: d.founderClaimed, total: d.founderTotal });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isAdmin, adminFetch]);

  const fetchUsers = useCallback(async (q: string, page = 1) => {
    setLoading(true); setFetchError(null);
    try {
      const url = `${API_BASE}/api/admin/users?q=${encodeURIComponent(q)}&page=${page}&limit=50`;
      const res = await adminFetch(url);
      if (res.ok) {
        const data = await res.json() as { users: AdminUser[]; total: number; pages: number; page: number };
        setUsers(data.users); setTotalPages(data.pages ?? 1); setTotalUsers(data.total ?? 0); setCurrentPage(data.page ?? 1);
      } else if (res.status !== 403) {
        setFetchError(t("admin.error_load_users"));
      }
    } catch { setFetchError(t("admin.error_network")); }
    finally { setLoading(false); setSearched(true); }
  }, [adminFetch, t]);

  useEffect(() => { if (isAdmin) fetchUsers(""); }, [isAdmin, fetchUsers]);

  function handleSearch(e: React.FormEvent) { e.preventDefault(); fetchUsers(query, 1); }
  function handleUserUpdated(updated: AdminUser) { setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u)); }
  function handleUserDeleted(id: string) {
    setUsers((prev) => {
      const next = prev.filter((u) => u.id !== id);
      const newTotal = Math.max(0, totalUsers - 1);
      setTotalUsers(newTotal);
      const newTotalPages = Math.max(1, Math.ceil(newTotal / 50));
      setTotalPages(newTotalPages);
      if (next.length === 0 && currentPage > 1) { const p = currentPage - 1; setCurrentPage(p); fetchUsers(query, p); }
      return next;
    });
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-6">
        <Lock className="w-12 h-12 mx-auto text-muted-foreground/40" aria-hidden="true" />
        <p className="text-muted-foreground font-light">{t("profile.not_authenticated")}</p>
        <Link href="/signin"><Button className="font-serif">{t("profile.sign_in")}</Button></Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-6">
        <Shield className="w-12 h-12 mx-auto text-muted-foreground/40" aria-hidden="true" />
        <p className="text-muted-foreground font-light">{t("admin.not_admin")}</p>
        <Link href="/"><Button variant="outline" className="font-serif">{t("common.return_home")}</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" aria-hidden="true" />
          <h1 className="text-3xl font-serif text-foreground">{t("admin.title")}</h1>
        </div>
        <p className="text-muted-foreground font-light text-sm">{t("admin.subtitle")}</p>
      </div>

      <Link href="/admin/waitlist" className="block group no-underline">
        <Card className="bg-card border-border hover:border-primary/60 transition-colors cursor-pointer">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-primary" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-serif text-foreground">Waitlist</div>
              <div className="text-xs text-muted-foreground font-light">Founder signups & invitations</div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-serif text-foreground">
                {waitlistCounts ? (
                  <><span className="text-lg text-primary">{waitlistCounts.claimed}</span><span className="text-xs text-muted-foreground"> / {waitlistCounts.total}</span></>
                ) : <span className="text-xs font-mono text-muted-foreground">…</span>}
              </div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Founders</div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" aria-hidden="true" />
          </CardContent>
        </Card>
      </Link>

      {/* Tab nav */}
      <div className="flex flex-wrap gap-x-1 gap-y-0 border-b border-border/50">
        {([
          { key: "users" as const,         label: "Users",               icon: Users },
          { key: "attribution" as const,   label: "Attribution",         icon: BarChart3 },
          { key: "onboarding" as const,    label: "Onboarding",          icon: TrendingUp },
          { key: "content" as const,       label: "Inhoud",              icon: Database },
          { key: "use_cases" as const,     label: "Use Cases",           icon: Briefcase },
          { key: "cc_screening" as const,  label: "CC Screening",        icon: Cpu },
          { key: "integrations" as const,  label: "Integrations",        icon: KeyRound },
          { key: "translation" as const,   label: "Vertalingen",         icon: Languages },
          { key: "counsel_seeds" as const, label: "Atelier-distillaten", icon: Database },
          { key: "votes" as const,         label: "Country Votes",       icon: Vote },
          { key: "import" as const,         label: "Import",              icon: Upload },
        ]).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 shrink-0 whitespace-nowrap px-3 py-2.5 text-sm font-mono transition-colors border-b-2 -mb-px ${activeTab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* Users */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input placeholder={t("admin.search_placeholder")} value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9 rounded-sm" />
            </div>
            <Button type="submit" className="font-serif rounded-sm" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("admin.search_btn")}
            </Button>
          </form>

          {loading && <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-16 rounded-sm" />)}</div>}

          {!loading && fetchError && (
            <Card className="bg-card border-destructive/40">
              <CardContent className="py-8 text-center space-y-3">
                <AlertTriangle className="w-6 h-6 text-destructive mx-auto" aria-hidden="true" />
                <p className="text-sm text-destructive font-mono">{fetchError}</p>
                <Button size="sm" variant="outline" className="font-mono text-xs" onClick={() => fetchUsers(query, currentPage)}>{t("admin.retry")}</Button>
              </CardContent>
            </Card>
          )}

          {!loading && searched && !fetchError && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{t("admin.users_found", { n: totalUsers })}</p>
                {totalPages > 1 && <p className="text-xs font-mono text-muted-foreground">Page {currentPage} / {totalPages}</p>}
              </div>
              {users.length === 0 ? (
                <Card className="bg-card border-border"><CardContent className="py-12 text-center"><p className="text-muted-foreground font-light">{t("admin.no_users")}</p></CardContent></Card>
              ) : (
                <div className="space-y-2">
                  {users.map((u) => <UserRow key={u.id} user={u} authHeaders={authHeaders} onUpdated={handleUserUpdated} onDeleted={handleUserDeleted} />)}
                </div>
              )}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button size="sm" variant="outline" className="font-mono text-xs" disabled={currentPage <= 1 || loading} onClick={() => fetchUsers(query, currentPage - 1)}>← Prev</Button>
                  <span className="text-xs font-mono text-muted-foreground px-2">{currentPage} / {totalPages}</span>
                  <Button size="sm" variant="outline" className="font-mono text-xs" disabled={currentPage >= totalPages || loading} onClick={() => fetchUsers(query, currentPage + 1)}>Next →</Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "content"      && <ContentTab authHeaders={authHeaders} />}
      {activeTab === "use_cases"    && <UseCasesTab />}
      {activeTab === "cc_screening" && <CCProtocolsTab authHeaders={authHeaders} />}
      {activeTab === "integrations" && <IntegrationsPanel />}
      {activeTab === "attribution"  && <AttributionTab />}
      {activeTab === "onboarding"   && <OnboardingFunnelTab />}
      {activeTab === "translation"  && <TranslationHealthTab />}
      {activeTab === "counsel_seeds"&& <CounselSeedsTab authHeaders={authHeaders} />}
      {activeTab === "votes"        && <CountryVotesTab authHeaders={authHeaders} />}
      {activeTab === "import"       && <ImportTab />}
    </div>
  );
}
