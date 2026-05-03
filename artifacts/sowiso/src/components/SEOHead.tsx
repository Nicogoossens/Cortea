import { Helmet } from "react-helmet-async";
import { ALL_LOCALES, type SupportedLocale } from "@/lib/i18n-locales";

const LANG_TO_BCP47: Record<string, string> = {
  "en-GB": "en-GB", "en-US": "en-US", "en-AU": "en-AU", "en-CA": "en-CA",
  "nl-NL": "nl", "fr-FR": "fr", "de-DE": "de", "es-ES": "es", "es-MX": "es-MX",
  "pt-PT": "pt", "pt-BR": "pt-BR", "it-IT": "it", "ar-SA": "ar", "ja-JP": "ja",
  "zh-CN": "zh",
};

const BASE_URL = "https://cortea.app";
const DEFAULT_OG_IMAGE = `${BASE_URL}/opengraph.jpg`;

interface JsonLdSchema {
  "@context": string;
  "@type": string;
  [key: string]: unknown;
}

interface SEOHeadProps {
  title?: string;
  description?: string;
  ogImage?: string;
  canonical?: string;
  locale?: SupportedLocale;
  noIndex?: boolean;
  jsonLd?: JsonLdSchema | JsonLdSchema[];
  path?: string;
}

export function SEOHead({
  title,
  description,
  ogImage = DEFAULT_OG_IMAGE,
  canonical,
  locale = "en-GB",
  noIndex = false,
  jsonLd,
  path = "/",
}: SEOHeadProps) {
  const pageTitle = title
    ? (title.includes("Cortéa") ? title : `${title} — Cortéa`)
    : "Cortéa — The Art of Conduct";
  const canonicalUrl = canonical ?? `${BASE_URL}${path}`;
  const ogLocale = LANG_TO_BCP47[locale] ?? "en_GB";
  const ogLocaleFmt = ogLocale.replace("-", "_");
  const baseLang = locale.split("-")[0];

  const jsonLdArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <html lang={locale} />
      <title>{pageTitle}</title>
      {description && <meta name="description" content={description} />}
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      <link rel="canonical" href={canonicalUrl} />

      {ALL_LOCALES.map((loc) => {
        const bcp47 = LANG_TO_BCP47[loc] ?? loc;
        // en-GB is the canonical default — no ?lang= param; all others get a distinct URL
        const altHref = loc === "en-GB"
          ? canonicalUrl
          : `${canonicalUrl}?lang=${encodeURIComponent(bcp47)}`;
        return <link key={loc} rel="alternate" hrefLang={bcp47} href={altHref} />;
      })}
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Cortéa" />
      <meta property="og:title" content={pageTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:locale" content={ogLocaleFmt} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={ogImage} />

      {jsonLdArray.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}

      <meta name="language" content={baseLang} />
    </Helmet>
  );
}
