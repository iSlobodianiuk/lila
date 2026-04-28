"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { GOAL_CELL, getCell } from "@/lib/board-data";
import { CELL_DESCRIPTIONS } from "@/src/data/cellDescriptions";
import { generateInsight } from "@/lib/insights";
import type { GameState } from "@/lib/types";
import { Dice } from "@/components/dice";

type Props = {
  state: GameState;
  onRoll: () => void;
  onReset: () => void;
  onQueryChange: (query: string) => void;
  onAppendMessage: (msg: { role: "user" | "assistant"; content: string; kind?: "cell"; cellId?: number }) => void;
};

export function GamePanel({ state, onRoll, onReset, onQueryChange, onAppendMessage }: Props) {
  const cell = state.position > 0 ? getCell(state.position) : null;
  const cellNarrative =
    state.position > 0 ? CELL_DESCRIPTIONS[state.position] : null;
  const [insight, setInsight] = useState<string | null>(null);
  const [cellAiLoading, setCellAiLoading] = useState(false);
  const cellFetchAbort = useRef<AbortController | null>(null);

  const playerRequestForAi = state.fixedPlayerRequest ?? state.playerQuery;

  const cellAiMessage = useMemo(() => {
    return [...state.chatMessages]
      .reverse()
      .find((m) => m.kind === "cell" && m.cellId === state.position);
  }, [state.chatMessages, state.position]);

  useEffect(() => {
    if (state.phase !== "playing" && state.phase !== "finished") return;
    if (state.isRolling || state.position < 1) return;
    if (state.chatMessages.some((m) => m.kind === "cell" && m.cellId === state.position)) {
      setCellAiLoading(false);
      return;
    }

    cellFetchAbort.current?.abort();
    const ac = new AbortController();
    cellFetchAbort.current = ac;
    setCellAiLoading(true);

    const cellData = getCell(state.position);
    if (!cellData) {
      setCellAiLoading(false);
      return;
    }
    const desc = CELL_DESCRIPTIONS[state.position]?.description ?? cellData.description;

    (async () => {
      try {
        const req = state.fixedPlayerRequest ?? state.playerQuery;
        const res = await fetch("/api/leela/cell", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerRequest: req,
            cellId: cellData.id,
            cellName: cellData.name,
            cellDescription: desc,
          }),
          signal: ac.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { text?: string };
        if (data.text) {
          onAppendMessage({
            role: "assistant",
            content: data.text,
            kind: "cell",
            cellId: cellData.id,
          });
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        onAppendMessage({
          role: "assistant",
          content: `Що для тебе означає потрапляння на «${cellData.name}» у зв’язку з твоїм запитом? Що ти вперше зауважив про ситуацію, коли тут зупинився?`,
          kind: "cell",
          cellId: cellData.id,
        });
      } finally {
        if (!ac.signal.aborted) setCellAiLoading(false);
      }
    })();

    return () => ac.abort();
  }, [
    state.phase,
    state.isRolling,
    state.position,
    state.chatMessages,
    onAppendMessage,
    state.fixedPlayerRequest,
    state.playerQuery,
  ]);

  const hint =
    state.phase === "finished"
      ? "Ти дійшов до клітинки 68. Поділись відчуттям — що змінилось поглядом на запит."
      : "Рухайтесь сходинками свідомості. Після кожного ходу — думка провідника щодо клітинки.";

  const showFinalLoading =
    state.phase === "finished" && !state.finalSummary && !state.completionSynced;

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
    setInsight(generateInsight({ query: playerRequestForAi, cell }));
  };

  const diceDisabled = state.phase === "finished" || state.position >= GOAL_CELL;

  return (
    <aside className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto overscroll-y-contain pr-1 sm:gap-5">
      {state.chatMessages.length > 0 && (
        <div className="max-h-40 overflow-y-auto rounded-2xl border border-stone-100 bg-white/50 p-2.5 text-[11px] leading-snug text-stone-600 sm:text-xs">
          <div className="mb-1 font-medium text-stone-500">Переписка з провідником</div>
          {state.chatMessages.map((m) => (
            <p key={m.id} className="mb-1.5 border-b border-stone-100/80 pb-1.5 last:mb-0 last:border-0 last:pb-0">
              {m.kind === "entry" && <span className="text-amber-800/80">[Вхід] </span>}
              {m.kind === "cell" && m.cellId != null && (
                <span className="text-sky-800/80">[№{m.cellId}] </span>
              )}
              {m.content}
            </p>
          ))}
        </div>
      )}

      <div className="flex flex-col items-center gap-3 rounded-2xl border border-stone-200/60 bg-gradient-to-br from-white/90 to-stone-50/80 p-4 shadow-[0_12px_40px_-15px_rgba(92,74,54,0.25)] sm:gap-4 sm:p-5">
        <Dice
          value={state.lastRoll}
          isRolling={state.isRolling}
          onRoll={onRoll}
          label="Кинути кубик"
          hint={hint}
          disabled={diceDisabled}
        />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-stone-200/60 bg-gradient-to-br from-white/90 to-stone-50/80 p-4 shadow-[0_12px_40px_-15px_rgba(92,74,54,0.25)] sm:gap-4 sm:p-5">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">
            Статус
          </div>
          <div className="mt-1 text-sm font-semibold text-stone-800 sm:text-base">
            {state.phase === "finished"
              ? "Гра завершена"
              : state.hasEntered && cell
                ? `Клітинка ${cell.id} · ${cell.name}`
                : "—"}
          </div>
          {state.hasEntered && cell && (
            <div className="mt-0.5 text-xs italic text-stone-500">{cell.original}</div>
          )}
        </div>

        {state.hasEntered && cell && (
          <div className="flex flex-col gap-2.5">
            {cellAiLoading && (
              <p className="text-xs text-amber-700/80">Провідник думає про цю клітинку…</p>
            )}
            {cellAiMessage && (
              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-2.5 sm:p-3">
                <div className="text-[10px] font-medium uppercase tracking-wide text-amber-800/90">
                  Провідник (через твій запит)
                </div>
                <p className="mt-1 text-xs leading-relaxed text-stone-800">{cellAiMessage.content}</p>
              </div>
            )}
            <p className="rounded-2xl bg-stone-50/70 p-2.5 text-xs leading-relaxed text-stone-600 sm:p-3">
              {cell.description}
            </p>
            {cellNarrative && cellNarrative.questions.length > 0 && (
              <div>
                <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-stone-400">
                  Питання для роздумів
                </div>
                <ul className="list-inside list-disc space-y-1 rounded-2xl border border-stone-100/80 bg-white/50 p-2.5 text-xs leading-relaxed text-stone-600 sm:p-3">
                  {cellNarrative.questions.map((q, i) => (
                    <li key={i} className="pl-0.5">
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {cellNarrative?.insight && (
              <p className="rounded-2xl border border-amber-100/90 bg-amber-50/50 p-2.5 text-xs font-medium leading-relaxed text-amber-950/80 sm:p-3">
                {cellNarrative.insight}
              </p>
            )}
          </div>
        )}

        {showFinalLoading && (
          <p className="rounded-2xl border border-amber-200/80 bg-amber-50/80 p-3 text-xs text-amber-900">
            Готуємо фінальний підсумок і план дій. За кілька секунд результат з’явиться тут і буде надіслано на твою пошту.
          </p>
        )}

        {state.phase === "finished" && (state.finalSummary || state.actionPlan) && (
          <div className="flex flex-col gap-2 rounded-2xl border border-stone-200/90 bg-stone-50/90 p-3">
            {state.finalSummary && (
              <div>
                <div className="text-[10px] font-medium uppercase tracking-wide text-stone-500">Висновок</div>
                <p className="mt-1 text-xs leading-relaxed text-stone-800">{state.finalSummary}</p>
              </div>
            )}
            {state.actionPlan && (
              <div>
                <div className="text-[10px] font-medium uppercase tracking-wide text-stone-500">План дій (2 тижні)</div>
                <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-stone-800">{state.actionPlan}</p>
              </div>
            )}
          </div>
        )}

        {state.hasEntered && cell && state.phase === "playing" && (
          <div className="flex flex-col gap-2">
            <label htmlFor="player-query" className="text-xs font-medium text-stone-600">
              Додати до запиту (необов’язково)
            </label>
            <textarea
              id="player-query"
              value={state.playerQuery}
              onChange={(event) => {
                onQueryChange(event.target.value);
                if (insight) setInsight(null);
              }}
              placeholder="Короткі нотатки до свого фокусу…"
              className="min-h-16 rounded-2xl border border-stone-200 bg-white/80 px-3 py-2 text-xs leading-relaxed text-stone-700 outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-200/60"
            />
            <button
              type="button"
              onClick={handleInsight}
              className="rounded-full bg-stone-900/90 px-4 py-2.5 text-xs font-medium text-stone-50 transition hover:bg-stone-900"
            >
              Локальний ШІ-інсайт (патерни)
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
