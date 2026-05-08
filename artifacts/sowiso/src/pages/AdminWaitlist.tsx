import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Download, Mail, Loader2, Check, Copy, ExternalLink } from "lucide-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Signup {
  id: number;
  email: string;
  name: string;
  segment: string;
  founder_code: string | null;
  founder_position: number | null;
  activation_link: string | null;
  created_at: string;
  invited_at: string | null;
  claimed_at: string | null;
}

interface WaitlistData {
  signups: Signup[];
  totalsBySegment: { segment: string; count: number }[];
  founderClaimed: number;
  founderTotal: number;
}

const SEGMENTS = ["business", "expat", "student", "elite", "other"] as const;

export default function AdminWaitlist() {
  const { t } = useLanguage();
  const { isAdmin, getAuthHeaders } = useAuth();
  const [data, setData] = useState<WaitlistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [inviting, setInviting] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  const handleCopyLink = (id: number, link: string) => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    const url = filter
      ? `${API_BASE}/api/admin/waitlist?segment=${filter}`
      : `${API_BASE}/api/admin/waitlist`;
    fetch(url, { headers: getAuthHeaders(), credentials: "include" })
      .then((r) => r.json())
      .then((d: WaitlistData) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [isAdmin, filter, getAuthHeaders]);

  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto p-12">
        <h1 className="font-serif text-2xl">Administrator access required.</h1>
      </div>
    );
  }

  const handleExport = () => {
    window.open(`${API_BASE}/api/admin/waitlist/export.csv`, "_blank");
  };

  const handleInvite = async (id: number) => {
    setInviting(id);
    try {
      const res = await fetch(`${API_BASE}/api/admin/waitlist/${id}/invite`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (res.ok && data) {
        setData({
          ...data,
          signups: data.signups.map((s) =>
            s.id === id ? { ...s, invited_at: new Date().toISOString() } : s,
          ),
        });
      }
    } finally {
      setInviting(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="gap-2"><ArrowLeft className="h-4 w-4" /> Admin</Button>
        </Link>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Cortéa Admin</p>
        <h1 className="font-serif text-3xl md:text-4xl text-foreground">{t("admin.waitlist_title")}</h1>
        <p className="text-muted-foreground font-light">{t("admin.waitlist_subtitle")}</p>
      </div>

      {loading || !data ? (
        <Skeleton className="h-32 rounded-sm" />
      ) : (
        <>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Founding 100</span>
              <span className="font-serif"><span className="text-2xl text-primary">{data.founderClaimed}</span> <span className="text-sm text-muted-foreground">/ {data.founderTotal}</span></span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {SEGMENTS.map((seg) => {
                const total = data.totalsBySegment.find((t) => t.segment === seg)?.count ?? 0;
                return (
                  <div key={seg} className="text-center px-3 py-3 border border-border rounded-sm">
                    <div className="font-serif text-xl text-foreground">{total}</div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-1">{seg}</div>
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setFilter("")}
                className={`px-3 py-1.5 text-xs font-mono uppercase tracking-widest border rounded-sm transition-colors ${filter === "" ? "border-primary text-primary bg-primary/5" : "border-border text-muted-foreground hover:text-foreground"}`}
              >
                {t("admin.waitlist_filter_all")}
              </button>
              {SEGMENTS.map((seg) => (
                <button
                  key={seg}
                  onClick={() => setFilter(seg)}
                  className={`px-3 py-1.5 text-xs font-mono uppercase tracking-widest border rounded-sm transition-colors ${filter === seg ? "border-primary text-primary bg-primary/5" : "border-border text-muted-foreground hover:text-foreground"}`}
                >
                  {seg}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
              <Download className="h-4 w-4" /> {t("admin.waitlist_export")}
            </Button>
          </div>

          {data.signups.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground font-light">{t("admin.waitlist_empty")}</Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-3">#</th>
                      <th className="text-left px-4 py-3">Name / Email</th>
                      <th className="text-left px-4 py-3">Segment</th>
                      <th className="text-left px-4 py-3">Founder code</th>
                      <th className="text-left px-4 py-3">Activation link</th>
                      <th className="text-left px-4 py-3">Joined</th>
                      <th className="text-right px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.signups.map((s) => (
                      <tr key={s.id} className="border-t border-border hover:bg-muted/20">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.founder_position ?? "—"}</td>
                        <td className="px-4 py-3">
                          <div className="font-serif text-foreground">{s.name}</div>
                          <div className="text-xs text-muted-foreground">{s.email}</div>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">{s.segment}</td>
                        <td className="px-4 py-3 font-mono text-xs">{s.founder_code ?? <span className="text-muted-foreground/50">—</span>}</td>
                        <td className="px-4 py-3 min-w-[320px]">
                          {s.activation_link ? (
                            <div className="flex flex-col gap-1.5">
                              <code className="block font-mono text-xs text-foreground bg-muted/40 border border-border rounded-sm px-2 py-1.5 break-all whitespace-pre-wrap select-all">
                                {s.activation_link}
                              </code>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  onClick={() => handleCopyLink(s.id, s.activation_link!)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
                                  title="Kopieer productie-link"
                                >
                                  {copied === s.id ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                                  {copied === s.id ? "Gekopieerd" : "Kopieer link"}
                                </button>
                                <a
                                  href={(() => {
                                    try {
                                      const u = new URL(s.activation_link!);
                                      u.host = window.location.host;
                                      u.protocol = window.location.protocol;
                                      return u.toString();
                                    } catch {
                                      return s.activation_link!;
                                    }
                                  })()}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono rounded-sm border border-primary/40 text-primary/80 hover:text-primary hover:border-primary transition-colors"
                                  title="Activeer in huidige omgeving (dev/preview)"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Activeer hier
                                </a>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/50 text-xs">Geen code</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right">
                          {s.invited_at ? (
                            <span className="inline-flex items-center gap-1 text-xs text-primary"><Check className="h-3 w-3" /> {t("admin.waitlist_invited")}</span>
                          ) : (
                            <Button size="sm" variant="ghost" className="gap-1.5" disabled={inviting === s.id} onClick={() => handleInvite(s.id)}>
                              {inviting === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
                              {t("admin.waitlist_invite")}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
