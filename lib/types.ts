export type Cell = {
  id: number;
  name: string;
  original: string;
  description: string;
  arrowTo?: number;
  snakeTo?: number;
};

export type GamePhase = "entry" | "playing" | "finished";

export type GameHistoryItem = {
  cellNumber: number;
  cellName: string;
  timestamp: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  kind?: "entry" | "cell";
  cellId?: number;
  createdAt: string;
};

export type GameState = {
  phase: GamePhase;
  position: number;
  hasEntered: boolean;
  /** Кидки лише на етапі входу (формування запиту). */
  entryRollCount: number;
  /** Після випадання 6 — true, доки гравець не натисне «Почати гру». */
  entryPendingStart: boolean;
  lastRoll: number | null;
  isRolling: boolean;
  /** Кидки під час гри (після входу). */
  rollHistory: number[];
  /** Чернетка запиту на етапі entry. */
  playerQuery: string;
  /** Зафіксований запит після входу в гру. */
  fixedPlayerRequest: string | null;
  lastTransition: {
    kind: "arrow" | "snake";
    from: number;
    to: number;
  } | null;
  chatMessages: ChatMessage[];
  /** Клітинки в порядку відвідування (після кожного ходу/переходу). */
  gameHistory: GameHistoryItem[];
  /** id запису Game у БД; null — ще не створено / скинуто. */
  activeGameId: string | null;
  /** Після завершення гри (API) або з кабінету. */
  finalSummary: string | null;
  actionPlan: string | null;
  /** Щойно згенеровано/завантажено — щоб не дублювати POST complete. */
  completionSynced: boolean;
};

export type ChatHistoryPersistItem = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  kind?: "entry" | "cell";
  cellId?: number;
};

export type LoadGameInput = {
  id: string;
  playerRequest: string;
  currentPosition: number;
  gameHistory: GameHistoryItem[];
  chatHistory: ChatHistoryPersistItem[];
  isCompleted: boolean;
  finalSummary?: string | null;
  actionPlan?: string | null;
};

export type GameActions = {
  rollDice: () => void;
  reset: () => void;
  setPlayerQuery: (query: string) => void;
  startGame: () => void;
  /** Додати повідомлення в чат (після відповіді API). */
  appendChatMessage: (msg: Omit<ChatMessage, "id" | "createdAt"> & { createdAt?: string }) => void;
  setActiveGameId: (id: string | null) => void;
  loadGame: (data: LoadGameInput) => void;
  setCompletionResult: (summary: string, plan: string) => void;
  markCompletionSynced: () => void;
};
