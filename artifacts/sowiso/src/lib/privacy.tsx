import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";

const PRIVACY_KEY_PREFIX = "sowiso_privacy_settings";
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

interface PrivacySettings {
  incognito: boolean;
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  locationEnabled: boolean;
  autoCleanup: boolean;
}

const DEFAULT_SETTINGS: PrivacySettings = {
  incognito: false,
  cameraEnabled: true,
  microphoneEnabled: true,
  locationEnabled: true,
  autoCleanup: false,
};

function privacyKey(userId: string | null): string {
  return userId ? `${PRIVACY_KEY_PREFIX}_${userId}` : PRIVACY_KEY_PREFIX;
}

function loadSettings(userId: string | null): PrivacySettings | null {
  try {
    const stored = localStorage.getItem(privacyKey(userId));
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {
    // ignore
  }
  return null;
}

interface PrivacyContextValue {
  settings: PrivacySettings;
  updateSetting: <K extends keyof PrivacySettings>(key: K, value: PrivacySettings[K]) => void;
  setIncognito: (enabled: boolean) => void;
  refreshFromServer: () => Promise<void>;
  canUseCamera: boolean;
  canUseMicrophone: boolean;
  canUseLocation: boolean;
}

const PrivacyContext = createContext<PrivacyContextValue | null>(null);

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, userId } = useAuth();

  const [settings, setSettings] = useState<PrivacySettings>(
    () => loadSettings(userId) ?? { ...DEFAULT_SETTINGS }
  );

  const hydratedRef = useRef<string | null>(null);

  // Reset in-memory settings to defaults whenever the user signs out
  useEffect(() => {
    if (!isAuthenticated) {
      setSettings({ ...DEFAULT_SETTINGS });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      hydratedRef.current = null;
      return;
    }

    if (hydratedRef.current === userId) return;

    const localSettings = localStorage.getItem(privacyKey(userId));
    if (localSettings) {
      hydratedRef.current = userId;
      return;
    }

    fetch(`${API_BASE}/api/users/profile`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((profile: { privacy_settings?: PrivacySettings | null } | null) => {
        if (!profile?.privacy_settings) return;
        const serverSettings = { ...DEFAULT_SETTINGS, ...profile.privacy_settings };
        localStorage.setItem(privacyKey(userId), JSON.stringify(serverSettings));
        setSettings(serverSettings);
      })
      .finally(() => {
        hydratedRef.current = userId;
      });
  }, [isAuthenticated, userId]);

  function syncToServer(next: PrivacySettings): void {
    if (!isAuthenticated) return;
    fetch(`${API_BASE}/api/users/profile/privacy`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    }).catch(() => {});
  }

  const updateSetting = useCallback(<K extends keyof PrivacySettings>(key: K, value: PrivacySettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(privacyKey(userId), JSON.stringify(next));
      syncToServer(next);
      return next;
    });
  }, [isAuthenticated, userId]);

  const setIncognito = useCallback((enabled: boolean) => {
    setSettings((prev) => {
      const next: PrivacySettings = enabled
        ? { ...prev, incognito: true, cameraEnabled: false, microphoneEnabled: false, locationEnabled: false }
        : { ...prev, incognito: false, cameraEnabled: true, microphoneEnabled: true, locationEnabled: true };
      localStorage.setItem(privacyKey(userId), JSON.stringify(next));
      syncToServer(next);
      return next;
    });
  }, [isAuthenticated, userId]);

  const refreshFromServer = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated || !userId) return false;
    const profile = await fetch(`${API_BASE}/api/users/profile`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null) as { privacy_settings?: PrivacySettings | null } | null;
    if (!profile?.privacy_settings) return false;
    const serverSettings = { ...DEFAULT_SETTINGS, ...profile.privacy_settings };
    localStorage.setItem(privacyKey(userId), JSON.stringify(serverSettings));
    setSettings(serverSettings);
    return true;
  }, [isAuthenticated, userId]);

  const canUseCamera = !settings.incognito && settings.cameraEnabled;
  const canUseMicrophone = !settings.incognito && settings.microphoneEnabled;
  const canUseLocation = !settings.incognito && settings.locationEnabled;

  return (
    <PrivacyContext.Provider value={{ settings, updateSetting, setIncognito, refreshFromServer, canUseCamera, canUseMicrophone, canUseLocation }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy(): PrivacyContextValue {
  const ctx = useContext(PrivacyContext);
  if (!ctx) throw new Error("usePrivacy must be used within PrivacyProvider");
  return ctx;
}

export function cleanupScenarioAnswers(): void {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith("scenario_answer_") || key.startsWith("counsel_q_")) {
      localStorage.removeItem(key);
    }
  }
}
