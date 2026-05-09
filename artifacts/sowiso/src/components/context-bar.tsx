import { useState } from "react";
import { Eye, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLocale } from "@/lib/i18n";
import { LOCALE_GROUPS } from "@/lib/i18n-locales";
import { useActiveRegion, FlagEmoji } from "@/lib/active-region";
import { useAccessibility, type FontSize } from "@/lib/accessibility";
import { useLocation } from "wouter";

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
        className="flex items-center gap-1.5 px-2.5 py-1.5 min-h-[44px] rounded-sm text-xs font-mono tracking-wide text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 data-[state=open]:bg-muted/60 data-[state=open]:text-foreground"
      >
        {icon}
        <span className="flex items-center gap-1.5 max-w-[120px] truncate">{children}</span>
        <ChevronDown className="w-3 h-3 opacity-40 flex-shrink-0" aria-hidden="true" />
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
    </DropdownMenuPrimitive.Item>
  );
}


export function ContextBar() {
  const { locale, t } = useLocale();
  const { activeRegion, getRegionName } = useActiveRegion();
  const { highContrast, setHighContrast, fontSize, setFontSize } = useAccessibility();
  const [, navigate] = useLocation();
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  const currentLocale = LOCALE_GROUPS.flatMap((g) => g.locales).find((l) => l.locale === locale);

  const fontSizeOptions: { value: FontSize; labelKey: "accessibility.font_normal" | "accessibility.font_large" | "accessibility.font_xl" }[] = [
    { value: "normal", labelKey: "accessibility.font_normal" },
    { value: "large",  labelKey: "accessibility.font_large" },
    { value: "xl",     labelKey: "accessibility.font_xl" },
  ];

  return (
    <>
      <div
        className="flex items-center justify-between gap-1 px-4 py-1.5 border-b border-border/40 bg-background/60 backdrop-blur-sm overflow-x-hidden"
        role="toolbar"
        aria-label={t("accessibility.title")}
      >
        {/* Active context — opens confirmation before navigating to profile */}
        <button
          type="button"
          onClick={() => setShowProfileDialog(true)}
          className="flex items-center gap-2 text-xs font-mono text-muted-foreground/80 hover:text-foreground transition-colors min-w-0 group cursor-pointer bg-transparent border-0 p-0"
          aria-label={t("nav.profile_nav_aria", "Open profielinstellingen")}
        >
          <FlagEmoji code={currentLocale?.flag ?? "US"} size="sm" className="flex-shrink-0" />
          <span className="font-medium text-foreground/70 truncate hidden xs:block sm:block group-hover:text-foreground transition-colors">
            {currentLocale?.languageLabel ?? "English"}
          </span>
          <span className="text-muted-foreground/40 hidden sm:inline">·</span>
          <FlagEmoji code={activeRegion} size="sm" className="flex-shrink-0 hidden sm:inline-block" />
          <span className="font-medium text-foreground/70 truncate hidden sm:block group-hover:text-foreground transition-colors">
            {getRegionName(activeRegion)}
          </span>
        </button>

        <div className="flex items-center gap-1">

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
            <span className={`hidden sm:inline ${highContrast ? "text-primary font-medium" : ""}`}>
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
      </div>

      <AlertDialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("nav.profile_nav_title", "Naar uw profiel?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("nav.profile_nav_desc", "U verlaat de huidige pagina en gaat naar uw profielinstellingen.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("nav.profile_nav_cancel", "Blijf op pagina")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate("/profile")}>
              {t("nav.profile_nav_confirm", "Ga door")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
