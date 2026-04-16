import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { CheckCircle2, XCircle, Loader2, ArrowRight, BookOpen, Compass, Shield, Scan } from "lucide-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Status = "loading" | "success" | "already_verified" | "expired" | "invalid" | "error";

function WelcomeBackChoices({ t }: { t: (key: string) => string }) {
  return (
    <div className="space-y-5 text-left w-full max-w-sm mx-auto">
      <p className="text-center text-xs font-mono uppercase tracking-widest text-muted-foreground/70">
        {t("verify.choose_destination")}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Link href="/atelier">
          <div className="group p-4 border border-border rounded-sm hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer space-y-2">
            <BookOpen className="h-5 w-5 text-primary/70 group-hover:text-primary transition-colors" aria-hidden="true" />
            <p className="font-serif text-sm font-medium group-hover:text-primary transition-colors">{t("nav.atelier")}</p>
          </div>
        </Link>
        <Link href="/counsel">
          <div className="group p-4 border border-border rounded-sm hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer space-y-2">
            <Shield className="h-5 w-5 text-primary/70 group-hover:text-primary transition-colors" aria-hidden="true" />
            <p className="font-serif text-sm font-medium group-hover:text-primary transition-colors">{t("nav.counsel")}</p>
          </div>
        </Link>
        <Link href="/compass">
          <div className="group p-4 border border-border rounded-sm hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer space-y-2">
            <Compass className="h-5 w-5 text-primary/70 group-hover:text-primary transition-colors" aria-hidden="true" />
            <p className="font-serif text-sm font-medium group-hover:text-primary transition-colors">{t("nav.compass")}</p>
          </div>
        </Link>
        <Link href="/mirror">
          <div className="group p-4 border border-amber-300/40 rounded-sm hover:border-amber-400/60 hover:bg-amber-50/40 transition-all cursor-pointer space-y-2">
            <Scan className="h-5 w-5 text-amber-600/60 group-hover:text-amber-700 transition-colors" aria-hidden="true" />
            <p className="font-serif text-sm font-medium text-amber-700/70 group-hover:text-amber-800 transition-colors">{t("nav.mirror")}</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default function EmailVerify() {
  const { t } = useLanguage();
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<Status>("loading");
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setStatus("invalid");
      return;
    }

    fetch(`${API_BASE}/api/auth/verify?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const body = await res.json() as {
          message?: string;
          already_verified?: boolean;
          error?: string;
          user_id?: string;
          full_name?: string;
          session_token?: string;
          is_admin?: boolean;
        };
        if (res.ok) {
          if (body.user_id) {
            login(body.user_id, { name: body.full_name, sessionToken: body.session_token, isAdmin: body.is_admin ?? false });
          }
          const newUser = !body.already_verified;
          setIsNewUser(newUser);
          setStatus(body.already_verified ? "already_verified" : "success");
        } else if (res.status === 410) {
          setStatus("expired");
        } else if (res.status === 404) {
          setStatus("invalid");
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, []);

  function handleEnter() {
    navigate(isNewUser ? "/onboarding" : "/");
  }

  const views: Record<Status, { icon: React.ReactNode; heading: string; body: string; cta?: React.ReactNode }> = {
    loading: {
      icon: <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" aria-hidden="true" />,
      heading: t("verify.verifying"),
      body: t("verify.please_wait"),
    },
    success: {
      icon: <CheckCircle2 className="w-8 h-8 text-green-600" aria-hidden="true" />,
      heading: t("verify.success_heading"),
      body: t("verify.success_body"),
      cta: (
        <Button
          onClick={() => handleEnter()}
          className="font-serif bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          {t("verify.enter_sowiso")}
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Button>
      ),
    },
    already_verified: {
      icon: <CheckCircle2 className="w-8 h-8 text-primary" aria-hidden="true" />,
      heading: t("verify.welcome_back_heading"),
      body: t("verify.welcome_back_body"),
      cta: <WelcomeBackChoices t={t} />,
    },
    expired: {
      icon: <XCircle className="w-8 h-8 text-amber-600" aria-hidden="true" />,
      heading: t("verify.expired_heading"),
      body: t("verify.expired_body"),
      cta: (
        <Link href="/register">
          <Button variant="outline" className="font-serif">
            {t("verify.request_new")}
          </Button>
        </Link>
      ),
    },
    invalid: {
      icon: <XCircle className="w-8 h-8 text-destructive" aria-hidden="true" />,
      heading: t("verify.invalid_heading"),
      body: t("verify.invalid_body"),
      cta: (
        <Link href="/register">
          <Button variant="outline" className="font-serif">
            {t("register.title")}
          </Button>
        </Link>
      ),
    },
    error: {
      icon: <XCircle className="w-8 h-8 text-destructive" aria-hidden="true" />,
      heading: t("common.error"),
      body: t("verify.error_body"),
      cta: (
        <Link href="/">
          <Button variant="outline" className="font-serif">
            {t("common.return_home")}
          </Button>
        </Link>
      ),
    },
  };

  const view = views[status];

  return (
    <div className="max-w-md mx-auto space-y-10 animate-in fade-in duration-500 py-16 text-center">
      <div className="space-y-6">
        <div className="w-16 h-16 mx-auto bg-muted/30 rounded-full flex items-center justify-center">
          {view.icon}
        </div>
        <h1 className="text-3xl font-serif text-foreground">{view.heading}</h1>
        <p className="text-muted-foreground leading-relaxed font-light max-w-sm mx-auto">
          {view.body}
        </p>
      </div>
      {view.cta && <div>{view.cta}</div>}
    </div>
  );
}
