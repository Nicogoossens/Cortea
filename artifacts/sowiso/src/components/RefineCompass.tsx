import { useState } from "react";
import { Lock, Info } from "lucide-react";

interface BehaviorProfile {
  listening_score: number;
  assertiveness_style: "assertive" | "passive" | "aggressive" | "passive_aggressive";
  conflict_mode: "collaborate" | "avoid" | "compete" | "accommodate";
  nonverbal_awareness: number;
  eq_dimensions: {
    self_awareness: number;
    self_regulation: number;
    empathy: number;
    social_skill: number;
  };
}

export interface CompassHistoryPoint {
  recorded_at: string;
  attentiveness: number;
  composure: number;
  discernment: number;
  diplomacy: number;
  presence: number;
}

const ASSERTIVENESS_SCORE: Record<string, number> = {
  assertive: 82,
  passive: 42,
  aggressive: 22,
  passive_aggressive: 18,
};

const CONFLICT_SCORE: Record<string, number> = {
  collaborate: 88,
  accommodate: 58,
  avoid: 32,
  compete: 18,
};

function behaviorToRadar(p: BehaviorProfile): [number, number, number, number, number] {
  const attentiveness = p.listening_score;
  const composure = ASSERTIVENESS_SCORE[p.assertiveness_style] ?? 50;
  const discernment = Math.round(
    (p.eq_dimensions.self_awareness +
      p.eq_dimensions.self_regulation +
      p.eq_dimensions.empathy +
      p.eq_dimensions.social_skill) /
      4,
  );
  const diplomacy = CONFLICT_SCORE[p.conflict_mode] ?? 50;
  const presence = p.nonverbal_awareness;
  return [attentiveness, composure, discernment, diplomacy, presence];
}

const DIMENSION_KEYS = [
  "attentiveness",
  "composure",
  "discernment",
  "diplomacy",
  "presence",
] as const;
type DimensionKey = (typeof DIMENSION_KEYS)[number];

const DIMENSION_LABELS: Record<DimensionKey, string> = {
  attentiveness: "Attentiveness",
  composure: "Composure",
  discernment: "Discernment",
  diplomacy: "Diplomacy",
  presence: "Presence",
};

const DIMENSION_DEFS: Record<DimensionKey, string> = {
  attentiveness:
    "Uw vermogen om aanwezig en opmerkzaam te zijn in sociale interacties.",
  composure:
    "De kalmte en zelfbeheersing die u uitstraalt, ook onder druk.",
  discernment:
    "Scherpzinnigheid in het lezen van situaties, intenties en sociale codes.",
  diplomacy:
    "Uw flair om conflicten te navigeren zonder verhoudingen te beschadigen.",
  presence:
    "De subtiele non-verbale indruk die u achterlaat bij anderen.",
};

interface PentagonWithShadowProps {
  values: [number, number, number, number, number];
  shadowValues: [number, number, number, number, number] | null;
  labels: [string, string, string, string, string];
  color?: string;
  hoveredIdx: number | null;
  onHover: (idx: number | null) => void;
}

function PentagonWithShadow({
  values,
  shadowValues,
  labels,
  color = "var(--primary)",
  hoveredIdx,
  onHover,
}: PentagonWithShadowProps) {
  const cx = 130;
  const cy = 130;
  const maxR = 100;
  const angles = [-90, -18, 54, 126, 198].map((a) => (a * Math.PI) / 180);

  function pt(r: number, i: number): string {
    return `${cx + r * Math.cos(angles[i])},${cy + r * Math.sin(angles[i])}`;
  }

  const gridLevels = [0.25, 0.5, 0.75, 1];

  const dataPoints = values.map((v, i) => pt((Math.min(v, 100) / 100) * maxR, i)).join(" ");
  const shadowPoints = shadowValues
    ? shadowValues.map((v, i) => pt((Math.min(v, 100) / 100) * maxR, i)).join(" ")
    : null;

  return (
    <svg
      width="260"
      height="260"
      viewBox="0 0 260 260"
      className="mx-auto"
      role="img"
      aria-label="Refinement Compass radardiagram"
    >
      {gridLevels.map((frac) => (
        <polygon
          key={frac}
          points={angles.map((_, i) => pt(maxR * frac, i)).join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-border"
        />
      ))}
      {angles.map((_, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={cx + maxR * Math.cos(angles[i])}
          y2={cy + maxR * Math.sin(angles[i])}
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-border"
        />
      ))}

      {shadowPoints && (
        <polygon
          points={shadowPoints}
          fill="currentColor"
          fillOpacity={0.06}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="3 2"
          strokeOpacity={0.25}
          className="text-muted-foreground"
        />
      )}

      <polygon
        points={dataPoints}
        fill={color}
        fillOpacity={0.15}
        stroke={color}
        strokeWidth="2"
      />

      {values.map((v, i) => {
        const r = (Math.min(v, 100) / 100) * maxR;
        const x = cx + r * Math.cos(angles[i]);
        const y = cy + r * Math.sin(angles[i]);
        const isHovered = hoveredIdx === i;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={isHovered ? 6 : 4}
            fill={color}
            style={{ transition: "r 0.15s" }}
            onMouseEnter={() => onHover(i)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(i)}
            onBlur={() => onHover(null)}
            tabIndex={0}
            role="img"
            aria-label={`${labels[i]}: ${v} van 100`}
            className="cursor-default outline-none"
          />
        );
      })}

      {labels.map((label, i) => {
        const lR = maxR + 22;
        const x = cx + lR * Math.cos(angles[i]);
        const y = cy + lR * Math.sin(angles[i]);
        const anchor = x < cx - 5 ? "end" : x > cx + 5 ? "start" : "middle";
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize="10"
            fontFamily="var(--font-mono, monospace)"
            letterSpacing="0.08em"
            fill={hoveredIdx === i ? "currentColor" : undefined}
            className={
              hoveredIdx === i
                ? "fill-foreground"
                : "fill-muted-foreground"
            }
            onMouseEnter={() => onHover(i)}
            onMouseLeave={() => onHover(null)}
            style={{ cursor: "default", transition: "fill 0.15s" }}
          >
            {label.toUpperCase()}
          </text>
        );
      })}
    </svg>
  );
}

