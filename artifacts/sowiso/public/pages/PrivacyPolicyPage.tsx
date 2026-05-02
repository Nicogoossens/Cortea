import { useLanguage } from "@/lib/i18n";
import { usePageTitle } from "@/hooks/usePageTitle";
import { getPolicyContent, type PolicySection, type PolicySubsection } from "@/lib/privacyPolicyContent";
import { Link } from "wouter";
import { ArrowLeft, AlertCircle, Shield } from "lucide-react";

function PlaceholderBadge({ text }: { text: string }) {
  if (!text.includes("[") && !text.includes("★")) return <>{text}</>;

  const parts = text.split(/(★|\[[^\]]*\])/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part === "★") {
          return (
            <span key={i} className="text-amber-500 font-bold mx-0.5" title="Legal placeholder — to be filled in">
              ★
            </span>
          );
        }
        if (part.startsWith("[") && part.endsWith("]")) {
          return (
            <mark
              key={i}
              className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-1 py-0.5 rounded text-sm font-mono border border-amber-300 dark:border-amber-700 mx-0.5"
              title="Legal placeholder — to be filled in"
            >
              {part}
            </mark>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function renderTextWithPlaceholders(text: string) {
  return text.split("\n").map((line, i, arr) => (
    <span key={i}>
      <PlaceholderBadge text={line} />
      {i < arr.length - 1 && <br />}
    </span>
  ));
}

function PolicyTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto my-4 rounded-sm border border-border">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-muted/50">
            {headers.map((h, i) => (
              <th
                key={i}
                className="text-left px-4 py-3 font-semibold text-foreground text-xs uppercase tracking-wider border-b border-border"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? "bg-background" : "bg-muted/20"}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-3 text-muted-foreground border-b border-border/40 last:border-b-0 align-top">
                  {renderTextWithPlaceholders(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SubsectionBlock({ sub }: { sub: PolicySubsection }) {
  return (
    <div className="space-y-2">
      <h3 className="text-base font-semibold text-foreground mt-6 mb-2">{sub.title}</h3>
      {sub.body && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {renderTextWithPlaceholders(sub.body)}
        </p>
      )}
      {sub.list && sub.list.length > 0 && (
        <ul className="list-disc list-inside space-y-1 pl-2">
          {sub.list.map((item, i) => (
            <li key={i} className="text-sm text-muted-foreground leading-relaxed">
              <PlaceholderBadge text={item} />
            </li>
          ))}
        </ul>
      )}
      {sub.note && (
        <div className="bg-muted/30 border border-border/50 rounded-sm p-3 mt-2">
          <p className="text-xs text-muted-foreground leading-relaxed italic">
            {renderTextWithPlaceholders(sub.note)}
          </p>
        </div>
      )}
    </div>
  );
}

function SectionBlock({ section }: { section: PolicySection }) {
  const sectionWithExtra = section as PolicySection & { body2?: string; howToRequest?: string };

  return (
    <section className="mb-10 scroll-mt-8" id={section.id}>
      <h2 className="text-xl font-serif text-foreground mb-4 pb-2 border-b border-border/40">
        {section.title}
      </h2>

      {section.body && (
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          {renderTextWithPlaceholders(section.body)}
        </p>
      )}

      {section.note && !section.subsections && (
        <div className="bg-muted/30 border-l-2 border-amber-400 pl-4 py-2 my-3 rounded-r-sm">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {renderTextWithPlaceholders(section.note)}
          </p>
        </div>
      )}

      {sectionWithExtra.body2 && (
        <p className="text-sm text-muted-foreground leading-relaxed mt-3">
          {renderTextWithPlaceholders(sectionWithExtra.body2)}
        </p>
      )}

      {section.list && section.list.length > 0 && (
        <ul className="list-disc list-inside space-y-1.5 pl-2 my-3">
          {section.list.map((item, i) => (
            <li key={i} className="text-sm text-muted-foreground leading-relaxed">
              <PlaceholderBadge text={item} />
            </li>
          ))}
        </ul>
      )}

      {section.table && (
        <PolicyTable headers={section.table.headers} rows={section.table.rows} />
      )}

      {section.subsections && section.subsections.map((sub) => (
        <SubsectionBlock key={sub.id} sub={sub} />
      ))}

      {sectionWithExtra.howToRequest && (
        <div className="mt-4 bg-primary/5 border border-primary/20 rounded-sm p-4">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
            {/* "How to submit a request" label */}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {renderTextWithPlaceholders(sectionWithExtra.howToRequest)}
          </p>
        </div>
      )}

      {section.subsections && section.note && (
        <div className="bg-muted/30 border-l-2 border-amber-400 pl-4 py-2 my-3 rounded-r-sm">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {renderTextWithPlaceholders(section.note)}
          </p>
        </div>
      )}
    </section>
  );
}

export default function PrivacyPolicyPage() {
  usePageTitle("Privacy Policy");
  const { language, dir } = useLanguage();
  const policy = getPolicyContent(language);

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Header bar */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/">
            <button className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
              Cortéa
            </button>
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Shield className="h-3.5 w-3.5 text-primary/60" />
            {policy.meta.version}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        {/* Document title & meta */}
        <div className="mb-10 pb-8 border-b border-border/40">
          <h1 className="text-3xl md:text-4xl font-serif text-foreground mb-4 leading-tight">
            {policy.meta.title}
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
            {[
              { label: policy.meta.effectiveDateLabel, value: policy.meta.effectiveDateValue },
              { label: policy.meta.responsibleLabel, value: policy.meta.responsibleValue },
              { label: policy.meta.supervisorLabel, value: policy.meta.supervisorValue },
            ].map(({ label, value }) => (
              <div key={label} className="space-y-0.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
                <p className="text-sm text-foreground">
                  {renderTextWithPlaceholders(value)}
                </p>
              </div>
            ))}
          </div>

          {/* Placeholder note */}
          <div className="mt-6 flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-sm p-3">
            <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              {policy.meta.placeholderNote}
            </p>
          </div>
        </div>

        {/* Table of Contents (section titles only) */}
        <nav className="mb-12 bg-muted/20 rounded-sm border border-border/30 p-5" aria-label="Table of contents">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Contents</p>
          <ol className="space-y-1">
            {policy.sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:underline underline-offset-2"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Policy sections */}
        <div className="prose-custom">
          {policy.sections.map((section) => (
            <SectionBlock key={section.id} section={section} />
          ))}
        </div>

        {/* Footer note */}
        <footer className="mt-16 pt-8 border-t border-border/40 text-center">
          <p className="text-xs text-muted-foreground font-light leading-relaxed max-w-xl mx-auto">
            {language === "nl"
              ? "Dit privacybeleid is opgesteld conform de Algemene Verordening Gegevensbescherming (EU) 2016/679 (AVG/GDPR) en de Belgische Wet van 30 juli 2018 betreffende de bescherming van natuurlijke personen met betrekking tot de verwerking van persoonsgegevens."
              : language === "de"
              ? "Diese Datenschutzerklärung wurde in Übereinstimmung mit der Datenschutz-Grundverordnung (EU) 2016/679 (DSGVO) und dem belgischen Gesetz vom 30. Juli 2018 über den Schutz natürlicher Personen bei der Verarbeitung personenbezogener Daten erstellt."
              : language === "fr"
              ? "La présente politique de confidentialité a été établie conformément au Règlement général sur la protection des données (UE) 2016/679 (RGPD) et à la loi belge du 30 juillet 2018 relative à la protection des personnes physiques à l'égard des traitements de données à caractère personnel."
              : language === "es"
              ? "Esta política de privacidad ha sido redactada de conformidad con el Reglamento General de Protección de Datos (UE) 2016/679 (RGPD) y la ley belga de 30 de julio de 2018 relativa a la protección de personas físicas en lo que respecta al tratamiento de datos personales."
              : language === "it"
              ? "La presente informativa sulla privacy è stata redatta in conformità con il Regolamento generale sulla protezione dei dati (UE) 2016/679 (GDPR) e la legge belga del 30 luglio 2018 relativa alla protezione delle persone fisiche con riguardo al trattamento dei dati personali."
              : language === "pt"
              ? "A presente política de privacidade foi elaborada em conformidade com o Regulamento Geral sobre a Proteção de Dados (UE) 2016/679 (RGPD) e a lei belga de 30 de julho de 2018 relativa à proteção das pessoas singulares no que diz respeito ao tratamento de dados pessoais."
              : language === "ja"
              ? "このプライバシーポリシーは、一般データ保護規則（EU）2016/679（GDPR）および個人データの処理に関する自然人の保護に関するベルギーの2018年7月30日の法律に準拠して作成されました。"
              : language === "ar"
              ? "تم إعداد سياسة الخصوصية هذه وفقاً للائحة العامة لحماية البيانات (EU) 2016/679 (GDPR) والقانون البلجيكي الصادر في 30 يوليو 2018 المتعلق بحماية الأشخاص الطبيعيين فيما يخص معالجة البيانات الشخصية."
              : "This privacy policy has been drafted in accordance with the General Data Protection Regulation (EU) 2016/679 (GDPR) and the Belgian Act of 30 July 2018 on the protection of natural persons with regard to the processing of personal data."}
          </p>
          <p className="text-xs text-muted-foreground/50 font-mono mt-4 uppercase tracking-widest">
            Cortéa · {policy.meta.version}
          </p>
        </footer>
      </main>
    </div>
  );
}
