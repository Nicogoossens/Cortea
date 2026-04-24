import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

const USER_ID_KEY = "sowiso_user_id";
const USER_NAME_KEY = "sowiso_user_name";
const IS_ADMIN_KEY = "sowiso_is_admin";

interface AuthState {
  userId: string | null;
  userName: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

interface AuthContextValue extends AuthState {
  login: (userId: string, opts?: { name?: string; isAdmin?: boolean }) => void;
  logout: () => void;
  getAuthHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(() => localStorage.getItem(USER_ID_KEY));
  const [userName, setUserName] = useState<string | null>(() => localStorage.getItem(USER_NAME_KEY));
  const [isAdmin, setIsAdmin] = useState<boolean>(() => localStorage.getItem(IS_ADMIN_KEY) === "true");

  const login = useCallback((uid: string, opts?: { name?: string; isAdmin?: boolean }) => {
    localStorage.setItem(USER_ID_KEY, uid);
    setUserId(uid);
    if (opts?.name) {
      localStorage.setItem(USER_NAME_KEY, opts.name);
      setUserName(opts.name);
    }
    if (opts?.isAdmin !== undefined) {
      localStorage.setItem(IS_ADMIN_KEY, String(opts.isAdmin));
      setIsAdmin(opts.isAdmin);
    }
  }, []);

  const logout = useCallback(() => {
    const currentUserId = localStorage.getItem(USER_ID_KEY);

    try {
      const privacyKey = currentUserId
        ? `sowiso_privacy_settings_${currentUserId}`
        : "sowiso_privacy_settings";
      const privacyRaw = localStorage.getItem(privacyKey);
      if (privacyRaw) {
        const privacySettings = JSON.parse(privacyRaw) as { autoCleanup?: boolean };
        if (privacySettings.autoCleanup) {
          for (const key of Object.keys(localStorage)) {
            if (key.startsWith("scenario_answer_") || key.startsWith("counsel_q_")) {
              localStorage.removeItem(key);
            }
          }
        }
      }
    } catch {
      // Privacy settings may not exist or be malformed — safe to ignore
    }

    if (currentUserId) {
      localStorage.removeItem(`sowiso_privacy_settings_${currentUserId}`);
    }
    localStorage.removeItem("sowiso_privacy_settings");

    const apiBase = (import.meta as { env: Record<string, string> }).env.VITE_API_BASE_URL ?? "";

    // Clear privacy_settings on the server (fire-and-forget, uses HttpOnly cookie)
    fetch(`${apiBase}/api/users/profile/privacy`, {
      method: "DELETE",
      credentials: "include",
    }).catch(() => {});

    // Invalidate the session cookie server-side
    fetch(`${apiBase}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});

    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USER_NAME_KEY);
    localStorage.removeItem(IS_ADMIN_KEY);
    setUserId(null);
    setUserName(null);
    setIsAdmin(false);
  }, []);

  /**
   * Returns an empty object — authentication is now handled via HttpOnly cookie.
   * Kept for API compatibility; callers should use `credentials: 'include'` on fetch calls.
   */
  const getAuthHeaders = useCallback((): Record<string, string> => {
    return {};
  }, []);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === USER_ID_KEY) setUserId(e.newValue);
      if (e.key === USER_NAME_KEY) setUserName(e.newValue);
      if (e.key === IS_ADMIN_KEY) setIsAdmin(e.newValue === "true");
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <AuthContext.Provider value={{ userId, userName, isAuthenticated: !!userId, isAdmin, login, logout, getAuthHeaders }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
