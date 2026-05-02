import { useState } from "react";
import { ChevronLeft, ChevronRight, ArrowRight, Crown } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/lib/i18n";

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
            className="flex items-center justify-center w-8 h-8 rounded-sm border border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
            className="flex items-center justify-center w-8 h-8 rounded-sm border border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Single card — full width, fade transition via key */}
      <article
        key={skillId}
        className="w-full border border-border/50 bg-card rounded-sm p-5 flex flex-col gap-3 animate-in fade-in duration-200"
        aria-label={t(`counsel.skills.${activeKey}.name`)}
      >
        <div className="space-y-1.5">
          <h3 className="font-serif text-base text-foreground leading-snug">
            {t(`counsel.skills.${activeKey}.name`)}
          </h3>
          <p className="text-xs font-light italic text-primary/80 leading-relaxed border-l border-primary/20 pl-3">
            {t(`counsel.skills.${activeKey}.principle`)}
          </p>
        </div>

        <p className="text-sm text-muted-foreground font-light leading-relaxed flex-1">
          {t(`counsel.skills.${activeKey}.body`)}
        </p>

        <div className="pt-2 border-t border-border/30">
          {hasFullAccess ? (
            <Link href={`/counsel/skills/${skillId}`}>
              <div className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline underline-offset-2 cursor-pointer group transition-colors">
                {t("counsel.skills.explore_further")}
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
              </div>
            </Link>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/40 border border-muted-foreground/15 rounded-[2px] px-2 py-1">
              <Crown className="w-2.5 h-2.5" aria-hidden="true" />
              {t("counsel.skills.tier_badge")}
            </div>
          )}
        </div>
      </article>

      {/* Dot navigation */}
      <div className="flex items-center justify-center gap-1.5" aria-label={t("counsel.skills.carousel_position_aria")} role="tablist">
        {SKILL_KEYS.map((key, i) => (
          <button
            key={key}
            role="tab"
            aria-selected={i === activeIndex}
            aria-label={t(`counsel.skills.${key}.name`)}
            onClick={() => setActiveIndex(i)}
            className={`rounded-full transition-all duration-200 ${
              i === activeIndex
                ? "w-4 h-1.5 bg-primary"
                : "w-1.5 h-1.5 bg-muted-foreground/25 hover:bg-muted-foreground/40"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
