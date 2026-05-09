import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminFetch } from "@/lib/useAdminFetch";
import { useLanguage } from "@/lib/i18n";
import {
  Loader2, RefreshCw, Save, Trash2, CheckCircle2, XCircle, ChevronDown, ChevronUp,
  ThumbsUp, AlertTriangle, BookOpen, Cpu, ClipboardList, BadgeCheck, Shield,
} from "lucide-react";
import type { ActionState } from "./types";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const CC_SUBCATEGORIES: Record<string, string[]> = {
  Z1: ["religious_impact", "holidays", "gift_giving", "taboos", "color_symbolism", "alternative_behavior"],
  Z2: ["forms_of_address", "greeting_ritual", "communication_context", "safe_smalltalk", "topics_to_avoid", "nonverbal_style"],
  Z3: ["cutlery_use", "seating_order", "payment_ritual", "consumption_sounds", "table_posture", "wine_and_drinks"],
  Z4: ["gender_nuances", "seniority_business", "hierarchy_social", "networking", "relationship_gifts", "conflict_face_saving"],
  Z5: ["dress_code_business", "dress_code_social", "modest_dress", "eye_contact_personal_space", "touch_etiquette", "accessories_symbols"],
};

const CC_BOOKS = [
  { code: "DH", label: "DH — Debrett's Handbook (UK)" },
  { code: "AV", label: "AV — Amy Vanderbilt (Universeel West)" },
  { code: "ME", label: "ME — Modern Etiquette for a Better Life" },
  { code: "MG", label: "MG — Guide to the Modern Gentleman (UK)" },
  { code: "DN", label: "DN — Debrett's New Guide (UK)" },
  { code: "CB", label: "CB — Chinese Business Etiquette (China)" },
  { code: "CA", label: "CA — Culture Smart! Australia" },
  { code: "CM", label: "CM — The Culture Map (Cross-cultureel)" },
] as const;

const PILLAR_LABELS: Record<string, string> = {
  Z1: "Z1 · Cultuur & Traditie",
  Z2: "Z2 · Interactie & Taal",
  Z3: "Z3 · Tafelmanieren",
  Z4: "Z4 · Relaties & Status",
  Z5: "Z5 · Verschijning",
};

interface CCRecord {
  source_book: string; source_page: string; region: string; pillar: string;
  subcategory: string; rule_raw: string; rule_cc: string; personas: string[];
  modules: string[]; urgency: number; verified: boolean; _note?: string;
}

interface PendingCCRecord {
  id: number; region_code: string; pillar_code: string | null; subcategory: string | null;
  rule_cc: string | null; rule_raw: string | null; urgency: number | null;
  source_book: string | null; source_page: string | null; source_reference: string | null;
  verified: boolean; created_at: string;
}

interface VerifiedCCRecord {
  id: number; region_code: string; pillar_code: string | null; subcategory: string | null;
  rule_cc: string | null; urgency: number | null; source_book: string | null;
  source_page: string | null; source_reference: string | null; created_at: string;
  reviewed_by: string | null; reviewed_at: string | null; reviewer_name: string | null;
}

function UrgencyBadge({ urgency }: { urgency: number | null }) {
  const { t } = useLanguage();
  if (urgency === 3) return <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase tracking-widest bg-red-100 text-red-700 border border-red-200">U3 · {t("admin.cc.urgency_critical")}</span>;
  if (urgency === 2) return <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase tracking-widest bg-amber-100 text-amber-700 border border-amber-200">U2 · {t("admin.cc.urgency_important")}</span>;
  return <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase tracking-widest bg-green-50 text-green-700 border border-green-200">U1 · {t("admin.cc.urgency_nice")}</span>;
}

