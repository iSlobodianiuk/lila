"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { GOAL_CELL, getCell } from "@/lib/board-data";
import type { ChatMessage, GameState } from "@/lib/types";
import { Dice } from "@/components/dice";
import { getGuideResponse } from "@/src/app/actions/guide";

type AppendChatPayload = Omit<ChatMessage, "id" | "createdAt"> & { createdAt?: string };
type GuideMessage = { role: "user" | "assistant"; content: string };

type Props = {
  state: GameState;
  onRoll: () => void;
  onReset: () => void;
  onQueryChange: (query: string) => void;
  onAppendMessage: (msg: AppendChatPayload) => void;
};

export function GamePanel({ state, onRoll, onReset, onQueryChange, onAppendMessage }: Props) {
  const [draftMessage, setDraftMessage] = useState("");
  const [guideLoading, setGuideLoading] = useState(false);
  const [messages, setMessages] = useState<GuideMessage[]>(
    state.chatMessages.map((m) => ({ role: m.role, content: m.content })),
  );
  const introSentRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const cell = state.position > 0 ? getCell(state.position) : null;

  useEffect(() => {
    if (messages.length > 0) return;
    if (state.chatMessages.length === 0) return;
    setMessages(state.chatMessages.map((m) => ({ role: m.role, content: m.content })));
  }, [messages.length, state.chatMessages]);

  const streamAssistantText = async (text: string) => {
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    let buffer = "";
    for (const chunk of text) {
      buffer += chunk;
      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", content: buffer };
        return next;
      });
      await Promise.resolve();
    }
    return buffer;
  };

  const requestGuideReply = async (history: GuideMessage[], kind: "entry" | "cell") => {
    const playerQuestion = state.fixedPlayerRequest ?? state.playerQuery ?? "";
    const currentCellName = state.gameHistory[state.gameHistory.length - 1]?.cellName ?? "Невідома клітинка";
    const recentMessages = history.slice(-6).map((m) => ({
      role: m.role,
      content: m.content.slice(0, 100),
    }));

    setGuideLoading(true);
    const result = await getGuideResponse(recentMessages, {
      cellNumber: state.position,
      cellName: currentCellName,
      playerQuestion,
      moveCount: state.gameHistory.length,
    });
    if ("error" in result) {
      const fallback = result.error;
      const finalText = await streamAssistantText(fallback);
      onAppendMessage({
        role: "assistant",
        content: finalText,
        kind,
        cellId: state.position > 0 ? state.position : undefined,
      });
      setGuideLoading(false);
      return;
    }
    const finalText = await streamAssistantText(result.text);
    onAppendMessage({
      role: "assistant",
      content: finalText,
      kind,
      cellId: state.position > 0 ? state.position : undefined,
    });
    setGuideLoading(false);
  };

  useEffect(() => {
    const playerQuestion = state.fixedPlayerRequest ?? state.playerQuery;
    if (introSentRef.current) return;
    if (!playerQuestion?.trim()) return;
    if (messages.length > 0) return;
    introSentRef.current = true;
    void requestGuideReply([{ role: "user", content: "Починаємо гру" }], "entry");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.fixedPlayerRequest, state.playerQuery, messages.length]);

  const showFinalLoading = state.phase === "finished" && !state.finalSummary && !state.completionSynced;

  const latestAssistantCellIndex = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i];
      if (message.role === "assistant") return i;
    }
    return -1;
  }, [messages]);

  const latestUserIndex = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === "user") return i;
    }
    return -1;
  }, [messages]);

  const needsUserReply =
    latestAssistantCellIndex !== -1 &&
    latestAssistantCellIndex > latestUserIndex &&
    state.phase !== "finished";

  const hint =
    state.phase === "finished"
      ? "Гру завершено. Можеш завершити діалог або почати нову сесію."
      : "Кинь кубик, щоб зробити наступний крок.";

  const diceDisabled = state.phase === "finished" || state.position >= GOAL_CELL || needsUserReply;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, state.isRolling, guideLoading, showFinalLoading]);

  const handleSend = async () => {
    const message = draftMessage.trim();
    if (!message) return;
    const userMessage: GuideMessage = { role: "user", content: message };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    onAppendMessage({
      role: "user",
      content: message,
      kind: state.phase === "playing" || state.phase === "finished" ? "cell" : "entry",
      cellId: state.position > 0 ? state.position : undefined,
    });
    onQueryChange(message);
    setDraftMessage("");
    await requestGuideReply(nextMessages, state.phase === "entry" ? "entry" : "cell");
  };

  return (
    <aside className="grid h-full min-h-0 grid-rows-[auto_1fr] gap-4 sm:gap-5">
      <section className="rounded-3xl border border-white/40 bg-white/60 p-4 shadow-[0_20px_50px_-30px_rgba(120,90,60,0.4)] backdrop-blur-xl sm:p-5">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-stone-800">Крок гри</h3>
          <p className="text-xs text-stone-500">Кинь кубик, щоб зробити наступний крок</p>
        </div>
        <Dice
          value={state.lastRoll}
          isRolling={state.isRolling}
          onRoll={onRoll}
          label="Кинути кубик"
          hint={needsUserReply ? "Спочатку дай відповідь провіднику в чаті" : hint}
          disabled={diceDisabled}
        />
      </section>

      <section className="grid min-h-0 grid-rows-[auto_1fr_auto] overflow-hidden rounded-3xl border border-white/40 bg-white/60 shadow-[0_20px_50px_-30px_rgba(120,90,60,0.4)] backdrop-blur-xl">
        <header className="flex items-center justify-between border-b border-stone-200/70 px-4 py-3 sm:px-5">
          <div>
            <p className="text-sm font-semibold text-stone-800">Провідник</p>
            <p className="text-xs text-stone-500">безперервний діалог від входу до завершення</p>
          </div>
          <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] text-stone-600">
            {state.phase === "finished" ? "Завершення" : "У процесі"}
          </span>
        </header>

        <div className="min-h-0 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
          {messages.length === 0 && (
            <p className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 px-3 py-2 text-sm text-stone-500">
              Поки що немає повідомлень. Кинь кубик, щоб почати діалог на полі.
            </p>
          )}

          {messages.map((message, idx) => (
            <div
              key={`${idx}-${message.role}`}
              className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed shadow-sm sm:max-w-[80%] ${
                  message.role === "assistant"
                    ? "border border-stone-200/80 bg-stone-50 text-stone-700"
                    : "bg-stone-900 text-stone-50"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}

          {guideLoading && (
            <div className="flex justify-start">
              <p className="rounded-2xl border border-amber-200/70 bg-amber-50/80 px-3 py-2 text-xs text-amber-900">
                Провідник відповідає…
              </p>
            </div>
          )}

          {showFinalLoading && (
            <div className="flex justify-start">
              <p className="rounded-2xl border border-amber-200/70 bg-amber-50/80 px-3 py-2 text-xs text-amber-900">
                Готуємо підсумок гри та план дій…
              </p>
            </div>
          )}

          {state.phase === "finished" && (state.finalSummary || state.actionPlan) && (
            <div className="space-y-2 rounded-2xl border border-stone-200/90 bg-stone-50/90 p-3">
              {state.finalSummary && (
                <p className="text-xs leading-relaxed text-stone-800">
                  <span className="font-semibold text-stone-700">Висновок: </span>
                  {state.finalSummary}
                </p>
              )}
              {state.actionPlan && (
                <p className="whitespace-pre-wrap text-xs leading-relaxed text-stone-800">
                  <span className="font-semibold text-stone-700">План дій: </span>
                  {state.actionPlan}
                </p>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-stone-200/70 px-4 py-3 sm:px-5">
          <div className="mb-2 flex items-center justify-between text-xs text-stone-500">
            <span>
              Клітинка: <span className="font-semibold text-stone-700">{cell ? `${cell.id}` : "—"}</span>
            </span>
            <span>
              Кидків: <span className="font-semibold text-stone-700">{state.rollHistory.length}</span>
            </span>
          </div>
          <div className="flex items-end gap-2">
            <textarea
              value={draftMessage}
              onChange={(event) => setDraftMessage(event.target.value)}
              placeholder="Напиши відповідь провіднику…"
              className="min-h-[44px] max-h-28 w-full resize-none rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-200/60"
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
              disabled={!draftMessage.trim()}
              className="min-h-11 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Надіслати
            </button>
          </div>

          <button
            type="button"
            onClick={onReset}
            className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-stone-200 bg-white/70 px-4 py-2 text-xs font-medium text-stone-600 transition hover:border-stone-300 hover:text-stone-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Почати спочатку
          </button>
        </div>
      </section>
    </aside>
  );
}
