import { useEffect } from "react";

export function usePageTitle(title: string | null | undefined) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} — Cortéa` : "Cortéa";
    return () => {
      document.title = prev;
    };
  }, [title]);
}
