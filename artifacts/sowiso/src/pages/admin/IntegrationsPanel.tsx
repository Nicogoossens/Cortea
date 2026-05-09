import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAdminFetch } from "@/lib/useAdminFetch";
import { useLanguage } from "@/lib/i18n";
import {
  Loader2, RefreshCw, Plus, CheckCircle2, XCircle, AlertTriangle, Check, Copy, BarChart3,
} from "lucide-react";
import type { ActionState } from "./types";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {});
  }
  return (
    <button type="button" onClick={handleCopy} className="ml-2 inline-flex items-center gap-1 text-xs font-mono text-muted-foreground/60 hover:text-primary transition-colors" title="Copy to clipboard">
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

interface StripeTierProduct {
  tier: "guest" | "student" | "traveller" | "ambassador" | "founding";
  productId: string; displayName: string;
  monthlyPriceId: string | null; monthlyAmount: number | null;
  yearlyPriceId: string | null; yearlyAmount: number | null; currency: string;
}
interface StripeStatus { configured: boolean; reachable: boolean; products: StripeTierProduct[]; error?: string }

function formatPrice(cents: number | null, currency: string): string {
  if (cents == null) return "—";
  const symbol = currency.toLowerCase() === "eur" ? "€" : currency.toUpperCase() + " ";
  return `${symbol}${(cents / 100).toFixed(2)}`;
}

function GtmIntegrationCard() {
  const { t } = useLanguage();
  const gtmId = (import.meta.env.VITE_GTM_ID as string | undefined)?.trim();
  const isPlaceholder = !gtmId || gtmId === "%VITE_GTM_ID%" || gtmId.toLowerCase() === "undefined";
  const looksValid = !!gtmId && /^GTM-[A-Z0-9]+$/i.test(gtmId);
  const status: "configured" | "invalid" | "not_configured" = isPlaceholder ? "not_configured" : looksValid ? "configured" : "invalid";

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 shrink-0" />
          Google Tag Manager
          <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-mono ${status === "configured" ? "border border-green-300 bg-green-50 text-green-700" : status === "invalid" ? "border border-red-300 bg-red-50 text-red-700" : "border border-amber-300 bg-amber-50 text-amber-700"}`}>
            {status === "configured" ? t("admin.settings.status_configured") : status === "invalid" ? t("admin.settings.gtm_invalid_id") : t("admin.settings.status_not_configured")}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {status === "configured" ? (
          <div className="flex items-start gap-3 p-4 border border-green-200 bg-green-50/60 rounded-sm">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div className="flex-1"><p className="text-sm font-medium text-green-800">{t("admin.settings.gtm_active")}</p><p className="text-xs text-green-700/80 mt-1 font-light">{t("admin.settings.gtm_active_desc", { id: gtmId ?? "" })}</p></div>
          </div>
        ) : status === "invalid" ? (
          <div className="flex items-start gap-3 p-4 border border-red-200 bg-red-50/60 rounded-sm">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div><p className="text-sm font-medium text-red-800">{t("admin.settings.gtm_invalid")}</p><p className="text-xs text-red-700/80 mt-1 font-light">{t("admin.settings.gtm_invalid_desc", { id: gtmId ?? "" })}</p></div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-4 border border-amber-200 bg-amber-50/60 rounded-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div><p className="text-sm font-medium text-amber-800">{t("admin.settings.config_required")}</p><p className="text-xs text-amber-700/80 mt-1 font-light">{t("admin.settings.gtm_config_desc")}</p></div>
          </div>
        )}
        <div className="space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground/70">{t("admin.settings.setup_instructions")}</h3>
          <ol className="space-y-3 text-sm text-muted-foreground font-light list-none">
            <li className="flex gap-3"><span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-mono flex items-center justify-center">1</span><span>{t("admin.settings.gtm_step1_pre")} <a href="https://tagmanager.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">tagmanager.google.com</a> {t("admin.settings.gtm_step1_post")}</span></li>
            <li className="flex gap-3"><span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-mono flex items-center justify-center">2</span><span>{t("admin.settings.gtm_step2")}</span></li>
            <li className="flex gap-3">
              <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-mono flex items-center justify-center">3</span>
              <div className="space-y-1 flex-1">
                <span>{t("admin.settings.gtm_step3_pre")}</span>
                <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground/90 list-disc list-inside">
                  <li>{t("admin.settings.gtm_step3_name")}: <code className="font-mono">sowiso-01.replit.app</code></li>
                  <li>{t("admin.settings.gtm_step3_platform")}: <strong className="text-foreground">Web</strong></li>
                </ul>
              </div>
            </li>
            <li className="flex gap-3"><span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-mono flex items-center justify-center">4</span><span>{t("admin.settings.gtm_step4")} <strong className="text-foreground">Container ID</strong> <code className="font-mono">GTM-XXXXXXX</code>.</span></li>
            <li className="flex gap-3">
              <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-mono flex items-center justify-center">5</span>
              <div className="space-y-1 flex-1">
                <span>{t("admin.settings.gtm_step5")}</span>
                <div className="mt-2 flex items-center gap-2 bg-muted/40 border border-border/50 rounded-sm px-3 py-1.5"><code className="text-xs font-mono text-foreground/80 flex-1">VITE_GTM_ID</code><span className="text-[10px] text-muted-foreground/60">= GTM-XXXXXXX</span></div>
                <p className="text-[11px] text-muted-foreground/70 mt-1">{t("admin.settings.gtm_step5_desc")}</p>
              </div>
            </li>
            <li className="flex gap-3"><span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-mono flex items-center justify-center">6</span><span>{t("admin.settings.gtm_step6")}</span></li>
          </ol>
        </div>
        <div className="border-t border-border/40 pt-4">
          <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground/70 mb-3">{t("admin.settings.technical_details")}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground font-light">
            <div><span className="font-medium text-foreground/70 block mb-0.5">Snippet location</span><code className="font-mono text-[11px]">artifacts/sowiso/index.html</code></div>
            <div><span className="font-medium text-foreground/70 block mb-0.5">Env variable</span><code className="font-mono text-[11px]">VITE_GTM_ID</code></div>
            <div><span className="font-medium text-foreground/70 block mb-0.5">{t("admin.settings.gtm_current_value")}</span><code className="font-mono text-[11px]">{isPlaceholder ? t("admin.settings.gtm_not_set") : gtmId}</code></div>
            <div><span className="font-medium text-foreground/70 block mb-0.5">{t("admin.settings.gtm_expected_format")}</span><code className="font-mono text-[11px]">GTM-XXXXXXX</code></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function IntegrationsPanel() {
  const { t } = useLanguage();
  const adminFetch = useAdminFetch();
  const [googleStatus, setGoogleStatus] = useState<"checking" | "configured" | "not_configured">("checking");
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [stripeLoading, setStripeLoading] = useState(true);
  const [seedingStudent, setSeedingStudent] = useState<ActionState>("idle");
  const [seedError, setSeedError] = useState<string | null>(null);

  const refreshStripe = useCallback(async () => {
    setStripeLoading(true);
    try {
      const res = await adminFetch(`${API_BASE}/api/admin/stripe/status`);
      if (res.ok) setStripeStatus(await res.json() as StripeStatus);
      else setStripeStatus({ configured: false, reachable: false, products: [] });
    } catch { setStripeStatus({ configured: false, reachable: false, products: [] }); }
    finally { setStripeLoading(false); }
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/auth/google/status`)
      .then((r) => r.json())
      .then((d: { configured: boolean }) => setGoogleStatus(d.configured ? "configured" : "not_configured"))
      .catch(() => setGoogleStatus("not_configured"));
    void refreshStripe();
  }, [refreshStripe]);

  const studentProduct = stripeStatus?.products.find((p) => p.tier === "student");
  const studentReady = !!studentProduct && !!studentProduct.monthlyPriceId && !!studentProduct.yearlyPriceId;

  const seedStudent = async () => {
    setSeedingStudent("loading"); setSeedError(null);
    try {
      const res = await adminFetch(`${API_BASE}/api/admin/stripe/seed/student`, { method: "POST" });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) { setSeedError(data.error ?? "Het Student-product kon niet worden aangemaakt."); setSeedingStudent("error"); return; }
      setSeedingStudent("done"); await refreshStripe();
    } catch (err) { setSeedError(err instanceof Error ? err.message : t("admin.settings.unknown_error")); setSeedingStudent("error"); }
  };

  const redirectUri = "https://sowiso-01.replit.app/api/auth/google/callback";
  const devRedirectUri = typeof window !== "undefined" ? `${window.location.origin}/api/auth/google/callback` : redirectUri;

  return (
    <div className="space-y-6">
      {/* Google OAuth */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true" className="shrink-0">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Google OAuth
            <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-mono ${googleStatus === "configured" ? "border border-green-300 bg-green-50 text-green-700" : googleStatus === "checking" ? "border border-border bg-muted/30 text-muted-foreground" : "border border-amber-300 bg-amber-50 text-amber-700"}`}>
              {googleStatus === "configured" ? t("admin.settings.status_configured") : googleStatus === "checking" ? t("admin.settings.status_checking") : t("admin.settings.status_not_configured")}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {googleStatus === "configured" ? (
            <div className="flex items-start gap-3 p-4 border border-green-200 bg-green-50/60 rounded-sm">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div><p className="text-sm font-medium text-green-800">{t("admin.settings.google_active")}</p><p className="text-xs text-green-700/80 mt-1 font-light">{t("admin.settings.google_active_desc")}</p></div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 border border-amber-200 bg-amber-50/60 rounded-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div><p className="text-sm font-medium text-amber-800">{t("admin.settings.config_required")}</p><p className="text-xs text-amber-700/80 mt-1 font-light">{t("admin.settings.google_config_desc")}</p></div>
            </div>
          )}
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground/70">{t("admin.settings.setup_instructions")}</h3>
            <ol className="space-y-3 text-sm text-muted-foreground font-light list-none">
              <li className="flex gap-3"><span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-mono flex items-center justify-center">1</span><span>{t("admin.settings.google_step1_pre")} <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">Google Cloud Console → Credentials</a> {t("admin.settings.google_step1_post")}</span></li>
              <li className="flex gap-3"><span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-mono flex items-center justify-center">2</span><span>{t("admin.settings.google_step2")} <strong className="text-foreground">Web application</strong>.</span></li>
              <li className="flex gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-mono flex items-center justify-center">3</span>
                <div className="space-y-2 flex-1">
                  <span>{t("admin.settings.google_step3")} <strong className="text-foreground">Authorized Redirect URIs</strong>:</span>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2 bg-muted/40 border border-border/50 rounded-sm px-3 py-2"><code className="text-xs font-mono text-foreground/80 break-all flex-1">{redirectUri}</code><CopyButton text={redirectUri} /></div>
                    {devRedirectUri !== redirectUri && (
                      <div className="flex items-center gap-2 bg-muted/40 border border-border/50 rounded-sm px-3 py-2"><code className="text-xs font-mono text-foreground/80 break-all flex-1">{devRedirectUri}</code><CopyButton text={devRedirectUri} /><span className="text-[10px] font-mono text-amber-600 border border-amber-300/60 rounded px-1">dev</span></div>
                    )}
                  </div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-mono flex items-center justify-center">4</span>
                <div className="space-y-1 flex-1">
                  <span>{t("admin.settings.google_step4")}</span>
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center gap-2 bg-muted/40 border border-border/50 rounded-sm px-3 py-1.5"><code className="text-xs font-mono text-foreground/80 flex-1">GOOGLE_CLIENT_ID</code><span className="text-[10px] text-muted-foreground/60">= your Client ID</span></div>
                    <div className="flex items-center gap-2 bg-muted/40 border border-border/50 rounded-sm px-3 py-1.5"><code className="text-xs font-mono text-foreground/80 flex-1">GOOGLE_CLIENT_SECRET</code><span className="text-[10px] text-muted-foreground/60">= your Client Secret</span></div>
                  </div>
                </div>
              </li>
              <li className="flex gap-3"><span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-mono flex items-center justify-center">5</span><span>{t("admin.settings.google_step5")}</span></li>
            </ol>
          </div>
          <div className="border-t border-border/40 pt-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground/70 mb-3">{t("admin.settings.technical_details")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground font-light">
              <div><span className="font-medium text-foreground/70 block mb-0.5">Issuer</span><code className="font-mono text-[11px]">https://accounts.google.com</code></div>
              <div><span className="font-medium text-foreground/70 block mb-0.5">Scope</span><code className="font-mono text-[11px]">openid email profile</code></div>
              <div><span className="font-medium text-foreground/70 block mb-0.5">PKCE</span><code className="font-mono text-[11px]">S256 (required)</code></div>
              <div><span className="font-medium text-foreground/70 block mb-0.5">Callback endpoint</span><code className="font-mono text-[11px]">/api/auth/google/callback</code></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stripe */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
              <path d="M16 0C7.16 0 0 7.16 0 16s7.16 16 16 16 16-7.16 16-16S24.84 0 16 0zm6.43 21.18c-.48 1.27-1.34 2.27-2.46 2.86-.86.45-1.86.7-2.93.7-1.51 0-2.92-.34-4.04-.83v-3.34c.96.5 2.36 1 3.79 1 .96 0 1.66-.36 1.66-1.06 0-1.6-5.6-.96-5.6-5.4 0-2.36 1.66-4.16 4.7-4.16 1.43 0 2.66.27 3.46.55v3.32c-.86-.43-2-.86-3.16-.86-.86 0-1.5.27-1.5.83 0 1.5 5.7.84 5.7 5.4 0 .39-.04.7-.12 1z" fill="#635bff"/>
            </svg>
            Stripe billing
            <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-mono ${stripeLoading ? "border border-border bg-muted/30 text-muted-foreground" : studentReady ? "border border-green-300 bg-green-50 text-green-700" : stripeStatus?.configured ? "border border-amber-300 bg-amber-50 text-amber-700" : "border border-amber-300 bg-amber-50 text-amber-700"}`}>
              {stripeLoading ? t("admin.settings.status_checking") : studentReady ? t("admin.settings.stripe_student_active") : stripeStatus?.configured ? t("admin.settings.stripe_key_ok") : t("admin.settings.status_not_configured")}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!stripeLoading && !stripeStatus?.configured && (
            <div className="flex items-start gap-3 p-4 border border-amber-200 bg-amber-50/60 rounded-sm"><AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" /><div><p className="text-sm font-medium text-amber-800">{t("admin.settings.stripe_inactive")}</p><p className="text-xs text-amber-700/80 mt-1 font-light">{t("admin.settings.stripe_inactive_desc", { key: "STRIPE_SECRET_KEY" })}</p></div></div>
          )}
          {!stripeLoading && stripeStatus?.configured && !stripeStatus.reachable && (
            <div className="flex items-start gap-3 p-4 border border-red-200 bg-red-50/60 rounded-sm"><XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" /><div><p className="text-sm font-medium text-red-800">{t("admin.settings.stripe_unreachable")}</p><p className="text-xs text-red-700/80 mt-1 font-light">{stripeStatus.error ?? t("admin.settings.stripe_unreachable_desc")}</p></div></div>
          )}
          {!stripeLoading && stripeStatus?.configured && stripeStatus.reachable && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 border border-green-200 bg-green-50/60 rounded-sm">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div className="flex-1"><p className="text-sm font-medium text-green-800">{t("admin.settings.stripe_key_active")}</p><p className="text-xs text-green-700/80 mt-1 font-light">{studentReady ? t("admin.settings.stripe_student_ready") : t("admin.settings.stripe_create_product")}</p></div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground/70">{t("admin.settings.stripe_tier_products")}</h3>
                {stripeStatus.products.length === 0 && <p className="text-xs text-muted-foreground font-light">{t("admin.settings.stripe_no_products")}</p>}
                {stripeStatus.products.map((p) => (
                  <div key={p.productId} className="border border-border/50 rounded-sm p-3 bg-muted/20">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2"><span className="text-sm font-medium text-foreground">{p.displayName}</span><span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border bg-background text-muted-foreground">{p.tier}</span></div>
                      <code className="text-[10px] font-mono text-muted-foreground/70">{p.productId}</code>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                      <div><span className="text-muted-foreground/70 block">{t("admin.settings.monthly")}</span><span className="font-mono text-foreground/80">{formatPrice(p.monthlyAmount, p.currency)}</span>{p.monthlyPriceId && <code className="block text-[10px] font-mono text-muted-foreground/60 mt-0.5">{p.monthlyPriceId}</code>}</div>
                      <div><span className="text-muted-foreground/70 block">{t("admin.settings.yearly")}</span><span className="font-mono text-foreground/80">{formatPrice(p.yearlyAmount, p.currency)}</span>{p.yearlyPriceId && <code className="block text-[10px] font-mono text-muted-foreground/60 mt-0.5">{p.yearlyPriceId}</code>}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button size="sm" variant={studentReady ? "outline" : "default"} disabled={seedingStudent === "loading"} onClick={seedStudent}>
                  {seedingStudent === "loading" ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> {t("admin.settings.working")}</> : studentReady ? <><RefreshCw className="w-3.5 h-3.5 mr-1.5" /> {t("admin.settings.stripe_verify_prices")}</> : <><Plus className="w-3.5 h-3.5 mr-1.5" /> {t("admin.settings.stripe_create_student")}</>}
                </Button>
                {seedingStudent === "done" && <span className="text-xs text-green-700 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {t("admin.settings.updated")}</span>}
                {seedingStudent === "error" && seedError && <span className="text-xs text-red-700">{seedError}</span>}
              </div>
            </div>
          )}
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground/70">{t("admin.settings.setup_instructions")}</h3>
            <ol className="space-y-3 text-sm text-muted-foreground font-light list-none">
              <li className="flex gap-3"><span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-mono flex items-center justify-center">1</span><span>{t("admin.settings.stripe_step1_pre")} <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">Stripe Dashboard → Developers → API keys</a> {t("admin.settings.stripe_step1_post")}</span></li>
              <li className="flex gap-3"><span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-mono flex items-center justify-center">2</span><div className="space-y-1 flex-1"><span>{t("admin.settings.stripe_step2")}</span><div className="mt-2 flex items-center gap-2 bg-muted/40 border border-border/50 rounded-sm px-3 py-1.5"><code className="text-xs font-mono text-foreground/80 flex-1">STRIPE_SECRET_KEY</code><span className="text-[10px] text-muted-foreground/60">= sk_…</span></div></div></li>
              <li className="flex gap-3"><span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-mono flex items-center justify-center">3</span><span>{t("admin.settings.stripe_step3")}</span></li>
              <li className="flex gap-3"><span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-mono flex items-center justify-center">4</span><span>{t("admin.settings.stripe_step4")}<code className="block mt-1 font-mono text-[11px] bg-muted/40 border border-border/50 rounded-sm px-2 py-1">pnpm --filter @workspace/api-server tsx src/scripts/seed-stripe-student.ts</code></span></li>
            </ol>
          </div>
          <div className="border-t border-border/40 pt-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground/70 mb-3">{t("admin.settings.technical_details")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground font-light">
              <div><span className="font-medium text-foreground/70 block mb-0.5">Product metadata</span><code className="font-mono text-[11px]">tier = student | traveller | ambassador</code></div>
              <div><span className="font-medium text-foreground/70 block mb-0.5">Webhook endpoint</span><code className="font-mono text-[11px]">/api/stripe/webhook</code></div>
              <div><span className="font-medium text-foreground/70 block mb-0.5">{t("admin.settings.stripe_monthly_label")}</span><code className="font-mono text-[11px]">€4.99 EUR · interval=month</code></div>
              <div><span className="font-medium text-foreground/70 block mb-0.5">{t("admin.settings.stripe_yearly_label")}</span><code className="font-mono text-[11px]">€39.00 EUR · interval=year</code></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <GtmIntegrationCard />
    </div>
  );
}