export interface RefineCompassProps {
  behaviorProfile?: BehaviorProfile | null;
  compassHistory?: CompassHistoryPoint[];
  elitePrivacyMode?: boolean;
  isPublicView?: boolean;
}

export function RefineCompass({
  behaviorProfile,
  compassHistory = [],
  elitePrivacyMode = false,
  isPublicView = false,
}: RefineCompassProps) {
  const [hoveredDim, setHoveredDim] = useState<number | null>(null);

  if (elitePrivacyMode && isPublicView) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <Lock className="w-8 h-8 text-muted-foreground/30" aria-hidden="true" />
        <p className="font-serif text-muted-foreground italic">
          Refinement is een private aangelegenheid.
        </p>
      </div>
    );
  }

  const currentValues: [number, number, number, number, number] = behaviorProfile
    ? behaviorToRadar(behaviorProfile)
    : [50, 50, 50, 50, 50];

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const historyInWindow = compassHistory
    .filter((p) => new Date(p.recorded_at) >= thirtyDaysAgo)
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
  const shadowPoint = historyInWindow.length > 0 ? historyInWindow[0] : null;
  const shadowValues: [number, number, number, number, number] | null = shadowPoint
    ? [
        shadowPoint.attentiveness,
        shadowPoint.composure,
        shadowPoint.discernment,
        shadowPoint.diplomacy,
        shadowPoint.presence,
      ]
    : null;

  const LABELS: [string, string, string, string, string] = [
    DIMENSION_LABELS.attentiveness,
    DIMENSION_LABELS.composure,
    DIMENSION_LABELS.discernment,
    DIMENSION_LABELS.diplomacy,
    DIMENSION_LABELS.presence,
  ];

  return (
    <div className="flex flex-col md:flex-row items-start gap-8">
      <div className="flex-shrink-0">
        <PentagonWithShadow
          values={currentValues}
          shadowValues={shadowValues}
          labels={LABELS}
          hoveredIdx={hoveredDim}
          onHover={setHoveredDim}
        />
        {shadowValues && (
          <p className="text-center text-[10px] font-mono text-muted-foreground/50 mt-1 leading-snug">
            ── huidig &nbsp;·&nbsp; ╌ ╌ 30 dagen geleden
          </p>
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        {DIMENSION_KEYS.map((key, i) => {
          const current = currentValues[i];
          const shadow = shadowValues?.[i] ?? null;
          const delta = shadow !== null ? current - shadow : null;
          const isHovered = hoveredDim === i;

          return (
            <div
              key={key}
              className={`space-y-1 px-2 py-1.5 -mx-2 rounded-sm transition-colors duration-150 ${
                isHovered ? "bg-muted/30" : ""
              }`}
              onMouseEnter={() => setHoveredDim(i)}
              onMouseLeave={() => setHoveredDim(null)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    {DIMENSION_LABELS[key]}
                  </span>
                  <button
                    type="button"
                    onClick={() => setHoveredDim(isHovered ? null : i)}
                    className="text-muted-foreground/30 hover:text-muted-foreground transition-colors"
                    aria-label={`Definitie van ${DIMENSION_LABELS[key]}`}
                  >
                    <Info className="w-3 h-3" aria-hidden="true" />
                  </button>
                </div>
                <div className="flex items-baseline gap-1.5 shrink-0">
                  <span className="text-xs font-mono text-foreground">{current}</span>
                  {delta !== null && (
                    <span
                      className={`text-[10px] font-mono ${
                        delta > 0
                          ? "text-green-600 dark:text-green-400"
                          : delta < 0
                            ? "text-red-500 dark:text-red-400"
                            : "text-muted-foreground/50"
                      }`}
                    >
                      {delta > 0 ? `+${delta}` : delta < 0 ? String(delta) : "="}
                    </span>
                  )}
                </div>
              </div>

              <div
                className="h-1 w-full bg-muted rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={current}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${DIMENSION_LABELS[key]}: ${current} van 100`}
              >
                <div
                  className="h-full bg-primary/70 transition-all duration-700"
                  style={{ width: `${current}%` }}
                />
              </div>

              {isHovered && (
                <p className="text-[11px] text-muted-foreground/80 font-light leading-relaxed animate-in fade-in duration-150">
                  {DIMENSION_DEFS[key]}
                </p>
              )}
            </div>
          );
        })}

        <ul className="sr-only" aria-label="Refinement Compass scores">
          {DIMENSION_KEYS.map((key, i) => (
            <li key={key}>
              {DIMENSION_LABELS[key]}: {currentValues[i]} van 100. {DIMENSION_DEFS[key]}
            </li>
          ))}
        </ul>

        {!behaviorProfile && (
          <p className="text-[11px] text-muted-foreground/60 font-light italic pt-3">
            Scores beginnen bij 50 voor alle dimensies. Ze evolueren naarmate u scenario's oefent.
          </p>
        )}
      </div>
    </div>
  );
}
