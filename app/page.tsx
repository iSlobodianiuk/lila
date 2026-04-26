"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { useLeelaGame } from "@/hooks/use-leela-game";
import { toPersistedChat } from "@/lib/serialize-game";
import type { ChatHistoryPersistItem, GameHistoryItem, LoadGameInput } from "@/lib/types";
import { GameBoard } from "@/src/components/game/GameBoard";
import { EntryPhase } from "@/src/components/game/EntryPhase";
import { GamePanel } from "@/src/components/game/GamePanel";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const continueId = searchParams.get("continue");

  const {
    state,
    rollDice,
    reset,
    setPlayerQuery,
    startGame,
    appendChatMessage,
    setActiveGameId,
    loadGame,
    setCompletionResult,
    markCompletionSynced,
  } = useLeelaGame();

  const continueLoadRef = useRef(false);
  const completeRef = useRef(false);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

  useEffect(() => {
    if (!continueId || continueLoadRef.current) return;
    continueLoadRef.current = true;
    (async () => {
      try {
        const res = await fetch(`/api/games/${continueId}`);
        if (!res.ok) {
          continueLoadRef.current = false;
          return;
        }
        const data = (await res.json()) as {
          id: string;
          playerRequest: string;
          currentPosition: number;
          gameHistory: GameHistoryItem[];
          chatHistory: ChatHistoryPersistItem[];
          isCompleted: boolean;
          finalSummary?: string | null;
          actionPlan?: string | null;
        };
        const input: LoadGameInput = {
          id: data.id,
          playerRequest: data.playerRequest,
          currentPosition: data.currentPosition,
          gameHistory: Array.isArray(data.gameHistory) ? data.gameHistory : [],
          chatHistory: Array.isArray(data.chatHistory) ? data.chatHistory : [],
          isCompleted: data.isCompleted,
          finalSummary: data.finalSummary,
          actionPlan: data.actionPlan,
        };
        loadGame(input);
        router.replace("/", { scroll: false });
      } catch {
        continueLoadRef.current = false;
      }
    })();
  }, [continueId, loadGame, router]);

  useEffect(() => {
    if (state.phase !== "playing" || !state.hasEntered || state.activeGameId) return;
    if (!(state.fixedPlayerRequest ?? state.playerQuery).trim()) return;

    const ac = new AbortController();
    (async () => {
      try {
        const snap = stateRef.current;
        const pr = snap.fixedPlayerRequest ?? snap.playerQuery;
        if (!pr.trim()) return;
        const res = await fetch("/api/games", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerRequest: pr,
            currentPosition: snap.position,
            gameHistory: snap.gameHistory,
            chatHistory: toPersistedChat(snap),
          }),
          signal: ac.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { id?: string };
        if (data.id) setActiveGameId(data.id);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    })();

    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- create once when entering play; body uses stateRef
  }, [state.phase, state.hasEntered, state.activeGameId, setActiveGameId]);

  const persistRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPayload = useRef<string>("");

  useEffect(() => {
    if (!state.activeGameId) return;
    if (state.phase === "entry") return;
    if (state.completionSynced) return;
    if (state.phase === "finished") return;

    const payload = JSON.stringify({
      currentPosition: state.position,
      gameHistory: state.gameHistory,
      chatHistory: toPersistedChat(state),
      playerRequest: state.fixedPlayerRequest ?? state.playerQuery,
    });
    if (payload === lastPayload.current) return;

    if (persistRef.current) clearTimeout(persistRef.current);
    persistRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/games/${state.activeGameId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: payload,
        });
        if (res.ok) lastPayload.current = payload;
      } catch {
        /* network */
      }
    }, 900);

    return () => {
      if (persistRef.current) clearTimeout(persistRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce tracks listed fields, not full state object
  }, [
    state.activeGameId,
    state.phase,
    state.position,
    state.gameHistory,
    state.chatMessages,
    state.fixedPlayerRequest,
    state.playerQuery,
    state.completionSynced,
  ]);

  useEffect(() => {
    if (state.phase !== "finished" || !state.activeGameId || state.completionSynced) {
      if (state.phase !== "finished") completeRef.current = false;
      return;
    }
    if (completeRef.current) return;
    completeRef.current = true;
    const id = state.activeGameId;

    (async () => {
      try {
        const snap = stateRef.current;
        const flushBody = JSON.stringify({
          currentPosition: snap.position,
          gameHistory: snap.gameHistory,
          chatHistory: toPersistedChat(snap),
          playerRequest: snap.fixedPlayerRequest ?? snap.playerQuery,
        });
        await fetch(`/api/games/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: flushBody,
        });
        const res = await fetch(`/api/games/${id}/complete`, {
          method: "POST",
        });
        if (!res.ok) {
          markCompletionSynced();
          return;
        }
        const data = (await res.json()) as {
          finalSummary?: string;
          actionPlan?: string;
        };
        if (data.finalSummary != null && data.actionPlan != null) {
          setCompletionResult(data.finalSummary, data.actionPlan);
        } else {
          markCompletionSynced();
        }
      } catch {
        markCompletionSynced();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- single run guard + stateRef flush
  }, [
    state.phase,
    state.activeGameId,
    state.position,
    state.gameHistory,
    state.chatMessages,
    state.fixedPlayerRequest,
    state.playerQuery,
    state.completionSynced,
    setCompletionResult,
    markCompletionSynced,
  ]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 px-3 py-6 sm:gap-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <header className="flex flex-1 flex-col items-center gap-2 text-center sm:items-start sm:text-left">
          <span className="text-[11px] font-medium uppercase tracking-[0.32em] text-stone-500">
            ЛІЛА · LEELA
          </span>
          <h1 className="font-display text-2xl text-stone-800 sm:text-4xl">Гра Самопізнання</h1>
          <p className="max-w-[min(100%,42rem)] text-xs text-stone-500 sm:text-sm">
            Настільна гра для самопізнання та розвитку через усвідомлені рішення
          </p>
          {state.fixedPlayerRequest && state.phase !== "entry" && (
            <p className="max-w-xl text-sm font-medium leading-snug text-stone-700">
              Запит: {state.fixedPlayerRequest}
            </p>
          )}
        </header>
        <div className="flex shrink-0 justify-end sm:pt-1">
          <AppHeader />
        </div>
      </div>

      {state.phase === "entry" ? (
        <EntryPhase
          state={state}
          onRoll={rollDice}
          onQueryChange={setPlayerQuery}
          onStart={startGame}
          onReset={reset}
          onAppendMessage={appendChatMessage}
        />
      ) : (
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="min-w-0 max-h-[80vh] w-full overflow-auto">
            <GameBoard position={state.position} />
          </div>
          <GamePanel
            state={state}
            onRoll={rollDice}
            onReset={reset}
            onQueryChange={setPlayerQuery}
            onAppendMessage={appendChatMessage}
          />
        </div>
      )}

      <footer className="pb-1 text-center text-[10px] tracking-wide text-stone-400 sm:pb-2 sm:text-[11px]">
        Базується на канонічній дошці 72 клітинок Гариша Джогарі.
      </footer>
    </main>
  );
}

function HomeFallback() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center justify-center gap-2 px-3 py-12">
      <p className="text-sm text-stone-500">Завантаження…</p>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeContent />
    </Suspense>
  );
}
