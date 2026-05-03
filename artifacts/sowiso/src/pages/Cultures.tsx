import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { ArrowRight, CheckCircle2, AlertTriangle, Sparkles, Lock, Globe } from "lucide-react";
import { LandingLayout } from "@/components/layout/LandingLayout";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/lib/i18n";
import { FlagEmoji } from "@/lib/active-region";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
/**
 * Conversion target for the page CTA. Defaults to the public registration
 * route which serves as the waitlist pre-launch and as the trial entry
 * post-launch — flipping the destination requires only an env change.
 */
const CTA_HREF = (import.meta.env.VITE_CULTURE_CTA_HREF as string | undefined) ?? "/register?ref=cultures";
const CTA_MODE = (import.meta.env.VITE_CULTURE_CTA_MODE as string | undefined) ?? "waitlist";

interface PublicCultureSummary {
  slug: string;
  region_code: string;
  region_name: string;
  flag_emoji: string;
  core_value: string;
  biggest_taboo: string;
}

interface PublicCultureDetail extends PublicCultureSummary {
  teaser: string;
  dining_etiquette: string;
  language_notes: string;
  gift_protocol: string;
  dress_code: string;
  dos_preview: string[];
  donts_preview: string[];
  dos_total: number;
  donts_total: number;
  related: PublicCultureSummary[];
}

function useCultureDetail(slug: string, locale: string) {
  const [data, setData] = useState<PublicCultureDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    fetch(`${API_BASE}/api/cultures/${encodeURIComponent(slug)}?locale=${encodeURIComponent(locale)}`)
      .then(async (r) => {
        if (cancelled) return;
        if (r.status === 404) {
          setNotFound(true);
          setData(null);
        } else if (r.ok) {
          setData((await r.json()) as PublicCultureDetail);
        } else {
          setData(null);
        }
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, locale]);

  return { data, loading, notFound };
}

function ConversionCard({ regionName }: { regionName: string }) {
  const { t } = useLocale();
  const headlineKey = CTA_MODE === "trial" ? "cultures.cta.headline_trial" : "cultures.cta.headline_waitlist";
  const buttonKey = CTA_MODE === "trial" ? "cultures.cta.button_trial" : "cultures.cta.button_waitlist";

  return (
    <section
      aria-labelledby="cultures-cta-heading"
      className="relative overflow-hidden rounded-sm border border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/10 p-8 md:p-10"
    >
      <Sparkles className="absolute top-4 right-4 w-6 h-6 text-primary/30" aria-hidden="true" />
      <p className="text-[10px] font-mono uppercase tracking-widest text-primary/70 mb-2">
        {t("cultures.cta.eyebrow", "Cortéa Membership")}
      </p>
      <h2 id="cultures-cta-heading" className="font-serif text-2xl md:text-3xl text-foreground mb-3">
        {t(headlineKey, {
          country: regionName,
          defaultValue: `Get the full {{country}} guide + 50+ other countries — 14 days free`,
        })}
      </h2>
      <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6 max-w-2xl">
        {t(
          "cultures.cta.body",
          "Unlock every country profile, every dos & don'ts list, and the full Atelier scenario library. Cancel anytime."
        )}
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <Link href={CTA_HREF}>
          <span className="inline-flex items-center gap-2 px-6 py-3 rounded-sm bg-primary text-primary-foreground text-sm font-medium tracking-wide hover:bg-primary/90 transition-colors cursor-pointer">
            {t(buttonKey, CTA_MODE === "trial" ? "Start 14-day free trial" : "Join the waitlist")}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </span>
        </Link>
        <Link href="/membership">
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            {t("cultures.cta.secondary", "View membership plans →")}
          </span>
        </Link>
      </div>
    </section>
  );
}

function NotFoundState() {
  const { t } = useLocale();
  return (
    <div className="max-w-3xl mx-auto px-6 py-24 text-center">
      <Globe className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" aria-hidden="true" />
      <h1 className="font-serif text-3xl mb-3">{t("cultures.not_found.title", "This culture is not yet on the compass.")}</h1>
      <p className="text-muted-foreground mb-8">
        {t("cultures.not_found.body", "We are continuously expanding our coverage. In the meantime, explore the cultures already mapped.")}
      </p>
      <Link href="/cultures">
        <span className="inline-flex items-center gap-2 text-primary hover:underline cursor-pointer">
          <ArrowRight className="w-4 h-4 rotate-180" aria-hidden="true" />
          {t("cultures.not_found.cta", "Browse all countries")}
        </span>
      </Link>
    </div>
  );
}

function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-8" aria-live="polite">
      <Skeleton className="h-12 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}

