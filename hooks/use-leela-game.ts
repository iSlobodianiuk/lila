"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GOAL_CELL, TOTAL_CELLS, getCell } from "@/lib/board-data";
import {
  clearGameSessionSnapshot,
  loadGameSessionSnapshot,
  saveGameSessionSnapshot,
} from "@/lib/game-local-storage";
import type { ChatMessage, GameState, LoadGameInput } from "@/lib/types";
import { rollEntryDice, rollPlayDice } from "@/src/utils/diceLogic";

const ENTRY_CELL = 6;
const ROLL_ANIMATION_MS = 700;

function newMessageId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

const initialState: GameState = {
  phase: "entry",
  position: 0,
  hasEntered: false,
  entryRollCount: 0,
  entryPendingStart: false,
  lastRoll: null,
  isRolling: false,
  rollHistory: [],
  playerQuery: "",
  fixedPlayerRequest: null,
  lastTransition: null,
  chatMessages: [],
  gameHistory: [],
  activeGameId: null,
  finalSummary: null,
  actionPlan: null,
  completionSynced: false,
};

function historyItem(cellNumber: number): { cellNumber: number; cellName: string; timestamp: string } {
  const c = getCell(cellNumber);
  return {
    cellNumber,
    cellName: c?.name ?? `№${cellNumber}`,
    timestamp: nowIso(),
  };
}

export type UseLeelaGameOptions = {
  /** Якщо true — не відновлювати з localStorage (наприклад, завантаження гри з API через `?continue=`). */
  skipLocalHydrate?: boolean;
};

