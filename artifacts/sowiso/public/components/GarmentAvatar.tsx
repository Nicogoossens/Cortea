import { useEffect, useState, type ReactElement } from "react";

export type GarmentId =
  | "italian_suit"
  | "arabic_thobe"
  | "japanese_hakama"
  | "scottish_tartan";

interface GarmentAvatarProps {
  unlockedIds: Set<string>;
  size?: "sm" | "md" | "lg";
  recentlyUnlockedId?: string | null;
  className?: string;
  ariaLabel?: string;
}

const SIZE_PX: Record<NonNullable<GarmentAvatarProps["size"]>, number> = {
  sm: 56,
  md: 96,
  lg: 160,
};

function ItalianSuit({ highlight }: { highlight: boolean }) {
  return (
    <g className={highlight ? "animate-in fade-in zoom-in-95 duration-700" : ""}>
      <path d="M30 52 L50 46 L70 52 L74 96 L26 96 Z" fill="#1c2230" stroke="#0e131c" strokeWidth="0.6" />
      <path d="M50 46 L46 70 L50 74 L54 70 Z" fill="#f5f1ea" />
      <path d="M50 46 L42 60 L46 70 Z" fill="#272f3f" />
      <path d="M50 46 L58 60 L54 70 Z" fill="#272f3f" />
      <circle cx="50" cy="62" r="0.9" fill="#c9a96a" />
      <circle cx="50" cy="68" r="0.9" fill="#c9a96a" />
    </g>
  );
}

function ArabicThobe({ highlight }: { highlight: boolean }) {
  return (
    <g className={highlight ? "animate-in fade-in zoom-in-95 duration-700" : ""}>
      <path d="M28 50 L50 46 L72 50 L76 98 L24 98 Z" fill="#fafaf7" stroke="#d6cfc1" strokeWidth="0.6" />
      <path d="M50 48 L48 96 L52 96 Z" fill="#ece6d6" opacity="0.6" />
      <path d="M40 50 Q50 56 60 50" fill="none" stroke="#c9a96a" strokeWidth="0.5" />
      <path d="M44 54 L56 54" stroke="#c9a96a" strokeWidth="0.4" />
    </g>
  );
}

function JapaneseHakama({ highlight }: { highlight: boolean }) {
  return (
    <g className={highlight ? "animate-in fade-in zoom-in-95 duration-700" : ""}>
      <path d="M30 50 L50 46 L70 50 L72 70 L28 70 Z" fill="#2a2f3a" stroke="#13161e" strokeWidth="0.6" />
      <path d="M50 46 L44 70 L50 72 L56 70 Z" fill="#f3ede1" />
      <path d="M28 70 L72 70 L78 98 L22 98 Z" fill="#3a4256" stroke="#1d2230" strokeWidth="0.6" />
      <path d="M40 70 L38 98 M50 72 L50 98 M60 70 L62 98" stroke="#252b39" strokeWidth="0.5" />
      <rect x="34" y="68" width="32" height="4" fill="#c9a96a" />
    </g>
  );
}

function ScottishTartan({ highlight }: { highlight: boolean }) {
  return (
    <g className={highlight ? "animate-in fade-in zoom-in-95 duration-700" : ""}>
      <path d="M32 52 L50 48 L68 52 L70 74 L30 74 Z" fill="#3b2a26" stroke="#1f1310" strokeWidth="0.6" />
      <path d="M30 74 L70 74 L74 98 L26 98 Z" fill="#7a3a32" />
      <path d="M30 78 L74 78 M30 86 L74 86 M30 94 L74 94" stroke="#1f1310" strokeWidth="0.6" />
      <path d="M38 74 L38 98 M50 74 L50 98 M62 74 L62 98" stroke="#1f1310" strokeWidth="0.6" />
      <path d="M44 74 L44 98 M56 74 L56 98" stroke="#d4a93a" strokeWidth="0.4" opacity="0.7" />
      <path d="M30 82 L74 82 M30 90 L74 90" stroke="#d4a93a" strokeWidth="0.4" opacity="0.7" />
      <path d="M50 48 L46 60 L50 62 L54 60 Z" fill="#f3ede1" />
    </g>
  );
}

const GARMENT_ORDER: GarmentId[] = [
  "italian_suit",
  "arabic_thobe",
  "japanese_hakama",
  "scottish_tartan",
];

const GARMENT_RENDERERS: Record<GarmentId, (p: { highlight: boolean }) => ReactElement> = {
  italian_suit: ItalianSuit,
  arabic_thobe: ArabicThobe,
  japanese_hakama: JapaneseHakama,
  scottish_tartan: ScottishTartan,
};

export function GarmentAvatar({
  unlockedIds,
  size = "lg",
  recentlyUnlockedId = null,
  className = "",
  ariaLabel,
}: GarmentAvatarProps) {
  const px = SIZE_PX[size];
  const [pulseHighlight, setPulseHighlight] = useState<boolean>(!!recentlyUnlockedId);

  useEffect(() => {
    if (!recentlyUnlockedId) return;
    setPulseHighlight(true);
    const t = setTimeout(() => setPulseHighlight(false), 2200);
    return () => clearTimeout(t);
  }, [recentlyUnlockedId]);

  const topGarment: GarmentId | null = (() => {
    for (let i = GARMENT_ORDER.length - 1; i >= 0; i -= 1) {
      if (unlockedIds.has(GARMENT_ORDER[i])) return GARMENT_ORDER[i];
    }
    return null;
  })();

  return (
    <div
      className={`relative ${className}`}
      style={{ width: px, height: px }}
      role="img"
      aria-label={ariaLabel ?? "Social Avatar"}
    >
      {pulseHighlight && (
        <div className="absolute inset-0 rounded-full bg-amber-300/30 blur-xl animate-pulse" aria-hidden="true" />
      )}
      <svg viewBox="0 0 100 100" width={px} height={px} className="relative">
        {/* Head */}
        <circle cx="50" cy="34" r="10" fill="#e7d6bf" stroke="#b89e80" strokeWidth="0.5" />
        {/* Hair */}
        <path d="M40 30 Q50 18 60 30 Q56 26 50 26 Q44 26 40 30 Z" fill="#3b2a1f" />
        {/* Neck */}
        <rect x="46" y="42" width="8" height="6" fill="#d8c2a6" />
        {/* Default shirt fallback when nothing unlocked */}
        {!topGarment && (
          <path d="M30 52 L50 46 L70 52 L74 96 L26 96 Z" fill="#d6d3cb" stroke="#a8a59b" strokeWidth="0.5" />
        )}
        {topGarment && GARMENT_RENDERERS[topGarment]({ highlight: pulseHighlight && recentlyUnlockedId === topGarment })}
        {/* Ground shadow */}
        <ellipse cx="50" cy="98" rx="20" ry="1.2" fill="#000" opacity="0.08" />
      </svg>
    </div>
  );
}

interface GarmentThumbnailProps {
  id: string;
  unlocked: boolean;
  size?: number;
  className?: string;
}

export function GarmentThumbnail({ id, unlocked, size = 64, className = "" }: GarmentThumbnailProps) {
  const Renderer = GARMENT_RENDERERS[id as GarmentId];
  if (!Renderer) return null;
  return (
    <svg
      viewBox="20 40 60 60"
      width={size}
      height={size}
      className={`${unlocked ? "" : "opacity-20 grayscale"} ${className}`}
      aria-hidden="true"
    >
      <Renderer highlight={false} />
    </svg>
  );
}
