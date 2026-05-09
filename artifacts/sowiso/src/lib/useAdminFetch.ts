import { useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

/**
 * Returns an `adminFetch` wrapper that behaves like `fetch` but automatically
 * signs the user out and redirects to /signin whenever a 403 is received.
 * This handles mid-session admin privilege expiry across all admin tab fetches.
 */
export function useAdminFetch() {
  const { logout } = useAuth();
  const [, setLocation] = useLocation();

  const adminFetch = useCallback(
    (url: string, options?: RequestInit): Promise<Response> => {
      const opts: RequestInit = { credentials: "include", ...options };
      return fetch(url, opts).then((res) => {
        if (res.status === 403) {
          logout();
          setLocation("/signin?error=session_expired");
        }
        return res;
      });
    },
    [logout, setLocation]
  );

  return adminFetch;
}
