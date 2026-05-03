const STORAGE_KEY = "atelier_active_session";

export interface AtelierSessionUnlock {
  id: string;
  name: string;
  region: string;
  pillar: number;
}

export interface AtelierSession {
  ids: number[];
  index: number;
  answered: number;
  correct: number;
  incorrect: number;
  pillar: number;
  startedAt: string;
  lastAnsweredId?: number;
  unlocks: AtelierSessionUnlock[];
  streakMilestone?: number | null;
  completed?: boolean;
}

export function loadSession(): AtelierSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AtelierSession;
    if (!parsed || !Array.isArray(parsed.ids) || parsed.ids.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: AtelierSession): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export function startSession(ids: number[], pillar: number): AtelierSession {
  const session: AtelierSession = {
    ids,
    index: 0,
    answered: 0,
    correct: 0,
    incorrect: 0,
    pillar,
    startedAt: new Date().toISOString(),
    unlocks: [],
    streakMilestone: null,
  };
  saveSession(session);
  return session;
}

export function recordAnswer(
  session: AtelierSession,
  scenarioId: number,
  wasCorrect: boolean,
  unlock?: AtelierSessionUnlock | null,
  streakMilestone?: number | null,
): AtelierSession {
  const updated: AtelierSession = {
    ...session,
    answered: session.answered + 1,
    correct: session.correct + (wasCorrect ? 1 : 0),
    incorrect: session.incorrect + (wasCorrect ? 0 : 1),
    lastAnsweredId: scenarioId,
    unlocks: unlock ? [...session.unlocks, unlock] : session.unlocks,
    streakMilestone: streakMilestone ?? session.streakMilestone ?? null,
  };
  saveSession(updated);
  return updated;
}

export function advanceSession(session: AtelierSession): AtelierSession {
  const updated: AtelierSession = { ...session, index: session.index + 1 };
  saveSession(updated);
  return updated;
}

export function isLastQuestion(session: AtelierSession): boolean {
  return session.index >= session.ids.length - 1;
}

export function markSessionCompleted(session: AtelierSession): AtelierSession {
  const updated: AtelierSession = { ...session, completed: true };
  saveSession(updated);
  return updated;
}
