import { useEffect, useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { getCell } from "@/lib/board-data";
import { generateInsight } from "@/lib/insights";
import type { GameState } from "@/lib/types";
import { Dice } from "@/components/dice";

type Props = {
  state: GameState;
  onRoll: () => void;
  onReset: () => void;
  onQueryChange: (query: string) => void;
};

export function GamePanel({ state, onRoll, onReset, onQueryChange }: Props) {
  const cell = state.position > 0 ? getCell(state.position) : null;
  const [insight, setInsight] = useState<string | null>(null);

  const hint = state.hasEntered
    ? "Рухайтесь сходинками свідомості."
    : "Щоб увійти у гру, потрібна шістка — символ народження.";

  const transitionMessage = useMemo(() => {
    if (!state.lastTransition) return null;
    if (state.lastTransition.kind === "arrow") {
      return `Стріла: підйом з ${state.lastTransition.from} на ${state.lastTransition.to}.`;
    }
    return `Змія: спуск з ${state.lastTransition.from} на ${state.lastTransition.to}.`;
  }, [state.lastTransition]);

  useEffect(() => {
    setInsight(null);
  }, [state.position]);

  const handleInsight = () => {
    if (!cell) return;
    setInsight(generateInsight({ query: state.playerQuery, cell }));
  };

  return (
    <aside className="flex flex-col gap-4 sm:gap-5">
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/40 bg-white/55 p-4 shadow-[0_20px_50px_-30px_rgba(120,90,60,0.4)] backdrop-blur-xl sm:gap-4 sm:p-5">
        <Dice
          value={state.lastRoll}
          isRolling={state.isRolling}
          onRoll={onRoll}
          label={state.hasEntered ? "Кинути кубик" : "Шукати народження"}
          hint={hint}
        />
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-white/40 bg-white/55 p-4 shadow-[0_20px_50px_-30px_rgba(120,90,60,0.4)] backdrop-blur-xl sm:gap-4 sm:p-5">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">
            Статус
          </div>
          <div className="mt-1 text-sm font-semibold text-stone-800 sm:text-base">
            {state.hasEntered && cell ? `Клітинка ${cell.id} · ${cell.name}` : "Поза грою"}
          </div>
          {state.hasEntered && cell && (
            <div className="mt-0.5 text-xs italic text-stone-500">{cell.original}</div>
          )}
          {!state.hasEntered && (
            <div className="mt-1 text-xs leading-snug text-stone-500">
              Душа очікує на народження. Кидайте кубик до випадання шістки.
            </div>
          )}
        </div>

        {state.hasEntered && cell && (
          <p className="rounded-2xl bg-stone-50/70 p-2.5 text-xs leading-relaxed text-stone-600 sm:p-3">
            {cell.description}
          </p>
        )}

        {state.hasEntered && cell && (
          <div className="flex flex-col gap-2">
            <label htmlFor="player-query" className="text-xs font-medium text-stone-600">
              Запит гравця
            </label>
            <textarea
              id="player-query"
              value={state.playerQuery}
              onChange={(event) => {
                onQueryChange(event.target.value);
                if (insight) setInsight(null);
              }}
              placeholder="Наприклад: Що мені зараз важливо усвідомити у стосунках?"
              className="min-h-20 rounded-2xl border border-stone-200 bg-white/80 px-3 py-2 text-xs leading-relaxed text-stone-700 outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-200/60"
            />
            <button
              type="button"
              onClick={handleInsight}
              className="rounded-full bg-stone-900/90 px-4 py-2.5 text-xs font-medium text-stone-50 transition hover:bg-stone-900"
            >
              Отримати ШІ-інсайт
            </button>
            {insight && (
              <p className="rounded-2xl border border-amber-100 bg-amber-50/80 p-3 text-xs leading-relaxed text-stone-700">
                {insight}
              </p>
            )}
            {transitionMessage && (
              <p className="rounded-2xl border border-sky-100 bg-sky-50/70 p-3 text-xs leading-relaxed text-sky-900">
                {transitionMessage}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-white/60 pt-2.5 sm:pt-3">
          <div className="text-xs text-stone-500">
            Останній кидок:{" "}
            <span className="font-semibold text-stone-700">{state.lastRoll ?? "—"}</span>
          </div>
          <div className="text-xs text-stone-500">
            Кидків:{" "}
            <span className="font-semibold text-stone-700">{state.rollHistory.length}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-stone-200 bg-white/70 px-4 py-2 text-xs font-medium text-stone-600 transition hover:border-stone-300 hover:text-stone-800"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Почати спочатку
        </button>
      </div>
    </aside>
  );
}
