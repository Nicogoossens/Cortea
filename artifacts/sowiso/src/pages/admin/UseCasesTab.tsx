import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminFetch } from "@/lib/useAdminFetch";
import {
  Loader2, RefreshCw, Plus, Pencil, Trash2, Briefcase, Save, X, XCircle,
} from "lucide-react";
import type { UseCase, ActionState } from "./types";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const EMPTY_USE_CASE: Omit<UseCase, "id"> = {
  slug: "", title: "", region_code: "", flag_emoji: "🌍", formality_level: "formal",
  domain_tags: [], pillar_weights: {}, description: "", cover_context: "", primary_tool: "atelier",
};

type UseCaseFormData = Omit<UseCase, "id">;

function UseCaseForm({ initial, onSave, onCancel, saving, saveError }: {
  initial: UseCaseFormData; onSave: (data: UseCaseFormData) => void;
  onCancel: () => void; saving: boolean; saveError: string | null;
}) {
  const [form, setForm] = useState<UseCaseFormData>(initial);
  const [domainTagsInput, setDomainTagsInput] = useState(initial.domain_tags.join(", "));
  const [pillarWeightsInput, setPillarWeightsInput] = useState(
    Object.entries(initial.pillar_weights).map(([k, v]) => `${k}:${v}`).join(", ")
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setJsonError(null);
    const tags = domainTagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    const weights: Record<string, number> = {};
    const pwParts = pillarWeightsInput.split(",").map((p) => p.trim()).filter(Boolean);
    for (const part of pwParts) {
      const [k, v] = part.split(":").map((s) => s.trim());
      const num = parseFloat(v);
      if (!k || isNaN(num)) { setJsonError(`Invalid pillar_weights entry: "${part}". Expected format: "1:0.4, 2:0.3"`); return; }
      weights[k] = num;
    }
    onSave({ ...form, domain_tags: tags, pillar_weights: weights });
  }

  const field = (label: string, key: keyof UseCaseFormData, props?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="space-y-1">
      <label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">{label}</label>
      <Input value={String(form[key] ?? "")} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} className="rounded-sm font-mono text-sm" {...props} />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {field("Slug", "slug", { placeholder: "e.g. london-gala-dinner", pattern: "[a-z0-9_-]+" })}
        {field("Title", "title", { placeholder: "A London Gala Dinner" })}
        {field("Region Code", "region_code", { placeholder: "UK" })}
        {field("Flag Emoji", "flag_emoji", { placeholder: "🇬🇧" })}
        {field("Formality Level", "formality_level", { placeholder: "black_tie" })}
        {field("Primary Tool", "primary_tool", { placeholder: "atelier" })}
      </div>
      <div className="space-y-1">
        <label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">Domain Tags (comma-separated)</label>
        <Input value={domainTagsInput} onChange={(e) => setDomainTagsInput(e.target.value)} placeholder="gastronomy, business, formal_events" className="rounded-sm font-mono text-sm" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">Pillar Weights (key:value, comma-separated)</label>
        <Input value={pillarWeightsInput} onChange={(e) => setPillarWeightsInput(e.target.value)} placeholder="1:0.4, 2:0.3, 3:0.2, 4:0.1" className="rounded-sm font-mono text-sm" />
        <p className="text-[11px] text-muted-foreground font-mono">Pillar numbers 1–5, weights summing to 1.0 recommended</p>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">Description</label>
        <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} placeholder="A brief description shown to users…" className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm font-light resize-y focus:outline-none focus:ring-1 focus:ring-primary/40" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">Cover Context</label>
        <textarea value={form.cover_context} onChange={(e) => setForm((f) => ({ ...f, cover_context: e.target.value }))} rows={2} placeholder="Context displayed on the cover card…" className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm font-light resize-y focus:outline-none focus:ring-1 focus:ring-primary/40" />
      </div>
      {jsonError && <p className="text-xs text-destructive font-mono flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5 shrink-0" />{jsonError}</p>}
      {saveError && <p className="text-xs text-destructive font-mono flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5 shrink-0" />{saveError}</p>}
      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={saving} className="font-serif rounded-sm gap-1.5">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save Use Case"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="font-mono text-xs rounded-sm gap-1.5" disabled={saving}>
          <X className="w-3.5 h-3.5" />Cancel
        </Button>
      </div>
    </form>
  );
}