export function useLeelaGame(options?: UseLeelaGameOptions) {
  const [state, setState] = useState<GameState>(initialState);
  const rollingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedRef = useRef(false);
  /** Запис у localStorage лише після гідрації й коли безпечно (не перезатирати LS до `loadGame` з `?continue=`). */
  const persistReadyRef = useRef(false);
  const skipHydrate = options?.skipLocalHydrate ?? false;

  useEffect(() => {
    if (skipHydrate) {
      hydratedRef.current = true;
      persistReadyRef.current = false;
      return;
    }
    const restored = loadGameSessionSnapshot();
    if (restored && Object.keys(restored).length > 0) {
      setState((prev) => ({
        ...prev,
        ...restored,
        isRolling: false,
      }));
    }
    hydratedRef.current = true;
    persistReadyRef.current = true;
  }, [skipHydrate]);

  useEffect(() => {
    if (!hydratedRef.current || !persistReadyRef.current) return;
    const timer = window.setTimeout(() => {
      saveGameSessionSnapshot(state);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [state]);

  const appendChatMessage = useCallback(
    (msg: Omit<ChatMessage, "id" | "createdAt"> & { createdAt?: string }) => {
      const createdAt = msg.createdAt ?? nowIso();
      setState((prev) => ({
        ...prev,
        chatMessages: [...prev.chatMessages, { ...msg, id: newMessageId(), createdAt }],
      }));
    },
    [],
  );

  const setActiveGameId = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, activeGameId: id }));
  }, []);

  const setCompletionResult = useCallback((summary: string, plan: string) => {
    setState((prev) => ({
      ...prev,
      finalSummary: summary,
      actionPlan: plan,
      completionSynced: true,
    }));
  }, []);

  const markCompletionSynced = useCallback(() => {
    setState((prev) => ({ ...prev, completionSynced: true }));
  }, []);

  const loadGame = useCallback((data: LoadGameInput) => {
    if (rollingTimer.current) clearTimeout(rollingTimer.current);
    const pos = data.currentPosition;
    const phase: GameState["phase"] =
      data.isCompleted || pos === GOAL_CELL ? "finished" : "playing";
    const chatMessages: ChatMessage[] = data.chatHistory.map((m) => ({
      id: newMessageId(),
      role: m.role,
      content: m.content,
      kind: m.kind,
      cellId: m.cellId,
      createdAt:
        typeof m.timestamp === "string" ? m.timestamp : new Date(m.timestamp as unknown as string).toISOString(),
    }));
    setState({
      phase,
      position: pos,
      hasEntered: true,
      entryRollCount: 0,
      entryPendingStart: false,
      lastRoll: null,
      isRolling: false,
      rollHistory: [],
      playerQuery: data.playerRequest,
      fixedPlayerRequest: data.playerRequest,
      lastTransition: null,
      chatMessages,
      gameHistory: data.gameHistory,
      activeGameId: data.id,
      finalSummary: data.finalSummary ?? null,
      actionPlan: data.actionPlan ?? null,
      completionSynced: data.isCompleted,
    });
    hydratedRef.current = true;
    persistReadyRef.current = true;
  }, []);

  const startGame = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== "entry" || !prev.entryPendingStart) return prev;
      const request = prev.playerQuery.trim() || "Мій запит у грі Ліла";
      const entryCell = getCell(ENTRY_CELL);
      const transition =
        entryCell?.arrowTo != null
          ? { kind: "arrow" as const, from: ENTRY_CELL, to: entryCell.arrowTo }
          : entryCell?.snakeTo != null
            ? { kind: "snake" as const, from: ENTRY_CELL, to: entryCell.snakeTo }
            : null;

      const newPosition = transition?.to ?? ENTRY_CELL;
      const first = historyItem(newPosition);

      return {
        ...prev,
        phase: "playing" as const,
        hasEntered: true,
        entryPendingStart: false,
        fixedPlayerRequest: request,
        position: newPosition,
        lastTransition: transition,
        gameHistory: [...prev.gameHistory, first],
        completionSynced: false,
        finalSummary: null,
        actionPlan: null,
      };
    });
  }, []);

  const applyRoll = useCallback(() => {
    setState((prev) => {
      if (prev.phase === "entry" && !prev.entryPendingStart) {
        const roll = rollEntryDice(prev.entryRollCount);
        const entryRollCount = prev.entryRollCount + 1;
        if (roll === 6) {
          return {
            ...prev,
            lastRoll: roll,
            isRolling: false,
            entryRollCount,
            entryPendingStart: true,
            lastTransition: null,
          };
        }
        return {
          ...prev,
          lastRoll: roll,
          isRolling: false,
          entryRollCount,
          entryPendingStart: false,
          lastTransition: null,
        };
      }

      if (prev.phase === "entry" && prev.entryPendingStart) {
        return { ...prev, isRolling: false };
      }

      if (prev.phase !== "playing" || !prev.hasEntered) {
        return { ...prev, isRolling: false };
      }

      if (prev.position >= GOAL_CELL) {
        return { ...prev, isRolling: false };
      }

      const roll = rollPlayDice();
      const history = [...prev.rollHistory, roll];
      const next = prev.position + roll;

      if (next > TOTAL_CELLS) {
        return {
          ...prev,
          lastRoll: roll,
          isRolling: false,
          rollHistory: history,
          lastTransition: null,
        };
      }

      const landedCell = getCell(next);
      const transition =
        landedCell?.arrowTo != null
          ? { kind: "arrow" as const, from: next, to: landedCell.arrowTo }
          : landedCell?.snakeTo != null
            ? { kind: "snake" as const, from: next, to: landedCell.snakeTo }
            : null;

      const newPosition = transition?.to ?? next;
      const reachedGoal = newPosition === GOAL_CELL;
      const visit = historyItem(newPosition);

      return {
        ...prev,
        position: newPosition,
        lastRoll: roll,
        isRolling: false,
        rollHistory: history,
        lastTransition: transition,
        phase: reachedGoal ? ("finished" as const) : prev.phase,
        gameHistory: [...prev.gameHistory, visit],
        completionSynced: reachedGoal ? false : prev.completionSynced,
      };
    });
  }, []);

  const rollDice = useCallback(() => {
    setState((prev) => {
      if (prev.isRolling) return prev;
      if (prev.phase === "entry" && prev.entryPendingStart) return prev;
      if (prev.phase === "finished") return prev;
      if (prev.phase === "playing" && prev.position >= GOAL_CELL) return prev;
      return { ...prev, isRolling: true };
    });

    if (rollingTimer.current) clearTimeout(rollingTimer.current);
    rollingTimer.current = setTimeout(applyRoll, ROLL_ANIMATION_MS);
  }, [applyRoll]);

  const reset = useCallback(() => {
    if (rollingTimer.current) clearTimeout(rollingTimer.current);
    clearGameSessionSnapshot();
    persistReadyRef.current = true;
    setState(initialState);
  }, []);

  const setPlayerQuery = useCallback((query: string) => {
    setState((prev) => ({ ...prev, playerQuery: query }));
  }, []);

  return {
    state,
    rollDice,
    reset,
    setPlayerQuery,
    startGame,
    appendChatMessage,
    setActiveGameId,
    loadGame,
    setCompletionResult,
    markCompletionSynced,
  };
}
