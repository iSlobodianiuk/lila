export type Cell = {
  id: number;
  name: string;
  original: string;
  description: string;
  arrowTo?: number;
  snakeTo?: number;
};

export type GameState = {
  position: number;
  hasEntered: boolean;
  lastRoll: number | null;
  isRolling: boolean;
  rollHistory: number[];
  playerQuery: string;
  lastTransition: {
    kind: "arrow" | "snake";
    from: number;
    to: number;
  } | null;
};

export type GameActions = {
  rollDice: () => void;
  reset: () => void;
  setPlayerQuery: (query: string) => void;
};
