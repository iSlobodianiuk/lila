"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, SendHorizonal } from "lucide-react";
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
  const initialMessageKey = "entry-initial-guide-message";
  const firstReplyKey = "entry-first-reply-message";
  const rollMessageKey = useRef<string | null>(null);
  const autoStartRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [awaitingRoll, setAwaitingRoll] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");

  const rollReactions = useMemo(
    () => ({
      1: "Зараз запит ще дуже далекий від точки входу в гру. Спробуй не говорити загально. Що саме в цій темі для тебе найгостріше зараз?",
      2: "У запиті вже є напрямок, але він ще нечіткий. Чого ти насправді хочеш у цій ситуації — результату, полегшення чи відповіді?",
      3: "Ти вже ближче до входу. У запиті є сенс, але поки що в ньому не вистачає точності. Що саме болить або не влаштовує тебе найбільше?",
      4: "Запит стає сильнішим. Уже видно суть, але його ще можна поглибити. Що зміниться у твоєму житті, якщо цей запит справді вирішиться?",
      5: "Ти зовсім близько до входу в гру. Запит майже сформований. Спробуй назвати найчесніше формулювання без прикрас і зайвих пояснень.",
      6: "Шістка. Твій запит готовий до входу в гру.",
    }),
    [],
  );

  useEffect(() => {
    if (state.phase !== "entry") return;
    const entryMessages = state.chatMessages.filter((m) => m.kind === "entry");
    if (entryMessages.length > 0) return;
    if (rollMessageKey.current === initialMessageKey) return;
    rollMessageKey.current = initialMessageKey;
    onAppendMessage({
      role: "assistant",
      kind: "entry",
      content:
        "Сформулюй свій запит для входу в гру. Напиши коротко й чесно те, з чим ти хочеш увійти.",
    });
  }, [onAppendMessage, state.chatMessages, state.phase]);

  useEffect(() => {
    if (state.phase !== "entry" || state.lastRoll === null || state.isRolling) return;
    const key = `${state.entryRollCount}-${state.lastRoll}`;
    if (rollMessageKey.current === key) return;
    rollMessageKey.current = key;

    const reaction = rollReactions[state.lastRoll as keyof typeof rollReactions];
    if (reaction) {
      onAppendMessage({ role: "assistant", content: reaction, kind: "entry" });
    }
    if (state.lastRoll === 6) {
      setAwaitingRoll(false);
      return;
    }
    setAwaitingRoll(false);
  }, [
    onAppendMessage,
    rollReactions,
    state.entryRollCount,
    state.isRolling,
    state.lastRoll,
    state.phase,
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [state.chatMessages, state.isRolling, state.entryPendingStart]);

  useEffect(() => {
    if (!state.entryPendingStart || autoStartRef.current) return;
    autoStartRef.current = true;
    const timer = window.setTimeout(() => {
      onStart();
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [onStart, state.entryPendingStart]);

  const entryChat = state.chatMessages.filter((m) => m.kind === "entry");
  const hasPrimaryRequest = entryChat.some((m) => m.role === "user");
  const canSend = draftMessage.trim().length > 0 && !state.entryPendingStart;
  const canRoll = awaitingRoll && hasPrimaryRequest && !state.entryPendingStart;

  const handleSend = () => {
    const message = draftMessage.trim();
    if (!message || state.entryPendingStart) return;
    const isFirstUserMessage = !entryChat.some((m) => m.role === "user");
    onAppendMessage({ role: "user", content: message, kind: "entry" });
    onQueryChange(message);
    if (isFirstUserMessage) {
      if (rollMessageKey.current !== firstReplyKey) {
        rollMessageKey.current = firstReplyKey;
        onAppendMessage({
          role: "assistant",
          kind: "entry",
          content:
            "Я почула твій запит. Тепер кидай кубик, щоб побачити, чи готовий цей запит увійти в гру.",
        });
      }
    }
    setAwaitingRoll(true);
    setDraftMessage("");
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 lg:gap-5">
      <div className="grid min-h-[72dvh] grid-rows-[auto_1fr_auto] overflow-hidden rounded-3xl border border-white/45 bg-white/70 shadow-[0_28px_70px_-36px_rgba(58,42,25,0.42)] backdrop-blur-xl">
        <header className="flex items-center justify-between border-b border-stone-200/70 px-4 py-3 sm:px-5">
          <div>
            <p className="text-sm font-semibold text-stone-800">Провідник</p>
            <p className="text-xs text-stone-500">допомагає уточнити запит</p>
          </div>
          <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] text-stone-600">
            Вхід у гру
          </span>
        </header>

        <div
          className="min-h-0 space-y-3 overflow-y-auto px-4 py-4 sm:px-5"
          aria-live="polite"
        >
          {entryChat.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "assistant" ? "justify-start" : "justify-end"}`}
            >
              <p
                className={`max-w-[88%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed shadow-sm sm:max-w-[78%] ${
                  m.role === "assistant"
                    ? "border border-stone-200/80 bg-stone-50 text-stone-700"
                    : "bg-stone-900 text-stone-50"
                }`}
              >
                {m.content}
              </p>
            </div>
          ))}
          {state.isRolling && (
            <div className="flex justify-start">
              <p className="rounded-2xl border border-stone-200/80 bg-stone-50 px-3 py-2 text-xs text-stone-500">
                Провідник спостерігає за кидком…
              </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="grid gap-3 border-t border-stone-200/70 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-end sm:px-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="entry-message" className="text-xs font-medium text-stone-500">
              Твоя відповідь
            </label>
            <div className="flex items-end gap-2">
              <textarea
                id="entry-message"
                value={draftMessage}
                onChange={(e) => setDraftMessage(e.target.value)}
                disabled={state.entryPendingStart}
                placeholder="Напиши свою відповідь…"
                className="min-h-[44px] max-h-28 w-full resize-none rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-200/60 disabled:cursor-not-allowed disabled:opacity-60"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-stone-900 text-stone-50 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Надіслати повідомлення"
              >
                <SendHorizonal className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200/80 bg-stone-50/80 p-3 sm:min-w-[190px]">
            <Dice
              value={state.lastRoll}
              isRolling={state.isRolling}
              onRoll={onRoll}
              label="Кинути кубик"
              disabled={!canRoll}
              hint={
                !hasPrimaryRequest
                  ? "Спочатку надішли первинний запит"
                  : awaitingRoll
                    ? "Готово до кидка"
                    : "Відповідай провіднику, щоб продовжити"
              }
            />
          </div>
        </div>
      </div>

      {state.entryPendingStart && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-stone-900/35 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-3xl border border-amber-200/70 bg-white p-6 text-center shadow-[0_28px_80px_-32px_rgba(40,28,12,0.55)]">
            <Sparkles className="mx-auto h-9 w-9 text-amber-600" aria-hidden />
            <h3 className="mt-3 font-display text-3xl text-stone-900">Ти в грі</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-700">
              Твій запит достатньо сформований. Можемо переходити до основного поля гри.
            </p>
            <button
              type="button"
              onClick={onStart}
              className="mt-5 min-h-11 rounded-full bg-stone-900 px-6 py-2.5 text-sm font-medium text-stone-50 transition hover:bg-stone-800"
            >
              Почати гру
            </button>
          </div>
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