export function CultureLanding() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { t, locale } = useLocale();
  const normalizedSlug = slug.toLowerCase();
  const { data, loading, notFound } = useCultureDetail(normalizedSlug, locale);

  if (loading) {
    return (
      <LandingLayout authLink="register">
        <Loading />
      </LandingLayout>
    );
  }

  if (notFound || !data) {
    return (
      <LandingLayout authLink="register">
        <SEOHead
          title={t("cultures.not_found.title", "This culture is not yet on the compass.")}
          description={t("cultures.not_found.body", "We are continuously expanding our coverage.")}
          locale={locale}
          path={`/cultures/${normalizedSlug}`}
          noIndex
        />
        <NotFoundState />
      </LandingLayout>
    );
  }

  const description = t("cultures.meta.description", {
    country: data.region_name,
    defaultValue: `{{country}} etiquette & cultural guide: dining, dress code, business customs, gift-giving, and the unwritten rules visitors miss.`,
  });

  const title = `${data.region_name} ${t("cultures.meta.title_suffix", "Etiquette & Cultural Guide")}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "description": description,
      "about": {
        "@type": "Country",
        "name": data.region_name,
        "identifier": data.region_code,
      },
      "publisher": {
        "@type": "Organization",
        "name": "Cortéa",
        "url": "https://cortea.app",
      },
      "url": `https://cortea.app/cultures/${data.slug}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "Country",
      "name": data.region_name,
      "identifier": data.region_code,
      "url": `https://cortea.app/cultures/${data.slug}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Cortéa", "item": "https://cortea.app/" },
        { "@type": "ListItem", "position": 2, "name": "Cultures", "item": "https://cortea.app/cultures" },
        { "@type": "ListItem", "position": 3, "name": data.region_name, "item": `https://cortea.app/cultures/${data.slug}` },
      ],
    },
  ];

  const moreDosCount = Math.max(0, data.dos_total - data.dos_preview.length);
  const moreDontsCount = Math.max(0, data.donts_total - data.donts_preview.length);

  return (
    <LandingLayout authLink="register">
      <SEOHead
        title={title}
        description={description}
        locale={locale}
        path={`/cultures/${data.slug}`}
        jsonLd={jsonLd}
      />
      <article className="max-w-4xl mx-auto px-6 py-12 md:py-16 space-y-12">
        {/* Hero */}
        <header className="space-y-6 pb-8 border-b border-border/40">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground/60">
            <Link href="/cultures">
              <span className="hover:text-foreground transition-colors cursor-pointer">{t("cultures.breadcrumb_root", "Cultures")}</span>
            </Link>
            <span aria-hidden="true">/</span>
            <span>{data.region_name}</span>
          </div>
          <div className="flex items-center gap-5">
            <FlagEmoji code={data.region_code} size="lg" ariaLabel={data.region_name} className="drop-shadow-sm" />
            <div>
              <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-2">
                {data.region_name}
              </h1>
              <p className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
                {t("cultures.hero.eyebrow", "Etiquette & Cultural Guide")}
              </p>
            </div>
          </div>
          {data.teaser && (
            <p className="text-lg md:text-xl text-foreground/85 font-light leading-relaxed max-w-3xl">
              {data.teaser}
            </p>
          )}
        </header>

        {/* Core value + taboo */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.core_value && (
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-primary/70">
                  {t("compass.core_value", "Core Value")}
                </p>
                <CardTitle className="font-serif text-xl">{data.core_value}</CardTitle>
              </CardHeader>
            </Card>
          )}
          {data.biggest_taboo && (
            <Card className="border-destructive/30 bg-destructive/[0.02]">
              <CardHeader className="pb-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-destructive/80">
                  {t("compass.taboo", "Biggest Taboo")}
                </p>
                <CardTitle className="font-serif text-xl">{data.biggest_taboo}</CardTitle>
              </CardHeader>
            </Card>
          )}
        </section>

        {/* Themed sections */}
        <section className="space-y-6">
          {data.dining_etiquette && (
            <div className="space-y-2">
              <h2 className="font-serif text-2xl">{t("cultures.section.dining", "Dining Etiquette")}</h2>
              <p className="text-foreground/80 leading-relaxed">{data.dining_etiquette}</p>
            </div>
          )}
          {data.dress_code && (
            <div className="space-y-2">
              <h2 className="font-serif text-2xl">{t("cultures.section.dress", "Dress Code")}</h2>
              <p className="text-foreground/80 leading-relaxed">{data.dress_code}</p>
            </div>
          )}
          {data.language_notes && (
            <div className="space-y-2">
              <h2 className="font-serif text-2xl">{t("cultures.section.language", "Language & Communication")}</h2>
              <p className="text-foreground/80 leading-relaxed">{data.language_notes}</p>
            </div>
          )}
          {data.gift_protocol && (
            <div className="space-y-2">
              <h2 className="font-serif text-2xl">{t("cultures.section.gifts", "Gift-Giving Protocol")}</h2>
              <p className="text-foreground/80 leading-relaxed">{data.gift_protocol}</p>
            </div>
          )}
        </section>

        {/* Dos & Don'ts teaser */}
        {(data.dos_preview.length > 0 || data.donts_preview.length > 0) && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.dos_preview.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-serif text-2xl flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-700" aria-hidden="true" />
                  {t("compass.dos", "Do")}
                </h2>
                <ul className="space-y-2">
                  {data.dos_preview.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-foreground/80 leading-relaxed">
                      <span className="text-green-700 font-bold flex-shrink-0">+</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                {moreDosCount > 0 && (
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/70 flex items-center gap-1.5 pt-1">
                    <Lock className="w-3 h-3" aria-hidden="true" />
                    {t("cultures.more_locked", { count: moreDosCount, defaultValue: "{{count}} more — unlock with membership" })}
                  </p>
                )}
              </div>
            )}
            {data.donts_preview.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-serif text-2xl flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" aria-hidden="true" />
                  {t("compass.donts", "Don't")}
                </h2>
                <ul className="space-y-2">
                  {data.donts_preview.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-foreground/80 leading-relaxed">
                      <span className="text-destructive font-bold flex-shrink-0">×</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                {moreDontsCount > 0 && (
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/70 flex items-center gap-1.5 pt-1">
                    <Lock className="w-3 h-3" aria-hidden="true" />
                    {t("cultures.more_locked", { count: moreDontsCount, defaultValue: "{{count}} more — unlock with membership" })}
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        {/* Conversion CTA */}
        <ConversionCard regionName={data.region_name} />

        {/* Related countries */}
        {data.related.length > 0 && (
          <section aria-labelledby="related-cultures-heading" className="space-y-4 pt-8 border-t border-border/40">
            <h2 id="related-cultures-heading" className="font-serif text-2xl">
              {t("cultures.related.heading", { country: data.region_name, defaultValue: "Visitors who explored {{country}} also viewed" })}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.related.map((r) => (
                <Link key={r.region_code} href={`/cultures/${r.slug}`} aria-label={r.region_name}>
                  <Card className="h-full border-border/60 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer">
                    <CardContent className="p-5 space-y-2">
                      <div className="flex items-center gap-2">
                        <FlagEmoji code={r.region_code} size="sm" ariaLabel={r.region_name} />
                        <span className="font-serif text-base">{r.region_name}</span>
                      </div>
                      {r.core_value && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{r.core_value}</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </LandingLayout>
  );
}

export function CulturesIndex() {
  const { t, locale } = useLocale();
  const [cultures, setCultures] = useState<PublicCultureSummary[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${API_BASE}/api/cultures?locale=${encodeURIComponent(locale)}`)
      .then((r) => (r.ok ? r.json() : { cultures: [] }))
      .then((d: { cultures: PublicCultureSummary[] }) => {
        if (!cancelled) setCultures(d.cultures ?? []);
      })
      .catch(() => {
        if (!cancelled) setCultures([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const indexJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": t("cultures.index.title", "Cultural Etiquette Guides by Country"),
    "description": t(
      "cultures.index.description",
      "Free country-by-country etiquette guides: dining, dress code, business customs, and unwritten rules across 50+ cultures."
    ),
    "url": "https://cortea.app/cultures",
  };

  return (
    <LandingLayout authLink="register">
      <SEOHead
        title={t("cultures.index.title", "Cultural Etiquette Guides by Country")}
        description={t(
          "cultures.index.description",
          "Free country-by-country etiquette guides: dining, dress code, business customs, and unwritten rules across 50+ cultures."
        )}
        locale={locale}
        path="/cultures"
        jsonLd={indexJsonLd}
      />
      <article className="max-w-5xl mx-auto px-6 py-12 md:py-16 space-y-10">
        <header className="space-y-4 max-w-3xl">
          <h1 className="font-serif text-4xl md:text-5xl">
            {t("cultures.index.title", "Cultural Etiquette Guides by Country")}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {t(
              "cultures.index.subtitle",
              "Search by country to read the dos, don'ts, dining customs, dress codes and unwritten rules — distilled into one calm page."
            )}
          </p>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : cultures && cultures.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cultures.map((c) => (
              <Link key={c.region_code} href={`/cultures/${c.slug}`} aria-label={c.region_name}>
                <Card className="h-full border-border/60 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer">
                  <CardHeader className="space-y-2">
                    <div className="flex items-center gap-3">
                      <FlagEmoji code={c.region_code} size="lg" ariaLabel={c.region_name} />
                      <CardTitle className="font-serif text-xl">{c.region_name}</CardTitle>
                    </div>
                    {c.core_value && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{c.core_value}</p>
                    )}
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">{t("cultures.index.empty", "No country guides are published yet.")}</p>
        )}

        <ConversionCard regionName={t("cultures.cta.country_fallback", "every country")} />
      </article>
    </LandingLayout>
  );
}

export default CultureLanding;
