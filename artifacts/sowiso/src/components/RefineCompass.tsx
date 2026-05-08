import { useState } from "react";
import { Lock, Info } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

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


type FiveValues = [number, number, number, number, number];

interface ShadowPolygon {
  values: FiveValues;
  fillOpacity: number;
  strokeOpacity: number;
}

interface PentagonProps {
  values: FiveValues;
  shadowPolygons: ShadowPolygon[];
  labels: [string, string, string, string, string];
  svgAriaLabel?: string;
  color?: string;
  hoveredIdx: number | null;
  onHover: (idx: number | null) => void;
}

function PentagonWithShadow({
  values,
  shadowPolygons,
  labels,
  svgAriaLabel = "Refinement Compass",
  color = "var(--primary)",
  hoveredIdx,
  onHover,
}: PentagonProps) {
  const cx = 130;
  const cy = 130;
  const maxR = 100;
  const angles = [-90, -18, 54, 126, 198].map((a) => (a * Math.PI) / 180);

  function pt(r: number, i: number): string {
    return `${cx + r * Math.cos(angles[i])},${cy + r * Math.sin(angles[i])}`;
  }

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const dataPoints = values.map((v, i) => pt((Math.min(v, 100) / 100) * maxR, i)).join(" ");

  return (
    <svg
      width="260"
      height="260"
      viewBox="0 0 260 260"
      className="mx-auto"
      role="img"
      aria-label={svgAriaLabel}
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

      {shadowPolygons.map((sp, idx) => (
        <polygon
          key={idx}
          points={sp.values.map((v, i) => pt((Math.min(v, 100) / 100) * maxR, i)).join(" ")}
          fill="currentColor"
          fillOpacity={sp.fillOpacity}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 2"
          strokeOpacity={sp.strokeOpacity}
          className="text-muted-foreground"
        />
      ))}

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
            aria-label={`${labels[i]}: ${v}`}
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
  const { t, locale } = useLanguage();

  if (elitePrivacyMode && isPublicView) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <Lock className="w-8 h-8 text-muted-foreground/30" aria-hidden="true" />
        <p className="font-serif text-muted-foreground italic">
          {t("profile.compass.elite_private")}
        </p>
      </div>
    );
  }

  const currentValues: FiveValues = behaviorProfile
    ? behaviorToRadar(behaviorProfile)
    : [50, 50, 50, 50, 50];

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const historyInWindow = compassHistory
    .filter((p) => new Date(p.recorded_at) >= thirtyDaysAgo)
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());

  // Build a gradient of shadow polygons: oldest = most transparent, newest = darkest.
  // Each history point gets opacity proportional to its position in the 30-day window.
  const shadowPolygons: ShadowPolygon[] = historyInWindow.map((point, idx) => {
    const fraction = historyInWindow.length === 1 ? 0 : idx / (historyInWindow.length - 1);
    return {
      values: [
        point.attentiveness,
        point.composure,
        point.discernment,
        point.diplomacy,
        point.presence,
      ] as FiveValues,
      fillOpacity: 0.03 + fraction * 0.07,
      strokeOpacity: 0.12 + fraction * 0.22,
    };
  });

  // For delta display and reason text, compare current vs earliest point in window
  const earliestPoint = historyInWindow.length > 0 ? historyInWindow[0] : null;
  const earliestValues: FiveValues | null = earliestPoint
    ? [
        earliestPoint.attentiveness,
        earliestPoint.composure,
        earliestPoint.discernment,
        earliestPoint.diplomacy,
        earliestPoint.presence,
      ]
    : null;

  const hasHistory = historyInWindow.length > 0;

  const LABELS: [string, string, string, string, string] = [
    t("profile.compass.attentiveness"),
    t("profile.compass.composure"),
    t("profile.compass.discernment"),
    t("profile.compass.diplomacy"),
    t("profile.compass.presence"),
  ];

  function buildReasonText(key: DimensionKey, delta: number | null): string | null {
    if (delta === null) return null;
    const dimension = t(`profile.compass.${key}`);
    if (delta === 0) return t("profile.compass.score_stable", { dimension });
    if (delta > 0) return t("profile.compass.score_rose", { dimension, delta: `+${delta}` });
    return t("profile.compass.score_fell", { dimension, delta: String(delta) });
  }

  return (
    <div className="flex flex-col md:flex-row items-start gap-8">
      <div className="flex-shrink-0">
        <PentagonWithShadow
          values={currentValues}
          shadowPolygons={shadowPolygons}
          labels={LABELS}
          svgAriaLabel={t("profile.compass.radar_aria")}
          hoveredIdx={hoveredDim}
          onHover={setHoveredDim}
        />
        {hasHistory && (
          <p className="text-center text-[10px] font-mono text-muted-foreground/50 mt-1 leading-snug">
            {t("profile.compass.legend")}
          </p>
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        {DIMENSION_KEYS.map((key, i) => {
          const current = currentValues[i];
          const historical = earliestValues?.[i] ?? null;
          const delta = historical !== null ? current - historical : null;
          const isHovered = hoveredDim === i;
          const reasonText = buildReasonText(key, delta);

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
                    {t(`profile.compass.${key}`)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setHoveredDim(isHovered ? null : i)}
                    className="text-muted-foreground/30 hover:text-muted-foreground transition-colors"
                    aria-label={t("profile.compass.def_info_aria", { dimension: t(`profile.compass.${key}`) })}
                  >
                    <Info className="w-3 h-3" aria-hidden="true" />
                  </button>
                </div>
                <div className="flex items-baseline gap-1.5 shrink-0">
                  <span className="text-xs font-mono text-foreground">
                    {historical !== null && historical !== current ? (
                      <>
                        {current}{" "}
                        <span className="text-[10px] text-muted-foreground/50">({t("profile.compass.was_label")} {historical})</span>
                      </>
                    ) : (
                      current
                    )}
                  </span>
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
                aria-label={t("profile.compass.dot_aria", { dimension: t(`profile.compass.${key}`), score: current })}
              >
                <div
                  className="h-full bg-primary/70 transition-all duration-700"
                  style={{ width: `${current}%` }}
                />
              </div>

              {isHovered && (() => {
                // Derive per-dimension session changes from history:
                // each point where this dimension's value changed counts
                // as a "recent session that influenced the score".
                const dimChanges = historyInWindow.reduce<Array<{ date: string; delta: number }>>((acc, point, idx) => {
                  if (idx === 0) return acc;
                  const prev = historyInWindow[idx - 1];
                  const d = Math.round(point[key] - prev[key]);
                  if (d !== 0) {
                    acc.push({
                      date: new Date(point.recorded_at).toLocaleDateString(locale, { day: "numeric", month: "short" }),
                      delta: d,
                    });
                  }
                  return acc;
                }, []);
                return (
                  <div className="space-y-0.5 animate-in fade-in duration-150">
                    <p className="text-[11px] text-muted-foreground/80 font-light leading-relaxed">
                      {t(`profile.compass.dim_def.${key}`)}
                    </p>
                    {reasonText && (
                      <p className="text-[11px] text-muted-foreground/60 font-light italic leading-relaxed">
                        {t("profile.compass.reason_label")} {reasonText}
                      </p>
                    )}
                    {dimChanges.length > 0 && (
                      <div className="pt-0.5 space-y-0.5">
                        <p className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-wider leading-none">
                          {t("profile.compass.recent_sessions")}
                        </p>
                        {dimChanges.slice(-3).reverse().map((s, sIdx) => (
                          <p key={sIdx} className="text-[11px] text-muted-foreground/55 font-light leading-snug">
                            {s.date}&nbsp;
                            <span className={s.delta > 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}>
                              {s.delta > 0 ? `+${s.delta}` : String(s.delta)}
                            </span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          );
        })}

        <ul className="sr-only" aria-label={t("profile.compass.title")}>
          {DIMENSION_KEYS.map((key, i) => (
            <li key={key}>
              {t(`profile.compass.${key}`)}: {currentValues[i]}. {t(`profile.compass.dim_def.${key}`)}
            </li>
          ))}
        </ul>

        {!behaviorProfile && (
          <p className="text-[11px] text-muted-foreground/60 font-light italic pt-3">
            {t("profile.compass.empty_state")}
          </p>
        )}
      </div>
    </div>
  );
}
