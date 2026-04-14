import { Link } from "wouter";
import { useLanguage } from "@/lib/i18n";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in duration-500">
      <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">404</p>
      <h1 className="text-4xl md:text-5xl font-serif text-foreground">{t("common.not_found")}</h1>
      <p className="text-muted-foreground font-light max-w-sm">
        {t("common.error")}
      </p>
      <Link href="/" className="inline-flex items-center font-serif text-primary hover:underline underline-offset-4 mt-4">
        {t("common.return_home")}
      </Link>
    </div>
  );
}
