"use client";

import { useCallback, useRef, useState } from "react";
import { GOAL_CELL, TOTAL_CELLS, getCell } from "@/lib/board-data";
import type { GameState } from "@/lib/types";

const ENTRY_ROLL = 6;
const ROLL_ANIMATION_MS = 700;

const initialState: GameState = {
  position: 0,
  hasEntered: false,
  lastRoll: null,
  isRolling: false,
  rollHistory: [],
  playerQuery: "",
  lastTransition: null,
};

function rollOnce(): number {
  return Math.floor(Math.random() * 6) + 1;
}

export function useLeelaGame() {
  const [state, setState] = useState<GameState>(initialState);
  const rollingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyRoll = useCallback((roll: number) => {
    setState((prev) => {
      const history = [...prev.rollHistory, roll];

      if (!prev.hasEntered) {
        if (roll === ENTRY_ROLL) {
          const entryCell = getCell(ENTRY_ROLL);
          const transition =
            entryCell?.arrowTo != null
              ? { kind: "arrow" as const, from: ENTRY_ROLL, to: entryCell.arrowTo }
              : entryCell?.snakeTo != null
                ? { kind: "snake" as const, from: ENTRY_ROLL, to: entryCell.snakeTo }
                : null;
          return {
            ...prev,
            position: transition?.to ?? ENTRY_ROLL,
            hasEntered: true,
            lastRoll: roll,
            isRolling: false,
            rollHistory: history,
            lastTransition: transition,
          };
        }
        return {
          ...prev,
          lastRoll: roll,
          isRolling: false,
          rollHistory: history,
          lastTransition: null,
        };
      }

      if (prev.position >= GOAL_CELL) {
        return {
          ...prev,
          lastRoll: roll,
          isRolling: false,
          rollHistory: history,
          lastTransition: null,
        };
      }

      const next = prev.position + roll;
      // Точне попадання на ціль/край дошки додамо пізніше — поки рух тільки якщо вміщається.
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

      return {
        ...prev,
        position: transition?.to ?? next,
        lastRoll: roll,
        isRolling: false,
        rollHistory: history,
        lastTransition: transition,
      };
    });
  }, []);

  const rollDice = useCallback(() => {
    setState((prev) => (prev.isRolling ? prev : { ...prev, isRolling: true }));
    const roll = rollOnce();
    if (rollingTimer.current) clearTimeout(rollingTimer.current);
    rollingTimer.current = setTimeout(() => applyRoll(roll), ROLL_ANIMATION_MS);
  }, [applyRoll]);

  const reset = useCallback(() => {
    if (rollingTimer.current) clearTimeout(rollingTimer.current);
    setState(initialState);
  }, []);

  const setPlayerQuery = useCallback((query: string) => {
    setState((prev) => ({ ...prev, playerQuery: query }));
  }, []);

  return { state, rollDice, reset, setPlayerQuery };
}
