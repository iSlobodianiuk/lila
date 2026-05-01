"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useSession } from "next-auth/react";
import { AppHeader } from "@/components/app-header";
import { useLeelaGame } from "@/hooks/use-leela-game";
import { toPersistedChat } from "@/lib/serialize-game";
import type { ChatHistoryPersistItem, GameHistoryItem, LoadGameInput } from "@/lib/types";
import { appendMoveForCurrentUser, createGameForCurrentUser } from "@/src/app/actions/game";
import { GameBoard } from "@/src/components/game/GameBoard";
import { EntryPhase } from "@/src/components/game/EntryPhase";
import { GamePanel } from "@/src/components/game/GamePanel";
import { OnboardingFlow } from "@/src/components/onboarding/OnboardingFlow";
import { PreAuthHero } from "@/src/components/onboarding/PreAuthHero";

const ONBOARDING_STORAGE_KEY = "leela-onboarding-v1";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const continueId = searchParams.get("continue");
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [desktopPanelTab, setDesktopPanelTab] = useState<"chat" | "faq">("chat");

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
  } = useLeelaGame({ skipLocalHydrate: Boolean(continueId) });

  const continueLoadRef = useRef(false);
  const completeRef = useRef(false);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      setOnboardingDone(false);
      setOnboardingReady(true);
      return;
    }
    try {
      const saved = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
      setOnboardingDone(saved === "done");
    } catch {
      setOnboardingDone(false);
    } finally {
      setOnboardingReady(true);
    }
  }, [session, status]);

  const completeOnboarding = useCallback(() => {
    try {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "done");
    } catch {
      /* storage unavailable */
    }
    setOnboardingDone(true);
  }, []);

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

    (async () => {
      try {
        const snap = stateRef.current;
        const pr = snap.fixedPlayerRequest ?? snap.playerQuery;
        if (!pr.trim()) return;
        const data = await createGameForCurrentUser({
          playerRequest: pr,
          currentPosition: snap.position,
          gameHistory: snap.gameHistory,
          chatHistory: toPersistedChat(snap),
        });
        if (data.id) {
          setActiveGameId(data.id);
        }
      } catch {
        /* network/action */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- create once when entering play; body uses stateRef
  }, [state.phase, state.hasEntered, state.activeGameId, setActiveGameId]);

  const persistedMovesRef = useRef(0);
  const persistedGameIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!state.activeGameId) return;
    if (persistedGameIdRef.current === state.activeGameId) return;
    persistedGameIdRef.current = state.activeGameId;
    persistedMovesRef.current = state.gameHistory.length;
  }, [state.activeGameId, state.gameHistory.length]);

  useEffect(() => {
    const gameId = state.activeGameId;
    if (!gameId) return;
    if (state.phase === "entry") return;
    if (state.completionSynced) return;
    if (state.phase === "finished") return;
    if (state.gameHistory.length <= persistedMovesRef.current) return;

    const move = state.gameHistory[state.gameHistory.length - 1];
    if (!move) return;

    (async () => {
      try {
        await appendMoveForCurrentUser({
          gameId,
          currentPosition: state.position,
          move,
          chatHistory: toPersistedChat(state),
          playerRequest: state.fixedPlayerRequest ?? state.playerQuery,
        });
        persistedMovesRef.current = state.gameHistory.length;
      } catch {
        /* network/action */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- persist only when a new move is appended
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
        if (persistedMovesRef.current < snap.gameHistory.length) {
          for (let i = persistedMovesRef.current; i < snap.gameHistory.length; i += 1) {
            const move = snap.gameHistory[i];
            if (!move) continue;
            await appendMoveForCurrentUser({
              gameId: id,
              currentPosition: move.cellNumber,
              move,
              chatHistory: i === snap.gameHistory.length - 1 ? toPersistedChat(snap) : undefined,
              playerRequest:
                i === snap.gameHistory.length - 1 ? (snap.fixedPlayerRequest ?? snap.playerQuery) : undefined,
            });
            persistedMovesRef.current = i + 1;
          }
        }
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

  if (status === "loading" || (session && !onboardingReady)) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center justify-center gap-2 px-3 py-12">
        <p className="text-sm text-stone-500">Завантаження…</p>
      </main>
    );
  }

  if (!session) {
    return <PreAuthHero />;
  }

  if (!onboardingDone) {
    return <OnboardingFlow onComplete={completeOnboarding} />;
  }

  return (
    <main className="flex min-h-screen w-full flex-col gap-5 py-6 sm:gap-8 sm:py-8 md:h-[100dvh] md:gap-4 md:overflow-hidden md:py-4">
      <div className="flex w-full flex-col gap-3 px-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-4 md:gap-2 lg:px-5">
        <header className="flex flex-1 flex-col items-center gap-2 text-center sm:items-start sm:text-left md:gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.32em] text-stone-500">
            ЛІЛА · LEELA
          </span>
          <h1 className="font-display text-2xl text-stone-800 sm:text-3xl lg:text-4xl">Гра Ліла онлайн</h1>
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
        <div className="grid min-h-0 flex-1 gap-4 sm:gap-6 md:h-full md:grid-cols-[7fr_3fr] md:items-stretch md:gap-4 lg:grid-cols-[7.2fr_2.8fr]">
          <div className="flex min-h-0 min-w-0 flex-col">
            <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
              <GameBoard position={state.position} />
            </div>
          </div>
          <div className="flex min-h-0 min-w-0 flex-col">
            <div className="mb-3 hidden rounded-2xl border border-white/45 bg-white/60 p-1 shadow-[0_16px_40px_-28px_rgba(120,90,60,0.45)] backdrop-blur-xl md:inline-flex">
              <button
                type="button"
                onClick={() => setDesktopPanelTab("chat")}
                className={`min-h-10 flex-1 rounded-xl px-3 text-sm font-medium transition ${
                  desktopPanelTab === "chat"
                    ? "bg-stone-900 text-stone-50 shadow-sm"
                    : "text-stone-600 hover:bg-white/70 hover:text-stone-800"
                }`}
              >
                Чат
              </button>
              <button
                type="button"
                onClick={() => setDesktopPanelTab("faq")}
                className={`min-h-10 flex-1 rounded-xl px-3 text-sm font-medium transition ${
                  desktopPanelTab === "faq"
                    ? "bg-stone-900 text-stone-50 shadow-sm"
                    : "text-stone-600 hover:bg-white/70 hover:text-stone-800"
                }`}
              >
                FAQ
              </button>
            </div>
            {state.fixedPlayerRequest && (
              <section className="mb-3 rounded-2xl border border-amber-200/70 bg-amber-50/65 px-4 py-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-amber-800/90">
                  Твій запит
                </p>
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-stone-700">{state.fixedPlayerRequest}</p>
              </section>
            )}
            <div className="min-h-0 flex-1">
              <div className={`h-full ${desktopPanelTab === "chat" ? "md:block" : "md:hidden"}`}>
                <GamePanel
                  state={state}
                  onRoll={rollDice}
                  onReset={reset}
                  onQueryChange={setPlayerQuery}
                  onAppendMessage={appendChatMessage}
                />
              </div>
              <section
                className={`hidden h-full rounded-3xl border border-white/45 bg-white/60 p-4 shadow-[0_20px_50px_-30px_rgba(120,90,60,0.32)] backdrop-blur-xl sm:p-6 ${
                  desktopPanelTab === "faq" ? "md:block md:overflow-y-auto" : "md:hidden"
                }`}
              >
                <h2 className="font-display text-2xl text-stone-800 sm:text-3xl">Поширені питання</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-1">
                  <article className="rounded-2xl border border-stone-200/70 bg-white/70 p-3">
                    <h3 className="text-sm font-semibold text-stone-800">Що таке гра Ліла?</h3>
                    <p className="mt-1 text-sm text-stone-600">
                      Це простір для уважного дослідження запиту через гру, діалог і рух по дошці.
                    </p>
                  </article>
                  <article className="rounded-2xl border border-stone-200/70 bg-white/70 p-3">
                    <h3 className="text-sm font-semibold text-stone-800">Навіщо формулювати запит перед входом?</h3>
                    <p className="mt-1 text-sm text-stone-600">
                      Чим точніше й чесніше сформульований запит, тим глибше та ясніше може пройти гра.
                    </p>
                  </article>
                  <article className="rounded-2xl border border-stone-200/70 bg-white/70 p-3">
                    <h3 className="text-sm font-semibold text-stone-800">Що означає, якщо не випадає 6?</h3>
                    <p className="mt-1 text-sm text-stone-600">
                      Це означає, що запит ще уточнюється. Провідник допомагає побачити його ясніше.
                    </p>
                  </article>
                  <article className="rounded-2xl border border-stone-200/70 bg-white/70 p-3">
                    <h3 className="text-sm font-semibold text-stone-800">Що робити під час гри?</h3>
                    <p className="mt-1 text-sm text-stone-600">
                      Слідкуй за ходом, кидай кубик, відповідай на питання провідника і спостерігай за тим, як
                      розкривається твій процес.
                    </p>
                  </article>
                </div>
                <footer className="pt-4 text-center text-[10px] tracking-wide text-stone-400 sm:text-[11px]">
                  Базується на канонічній дошці 72 клітинок Гариша Джогарі.
                </footer>
              </section>
            </div>
          </div>
        </div>
      )}

      {state.phase !== "entry" && (
        <section className="rounded-3xl border border-white/45 bg-white/60 p-4 shadow-[0_20px_50px_-30px_rgba(120,90,60,0.32)] backdrop-blur-xl sm:p-6 md:hidden">
          <h2 className="font-display text-2xl text-stone-800 sm:text-3xl">Поширені питання</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <article className="rounded-2xl border border-stone-200/70 bg-white/70 p-3">
              <h3 className="text-sm font-semibold text-stone-800">Що таке гра Ліла?</h3>
              <p className="mt-1 text-sm text-stone-600">
                Це простір для уважного дослідження запиту через гру, діалог і рух по дошці.
              </p>
            </article>
            <article className="rounded-2xl border border-stone-200/70 bg-white/70 p-3">
              <h3 className="text-sm font-semibold text-stone-800">Навіщо формулювати запит перед входом?</h3>
              <p className="mt-1 text-sm text-stone-600">
                Чим точніше й чесніше сформульований запит, тим глибше та ясніше може пройти гра.
              </p>
            </article>
            <article className="rounded-2xl border border-stone-200/70 bg-white/70 p-3">
              <h3 className="text-sm font-semibold text-stone-800">Що означає, якщо не випадає 6?</h3>
              <p className="mt-1 text-sm text-stone-600">
                Це означає, що запит ще уточнюється. Провідник допомагає побачити його ясніше.
              </p>
            </article>
            <article className="rounded-2xl border border-stone-200/70 bg-white/70 p-3">
              <h3 className="text-sm font-semibold text-stone-800">Що робити під час гри?</h3>
              <p className="mt-1 text-sm text-stone-600">
                Слідкуй за ходом, кидай кубик, відповідай на питання провідника і спостерігай за тим, як
                розкривається твій процес.
              </p>
            </article>
          </div>
        </section>
      )}

      <footer className="pb-1 text-center text-[10px] tracking-wide text-stone-400 sm:pb-2 sm:text-[11px] md:hidden">
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
