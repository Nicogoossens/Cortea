import { useState, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import {
  Search, Lock, CheckCircle2, XCircle, Shield, User, ChevronDown, ChevronUp,
  BadgeCheck, Ban, Loader2,
} from "lucide-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface AdminUser {
  id: string;
  full_name: string | null;
  email: string | null;
  email_verified: boolean;
  subscription_tier: string;
  subscription_status: string;
  noble_score: number;
  is_admin: boolean;
  suspended_at: string | null;
  created_at: string;
  language_code: string;
  country_of_origin: string | null;
  onboarding_completed: boolean;
}

type ActionState = "idle" | "loading" | "done" | "error";

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    guest: "bg-muted text-muted-foreground",
    traveller: "bg-blue-100 text-blue-700",
    ambassador: "bg-amber-100 text-amber-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase tracking-widest ${colors[tier] ?? colors.guest}`}>
      {tier}
    </span>
  );
}

function UserRow({ user, authHeaders, onUpdated }: {
  user: AdminUser;
  authHeaders: Record<string, string>;
  onUpdated: (updated: AdminUser) => void;
}) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [actionState, setActionState] = useState<ActionState>("idle");
  const [tierValue, setTierValue] = useState(user.subscription_tier);

  const isSuspended = !!user.suspended_at;

  async function patchUser(payload: Record<string, unknown>) {
    setActionState("loading");
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json() as AdminUser;
        onUpdated(updated);
        setActionState("done");
        setTimeout(() => setActionState("idle"), 1500);
      } else {
        setActionState("error");
        setTimeout(() => setActionState("idle"), 2000);
      }
    } catch {
      setActionState("error");
      setTimeout(() => setActionState("idle"), 2000);
    }
  }

  return (
    <div className="border border-border/60 rounded-sm bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-primary" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground truncate">
              {user.full_name ?? "—"}
            </span>
            {user.is_admin && (
              <Shield className="w-3 h-3 text-amber-600 flex-shrink-0" aria-hidden="true" />
            )}
            <TierBadge tier={user.subscription_tier} />
            {isSuspended && (
              <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase tracking-widest bg-red-100 text-red-700">
                {t("admin.suspended")}
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground font-light truncate">{user.email ?? "—"}</div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {user.email_verified
            ? <CheckCircle2 className="w-4 h-4 text-green-500" aria-label={t("admin.verified")} />
            : <XCircle className="w-4 h-4 text-muted-foreground/40" aria-label={t("admin.unverified")} />
          }
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-border/40 space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="font-mono uppercase tracking-wider text-muted-foreground/70">{t("admin.col_id")}</span>
              <p className="font-mono text-foreground mt-0.5 break-all">{user.id}</p>
            </div>
            <div>
              <span className="font-mono uppercase tracking-wider text-muted-foreground/70">{t("admin.col_score")}</span>
              <p className="text-foreground mt-0.5">{user.noble_score}</p>
            </div>
            <div>
              <span className="font-mono uppercase tracking-wider text-muted-foreground/70">{t("admin.col_lang")}</span>
              <p className="text-foreground mt-0.5">{user.language_code}</p>
            </div>
            <div>
              <span className="font-mono uppercase tracking-wider text-muted-foreground/70">{t("admin.col_country")}</span>
              <p className="text-foreground mt-0.5">{user.country_of_origin ?? "—"}</p>
            </div>
            <div>
              <span className="font-mono uppercase tracking-wider text-muted-foreground/70">{t("admin.col_onboarding")}</span>
              <p className="text-foreground mt-0.5">{user.onboarding_completed ? t("admin.yes") : t("admin.no")}</p>
            </div>
            <div>
              <span className="font-mono uppercase tracking-wider text-muted-foreground/70">{t("admin.col_joined")}</span>
              <p className="text-foreground mt-0.5">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {!user.email_verified && (
              <Button
                size="sm"
                variant="outline"
                className="font-mono text-xs gap-1.5"
                disabled={actionState === "loading"}
                onClick={() => patchUser({ email_verified: true })}
              >
                <BadgeCheck className="w-3.5 h-3.5" aria-hidden="true" />
                {t("admin.action_verify")}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className={`font-mono text-xs gap-1.5 ${isSuspended ? "border-green-400/60 text-green-700 hover:bg-green-50" : "border-red-400/60 text-red-700 hover:bg-red-50"}`}
              disabled={actionState === "loading"}
              onClick={() => patchUser({ suspended_at: isSuspended ? null : new Date().toISOString() })}
            >
              {isSuspended
                ? <><CheckCircle2 className="w-3.5 h-3.5" />{t("admin.action_unsuspend")}</>
                : <><Ban className="w-3.5 h-3.5" />{t("admin.action_suspend")}</>
              }
            </Button>
            <div className="flex items-center gap-1.5">
              <select
                value={tierValue}
                onChange={(e) => setTierValue(e.target.value)}
                className="h-8 px-2 rounded-sm border border-border/60 bg-background text-xs text-foreground font-mono"
              >
                <option value="guest">guest</option>
                <option value="traveller">traveller</option>
                <option value="ambassador">ambassador</option>
              </select>
              <Button
                size="sm"
                variant="outline"
                className="font-mono text-xs h-8"
                disabled={actionState === "loading" || tierValue === user.subscription_tier}
                onClick={() => patchUser({ subscription_tier: tierValue })}
              >
                {actionState === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t("admin.action_set_tier")}
              </Button>
            </div>
            {actionState === "done" && <span className="text-xs text-green-600 font-mono flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{t("admin.saved")}</span>}
            {actionState === "error" && <span className="text-xs text-destructive font-mono">{t("admin.error")}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const { t } = useLanguage();
  const { isAuthenticated, isAdmin, getAuthHeaders } = useAuth();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const authHeaders = getAuthHeaders();

  const fetchUsers = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const url = `${API_BASE}/api/admin/users?q=${encodeURIComponent(q)}&limit=50`;
      const res = await fetch(url, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json() as { users: AdminUser[] };
        setUsers(data.users);
      }
    } catch {
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchUsers("");
  }, [isAdmin, fetchUsers]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchUsers(query);
  }

  function handleUserUpdated(updated: AdminUser) {
    setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u));
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-6">
        <Lock className="w-12 h-12 mx-auto text-muted-foreground/40" aria-hidden="true" />
        <p className="text-muted-foreground font-light">{t("profile.not_authenticated")}</p>
        <Link href="/signin">
          <Button className="font-serif">{t("profile.sign_in")}</Button>
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-6">
        <Shield className="w-12 h-12 mx-auto text-muted-foreground/40" aria-hidden="true" />
        <p className="text-muted-foreground font-light">{t("admin.not_admin")}</p>
        <Link href="/">
          <Button variant="outline" className="font-serif">{t("common.return_home")}</Button>
        </Link>
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

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder={t("admin.search_placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 rounded-sm"
          />
        </div>
        <Button type="submit" className="font-serif rounded-sm" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("admin.search_btn")}
        </Button>
      </form>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-sm" />)}
        </div>
      )}

      {!loading && searched && (
        <div className="space-y-3">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
            {t("admin.users_found", { n: users.length })}
          </p>
          {users.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground font-light">{t("admin.no_users")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  authHeaders={authHeaders}
                  onUpdated={handleUserUpdated}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
