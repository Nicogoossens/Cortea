import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

const USER_ID_KEY = "sowiso_user_id";
const USER_NAME_KEY = "sowiso_user_name";
const SESSION_TOKEN_KEY = "sowiso_session_token";
const IS_ADMIN_KEY = "sowiso_is_admin";

interface AuthState {
  userId: string | null;
  userName: string | null;
  sessionToken: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

interface AuthContextValue extends AuthState {
  login: (userId: string, opts?: { name?: string; sessionToken?: string; isAdmin?: boolean }) => void;
  logout: () => void;
  getAuthHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(() => localStorage.getItem(USER_ID_KEY));
  const [userName, setUserName] = useState<string | null>(() => localStorage.getItem(USER_NAME_KEY));
  const [sessionToken, setSessionToken] = useState<string | null>(() => localStorage.getItem(SESSION_TOKEN_KEY));
  const [isAdmin, setIsAdmin] = useState<boolean>(() => localStorage.getItem(IS_ADMIN_KEY) === "true");

  const login = useCallback((uid: string, opts?: { name?: string; sessionToken?: string; isAdmin?: boolean }) => {
    localStorage.setItem(USER_ID_KEY, uid);
    setUserId(uid);
    if (opts?.name) {
      localStorage.setItem(USER_NAME_KEY, opts.name);
      setUserName(opts.name);
    }
    if (opts?.sessionToken) {
      localStorage.setItem(SESSION_TOKEN_KEY, opts.sessionToken);
      setSessionToken(opts.sessionToken);
    }
    if (opts?.isAdmin !== undefined) {
      localStorage.setItem(IS_ADMIN_KEY, String(opts.isAdmin));
      setIsAdmin(opts.isAdmin);
    }
  }, []);

  const logout = useCallback(() => {
    try {
      const privacyRaw = localStorage.getItem("sowiso_privacy_settings");
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
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USER_NAME_KEY);
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(IS_ADMIN_KEY);
    setUserId(null);
    setUserName(null);
    setSessionToken(null);
    setIsAdmin(false);
  }, []);

  /**
   * Returns the Authorization header object to include in mutating API calls.
   * Pass as the `headers` option in fetch or merge into existing headers.
   */
  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, []);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === USER_ID_KEY) setUserId(e.newValue);
      if (e.key === USER_NAME_KEY) setUserName(e.newValue);
      if (e.key === SESSION_TOKEN_KEY) setSessionToken(e.newValue);
      if (e.key === IS_ADMIN_KEY) setIsAdmin(e.newValue === "true");
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <AuthContext.Provider value={{ userId, userName, sessionToken, isAuthenticated: !!userId, isAdmin, login, logout, getAuthHeaders }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
