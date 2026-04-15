import { Check, Globe, MapPin, ChevronDown, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { useLocale, LOCALE_GROUPS, type SupportedLocale } from "@/lib/i18n";
import { useActiveRegion, COMPASS_REGIONS, FlagEmoji, isRegionActive, type RegionCode } from "@/lib/active-region";
import { useAccessibility, type FontSize } from "@/lib/accessibility";

function PillTrigger({
  icon,
  children,
  ariaLabel,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  return (
    <DropdownMenuTrigger asChild>
      <button
        aria-label={ariaLabel}
        className="flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] rounded-sm text-xs font-mono tracking-wide text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 data-[state=open]:bg-muted/60 data-[state=open]:text-foreground"
      >
        {icon}
        <span className="hidden sm:flex items-center gap-1.5">{children}</span>
        <ChevronDown className="w-3 h-3 opacity-40" aria-hidden="true" />
      </button>
    </DropdownMenuTrigger>
  );
}

function Item({
  selected,
  onClick,
  children,
}: {
  selected?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenuPrimitive.Item
      onSelect={onClick}
      className={`flex items-center gap-2.5 px-3 py-2.5 text-xs cursor-pointer outline-none select-none transition-colors rounded-sm mx-1 ${
        selected
          ? "bg-primary/10 text-primary font-medium"
          : "text-foreground/80 hover:bg-muted/50 hover:text-foreground focus:bg-muted/50 focus:text-foreground"
      }`}
    >
      {children}
      {selected && <Check className="w-3 h-3 ml-auto flex-shrink-0" aria-hidden="true" />}
    </DropdownMenuPrimitive.Item>
  );
}


export function ContextBar() {
  const { locale, setLocale, t } = useLocale();
  const { activeRegion, setActiveRegion, getRegionName } = useActiveRegion();
  const { highContrast, setHighContrast, fontSize, setFontSize } = useAccessibility();

  const currentLocale = LOCALE_GROUPS.flatMap((g) => g.locales).find((l) => l.locale === locale);

  const fontSizeOptions: { value: FontSize; labelKey: "accessibility.font_normal" | "accessibility.font_large" | "accessibility.font_xl" }[] = [
    { value: "normal", labelKey: "accessibility.font_normal" },
    { value: "large",  labelKey: "accessibility.font_large" },
    { value: "xl",     labelKey: "accessibility.font_xl" },
  ];

  return (
    <div
      className="flex items-center justify-end gap-1 px-4 py-2 border-b border-border/40 bg-background/60 backdrop-blur-sm"
      role="toolbar"
      aria-label={t("accessibility.title")}
    >

      {/* Language picker */}
      <DropdownMenu>
        <PillTrigger
          icon={<Globe className="w-3 h-3" aria-hidden="true" />}
          ariaLabel={t("locale.choose_region")}
        >
          <FlagEmoji code={currentLocale?.flag ?? "US"} />
          <span>{currentLocale?.languageLabel ?? "English"}</span>
        </PillTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={6}
          className="z-50 min-w-[220px] max-h-[320px] overflow-y-auto bg-background border border-border rounded-sm shadow-lg p-0"
          aria-label={t("locale.choose_region")}
        >
          <div className="px-3 py-2 border-b border-border/30 sticky top-0 bg-background z-10">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
              {t("locale.choose_region")}
            </span>
          </div>

          <div className="py-1">
            {LOCALE_GROUPS.map((group) => {
              const representative = group.locales[0];
              const isSelected = group.locales.some((l) => l.locale === locale);
              return (
                <Item
                  key={group.groupLabel}
                  selected={isSelected}
                  onClick={() => setLocale(representative.locale as SupportedLocale)}
                >
                  <FlagEmoji code={representative.flag} />
                  <span className="flex-1">{group.groupLabel}</span>
                </Item>
              );
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-px h-4 bg-border/60 mx-1" aria-hidden="true" />

      {/* Region picker */}
      <DropdownMenu>
        <PillTrigger
          icon={<MapPin className="w-3 h-3" aria-hidden="true" />}
          ariaLabel={t("region.choose")}
        >
          <FlagEmoji code={activeRegion} />
          <span>{getRegionName(activeRegion)}</span>
        </PillTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={6}
          className="z-50 min-w-[220px] max-h-[320px] overflow-y-auto bg-background border border-border rounded-sm shadow-lg p-0"
          aria-label={t("region.choose")}
        >
          <div className="px-3 py-2 border-b border-border/30 sticky top-0 bg-background z-10">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
              {t("region.choose")}
            </span>
          </div>

          <div className="py-1">
            {COMPASS_REGIONS.map((region) => {
              const fullContent = isRegionActive(region.code);
              return (
                <Item
                  key={region.code}
                  selected={region.code === activeRegion}
                  onClick={() => setActiveRegion(region.code as RegionCode)}
                >
                  <FlagEmoji code={region.flag} />
                  <span className="flex-1">{getRegionName(region.code)}</span>
                  {!fullContent && (
                    <span className="text-[9px] font-mono uppercase tracking-widest border border-current/20 rounded-[2px] px-1 py-0.5 leading-none shrink-0 opacity-50">
                      {t("region.in_preparation")}
                    </span>
                  )}
                </Item>
              );
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-px h-4 bg-border/60 mx-1" aria-hidden="true" />

      {/* Accessibility picker */}
      <DropdownMenu>
        <PillTrigger
          icon={
            <Eye
              className={`w-3 h-3 ${highContrast ? "text-primary" : ""}`}
              aria-hidden="true"
            />
          }
          ariaLabel={t("accessibility.title")}
        >
          <span className={highContrast ? "text-primary font-medium" : ""}>
            {t("accessibility.title")}
          </span>
        </PillTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={6}
          className="z-50 min-w-[200px] bg-background border border-border rounded-sm shadow-lg p-0"
          aria-label={t("accessibility.title")}
        >
          {/* High contrast toggle */}
          <div className="px-3 py-2 border-b border-border/30">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
              {t("accessibility.high_contrast")}
            </span>
          </div>
          <div className="py-1">
            <Item selected={!highContrast} onClick={() => setHighContrast(false)}>
              <span className="flex-1">{t("accessibility.font_normal")}</span>
            </Item>
            <Item selected={highContrast} onClick={() => setHighContrast(true)}>
              <span className="flex-1">{t("accessibility.high_contrast")}</span>
            </Item>
          </div>

          {/* Font size */}
          <div className="px-3 py-2 border-t border-b border-border/30">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
              {t("accessibility.font_size")}
            </span>
          </div>
          <div className="py-1">
            {fontSizeOptions.map((opt) => (
              <Item
                key={opt.value}
                selected={fontSize === opt.value}
                onClick={() => setFontSize(opt.value)}
              >
                <span className="flex-1">{t(opt.labelKey)}</span>
              </Item>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

    </div>
  );
}
