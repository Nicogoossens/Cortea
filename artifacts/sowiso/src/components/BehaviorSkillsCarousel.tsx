import { useState } from "react";
import { ChevronLeft, ChevronRight, ArrowRight, Crown, X } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/lib/i18n";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const SKILL_KEYS = [
  "active_listening",
  "body_language",
  "graceful_disagreement",
  "art_of_introduction",
  "table_conversation",
  "digital_conduct",
  "graceful_exit",
  "language_of_gratitude",
] as const;

const SKILL_IDS: Record<typeof SKILL_KEYS[number], string> = {
  active_listening: "active-listening",
  body_language: "body-language",
  graceful_disagreement: "graceful-disagreement",
  art_of_introduction: "art-of-introduction",
  table_conversation: "table-conversation",
  digital_conduct: "digital-conduct",
  graceful_exit: "graceful-exit",
  language_of_gratitude: "language-of-gratitude",
};

interface BehaviorSkillsCarouselProps {
  hasFullAccess: boolean;
}

export function BehaviorSkillsCarousel({ hasFullAccess }: BehaviorSkillsCarouselProps) {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const total = SKILL_KEYS.length;
  const activeKey = SKILL_KEYS[activeIndex];
  const skillId = SKILL_IDS[activeKey];

  const goPrev = () => setActiveIndex((i) => Math.max(0, i - 1));
  const goNext = () => setActiveIndex((i) => Math.min(total - 1, i + 1));

  return (
    <section className="space-y-5" aria-label={t("counsel.skills.section_label")}>
      {/* Header row */}
      <div className="flex items-end justify-between gap-4 px-0.5">
        <div className="space-y-1">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/70">
            {t("counsel.skills.section_label")}
          </p>
          <p className="text-sm text-muted-foreground font-light leading-snug max-w-sm">
            {t("counsel.skills.section_subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={goPrev}
            disabled={activeIndex === 0}
            aria-label={t("counsel.skills.prev_aria")}
            className="flex items-center justify-center w-8 h-8 rounded-lg border-2 border-border/60 text-muted-foreground hover:border-primary/50 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          <span className="text-[10px] font-mono text-muted-foreground/50 tabular-nums min-w-[2.5rem] text-center">
            {activeIndex + 1} / {total}
          </span>
          <button
            onClick={goNext}
            disabled={activeIndex === total - 1}
            aria-label={t("counsel.skills.next_aria")}
            className="flex items-center justify-center w-8 h-8 rounded-lg border-2 border-border/60 text-muted-foreground hover:border-primary/50 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Single card — clickable to open modal */}
      <article
        key={skillId}
        className="w-full border-2 border-primary/40 bg-primary/[0.04] rounded-xl p-5 flex flex-col gap-3 animate-in fade-in duration-200 cursor-pointer hover:border-primary/60 hover:bg-primary/[0.07] transition-all group"
        aria-label={t(`counsel.skills.${activeKey}.name`)}
        onClick={() => setModalOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setModalOpen(true)}
      >
        <div className="space-y-1.5">
          <h3 className="font-serif text-base text-foreground leading-snug">
            {t(`counsel.skills.${activeKey}.name`)}
          </h3>
          <p className="text-xs font-light italic text-primary/80 leading-relaxed border-l-2 border-primary/30 pl-3">
            {t(`counsel.skills.${activeKey}.principle`)}
          </p>
        </div>

        <p className="text-sm text-muted-foreground font-light leading-relaxed flex-1">
          {t(`counsel.skills.${activeKey}.body`)}
        </p>

        <div className="pt-2 border-t border-primary/20 flex items-center justify-between">
          {hasFullAccess ? (
            <div
              className="inline-flex items-center gap-1.5 text-xs text-primary group/link"
              onClick={(e) => e.stopPropagation()}
            >
              <Link href={`/counsel/skills/${skillId}`}>
                <span className="hover:underline underline-offset-2 cursor-pointer transition-colors">
                  {t("counsel.skills.explore_further")}
                  <ArrowRight className="inline w-3 h-3 ml-0.5 group-hover/link:translate-x-0.5 transition-transform" aria-hidden="true" />
                </span>
              </Link>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/40 border border-muted-foreground/15 rounded-lg px-2 py-1">
              <Crown className="w-2.5 h-2.5" aria-hidden="true" />
              {t("counsel.skills.tier_badge")}
            </div>
          )}
          <span className="text-[10px] font-mono uppercase tracking-widest text-primary/50 group-hover:text-primary/70 transition-colors">
            {activeIndex + 1} / {total} →
          </span>
        </div>
      </article>

      {/* All-skills modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto p-0 rounded-xl border-2 border-primary/30">
          <div className="sticky top-0 z-10 bg-background border-b border-primary/20 px-6 py-4 flex items-center justify-between">
            <div>
              <DialogTitle className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                {t("counsel.skills.section_label")}
              </DialogTitle>
              <p className="text-xs text-muted-foreground font-light mt-0.5">{total} {t("counsel.skills.section_label").toLowerCase()}</p>
            </div>
            <button
              onClick={() => setModalOpen(false)}
              className="w-8 h-8 rounded-lg border-2 border-border/60 flex items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all"
              aria-label="Sluiten"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="divide-y divide-border/30 px-6">
            {SKILL_KEYS.map((key, i) => {
              const id = SKILL_IDS[key];
              const isActive = i === activeIndex;
              return (
                <div
                  key={key}
                  className={`py-5 space-y-2 cursor-pointer transition-colors ${isActive ? "bg-primary/[0.04] -mx-6 px-6 rounded-xl" : ""}`}
                  onClick={() => { setActiveIndex(i); setModalOpen(false); }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-muted-foreground/40 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                        <h4 className="font-serif text-sm text-foreground leading-snug">{t(`counsel.skills.${key}.name`)}</h4>
                        {isActive && <span className="text-[9px] font-mono uppercase tracking-widest text-primary/60 border border-primary/30 rounded px-1.5 py-0.5">Actief</span>}
                      </div>
                      <p className="text-xs font-light italic text-primary/70 leading-relaxed border-l-2 border-primary/25 pl-3">
                        {t(`counsel.skills.${key}.principle`)}
                      </p>
                      <p className="text-xs text-muted-foreground font-light leading-relaxed">
                        {t(`counsel.skills.${key}.body`)}
                      </p>
                    </div>
                    {hasFullAccess && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Link href={`/counsel/skills/${id}`}>
                          <div className="flex items-center justify-center w-7 h-7 rounded-lg border border-border/60 text-muted-foreground hover:border-primary/50 hover:text-primary transition-all shrink-0 mt-0.5">
                            <ArrowRight className="w-3 h-3" aria-hidden="true" />
                          </div>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="h-4" />
        </DialogContent>
      </Dialog>
    </section>
  );
}
