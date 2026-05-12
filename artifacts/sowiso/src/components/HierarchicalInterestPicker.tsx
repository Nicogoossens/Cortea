import React, { useState } from "react";
import { ChevronRight, ChevronLeft, X, Search } from "lucide-react";

export interface CatalogItem {
  slug: string;
  taxonomy: string;
  label_i18n_key: string;
  registers: string[];
  display_order: number;
  parent_slug: string | null;
}

interface Props {
  taxonomy: string;
  items: CatalogItem[];
  selected: string[];
  onChange: (slugs: string[]) => void;
  max?: number;
  t: (key: string) => string;
}

export function HierarchicalInterestPicker({
  items,
  selected,
  onChange,
  max = 6,
  t,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedParent, setExpandedParent] = useState<string | null>(null);
  const [pendingChildren, setPendingChildren] = useState<string[]>([]);

  const parents = items.filter((i) => i.parent_slug === null);
  const getChildren = (parentSlug: string) =>
    items.filter((i) => i.parent_slug === parentSlug);

  const query = searchQuery.trim().toLowerCase();
  const filteredSearch = query
    ? items.filter((i) => t(i.label_i18n_key).toLowerCase().includes(query))
    : [];

  function getParentLabel(item: CatalogItem): string | null {
    if (!item.parent_slug) return null;
    const parent = items.find((i) => i.slug === item.parent_slug);
    return parent ? t(parent.label_i18n_key) : null;
  }

  function toggleItem(slug: string) {
    if (selected.includes(slug)) {
      onChange(selected.filter((s) => s !== slug));
    } else if (selected.length < max) {
      onChange([...selected, slug]);
    }
  }

  function handleParentClick(item: CatalogItem) {
    const children = getChildren(item.slug);
    if (children.length === 0) {
      toggleItem(item.slug);
    } else {
      const alreadySelected = children
        .filter((c) => selected.includes(c.slug))
        .map((c) => c.slug);
      setPendingChildren(alreadySelected);
      setExpandedParent(item.slug);
    }
  }

  function handleConfirmChildren() {
    if (!expandedParent) return;
    const children = getChildren(expandedParent);
    const childSlugs = children.map((c) => c.slug);
    const withoutOld = selected.filter((s) => !childSlugs.includes(s));
    const next = [...withoutOld, ...pendingChildren].slice(0, max);
    onChange(next);
    setExpandedParent(null);
    setPendingChildren([]);
  }

  function handleSkipSubcategory() {
    if (!expandedParent) return;
    if (!selected.includes(expandedParent) && selected.length < max) {
      onChange([...selected, expandedParent]);
    }
    setExpandedParent(null);
    setPendingChildren([]);
  }

  function togglePending(slug: string) {
    if (pendingChildren.includes(slug)) {
      setPendingChildren(pendingChildren.filter((s) => s !== slug));
    } else {
      const children = expandedParent ? getChildren(expandedParent).map((c) => c.slug) : [];
      const nonChildSelected = selected.filter((s) => !children.includes(s)).length;
      if (nonChildSelected + pendingChildren.length < max) {
        setPendingChildren([...pendingChildren, slug]);
      }
    }
  }

  const selectedLabels = selected
    .map((slug) => {
      const item = items.find((i) => i.slug === slug);
      return item ? { slug, label: t(item.label_i18n_key) } : null;
    })
    .filter(Boolean) as { slug: string; label: string }[];

  function ChipBar() {
    if (selectedLabels.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1.5 mb-1">
        {selectedLabels.map(({ slug, label }) => (
          <span
            key={slug}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm bg-primary/10 text-primary text-xs border border-primary/25 font-medium"
          >
            {label}
            <button
              type="button"
              onClick={() => onChange(selected.filter((s) => s !== slug))}
              className="hover:text-primary/70 transition-colors"
              aria-label={`Remove ${label}`}
            >
              <X className="w-3 h-3" aria-hidden="true" />
            </button>
          </span>
        ))}
        <span className="text-xs text-muted-foreground/50 self-center">
          {selected.length}/{max}
        </span>
      </div>
    );
  }

  if (expandedParent !== null) {
    const parentItem = items.find((i) => i.slug === expandedParent);
    const children = getChildren(expandedParent);
    const parentAlreadySelected = selected.includes(expandedParent);

    return (
      <div className="space-y-3 mt-2">
        <ChipBar />
        <button
          type="button"
          onClick={() => {
            setExpandedParent(null);
            setPendingChildren([]);
          }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          {parentItem ? t(parentItem.label_i18n_key) : "Back"}
        </button>

        <div className="grid grid-cols-2 gap-1.5">
          {children.map((child) => {
            const isPending = pendingChildren.includes(child.slug);
            return (
              <button
                key={child.slug}
                type="button"
                onClick={() => togglePending(child.slug)}
                className={`text-left px-3 py-2 rounded-sm border text-sm transition-all ${
                  isPending
                    ? "bg-primary/10 border-primary/40 text-primary font-medium"
                    : "border-border/50 text-muted-foreground hover:border-primary/30 hover:bg-muted/30 hover:text-foreground"
                }`}
              >
                {t(child.label_i18n_key)}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleSkipSubcategory}
            disabled={parentAlreadySelected || selected.length >= max}
            className="flex-1 px-3 py-2 rounded-sm border border-border/50 text-sm text-muted-foreground hover:border-primary/30 hover:bg-muted/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {parentItem ? t(parentItem.label_i18n_key) : ""} — OK
          </button>
          <button
            type="button"
            onClick={handleConfirmChildren}
            disabled={pendingChildren.length === 0}
            className="flex-1 px-3 py-2 rounded-sm border border-primary/30 bg-primary/5 text-sm text-primary hover:bg-primary/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t("profile.picker_confirm")} ({pendingChildren.length})
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-2">
      <ChipBar />

      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("profile.interests_search_placeholder")}
          className="w-full pl-9 pr-3 py-2 text-sm bg-muted/30 border border-border/40 rounded-sm focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 placeholder:text-muted-foreground/40"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            aria-label={t("profile.interests_search_clear")}
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      {query ? (
        filteredSearch.length === 0 ? (
          <p className="text-xs text-muted-foreground/40 py-3 text-center">
            {t("profile.interests_search_empty")}
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {filteredSearch.map((item) => {
              const isSelected = selected.includes(item.slug);
              const parentLabel = getParentLabel(item);
              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => toggleItem(item.slug)}
                  disabled={!isSelected && selected.length >= max}
                  className={`text-left px-3 py-2 rounded-sm border text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    isSelected
                      ? "bg-primary/10 border-primary/40 text-primary font-medium"
                      : "border-border/50 text-muted-foreground hover:border-primary/30 hover:bg-muted/30 hover:text-foreground"
                  }`}
                >
                  {parentLabel && (
                    <span className="text-muted-foreground/60 text-xs">
                      {parentLabel} ›{" "}
                    </span>
                  )}
                  {t(item.label_i18n_key)}
                </button>
              );
            })}
          </div>
        )
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          {parents.map((item) => {
            const children = getChildren(item.slug);
            const isSelected = selected.includes(item.slug);
            const hasSelectedChildren = children.some((c) =>
              selected.includes(c.slug)
            );
            const isHighlighted = isSelected || hasSelectedChildren;
            return (
              <button
                key={item.slug}
                type="button"
                onClick={() => handleParentClick(item)}
                disabled={
                  !isHighlighted &&
                  selected.length >= max &&
                  children.length === 0
                }
                className={`inline-flex items-center justify-between gap-1.5 px-3 py-2 rounded-sm border text-sm transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed ${
                  isHighlighted
                    ? "bg-primary/10 border-primary/40 text-primary font-medium"
                    : "border-border/50 text-muted-foreground hover:border-primary/30 hover:bg-muted/30 hover:text-foreground"
                }`}
              >
                <span className="truncate">{t(item.label_i18n_key)}</span>
                {children.length > 0 && (
                  <ChevronRight
                    className="w-3.5 h-3.5 shrink-0 opacity-60"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
