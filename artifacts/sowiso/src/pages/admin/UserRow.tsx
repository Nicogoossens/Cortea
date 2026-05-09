import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { useAdminFetch } from "@/lib/useAdminFetch";
import {
  Shield, User, ChevronDown, ChevronUp, BadgeCheck, Ban, Loader2,
  CheckCircle2, XCircle, Trash2, AlertTriangle,
} from "lucide-react";
import type { AdminUser, ActionState } from "./types";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

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

export function UserRow({ user, authHeaders, onUpdated, onDeleted }: {
  user: AdminUser;
  authHeaders: Record<string, string>;
  onUpdated: (updated: AdminUser) => void;
  onDeleted: (id: string) => void;
}) {
  const { t } = useLanguage();
  const adminFetch = useAdminFetch();
  const [expanded, setExpanded] = useState(false);
  const [actionState, setActionState] = useState<ActionState>("idle");
  const [tierValue, setTierValue] = useState(user.subscription_tier);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteState, setDeleteState] = useState<ActionState>("idle");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);

  const isSuspended = !!user.suspended_at;

  async function deleteUser() {
    setDeleteState("loading");
    try {
      const res = await adminFetch(`${API_BASE}/api/admin/users/${user.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onDeleted(user.id);
      } else {
        setDeleteState("error");
        setTimeout(() => setDeleteState("idle"), 2000);
      }
    } catch {
      setDeleteState("error");
      setTimeout(() => setDeleteState("idle"), 2000);
    }
  }

  async function patchUser(payload: Record<string, unknown>) {
    setActionState("loading");
    try {
      const res = await adminFetch(`${API_BASE}/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
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
              <span className="font-mono uppercase tracking-wider text-muted-foreground/70">Active Region</span>
              <p className="text-foreground mt-0.5">{user.active_region ?? "—"}</p>
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
            {isSuspended ? (
              <Button
                size="sm"
                variant="outline"
                className="font-mono text-xs gap-1.5 border-green-400/60 text-green-700 hover:bg-green-50"
                disabled={actionState === "loading"}
                onClick={async () => {
                  setActionState("loading");
                  try {
                    const res = await adminFetch(`${API_BASE}/api/admin/users/${user.id}/unsuspend`, {
                      method: "PATCH",
                    });
                    if (res.ok) {
                      onUpdated(await res.json() as AdminUser);
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
                }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />{t("admin.action_unsuspend")}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="font-mono text-xs gap-1.5 border-red-400/60 text-red-700 hover:bg-red-50"
                disabled={actionState === "loading"}
                onClick={() => setShowSuspendConfirm(true)}
              >
                <Ban className="w-3.5 h-3.5" />{t("admin.action_suspend")}
              </Button>
            )}
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

          {showSuspendConfirm && !isSuspended && (
            <div className="border border-amber-200/60 bg-amber-50/50 rounded-sm p-3 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 font-mono">
                  Suspend <strong>{user.full_name ?? user.email ?? "—"}</strong>? They will not be able to sign in until reinstated.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="font-mono text-xs gap-1.5 border-amber-500 bg-amber-500 text-white hover:bg-amber-600"
                  disabled={actionState === "loading"}
                  onClick={async () => {
                    setActionState("loading");
                    setShowSuspendConfirm(false);
                    try {
                      const res = await adminFetch(`${API_BASE}/api/admin/users/${user.id}/suspend`, {
                        method: "PATCH",
                      });
                      if (res.ok) {
                        onUpdated(await res.json() as AdminUser);
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
                  }}
                >
                  <Ban className="w-3.5 h-3.5" /> Confirm Suspend
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="font-mono text-xs"
                  onClick={() => setShowSuspendConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {!showDeleteConfirm ? (
            <div className="pt-2 border-t border-border/30">
              <Button
                size="sm"
                variant="outline"
                className="font-mono text-xs gap-1.5 border-red-300/60 text-red-600/70 hover:bg-red-50 hover:text-red-700 hover:border-red-400"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Account
              </Button>
            </div>
          ) : (
            <div className="pt-2 border-t border-red-200/60 bg-red-50/50 rounded-sm p-3 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-800 font-mono">
                  Permanently delete <strong>{user.full_name ?? user.email}</strong>? All data, progress, and score history will be removed. This cannot be undone.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-red-700 font-mono">Type <strong>DELETE</strong> to confirm:</p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="h-7 px-2 w-28 rounded-sm border border-red-300 bg-white text-xs font-mono text-red-800 placeholder:text-red-300 focus:outline-none focus:ring-1 focus:ring-red-400"
                  autoComplete="off"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="font-mono text-xs gap-1.5 border-red-500 bg-red-600 text-white hover:bg-red-700 disabled:opacity-40"
                  disabled={deleteState === "loading" || deleteConfirmText !== "DELETE"}
                  onClick={deleteUser}
                >
                  {deleteState === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Confirm Delete
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="font-mono text-xs"
                  disabled={deleteState === "loading"}
                  onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                >
                  Cancel
                </Button>
                {deleteState === "error" && <span className="text-xs text-destructive font-mono flex items-center">Error — try again</span>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
