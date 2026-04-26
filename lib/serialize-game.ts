import type { ChatHistoryPersistItem, GameState } from "@/lib/types";

export function toPersistedChat(state: GameState): ChatHistoryPersistItem[] {
  return state.chatMessages.map((m) => ({
    role: m.role,
    content: m.content,
    timestamp: m.createdAt,
    kind: m.kind,
    cellId: m.cellId,
  }));
}
