import React, { createContext, useContext, useState, useCallback } from "react";

const PRIVACY_KEY = "sowiso_privacy_settings";

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

function loadSettings(): PrivacySettings {
  try {
    const stored = localStorage.getItem(PRIVACY_KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {
    // ignore
  }
  return { ...DEFAULT_SETTINGS };
}

interface PrivacyContextValue {
  settings: PrivacySettings;
  updateSetting: <K extends keyof PrivacySettings>(key: K, value: PrivacySettings[K]) => void;
  setIncognito: (enabled: boolean) => void;
  canUseCamera: boolean;
  canUseMicrophone: boolean;
  canUseLocation: boolean;
}

const PrivacyContext = createContext<PrivacyContextValue | null>(null);

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PrivacySettings>(loadSettings);

  const updateSetting = useCallback(<K extends keyof PrivacySettings>(key: K, value: PrivacySettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(PRIVACY_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setIncognito = useCallback((enabled: boolean) => {
    setSettings((prev) => {
      const next: PrivacySettings = enabled
        ? { ...prev, incognito: true, cameraEnabled: false, microphoneEnabled: false, locationEnabled: false }
        : { ...prev, incognito: false, cameraEnabled: true, microphoneEnabled: true, locationEnabled: true };
      localStorage.setItem(PRIVACY_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const canUseCamera = !settings.incognito && settings.cameraEnabled;
  const canUseMicrophone = !settings.incognito && settings.microphoneEnabled;
  const canUseLocation = !settings.incognito && settings.locationEnabled;

  return (
    <PrivacyContext.Provider value={{ settings, updateSetting, setIncognito, canUseCamera, canUseMicrophone, canUseLocation }}>
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