function PendingRecordRow({ record, authHeaders, onApproved, onDeleted }: {
  record: PendingCCRecord; authHeaders: Record<string, string>;
  onApproved: (id: number) => void; onDeleted: (id: number) => void;
}) {
  const { t } = useLanguage();
  const adminFetch = useAdminFetch();
  const [expanded, setExpanded] = useState(false);
  const [approveState, setApproveState] = useState<ActionState>("idle");
  const [deleteState, setDeleteState] = useState<ActionState>("idle");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editRuleCc, setEditRuleCc] = useState(record.rule_cc ?? "");
  const [editSubcategory, setEditSubcategory] = useState(record.subcategory ?? "");
  const [editUrgency, setEditUrgency] = useState<number>(record.urgency ?? 1);
  const [editRegionCode, setEditRegionCode] = useState(record.region_code ?? "");
  const [saveState, setSaveState] = useState<ActionState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [baseline, setBaseline] = useState({ rule_cc: record.rule_cc ?? "", subcategory: record.subcategory ?? "", urgency: record.urgency ?? 1, region_code: record.region_code ?? "" });

  const isUrgent = editUrgency === 3;
  const pillarCode = record.pillar_code ?? "";
  const subcategoryOptions = CC_SUBCATEGORIES[pillarCode] ?? [];
  const isDirty = editRuleCc !== baseline.rule_cc || editSubcategory !== baseline.subcategory || editUrgency !== baseline.urgency || editRegionCode !== baseline.region_code;

  async function handleSaveChanges() {
    setSaveState("loading"); setSaveError(null);
    try {
      const payload: Record<string, unknown> = {};
      if (editRuleCc !== baseline.rule_cc) payload.rule_cc = editRuleCc;
      if (editSubcategory !== baseline.subcategory) payload.subcategory = editSubcategory;
      if (editUrgency !== baseline.urgency) payload.urgency = editUrgency;
      if (editRegionCode !== baseline.region_code) payload.region_code = editRegionCode;
      const res = await adminFetch(`${API_BASE}/api/admin/cc-protocols/${record.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { setBaseline({ rule_cc: editRuleCc, subcategory: editSubcategory, urgency: editUrgency, region_code: editRegionCode }); setSaveState("done"); setTimeout(() => setSaveState("idle"), 2000); }
      else { const data = await res.json() as { error?: string; message?: string }; setSaveError(data.message ?? data.error ?? t("admin.cc.save_error")); setSaveState("error"); setTimeout(() => setSaveState("idle"), 3000); }
    } catch { setSaveError(t("admin.cc.connection_error")); setSaveState("error"); setTimeout(() => setSaveState("idle"), 3000); }
  }

  async function handleApprove() {
    setApproveState("loading");
    try {
      const res = await adminFetch(`${API_BASE}/api/admin/cc-protocols/${record.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ approve: true }) });
      if (res.ok) { setApproveState("done"); setTimeout(() => onApproved(record.id), 800); }
      else { setApproveState("error"); setTimeout(() => setApproveState("idle"), 2000); }
    } catch { setApproveState("error"); setTimeout(() => setApproveState("idle"), 2000); }
  }

  async function handleDelete() {
    setDeleteState("loading");
    try {
      const res = await adminFetch(`${API_BASE}/api/admin/cc-protocols/${record.id}`, { method: "DELETE" });
      if (res.ok) { setDeleteState("done"); setTimeout(() => onDeleted(record.id), 500); }
      else { setDeleteState("error"); setTimeout(() => setDeleteState("idle"), 2000); }
    } catch { setDeleteState("error"); setTimeout(() => setDeleteState("idle"), 2000); }
  }

  return (
    <div className={`border rounded-sm overflow-hidden ${isUrgent ? "border-red-300 bg-red-50/30" : "border-border/60 bg-card"}`}>
      <button type="button" onClick={() => setExpanded((v) => !v)} className="w-full flex items-start gap-3 p-3 text-left hover:bg-muted/20 transition-colors">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-medium text-foreground">{record.pillar_code ?? "—"} · {editSubcategory || record.subcategory || "—"}</span>
            <UrgencyBadge urgency={editUrgency} />
            <span className="text-[10px] font-mono text-muted-foreground border border-border/50 px-1.5 py-0.5 rounded-sm">{editRegionCode || record.region_code}</span>
            <span className="text-[10px] font-mono text-muted-foreground">{record.source_book} · p.{record.source_page}</span>
          </div>
          <p className="text-xs text-muted-foreground font-light truncate">{editRuleCc ? editRuleCc.slice(0, 120) + (editRuleCc.length > 120 ? "…" : "") : "—"}</p>
        </div>
        <div className="shrink-0 pt-0.5">{expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}</div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-border/30 space-y-3 animate-in fade-in duration-150">
          {record.rule_raw && (
            <div className="space-y-1">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">{t("admin.cc.rule_raw_label")}</p>
              <p className="text-xs font-light text-muted-foreground italic bg-muted/30 rounded-sm px-2 py-1.5">{record.rule_raw}</p>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">{t("admin.cc.rule_cc_label")}</label>
            <textarea value={editRuleCc} onChange={(e) => setEditRuleCc(e.target.value)} rows={3} className="w-full rounded-sm border border-border bg-background px-2 py-1.5 text-xs font-light leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-primary/40" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">{t("admin.cc.field_subcategory")}</label>
              <select value={editSubcategory} onChange={(e) => setEditSubcategory(e.target.value)} className="w-full h-7 px-2 rounded-sm border border-border bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary/40">
                {subcategoryOptions.length > 0 ? subcategoryOptions.map((s) => <option key={s} value={s}>{s}</option>) : <option value={editSubcategory}>{editSubcategory || "—"}</option>}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">{t("admin.cc.field_urgency")}</label>
              <select value={editUrgency} onChange={(e) => setEditUrgency(Number(e.target.value))} className="w-full h-7 px-2 rounded-sm border border-border bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary/40">
                <option value={1}>1 — {t("admin.cc.urgency_nice")}</option>
                <option value={2}>2 — {t("admin.cc.urgency_important")}</option>
                <option value={3}>3 — {t("admin.cc.urgency_critical")}</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">{t("admin.cc.field_region_code")}</label>
              <input type="text" value={editRegionCode} onChange={(e) => setEditRegionCode(e.target.value.toUpperCase())} maxLength={10} className="w-full h-7 px-2 rounded-sm border border-border bg-background text-xs font-mono uppercase focus:outline-none focus:ring-1 focus:ring-primary/40" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Button size="sm" variant="outline" className="font-mono text-xs gap-1.5" disabled={saveState === "loading" || !isDirty || approveState === "loading"} onClick={handleSaveChanges}>
              {saveState === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {t("admin.cc.save_changes")}
            </Button>
            {saveState === "done" && <span className="text-xs text-green-600 font-mono flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {t("admin.cc.saved_ok")}</span>}
            {saveState === "error" && saveError && <span className="text-xs text-red-600 font-mono">{saveError}</span>}
          </div>
          <div className="text-[10px] font-mono text-muted-foreground space-x-4">
            <span>ID: {record.id}</span>
            <span>{t("admin.cc.source_label")} {record.source_reference ?? `${record.source_book}:${record.source_page}`}</span>
            <span>{t("admin.cc.added_label")} {new Date(record.created_at).toLocaleDateString()}</span>
          </div>
          {approveState === "done" ? (
            <div className="flex items-center gap-2 text-xs text-green-700 font-mono p-2 bg-green-50 rounded-sm border border-green-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> {t("admin.cc.approved_ok")}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 items-center">
              <Button size="sm" variant="outline" className="font-mono text-xs gap-1.5 border-green-400/60 text-green-700 hover:bg-green-50 disabled:opacity-40" disabled={approveState === "loading" || deleteState === "loading" || saveState === "loading" || isDirty} title={isDirty ? t("admin.cc.save_first_title") : undefined} onClick={handleApprove}>
                {approveState === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ThumbsUp className="w-3.5 h-3.5" />}
                {t("admin.cc.approve")}
              </Button>
              {isDirty && <span className="text-[10px] text-amber-600 font-mono">{t("admin.cc.save_first_warn")}</span>}
              {!showDeleteConfirm ? (
                <Button size="sm" variant="outline" className="font-mono text-xs gap-1.5 border-red-300/60 text-red-600/70 hover:bg-red-50 hover:text-red-700" disabled={approveState === "loading" || deleteState === "loading"} onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 className="w-3.5 h-3.5" />{t("admin.cc.delete")}
                </Button>
              ) : (
                <div className="flex gap-2 items-center">
                  <Button size="sm" variant="outline" className="font-mono text-xs gap-1.5 border-red-500 bg-red-600 text-white hover:bg-red-700" disabled={deleteState === "loading"} onClick={handleDelete}>
                    {deleteState === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    {t("admin.cc.confirm_delete")}
                  </Button>
                  <Button size="sm" variant="outline" className="font-mono text-xs" onClick={() => setShowDeleteConfirm(false)}>{t("admin.cc.cancel")}</Button>
                </div>
              )}
              {approveState === "error" && <span className="text-xs text-red-600 font-mono">{t("admin.cc.approve_error")}</span>}
              {deleteState === "error" && <span className="text-xs text-red-600 font-mono">{t("admin.cc.delete_error")}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PendingReviewPanel({ authHeaders, refreshKey }: { authHeaders: Record<string, string>; refreshKey: number }) {
  const { t } = useLanguage();
  const adminFetch = useAdminFetch();
  const [records, setRecords] = useState<PendingCCRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPending = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await adminFetch(`${API_BASE}/api/admin/cc-protocols?page=${p}&limit=20`);
      if (res.ok) {
        const data = await res.json() as { records: PendingCCRecord[]; total: number; pages: number; page: number };
        setRecords(data.records); setTotal(data.total); setTotalPages(data.pages ?? 1); setPage(data.page ?? 1);
      }
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPending(1); }, [fetchPending, refreshKey]);

  function handleApproved(id: number) {
    const next = records.filter((r) => r.id !== id); const newTotal = Math.max(0, total - 1);
    setRecords(next); setTotal(newTotal);
    if (next.length === 0 && newTotal > 0) fetchPending(page > 1 ? page - 1 : 1);
  }
  function handleDeleted(id: number) {
    const next = records.filter((r) => r.id !== id); const newTotal = Math.max(0, total - 1);
    setRecords(next); setTotal(newTotal);
    if (next.length === 0 && newTotal > 0) fetchPending(page > 1 ? page - 1 : 1);
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
          <ClipboardList className="w-4 h-4" />{t("admin.cc.pending_queue")}
          {total > 0 && <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full border border-amber-300 bg-amber-50 text-amber-700 font-mono">{t("admin.cc.in_queue", { n: total })}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground font-light">{t("admin.cc.pending_desc")}</p>
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono text-muted-foreground">{loading ? t("admin.cc.loading") : t(total === 1 ? "admin.cc.records_pending_one" : "admin.cc.records_pending_other", { n: total })}</p>
          <Button variant="outline" size="sm" className="font-mono text-xs gap-1.5" onClick={() => fetchPending(page)} disabled={loading}>
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}{t("admin.cc.refresh")}
          </Button>
        </div>
        {loading && records.length === 0 ? (
          <div className="space-y-2">{[1,2,3].map((i) => <Skeleton key={i} className="h-14 rounded-sm" />)}</div>
        ) : records.length === 0 ? (
          <div className="py-8 text-center"><CheckCircle2 className="w-8 h-8 mx-auto text-green-400 mb-2" /><p className="text-sm text-muted-foreground font-light">{t("admin.cc.no_pending")}</p></div>
        ) : (
          <div className="space-y-2">
            {records.map((r) => <PendingRecordRow key={r.id} record={r} authHeaders={authHeaders} onApproved={handleApproved} onDeleted={handleDeleted} />)}
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button size="sm" variant="outline" className="font-mono text-xs" disabled={page <= 1 || loading} onClick={() => fetchPending(page - 1)}>{t("admin.cc.prev_page")}</Button>
            <span className="text-xs font-mono text-muted-foreground px-2">{page} / {totalPages}</span>
            <Button size="sm" variant="outline" className="font-mono text-xs" disabled={page >= totalPages || loading} onClick={() => fetchPending(page + 1)}>{t("admin.cc.next_page")}</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function VerifiedRecordRow({ record, onChanged, onRemoved, onUnverified }: {
  record: VerifiedCCRecord; onChanged: (updated: Partial<VerifiedCCRecord> & { id: number }) => void;
  onRemoved: (id: number) => void; onUnverified: (id: number) => void;
}) {
  const { t, locale } = useLanguage();
  const adminFetch = useAdminFetch();
  const [expanded, setExpanded] = useState(false);
  const [saveState, setSaveState] = useState<ActionState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [unverifyState, setUnverifyState] = useState<ActionState>("idle");
  const [showUnverifyConfirm, setShowUnverifyConfirm] = useState(false);
  const [deleteState, setDeleteState] = useState<ActionState>("idle");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editRuleCc, setEditRuleCc] = useState(record.rule_cc ?? "");
  const [editSubcategory, setEditSubcategory] = useState(record.subcategory ?? "");
  const [editUrgency, setEditUrgency] = useState<number>(record.urgency ?? 1);
  const [editRegionCode, setEditRegionCode] = useState(record.region_code ?? "");
  const [baseline, setBaseline] = useState({ rule_cc: record.rule_cc ?? "", subcategory: record.subcategory ?? "", urgency: record.urgency ?? 1, region_code: record.region_code ?? "" });

  const pillarCode = record.pillar_code ?? "";
  const subcategoryOptions = CC_SUBCATEGORIES[pillarCode] ?? [];
  const isDirty = editRuleCc !== baseline.rule_cc || editSubcategory !== baseline.subcategory || editUrgency !== baseline.urgency || editRegionCode !== baseline.region_code;

  async function handleSave() {
    setSaveState("loading"); setSaveError(null);
    try {
      const payload: Record<string, unknown> = {};
      if (editRuleCc !== baseline.rule_cc) payload.rule_cc = editRuleCc;
      if (editSubcategory !== baseline.subcategory) payload.subcategory = editSubcategory;
      if (editUrgency !== baseline.urgency) payload.urgency = editUrgency;
      if (editRegionCode !== baseline.region_code) payload.region_code = editRegionCode;
      const res = await adminFetch(`${API_BASE}/api/admin/cc-protocols/${record.id}/verified`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        const next = { rule_cc: editRuleCc, subcategory: editSubcategory, urgency: editUrgency, region_code: editRegionCode };
        setBaseline(next); onChanged({ id: record.id, ...next }); setSaveState("done"); setTimeout(() => setSaveState("idle"), 2000);
      } else {
        const data = await res.json().catch(() => ({} as { error?: string }));
        setSaveError(data.error ?? t("admin.cc.save_error")); setSaveState("error"); setTimeout(() => setSaveState("idle"), 3000);
      }
    } catch { setSaveError(t("admin.cc.connection_error")); setSaveState("error"); setTimeout(() => setSaveState("idle"), 3000); }
  }

  async function handleUnverify() {
    setUnverifyState("loading");
    try {
      const res = await adminFetch(`${API_BASE}/api/admin/cc-protocols/${record.id}/verified`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ unverify: true }) });
      if (res.ok) { setUnverifyState("done"); setTimeout(() => onUnverified(record.id), 600); }
      else { setUnverifyState("error"); setTimeout(() => setUnverifyState("idle"), 2500); }
    } catch { setUnverifyState("error"); setTimeout(() => setUnverifyState("idle"), 2500); }
  }

  async function handleDelete() {
    setDeleteState("loading");
    try {
      const res = await adminFetch(`${API_BASE}/api/admin/cc-protocols/${record.id}/verified`, { method: "DELETE" });
      if (res.ok) { setDeleteState("done"); setTimeout(() => onRemoved(record.id), 400); }
      else { setDeleteState("error"); setTimeout(() => setDeleteState("idle"), 2500); }
    } catch { setDeleteState("error"); setTimeout(() => setDeleteState("idle"), 2500); }
  }

  return (
    <div className="border border-green-200/60 bg-green-50/20 rounded-sm overflow-hidden">
      <button type="button" onClick={() => setExpanded((v) => !v)} className="w-full flex items-start gap-3 p-3 text-left hover:bg-muted/20 transition-colors">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-medium text-foreground">{record.pillar_code ?? "—"} · {editSubcategory || "—"}</span>
            <UrgencyBadge urgency={editUrgency} />
            <span className="text-[10px] font-mono text-muted-foreground border border-border/50 px-1.5 py-0.5 rounded-sm">{editRegionCode}</span>
          </div>
          <p className="text-xs text-muted-foreground font-light truncate">{editRuleCc ? editRuleCc.slice(0, 120) + (editRuleCc.length > 120 ? "…" : "") : "—"}</p>
          <p className="text-[10px] font-mono text-green-700/80">
            {t("admin.cc.reviewed_by")} <span className="font-semibold">{record.reviewer_name ?? t("admin.cc.unknown")}</span>
            {record.reviewed_at ? <> {t("admin.cc.reviewed_on")} {new Date(record.reviewed_at).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })}</> : null}
          </p>
        </div>
        <div className="shrink-0 pt-0.5">{expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}</div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-green-200/40 space-y-3 animate-in fade-in duration-150">
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">{t("admin.cc.rule_cc_label")}</label>
            <textarea value={editRuleCc} onChange={(e) => setEditRuleCc(e.target.value)} rows={3} className="w-full rounded-sm border border-border bg-background px-2 py-1.5 text-xs font-light leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-primary/40" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">{t("admin.cc.field_subcategory")}</label>
              <select value={editSubcategory} onChange={(e) => setEditSubcategory(e.target.value)} className="w-full h-7 px-2 rounded-sm border border-border bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary/40">
                {subcategoryOptions.length > 0 ? subcategoryOptions.map((s) => <option key={s} value={s}>{s}</option>) : <option value={editSubcategory}>{editSubcategory || "—"}</option>}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">{t("admin.cc.field_urgency")}</label>
              <select value={editUrgency} onChange={(e) => setEditUrgency(Number(e.target.value))} className="w-full h-7 px-2 rounded-sm border border-border bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary/40">
                <option value={1}>1 — {t("admin.cc.urgency_nice")}</option>
                <option value={2}>2 — {t("admin.cc.urgency_important")}</option>
                <option value={3}>3 — {t("admin.cc.urgency_critical")}</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">{t("admin.cc.field_region_code")}</label>
              <input type="text" value={editRegionCode} onChange={(e) => setEditRegionCode(e.target.value.toUpperCase())} maxLength={10} className="w-full h-7 px-2 rounded-sm border border-border bg-background text-xs font-mono uppercase focus:outline-none focus:ring-1 focus:ring-primary/40" />
            </div>
          </div>
          <div className="text-[10px] font-mono text-muted-foreground space-x-4">
            <span>ID: {record.id}</span>
            <span>{t("admin.cc.source_label")} {record.source_reference ?? `${record.source_book}:${record.source_page}`}</span>
            <span>{t("admin.cc.added_label")} {new Date(record.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex flex-wrap gap-2 items-center pt-1 border-t border-green-200/30">
            <Button size="sm" variant="outline" className="font-mono text-xs gap-1.5" disabled={!isDirty || saveState === "loading" || unverifyState === "loading" || deleteState === "loading"} onClick={handleSave} data-testid={`button-verified-save-${record.id}`}>
              {saveState === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}{t("admin.cc.save_correction")}
            </Button>
            {saveState === "done" && <span className="text-xs text-green-600 font-mono flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {t("admin.cc.saved_translations_updating")}</span>}
            {saveState === "error" && saveError && <span className="text-xs text-red-600 font-mono">{saveError}</span>}
            {!showUnverifyConfirm ? (
              <Button size="sm" variant="outline" className="font-mono text-xs gap-1.5 border-amber-400/60 text-amber-700 hover:bg-amber-50" disabled={isDirty || saveState === "loading" || unverifyState === "loading" || deleteState === "loading"} title={isDirty ? t("admin.cc.save_first_title") : t("admin.cc.back_to_queue")} onClick={() => setShowUnverifyConfirm(true)} data-testid={`button-verified-unverify-${record.id}`}>
                <RefreshCw className="w-3.5 h-3.5" />{t("admin.cc.back_to_queue")}
              </Button>
            ) : (
              <div className="flex gap-2 items-center">
                <Button size="sm" variant="outline" className="font-mono text-xs gap-1.5 border-amber-500 bg-amber-500 text-white hover:bg-amber-600" disabled={unverifyState === "loading"} onClick={async () => { setShowUnverifyConfirm(false); await handleUnverify(); }}>
                  {unverifyState === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}{t("admin.cc.confirm_back")}
                </Button>
                <Button size="sm" variant="outline" className="font-mono text-xs" onClick={() => setShowUnverifyConfirm(false)}>{t("admin.cc.cancel")}</Button>
              </div>
            )}
            {!showDeleteConfirm ? (
              <Button size="sm" variant="outline" className="font-mono text-xs gap-1.5 border-red-300/60 text-red-600/70 hover:bg-red-50 hover:text-red-700" disabled={saveState === "loading" || unverifyState === "loading" || deleteState === "loading"} onClick={() => setShowDeleteConfirm(true)} data-testid={`button-verified-delete-${record.id}`}>
                <Trash2 className="w-3.5 h-3.5" />{t("admin.cc.delete")}
              </Button>
            ) : (
              <div className="flex gap-2 items-center">
                <Button size="sm" variant="outline" className="font-mono text-xs gap-1.5 border-red-500 bg-red-600 text-white hover:bg-red-700" disabled={deleteState === "loading"} onClick={handleDelete}>
                  {deleteState === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}{t("admin.cc.confirm_delete")}
                </Button>
                <Button size="sm" variant="outline" className="font-mono text-xs" onClick={() => setShowDeleteConfirm(false)}>{t("admin.cc.cancel")}</Button>
              </div>
            )}
            {unverifyState === "error" && <span className="text-xs text-red-600 font-mono">{t("admin.cc.reset_error")}</span>}
            {deleteState === "error" && <span className="text-xs text-red-600 font-mono">{t("admin.cc.delete_error")}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function VerifiedPanel({ authHeaders }: { authHeaders: Record<string, string> }) {
  const { t } = useLanguage();
  const adminFetch = useAdminFetch();
  const [records, setRecords] = useState<VerifiedCCRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchVerified = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await adminFetch(`${API_BASE}/api/admin/cc-protocols/verified?page=${p}&limit=20`);
      if (res.ok) {
        const data = await res.json() as { records: VerifiedCCRecord[]; total: number; pages: number; page: number };
        setRecords(data.records); setTotal(data.total); setTotalPages(data.pages ?? 1); setPage(data.page ?? 1);
      }
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchVerified(1); }, [fetchVerified]);

  function handleLocalUpdate(updated: Partial<VerifiedCCRecord> & { id: number }) {
    setRecords((rows) => rows.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
  }
  function handleRemoved(id: number) {
    const next = records.filter((r) => r.id !== id); const newTotal = Math.max(0, total - 1);
    setRecords(next); setTotal(newTotal);
    if (next.length === 0 && newTotal > 0) fetchVerified(page > 1 ? page - 1 : 1);
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
            <BadgeCheck className="w-4 h-4 text-green-600" />{t("admin.cc.verified_title")}
            <span className="text-[10px] text-muted-foreground/60 font-mono normal-case tracking-normal">· {loading && total === 0 ? "…" : `${total} record${total === 1 ? "" : "s"}`}</span>
          </CardTitle>
          <Button variant="ghost" size="sm" className="font-mono text-xs gap-1.5 h-8 text-muted-foreground hover:text-foreground" onClick={() => fetchVerified(page)} disabled={loading} data-testid="button-verified-refresh" aria-label={t("admin.cc.refresh")}>
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}{t("admin.cc.refresh")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground font-light">{t("admin.cc.verified_desc")}</p>
        {loading && records.length === 0 ? (
          <div className="space-y-2">{[1,2,3].map((i) => <Skeleton key={i} className="h-14 rounded-sm" />)}</div>
        ) : records.length === 0 ? (
          <div className="py-8 text-center"><BadgeCheck className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" /><p className="text-sm text-muted-foreground font-light">{t("admin.cc.no_verified")}</p></div>
        ) : (
          <div className="space-y-2">
            {records.map((r) => <VerifiedRecordRow key={r.id} record={r} onChanged={handleLocalUpdate} onRemoved={handleRemoved} onUnverified={handleRemoved} />)}
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button size="sm" variant="outline" className="font-mono text-xs" disabled={page <= 1 || loading} onClick={() => fetchVerified(page - 1)}>{t("admin.cc.prev_page")}</Button>
            <span className="text-xs font-mono text-muted-foreground px-2">{page} / {totalPages}</span>
            <Button size="sm" variant="outline" className="font-mono text-xs" disabled={page >= totalPages || loading} onClick={() => fetchVerified(page + 1)}>{t("admin.cc.next_page")}</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CCProtocolsTab({ authHeaders }: { authHeaders: Record<string, string> }) {
  const { t } = useLanguage();
  const adminFetch = useAdminFetch();
  const [fragment, setFragment] = useState("");
  const [sourceBook, setSourceBook] = useState("DH");
  const [sourcePage, setSourcePage] = useState("");
  const [screenState, setScreenState] = useState<ActionState>("idle");
  const [screenError, setScreenError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [record, setRecord] = useState<CCRecord | null>(null);
  const [editedRecord, setEditedRecord] = useState<string>("");
  const [saveState, setSaveState] = useState<ActionState>("idle");
  const [savedId, setSavedId] = useState<number | null>(null);
  const [savedTranslations, setSavedTranslations] = useState<Record<string, string>>({});
  const [pendingRefreshKey, setPendingRefreshKey] = useState(0);

  async function handleScreen() {
    if (!fragment.trim() || !sourcePage.trim()) return;
    setScreenState("loading"); setScreenError(null); setWarnings([]); setRecord(null); setSavedId(null);
    try {
      const res = await adminFetch(`${API_BASE}/api/admin/cc-screen`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fragment: fragment.trim(), source_book: sourceBook, source_page: sourcePage.trim() }) });
      const data = await res.json() as { ok?: boolean; record?: CCRecord; warnings?: string[]; error?: string; message?: string };
      if (!res.ok || !data.ok) { setScreenError(data.message ?? data.error ?? t("admin.cc.processing")); setScreenState("error"); }
      else { setRecord(data.record!); setEditedRecord(JSON.stringify(data.record, null, 2)); setWarnings(data.warnings ?? []); setScreenState("done"); }
    } catch { setScreenError(t("admin.cc.connection_error")); setScreenState("error"); }
  }

  async function handleSave() {
    if (!editedRecord) return;
    setSaveState("loading");
    let parsed: CCRecord;
    try { parsed = JSON.parse(editedRecord) as CCRecord; }
    catch { setSaveState("error"); return; }
    try {
      const res = await adminFetch(`${API_BASE}/api/admin/cc-save`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed) });
      const data = await res.json() as { ok?: boolean; id?: number; error?: string; translations?: Record<string, string> };
      if (res.ok && data.ok) { setSavedId(data.id ?? null); setSavedTranslations(data.translations ?? {}); setSaveState("done"); setPendingRefreshKey((k) => k + 1); }
      else { setSaveState("error"); }
    } catch { setSaveState("error"); }
  }

  function reset() {
    setFragment(""); setSourcePage(""); setScreenState("idle"); setScreenError(null); setWarnings([]);
    setRecord(null); setEditedRecord(""); setSaveState("idle"); setSavedId(null); setSavedTranslations({});
  }

  return (
    <div className="space-y-6">
      <PendingReviewPanel authHeaders={authHeaders} refreshKey={pendingRefreshKey} />
      <VerifiedPanel authHeaders={authHeaders} />

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
            <Cpu className="w-4 h-4" />{t("admin.cc.screening_title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground font-light">{t("admin.cc.screening_desc")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-muted-foreground uppercase tracking-wide">{t("admin.cc.source_book_label")}</label>
              <select value={sourceBook} onChange={(e) => setSourceBook(e.target.value)} className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/40">
                {CC_BOOKS.map(b => <option key={b.code} value={b.code}>{b.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-muted-foreground uppercase tracking-wide">{t("admin.cc.page_number_label")}</label>
              <Input placeholder={t("admin.cc.page_number_placeholder")} value={sourcePage} onChange={(e) => setSourcePage(e.target.value)} className="font-mono rounded-sm" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wide">{t("admin.cc.text_fragment_label")}</label>
            <textarea value={fragment} onChange={(e) => setFragment(e.target.value)} placeholder={t("admin.cc.text_fragment_placeholder")} rows={6} className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm font-light leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-primary/40" />
            <p className="text-[11px] text-muted-foreground font-mono">{t("admin.cc.char_count", { n: fragment.length })}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleScreen} disabled={screenState === "loading" || !fragment.trim() || !sourcePage.trim()} className="font-serif rounded-sm">
              {screenState === "loading" ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{t("admin.cc.processing")}</> : <><Cpu className="w-4 h-4 mr-2" />{t("admin.cc.process_fragment")}</>}
            </Button>
            {(record || screenError) && <Button variant="outline" onClick={reset} className="font-mono text-xs rounded-sm">{t("admin.cc.new_fragment")}</Button>}
          </div>
          {screenState === "error" && screenError && (
            <div className="flex items-start gap-2 text-sm p-3 rounded-sm border bg-red-50 border-red-200 text-red-800">
              <XCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{screenError}</span>
            </div>
          )}
          {warnings.length > 0 && (
            <div className="space-y-1">
              {warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-xs p-2.5 rounded-sm border bg-amber-50 border-amber-200 text-amber-800">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" /><span>{w}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {record && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              {t("admin.cc.extracted_record")} — {PILLAR_LABELS[record.pillar] ?? record.pillar}
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full border border-amber-300 bg-amber-50 text-amber-700">verified: false</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div><span className="text-muted-foreground">{t("admin.cc.source_label")}</span><span className="ml-2 text-foreground">{record.source_book} · p. {record.source_page}</span></div>
              <div><span className="text-muted-foreground">{t("admin.cc.region_label")}</span><span className="ml-2 text-foreground">{record.region}</span></div>
              <div><span className="text-muted-foreground">{t("admin.cc.pillar_label")}</span><span className="ml-2 text-foreground">{record.pillar} · {record.subcategory}</span></div>
              <div><span className="text-muted-foreground">{t("admin.cc.urgency_label")}</span>
                <span className={`ml-2 font-bold ${record.urgency === 3 ? "text-red-600" : record.urgency === 2 ? "text-amber-600" : "text-green-600"}`}>
                  {record.urgency} {record.urgency === 3 ? `— ${t("admin.cc.urgency_critical")}` : record.urgency === 2 ? `— ${t("admin.cc.urgency_important")}` : `— ${t("admin.cc.urgency_nice")}`}
                </span>
              </div>
              <div><span className="text-muted-foreground">{t("admin.cc.personas_label")}</span><span className="ml-2 text-foreground">{record.personas.join(", ")}</span></div>
              <div><span className="text-muted-foreground">{t("admin.cc.modules_label")}</span><span className="ml-2 text-foreground">{record.modules.join(", ")}</span></div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wide">{t("admin.cc.rule_raw_label")}</p>
              <p className="text-sm font-light text-muted-foreground italic bg-muted/30 rounded-sm px-3 py-2">{record.rule_raw}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wide">{t("admin.cc.rule_cc_label")}</p>
              <p className="text-sm font-light leading-relaxed bg-muted/30 rounded-sm px-3 py-2">{record.rule_cc}</p>
            </div>
            {record._note && <p className="text-xs text-muted-foreground font-mono italic">{t("admin.cc.note_label")}: {record._note}</p>}
            <div className="space-y-1.5">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wide">{t("admin.cc.json_edit_label")}</p>
              <textarea value={editedRecord} onChange={(e) => setEditedRecord(e.target.value)} rows={18} className="w-full rounded-sm border border-border bg-muted/20 px-3 py-2 text-xs font-mono resize-y focus:outline-none focus:ring-1 focus:ring-primary/40" />
            </div>
            {saveState !== "done" ? (
              <div className="flex gap-2 items-center">
                <Button onClick={handleSave} disabled={saveState === "loading"} variant="outline" className="font-serif rounded-sm border-green-400/60 text-green-700 hover:bg-green-50">
                  {saveState === "loading" ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{t("admin.cc.save_loading")}</> : <><Save className="w-4 h-4 mr-2" />{t("admin.cc.save_to_db")}</>}
                </Button>
                {saveState === "error" && <span className="text-xs text-red-600 font-mono">{t("admin.cc.save_failed_json")}</span>}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm p-3 rounded-sm border bg-green-50 border-green-200 text-green-800">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /><span>{t("admin.cc.record_saved", { id: savedId ?? 0 })}</span>
                </div>
                {Object.keys(savedTranslations).length > 0 && (
                  <div className="border border-border rounded-sm p-3 space-y-2">
                    <p className="text-xs font-mono uppercase tracking-wide text-muted-foreground flex items-center gap-1.5"><span>🌐</span> {t("admin.cc.auto_translations")}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {Object.entries(savedTranslations).map(([lang, text]) => (
                        <div key={lang} className="text-xs bg-muted/30 rounded-sm px-2 py-1.5">
                          <span className="font-mono font-medium uppercase text-muted-foreground mr-2">{lang}</span><span className="font-light">{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {Object.keys(savedTranslations).length === 0 && <p className="text-xs text-muted-foreground font-mono">Vertaling niet beschikbaar (AI niet bereikbaar of fout opgetreden).</p>}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground/50 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" />{t("admin.cc.quality_checklist_title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-xs text-muted-foreground font-light space-y-1.5">
            {([
              t("admin.cc.quality_check_1"), t("admin.cc.quality_check_2"), t("admin.cc.quality_check_3"),
              t("admin.cc.quality_check_4"), t("admin.cc.quality_check_5"), t("admin.cc.quality_check_6"),
              t("admin.cc.quality_check_7"), t("admin.cc.quality_check_8"),
            ]).map((item, i) => (
              <li key={i} className="flex items-start gap-2"><CheckCircle2 className="w-3 h-3 mt-0.5 text-green-500 shrink-0" />{item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
