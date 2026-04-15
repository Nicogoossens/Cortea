import { useState, useRef, useCallback } from "react";

export interface QualityResult {
  pass: boolean;
  score: number;
  hint: string | null;
}

const DEBOUNCE_MS = 900;
const MIN_LENGTH  = 30;

export function useRegisterQuality(locale: string) {
  const [result, setResult]   = useState<QualityResult | null>(null);
  const [checking, setChecking] = useState(false);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef  = useRef<AbortController | null>(null);

  const check = useCallback((text: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (text.trim().length < MIN_LENGTH) {
      setResult(null);
      return;
    }

    timerRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      setChecking(true);
      try {
        const res = await fetch("/api/register-quality/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.trim(), locale }),
          signal: abortRef.current.signal,
        });
        if (res.ok) {
          const data: QualityResult = await res.json();
          setResult(data);
        }
      } catch {
        // Ignore aborts
      } finally {
        setChecking(false);
      }
    }, DEBOUNCE_MS);
  }, [locale]);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortRef.current) abortRef.current.abort();
    setResult(null);
    setChecking(false);
  }, []);

  return { result, checking, check, reset };
}
