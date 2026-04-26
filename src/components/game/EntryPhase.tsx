"use client";

import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import type { GameState } from "@/lib/types";
import { Dice } from "@/components/dice";

type Props = {
  state: GameState;
  onRoll: () => void;
  onQueryChange: (q: string) => void;
  onStart: () => void;
  onReset: () => void;
  onAppendMessage: (msg: { role: "user" | "assistant"; content: string; kind?: "entry" }) => void;
};

export function EntryPhase({
  state,
  onRoll,
  onQueryChange,
  onStart,
  onReset,
  onAppendMessage,
}: Props) {
  const lastEntryFetchKey = useRef<string | null>(null);

  useEffect(() => {
    if (state.phase !== "entry" || state.isRolling || state.lastRoll === null) return;
    if (!state.hasEntered) {
      const key = `${state.entryRollCount}-${state.lastRoll}`;
      if (lastEntryFetchKey.current === key) return;
      lastEntryFetchKey.current = key;

      (async () => {
        try {
          const res = await fetch("/api/leela/entry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roll: state.lastRoll, queryDraft: state.playerQuery }),
          });
          if (!res.ok) return;
          const data = (await res.json()) as { text?: string };
          if (data.text) {
            onAppendMessage({ role: "assistant", content: data.text, kind: "entry" });
          }
        } catch {
          onAppendMessage({
            role: "assistant",
            content: "Питання: що саме ти хочеш винести з цієї гри — однією фразою?",
            kind: "entry",
          });
        }
      })();
    }
  }, [
    state.phase,
    state.isRolling,
    state.lastRoll,
    state.entryRollCount,
    state.hasEntered,
    state.playerQuery,
    onAppendMessage,
  ]);

  const entryChat = state.chatMessages.filter((m) => m.kind === "entry");

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 sm:gap-6">
      <div className="text-center">
        <h2 className="font-display text-xl text-stone-800 sm:text-2xl">Вхід у гру</h2>
        <p className="mt-1 text-sm text-stone-500 sm:text-base">Сформулюй свій запит</p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="entry-query" className="text-xs font-medium text-stone-600">
          Твій запит
        </label>
        <textarea
          id="entry-query"
          value={state.playerQuery}
          onChange={(e) => onQueryChange(e.target.value)}
          disabled={state.entryPendingStart}
          placeholder="Наприклад: Що мені важливо змінити в моїх стосунках?"
          className="min-h-32 rounded-2xl border border-stone-200 bg-white/90 px-3 py-2.5 text-sm leading-relaxed text-stone-800 outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-200/60 disabled:opacity-60"
        />
      </div>

      <div className="flex flex-col items-center gap-2 rounded-3xl border border-white/40 bg-white/55 p-5 shadow-[0_20px_50px_-30px_rgba(120,90,60,0.4)] backdrop-blur-xl">
        <Dice
          value={state.lastRoll}
          isRolling={state.isRolling}
          onRoll={onRoll}
          label="Кинути кубик"
          disabled={state.entryPendingStart}
        />
      </div>

      {entryChat.length > 0 && (
        <div
          className="flex max-h-48 flex-col gap-2 overflow-y-auto rounded-2xl border border-stone-100 bg-stone-50/80 p-3 text-sm"
          aria-live="polite"
        >
          {entryChat.map((m) => (
            <p key={m.id} className="leading-relaxed text-stone-700">
              <span className="font-medium text-amber-800/90">Провідник: </span>
              {m.content}
            </p>
          ))}
        </div>
      )}

      {state.entryPendingStart && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-amber-200/60 bg-amber-50/60 p-4 text-center">
          <Sparkles className="h-8 w-8 text-amber-600" aria-hidden />
          <p className="text-sm text-stone-700">
            Запит готовий. Натисни, щоб увійти на поле (клітинка 6) і розпочати гру.
          </p>
          <button
            type="button"
            onClick={onStart}
            className="min-h-11 rounded-full bg-stone-900/90 px-6 py-2.5 text-sm font-medium text-stone-50 transition hover:bg-stone-900"
          >
            Почати гру
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={onReset}
        className="self-center text-xs text-stone-400 underline-offset-2 hover:text-stone-600 hover:underline"
      >
        Скинути і почати спочатку
      </button>
    </div>
  );
}
