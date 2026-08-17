import type { GameState, HighScoreRecord } from './types';

const HIGHSCORE_KEY = 'valturne_highscores_v1';
const SAVED_GAME_KEY = 'valturne_saved_state_v1';

// In-memory fallback if localStorage is unavailable
const memoryStorage = new Map<string, string>();

function getStorageItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.getItem === 'function') {
      return window.localStorage.getItem(key);
    }
  } catch (_e) {
    // Ignore error
  }
  return memoryStorage.get(key) ?? null;
}

function setStorageItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.setItem === 'function') {
      window.localStorage.setItem(key, value);
      return;
    }
  } catch (_e) {
    // Ignore error
  }
  memoryStorage.set(key, value);
}

function removeStorageItem(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.removeItem === 'function') {
      window.localStorage.removeItem(key);
      return;
    }
  } catch (_e) {
    // Ignore error
  }
  memoryStorage.delete(key);
}

export function getHighScores(): HighScoreRecord[] {
  try {
    const raw = getStorageItem(HIGHSCORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_e) {
    return [];
  }
}

export function saveHighScore(entry: Omit<HighScoreRecord, 'id' | 'date'>): HighScoreRecord[] {
  try {
    const existing = getHighScores();
    const newRecord: HighScoreRecord = {
      ...entry,
      id: `score-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date: new Date().toISOString().split('T')[0],
    };
    const updated = [...existing, newRecord].sort((a, b) => b.finalScore - a.finalScore).slice(0, 10);
    setStorageItem(HIGHSCORE_KEY, JSON.stringify(updated));
    return updated;
  } catch (_e) {
    return [];
  }
}

export function saveGameState(state: GameState): void {
  try {
    setStorageItem(SAVED_GAME_KEY, JSON.stringify(state));
  } catch (_e) {
    // Ignore storage errors
  }
}

export function loadGameState(): GameState | null {
  try {
    const raw = getStorageItem(SAVED_GAME_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch (_e) {
    return null;
  }
}

export function clearGameState(): void {
  try {
    removeStorageItem(SAVED_GAME_KEY);
  } catch (_e) {
    // Ignore storage errors
  }
}

export function clearAllStorage(): void {
  removeStorageItem(HIGHSCORE_KEY);
  removeStorageItem(SAVED_GAME_KEY);
  memoryStorage.clear();
}
