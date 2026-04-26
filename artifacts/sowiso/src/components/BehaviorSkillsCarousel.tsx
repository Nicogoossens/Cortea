import { useState } from "react";
import { ChevronLeft, ChevronRight, ArrowRight, Crown } from "lucide-react";
import { Link } from "wouter";

interface BehaviorSkill {
  id: string;
  name: string;
  principle: string;
  body: string;
}

const BEHAVIOR_SKILLS: BehaviorSkill[] = [
  {
    id: "active-listening",
    name: "Active Listening",
    principle: "True understanding arrives only when you stop formulating your reply and give your full attention to the other person.",
    body: "Genuine listening means quieting your internal commentary and attending not just to words, but to the pauses between them. When someone feels truly heard, trust deepens far more quickly than any polished response could achieve. Reserve your observations until the other person has completely finished — and resist the urge to fill the silence.",
  },
  {
    id: "body-language",
    name: "Reading Body Language",
    principle: "What is left unspoken often communicates more than the words themselves.",
    body: "Posture, eye contact, and the subtle angle of shoulders reveal emotional states that carefully chosen words may conceal. A gracious host reads these signals to know when a guest needs rescuing from a stale conversation or when a visitor quietly wishes to depart. Mirroring open posture invites candour and signals that you are a safe presence.",
  },
  {
    id: "graceful-disagreement",
    name: "The Grace of Disagreement",
    principle: "One may hold a firm conviction and still speak of it with warmth and without apology.",
    body: "Disagreement handled with care is not weakness — it is confidence. Begin by acknowledging what is reasonable in the opposing view before presenting your own. Phrases such as \"I see it rather differently\" allow you to preserve both the relationship and your integrity, without either capitulating or confronting.",
  },
  {
    id: "art-of-introduction",
    name: "The Considered Introduction",
    principle: "How you introduce two people shapes the first impressions they form of each other — and of you.",
    body: "Formal convention is clear: introduce the lesser-known guest to the more distinguished one. The art, however, lies beyond protocol. Offer a brief, genuine detail about each person that sparks natural conversation — evidence that you have truly listened to them. An unhurried introduction is a quiet act of generosity.",
  },
  {
    id: "table-conversation",
    name: "Table Conversation",
    principle: "A good conversationalist gives attention freely and asks questions that make others feel interesting.",
    body: "Dinner table dialogue is best sustained by curiosity rather than performance. Draw out quieter guests with open questions and resist the pull to monopolise the exchange. The goal is not to impress but to create moments where everyone leaves the table feeling they have contributed something worth remembering.",
  },
  {
    id: "digital-conduct",
    name: "Digital Conduct",
    principle: "The same courtesy that governs the drawing room governs the inbox and the message thread.",
    body: "Promptness, clarity, and tone all carry weight in written correspondence. Replying thoughtfully — even briefly — signals respect for another's time. Avoid writing in haste or frustration: a message sent cannot be recalled, and in digital communication, tone is far more easily misread than in conversation.",
  },
  {
    id: "graceful-exit",
    name: "The Graceful Exit",
    principle: "Knowing when and how to leave a conversation is as important as knowing how to begin one.",
    body: "A well-timed departure preserves goodwill and leaves a positive final impression. Signal your intention with a warm closing remark before withdrawing; avoid the habit of lingering after a natural ending point has passed. The graceful exit is not retreat — it is attentiveness to the rhythm of the encounter.",
  },
  {
    id: "language-of-gratitude",
    name: "The Language of Gratitude",
    principle: "Expressed appreciation, when specific and sincere, strengthens the bonds that sophisticated social life depends upon.",
    body: "Generic thanks evaporate from memory; specific thanks endure. Name precisely what you appreciated — the care taken in an arrangement, the patience shown during difficulty, the generosity of a well-timed recommendation. A brief handwritten note carries a weight that digital messages rarely match.",
  },
];

interface BehaviorSkillsCarouselProps {
  hasFullAccess: boolean;
}

export function BehaviorSkillsCarousel({ hasFullAccess }: BehaviorSkillsCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const skill = BEHAVIOR_SKILLS[activeIndex];
  const total = BEHAVIOR_SKILLS.length;

  const goPrev = () => setActiveIndex((i) => Math.max(0, i - 1));
  const goNext = () => setActiveIndex((i) => Math.min(total - 1, i + 1));

  return (
    <section className="space-y-5" aria-label="Behavior Skills">
      {/* Header row */}
      <div className="flex items-end justify-between gap-4 px-0.5">
        <div className="space-y-1">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/70">
            Behavior Skills
          </p>
          <p className="text-sm text-muted-foreground font-light leading-snug max-w-sm">
            Principles of graceful interaction — from first words to final impressions.
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={goPrev}
            disabled={activeIndex === 0}
            aria-label="Previous skill"
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
            aria-label="Next skill"
            className="flex items-center justify-center w-8 h-8 rounded-sm border border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Single card — full width, fade transition via key */}
      <article
        key={skill.id}
        className="w-full border border-border/50 bg-card rounded-sm p-5 flex flex-col gap-3 animate-in fade-in duration-200"
        aria-label={skill.name}
      >
        <div className="space-y-1.5">
          <h3 className="font-serif text-base text-foreground leading-snug">
            {skill.name}
          </h3>
          <p className="text-xs font-light italic text-primary/80 leading-relaxed border-l border-primary/20 pl-3">
            {skill.principle}
          </p>
        </div>

        <p className="text-sm text-muted-foreground font-light leading-relaxed flex-1">
          {skill.body}
        </p>

        <div className="pt-2 border-t border-border/30">
          {hasFullAccess ? (
            <Link href={`/counsel/skills/${skill.id}`}>
              <div className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline underline-offset-2 cursor-pointer group transition-colors">
                Explore further
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
              </div>
            </Link>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/40 border border-muted-foreground/15 rounded-[2px] px-2 py-1">
              <Crown className="w-2.5 h-2.5" aria-hidden="true" />
              Traveller &amp; above
            </div>
          )}
        </div>
      </article>

      {/* Dot navigation */}
      <div className="flex items-center justify-center gap-1.5" aria-label="Carousel position" role="tablist">
        {BEHAVIOR_SKILLS.map((s, i) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={i === activeIndex}
            aria-label={`Go to ${s.name}`}
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
