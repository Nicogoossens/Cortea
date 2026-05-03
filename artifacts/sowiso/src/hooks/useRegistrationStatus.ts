import { useEffect, useState } from "react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export type RegistrationStatus = {
  registration_open: boolean;
  closed_beta: boolean;
};

let cached: RegistrationStatus | null = null;
let inflight: Promise<RegistrationStatus> | null = null;

async function fetchStatus(): Promise<RegistrationStatus> {
  if (cached) return cached;
  if (inflight) return inflight;
  inflight = fetch(`${API_BASE}/api/system/registration-status`, {
    credentials: "include",
  })
    .then((r) => r.json())
    .then((data: RegistrationStatus) => {
      cached = data;
      return data;
    })
    .catch(() => ({ registration_open: true, closed_beta: false } as RegistrationStatus))
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/**
 * Returns the current registration status. While the request is in-flight the
 * returned object reports `registration_open: true` so we don't briefly hide
 * the register link on cold-load. Once the response arrives we re-render with
 * the real value, which causes the link/page to switch to closed-beta mode.
 */
export function useRegistrationStatus(): RegistrationStatus {
  const [status, setStatus] = useState<RegistrationStatus>(
    cached ?? { registration_open: true, closed_beta: false }
  );
  useEffect(() => {
    let cancelled = false;
    fetchStatus().then((s) => {
      if (!cancelled) setStatus(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return status;
}

/** Read the `?invite=…` query param from the current URL. */
export function getInviteFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const v = new URLSearchParams(window.location.search).get("invite");
  return v ? v.trim() : null;
}
