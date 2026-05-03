import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users2, Copy, Check, Mail, Linkedin, MessageCircle } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface ReferralData {
  code: string;
  link: string;
  successfulCount: number;
  activeRewards: number;
  cap: number;
}

export function ReferralCard() {
  const { t } = useLanguage();
  const { getAuthHeaders, isAuthenticated } = useAuth();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/api/referrals/me`, { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ReferralData | null) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const copyLink = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  if (loading) {
    return <Skeleton className="h-48 rounded-sm" />;
  }
  if (!data) return null;

  const subject = encodeURIComponent(t("referral.share_email_subject", "An invitation to Cortéa"));
  const message = encodeURIComponent(
    t("referral.share_message", "I think you'd appreciate Cortéa — the art of cultural conduct. Use my link to begin: ") + data.link
  );

  return (
    <Card id="referrals" className="border-border/40 bg-card shadow-sm scroll-mt-20">
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-lg flex items-center gap-2 text-foreground">
          <Users2 className="w-4 h-4 text-primary/80" aria-hidden="true" />
          {t("referral.title", "Your invitations")}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground font-light">
          {t(
            "referral.description",
            "Share Cortéa with three companions. Each successful referral gives both of you one month at the next tier."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="space-y-1 p-3 rounded-sm border border-border/40 bg-muted/20">
            <div className="text-2xl font-serif text-foreground">{data.successfulCount}</div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              {t("referral.stat_successful", "Successful")}
            </div>
          </div>
          <div className="space-y-1 p-3 rounded-sm border border-border/40 bg-muted/20">
            <div className="text-2xl font-serif text-foreground">{data.activeRewards}</div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              {t("referral.stat_active", "Rewards active")}
            </div>
          </div>
          <div className="space-y-1 p-3 rounded-sm border border-border/40 bg-muted/20">
            <div className="text-2xl font-serif text-foreground">
              {Math.max(0, data.cap - data.successfulCount)}
            </div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              {t("referral.stat_remaining", "Remaining")}
            </div>
          </div>
        </div>

        {/* Link */}
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            {t("referral.your_link", "Your personal link")}
          </label>
          <div className="flex gap-2">
            <input
              readOnly
              value={data.link}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 min-w-0 text-sm font-mono px-3 py-2 rounded-sm border border-border/60 bg-muted/30 text-foreground"
              aria-label="Your referral link"
            />
            <Button variant="outline" size="sm" onClick={copyLink} className="shrink-0">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="ml-1.5">
                {copied ? t("referral.copied", "Copied") : t("referral.copy", "Copy")}
              </span>
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground/70 font-mono">
            {t("referral.code_label", "Code:")} <span className="text-foreground">{data.code}</span>
          </p>
        </div>

        {/* Share buttons */}
        <div className="flex flex-wrap gap-2">
          <a
            href={`mailto:?subject=${subject}&body=${message}`}
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider px-3 py-2 rounded-sm border border-border/60 hover:bg-muted/40 transition-colors"
          >
            <Mail className="w-3.5 h-3.5" /> {t("referral.share_email", "Email")}
          </a>
          <a
            href={`https://wa.me/?text=${message}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider px-3 py-2 rounded-sm border border-border/60 hover:bg-muted/40 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" /> {t("referral.share_whatsapp", "WhatsApp")}
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(data.link)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider px-3 py-2 rounded-sm border border-border/60 hover:bg-muted/40 transition-colors"
          >
            <Linkedin className="w-3.5 h-3.5" /> {t("referral.share_linkedin", "LinkedIn")}
          </a>
        </div>

        {data.successfulCount >= data.cap && (
          <p className="text-[11px] text-muted-foreground/70 font-light italic">
            {t(
              "referral.cap_reached",
              "You've reached the three-referral cap — further introductions are appreciated, though no additional rewards will be granted."
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