export function UseCasesTab() {
  const adminFetch = useAdminFetch();
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editingUseCase, setEditingUseCase] = useState<UseCase | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchUseCases = useCallback(async () => {
    setLoading(true); setLoadError(null);
    try {
      const res = await adminFetch(`${API_BASE}/api/admin/use-cases`);
      if (res.ok) setUseCases(await res.json() as UseCase[]);
      else setLoadError("Could not load use cases.");
    } catch { setLoadError("Network error loading use cases."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUseCases(); }, [fetchUseCases]);

  async function handleCreate(data: UseCaseFormData) {
    setSaving(true); setSaveError(null);
    try {
      const res = await adminFetch(`${API_BASE}/api/admin/use-cases`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      const json = await res.json() as UseCase & { error?: string };
      if (res.ok) { setUseCases((prev) => [...prev, json]); setMode("list"); }
      else setSaveError(json.error ?? "Failed to create use case.");
    } catch { setSaveError("Network error."); }
    finally { setSaving(false); }
  }

  async function handleEdit(data: UseCaseFormData) {
    if (!editingUseCase) return;
    setSaving(true); setSaveError(null);
    try {
      const res = await adminFetch(`${API_BASE}/api/admin/use-cases/${editingUseCase.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      const json = await res.json() as UseCase & { error?: string };
      if (res.ok) { setUseCases((prev) => prev.map((uc) => uc.id === editingUseCase.id ? json : uc)); setMode("list"); setEditingUseCase(null); }
      else setSaveError(json.error ?? "Failed to update use case.");
    } catch { setSaveError("Network error."); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    setDeleting(true); setDeleteError(null);
    try {
      const res = await adminFetch(`${API_BASE}/api/admin/use-cases/${id}`, { method: "DELETE" });
      if (res.ok) { setUseCases((prev) => prev.filter((uc) => uc.id !== id)); setDeleteId(null); }
      else { const json = await res.json() as { error?: string }; setDeleteError(json.error ?? "Failed to delete."); setTimeout(() => setDeleteError(null), 3000); }
    } catch { setDeleteError("Network error."); setTimeout(() => setDeleteError(null), 3000); }
    finally { setDeleting(false); }
  }

  if (mode === "create") {
    return (
      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2"><Plus className="w-4 h-4" />New Use Case</CardTitle></CardHeader>
        <CardContent>
          <UseCaseForm initial={EMPTY_USE_CASE} onSave={handleCreate} onCancel={() => { setMode("list"); setSaveError(null); }} saving={saving} saveError={saveError} />
        </CardContent>
      </Card>
    );
  }

  if (mode === "edit" && editingUseCase) {
    const { id: _id, ...rest } = editingUseCase;
    return (
      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2"><Pencil className="w-4 h-4" />Edit Use Case — <span className="text-foreground/60 font-mono">{editingUseCase.slug}</span></CardTitle></CardHeader>
        <CardContent>
          <UseCaseForm initial={rest} onSave={handleEdit} onCancel={() => { setMode("list"); setEditingUseCase(null); setSaveError(null); }} saving={saving} saveError={saveError} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{loading ? "Loading…" : `${useCases.length} use case${useCases.length !== 1 ? "s" : ""}`}</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="font-mono text-xs gap-1.5" onClick={fetchUseCases} disabled={loading}>
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}Refresh
          </Button>
          <Button size="sm" className="font-mono text-xs gap-1.5" onClick={() => { setMode("create"); setSaveError(null); }}>
            <Plus className="w-3.5 h-3.5" />New Use Case
          </Button>
        </div>
      </div>
      {loadError && <div className="flex items-center gap-2 p-3 rounded-sm border border-red-200 bg-red-50 text-sm text-red-800"><XCircle className="w-4 h-4 shrink-0" />{loadError}</div>}
      {loading && useCases.length === 0 ? (
        <div className="space-y-2">{[1,2,3].map((i) => <Skeleton key={i} className="h-16 rounded-sm" />)}</div>
      ) : useCases.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <Briefcase className="w-8 h-8 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-light text-sm">No use cases yet. Create the first one.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {useCases.map((uc) => (
            <div key={uc.id} className="border border-border/60 rounded-sm bg-card overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                <div className="text-2xl shrink-0 w-10 text-center">{uc.flag_emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{uc.title}</span>
                    <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase tracking-widest bg-muted text-muted-foreground">{uc.region_code}</span>
                    <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-200/60">{uc.formality_level}</span>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">{uc.slug}</div>
                  {uc.domain_tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-1.5">
                      {uc.domain_tags.map((tag) => (
                        <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-primary/5 text-primary/70 border border-primary/10">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="font-mono text-xs gap-1.5 h-8" onClick={() => { setEditingUseCase(uc); setMode("edit"); setSaveError(null); }}>
                    <Pencil className="w-3.5 h-3.5" />Edit
                  </Button>
                  {deleteId === uc.id ? (
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" variant="outline" className="font-mono text-xs gap-1 h-8 border-red-500 bg-red-600 text-white hover:bg-red-700" disabled={deleting} onClick={() => handleDelete(uc.id)}>
                        {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}Confirm
                      </Button>
                      <Button size="sm" variant="outline" className="font-mono text-xs h-8" onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" className="font-mono text-xs gap-1.5 h-8 border-red-300/60 text-red-600/70 hover:bg-red-50 hover:text-red-700" onClick={() => { setDeleteId(uc.id); setDeleteError(null); }}>
                      <Trash2 className="w-3.5 h-3.5" />Delete
                    </Button>
                  )}
                </div>
              </div>
              {uc.description && (
                <div className="px-4 pb-3 border-t border-border/30 pt-2">
                  <p className="text-xs text-muted-foreground font-light leading-relaxed line-clamp-2">{uc.description}</p>
                </div>
              )}
              {deleteError && deleteId === uc.id && <div className="px-4 pb-3"><p className="text-xs text-destructive font-mono">{deleteError}</p></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
