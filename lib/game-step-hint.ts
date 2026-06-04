import { GOAL_CELL } from "@/lib/board-data";
import type { GameState } from "@/lib/types";

type HintOptions = {
  needsUserReply: boolean;
  guideLoading: boolean;
};

/** Підказка під блок «Крок гри» / кубик залежно від стану гри. */
export function getGameStepHint(state: GameState, options: HintOptions): string {
  const { needsUserReply, guideLoading } = options;

  if (guideLoading) {
    return "Провідник готує повідомлення…";
  }
  if (needsUserReply) {
    return "Спочатку дай відповідь провіднику в чаті";
  }
  if (state.phase === "finished" || state.position >= GOAL_CELL) {
    return "Гру завершено. Можеш завершити діалог або почати нову сесію.";
  }
  if (state.phase === "playing" && state.rollHistory.length === 0) {
    return "Перший кидок після входу на поле — кинь кубик, коли будеш готовий.";
  }
  return "Кинь кубик, щоб зробити наступний крок.";
}

/** Текст у порожньому чаті провідника (основна фаза). */
export function getGuideChatEmptyHint(guideLoading: boolean): string {
  if (guideLoading) {
    return "Провідник готує перше повідомлення…";
  }
  return "Тут з’явиться діалог із провідником. Відповідай у полі внизу.";
}
