import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

const USER_ID_KEY = "sowiso_user_id";
const USER_NAME_KEY = "sowiso_user_name";

interface AuthState {
  userId: string | null;
  userName: string | null;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (userId: string, userName?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(() => localStorage.getItem(USER_ID_KEY));
  const [userName, setUserName] = useState<string | null>(() => localStorage.getItem(USER_NAME_KEY));

  const login = useCallback((uid: string, name?: string) => {
    localStorage.setItem(USER_ID_KEY, uid);
    if (name) localStorage.setItem(USER_NAME_KEY, name);
    setUserId(uid);
    setUserName(name ?? null);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USER_NAME_KEY);
    setUserId(null);
    setUserName(null);
  }, []);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === USER_ID_KEY) setUserId(e.newValue);
      if (e.key === USER_NAME_KEY) setUserName(e.newValue);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <AuthContext.Provider value={{ userId, userName, isAuthenticated: !!userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
