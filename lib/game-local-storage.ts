import type { GamePhase, GameState } from "@/lib/types";

const STORAGE_KEY = "lila-game-session";
const VERSION = 1 as const;

export type PersistedGameSnapshot = {
  v: typeof VERSION;
  phase: GamePhase;
  position: number;
  hasEntered: boolean;
  entryRollCount: number;
  entryPendingStart: boolean;
  lastRoll: number | null;
  rollHistory: number[];
  playerQuery: string;
  fixedPlayerRequest: string | null;
  lastTransition: GameState["lastTransition"];
  chatMessages: GameState["chatMessages"];
  gameHistory: GameState["gameHistory"];
  activeGameId: string | null;
  finalSummary: string | null;
  actionPlan: string | null;
  completionSynced: boolean;
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseSnapshot(raw: unknown): PersistedGameSnapshot | null {
  if (!isObject(raw)) return null;
  if (raw.v !== VERSION) return null;
  if (raw.phase !== "entry" && raw.phase !== "playing" && raw.phase !== "finished") return null;
  if (typeof raw.position !== "number" || !Number.isFinite(raw.position)) return null;
  if (typeof raw.hasEntered !== "boolean") return null;
  if (typeof raw.entryRollCount !== "number") return null;
  if (typeof raw.entryPendingStart !== "boolean") return null;
  if (raw.lastRoll !== null && typeof raw.lastRoll !== "number") return null;
  if (!Array.isArray(raw.rollHistory)) return null;
  if (typeof raw.playerQuery !== "string") return null;
  if (raw.fixedPlayerRequest !== null && typeof raw.fixedPlayerRequest !== "string") return null;
  if (!Array.isArray(raw.chatMessages)) return null;
  if (!Array.isArray(raw.gameHistory)) return null;
  if (raw.activeGameId !== null && typeof raw.activeGameId !== "string") return null;
  if (raw.finalSummary !== null && typeof raw.finalSummary !== "string") return null;
  if (raw.actionPlan !== null && typeof raw.actionPlan !== "string") return null;
  if (typeof raw.completionSynced !== "boolean") return null;

  return raw as PersistedGameSnapshot;
}

export function loadGameSessionSnapshot(): Partial<GameState> | null {
  if (typeof window === "undefined") return null;
  try {
    const item = window.localStorage.getItem(STORAGE_KEY);
    if (!item) return null;
    const parsed = JSON.parse(item) as unknown;
    const snap = parseSnapshot(parsed);
    if (!snap) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return {
      phase: snap.phase,
      position: snap.position,
      hasEntered: snap.hasEntered,
      entryRollCount: snap.entryRollCount,
      entryPendingStart: snap.entryPendingStart,
      lastRoll: snap.lastRoll,
      isRolling: false,
      rollHistory: snap.rollHistory,
      playerQuery: snap.playerQuery,
      fixedPlayerRequest: snap.fixedPlayerRequest,
      lastTransition: snap.lastTransition,
      chatMessages: snap.chatMessages,
      gameHistory: snap.gameHistory,
      activeGameId: snap.activeGameId,
      finalSummary: snap.finalSummary,
      actionPlan: snap.actionPlan,
      completionSynced: snap.completionSynced,
    };
  } catch {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return null;
  }
}

export function saveGameSessionSnapshot(state: GameState): void {
  if (typeof window === "undefined") return;
  try {
    const snap: PersistedGameSnapshot = {
      v: VERSION,
      phase: state.phase,
      position: state.position,
      hasEntered: state.hasEntered,
      entryRollCount: state.entryRollCount,
      entryPendingStart: state.entryPendingStart,
      lastRoll: state.lastRoll,
      rollHistory: state.rollHistory,
      playerQuery: state.playerQuery,
      fixedPlayerRequest: state.fixedPlayerRequest,
      lastTransition: state.lastTransition,
      chatMessages: state.chatMessages,
      gameHistory: state.gameHistory,
      activeGameId: state.activeGameId,
      finalSummary: state.finalSummary,
      actionPlan: state.actionPlan,
      completionSynced: state.completionSynced,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
  } catch {
    /* quota / private mode */
  }
}

export function clearGameSessionSnapshot(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
